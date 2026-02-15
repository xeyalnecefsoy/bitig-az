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
  // We'll split by capturing group. 
  // We want to match @username when it's at start or preceded by space
  // But split() captures the separators.
  // A simpler approach is to split by space and then checking tokens, but that loses whitespace preservation.
  // Let's stick to split regex but be more specific if possible.
  // Actually the current one `(@[a-zA-Z0-9_]{3,20})` is decent but doesn't check boundaries.
  // Improved: `((?<=^|\s)@[a-zA-Z0-9_]{3,20})` - lookbehind might not be supported in all browsers target.
  // Let's just use the current one but filter in map.
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
