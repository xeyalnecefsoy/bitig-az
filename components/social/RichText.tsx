"use client"
import Link from 'next/link'
import { Fragment, useState } from 'react'

interface RichTextProps {
  content: string
  locale: string
  className?: string
  truncateLimit?: number
}

// Matches:
// 1. `backticks`
// 2. @mentions
// 3. URLs starting with http:// or https://
// 4. URLs starting with www.
// 5. Bare domains like danyeri.az, example.net (word.domain)
const URL_REGEX = /(`[^`]+`|@[a-zA-Z0-9_]{3,20}|https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}(?:\/[^\s]*)?)/g;

export function RichText({ content, locale, className = '', truncateLimit }: RichTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content) return null

  let displayContent = content
  let isTruncated = false

  if (!isExpanded) {
    let breakIndex = -1;
    if (truncateLimit && content.length > truncateLimit) {
      breakIndex = truncateLimit;
    }
    
    // Check for excessive newlines (e.g., more than 6 lines)
    if (truncateLimit) {
      let newlineCount = 0;
      for (let i = 0; i < content.length; i++) {
          if (content[i] === '\n') {
              newlineCount++;
              if (newlineCount > 6) {
                  if (breakIndex === -1 || i < breakIndex) {
                      breakIndex = i;
                  }
                  break;
              }
          }
      }
    }

    if (breakIndex !== -1 && breakIndex < content.length) {
      // Avoid breaking mid-word if possible
      const nextSpace = content.indexOf(' ', breakIndex);
      const nextNewline = content.indexOf('\n', breakIndex);
      let safeBreak = breakIndex;
      
      if (nextSpace !== -1 && nextSpace - breakIndex < 30) {
          safeBreak = nextSpace;
      }
      if (nextNewline !== -1 && nextNewline < safeBreak) {
          safeBreak = nextNewline;
      }

      displayContent = content.slice(0, safeBreak).trim() + '... '
      isTruncated = true
    }
  }

  const parts = displayContent.split(URL_REGEX)

  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (!part) return null;

        // 1. Markdown-like inline code (to escape links)
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code 
              key={i} 
              className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-sm font-mono text-neutral-800 dark:text-neutral-200 break-words"
            >
              {part.slice(1, -1)}
            </code>
          )
        }

        // 2. Mentions
        if (part.startsWith('@')) {
          const username = part.slice(1)
          return (
            <Link 
              key={i}
              href={`/${locale}/social/profile/${username}` as any}
              className="text-brand font-medium hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          )
        }

        // 3. URLs and Domains
        if (
          part.startsWith('http') || 
          part.startsWith('www.') || 
          /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}/.test(part)
        ) {
          // If the part ends with a common sentence-ending punctuation, remove it from the link
          const lastChar = part[part.length - 1];
          const hasPunctuation = ['.', ',', '!', '?', ';', ':', ')', '}'].includes(lastChar);
          
          let cleanUrl = part;
          let suffix = '';
          
          if (hasPunctuation) {
            cleanUrl = part.slice(0, -1);
            suffix = lastChar;
          }

          let href = cleanUrl;
          if (cleanUrl.startsWith('www.')) {
            href = `https://${cleanUrl}`;
          } else if (!cleanUrl.startsWith('http')) {
            href = `https://${cleanUrl}`;
          }
          
          return (
            <Fragment key={i}>
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand hover:underline break-all" 
                onClick={e => e.stopPropagation()}
              >
                {cleanUrl}
              </a>
              {suffix}
            </Fragment>
          )
        }

        // 4. Normal text
        return <Fragment key={i}>{part}</Fragment>
      })}
      
      {isTruncated && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(true); }}
          className="text-brand font-medium hover:underline ml-1"
        >
          {locale === 'az' ? 'Daha çox' : 'Read more'}
        </button>
      )}
      
      {isExpanded && truncateLimit && (content.length > truncateLimit || (content.match(/\n/g) || []).length > 6) && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(false); }}
          className="text-brand font-medium hover:underline ml-1 block mt-2"
        >
          {locale === 'az' ? 'Daha az' : 'Show less'}
        </button>
      )}
    </div>
  )
}
