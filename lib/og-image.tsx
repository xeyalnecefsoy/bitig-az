/* Server-only: only import from opengraph-image.tsx or other server files */
import { readFile } from 'fs/promises'
import { join } from 'path'
import { ImageResponse } from 'next/og'
import type { ReactElement } from 'react'

const BASE_URL = 'https://bitig.az'
const BRAND_COLOR = '#4AD860'
const BG_GRADIENT = 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'

/* ────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────── */

export async function getLocalImageDataUrl(path: string): Promise<string> {
  const filePath = join(process.cwd(), 'public', path)
  const buffer = await readFile(filePath)
  const ext = path.split('.').pop()?.toLowerCase()
  const contentType =
    ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

export async function fetchImageDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, { cache: 'force-cache' })
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    return `data:${contentType};base64,${buffer.toString('base64')}`
  } catch {
    return url
  }
}

export async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    ).then((res) => res.text())
    const match = css.match(/src: url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/)
    if (!match) return null
    return fetch(match[1]).then((res) => res.arrayBuffer())
  } catch {
    return null
  }
}

export async function getFonts() {
  const [regular, bold] = await Promise.all([loadFont(400), loadFont(700)])
  const fonts: { name: string; data: ArrayBuffer; style: 'normal'; weight: 400 | 700 }[] = []
  if (regular) fonts.push({ name: 'Inter', data: regular, style: 'normal', weight: 400 })
  if (bold) fonts.push({ name: 'Inter', data: bold, style: 'normal', weight: 700 })
  return fonts
}

/* ────────────────────────────────────────────────
   Low-level primitives
   ──────────────────────────────────────────────── */

export async function BitigLogo() {
  const logoSrc = await getLocalImageDataUrl('/logo.png')
  return (
    <div
      style={{
        position: 'absolute',
        top: 32,
        left: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
      }}
    >
      <img src={logoSrc} width={40} height={40} alt="" />
      <span
        style={{
          color: BRAND_COLOR,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        bitig.az
      </span>
    </div>
  )
}

export function OgWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        width: 1200,
        height: 630,
        background: BG_GRADIENT,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  )
}

export function AccentLine() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 6,
        background: BRAND_COLOR,
      }}
    />
  )
}

export function DecorativeOrb() {
  return (
    <div
      style={{
        position: 'absolute',
        top: -200,
        right: -200,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'rgba(74, 216, 96, 0.05)',
      }}
    />
  )
}

/* ────────────────────────────────────────────────
   Book / Audiobook
   ──────────────────────────────────────────────── */

export async function BookOgImage({
  title,
  author,
  cover,
  label,
}: {
  title: string
  author: string
  cover?: string | null
  label: string
}) {
  const logo = await BitigLogo()
  let coverSrc: string | undefined
  if (cover) {
    coverSrc = cover.startsWith('http')
      ? await fetchImageDataUrl(cover)
      : await getLocalImageDataUrl(cover)
  }

  const titleSize = title.length > 50 ? 38 : title.length > 30 ? 46 : 54

  return (
    <OgWrapper>
      {logo}
      <DecorativeOrb />
      <AccentLine />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 60,
          padding: '0 80px',
          marginTop: 40,
          width: '100%',
        }}
      >
        {coverSrc && (
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            }}
          >
            <img
              src={coverSrc}
              width={280}
              height={420}
              alt={title}
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: '#94a3b8',
              fontSize: 18,
              fontWeight: 400,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            {label}
          </div>
          <h1
            style={{
              color: '#ffffff',
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              wordWrap: 'break-word',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: '#cbd5e1',
              fontSize: 28,
              fontWeight: 400,
              margin: 0,
            }}
          >
            {author}
          </p>
        </div>
      </div>
    </OgWrapper>
  )
}

/* ────────────────────────────────────────────────
   Profile
   ──────────────────────────────────────────────── */

