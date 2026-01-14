---
description: Yeni komponent yaradarkən izləniləcək addımlar
---

# Yeni Komponent Yaratma Workflow

Bu workflow Next.js + TypeScript + Tailwind ilə yeni React komponenti yaratmaq üçündür.

## Addımlar

1. **Mövcud komponentləri analiz et**
   - `components/` qovluğundakı oxşar komponentlərə bax
   - Naming convention-u öyrən
   - Stil qaydalarını anla

2. **Komponent faylını yarat**
   - `components/[ComponentName].tsx` adı ilə fayl yarat
   - PascalCase adlandırma istifadə et
   
3. **TypeScript interface-lərini təyin et**
   ```typescript
   interface ComponentNameProps {
     // Props burada
   }
   ```

4. **Komponenti implement et**
   - Funksional komponent istifadə et
   - Client komponenti üçün `"use client"` əlavə et
   - Tailwind classes istifadə et

5. **Type check et**
   // turbo
   ```bash
   npx tsc --noEmit
   ```

6. **Lint yoxla**
   // turbo
   ```bash
   npm run lint
   ```

7. **Dev server-də test et**
   - Komponenti istifadə edən səhifəni yoxla
   - Console errors yoxla
   - Responsive davranışı yoxla

## Nümunə Komponent Strukturu

```typescript
"use client";

import React from 'react';

interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
    </div>
  );
}
```

## Qaydalar
- Marka rəngi: `#4AD860` (Tailwind: custom class və ya inline style)
- Dark mode dəstəyi: `dark:` prefix istifadə et
- Responsive: `sm:`, `md:`, `lg:` breakpoints
