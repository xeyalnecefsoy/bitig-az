"use client"
import { useState } from 'react'
import { useSocial } from '@/context/social'
import { FiSend } from 'react-icons/fi'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'

export function SocialComposer() {
  const locale = useLocale()
  const { createPost, currentUser, loading } = useSocial()
  const [value, setValue] = useState('')

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="card p-4 sm:p-5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="card p-4 sm:p-5 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{t(locale, 'social_sign_in_prompt')}</p>
        <a href={`/${locale}/login`} className="btn btn-primary text-sm">{t(locale, 'sign_in')}</a>
      </div>
    )
  }

  return (
    <form
      className="card p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault()
        const text = value.trim()
        if (!text) return
        createPost(text)
        setValue('')
      }}
    >
      <label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">{t(locale, 'social_share_label')}</label>
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t(locale, 'social_write_placeholder')}
          rows={3}
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm resize-none bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-700 placeholder-neutral-400 dark:placeholder-neutral-400"
        />
        <button className="btn btn-primary h-fit px-4 text-sm inline-flex items-center gap-2"><FiSend /> {t(locale, 'social_post_button')}</button>
      </div>
    </form>
  )
}
