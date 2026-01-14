---
description: Yeni səhifə yaratmaq üçün Next.js App Router workflow-u
---

# Yeni Səhifə Yaratma Workflow

Bu workflow Next.js App Router ilə yeni səhifə yaratmaq üçündür.

## 1. Route Strukturunu Planla

```
app/[locale]/new-page/page.tsx     # Sadə səhifə
app/[locale]/new-page/[id]/page.tsx # Dinamik route
app/[locale]/new-page/layout.tsx    # Layout (ixtiyari)
```

## 2. Səhifə Faylını Yarat

### Server Component (Default)
```typescript
// app/[locale]/new-page/page.tsx

import { translations } from '@/lib/i18n';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewPage({ params }: PageProps) {
  const { locale } = await params;
  const t = translations[locale as keyof typeof translations] || translations.az;
  
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t.page.title}
        </h1>
      </div>
    </main>
  );
}
```

### Client Component (interaktiv səhifə üçün)
```typescript
"use client";

import { useState, useEffect } from 'react';

export default function NewPage() {
  const [data, setData] = useState(null);
  
  // Client-side logic
  
  return (
    <main>...</main>
  );
}
```

## 3. i18n Əlavə Et (Lazımdırsa)

`lib/i18n.ts` faylına yeni səhifə üçün translations əlavə et:

```typescript
newPage: {
  title: 'Səhifə Başlığı',
  description: 'Səhifə təsviri'
}
```

## 4. Navigation Əlavə Et (Lazımdırsa)

Navbar və ya digər yerlərə link əlavə et:

```typescript
<Link href={`/${locale}/new-page`}>
  New Page
</Link>
```

## 5. Type Check

// turbo
```bash
npx tsc --noEmit
```

## 6. Lint Check

// turbo
```bash
npm run lint
```

## 7. Test Et

- Dev server-də yoxla
- Hər iki dildə test et (/az/new-page, /en/new-page)
- Responsive yoxla
- Dark mode yoxla

## Dinamik Route Nümunəsi

```typescript
// app/[locale]/books/[id]/page.tsx

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function BookPage({ params }: PageProps) {
  const { locale, id } = await params;
  
  // Fetch book data using id
  
  return (
    <main>
      <h1>Book #{id}</h1>
    </main>
  );
}
```

## SEO (Metadata)

```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Səhifə Başlığı | Bitig',
  description: 'Səhifə təsviri',
};

// və ya dinamik metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'az' ? 'Başlıq AZ' : 'Title EN',
  };
}
```
