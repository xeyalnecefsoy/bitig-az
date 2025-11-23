"use client"
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiAlertTriangle, FiX } from 'react-icons/fi'

type ReportModalProps = {
  targetId: string
  targetType: 'post' | 'user'
  onClose: () => void
}

export function ReportModal({ targetId, targetType, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be logged in to report.')
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
      alert('Failed to submit report: ' + error.message)
    } else {
      alert('Report submitted. Thank you for helping keep our community safe.')
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600">
            <FiAlertTriangle /> Report {targetType}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Reason for reporting
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="">Select a reason</option>
              <option value="spam">Spam or misleading</option>
              <option value="harassment">Harassment or hate speech</option>
              <option value="inappropriate">Inappropriate content</option>
              <option value="violence">Violence or illegal activity</option>
              <option value="other">Other</option>
            </select>
          </div>

          {reason === 'other' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Details
              </label>
              <textarea
                required
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                rows={3}
                placeholder="Please provide more details..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
