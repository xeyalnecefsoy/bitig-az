"use client"
import { useState, useMemo, useEffect } from 'react'
import { useSocial } from '@/context/social'
import { FiSend, FiAlertCircle, FiCheckCircle, FiX, FiBook, FiImage, FiPlus, FiBarChart2, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import * as Popover from '@radix-ui/react-popover'
import { createClient } from '@/lib/supabase/client'
import { useDebounce } from 'use-debounce'
import { Skeleton } from '@/components/ui/Skeleton'
import { useMentions } from '@/hooks/useMentions'
import { MentionDropdown } from '@/components/social/MentionDropdown'
import { QuotedPostCard } from '@/components/social/QuotedPostCard'
import { uploadPostImage } from '@/lib/supabase/storage'
import { extractFirstUrl, isAllowedPreviewUrl } from '@/lib/linkPreview'
import type { LinkPreview } from '@/lib/social'
import * as Dialog from '@radix-ui/react-dialog'
import toast from 'react-hot-toast'
const MAX_EMOJI = 5
const MAX_CHARS = 2000
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu

function countEmojis(text: string): number {
  const matches = text.match(EMOJI_REGEX)
  return matches ? matches.length : 0
}

const compressImage = (file: File, maxSizeMB: number = 4.5): Promise<File> => {
  return new Promise((resolve) => {
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file)
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new window.Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(file); return }

        const MAX_WIDTH = 1920
        const MAX_HEIGHT = 1080
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        let quality = 0.9
        const attemptCompression = () => {
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return }
            if (blob.size <= maxSizeMB * 1024 * 1024 || quality < 0.5) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpeg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              quality -= 0.1
              attemptCompression()
            }
          }, 'image/jpeg', quality)
        }
        attemptCompression()
      }
      img.onerror = () => resolve(file)
    }
    reader.onerror = () => resolve(file)
  })
}

type DraftState = {
  id: string;
  value: string;
  imageFiles: File[];
  imagePreviews: string[];
  selectedBook: any;
  linkPreview: LinkPreview | null;
  dismissedPreviewUrl: string | null;
  pollOptions: string[];
  pollDurationHours: number;
  isValid: boolean;
}

