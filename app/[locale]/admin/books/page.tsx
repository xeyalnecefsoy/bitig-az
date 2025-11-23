"use client"
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FiPlus, FiTrash2, FiSearch, FiEdit2 } from 'react-icons/fi'
import { useState, useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'

export default function AdminBooksPage({ params }: { params: Promise<{ locale: string }> }) {
  const [books, setBooks] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [locale, setLocale] = useState<Locale>('en')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const loc = pathname.split('/')[1] as Locale
    setLocale(loc || 'en')
    loadBooks()
  }, [])

  async function loadBooks() {
    const { data } = await supabase.from('books').select('*').order('title')
    setBooks(data || [])
  }

  async function deleteBook(id: string) {
    if (!confirm(t(locale, 'admin_delete_confirm'))) return
    await supabase.from('books').delete().eq('id', id)
    loadBooks()
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return books
    return books.filter(b => 
      b.title?.toLowerCase().includes(q) || 
      b.author?.toLowerCase().includes(q)
    )
  }, [books, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'admin_audiobooks')}</h1>
        <Link href={`/${locale}/admin/books/new` as any} className="btn btn-primary gap-2 w-full sm:w-auto justify-center">
          <FiPlus /> {t(locale, 'admin_add_audiobook')}
        </Link>
      </div>

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder={t(locale, 'admin_search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
        />
      </div>

      <div className="bg-white dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t(locale, 'admin_audiobook')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t(locale, 'admin_author')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t(locale, 'admin_price')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t(locale, 'admin_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filtered.map((book) => (
                <tr key={book.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        {book.cover ? (
                          <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-neutral-400 text-xs">No image</div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-900 dark:text-white">{book.title}</div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{book.genre || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{book.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">${book.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/${locale}/admin/books/${book.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 p-1"
                      >
                        <FiEdit2 />
                      </Link>
                      <button 
                        onClick={() => deleteBook(book.id)} 
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-1"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    {search ? t(locale, 'admin_no_search_results') : t(locale, 'admin_no_audiobooks')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
          {filtered.map((book) => (
            <div key={book.id} className="p-4 flex gap-4">
              <div className="h-20 w-16 flex-shrink-0 rounded overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-neutral-400 text-xs">No image</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-neutral-900 dark:text-white truncate">{book.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{book.author}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">${book.price}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/${locale}/admin/books/${book.id}`}
                  className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 p-2 h-fit"
                >
                  <FiEdit2 />
                </Link>
                <button 
                  onClick={() => deleteBook(book.id)} 
                  className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2 h-fit"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
              {search ? t(locale, 'admin_no_search_results') : t(locale, 'admin_no_audiobooks')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
