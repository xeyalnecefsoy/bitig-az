"use client"
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { translateGenre, DEFAULT_GENRES_AZ } from '@/lib/i18n'

interface AutocompleteInputProps {
  name: string
  field: 'author' | 'genre'
  defaultValue?: string
  required?: boolean
  placeholder?: string
  className?: string
}

export function AutocompleteInput({
  name,
  field,
  defaultValue = '',
  required = false,
  placeholder,
  className = '',
}: AutocompleteInputProps) {
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [allValues, setAllValues] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Load all unique values for this field on mount
  useEffect(() => {
    async function loadValues() {
      const { data } = await supabase
        .from('books')
        .select(field)
        .not(field, 'is', null)
        .not(field, 'eq', '')

      if (data) {
        let unique: string[] = []
        
        if (field === 'genre') {
          // Normalize to Azerbaijani and merge with defaults
          const dbGenres = data.map((row: any) => translateGenre('az', row[field] as string)).filter(Boolean)
          unique = [...new Set([...DEFAULT_GENRES_AZ, ...dbGenres])]
        } else {
          unique = [...new Set(data.map((row: any) => row[field] as string).filter(Boolean))]
        }
        
        unique.sort((a, b) => a.localeCompare(b, 'az'))
        setAllValues(unique)
      }
    }
    loadValues()
  }, [field])

  // Update value when defaultValue changes (for edit form loading)
  useEffect(() => {
    if (defaultValue) setValue(defaultValue)
  }, [defaultValue])

  // Filter suggestions when typing
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions(allValues)
      return
    }
    const query = value.toLowerCase()
    const filtered = allValues.filter(v =>
      v.toLowerCase().includes(query) && v.toLowerCase() !== query
    )
    setSuggestions(filtered)
  }, [value, allValues])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((val: string) => {
    setValue(val)
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setValue(e.target.value)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => {
          if (suggestions.length > 0 || allValues.length > 0) setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
        className={className}
      />

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg"
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                idx === activeIndex
                  ? 'bg-brand/10 text-brand'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
