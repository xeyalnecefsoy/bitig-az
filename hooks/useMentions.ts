import { useState, useRef, useEffect, useCallback } from 'react'
import { searchUsers } from '@/app/actions/messages'
import { useDebounce } from 'use-debounce'

interface User {
  id: string
  username: string
  full_name: string
  avatar_url: string
}

interface UseMentionsProps {
  onSelect?: (user: User) => void
}

export function useMentions({ onSelect }: UseMentionsProps = {}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [debouncedQuery] = useDebounce(query, 300)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
  const activeInputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)

  // Track the start index of the current mention to replace it correctly
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([])
      return
    }

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const users = await searchUsers(debouncedQuery)
        setSuggestions(users || [])
        setActiveIndex(0)
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [debouncedQuery])

  const recalcPosition = useCallback(() => {
    const el = activeInputRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return
    recalcPosition()
    window.addEventListener('scroll', recalcPosition, { passive: true })
    window.addEventListener('resize', recalcPosition)

    // Close dropdown if input scrolls out of view
    const el = activeInputRef.current
    let observer: IntersectionObserver | null = null
    if (el && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              setIsOpen(false)
            }
          })
        },
        { threshold: 0 }
      )
      observer.observe(el)
    }

    return () => {
      window.removeEventListener('scroll', recalcPosition)
      window.removeEventListener('resize', recalcPosition)
      if (observer && el) observer.unobserve(el)
    }
  }, [isOpen, recalcPosition])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { value, selectionStart } = e.target

    // Find the last '@' before cursor
    const textBeforeCursor = value.slice(0, selectionStart || 0)
    const lastAt = textBeforeCursor.lastIndexOf('@')

    if (lastAt !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAt + 1)

      if (/\s/.test(textAfterAt)) {
         setIsOpen(false)
         setQuery('')
         return
      }

      setQuery(textAfterAt)
      setMentionStartIndex(lastAt)
      setIsOpen(true)
      activeInputRef.current = e.target

      // Position dropdown below the input using fixed coordinates
      const rect = e.target.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      })
    } else {
      setIsOpen(false)
    }
  }, [])

  const selectUser = (user: User, currentValue: string) => {
    if (mentionStartIndex === -1) return currentValue

    const before = currentValue.slice(0, mentionStartIndex)
    // We want to insert "@username "
    const after = currentValue.slice(mentionStartIndex + query.length + 1) // +1 for the @ itself
    
    const newValue = `${before}@${user.username} ${after}`
    
    setIsOpen(false)
    setSuggestions([])
    onSelect?.(user)
    
    return newValue
  }

  const handleKeyDown = (e: React.KeyboardEvent, currentValue: string, setValue: (val: string) => void) => {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      const user = suggestions[activeIndex]
      if (user) {
        const newValue = selectUser(user, currentValue)
        setValue(newValue)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return {
    query,
    isOpen,
    suggestions,
    activeIndex,
    loading,
    position,
    inputRef,
    handleInputChange,
    handleKeyDown,
    selectUser,
    setIsOpen
  }
}
