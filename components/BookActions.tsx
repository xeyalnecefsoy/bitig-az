"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark } from 'react-icons/fa'
import { t, type Locale } from '@/lib/i18n'
import { useAuth } from '@/context/auth'
import { useRouter } from 'next/navigation'

export function BookActions({ bookId, locale }: { bookId: string; locale: Locale }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  
  const [status, setStatus] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadStatus() {
      const { data } = await supabase
        .from('user_books')
        .select('status, is_favorite')
        .eq('user_id', user!.id)
        .eq('book_id', bookId)
        .single()
      
      if (data) {
        setStatus(data.status)
        setIsFavorite(data.is_favorite || false)
      }
      setLoading(false)
    }

    loadStatus()
  }, [bookId, user, supabase])

  const toggleWantToRead = async () => {
    if (!user) {
      router.push(`/${locale}/login` as any)
      return
    }

    const newStatus = status === 'want_to_read' ? null : 'want_to_read'
    setStatus(newStatus) // Optimistic update
    
    // If we're setting it to null (removing), and it's not a favorite, we might delete the row? 
    // Or just set status to null. Let's upsert.
    
    // If the record exists, update. If not, insert.
    const { error } = await supabase
      .from('user_books')
      .upsert({
        user_id: user.id,
        book_id: bookId,
        status: newStatus
        // updated_at: new Date().toISOString() -- Schema cache issue persisting, letting DB handle defaults or ignore for now
      }, { onConflict: 'user_id, book_id' })

    if (error) {
       console.error('Error toggling want to read:', error.message || error)
       // Revert on error
       setStatus(status) 
    }
  }

  const toggleFavorite = async () => {
    if (!user) {
      router.push(`/${locale}/login` as any)
      return
    }

    const newFav = !isFavorite
    setIsFavorite(newFav) // Optimistic update

    const { error } = await supabase
      .from('user_books')
      .upsert({
        user_id: user.id,
        book_id: bookId,
        is_favorite: newFav
        // updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, book_id' })

    if (error) {
       console.error('Error toggling favorite:', error.message || error)
       setIsFavorite(!newFav)
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={toggleWantToRead}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
          status === 'want_to_read'
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        {status === 'want_to_read' ? <FaBookmark /> : <FaRegBookmark />}
        {status === 'want_to_read' ? t(locale, 'in_wishlist') : t(locale, 'add_to_wishlist')}
      </button>

      <button
        onClick={toggleFavorite}
        className={`p-3 rounded-xl transition-all ${
          isFavorite
            ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
        }`}
        title={isFavorite ? t(locale, 'remove_from_favorites') : t(locale, 'add_to_favorites')}
      >
        {isFavorite ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
      </button>
    </div>
  )
}
