# 🤖 Gemini Agent Konfiqurasiyası

Bu fayl Google Gemini AI üçün xüsusi təlimatları ehtiva edir.

## Layihə Haqqında

**Bitig.az** - Azərbaycan dilində səsli kitablar platforması
- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Supabase (Auth & Database)
- Vercel (Hosting)

## Tərtibat Əmrləri

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type check
```

## Əsas Fayl Yolları

- `/app/[locale]/` - Səhifələr (az, en dillər)
- `/components/` - React komponentləri
- `/lib/supabase/` - Supabase client-ləri
- `/lib/i18n.ts` - Dil translations
- `/context/` - React Context providers

## Kod Qaydaları

1. **TypeScript** - Hər yerdə proper typing
2. **Tailwind** - Inline styles əvəzinə class-lar
3. **i18n** - Hardcoded text yox, translations istifadə et
4. **Dark Mode** - Hər komponenti `dark:` class-ları ilə

## Supabase

- Server: `/lib/supabase/server.ts`
- Client: `/lib/supabase/client.ts`
- Migrations: `/supabase/migrations/`

## Marka Rəngi

- Primary: `#4AD860` (Yaşıl)
- Dark mode-da kontrast üçün `emerald` çalarları

## Agent İş Strategiyası

1. Əvvəlcə mövcud kodu oxu
2. Konvensiyaları izlə
3. Kiçik, focused dəyişikliklər et
4. Type check və lint ilə yoxla
5. Build-i sındırma

## Performance Guidelines

- Lighthouse fix-ləri: `.gemini/lighthouse-fixes.md`
- Image: Next.js `<Image>` component
- Font: Inter with `display: 'swap'`
