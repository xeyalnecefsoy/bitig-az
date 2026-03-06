"use client"
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { t, type Locale } from '@/lib/i18n'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FiCheck, FiX, FiAlertTriangle, FiMessageSquare, FiFileText, FiClock } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { az, enUS } from 'date-fns/locale'
import { ConfirmModal } from '@/components/messages/ConfirmModal'

type ModerationLog = {
  id: string
  entity_id: string
  entity_type: 'post' | 'comment'
  action: 'flagged' | 'approved' | 'rejected' | 'deleted' | 'error'
  reason: string | null
  confidence: number
  created_at: string
}

type FlaggedEntity = {
  id: string
  content: string
  user_id: string
  profiles?: {
    username: string
    avatar_url: string | null
  }
}

export default function ModerationPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || 'az'
  const supabase = createClient()
  
  const [logs, setLogs] = useState<(ModerationLog & { entity?: FlaggedEntity })[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<{logId: string, entityId: string, entityType: 'post' | 'comment', action: 'approved' | 'rejected' | 'deleted'} | null>(null)
  const [selectedLog, setSelectedLog] = useState<(ModerationLog & { entity?: FlaggedEntity }) | null>(null)

  useEffect(() => {
    fetchFlaggedContent()

    // Set up Realtime subscription to get incoming flagged content instantly
    const channel = supabase
      .channel('moderation_logs_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_moderation_logs' },
        (payload) => {
          console.log('Moderation logs changed:', payload)
          // Re-fetch the content to show the newest one
          fetchFlaggedContent()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  async function fetchFlaggedContent() {
    try {
      setLoading(true)
      
      // 1. Fetch recent moderation logs where action is 'flagged'
      const { data: modLogs, error: logError } = await supabase
        .from('ai_moderation_logs')
        .select('*')
        .eq('action', 'flagged')
        .order('created_at', { ascending: false })
        .limit(50)

      if (logError) throw logError
      if (!modLogs || modLogs.length === 0) {
        setLogs([])
        return
      }

      // 2. Fetch the actual content for these logs
      const postIds = modLogs.filter(l => l.entity_type === 'post').map(l => l.entity_id)
      const commentIds = modLogs.filter(l => l.entity_type === 'comment').map(l => l.entity_id)

      let posts: FlaggedEntity[] = []
      let comments: FlaggedEntity[] = []

      if (postIds.length > 0) {
        const { data: p } = await supabase
          .from('posts')
          .select('id, content, user_id, profiles(username, avatar_url)')
          .in('id', postIds)
          // Also only get ones that are actually still flagged in DB 
          .eq('status', 'flagged')
        if (p) posts = p as unknown as FlaggedEntity[]
      }

      if (commentIds.length > 0) {
        const { data: c } = await supabase
          .from('comments')
          .select('id, content, user_id, profiles(username, avatar_url)')
          .in('id', commentIds)
          .eq('status', 'flagged')
        if (c) comments = c as unknown as FlaggedEntity[]
      }

      // 3. Combine them
      const combined = modLogs.map(log => {
        const entity = log.entity_type === 'post' 
          ? posts.find(p => p.id === log.entity_id)
          : comments.find(c => c.id === log.entity_id)
        
        return {
          ...log,
          entity
        }
      }).filter(log => log.entity) // Only keep logs where the entity is still flagged and exists

      setLogs(combined)

    } catch (err) {
      console.error('Error fetching flagged content:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleModerationClick(logId: string, entityId: string, entityType: 'post' | 'comment', newStatus: 'approved' | 'rejected' | 'deleted') {
    setConfirmAction({ logId, entityId, entityType, action: newStatus })
  }

  async function executeModeration() {
    if (!confirmAction) return
    const { logId, entityId, entityType, action: newStatus } = confirmAction
    
    try {
      setProcessingId(logId)

      // Use our new RPC function to safely moderate
      const { error } = await supabase.rpc('moderate_content', {
        p_entity_id: entityId,
        p_entity_type: entityType,
        p_new_status: newStatus
      })

      if (error) throw error

      // Remove from list
      setLogs(prev => prev.filter(l => l.id !== logId))

    } catch (err: any) {
      console.error('Moderation error:', err)
      alert(newStatus === 'approved' ? t(locale, 'admin_mod_error_approve') : t(locale, 'admin_mod_error_reject') + err.message)
    } finally {
      setProcessingId(null)
      setConfirmAction(null)
    }
  }

  const dateLocale = locale === 'az' ? az : enUS

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
          <FiAlertTriangle className="text-red-500" />
          {t(locale, 'admin_moderation')}
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          {t(locale, 'admin_moderation_desc')}
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-500">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
             {t(locale, 'admin_loading')}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center">
            <FiCheck className="text-4xl text-green-500 mb-4" />
            <p className="text-lg font-medium text-neutral-900 dark:text-white">{t(locale, 'admin_mod_no_content')}</p>
            <p className="mt-1">{t(locale, 'admin_mod_all_clear')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
              <thead className="bg-neutral-50 dark:bg-neutral-950/50 text-neutral-900 dark:text-white font-medium border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-6 py-4 w-32">{t(locale, 'admin_mod_entity')}</th>
                  <th className="px-6 py-4 min-w-[250px] w-1/3">{t(locale, 'admin_mod_content')}</th>
                  <th className="px-6 py-4 min-w-[200px] w-1/3">{t(locale, 'admin_mod_reason')}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{t(locale, 'admin_mod_date')}</th>
                  <th className="px-6 py-4 text-right">{t(locale, 'admin_mod_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {log.entity_type === 'post' ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium text-xs">
                            <FiFileText /> {t(locale, 'admin_mod_post')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-medium text-xs">
                            <FiMessageSquare /> {t(locale, 'admin_mod_comment')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.entity?.profiles && (
                        <div className="flex items-center gap-2 mb-2">
                          <img 
                            src={log.entity.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${log.entity.user_id}`} 
                            alt={log.entity.profiles.username}
                            className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800"
                          />
                          <span className="font-medium text-neutral-900 dark:text-white">
                            @{log.entity.profiles.username}
                          </span>
                        </div>
                      )}
                      <p 
                        className="text-neutral-700 dark:text-neutral-300 line-clamp-3 cursor-pointer hover:text-brand transition-colors"
                        onClick={() => setSelectedLog(log)}
                        title={t(locale, 'admin_mod_view_details')}
                      >
                        {log.entity?.content}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 max-w-[300px]">
                        <span 
                          className="text-red-600 dark:text-red-400 font-medium line-clamp-3 leading-snug cursor-pointer hover:underline" 
                          onClick={() => setSelectedLog(log)}
                          title={t(locale, 'admin_mod_view_details')}
                        >
                          {log.reason || 'Unknown'}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <span>{t(locale, 'admin_mod_confidence')}:</span>
                          <span className={log.confidence > 80 ? 'text-red-500 font-bold' : log.confidence > 50 ? 'text-orange-500 font-bold' : ''}>
                            {log.confidence}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <FiClock />
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: dateLocale })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleModerationClick(log.id, log.entity_id, log.entity_type, 'approved')}
                          disabled={processingId === log.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 border border-green-200 dark:border-green-900/50"
                        >
                          <FiCheck size={16} />
                          {t(locale, 'admin_mod_approve')}
                        </button>
                        <button
                          onClick={() => handleModerationClick(log.id, log.entity_id, log.entity_type, 'rejected')}
                          disabled={processingId === log.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors disabled:opacity-50 border border-orange-200 dark:border-orange-900/50"
                        >
                          <FiX size={16} />
                          {t(locale, 'admin_mod_reject')}
                        </button>
                        <button
                          onClick={() => handleModerationClick(log.id, log.entity_id, log.entity_type, 'deleted')}
                          disabled={processingId === log.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 border border-red-200 dark:border-red-900/50"
                        >
                          <FiX size={16} />
                          {t(locale, 'admin_mod_delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeModeration}
        title={
          confirmAction?.action === 'approved' ? t(locale, 'admin_mod_confirm_approve_title') :
          confirmAction?.action === 'rejected' ? t(locale, 'admin_mod_confirm_reject_title') :
          t(locale, 'admin_mod_confirm_delete_title')
        }
        message={
          confirmAction?.action === 'approved' ? t(locale, 'admin_mod_confirm_approve_msg') :
          confirmAction?.action === 'rejected' ? t(locale, 'admin_mod_confirm_reject_msg') :
          t(locale, 'admin_mod_confirm_delete_msg')
        }
        isDestructive={confirmAction?.action === 'deleted' || confirmAction?.action === 'rejected'}
        isLoading={processingId !== null}
      />

      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                {t(locale, 'admin_mod_view_details')}
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 p-2 rounded-full transition-colors"
                aria-label={t(locale, 'admin_mod_close')}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">{t(locale, 'admin_mod_reason')}</h4>
                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-xl leading-relaxed text-sm font-medium">
                  {selectedLog.reason}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">{t(locale, 'admin_mod_content')}</h4>
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 rounded-xl whitespace-pre-wrap leading-relaxed text-sm">
                  {selectedLog.entity?.content}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-950/50">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                {t(locale, 'admin_mod_close')}
              </button>
              {selectedLog.entity_type === 'post' && (
                <Link
                  href={`/${locale}/social/post/${selectedLog.entity_id}`}
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand/90 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FiMessageSquare /> {t(locale, 'admin_mod_goto_post')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
