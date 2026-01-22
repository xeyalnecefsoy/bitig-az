"use client"
import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/context/auth'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { t, type Locale } from '@/lib/i18n'
import { 
  FiAward, FiTarget, FiTrendingUp, FiCheck, FiLock, 
  FiBook, FiLayers, FiZap, FiPenTool, FiClock, 
  FiSmile, FiPlayCircle, FiFlag, FiActivity, FiUsers,
  FiStar, FiBarChart2
} from 'react-icons/fi'
import Link from 'next/link'

type Challenge = {
  id: string
  title_az: string
  title_en: string
  description_az: string
  description_en: string
  type: string
  target: number
  period: string
  badge_icon: string
  badge_color: string
  xp_reward: number
}

type UserChallenge = {
  challenge_id: string
  progress: number
  completed: boolean
  completed_at: string | null
}

type Achievement = {
  id: string
  name_az: string
  name_en: string
  description_az: string
  description_en: string
  icon: string
  color: string
  category: string
  xp_reward: number
  is_secret: boolean
  unlocked?: boolean
  unlocked_at?: string
}

// Icon mapping helper
const getIcon = (icon: string, size: number = 24) => {
  // Mapojis to icons
  const map: Record<string, React.ReactNode> = {
    '📖': <FiBook size={size} />,
    '📚': <FiLayers size={size} />,
    '🎯': <FiTarget size={size} />,
    '🔥': <FiZap size={size} />,
    '✍️': <FiPenTool size={size} />,
    '⏰': <FiClock size={size} />,
    '👋': <FiSmile size={size} />,
    '👣': <FiPlayCircle size={size} />,
    '🏁': <FiFlag size={size} />,
    '🏃': <FiActivity size={size} />,
    '🦋': <FiUsers size={size} />,
  }
  return map[icon] || <FiStar size={size} />
}

