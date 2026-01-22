"use client"
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/auth'
import { createClient } from '@/lib/supabase/client'
import { FiStar, FiThumbsUp, FiEdit2, FiTrash2, FiSend } from 'react-icons/fi'
import { UserHoverCard } from '@/components/social/UserHoverCard'
import type { Locale } from '@/lib/i18n'

type Review = {
  id: string
  user_id: string
  rating: number
  content: string
  likes_count: number
  created_at: string
  profiles: {
    id: string
    username: string
    avatar_url: string
  }
  liked_by_me?: boolean
}

export function BookReviews({ bookId, locale }: { bookId: string; locale: Locale }) {
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [bookId])

  async function loadReviews() {
    try {
      const { data } = await supabase
        .from('book_reviews')
        .select(`
          *,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('book_id', bookId)
        .order('created_at', { ascending: false })

      if (data) {
        // Check which reviews user has liked
        if (user) {
          const { data: likes } = await supabase
            .from('review_likes')
            .select('review_id')
            .eq('user_id', user.id)
          
          const likedIds = new Set(likes?.map(l => l.review_id) || [])
          
          const enriched = data.map(r => ({
            ...r,
            liked_by_me: likedIds.has(r.id)
          }))
          
          setReviews(enriched)
          
          // Find user's own review
          const mine = enriched.find(r => r.user_id === user.id)
          if (mine) {
            setMyReview(mine)
            setRating(mine.rating)
            setContent(mine.content)
          }
        } else {
          setReviews(data)
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || content.length < 10) return
    
    setSubmitting(true)
    try {
      if (myReview) {
        // Update existing review
        await supabase
          .from('book_reviews')
          .update({ rating, content, updated_at: new Date().toISOString() })
          .eq('id', myReview.id)
      } else {
        // Create new review
        await supabase
          .from('book_reviews')
          .insert({ user_id: user.id, book_id: bookId, rating, content })
      }
      
      setShowForm(false)
      await loadReviews()
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!myReview || !confirm(locale === 'az' ? 'Rəyi silmək istəyirsiniz?' : 'Delete this review?')) return
    
    try {
      await supabase.from('book_reviews').delete().eq('id', myReview.id)
      setMyReview(null)
      setRating(5)
      setContent('')
      await loadReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
    }
  }

  async function handleLike(reviewId: string, isLiked: boolean) {
    if (!user) return
    
    try {
      if (isLiked) {
        await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', user.id)
      } else {
        await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id })
      }
      
      // Update local state
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            likes_count: isLiked ? r.likes_count - 1 : r.likes_count + 1,
            liked_by_me: !isLiked
          }
        }
        return r
      }))
    } catch (error) {
      console.error('Error liking review:', error)
    }
  }

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
        <div className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
            {locale === 'az' ? 'Rəylər' : 'Reviews'} ({reviews.length})
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-amber-500">
              <FiStar className="fill-current" />
              <span className="font-semibold">{avgRating}</span>
              <span className="text-neutral-500 text-sm">/ 5</span>
            </div>
          )}
        </div>
        
        {user && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm"
          >
            {myReview 
              ? (locale === 'az' ? 'Rəyimi Düzəlt' : 'Edit My Review')
              : (locale === 'az' ? 'Rəy Yaz' : 'Write Review')
            }
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && user && (
        <form onSubmit={handleSubmit} className="card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {locale === 'az' ? 'Qiymət' : 'Rating'}
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-colors ${
                    star <= rating ? 'text-amber-500' : 'text-neutral-300 dark:text-neutral-600'
                  }`}
                >
                  <FiStar className={star <= rating ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              {locale === 'az' ? 'Rəy (minimum 10 simvol)' : 'Review (min 10 characters)'}
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm resize-none"
              placeholder={locale === 'az' ? 'Bu kitab haqqında nə düşünürsünüz?' : 'What do you think about this book?'}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting || content.length < 10}
              className="btn btn-primary btn-sm"
            >
              <FiSend size={14} />
              {submitting ? '...' : (locale === 'az' ? 'Göndər' : 'Submit')}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-outline btn-sm"
            >
              {locale === 'az' ? 'Ləğv et' : 'Cancel'}
            </button>
            {myReview && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-outline btn-sm text-red-600 hover:border-red-600 ml-auto"
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="card p-6 text-center text-neutral-500">
          {locale === 'az' ? 'Hələ rəy yazılmayıb. İlk rəyi siz yazın!' : 'No reviews yet. Be the first to write one!'}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="card p-4">
              <div className="flex items-start gap-3">
                <UserHoverCard userId={review.user_id}>
                  <img
                    src={review.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user_id}`}
                    alt={review.profiles.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </UserHoverCard>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{review.profiles.username}</span>
                    <div className="flex text-amber-500">
                      {[1,2,3,4,5].map(star => (
                        <FiStar 
                          key={star}
                          size={12} 
                          className={star <= review.rating ? 'fill-current' : 'text-neutral-300'} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-neutral-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
                    {review.content}
                  </p>
                  
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => handleLike(review.id, review.liked_by_me || false)}
                      disabled={!user}
                      className={`flex items-center gap-1 text-xs ${
                        review.liked_by_me 
                          ? 'text-brand' 
                          : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                      }`}
                    >
                      <FiThumbsUp size={14} className={review.liked_by_me ? 'fill-current' : ''} />
                      {review.likes_count > 0 && review.likes_count}
                    </button>
                    
                    {user?.id === review.user_id && (
                      <button
                        onClick={() => { setShowForm(true) }}
                        className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      >
                        <FiEdit2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
