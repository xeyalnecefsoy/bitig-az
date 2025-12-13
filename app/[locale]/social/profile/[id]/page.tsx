import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import Link from 'next/link'
import { FiUser, FiLock } from 'react-icons/fi'
import { t, type Locale } from '@/lib/i18n'
import { RankBadge } from '@/components/RankBadge'

export default async function SocialProfilePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id, locale } = await params
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) return notFound()

  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  const isGuest = !currentUser

  return (
    <section className="container-max py-6 sm:py-8">
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
            alt={profile.username}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-white dark:border-neutral-800 shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white truncate">
                {profile.username || t(locale as Locale, 'profile_anonymous')}
              </h1>
              <RankBadge rank={profile.rank || 'novice'} locale={locale as Locale} size="md" />
            </div>
            {profile.full_name && (
              <p className="text-neutral-600 dark:text-neutral-400 font-medium">{profile.full_name}</p>
            )}
            {profile.bio && (
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 sm:line-clamp-3">
                {profile.bio}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 flex-wrap">
              <span>📚 {profile.books_read || 0} {t(locale as Locale, 'books_read')}</span>
              <span>✍️ {profile.reviews_count || 0} {t(locale as Locale, 'reviews_written')}</span>
              <span>{posts?.length || 0} {t(locale as Locale, 'posts')}</span>
            </div>
            <div className="mt-1 text-xs text-neutral-400">
              {t(locale as Locale, 'profile_joined')} {new Date(profile.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
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

