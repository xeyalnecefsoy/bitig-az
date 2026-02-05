import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import { MessageButton } from '@/components/messages/MessageButton'
import Link from 'next/link'
import { FiUser, FiLock } from 'react-icons/fi'
import { t, type Locale } from '@/lib/i18n'
import { RankBadge } from '@/components/RankBadge'
import { DEFAULT_AVATAR } from '@/lib/social'

export default async function SocialProfilePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id, locale } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Determine if id is a UUID or username
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  // Fetch profile
  let query = supabase.from('profiles').select('*')
  if (isUuid) {
    query = query.eq('id', id)
  } else {
    query = query.eq('username', id)
  }
  
  const { data: profile } = await query.single()

  if (!profile) return notFound()

  // Redirect to my profile if it's the current user
  if (currentUser && profile.id === currentUser.id) {
     const { redirect } = await import('next/navigation')
     redirect(`/${locale}/profile`)
  }

  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const isGuest = !currentUser

  // Check if following
  let isFollowing = false
  if (currentUser) {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .single()
    isFollowing = !!data
  }

  // Get random gradient based on user id
  const gradients = [
    'from-rose-400 to-orange-300',
    'from-blue-400 to-indigo-400', 
    'from-emerald-400 to-cyan-400',
    'from-purple-400 to-pink-400',
  ]
  const gradient = gradients[profile.id.charCodeAt(0) % gradients.length]

  return (
    <section className="container-max py-0 sm:py-0">
      {/* Cover & Header */}
      <div className="relative mb-6">
        <div className={`h-32 sm:h-48 w-full bg-gradient-to-r ${gradient}`} />
        
        <div className="container-max px-4 sm:px-6 -mt-12 sm:-mt-16 relative z-10">
          <div className="flex flex-col items-center text-center">
             <img
                src={profile.avatar_url || DEFAULT_AVATAR}
                alt={profile.username}
                className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow-lg bg-white dark:bg-neutral-900"
              />
              
              <div className="mt-4 space-y-2 max-w-lg">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                    {profile.username || t(locale as Locale, 'profile_anonymous')}
                  </h1>
                  <RankBadge 
                    rank={(profile.username === 'khayalnajafov' || profile.username === 'xeyalnecefsoy' ? 'founder' : (profile.rank || 'novice')) as any} 
                    locale={locale as Locale} 
                    size="md" 
                    clickable={false} 
                  />
                </div>
                
                {profile.full_name && (
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium text-lg">{profile.full_name}</p>
                )}
                
                {profile.bio && (
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                    {profile.bio}
                  </p>
                )}
                
                <div className="flex items-center justify-center gap-6 pt-2 text-sm">
                   <div className="text-center">
                      <div className="font-bold text-neutral-900 dark:text-white text-lg">{profile.books_read || 0}</div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">{t(locale as Locale, 'books_read')}</div>
                   </div>
                   <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
                   <div className="text-center">
                      <div className="font-bold text-neutral-900 dark:text-white text-lg">{profile.reviews_count || 0}</div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">{t(locale as Locale, 'reviews_written')}</div>
                   </div>
                   <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
                   <div className="text-center">
                      <div className="font-bold text-neutral-900 dark:text-white text-lg">{posts?.length || 0}</div>
                      <div className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wide">{t(locale as Locale, 'posts')}</div>
                   </div>
                </div>

                {currentUser && !isGuest && (
                   <div className="pt-4 flex items-center justify-center gap-2">
                     <MessageButton userId={profile.id} />
                   </div>
                )}
              </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white px-1">{t(locale as any, 'posts')}</h2>
        
        {isGuest ? (
          <div className="relative">
            {/* Blurred content preview */}
            <div className="space-y-4 opacity-50 blur-sm select-none pointer-events-none" aria-hidden="true">
              {[1, 2].map((i) => (
                <div key={i} className="card p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
                      <div className="h-3 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Login CTA */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-neutral-200 dark:border-neutral-800">
                <div className="mx-auto h-12 w-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-4">
                  <FiLock size={24} />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                  {t(locale as any, 'profile_sign_in_title')}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  {t(locale as any, 'profile_sign_in_desc')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link 
                    href={`/${locale}/login` as any} 
                    className="btn btn-primary w-full sm:w-auto"
                  >
                    {t(locale as any, 'sign_in')}
                  </Link>
                  <Link 
                    href={`/${locale}/login` as any} 
                    className="btn btn-outline w-full sm:w-auto"
                  >
                    {t(locale as any, 'profile_create_account')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          posts?.length === 0 ? (
            <div className="card p-8 text-center text-neutral-500 dark:text-neutral-400">
              {t(locale as any, 'profile_no_posts')}
            </div>
          ) : (
            posts?.map(post => (
              <SocialPostCard key={post.id} postId={post.id} />
            ))
          )
        )}
      </div>
    </section>
  )
}

