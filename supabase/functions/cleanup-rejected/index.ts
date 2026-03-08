import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 30 gün millisaniyə ilə
const CLEANUP_DAYS = 30;

serve(async (req) => {
  try {
    // Only accept POST requests (standard for Cron/scheduled invocations)
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // 30 gün əvvəlki tarix
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    // ============================================================
    // 1. Rejected POSTS-ları tap (30+ gün əvvəl reject edilmiş)
    // ============================================================
    const { data: rejectedPosts, error: postsErr } = await supabase
      .from('posts')
      .select('id, image_urls, user_id, content')
      .eq('status', 'rejected')
      .lt('rejected_at', cutoffISO);

    if (postsErr) {
      console.error("Error fetching rejected posts:", postsErr);
      throw postsErr;
    }

    let deletedPostsCount = 0;
    let deletedCommentsCount = 0;
    let deletedImagesCount = 0;

    if (rejectedPosts && rejectedPosts.length > 0) {
      // Şəkilləri storage-dən sil
      for (const post of rejectedPosts) {
        if (post.image_urls && Array.isArray(post.image_urls) && post.image_urls.length > 0) {
          // image_urls Supabase Storage URL-ləri ehtiva edir
          // Storage path-ı URL-dən extract etmək lazımdır
          const filePaths: string[] = [];
          for (const url of post.image_urls) {
            // URL format: .../storage/v1/object/public/post-images/userId/filename
            const match = url.match(/post-images\/(.+)$/);
            if (match) {
              filePaths.push(match[1]);
            }
          }
          
          if (filePaths.length > 0) {
            const { error: storageErr } = await supabase.storage
              .from('post-images')
              .remove(filePaths);

            if (storageErr) {
              console.error(`Error deleting images for post ${post.id}:`, storageErr);
            } else {
              deletedImagesCount += filePaths.length;
            }
          }
        }
      }

      const postIds = rejectedPosts.map(p => p.id);

      // Audit log əlavə et (silmədən əvvəl)
      const auditLogs = postIds.map(id => ({
        entity_id: id,
        entity_type: 'post',
        action: 'auto_deleted',
        reason: `Avtomatik silinmə: ${CLEANUP_DAYS} gündən çox rejected statusunda qalıb`
      }));

      const { error: logErr } = await supabase
        .from('ai_moderation_logs')
        .insert(auditLogs);
      
      if (logErr) {
        console.error("Error inserting audit logs for posts:", logErr);
      }

      // Postları sil (cascade ilə likes, comments də silinə bilər - DB constraint-indən asılıdır)
      const { error: deleteErr } = await supabase
        .from('posts')
        .delete()
        .in('id', postIds);

      if (deleteErr) {
        console.error("Error deleting rejected posts:", deleteErr);
      } else {
        deletedPostsCount = postIds.length;
      }
    }

    // ============================================================
    // 2. Rejected COMMENTS-ları tap (30+ gün əvvəl reject edilmiş)
    // ============================================================
    const { data: rejectedComments, error: commentsErr } = await supabase
      .from('comments')
      .select('id, user_id, content')
      .eq('status', 'rejected')
      .lt('rejected_at', cutoffISO);

    if (commentsErr) {
      console.error("Error fetching rejected comments:", commentsErr);
      throw commentsErr;
    }

    if (rejectedComments && rejectedComments.length > 0) {
      const commentIds = rejectedComments.map(c => c.id);

      // Audit log əlavə et
      const auditLogs = commentIds.map(id => ({
        entity_id: id,
        entity_type: 'comment',
        action: 'auto_deleted',
        reason: `Avtomatik silinmə: ${CLEANUP_DAYS} gündən çox rejected statusunda qalıb`
      }));

      const { error: logErr } = await supabase
        .from('ai_moderation_logs')
        .insert(auditLogs);
      
      if (logErr) {
        console.error("Error inserting audit logs for comments:", logErr);
      }

      // Şərhləri sil
      const { error: deleteErr } = await supabase
        .from('comments')
        .delete()
        .in('id', commentIds);

      if (deleteErr) {
        console.error("Error deleting rejected comments:", deleteErr);
      } else {
        deletedCommentsCount = commentIds.length;
      }
    }

    // ============================================================
    // 3. Nəticəni hazırla
    // ============================================================
    const totalDeleted = deletedPostsCount + deletedCommentsCount;
    
    const result = {
      success: true,
      deleted_posts: deletedPostsCount,
      deleted_comments: deletedCommentsCount,
      deleted_images: deletedImagesCount,
      total_deleted: totalDeleted,
      cutoff_date: cutoffISO
    };

    console.log("Cleanup completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in cleanup-rejected:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});
