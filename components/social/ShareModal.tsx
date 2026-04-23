"use client"

import { useEffect, useCallback } from 'react'
import { FiX, FiLink, FiCheck } from 'react-icons/fi'
import { FaXTwitter, FaTelegram, FaWhatsapp, FaFacebookF } from 'react-icons/fa6'
import { useState } from 'react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  excerpt?: string
}

const PLATFORM_SIZE = 48

export function ShareModal({ isOpen, onClose, url, excerpt = '' }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const shortExcerpt = excerpt.slice(0, 100) + (excerpt.length > 100 ? '...' : '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const platforms = [
    {
      name: 'X',
      icon: FaXTwitter,
      color: '#000000',
      darkColor: '#ffffff',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortExcerpt)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      color: '#0088cc',
      darkColor: '#0088cc',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shortExcerpt)}`,
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: '#25D366',
      darkColor: '#25D366',
      href: `https://wa.me/?text=${encodeURIComponent(shortExcerpt + ' ' + url)}`,
    },
    {
      name: 'Facebook',
      icon: FaFacebookF,
      color: '#1877F2',
      darkColor: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm mx-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Paylaş</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            aria-label="Bağla"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Platforms */}
        <div className="px-5 py-6">
          <div className="flex items-center justify-center gap-4">
            {platforms.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
                title={p.name}
              >
                <span
                  className="flex items-center justify-center rounded-full text-white shadow-md transition-transform group-hover:scale-110"
                  style={{
                    width: PLATFORM_SIZE,
                    height: PLATFORM_SIZE,
                    backgroundColor: p.color,
                  }}
                >
                  <p.icon size={22} />
                </span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">{p.name}</span>
              </a>
            ))}

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="flex flex-col items-center gap-2 group"
              title="Linki kopyala"
            >
              <span
                className={`flex items-center justify-center rounded-full text-white shadow-md transition-transform group-hover:scale-110 ${
                  copied ? 'bg-brand' : 'bg-neutral-700 dark:bg-neutral-600'
                }`}
                style={{ width: PLATFORM_SIZE, height: PLATFORM_SIZE }}
              >
                {copied ? <FiCheck size={22} /> : <FiLink size={22} />}
              </span>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                {copied ? 'Kopyalandı' : 'Link'}
              </span>
            </button>
          </div>
        </div>

        {/* URL bar */}
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2.5">
            <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate select-all">
              {url}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-sm font-semibold text-brand hover:text-brand/80 transition-colors px-2 py-1"
            >
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