export async function ProfileOgImage({
  name,
  username,
  bio,
  avatar,
  banner,
  stats,
}: {
  name: string
  username?: string
  bio?: string
  avatar?: string | null
  banner?: string | null
  stats: string
}) {
  const logo = await BitigLogo()
  let avatarSrc: string | undefined
  if (avatar) {
    avatarSrc = avatar.startsWith('http')
      ? await fetchImageDataUrl(avatar)
      : await getLocalImageDataUrl(avatar)
  }

  return (
    <OgWrapper>
      {logo}
      <AccentLine />

      {/* Banner background (subtle) */}
      {banner && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            opacity: 0.15,
            overflow: 'hidden',
          }}
        >
          <img
            src={banner.startsWith('http') ? banner : `${BASE_URL}${banner}`}
            width={1200}
            height={280}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            alt=""
          />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          padding: '0 80px',
          marginTop: 80,
          width: '100%',
          zIndex: 2,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            display: 'flex',
            flexShrink: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '4px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          }}
        >
          {avatarSrc ? (
            <img src={avatarSrc} width={180} height={180} alt={name} style={{ objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: 180,
                height: 180,
                background: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: 64,
                fontWeight: 700,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1,
            minWidth: 0,
          }}
        >
          <h1
            style={{
              color: '#ffffff',
              fontSize: 52,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
              wordWrap: 'break-word',
            }}
          >
            {name}
          </h1>
          {username && (
            <p
              style={{
                color: BRAND_COLOR,
                fontSize: 28,
                fontWeight: 600,
                margin: 0,
              }}
            >
              @{username}
            </p>
          )}
          {bio && (
            <p
              style={{
                color: '#cbd5e1',
                fontSize: 22,
                fontWeight: 400,
                margin: 0,
                lineHeight: 1.4,
                maxHeight: 100,
                overflow: 'hidden',
              }}
            >
              {bio.slice(0, 140)}
              {bio.length > 140 ? '...' : ''}
            </p>
          )}
          <p
            style={{
              color: '#94a3b8',
              fontSize: 18,
              fontWeight: 400,
              margin: 0,
              marginTop: 8,
            }}
          >
            {stats}
          </p>
        </div>
      </div>
    </OgWrapper>
  )
}

/* ────────────────────────────────────────────────
   Post
   ──────────────────────────────────────────────── */

export async function PostOgImage({
  authorName,
  content,
  image,
}: {
  authorName: string
  content: string
  image?: string | null
}) {
  const logo = await BitigLogo()
  let imageSrc: string | undefined
  if (image) {
    imageSrc = image.startsWith('http')
      ? await fetchImageDataUrl(image)
      : await getLocalImageDataUrl(image)
  }

  const text = content.slice(0, 280)
  const textSize = text.length > 180 ? 30 : text.length > 100 ? 34 : 38

  return (
    <OgWrapper>
      {logo}
      <AccentLine />
      <DecorativeOrb />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          padding: '0 80px',
          marginTop: 40,
          width: '100%',
        }}
      >
        {imageSrc && (
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src={imageSrc}
              width={340}
              height={340}
              alt=""
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: BRAND_COLOR,
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            {authorName}
          </div>
          <p
            style={{
              color: '#f1f5f9',
              fontSize: textSize,
              fontWeight: 400,
              lineHeight: 1.4,
              margin: 0,
              wordWrap: 'break-word',
            }}
          >
            {text}
            {content.length > 280 ? '...' : ''}
          </p>
        </div>
      </div>
    </OgWrapper>
  )
}

/* ────────────────────────────────────────────────
   Group
   ──────────────────────────────────────────────── */

export async function GroupOgImage({
  name,
  description,
  icon,
  cover,
  members,
}: {
  name: string
  description?: string
  icon?: string | null
  cover?: string | null
  members?: number
}) {
  const logo = await BitigLogo()
  let iconSrc: string | undefined
  if (icon) {
    iconSrc = icon.startsWith('http')
      ? await fetchImageDataUrl(icon)
      : await getLocalImageDataUrl(icon)
  }

  return (
    <OgWrapper>
      {logo}
      <AccentLine />

      {/* Cover background */}
      {cover && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 320,
            opacity: 0.2,
            overflow: 'hidden',
          }}
        >
          <img
            src={cover.startsWith('http') ? cover : `${BASE_URL}${cover}`}
            width={1200}
            height={320}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            alt=""
          />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          padding: '0 80px',
          marginTop: 100,
          width: '100%',
          zIndex: 2,
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: 'flex',
            flexShrink: 0,
            borderRadius: 24,
            overflow: 'hidden',
            border: '3px solid rgba(255,255,255,0.15)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
          }}
        >
          {iconSrc ? (
            <img src={iconSrc} width={160} height={160} alt={name} style={{ objectFit: 'cover' }} />
          ) : (
            <div
              style={{
                width: 160,
                height: 160,
                background: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: 64,
                fontWeight: 700,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1,
            minWidth: 0,
          }}
        >
          <h1
            style={{
              color: '#ffffff',
              fontSize: 52,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.2,
              wordWrap: 'break-word',
            }}
          >
            {name}
          </h1>
          {description && (
            <p
              style={{
                color: '#cbd5e1',
                fontSize: 24,
                fontWeight: 400,
                margin: 0,
                lineHeight: 1.4,
                maxHeight: 90,
                overflow: 'hidden',
              }}
            >
              {description.slice(0, 160)}
              {description.length > 160 ? '...' : ''}
            </p>
          )}
          {typeof members === 'number' && (
            <p style={{ color: '#94a3b8', fontSize: 20, fontWeight: 500, margin: 0 }}>
              {members} üzv
            </p>
          )}
        </div>
      </div>
    </OgWrapper>
  )
}

