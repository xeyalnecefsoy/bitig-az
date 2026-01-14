# 📚 Bitig.az - Agent Təlimatları

Bu fayl AI agent-lərin (Claude, Gemini, Cursor, Copilot və s.) layihə ilə effektiv işləməsi üçün təlimatlar ehtiva edir.

## 🏗️ Layihə Struktur Məlumatları

### Texnologiya Stack-i
- **Framework**: Next.js 16 (App Router)
- **Dil**: TypeScript
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **Hosting**: Vercel
- **Storage**: Cloudflare R2

### Əsas Dizayn Qaydaları
- **Marka Rəngi**: `#4AD860` (Yaşıl)
- **Tema**: Dark mode dəstəyi
- **Stil**: Premium gradient, glassmorphism effektləri
- **Dillər**: Azərbaycan (az) və İngilis (en) - i18n sistemi

## 🔧 Tez-Tez İstifadə Olunan Əmrlər

### Development
```bash
# Development serverini başlat
npm run dev

# Production build
npm run build

# Linting
npm run lint

# Type check
npx tsc --noEmit
```

### Git İş Axını
```bash
# Status yoxla
git status

# Dəyişiklikləri əlavə et
git add .

# Commit et (mənalı mesajla)
git commit -m "feat: xüsusiyyətin qısa təsviri"

# Push et
git push origin main
```

### Supabase (Database migrasiyaları)
```bash
# Migration faylları: supabase/migrations/
# Master migration: supabase/migrations/master_migration.sql
```

## 📁 Fayl Strukturu Xülasəsi

```
bitig-az/
├── app/                      # Next.js App Router
│   ├── [locale]/            # Locale routing (az, en)
│   │   ├── audiobooks/      # Kitab səhifələri
│   │   ├── cart/            # Səbət
│   │   ├── checkout/        # Checkout
│   │   ├── profile/         # İstifadəçi profili
│   │   ├── social/          # Sosial feed & profillər
│   │   └── admin/           # Admin panel
│   ├── api/                 # API routes
│   └── auth/callback/       # Supabase OAuth callback
├── components/              # React komponentləri
├── context/                 # React Context (Cart, Social, Auth)
├── lib/                     # Utility functions
│   ├── i18n.ts             # Internationalization
│   ├── data.ts             # Sample data
│   └── supabase/           # Supabase clients
├── public/                  # Static fayllar
└── supabase/migrations/     # Database migrations
```

## 🎨 Kod Stili Qaydaları

### TypeScript/React
- Funksional komponentlər istifadə et
- Type-lar üçün interface istifadə et
- `use client` direktivini lazım olduqda əlavə et
- Componentləri kiçik və təkrar istifadə edilə bilən saxla

### Adlandırma Qaydaları
- **Components**: PascalCase (`BookCard.tsx`)
- **Hooks**: camelCase, `use` prefiksi ilə (`useAuth.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Routes**: kebab-case (`/audiobooks/[id]`)

### Import Sırası
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Utilities/hooks
5. Types
6. Styles

## 🔐 Supabase Auth Flow

OAuth callback yolu: `/auth/callback/route.ts`

Autentifikasiya konteksti: `/context/AuthContext.tsx`

Server-side supabase client: `/lib/supabase/server.ts`
Client-side supabase client: `/lib/supabase/client.ts`

## 🌍 i18n (Internationalization)

Dillər: `az` (Azərbaycan), `en` (İngilis)

i18n faylı: `/lib/i18n.ts`

Route format: `/[locale]/page-name` (məs: `/az/audiobooks`)

## ⚠️ Kritik Xatırlatmalar

1. **HEÇBIR ZAMAN** `.env.local` faylını commit etmə
2. **HEÇBIR ZAMAN** API açarlarını kod içində hardcode etmə
3. Build-dən əvvəl **HƏMIŞƏ** `npm run lint` işlət
4. Supabase RLS policy-lərini yenilədikdən sonra test et
5. Production push-dan əvvəl `npm run build` ilə yoxla

## 🐛 Debugging Tips

### Build Errorları
```bash
# Type errorlarını tap
npx tsc --noEmit

# Detailed error log
npm run build 2>&1 | head -100
```

### Supabase Issues
```bash
# Supabase status yoxla
# Dashboard: https://app.supabase.com
```

## 📝 Commit Mesaj Formatı

```
type(scope): qısa təsvir

Uzun təsvir (əgər lazımdırsa)
```

Types:
- `feat`: Yeni xüsusiyyət
- `fix`: Bug fix
- `docs`: Sənədləşdirmə
- `style`: Kod formatı (funksionallığa təsir etməz)
- `refactor`: Refactoring
- `test`: Test əlavə etmə
- `chore`: Build/dependency yeniləmələri

## 🔄 Agent İş Axını Best Practices

1. **Əvvəlcə anla**: Faylları redaktə etməzdən əvvəl mövcud kodu oxu
2. **Konvensiyaları izlə**: Mövcud kod stilinə uy
3. **Kiçik addımlar**: Böyük dəyişiklikləri kiçik hissələrə böl
4. **Test et**: Dəyişikliklərdən sonra build və lint işlət
5. **Sənədləşdir**: Mürəkkəb dəyişiklikləri izah et

---

*Bu fayl agent-lərin daha effektiv işləməsi üçün avtomatik oxunur. Yeni əmrlər və ya qaydalar tapdıqda burada saxlamağı təklif et.*
