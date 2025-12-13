"use client"
import { useEffect, useRef } from 'react'
import { FiAlertTriangle, FiX } from 'react-icons/fi'

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onCancel])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      button: 'bg-red-500 hover:bg-red-600 text-white',
      iconBg: 'bg-red-500/10'
    },
    warning: {
      icon: 'text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
      iconBg: 'bg-amber-500/10'
    },
    default: {
      icon: 'text-brand',
      button: 'bg-brand hover:bg-brand/90 text-white',
      iconBg: 'bg-brand/10'
    }
  }

  const styles = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      
      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
        >
          <FiX size={18} />
        </button>

        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg}`}>
          <FiAlertTriangle size={24} className={styles.icon} />
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {message}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${styles.button}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
