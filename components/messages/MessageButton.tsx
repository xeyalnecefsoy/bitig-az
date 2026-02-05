'use client'

import { useState } from 'react'
import { FiMessageSquare } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/context/locale'
import { t, type Locale } from '@/lib/i18n'

export function MessageButton({ userId, className }: { userId: string, className?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const locale = useLocale()

  function handleClick() {
    setLoading(true)
    // Navigate directly to messages with userId - the page will handle creating/finding the conversation
    router.push(`/${locale}/messages?userId=${userId}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-full font-medium transition-colors ${className}`}
    >
      <FiMessageSquare />
      {loading ? '...' : t(locale as Locale, 'dm_message_button')}
    </button>
  )
}
