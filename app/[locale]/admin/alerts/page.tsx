"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'
import { ConfirmModal } from '@/components/messages/ConfirmModal'
import { Alert } from '@/components/ui/Alert'

type SystemAlert = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'maintenance' | 'brand'
  is_active: boolean
  created_at: string
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingMode, setIsAddingMode] = useState(false)
  
  // New alert form state
  const [newTitle, setNewTitle] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newType, setNewType] = useState<'info' | 'warning' | 'error' | 'maintenance' | 'brand'>('brand')
  const [newIsActive, setNewIsActive] = useState(true)

  // Feedback and Modal state
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [alertToDelete, setAlertToDelete] = useState<string | null>(null)

  const pathname = usePathname()
  const locale = (pathname.split('/')[1] || 'en') as Locale
  const supabase = createClient()

  useEffect(() => {
    loadAlerts()
  }, [])

  async function loadAlerts() {
    setLoading(true)
    const { data } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) {
      setAlerts(data)
    }
    setLoading(false)
  }

  async function handleAddAlert(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || !newMessage.trim()) return

    const newAlert = {
      title: newTitle,
      message: newMessage,
      type: newType,
      is_active: newIsActive
    }

    const { data, error } = await supabase
      .from('system_alerts')
      .insert(newAlert)
      .select()
      .single()

    if (error) {
      setErrorMsg(t(locale, 'admin_alerts_error_add') + ' ' + error.message)
      setSuccessMsg(null)
    } else if (data) {
      setAlerts([data, ...alerts])
      setIsAddingMode(false)
      setNewTitle('')
      setNewMessage('')
      setNewType('brand')
      setNewIsActive(true)
      setErrorMsg(null)
    }
  }

  async function toggleActive(alertId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('system_alerts')
      .update({ is_active: !currentStatus })
      .eq('id', alertId)

    if (error) {
      setErrorMsg(t(locale, 'admin_alerts_error_update') + ' ' + error.message)
      setSuccessMsg(null)
    } else {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_active: !currentStatus } : a))
      setErrorMsg(null)
    }
  }

  function confirmDelete(alertId: string) {
    setAlertToDelete(alertId)
    setIsDeleteModalOpen(true)
  }

  async function executeDelete() {
    if (!alertToDelete) return

    const { error } = await supabase
      .from('system_alerts')
      .delete()
      .eq('id', alertToDelete)

    if (error) {
      setErrorMsg(t(locale, 'admin_alerts_error_delete') + ' ' + error.message)
      setSuccessMsg(null)
    } else {
      setAlerts(alerts.filter(a => a.id !== alertToDelete))
      setErrorMsg(null)
    }
    setIsDeleteModalOpen(false)
    setAlertToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'admin_alerts')}</h1>
        <button
          onClick={() => setIsAddingMode(!isAddingMode)}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors"
        >
          {isAddingMode ? <FiX /> : <FiPlus />}
          {isAddingMode ? t(locale, 'cancel') : t(locale, 'admin_alerts_new')}
        </button>
      </div>

      {errorMsg && (
        <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}
      {successMsg && (
        <Alert type="success" message={successMsg} onClose={() => setSuccessMsg(null)} />
      )}

      {isAddingMode && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">{t(locale, 'admin_alerts_create')}</h2>
          <form onSubmit={handleAddAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'admin_alerts_title_label')}</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                placeholder={t(locale, 'admin_alerts_title_ph')}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'admin_alerts_msg_label')}</label>
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                required
                rows={3}
                placeholder={t(locale, 'admin_alerts_msg_ph')}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'admin_alerts_type_label')}</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="info">{t(locale, 'admin_alerts_type_info')}</option>
                  <option value="warning">{t(locale, 'admin_alerts_type_warning')}</option>
                  <option value="error">{t(locale, 'admin_alerts_type_error')}</option>
                  <option value="maintenance">{t(locale, 'admin_alerts_type_maintenance')}</option>
                  <option value="brand">{t(locale, 'admin_alerts_type_brand')}</option>
                </select>
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsActive}
                    onChange={e => setNewIsActive(e.target.checked)}
                    className="rounded border-neutral-300 text-brand focus:ring-brand"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_alerts_publish_now')}</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors"
              >
                {t(locale, 'admin_alerts_save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="px-6 py-3 font-medium">{t(locale, 'admin_alerts_status')}</th>
                <th className="px-6 py-3 font-medium">{t(locale, 'admin_alerts_type')}</th>
                <th className="px-6 py-3 font-medium">{t(locale, 'admin_alerts_title_msg')}</th>
                <th className="px-6 py-3 font-medium">{t(locale, 'admin_alerts_date')}</th>
                <th className="px-6 py-3 font-medium text-right">{t(locale, 'admin_alerts_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">{t(locale, 'admin_alerts_loading')}</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">{t(locale, 'admin_alerts_empty')}</td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${!alert.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleActive(alert.id, alert.is_active)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          alert.is_active 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {alert.is_active ? <FiCheck size={14} /> : <FiX size={14} />}
                        {alert.is_active ? t(locale, 'admin_alerts_active') : t(locale, 'admin_alerts_inactive')}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium capitalize
                        ${alert.type === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                        ${alert.type === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                        ${alert.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                        ${alert.type === 'maintenance' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                        ${alert.type === 'brand' ? 'bg-brand/10 text-brand' : ''}
                      `}>
                        {t(locale, `admin_alerts_type_${alert.type}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="font-semibold text-neutral-900 dark:text-white truncate">{alert.title}</div>
                      <div className="text-neutral-500 dark:text-neutral-400 truncate mt-0.5" title={alert.message}>{alert.message}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                      {new Date(alert.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => confirmDelete(alert.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Delete alert"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title={t(locale, 'admin_alerts')}
        message={t(locale, 'admin_alerts_delete_confirm')}
        confirmText={t(locale, 'confirm_btn')}
        isDestructive={true}
      />
    </div>
  )
}