// ----------------------------------------------------------------------
// SINGLE ITEM COMPONENT
// ----------------------------------------------------------------------
function ComposerItem({
  draft,
  onChange,
  onRemove,
  isFirst,
  isLast,
  isUploading,
  index,
  totalDrafts,
  isInlineReply,
  isModalConfig,
  allowEmptyBody = false,
}: {
  draft: DraftState,
  onChange: (updated: Partial<DraftState>) => void,
  onRemove: () => void,
  isFirst: boolean,
  isLast: boolean,
  isUploading: boolean,
  index: number,
  totalDrafts: number,
  isInlineReply: boolean,
  isModalConfig?: boolean,
  allowEmptyBody?: boolean,
}) {
  const locale = useLocale()
  const { currentUser } = useSocial()
  const [openBookSearch, setOpenBookSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebounce(searchQuery, 300)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  const {
    query: mentionQuery,
    isOpen: isMentionOpen,
    suggestions: mentionSuggestions,
    activeIndex: mentionActiveIndex,
    loading: mentionLoading,
    handleInputChange: handleMentionInputChange,
    handleKeyDown: handleMentionKeyDown,
    selectUser: selectMentionUser,
  } = useMentions()

  const validation = useMemo(() => {
    const charCount = draft.value.trim().length
    const emojiCount = countEmojis(draft.value)
    const hasMedia = !!draft.selectedBook || draft.imageFiles.length > 0 || (draft.pollOptions && draft.pollOptions.length >= 2)
    
    // Poll validation
    const hasPoll = draft.pollOptions && draft.pollOptions.length > 0;
    const isPollValid = !hasPoll || (draft.pollOptions.length >= 2 && draft.pollOptions.every(opt => opt.trim().length > 0));

    const isCharValid =
      (charCount > 0 && charCount <= MAX_CHARS) ||
      (hasMedia && charCount <= MAX_CHARS) ||
      (!!allowEmptyBody && charCount <= MAX_CHARS)
    const isEmojiValid = emojiCount <= MAX_EMOJI
    const isValid = isCharValid && isEmojiValid && isPollValid

    return { charCount, emojiCount, isCharValid, isEmojiValid, isPollValid, isValid }
  }, [draft.value, draft.selectedBook, draft.imageFiles, draft.pollOptions, allowEmptyBody])

  useEffect(() => {
    if (draft.isValid !== validation.isValid) {
      onChange({ isValid: validation.isValid })
    }
  }, [validation.isValid, draft.isValid, onChange])

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .ilike('title', `%${debouncedSearch}%`)
        .limit(5)
      setSearchResults(data || [])
      setSearching(false)
    }
    fetchBooks()
  }, [debouncedSearch, supabase])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    if (draft.imageFiles.length + files.length > 4) {
      toast.error('Maksimum 4 şəkil əlavə edə bilərsiniz.')
      const toAdd = 4 - draft.imageFiles.length
      files.splice(toAdd)
      if (files.length === 0) return
    }

    try {
      const compressedFiles: File[] = []
      const previews: string[] = []

      for (const originalFile of files) {
         const file = await compressImage(originalFile)
         if (file.size > 5 * 1024 * 1024) {
           toast.error(t(locale, 'error_file_too_large') || 'Bəzi fayllar çox böyükdür (maks 5MB) və kifayət qədər kiçildilə bilmədi.')
           continue
         }
         compressedFiles.push(file)
         previews.push(URL.createObjectURL(file))
      }
      
      onChange({
        imageFiles: [...draft.imageFiles, ...compressedFiles],
        imagePreviews: [...draft.imagePreviews, ...previews]
      })
    } catch (err) {
      console.error(err)
    } finally {
      e.target.value = ''
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items)
    const files = items
      .filter(item => item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((f): f is File => f !== null)
      
    if (files.length === 0) return

    if (draft.imageFiles.length + files.length > 4) {
      toast.error('Maksimum 4 şəkil əlavə edə bilərsiniz.')
      const toAdd = 4 - draft.imageFiles.length
      files.splice(toAdd)
      if (files.length === 0) return
    }

    try {
      const compressedFiles: File[] = []
      const previews: string[] = []

      for (const originalFile of files) {
         const file = await compressImage(originalFile)
         if (file.size > 5 * 1024 * 1024) {
           toast.error(t(locale, 'error_file_too_large') || 'Bəzi fayllar çox böyükdür (maks 5MB) və kifayət qədər kiçildilə bilmədi.')
           continue
         }
         compressedFiles.push(file)
         previews.push(URL.createObjectURL(file))
      }
      
      onChange({
        imageFiles: [...draft.imageFiles, ...compressedFiles],
        imagePreviews: [...draft.imagePreviews, ...previews]
      })
    } catch (err) {
      console.error(err)
    }
  }

  const removeImage = (imgIndex: number) => {
    const newFiles = draft.imageFiles.filter((_, i) => i !== imgIndex)
    const newPreviews = draft.imagePreviews.filter((url, i) => {
      if (i === imgIndex) URL.revokeObjectURL(url)
      return i !== imgIndex
    })
    onChange({ imageFiles: newFiles, imagePreviews: newPreviews })
  }

  const [isFocused, setIsFocused] = useState(false)
  const [expandedImage, setExpandedImage] = useState<{ index: number, urls: string[] } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  // If we are in the base composer (not modal), we ONLY render the first item with NO avatars.
  // If we ARE in the modal, we render avatars and connecting lines.
  const showAvatarLayout = isModalConfig;

  // In base view (!showAvatarLayout), the single composer is always expanded.
  // In modal view (showAvatarLayout), items expand if focused, or if they have content.
  const isExpanded = !showAvatarLayout || isFocused || draft.value.length > 0 || draft.imageFiles.length > 0 || !!draft.selectedBook

  const showToolbar = !showAvatarLayout || isFocused;

  useEffect(() => {
    const firstUrl = extractFirstUrl(draft.value)
    if (!firstUrl) {
      if (draft.linkPreview || draft.dismissedPreviewUrl) {
        onChange({ linkPreview: null, dismissedPreviewUrl: null })
      }
      return
    }
    if (!isAllowedPreviewUrl(firstUrl)) {
      if (draft.linkPreview) onChange({ linkPreview: null })
      return
    }
    if (draft.dismissedPreviewUrl === firstUrl) {
      if (draft.linkPreview?.url === firstUrl) onChange({ linkPreview: null })
      return
    }
    if (draft.linkPreview?.url === firstUrl) return

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true)
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(firstUrl)}`)
        if (!res.ok) {
          if (!cancelled) onChange({ linkPreview: null })
          return
        }
        const json = await res.json()
        const preview = json?.preview
        if (!cancelled && preview?.url && preview?.title) {
          onChange({ linkPreview: preview, dismissedPreviewUrl: null })
        }
      } catch {
        if (!cancelled) onChange({ linkPreview: null })
      } finally {
        if (!cancelled) setPreviewLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
      setPreviewLoading(false)
    }
  }, [draft.value, draft.dismissedPreviewUrl, draft.linkPreview?.url, onChange])

  return (
    <div className={`flex relative w-full ${showAvatarLayout ? 'mb-0 gap-0' : 'mb-1 gap-2'}`}>
      
      {/* Avatar column ONLY for Modal layout — X-style continuous thread line */}
      {showAvatarLayout && (
        <div className="flex flex-col items-center shrink-0 relative" style={{ width: 40 }}>
          {/* Vertical line above avatar — connects to previous post */}
          {!isFirst && (
            <div className="w-0.5 bg-neutral-200 dark:bg-neutral-700" style={{ height: 12 }} aria-hidden="true" />
          )}
          {isFirst && (
            <div style={{ height: 12 }} />
          )}
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="h-10 w-10 rounded-full object-cover z-10 border-2 border-white dark:border-neutral-950 shrink-0"
          />
          {/* Vertical line below avatar — connects to next post */}
          {!isLast && (
            <div className="flex-1 w-0.5 bg-neutral-200 dark:bg-neutral-700 min-h-[8px]" aria-hidden="true" />
          )}
        </div>
      )}

      {/* Main content: text area and buttons */}
      <div 
        className={`flex-1 min-w-0 relative group ${showAvatarLayout ? 'pl-3' : ''}`}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => setIsFocused(false), 150);
          }
        }}
      >
        {/* Remove button if not first draft (in modal) */}
        {!isFirst && !isUploading && isModalConfig && (
           <button 
             type="button" 
             onClick={onRemove}
             className="absolute -top-3 right-0 p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-50"
             aria-label="Remove post"
           >
             <FiX size={16} />
           </button>
        )}

        <div className="relative">
          <textarea
            value={draft.value}
            onChange={(e) => {
              onChange({ value: e.target.value })
              handleMentionInputChange(e)
            }}
            onKeyDown={(e) => handleMentionKeyDown(e, draft.value, (val) => onChange({ value: val }))}
            onPaste={handlePaste}
            placeholder={
              isFirst && !showAvatarLayout
                ? t(locale, 'social_write_placeholder') || "Paylaşım yazın..."
                : t(locale, 'add_to_thread') || "Ardlar yarat..."
            }
            rows={isExpanded ? (draft.value.length > 50 ? 3 : 2) : 1}
            className={`w-full bg-transparent resize-none text-[15px] text-neutral-900 dark:text-neutral-100 leading-relaxed transition-colors ${
              showAvatarLayout 
                ? 'border-none px-0 py-2 focus:ring-0 outline-none' 
                : 'rounded-md border border-neutral-200 px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700 focus:border-brand focus:ring-brand/20 outline-none'
            } ${!isExpanded && showAvatarLayout ? 'placeholder-neutral-400 dark:placeholder-neutral-500 overflow-hidden' : 'placeholder-neutral-500'}`}
            disabled={isUploading}
            id={`draft-${draft.id}`}
            autoFocus={index > 0 && draft.value.length === 0} // Auto-focus new drafts in modal
          />
          <MentionDropdown 
            isOpen={isMentionOpen}
            suggestions={mentionSuggestions}
            activeIndex={mentionActiveIndex}
            loading={mentionLoading}
            onSelect={(user) => {
              const newValue = selectMentionUser(user, draft.value)
              onChange({ value: newValue })
            }}
          />
        </div>

        {/* Validation & Actions (Old style for base, compact for modal) */}
        {showToolbar && (
          <div className={`mt-1 flex flex-wrap items-center gap-3 justify-between ${showAvatarLayout ? 'pb-2 border-b border-transparent group-focus-within:border-neutral-100 dark:group-focus-within:border-neutral-800' : ''}`}>
            <div className="flex gap-3 text-sm">
               {/* Char count check */}
               {validation.charCount > 0 && (
                  <span className={`inline-flex items-center text-xs font-medium ${
                    validation.charCount > MAX_CHARS 
                      ? 'text-red-500' 
                      : validation.charCount > MAX_CHARS - 100 
                        ? 'text-amber-500' 
                        : 'text-neutral-400'
                  }`}>
                    {validation.charCount}/{MAX_CHARS}
                  </span>
               )}
               {/* Emoji count check */}
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
          
          <div className={`flex items-center ${showAvatarLayout ? 'gap-1' : 'gap-4'}`}>
             {/* Image button */}
             <div>
                <input
                  type="file"
                  id={`post-image-upload-${draft.id}`}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                  disabled={isUploading || draft.imageFiles.length >= 4}
                />
                <label 
                  htmlFor={`post-image-upload-${draft.id}`}
                  className={
                    showAvatarLayout 
                      ? `flex items-center justify-center w-8 h-8 rounded-full transition-colors cursor-pointer ${isUploading || draft.imageFiles.length >= 4 ? 'text-neutral-400 opacity-50 cursor-not-allowed' : 'text-brand hover:bg-brand/10'}`
                      : `flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${isUploading || draft.imageFiles.length >= 4 ? 'text-neutral-400 opacity-50 cursor-not-allowed' : 'text-neutral-500 hover:text-brand'}`
                  }
                  aria-label={t(locale, 'attach_image') || 'Şəkil'}
                >
                  <FiImage className={showAvatarLayout ? 'w-[18px] h-[18px]' : 'w-3.5 h-3.5'} />
                  {!showAvatarLayout && <span className="hidden sm:inline">{t(locale, 'attach_image') || 'Şəkil'}</span>}
                </label>
              </div>

              {/* Book button */}
              <Popover.Root open={openBookSearch} onOpenChange={setOpenBookSearch} modal={true}>
                <Popover.Trigger asChild>
                  <button 
                    type="button"
                    className={
                      showAvatarLayout
                        ? 'flex items-center justify-center w-8 h-8 rounded-full text-brand hover:bg-brand/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        : 'flex items-center gap-1.5 text-neutral-500 hover:text-brand transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                    }
                    disabled={isUploading || !!draft.selectedBook}
                  >
                    <FiBook className={showAvatarLayout ? 'w-[18px] h-[18px]' : 'w-3.5 h-3.5'} />
                    {!showAvatarLayout && <span className="hidden sm:inline">{t(locale, 'attach_book') || 'Kitab'}</span>}
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content 
                    className="w-64 sm:w-72 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 p-2 z-[9999]" 
                    sideOffset={5} 
                    collisionPadding={10}
                    avoidCollisions={true}
                  >
                    <input
                      type="text"
                      placeholder={t(locale, 'search_books')}
                      className="w-full text-sm border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-2 bg-transparent focus:outline-none dark:text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="max-h-60 overflow-y-auto mt-2 space-y-1">
                      {searching ? (
                        <div className="py-4 text-center text-sm text-neutral-500">{t(locale, 'social_loading')}</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map(b => (
                          <button
                            key={b.id}
                            type="button"
                            className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors flex items-center gap-3"
                            onClick={() => {
                              onChange({ selectedBook: b })
                              setOpenBookSearch(false)
                            }}
                          >
                            {b.cover_url || b.cover ? (
                              <img src={b.cover_url || b.cover} className="w-8 h-12 object-cover rounded shadow-sm" alt="cover" />
                            ) : (
                              <div className="w-8 h-12 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center shrink-0">
                                <FiBook className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate dark:text-white">{b.title}</div>
                              <div className="text-xs text-neutral-500 truncate">{b.author}</div>
                            </div>
                          </button>
                        ))
                      ) : searchQuery.trim() ? (
                        <div className="py-4 text-center text-sm text-neutral-500">Köhnə qeyd tapılmadı</div>
                      ) : null}
                    </div>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

              {/* Poll button */}
              <button
                type="button"
                className={
                  showAvatarLayout
                    ? `flex items-center justify-center w-8 h-8 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${draft.pollOptions && draft.pollOptions.length > 0 ? 'bg-brand/10 text-brand' : 'text-neutral-500 hover:text-brand hover:bg-neutral-100 dark:hover:bg-neutral-800'}`
                    : `flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${draft.pollOptions && draft.pollOptions.length > 0 ? 'text-brand' : 'text-neutral-500 hover:text-brand'}`
                }
                onClick={() => {
                  if (draft.pollOptions && draft.pollOptions.length > 0) {
                    onChange({ pollOptions: [] });
                  } else {
                    onChange({ pollOptions: ['', ''] });
                  }
                }}
                disabled={isUploading}
                title={t(locale, 'add_poll')}
              >
                <FiBarChart2 className={showAvatarLayout ? 'w-[18px] h-[18px]' : 'w-3.5 h-3.5'} />
                {!showAvatarLayout && <span className="hidden sm:inline">{t(locale, 'add_poll')}</span>}
              </button>
          </div>
        </div>
        )}

        {/* Poll Options Editor */}
        {draft.pollOptions && draft.pollOptions.length > 0 && (
          <div className="mt-4 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Səsvermə</span>
              <button 
                type="button" 
                onClick={() => onChange({ pollOptions: [] })}
                className="p-1.5 text-neutral-400 hover:text-red-500 rounded-full hover:bg-white dark:hover:bg-neutral-800 transition-colors"
                title="Səsverməni ləğv et"
              >
                <FiX size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              {draft.pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-neutral-400 font-medium">{i + 1}</span>
                  </div>
                  <input 
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...draft.pollOptions!];
                      newOpts[i] = e.target.value;
                      onChange({ pollOptions: newOpts });
                    }}
                    placeholder={`Seçim ${i + 1}`}
                    className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all"
                    maxLength={50}
                  />
                  {draft.pollOptions!.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const newOpts = draft.pollOptions!.filter((_, idx) => idx !== i);
                        onChange({ pollOptions: newOpts });
                      }}
                      className="p-2 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Seçimi sil"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {draft.pollOptions.length < 4 && (
              <button 
                type="button"
                onClick={() => onChange({ pollOptions: [...draft.pollOptions!, ''] })}
                className="inline-flex items-center gap-1.5 text-brand text-sm font-medium hover:text-brand/80 transition-colors ml-7"
              >
                <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <FiPlus size={12} />
                </div>
                Yeni seçim əlavə et
              </button>
            )}

            <div className="pt-3 mt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Müddət</span>
              <div className="relative">
                <select 
                  value={draft.pollDurationHours}
                  onChange={(e) => onChange({ pollDurationHours: Number(e.target.value) })}
                  className="appearance-none bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-1 focus:ring-brand outline-none cursor-pointer text-neutral-800 dark:text-neutral-200"
                >
                  <option value={24}>1 Gün</option>
                  <option value={72}>3 Gün</option>
                  <option value={168}>1 Həftə</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-neutral-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Previews */}
        {(draft.imagePreviews.length > 0 || draft.selectedBook || draft.linkPreview || previewLoading) && (
          <div className="mt-2 flex flex-wrap gap-2 items-start pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
            {draft.imagePreviews.map((preview, previewIdx) => (
              <div key={preview} className="relative inline-block group/media shrink-0">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="h-20 sm:h-24 aspect-video object-cover rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm cursor-zoom-in" 
                  onClick={() => setExpandedImage({ index: previewIdx, urls: draft.imagePreviews })}
                />
                <button 
                  type="button" 
                  onClick={() => removeImage(previewIdx)}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white hover:bg-black/80 rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity shadow-sm backdrop-blur-sm"
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
            
            {draft.selectedBook && (
              <div className="relative flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 max-w-[200px]">
                {draft.selectedBook.cover_url || draft.selectedBook.cover ? (
                  <img src={draft.selectedBook.cover_url || draft.selectedBook.cover} alt="Cover" className="w-10 h-14 object-cover rounded shadow-sm shrink-0" />
                ) : (
                  <div className="w-10 h-14 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center shrink-0">
                    <FiBook className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
                <div className="min-w-0 pr-6">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">{draft.selectedBook.title}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{draft.selectedBook.author}</div>
                </div>
                <button 
                  type="button"
                  onClick={() => onChange({ selectedBook: null })}
                  className="absolute top-1 right-1 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}

            {(draft.linkPreview || previewLoading) && (
              <div className="relative flex w-full max-w-md items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800/50">
                {draft.linkPreview?.imageUrl ? (
                  <img
                    src={draft.linkPreview.imageUrl}
                    alt={draft.linkPreview.title}
                    className="h-16 w-24 rounded-md border border-neutral-200 object-cover dark:border-neutral-700"
                  />
                ) : (
                  <div className="h-16 w-24 rounded-md border border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700" />
                )}
                <div className="min-w-0 flex-1 pr-6">
                  {previewLoading && !draft.linkPreview ? (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t(locale, 'social_link_preview_loading') || 'Link preview yüklənir...'}
                    </div>
                  ) : (
                    <>
                      <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {draft.linkPreview?.title}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                        {draft.linkPreview?.siteName || draft.linkPreview?.url}
                      </div>
                      {draft.linkPreview?.description && (
                        <div className="mt-1 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-300">
                          {draft.linkPreview.description}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {draft.linkPreview && (
                  <button
                    type="button"
                    onClick={() => onChange({ linkPreview: null, dismissedPreviewUrl: draft.linkPreview?.url ?? null })}
                    className="absolute right-1 top-1 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expanded Image Modal / Lightbox */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 sm:p-8 cursor-zoom-out animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation()
            setExpandedImage(null)
          }}
        >
          <button 
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[10000]"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedImage(null)
            }}
          >
            <FiX size={24} />
          </button>
          
          {/* Navigation Controls */}
          {expandedImage.urls.length > 1 && (
            <>
              {expandedImage.index > 0 && (
                <button
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[10000]"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedImage(prev => prev ? { ...prev, index: prev.index - 1 } : null)
                  }}
                >
                  <FiChevronLeft size={32} />
                </button>
              )}
              {expandedImage.index < expandedImage.urls.length - 1 && (
                <button
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-[10000]"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedImage(prev => prev ? { ...prev, index: prev.index + 1 } : null)
                  }}
                >
                  <FiChevronRight size={32} />
                </button>
              )}
<div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-full backdrop-blur-md">
                {expandedImage.index + 1} / {expandedImage.urls.length}
              </div>
            </>
          )}

          <img 
            src={expandedImage.urls[expandedImage.index]} 
            alt="Expanded view" 
            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------------
// MAIN COMPOSER WRAPPER
// ----------------------------------------------------------------------
export function SocialComposer({ 
  groupId, 
  replyToPostId, 
  quotedPostId,
  onPostCreated, 
  isInlineReply = false,
  /** Quote modal: scrollable body + sticky Paylaş; no side button / no feed chrome */
  quoteOverlayChrome = false,
}: { 
  groupId?: string, 
  replyToPostId?: string,
  quotedPostId?: string,
  onPostCreated?: () => void, 
  isInlineReply?: boolean 
  quoteOverlayChrome?: boolean
}) {
  const locale = useLocale()
  const { createPost, currentUser, loading, posts, users } = useSocial()
  
  const createEmptyDraft = (): DraftState => ({
    id: Math.random().toString(36).substring(7),
    value: '',
    imageFiles: [],
    imagePreviews: [],
    selectedBook: null,
    linkPreview: null,
    dismissedPreviewUrl: null,
    pollOptions: [],
    pollDurationHours: 24,
    isValid: false
  })

  // We maintain the drafts array. In base view, we only show drafts[0]. 
  // If the user clicks "Add to thread", we open the modal and show all drafts.
  const [drafts, setDrafts] = useState<DraftState[]>([createEmptyDraft()])
  const [isUploading, setIsUploading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (loading) {
    return (
      <div className="card p-4 sm:p-5 space-y-3">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-9 w-20 rounded-md ml-auto" />
      </div>
    )
  }

  if (!currentUser) return null

  const handleUpdateDraft = (index: number, updates: Partial<DraftState>) => {
    setDrafts(prev => {
       const newDrafts = [...prev]
       newDrafts[index] = { ...newDrafts[index], ...updates }
       return newDrafts
    })
  }

  const handleRemoveDraft = (index: number) => {
    const draft = drafts[index]
    draft.imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setDrafts(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const invalidDraft = drafts.find(d => !d.isValid)
    if (invalidDraft || isUploading) return

    setIsUploading(true)

    try {
      let previousPostId: string | undefined = replyToPostId
      let draftIndex = 0

      for (const draft of drafts) {
        let imageUrls: string[] | undefined = undefined

        if (draft.imageFiles.length > 0) {
          const urls: string[] = []
          for (const file of draft.imageFiles) {
            const { url, error } = await uploadPostImage(file, currentUser.id)
            if (error) throw new Error('Image upload failed')
            if (url) urls.push(url)
          }
          imageUrls = urls.length > 0 ? urls : undefined
        }

        const useQuote = quotedPostId && draftIndex === 0
        const parentForDraft = useQuote ? undefined : previousPostId
        const quotedForDraft = useQuote ? quotedPostId : undefined

        const newPostId = await createPost(
          draft.value.trim(),
          draft.selectedBook?.id,
          groupId,
          imageUrls,
          parentForDraft,
          draft.pollOptions,
          draft.pollDurationHours,
          quotedForDraft,
          draft.linkPreview ?? undefined,
        )

        if (newPostId) {
          previousPostId = newPostId
        } else {
          throw new Error('Post creation returned no ID')
        }
        draftIndex += 1
      }

      drafts.forEach(d => {
        d.imagePreviews.forEach(url => URL.revokeObjectURL(url))
      })
      setDrafts([createEmptyDraft()])
      setIsModalOpen(false) // Close modal on success if it was open
      if (onPostCreated) onPostCreated()
      
    } catch (err: any) {
       console.error(err)
       toast.error('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.')
    } finally {
      setIsUploading(false)
    }
  }

  const isAllValid = drafts.every(d => d.isValid)

  // Handlers for Threading Mode
  const openThreadModal = () => {
    // If they only have one draft and it's valid, automatically create the second one when opening modal
    if (drafts.length === 1) {
      setDrafts(prev => [...prev, createEmptyDraft()])
    }
    setIsModalOpen(true)
  }

  const isQuoteOverlay = quoteOverlayChrome && !!quotedPostId

  return (
    <>
      {/* ----------------- BASE VIEW (Non-Modal) ----------------- */}
      <form
        id={isQuoteOverlay ? 'social-quote-compose-form' : undefined}
        className={`transition-all ${isInlineReply ? 'p-1' : isQuoteOverlay ? 'p-0' : 'card p-4 sm:p-5'}`}
        onSubmit={(e) => {
        // If the user tries to submit from base view but they have multiple drafts somehow, handle it nicely
        if (drafts.length > 1) {
           e.preventDefault();
           setIsModalOpen(true);
           return;
        }
        handleSubmit(e);
      }}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.requestSubmit();
        }
      }}>
        {!isInlineReply && !isQuoteOverlay && (
          <label className="block text-sm text-neutral-600 dark:text-neutral-300 mb-2">
            {t(locale, 'social_share_label')}
          </label>
        )}
        
        {!isInlineReply && !isQuoteOverlay && (
          <div className="mb-3 p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5">💡</span> 
              <span>{t(locale, 'social_quality_tip')}</span>
            </p>
          </div>
        )}

        {/* Primary container: side-by-side submit (feed) or stacked + sticky Paylaş (quote modal) */}
        <div className={isQuoteOverlay ? 'flex flex-col gap-3 relative' : 'flex gap-2 relative'}>
          <div className="flex-1 min-w-0">
            {/* Main Draft Container for Base View (Only show drafts[0]) */}
            <div className="flex flex-col relative w-full">
               <ComposerItem 
                 draft={drafts[0]}
                 onChange={(updates) => handleUpdateDraft(0, updates)}
                 onRemove={() => handleRemoveDraft(0)}
                 isFirst={true}
                 isLast={true} // Base view always pretend it's last visually
                 isUploading={isUploading}
                 index={0}
                 totalDrafts={1}
                 isInlineReply={isInlineReply}
                 isModalConfig={false}
                 allowEmptyBody={!!quotedPostId}
               />
              
              {/* + Zəncirə əlavə et button in base view */}
              {drafts[0].isValid && !quotedPostId && (
                <div className="mt-2 text-sm flex items-center">
                  <div className="relative">
                    <button 
                       type="button"
                       onClick={openThreadModal}
                       disabled={isUploading}
                       className="flex items-center gap-2 text-xs font-semibold text-brand hover:text-brand/80 transition-colors py-1 px-2 rounded-full border border-brand/20 hover:bg-brand/10 bg-white dark:bg-neutral-900 shadow-sm"
                       title={t(locale, 'add_to_thread') || 'Ardlar yarat'}
                     >
                       <FiPlus size={14} /> Ardlar yarat
                     </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isQuoteOverlay && (
          <button 
            type="submit"
            disabled={!drafts[0].isValid || isUploading}
            className="btn btn-primary h-fit px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isUploading ? <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span> : <FiSend className="w-4 h-4" />} 
            {isUploading 
                ? (t(locale, 'uploading') || 'Yüklənir...') 
                : (t(locale, 'social_post_button') || "Paylaş")}
          </button>
          )}
        </div>

        {/* Quoted original below your draft (X-style: commentary wraps / sits above the cited post) */}
        {quotedPostId && (() => {
          const qp = posts.find((p) => p.id === quotedPostId)
          if (!qp) {
            return (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{t(locale, 'composer_quote_hint')}</p>
            )
          }
          const qAuthor = users.find((u) => u.id === qp.userId)
          return (
            <div className="mt-3">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-wide">
                {t(locale, 'social_quoted_post')}
              </p>
              <QuotedPostCard
                quoted={{
                  id: qp.id,
                  userId: qp.userId,
                  content: qp.content,
                  imageUrls: qp.imageUrls,
                  createdAt: qp.createdAt,
                }}
                quotedAuthor={qAuthor ?? null}
                locale={locale}
              />
            </div>
          )
        })()}

        {isQuoteOverlay && (
          <div className="sticky bottom-0 z-20 mt-4 flex justify-end border-t border-neutral-200 bg-white/95 py-3 pt-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
            <button
              type="submit"
              disabled={!drafts[0].isValid || isUploading}
              className="btn btn-primary inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isUploading ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <FiSend className="h-4 w-4" />
              )}
              {isUploading
                ? (t(locale, 'uploading') || 'Yüklənir...')
                : (t(locale, 'social_post_button') || 'Paylaş')}
            </button>
          </div>
        )}
      </form>

      {/* ----------------- MODAL VIEW ----------------- */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in" />
          <Dialog.Content className="fixed top-[5%] sm:top-[10%] left-1/2 -translate-x-1/2 w-[95vw] sm:w-full max-w-xl bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl z-[101] max-h-[85vh] sm:max-h-[90vh] flex flex-col focus:outline-none overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-200">
{/* Modal Header — X-style minimal */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <Dialog.Close asChild>
                  <button 
                    className="p-2 -ml-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                    disabled={isUploading}
                  >
                    <FiX size={20} />
                  </button>
                </Dialog.Close>
                <Dialog.Title className="font-bold text-[17px] text-neutral-900 dark:text-neutral-100">{t(locale, 'add_to_thread') || 'Ardlar yarat'}</Dialog.Title>
                <Dialog.Description className="sr-only">Çoxlu paylaşımlar yaratmaq üçün dialoq pəncərəsi</Dialog.Description>
                <div className="w-9" />
            </div>

            {/* Modal Body (Scrollable drafts) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <form id="modal-compose-form" onSubmit={handleSubmit} className="flex flex-col relative w-full pt-2">
{drafts.map((draft, i) => {
                    const isLastDraft = i === drafts.length - 1
                    const showAddButton = isLastDraft && drafts[drafts.length - 1].isValid
                    return (
                    <ComposerItem 
                      key={draft.id}
                      draft={draft}
                      onChange={(updates) => handleUpdateDraft(i, updates)}
                      onRemove={() => handleRemoveDraft(i)}
                      isFirst={i === 0}
                      isLast={isLastDraft && !showAddButton}
                      isUploading={isUploading}
                      index={i}
                      totalDrafts={drafts.length}
                      isInlineReply={isInlineReply}
                      isModalConfig={true}
                      allowEmptyBody={!!quotedPostId && i === 0}
                    />
                    )
                  })}

{/* The (+) Add to thread button — X-style with avatar + line continuation */}
                 {drafts[drafts.length - 1].isValid && (
                   <div className="flex items-start">
                     <div className="flex flex-col items-center shrink-0 relative" style={{ width: 40 }}>
                       <div className="w-0.5 bg-neutral-200 dark:bg-neutral-700" style={{ height: 8 }} aria-hidden="true" />
                       <button 
                         type="button"
                         onMouseDown={(e) => {
                           e.preventDefault() 
                         }}
                         onClick={() => {
                           const newDraft = createEmptyDraft()
                           setDrafts(prev => [...prev, newDraft])
                         }}
                         disabled={isUploading}
                         className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 hover:border-brand hover:bg-brand/5 transition-colors z-10 shrink-0"
                       >
                         <FiPlus className="w-4 h-4 text-neutral-400 hover:text-brand transition-colors" />
                       </button>
                     </div>
                     <div className="pt-3 pl-3">
                       <button
                         type="button"
                         onMouseDown={(e) => e.preventDefault()}
                         onClick={() => {
                           const newDraft = createEmptyDraft()
                           setDrafts(prev => [...prev, newDraft])
                         }}
                         disabled={isUploading}
                         className="text-[15px] text-neutral-400 hover:text-brand transition-colors"
                       >
                         {t(locale, 'add_to_thread') || 'Ardlara əlavə et'}
                       </button>
                     </div>
                   </div>
                 )}
               </form>
             </div>

{/* Modal Footer — X-style with thread count */}
             <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0 flex items-center justify-between bg-white dark:bg-neutral-950">
                <div className="flex items-center gap-2">
                  {drafts.length > 1 && (
                    <span className="text-xs font-medium text-neutral-400">
                      {drafts.length} {t(locale, 'posts') || 'paylaşım'}
                    </span>
                  )}
                </div>
                <button 
                   type="button"
                   disabled={!isAllValid || isUploading}
                   onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
                   className="btn btn-primary px-5 py-1.5 rounded-full font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                  {isUploading ? (
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
                  ) : null}
                  {isUploading 
                    ? (t(locale, 'social_loading') || 'Yüklənir...') 
                    : drafts.length > 1 
                       ? (t(locale, 'post_all') || "Ardları paylaş") 
                       : (t(locale, 'social_post_button') || "Paylaş")}
                </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
