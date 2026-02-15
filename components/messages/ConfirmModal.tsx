'use client'

import { FiAlertTriangle } from 'react-icons/fi'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = false,
  isLoading = false
}: ConfirmModalProps) {
  const locale = useLocale()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isDestructive ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-brand/10 text-brand'}`}>
              <FiAlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                {title}
              </h3>
            </div>
          </div>
          
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              {cancelText || t(locale as Locale, 'cancel') || 'Cancel'}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm flex items-center gap-2 ${
                isDestructive 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-brand hover:bg-brand/90'
              } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {confirmText || t(locale as Locale, 'confirm') || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
