"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FiBook, FiBookOpen, FiCheck, FiClock, FiHeart } from 'react-icons/fi'

type ReadingStatus = 'reading' | 'completed' | 'want_to_read' | null

interface BookStatusButtonProps {
  bookId: string
  locale: string
}

export function BookStatusButton({ bookId, locale }: BookStatusButtonProps) {
  const supabase = createClient()
  const [status, setStatus] = useState<ReadingStatus>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const statusLabels = {
    az: {
      reading: 'Oxuyuram',
      completed: 'Oxudum',
      want_to_read: 'Oxumaq istəyirəm',
      add: 'Kitab siyahısına əlavə et',
    },
    en: {
      reading: 'Currently Reading',
      completed: 'Completed',
      want_to_read: 'Want to Read',
      add: 'Add to reading list',
    }
  }

  const labels = statusLabels[locale as keyof typeof statusLabels] || statusLabels.az

  useEffect(() => {
    checkStatus()
  }, [bookId])

  async function checkStatus() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    setUserId(user.id)
    
    const { data } = await supabase
      .from('user_books')
      .select('status')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .single()
    
    setStatus(data?.status || null)
    setLoading(false)
  }

  async function updateStatus(newStatus: ReadingStatus) {
    if (!userId) return
    
    setUpdating(true)
    setShowDropdown(false)
    
    if (newStatus === null) {
      // Remove from list
      await supabase
        .from('user_books')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId)
    } else if (status) {
      // Update existing
      await supabase
        .from('user_books')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('user_id', userId)
        .eq('book_id', bookId)
    } else {
      // Insert new
      await supabase
        .from('user_books')
        .insert({ 
          user_id: userId, 
          book_id: bookId, 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
    }
    
    setStatus(newStatus)
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="h-11 w-44 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
    )
  }

  if (!userId) {
    return null // Not logged in
  }

  const statusConfig = {
    reading: { 
      icon: FiBookOpen, 
      label: labels.reading, 
      className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' 
    },
    completed: { 
      icon: FiCheck, 
      label: labels.completed, 
      className: 'bg-brand/10 text-brand border-brand/30' 
    },
    want_to_read: { 
      icon: FiHeart, 
      label: labels.want_to_read, 
      className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30' 
    },
  }

  const currentConfig = status ? statusConfig[status] : null

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={updating}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium transition-all ${
          currentConfig 
            ? currentConfig.className 
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
        }`}
      >
        {updating ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : currentConfig ? (
          <currentConfig.icon size={18} />
        ) : (
          <FiBook size={18} />
        )}
        <span className="text-sm">
          {currentConfig ? currentConfig.label : labels.add}
        </span>
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg z-50 overflow-hidden">
            {(['want_to_read', 'reading', 'completed'] as const).map((s) => {
              const config = statusConfig[s]
              const isActive = status === s
              return (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                    isActive 
                      ? 'bg-brand/10 text-brand font-medium' 
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <config.icon size={16} />
                  {config.label}
                  {isActive && <FiCheck className="ml-auto" size={16} />}
                </button>
              )
            })}
            
            {status && (
              <>
                <div className="border-t border-neutral-100 dark:border-neutral-800" />
                <button
                  onClick={() => updateStatus(null)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Siyahıdan sil
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
