"use client"
import { useRouter } from 'next/navigation'
import { FiArrowLeft } from 'react-icons/fi'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'

export function BackButton() {
  const router = useRouter()
  const locale = useLocale()

  return (
    <button 
      onClick={() => router.back()}
      className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-brand transition-colors mb-6 dark:text-neutral-400 dark:hover:text-brand"
    >
      <FiArrowLeft size={16} />
      <span>{t(locale, 'go_back') || 'Geri Qayıt'}</span>
    </button>
  )
}
