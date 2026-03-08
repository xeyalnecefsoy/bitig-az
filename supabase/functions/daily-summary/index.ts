import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    // Only accept POST requests, which is standard for Cron invocations in Supabase
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Missing Telegram configuration");
      return new Response("Configuration error", { status: 500 });
    }

    // ============================================================
    // 0. Əvvəlcə avtomatik təmizlik: 30+ gün rejected olan məzmunları sil
    // ============================================================
    const CLEANUP_DAYS = 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    let autoDeletedPosts = 0;
    let autoDeletedComments = 0;
    let autoDeletedImages = 0;

    // Rejected posts (30+ gün)
    const { data: rejectedPosts } = await supabase
      .from('posts')
      .select('id, image_urls')
      .eq('status', 'rejected')
      .lt('rejected_at', cutoffISO);

    if (rejectedPosts && rejectedPosts.length > 0) {
      // Şəkilləri storage-dən sil
      for (const post of rejectedPosts) {
        if (post.image_urls && Array.isArray(post.image_urls) && post.image_urls.length > 0) {
          const filePaths: string[] = [];
          for (const url of post.image_urls) {
            const match = url.match(/post-images\/(.+)$/);
            if (match) filePaths.push(match[1]);
          }
          if (filePaths.length > 0) {
            const { error: storageErr } = await supabase.storage.from('post-images').remove(filePaths);
            if (!storageErr) autoDeletedImages += filePaths.length;
          }
        }
      }

      const postIds = rejectedPosts.map(p => p.id);

      // Audit log
      await supabase.from('ai_moderation_logs').insert(
        postIds.map(id => ({
          entity_id: id,
          entity_type: 'post',
          action: 'auto_deleted',
          reason: `Avtomatik silinmə: ${CLEANUP_DAYS} gündən çox rejected statusunda qalıb`
        }))
      );

      const { error: delErr } = await supabase.from('posts').delete().in('id', postIds);
      if (!delErr) autoDeletedPosts = postIds.length;
    }

    // Rejected comments (30+ gün)
    const { data: rejectedComments } = await supabase
      .from('comments')
      .select('id')
      .eq('status', 'rejected')
      .lt('rejected_at', cutoffISO);

    if (rejectedComments && rejectedComments.length > 0) {
      const commentIds = rejectedComments.map(c => c.id);

      await supabase.from('ai_moderation_logs').insert(
        commentIds.map(id => ({
          entity_id: id,
          entity_type: 'comment',
          action: 'auto_deleted',
          reason: `Avtomatik silinmə: ${CLEANUP_DAYS} gündən çox rejected statusunda qalıb`
        }))
      );

      const { error: delErr } = await supabase.from('comments').delete().in('id', commentIds);
      if (!delErr) autoDeletedComments = commentIds.length;
    }

    const totalAutoDeleted = autoDeletedPosts + autoDeletedComments;
    console.log(`Cleanup completed: ${totalAutoDeleted} items deleted (${autoDeletedPosts} posts, ${autoDeletedComments} comments, ${autoDeletedImages} images)`);

    // ============================================================
    // 1. Ümumi statistika topla (son 24 saat)
    // ============================================================

    // Get time from exactly 24 hours ago
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString();

    // 1. Fetch new users in last 24h
    const { count: newUsers, error: usersErr } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayISO);

    // 2. Fetch new posts in last 24h
    const { count: newPosts, error: postsErr } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayISO);

    // 3. Fetch AI Moderation stats in last 24h
    const { data: logs, error: logsErr } = await supabase
      .from('ai_moderation_logs')
      .select('action')
      .gte('created_at', yesterdayISO);

    if (usersErr || postsErr || logsErr) {
      console.error("Database error", { usersErr, postsErr, logsErr });
      return new Response("Database fetch error", { status: 500 });
    }

    let flaggedCount = 0;
    let approvedCount = 0;

    if (logs) {
      flaggedCount = logs.filter(l => l.action === 'flagged').length;
      // Depending on whether default approvals get logged, this might be all actions or just errors
      approvedCount = logs.filter(l => l.action === 'approved').length; 
    }

    // Prepare message with cleanup section
    const cleanupSection = totalAutoDeleted > 0 
      ? `\n🗑 *Avtomatik Təmizlik (30+ gün):*\n📄 Silinən Paylaşımlar: ${autoDeletedPosts}\n💬 Silinən Şərhlər: ${autoDeletedComments}\n🖼 Silinən Şəkillər: ${autoDeletedImages}\n`
      : `\n🗑 *Avtomatik Təmizlik:* Silinəcək məzmun yoxdur ✓\n`;

    // Prepare message
    const message = `
📊 *Bitig.az Göndəlik Xülasə* (Son 24 saat)

👥 *Yeni İstifadəçilər:* ${newUsers || 0}
📝 *Yeni Paylaşımlar:* ${newPosts || 0}

🤖 *Süni İntellekt İdarəetməsi:*
✅ Avtomatik Təsdiqlənən: ${approvedCount}
⚠️ Şübhəli Tapılan (Müdaxilə Gözləyir): ${flaggedCount}
${cleanupSection}
Bütün sistemlər normal işləyir. Şübhəli məzmunları nəzərdən keçirmək üçün Admin panelə daxil olun.
`.trim();

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram API error:", errorText);
      throw new Error("Failed to send Telegram message");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error generating daily summary:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
});