export default function ChallengesPage() {
  const { user, loading: authLoading } = useAuth()
  const pathname = usePathname()
  const locale = (pathname?.split('/')[1] || 'az') as Locale
  const supabase = useMemo(() => createClient(), [])
  
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [userChallenges, setUserChallenges] = useState<Map<string, UserChallenge>>(new Map())
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, streak: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'challenges' | 'achievements'>('challenges')

  useEffect(() => {
    loadData()
  }, [user])

  async function loadData() {
    try {
      // Load challenges
      const { data: challengesData } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (challengesData) setChallenges(challengesData)

      // Load achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('category')

      if (user) {
        // Load user's challenge progress
        const { data: userChallengesData } = await supabase
          .from('user_challenges')
          .select('challenge_id, progress, completed, completed_at')
          .eq('user_id', user.id)

        if (userChallengesData) {
          const map = new Map<string, UserChallenge>()
          userChallengesData.forEach(uc => map.set(uc.challenge_id, uc))
          setUserChallenges(map)
        }

        // Load user's unlocked achievements
        const { data: userAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_id, unlocked_at')
          .eq('user_id', user.id)

        const unlockedIds = new Map(userAchievements?.map(ua => [ua.achievement_id, ua.unlocked_at]) || [])

        if (achievementsData) {
          const enriched = achievementsData.map(a => ({
            ...a,
            unlocked: unlockedIds.has(a.id),
            unlocked_at: unlockedIds.get(a.id)
          }))
          setAchievements(enriched)
        }

        // Load user stats
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp, level, current_streak')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserStats({
            xp: profile.xp || 0,
            level: profile.level || 1,
            streak: profile.current_streak || 0
          })
        }
      } else if (achievementsData) {
        setAchievements(achievementsData.filter(a => !a.is_secret))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function joinChallenge(challengeId: string) {
    if (!user) return
    
    await supabase.from('user_challenges').insert({
      user_id: user.id,
      challenge_id: challengeId,
      progress: 0
    })
    
    loadData()
  }

  if (authLoading || loading) {
    return (
      <div className="container-max py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-max py-8 min-h-[80vh]">
      {/* Header with Stats */}
      <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 sm:p-10 mb-8 sm:mb-12">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-brand/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px]" />
        
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              {locale === 'az' ? 'Hədəflər & Nailiyyətlər' : 'Challenges & Achievements'}
            </h1>
            <p className="text-neutral-400 max-w-lg text-lg">
              {locale === 'az' ? 'Oxuyun, XP toplayın, yeni səviyyələr kəşf edin!' : 'Read, earn XP, unlock new levels!'}
            </p>
          </div>

          {user ? (
            <div className="flex items-stretch gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1 min-w-[100px] text-center">
                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">{locale === 'az' ? 'Səviyyə' : 'Level'}</div>
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                  <FiStar className="text-brand fill-brand" size={24} />
                  {userStats.level}
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1 min-w-[100px] text-center">
                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">XP</div>
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                  <FiBarChart2 className="text-blue-500" size={24} />
                  {userStats.xp}
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex-1 min-w-[100px] text-center">
                <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Streak</div>
                <div className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                  <FiZap className="text-orange-500 fill-orange-500" size={24} />
                  {userStats.streak}
                </div>
              </div>
            </div>
          ) : (
            <Link 
              href={`/${locale}/login` as any}
              className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
            >
              {t(locale, 'sign_in')}
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit mb-8">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'challenges'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <FiTarget />
          {locale === 'az' ? 'Hədəflər' : 'Challenges'}
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'achievements'
              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
          }`}
        >
          <FiAward />
          {locale === 'az' ? 'Nailiyyətlər' : 'Achievements'}
        </button>
      </div>

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map(challenge => {
            const userProgress = userChallenges.get(challenge.id)
            const isJoined = !!userProgress
            const isCompleted = userProgress?.completed || false
            const progress = userProgress?.progress || 0
            const progressPct = Math.min(100, (progress / challenge.target) * 100)

            return (
              <div 
                key={challenge.id}
                className={`group relative bg-white dark:bg-neutral-900 border transition-all duration-300 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 ${
                  isCompleted 
                    ? 'border-green-500/30 ring-1 ring-green-500/20' 
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-brand/30'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors`}
                      style={{ 
                        backgroundColor: `${challenge.badge_color}${isCompleted ? '30' : '15'}`,
                        color: challenge.badge_color 
                      }}
                    >
                      {getIcon(challenge.badge_icon, 28)}
                    </div>
                    {isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                        <FiCheck size={16} />
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        {challenge.period === 'daily' ? (locale === 'az' ? 'Gündəlik' : 'Daily') : 
                         challenge.period === 'weekly' ? (locale === 'az' ? 'Həftəlik' : 'Weekly') : 
                         challenge.period === 'monthly' ? (locale === 'az' ? 'Aylıq' : 'Monthly') : 
                         (locale === 'az' ? 'Ümumi' : 'All time')}
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">
                    {locale === 'az' ? challenge.title_az : challenge.title_en}
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 min-h-[40px]">
                    {locale === 'az' ? challenge.description_az : challenge.description_en}
                  </p>

                  {/* Progress Section */}
                  <div className="mt-6">
                    {isJoined ? (
                      <>
                        <div className="flex justify-between text-xs font-medium text-neutral-500 mb-2">
                          <span>{progress} / {challenge.target}</span>
                          <span>{Math.round(progressPct)}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{ 
                              width: `${progressPct}%`,
                              backgroundColor: challenge.badge_color
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-[2.625rem] flex items-center"> {/* Placeholder for layout stability */}
                        <div className="flex items-center gap-1.5 text-sm font-medium text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg">
                          <FiTrendingUp />
                          +{challenge.xp_reward} XP
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                    {!user ? (
                      <Link href={`/${locale}/login` as any} className="block w-full py-2.5 text-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        {locale === 'az' ? 'Daxil ol' : 'Sign in'}
                      </Link>
                    ) : !isJoined ? (
                      <button
                        onClick={() => joinChallenge(challenge.id)}
                        className="w-full py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium hover:opacity-90 transition-opacity"
                      >
                        {locale === 'az' ? 'Hədəfə Qoşul' : 'Join Challenge'}
                      </button>
                    ) : isCompleted ? (
                      <div className="w-full py-2.5 text-center text-green-600 font-medium bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-900/30">
                        {locale === 'az' ? 'Təbrik edirik!' : 'Completed!'}
                      </div>
                    ) : (
                      <div className="w-full py-2.5 text-center text-neutral-500 font-medium bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                        {locale === 'az' ? 'Davam edir...' : 'In progress...'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {achievements.map(achievement => {
            const isUnlocked = achievement.unlocked

            return (
              <div 
                key={achievement.id}
                className={`group relative text-center p-6 rounded-2xl bg-white dark:bg-neutral-900 border transition-all hover:shadow-lg ${
                  isUnlocked 
                    ? 'border-neutral-200 dark:border-neutral-800 hover:border-brand/30' 
                    : 'border-neutral-200 dark:border-neutral-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                }`}
              >
                <div 
                  className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ 
                    backgroundColor: isUnlocked ? `${achievement.color}20` : '#f5f5f5',
                    color: isUnlocked ? achievement.color : '#a3a3a3'
                  }}
                >
                  {achievement.is_secret && !isUnlocked 
                    ? <FiLock size={32} /> 
                    : getIcon(achievement.icon, 32)
                  }
                </div>
                
                <h3 className="font-bold text-neutral-900 dark:text-white mb-2">
                  {achievement.is_secret && !isUnlocked 
                    ? (locale === 'az' ? 'Gizli Nailiyyət' : 'Secret Achievement')
                    : (locale === 'az' ? achievement.name_az : achievement.name_en)
                  }
                </h3>
                
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 h-8">
                  {achievement.is_secret && !isUnlocked
                    ? '???'
                    : (locale === 'az' ? achievement.description_az : achievement.description_en)
                  }
                </p>
                
                {isUnlocked && achievement.unlocked_at ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 text-xs font-medium">
                    <FiCheck size={12} />
                    {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs font-medium">
                    <FiStar size={12} />
                    {achievement.xp_reward} XP
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
