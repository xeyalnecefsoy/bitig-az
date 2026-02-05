"use client"
import { useState, useMemo } from 'react'
import { useSocial } from '@/context/social'
import { FiSend, FiAlertCircle, FiCheckCircle, FiPaperclip, FiX, FiBook } from 'react-icons/fi'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import * as Popover from '@radix-ui/react-popover'
import { createClient } from '@/lib/supabase/client'
import { useDebounce } from 'use-debounce'
import { Skeleton } from '@/components/ui/Skeleton'

// Content quality constants
const MIN_CHARS = 20
const MAX_EMOJI = 5

// Emoji regex pattern (covers most common emojis)
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu

function countEmojis(text: string): number {
  const matches = text.match(EMOJI_REGEX)
  return matches ? matches.length : 0
}

export function SocialComposer({ groupId }: { groupId?: string }) {
  const locale = useLocale()
  const { createPost, currentUser, loading } = useSocial()
  const [value, setValue] = useState('')
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  // Validation state
  const validation = useMemo(() => {
    const charCount = value.trim().length
    const emojiCount = countEmojis(value)
    const charsNeeded = MIN_CHARS - charCount
    const isCharValid = charCount >= MIN_CHARS
    const isEmojiValid = emojiCount <= MAX_EMOJI
    const isValid = isCharValid && isEmojiValid

    return {
      charCount,
      emojiCount,
      charsNeeded,
      isCharValid,
      isEmojiValid,
      isValid,
    }
  }, [value])

  useMemo(async () => {
    if (!debouncedSearch) {
      setSearchResults([])
      return
    }
    
    setSearching(true)
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .ilike('title', `%${debouncedSearch}%`)
      .limit(5)
    
    if (error) {
      console.error('Book search error:', error)
    }
    
    setSearchResults(data || [])
    setSearching(false)
  }, [debouncedSearch])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="card p-4 sm:p-5 space-y-3">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-24 w-full rounded-md" />
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = value.trim()
    if (!text || !validation.isValid) return
    createPost(text, selectedBook?.id, groupId)
    setValue('')
    setSelectedBook(null)
  }

  return (
    <form className="card p-4 sm:p-5" onSubmit={handleSubmit}>
      <label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
        {t(locale, 'social_share_label')}
      </label>
      
      {/* Quality tip */}
      <div className="mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          💡 {t(locale, 'social_quality_tip')}
        </p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t(locale, 'social_write_placeholder')}
            rows={4}
            className={`w-full rounded-md border px-3 py-2 text-sm resize-none bg-white text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-400 transition-colors ${
              value.length > 0 && !validation.isValid
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20'
                : 'border-neutral-200 dark:border-neutral-700 focus:border-brand focus:ring-brand/20'
            }`}
          />
          
          {selectedBook && (
            <div className="mt-2 flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-md border border-neutral-200 dark:border-neutral-700">
              <img src={selectedBook.cover || selectedBook.cover_url} alt={selectedBook.title} className="h-10 w-8 object-cover rounded shadow-sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-neutral-900 dark:text-white">{selectedBook.title}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{selectedBook.author}</div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedBook(null)}
                className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                title={t(locale, 'remove_book')}
                aria-label={t(locale, 'remove_book')}
              >
                <FiX size={16} />
              </button>
            </div>
          )}
          
          {/* Validation feedback */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs justify-between">
            <div className="flex gap-3">
              {/* Character count */}
              <span className={`inline-flex items-center gap-1 ${
                validation.isCharValid 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}>
                {validation.isCharValid ? <FiCheckCircle className="w-3 h-3" /> : null}
                {validation.charCount}/{MIN_CHARS}
                {!validation.isCharValid && value.length > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                    ({validation.charsNeeded} {t(locale, 'social_chars_needed')})
                  </span>
                )}
              </span>

              {/* Emoji count */}
              {validation.emojiCount > 0 && (
                <span className={`inline-flex items-center gap-1 ${
                  validation.isEmojiValid 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {validation.isEmojiValid ? <FiCheckCircle className="w-3 h-3" /> : <FiAlertCircle className="w-3 h-3" />}
                  😀 {validation.emojiCount}/{MAX_EMOJI}
                </span>
              )}
            </div>

            {/* Book Attachment Button */}
            <Popover.Root open={open} onOpenChange={setOpen}>
              <Popover.Trigger asChild>
                <button 
                  type="button"
                  className="flex items-center gap-1.5 text-neutral-500 hover:text-brand transition-colors text-xs font-medium"
                  aria-label={t(locale, 'attach_book')}
                >
                  <FiBook className="w-3.5 h-3.5" />
                  {t(locale, 'attach_book')}
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="w-64 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200" sideOffset={5}>
                  <input
                    className="w-full px-2 py-1.5 text-sm rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand"
                    placeholder={t(locale, 'search_books')}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <div className="mt-2 text-xs text-neutral-500 max-h-48 overflow-y-auto">
                    {searching ? (
                      <div className="p-2 text-center">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-1">
                        {searchResults.map(b => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setSelectedBook(b)
                              setOpen(false)
                              setSearchQuery('')
                            }}
                            className="w-full text-left flex items-start gap-2 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                          >
                            {(b.cover || b.cover_url) && <img src={b.cover || b.cover_url} className="w-6 h-8 object-cover rounded flex-shrink-0" />}
                            <div className="min-w-0">
                              <div className="font-medium truncate text-neutral-900 dark:text-white">{b.title}</div>
                              <div className="truncate text-[10px] text-neutral-500 dark:text-neutral-400">{b.author}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : searchQuery ? (
                      <div className="p-2 text-center">No books found</div>
                    ) : (
                      <div className="p-2 text-center text-neutral-400">Type to search</div>
                    )}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          {/* Error messages */}
          {value.length > 0 && !validation.isCharValid && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t(locale, 'social_min_chars')}
            </p>
          )}
          {!validation.isEmojiValid && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {t(locale, 'social_max_emoji')}
            </p>
          )}
        </div>

        <button 
          type="submit"
          disabled={!validation.isValid || value.trim().length === 0}
          className="btn btn-primary h-fit px-4 text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSend /> {t(locale, 'social_post_button')}
        </button>
      </div>
    </form>
  )
}
