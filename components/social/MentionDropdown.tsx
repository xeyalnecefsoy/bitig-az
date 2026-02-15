import { FiUser } from 'react-icons/fi'

interface User {
  id: string
  username: string
  full_name: string
  avatar_url: string
}

interface MentionDropdownProps {
  isOpen: boolean
  suggestions: User[]
  activeIndex: number
  loading: boolean
  onSelect: (user: User) => void
}

export function MentionDropdown({ isOpen, suggestions, activeIndex, loading, onSelect }: MentionDropdownProps) {
  if (!isOpen) return null
  
  if (suggestions.length === 0 && !loading) {
    return (
      <div className="absolute z-50 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 w-64 p-3 text-sm text-neutral-500 text-center animate-in fade-in zoom-in-95 duration-100 mt-1">
        Type to search people...
      </div>
    )
  }

  return (
    <div className="absolute z-50 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-800 w-64 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 mt-1">
      {suggestions.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          className={`w-full text-left flex items-center gap-3 p-2 transition-colors ${
            index === activeIndex 
              ? 'bg-neutral-100 dark:bg-neutral-800' 
              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
          }`}
        >
          {user.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.username} 
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <FiUser />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">
              {user.full_name || user.username}
            </div>
            <div className="text-xs text-neutral-500 truncate">
              @{user.username}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
