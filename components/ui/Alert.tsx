import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi'

interface AlertProps {
  type: 'error' | 'success' | 'info'
  message: string
  onClose?: () => void
}

export function Alert({ type, message, onClose }: AlertProps) {
  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900',
    success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900'
  }

  const icons = {
    error: <FiAlertCircle size={18} />,
    success: <FiCheckCircle size={18} />,
    info: <FiInfo size={18} />
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border mb-4 animate-in fade-in slide-in-from-top-1 ${styles[type]}`}>
      <span className="shrink-0 mt-0.5">{icons[type]}</span>
      <p className="flex-1 text-sm">{message}</p>
      {onClose && (
        <button 
          onClick={onClose}
          className="shrink-0 p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors"
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  )
}
