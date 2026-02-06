"use client"
import { t, type Locale } from '@/lib/i18n'
import { FiX, FiCheck } from 'react-icons/fi'

type Rank = 'novice' | 'reader' | 'bookworm' | 'scholar' | 'ozan' | 'writer' | 'founder'

interface RankHelpModalProps {
  isOpen: boolean
  onClose: () => void
  locale: Locale
  currentRank: Rank
}

const ranks: Rank[] = ['novice', 'reader', 'bookworm', 'scholar', 'ozan', 'writer']

const rankRequirements = {
  novice: { books: 0, reviews: 0, likes: 0 },
  reader: { books: 3, reviews: 0, likes: 0 },
  bookworm: { books: 10, reviews: 5, likes: 0 },
  scholar: { books: 25, reviews: 15, likes: 50 },
  ozan: { books: 50, reviews: 30, likes: 100 },
  writer: { books: 100, reviews: 50, likes: 250 },
  founder: { books: 0, reviews: 0, likes: 0 },
}

const rankConfig: Record<Rank, { icon: string; color: string; bg: string }> = {
  novice: { icon: '📖', color: 'text-neutral-600', bg: 'bg-neutral-100' },
  reader: { icon: '📚', color: 'text-blue-600', bg: 'bg-blue-100' },
  bookworm: { icon: '🐛', color: 'text-green-600', bg: 'bg-green-100' },
  scholar: { icon: '🎓', color: 'text-purple-600', bg: 'bg-purple-100' },
  ozan: { icon: '🎭', color: 'text-amber-600', bg: 'bg-amber-100' },
  writer: { icon: '✍️', color: 'text-rose-600', bg: 'bg-rose-100' },
  founder: { icon: '🚀', color: 'text-blue-600', bg: 'bg-blue-100' },
}

export function RankHelpModal({ isOpen, onClose, locale, currentRank }: RankHelpModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity overflow-hidden">
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div 
        className="relative w-full max-w-lg flex flex-col bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-neutral-100 dark:border-neutral-800"
        style={{ height: 'auto', maxHeight: 'calc(100% - 2rem)' }}
      >
        
        {/* Header */}
        <div className="shrink-0 relative p-6 sm:p-8 border-b border-neutral-100 dark:border-neutral-800">
          <div className="pr-10">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {t(locale, 'rank_system_title')}
            </h2>
            <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
              {t(locale, 'rank_system_desc')}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            aria-label="Close"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content - This is the only part that scrolls */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-7 space-y-4 custom-scrollbar">
          {ranks.map((rank, index) => {
            const req = rankRequirements[rank]
            const config = rankConfig[rank]
            const isUnlocked = currentRank === 'founder' || ranks.indexOf(currentRank) >= index
            const isNext = !isUnlocked && ranks.indexOf(currentRank as typeof ranks[number]) + 1 === index

            return (
              <div 
                key={rank}
                className={`flex gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
                  isUnlocked 
                    ? 'border-brand/30 bg-brand/[0.03] shadow-inner' 
                    : isNext 
                      ? 'border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20'
                      : 'border-transparent opacity-40 grayscale'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm ${config.bg} ${config.color} transform transition-transform ${isUnlocked ? 'scale-110' : ''}`}>
                  {config.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className={`font-bold flex items-center gap-2 text-base ${isUnlocked ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>
                      {t(locale, `rank_${rank}`)}
                      {isUnlocked && (
                        <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                          <FiCheck className="text-white" size={12} />
                        </div>
                      )}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {req.books > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-neutral-500">{t(locale, 'req_books')}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-lg ${isUnlocked ? 'bg-brand/10 text-brand' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                          {req.books}+
                        </span>
                      </div>
                    )}
                    {req.reviews > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-neutral-500">{t(locale, 'req_reviews')}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-lg ${isUnlocked ? 'bg-brand/10 text-brand' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                          {req.reviews}+
                        </span>
                      </div>
                    )}
                    {req.likes > 0 && (
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-neutral-500">{t(locale, 'req_likes')}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded-lg ${isUnlocked ? 'bg-brand/10 text-brand' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                          {req.likes}+
                        </span>
                      </div>
                    )}
                    {rank === 'novice' && (
                      <p className="text-xs italic text-neutral-400">{t(locale, 'req_novice')}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-center">
          <p className="text-xs text-neutral-400 font-medium">
            {t(locale, 'rank_system_footer')}
          </p>
        </div>

      </div>
    </div>
  )
}
