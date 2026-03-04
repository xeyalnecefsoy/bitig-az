"use client"
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { FiSave, FiArrowLeft, FiUpload, FiMusic, FiTrash2, FiPlus, FiAlertCircle } from 'react-icons/fi'
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { uploadAudiobookCover, deleteAudiobookCover, uploadAudioTrackWithProgress } from '@/lib/supabase/storage'
import { Alert } from '@/components/ui/Alert'
import { AutocompleteInput } from '@/components/admin/AutocompleteInput'

export default function EditBookPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const [loading, setLoading] = useState(false)
  const [book, setBook] = useState<any>(null)
  const [locale, setLocale] = useState<Locale>('en')
  const [bookId, setBookId] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [voiceType, setVoiceType] = useState<string>('single')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  
  // Track state
  const [tracks, setTracks] = useState<any[]>([])
  const [newTrackFile, setNewTrackFile] = useState<File | null>(null)
  const [newTrackTitle, setNewTrackTitle] = useState('')
  const [uploadingTrack, setUploadingTrack] = useState(false)
  const [trackUploadProgress, setTrackUploadProgress] = useState(0)

  // Alert state (matching new page pattern)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const loc = pathname.split('/')[1] as Locale
    setLocale(loc || 'en')
    params.then(p => {
      setBookId(p.id)
      loadBook(p.id)
    })
  }, [])

  async function loadBook(id: string) {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) {
      setBook(data)
      setCoverPreview(data.cover || '')
      if (data.voice_type) setVoiceType(data.voice_type)
        
      if (data.length) {
        // Parse hours (e.g., '12h' or '12s')
        const hMatch = data.length.match(/(\d+)\s*[hs]/i)
        if (hMatch) setHours(hMatch[1])
        
        // Parse minutes (e.g., '30m' or '30d')
        const mMatch = data.length.match(/(\d+)\s*[md]/i)
        if (mMatch) setMinutes(mMatch[1])
      }
    }

    // Load tracks
    const { data: tracksData } = await supabase
      .from('book_tracks')
      .select('*')
      .eq('book_id', id)
      .order('position', { ascending: true })
    
    if (tracksData) {
      setTracks(tracksData)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Cover file size validation (matching new page)
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

  async function handleAddTrack(e: React.FormEvent) {
    e.preventDefault()
    if (!newTrackFile || !newTrackTitle) return

    // Audio file size validation
    if (newTrackFile.size > 500 * 1024 * 1024) {
      setErrorMsg(`Audio file ${newTrackFile.name} is larger than 500MB limit.`)
      return
    }

    setUploadingTrack(true)
    setTrackUploadProgress(0)
    setErrorMsg(null)
    
    try {
      const { r2Key, format, error } = await uploadAudioTrackWithProgress(
        newTrackFile,
        bookId,
        newTrackTitle,
        (percent) => {
          setTrackUploadProgress(percent)
        }
      )

      if (error) {
        setErrorMsg(`Error uploading ${newTrackFile.name}: ${error}`)
        setUploadingTrack(false)
        return
      }

      if (r2Key) {
        const { error: dbError } = await supabase.from('book_tracks').insert({
          book_id: bookId,
          title: newTrackTitle,
          audio_url: '',
          r2_key: r2Key,
          format,
          file_size: newTrackFile.size,
          position: tracks.length + 1
        })

        if (dbError) {
          setErrorMsg(t(locale, 'admin_error_creating') + ' ' + dbError.message)
        } else {
          setSuccessMsg(t(locale, 'admin_track_added'))
          setTimeout(() => setSuccessMsg(null), 3000)
          setNewTrackTitle('')
          setNewTrackFile(null)
          loadBook(bookId)
        }
      }
    } catch (error: any) {
      setErrorMsg(t(locale, 'admin_error_creating') + ' ' + error.message)
    } finally {
      setUploadingTrack(false)
      setTrackUploadProgress(0)
    }
  }

  const [deleteModal, setDeleteModal] = useState(false)
  const [deletingTrack, setDeletingTrack] = useState<{ id: string, r2Key: string | null, audioUrl: string | null } | null>(null)

  function confirmDeleteTrack(trackId: string, r2Key: string | null, audioUrl: string | null) {
    setDeletingTrack({ id: trackId, r2Key, audioUrl })
    setDeleteModal(true)
  }

  async function handleDeleteTrackConfirm() {
    if (!deletingTrack) return

    try {
      const { id: trackId, r2Key, audioUrl } = deletingTrack

      if (r2Key) {
        // R2 deletion handled separately
      } else if (audioUrl) {
        const { deleteAudioTrack } = await import('@/lib/supabase/storage')
        await deleteAudioTrack(audioUrl)
      }
      
      const { error } = await supabase.from('book_tracks').delete().eq('id', trackId)
      if (error) throw error

      setDeleteModal(false)
      setDeletingTrack(null)
      loadBook(bookId)
    } catch (error: any) {
      setErrorMsg('Error deleting track: ' + error.message)
      setDeleteModal(false)
      setDeletingTrack(null)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    const formData = new FormData(e.currentTarget)
    
    let coverUrl = book.cover
    
    // Upload new cover if provided
    if (coverFile) {
      // Delete old cover if it exists
      if (book.cover) {
        await deleteAudiobookCover(book.cover)
      }
      
      const { url, error } = await uploadAudiobookCover(coverFile)
      if (error) {
        setErrorMsg(t(locale, 'admin_error_creating') + ' ' + error)
        setLoading(false)
        return
      }
      coverUrl = url || book.cover
    }
    
    const updates = {
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
        return lengthStr || book.length // Fallback or clear
      })(),
      has_ambience: formData.get('has_ambience') === 'on',
      has_sound_effects: formData.get('has_sound_effects') === 'on',
      voice_type: formData.get('voice_type') || 'single',
    }

    const { error } = await supabase.from('books').update(updates).eq('id', bookId)

    if (error) {
      setErrorMsg(t(locale, 'admin_error_creating') + ' ' + error.message)
      setLoading(false)
    } else {
      setSuccessMsg(t(locale, 'admin_success_audiobook'))
      setTimeout(() => {
        router.push(`/${locale}/admin/books` as any)
        router.refresh()
      }, 2000)
    }
  }

  if (!book) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
    </div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/books` as any} className="btn btn-outline p-2"><FiArrowLeft /></Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'admin_edit_audiobook')}</h1>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} onClose={() => setErrorMsg(null)} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-950 p-4 md:p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_title_label')}</label>
            <input name="title" defaultValue={book.title} required className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_author_label')}</label>
            <AutocompleteInput
              name="author"
              field="author"
              defaultValue={book.author}
              required
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_genre_label')}</label>
            <AutocompleteInput
              name="genre"
              field="genre"
              defaultValue={book.genre}
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_price_label')}</label>
            <input name="price" type="number" step="0.01" min="0" defaultValue={book.price} required className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'admin_length_label') || 'Müddət (Length)'}</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input 
                  name="hours" 
                  type="number" 
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
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
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder={locale === 'az' ? 'Dəqiqə (məs: 20)' : 'Minutes (e.g. 20)'} 
                  className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700" 
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
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
              <input type="checkbox" name="has_ambience" id="has_ambience" defaultChecked={book.has_ambience} className="rounded border-neutral-300 text-brand focus:ring-brand" />
              <label htmlFor="has_ambience" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_has_ambience') || 'Has Ambience'}</label>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" name="has_sound_effects" id="has_sound_effects" defaultChecked={book.has_sound_effects} className="rounded border-neutral-300 text-brand focus:ring-brand" />
              <label htmlFor="has_sound_effects" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_has_sound_effects') || 'Has Sound Effects'}</label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {coverFile ? t(locale, 'admin_change_cover') : t(locale, 'admin_current_cover')}
            </label>
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
                    {coverFile ? coverFile.name : t(locale, 'admin_change_cover')}
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
            <textarea name="description" defaultValue={book.description} rows={4} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>
        </div>

        {/* Track Management Section */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 mt-8">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">{t(locale, 'admin_tracks')}</h2>
          
          {/* Track List */}
          <div className="space-y-4 mb-8">
            {tracks.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 italic">{t(locale, 'admin_no_tracks')}</p>
            ) : (
              tracks.map((track, index) => (
                <div key={track.id} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 dark:text-white">{track.title}</h3>
                      <p className="text-xs text-neutral-500 truncate max-w-[200px]">
                        {track.r2_key ? `${track.format?.toUpperCase() || 'OPUS'} • R2` : track.audio_url?.split('/').pop() || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => confirmDeleteTrack(track.id, track.r2_key, track.audio_url)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t(locale, 'admin_delete_track')}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Track Form */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">{t(locale, 'admin_add_track')}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'admin_track_title')}</label>
                <input
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  placeholder={t(locale, 'admin_track_title_ph') || 'Bölmə adı (məs: Fəsil 1)'}
                  className="block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-950 dark:border-neutral-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">{t(locale, 'admin_upload_audio')}</label>
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/aac,audio/ogg,audio/opus,audio/webm"
                  onChange={(e) => setNewTrackFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20"
                />
              </div>
            </div>

            {/* Upload progress bar */}
            {uploadingTrack && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">{newTrackFile?.name}</span>
                  <span className="text-sm font-medium text-brand">{trackUploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${trackUploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAddTrack}
                disabled={!newTrackTitle || !newTrackFile || uploadingTrack}
                className="btn btn-primary gap-2"
              >
                {uploadingTrack ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t(locale, 'admin_saving_track')}
                  </>
                ) : (
                  <>
                    <FiPlus /> {t(locale, 'admin_add_track')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className={`btn btn-primary gap-2 ${loading ? 'opacity-70' : ''}`}>
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <FiSave />}
            {loading ? t(locale, 'admin_updating') : t(locale, 'admin_update_audiobook')}
          </button>
        </div>
      </form>

      <DeleteConfirmModal
        isOpen={deleteModal}
        title="Səs Faylını Sil"
        message={t(locale, 'admin_confirm_delete_track')}
        onConfirm={handleDeleteTrackConfirm}
        onCancel={() => {
          setDeleteModal(false)
          setDeletingTrack(null)
        }}
        isDeleting={false}
      />
    </div>
  )
}
