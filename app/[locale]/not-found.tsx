import Link from 'next/link'
import { FiAlertTriangle } from 'react-icons/fi'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6 text-neutral-400">
        <FiAlertTriangle size={32} />
      </div>
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
        Page Not Found
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 max-w-md mb-8">
        The page or user profile you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        href="/"
        className="btn btn-primary px-6"
      >
        Return Home
      </Link>
    </div>
  )
}
