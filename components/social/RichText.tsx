import Link from 'next/link'
import { Fragment } from 'react'

interface RichTextProps {
  content: string
  locale: string
  className?: string
}

export function RichText({ content, locale, className = '' }: RichTextProps) {
  if (!content) return null

  // Regex to match @username (letters, numbers, underscores)
  // We'll require it to start with whitespace or be at start of string
  const parts = content.split(/(@[a-zA-Z0-9_]{3,20})/)

  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const username = part.slice(1)
          return (
            <Link 
              key={i}
              href={`/${locale}/social/profile/${username}` as any}
              className="text-brand font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </div>
  )
}
