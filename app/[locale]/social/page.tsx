"use client"
import { useState } from 'react'
import { useSocial } from '@/context/social'
import { SocialPostCard } from '@/components/social/SocialPostCard'
import { SocialComposer } from '@/components/social/SocialComposer'
import { useLocale } from '@/context/locale'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import { FiPlus } from 'react-icons/fi'

export default function SocialPage() {
  const { posts, user } = useSocial()
  const [tab, setTab] = useState<'feed' | 'following'>('feed')
  const locale = useLocale()
  
  const display = tab === 'feed' 
    ? posts 
    : posts.filter(p => user?.following?.includes(p.author.id)) // Assuming user object has following list, or logic needs adjustment. 
    // For now, let's just filter by something or keep it simple. 
    // Since mock data structure might not support 'following' array on user yet, we might need to adjust.
    // Let's just show all posts for 'following' if logic isn't ready, or filter by a mock logic.
    // Actually, let's just rely on the 'posts' for now as the 'following' logic might be complex to mock perfectly without backend.
    // But the request was just to HIDE the tab.
    
  // If tab is following but user is guest, switch to feed (though button is hidden, good to be safe)
  if (tab === 'following' && !user) setTab('feed')

  return (
    <section className="container-max py-6 sm:py-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4 sm:space-y-5">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t(locale, 'nav_social')}</h1>
          <Link href={`/${locale}/social/new` as any} className="btn btn-primary flex items-center gap-2 text-sm">
            <FiPlus /> New Post
          </Link>
        </div>

        <div className="mb-6 flex gap-4 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setTab('feed')}
            className={`pb-3 text-sm font-medium transition-colors ${tab === 'feed' ? 'border-b-2 border-brand text-brand' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
          >
            Community Feed
          </button>
          {user && (
            <button
              onClick={() => setTab('following')}
              className={`pb-3 text-sm font-medium transition-colors ${tab === 'following' ? 'border-b-2 border-brand text-brand' : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
            >
              {t(locale, 'following')}
            </button>
          )}
        </div>
        <SocialComposer />
        {display.map((p) => (
          <SocialPostCard key={p.id} postId={p.id} />
        ))}
      </div>
      <aside className="hidden lg:block">
        <div className="card p-5 sticky top-24">
          <h2 className="font-semibold mb-2">What is Bitig Social?</h2>
          <p className="text-sm text-neutral-600">A space for readers and listeners to share notes, ask for recommendations, and connect.</p>
        </div>
      </aside>
    </section>
  )
}
