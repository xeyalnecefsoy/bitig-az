"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiAlertTriangle, FiX } from 'react-icons/fi'
import { t } from '@/lib/i18n'
import { useLocale } from '@/context/locale'
import { Alert } from '@/components/ui/Alert'

type ReportModalProps = {
  targetId: string
  targetType: 'post' | 'user' | 'comment'
  onClose: () => void
}

export function ReportModal({ targetId, targetType, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ message: string, type: 'error' | 'success' } | null>(null)
  const locale = useLocale()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAlert({ message: t(locale, 'login_required_report'), type: 'error' })
      setLoading(false)
      return
    }

    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_id: targetId,
      target_type: targetType,
      reason,
    })

    if (error) {
      setAlert({ message: t(locale, 'report_failed') + ': ' + error.message, type: 'error' })
      setLoading(false)
    } else {
      setAlert({ message: t(locale, 'report_success'), type: 'success' })
      setLoading(false)
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600">
            <FiAlertTriangle /> {t(locale, 'report_' + targetType)}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <FiX size={20} />
          </button>
        </div>

        {alert && (
           <div className="mb-4">
             <Alert type={alert.type as any} message={alert.message} />
           </div>
        )}

        {!alert || alert.type === 'error' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t(locale, 'report_reason')}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="">{t(locale, 'report_select_reason')}</option>
              <option value="spam">{t(locale, 'reason_spam')}</option>
              <option value="harassment">{t(locale, 'reason_harassment')}</option>
              <option value="inappropriate">{t(locale, 'reason_inappropriate')}</option>
              <option value="violence">{t(locale, 'reason_violence')}</option>
              <option value="other">{t(locale, 'reason_other')}</option>
            </select>
          </div>

          {reason === 'other' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t(locale, 'report_details')}
              </label>
              <textarea
                required
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                rows={3}
                placeholder={t(locale, 'report_details_placeholder')}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              {t(locale, 'cancel_btn')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? t(locale, 'report_submitting') : t(locale, 'report_submit')}
            </button>
          </div>
        </form>
        ) : null}
      </div>
    </div>
  )
}
