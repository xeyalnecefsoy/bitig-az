"use client"
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { FiSave, FiArrowLeft, FiUpload, FiMusic, FiTrash2, FiAlertCircle } from 'react-icons/fi'
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { uploadAudiobookCover, uploadAudioTrackWithProgress } from '@/lib/supabase/storage'
import { Alert } from '@/components/ui/Alert'
import { AutocompleteInput } from '@/components/admin/AutocompleteInput'

export default function NewBookPage() {
  const [loading, setLoading] = useState(false)
  const [locale, setLocale] = useState<Locale>('en')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [voiceType, setVoiceType] = useState<string>('single')
  
  // Track files state
  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [trackTitles, setTrackTitles] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, { status: 'pending' | 'uploading' | 'done' | 'error', percent: number }>>({})
  
  // Custom Alerts state
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const loc = pathname.split('/')[1] as Locale
    setLocale(loc || 'en')
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Cover image must be less than 5MB')
        return
      }
      setCoverFile(file)
      setErrorMsg(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleAudioChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      // Basic size validation
      const oversized = newFiles.find(f => f.size > 500 * 1024 * 1024)
      if (oversized) {
        setErrorMsg(`Audio file ${oversized.name} is larger than 500MB limit.`)
        return
      }
      
      const newTitles = { ...trackTitles }
      newFiles.forEach(file => {
        newTitles[file.name] = file.name.replace(/\.[^/.]+$/, "") // Default to filename without extension
      })
      
      setTrackTitles(newTitles)
      setAudioFiles(prev => [...prev, ...newFiles])
      
      // Initialize progress state for newly added files so they don't appear as error or empty
      setUploadProgress(prev => {
        const nextProgress = { ...prev }
        newFiles.forEach(file => {
          if (!nextProgress[file.name]) {
            nextProgress[file.name] = { status: 'pending', percent: 0 }
          }
        })
        return nextProgress
      })
      
      setErrorMsg(null)
    }
  }

  function handleTrackTitleChange(fileName: string, newTitle: string) {
    setTrackTitles(prev => ({ ...prev, [fileName]: newTitle }))
  }

  function removeAudioFile(index: number) {
    setAudioFiles(prev => {
      const remaining = prev.filter((_, i) => i !== index)
      // We could optionally clean up trackTitles here, but it's not strictly necessary 
      // as they are keyed by filename and only mapped files are submitted
      return remaining
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (audioFiles.length === 0) {
      setErrorMsg(t(locale, 'admin_error_tracks'))
      return
    }

    setLoading(true)
    setErrorMsg(null)
    const formData = new FormData(e.currentTarget)
    
    let coverUrl = ''
    
    // Upload cover image if provided
    if (coverFile) {
      const { url, error } = await uploadAudiobookCover(coverFile)
      if (error) {
        setErrorMsg(t(locale, 'admin_error_creating') + ' ' + error)
        setLoading(false)
        return
      }
      coverUrl = url || ''
    }
    
    // 1. Create the book
    const newBookId = crypto.randomUUID()
    const book = {
      id: newBookId,
      title: formData.get('title'),
      author: formData.get('author'),
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description'),
      cover: coverUrl,
      genre: formData.get('genre'),
      length: (() => {
        const hVal = formData.get('hours')?.toString() || ''
        const mVal = formData.get('minutes')?.toString() || ''
        const hSuffix = locale === 'az' ? 's' : 'h'
        const mSuffix = locale === 'az' ? 'd' : 'm'
        const h = parseInt(hVal, 10)
        const m = parseInt(mVal, 10)
        
        let lengthStr = ''
        if (h > 0 && m > 0) {
          lengthStr = `${h}${hSuffix} ${m}${mSuffix}`
        } else if (h > 0) {
          lengthStr = `${h}${hSuffix}`
        } else if (m > 0) {
          lengthStr = `${m}${mSuffix}`
        }
        return lengthStr
      })(),
      has_ambience: formData.get('has_ambience') === 'on',
      has_sound_effects: formData.get('has_sound_effects') === 'on',
      voice_type: formData.get('voice_type') || 'single',
      rating: 0
    }

    const { error: bookError } = await supabase.from('books').insert(book)

    if (bookError) {
      setErrorMsg(t(locale, 'admin_error_creating') + ' ' + bookError.message)
      setLoading(false)
      return
    }

    // 2. Upload tracks and insert into book_tracks
    const initialProgress: Record<string, { status: 'pending' | 'uploading' | 'done' | 'error', percent: number }> = {}
    audioFiles.forEach(f => {
      initialProgress[f.name] = { status: 'pending', percent: 0 }
    })
    setUploadProgress(initialProgress)

    let hasErrors = false;

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i]
      
      setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'uploading', percent: 0 } }))
      
      const title = trackTitles[file.name] || file.name.replace(/\.[^/.]+$/, "")
      const { r2Key, format, error } = await uploadAudioTrackWithProgress(
        file,
        newBookId,
        title,
        (percent) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'uploading', percent } }))
        }
      )
      
      if (error) {
        setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'error', percent: 0 } }))
        setErrorMsg(`Error uploading ${file.name}: ${error}`)
        hasErrors = true;
        continue
      }
      
      if (r2Key) {
        const { error: trackError } = await supabase.from('book_tracks').insert({
          book_id: newBookId,
          title,
          audio_url: '', // R2 uses signed URLs via streaming API
          r2_key: r2Key,
          format,
          file_size: file.size,
          position: i + 1
        })
        
        if (trackError) {
          setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'error', percent: 0 } }))
          setErrorMsg(`Error referencing ${file.name}: ${trackError.message}`)
          hasErrors = true;
        } else {
          setUploadProgress(prev => ({ ...prev, [file.name]: { status: 'done', percent: 100 } }))
        }
      }
    }

    if (hasErrors) {
      setLoading(false)
      // Do not redirect if there were errors, so the admin can see which files failed.
      return
    }

    setSuccessMsg(t(locale, 'admin_success_audiobook'))
    setTimeout(() => {
      router.push(`/${locale}/admin/books` as any)
      router.refresh()
    }, 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/books` as any} className="btn btn-outline p-2"><FiArrowLeft /></Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'admin_add_new_audiobook')}</h1>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-950 p-4 md:p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_title_label')}</label>
            <input name="title" required className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_author_label')}</label>
            <AutocompleteInput
              name="author"
              field="author"
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_genre_label')}</label>
            <AutocompleteInput
              name="genre"
              field="genre"
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_price_label')}</label>
            <input name="price" type="number" step="0.01" min="0" required className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'admin_length_label') || 'Müddət (Length)'}</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input 
                  name="hours" 
                  type="number" 
                  min="0"
                  placeholder={locale === 'az' ? 'Saat (məs: 5)' : 'Hours (e.g. 5)'} 
                  className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700" 
                />
              </div>
              <div>
                <input 
                  name="minutes" 
                  type="number" 
                  min="0"
                  max="59"
                  placeholder={locale === 'az' ? 'Dəqiqə (məs: 20)' : 'Minutes (e.g. 20)'} 
                  className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700" 
                />
              </div>
            </div>
          </div>

          {/* New Advanced Filters */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_voice_type_label') || 'Voice Type'}</label>
              <select name="voice_type" value={voiceType} onChange={(e) => setVoiceType(e.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700">
                <option value="single">{t(locale, 'voice_single') || 'Single Voice'}</option>
                <option value="multiple">{t(locale, 'voice_multiple') || 'Multiple Voices'}</option>
                <option value="radio_theater">{t(locale, 'voice_radio_theater') || 'Radio Theater'}</option>
              </select>
              <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                {t(locale, `voice_${voiceType}_desc`)}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" name="has_ambience" id="has_ambience" className="rounded border-neutral-300 text-brand focus:ring-brand" />
              <label htmlFor="has_ambience" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_has_ambience') || 'Has Ambience'}</label>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" name="has_sound_effects" id="has_sound_effects" className="rounded border-neutral-300 text-brand focus:ring-brand" />
              <label htmlFor="has_sound_effects" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_has_sound_effects') || 'Has Sound Effects'}</label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t(locale, 'admin_upload_cover')}</label>
            <div className="flex items-start gap-4">
              {coverPreview && (
                <div className="w-24 h-32 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center hover:border-brand transition-colors">
                  <FiUpload className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {coverFile ? coverFile.name : 'Click to upload cover image'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                    JPEG, PNG, WebP (max 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_description_label')}</label>
            <textarea name="description" rows={4} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          {/* New Multi-track audio upload section */}
          <div className="md:col-span-2 border-t border-neutral-200 dark:border-neutral-800 pt-6 mt-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t(locale, 'admin_audio_files_label') || 'Audio Tracks'}
            </label>
            <label className="block cursor-pointer mb-4">
              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center hover:border-brand transition-colors bg-neutral-50 dark:bg-neutral-900/50">
                <FiMusic className="mx-auto h-8 w-8 text-neutral-400 mb-3" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t(locale, 'admin_select_tracks') || 'Click to select audio tracks'}
                </p>
                <p className="text-xs text-neutral-500 mt-2">
                  {t(locale, 'admin_audio_format_hint') || 'M4A, AAC, MP3, or OPUS (max 500MB per file). We highly recommend 64-96kbps M4A.'}
                </p>
              </div>
              <input
                type="file"
                multiple
                accept="audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/aac,audio/ogg,audio/opus,audio/webm"
                onChange={handleAudioChange}
                className="hidden"
              />
            </label>

            {audioFiles.length > 0 && (
              <div className="space-y-2">
                {audioFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                    <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
                      <div className="w-8 h-8 rounded shrink-0 bg-brand/10 text-brand flex items-center justify-center font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={trackTitles[file.name] || ''}
                          onChange={(e) => handleTrackTitleChange(file.name, e.target.value)}
                          placeholder={t(locale, 'admin_track_title_ph') || 'Bölmə adı (məs: Fəsil 1)'}
                          className="w-full bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-brand focus:outline-none focus:ring-0 px-1 py-0.5 text-sm font-medium text-neutral-900 dark:text-white transition-colors"
                        />
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <p className="text-xs text-neutral-400 truncate max-w-[200px]" title={file.name}>{file.name}</p>
                          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                          <p className="text-xs text-neutral-500 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 min-w-[80px] justify-end">
                      {uploadProgress[file.name]?.status === 'uploading' && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-brand font-medium">
                            {uploadProgress[file.name].percent}%
                          </span>
                          <div className="w-16 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress[file.name].percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {uploadProgress[file.name]?.status === 'done' && (
                        <span className="text-xs text-green-500 font-medium">Done</span>
                      )}
                      {uploadProgress[file.name]?.status === 'error' && (
                        <FiAlertCircle className="text-red-500" title="Upload failed" />
                      )}
                      {!loading && (
                        <button
                          type="button"
                          onClick={() => removeAudioFile(idx)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className={`btn btn-primary gap-2 ${loading ? 'opacity-70' : ''}`}>
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <FiSave />} 
            {loading ? (audioFiles.length > 0 ? t(locale, 'admin_uploading_tracks') : t(locale, 'admin_saving')) : t(locale, 'admin_save_audiobook')}
          </button>
        </div>
      </form>
    </div>
  )
}
