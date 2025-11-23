"use client"
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { FiSave, FiArrowLeft, FiUpload } from 'react-icons/fi'
import Link from 'next/link'
import { t, type Locale } from '@/lib/i18n'
import { uploadAudiobookCover, deleteAudiobookCover } from '@/lib/supabase/storage'

export default function EditBookPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const [loading, setLoading] = useState(false)
  const [book, setBook] = useState<any>(null)
  const [locale, setLocale] = useState<Locale>('en')
  const [bookId, setBookId] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
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
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
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
        alert(t(locale, 'admin_error_creating') + ' ' + error)
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
      length: formData.get('length'),
    }

    const { error } = await supabase.from('books').update(updates).eq('id', bookId)

    if (error) {
      alert(t(locale, 'admin_error_creating') + ' ' + error.message)
      setLoading(false)
    } else {
      router.push(`/${locale}/admin/books`)
      router.refresh()
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
        <Link href={`/${locale}/admin/books`} className="btn btn-outline p-2"><FiArrowLeft /></Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'admin_edit_audiobook')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-950 p-4 md:p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_title_label')}</label>
            <input name="title" defaultValue={book.title} required className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_author_label')}</label>
            <input name="author" defaultValue={book.author} required className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_genre_label')}</label>
            <input name="genre" defaultValue={book.genre} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_price_label')}</label>
            <input name="price" type="number" step="0.01" defaultValue={book.price} required className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t(locale, 'admin_length_label')}</label>
            <input name="length" defaultValue={book.length} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700" />
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

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="btn btn-primary gap-2">
            <FiSave /> {loading ? t(locale, 'admin_updating') : t(locale, 'admin_update_audiobook')}
          </button>
        </div>
      </form>
    </div>
  )
}