/* ────────────────────────────────────────────────
   Blog
   ──────────────────────────────────────────────── */

export async function BlogOgImage({
  title,
  excerpt,
  image,
  readingMinutes,
}: {
  title: string
  excerpt: string
  image?: string
  readingMinutes?: number
}) {
  const logo = await BitigLogo()
  let imageSrc: string | undefined
  if (image) {
    imageSrc = image.startsWith('http')
      ? await fetchImageDataUrl(image)
      : await getLocalImageDataUrl(image)
  }

  const titleSize = title.length > 60 ? 36 : title.length > 35 ? 42 : 50

  return (
    <OgWrapper>
      {logo}
      <AccentLine />
      <DecorativeOrb />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 48,
          padding: '0 80px',
          marginTop: 40,
          width: '100%',
        }}
      >
        {imageSrc && (
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
            }}
          >
            <img
              src={imageSrc}
              width={400}
              height={260}
              alt=""
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              color: '#94a3b8',
              fontSize: 18,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Blog
          </div>
          <h1
            style={{
              color: '#ffffff',
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.2,
              margin: 0,
              wordWrap: 'break-word',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: '#cbd5e1',
              fontSize: 22,
              fontWeight: 400,
              lineHeight: 1.4,
              margin: 0,
              maxHeight: 95,
              overflow: 'hidden',
            }}
          >
            {excerpt.slice(0, 140)}
            {excerpt.length > 140 ? '...' : ''}
          </p>
          {typeof readingMinutes === 'number' && (
            <p style={{ color: '#94a3b8', fontSize: 18, fontWeight: 400, margin: 0 }}>
              {readingMinutes} dəq oxu
            </p>
          )}
        </div>
      </div>
    </OgWrapper>
  )
}

/* ────────────────────────────────────────────────
   Fallback
   ──────────────────────────────────────────────── */

export async function FallbackOgImage() {
  const logo = await BitigLogo()
  return (
    <OgWrapper>
      {logo}
      <AccentLine />
      <DecorativeOrb />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: 24,
          padding: '0 80px',
        }}
      >
        <h1
          style={{
            color: '#ffffff',
            fontSize: 56,
            fontWeight: 700,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Bitig.az
        </h1>
        <p
          style={{
            color: '#cbd5e1',
            fontSize: 28,
            fontWeight: 400,
            textAlign: 'center',
            margin: 0,
          }}
        >
          Azərbaycanın ilk yerli intellektual sosial şəbəkəsi
        </p>
      </div>
    </OgWrapper>
  )
}

/* ────────────────────────────────────────────────
   Response wrapper
   ──────────────────────────────────────────────── */

export async function createOgResponse(node: ReactElement) {
  const fonts = await getFonts()
  return new ImageResponse(node, {
    width: 1200,
    height: 630,
    fonts,
  })
}
