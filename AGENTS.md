# 📋 Bitig.az - Agent Konfiqurasiyası

Bu fayl bütün AI agent-ləri (Claude, Codex, Gemini, Cursor, Copilot) üçün universal təlimatlardır.

## 📌 Qorunmuş Fayllar və Qovluqlar

**HEÇ VAXT DƏYİŞDİRMƏ:**
- `.env.local` - API açarları və secrets
- `.git/` - Version control
- `node_modules/` - Dependencies
- `.next/` - Build output

## 🔍 Kod Dəyişiklikləri üçün Yoxlama Siyahısı

Hər kod dəyişikliyindən əvvəl:
1. [ ] Mövcud kodu oxu və konteksti anla
2. [ ] Mövcud konvensiyalara əməl et
3. [ ] TypeScript type-larını düzgün istifadə et
4. [ ] Import-ları düzgün sırala

Hər kod dəyişikliyindən sonra:
1. [ ] `npm run lint` işlət
2. [ ] `npx tsc --noEmit` işlət (type errors)
3. [ ] `npm run build` ilə build yoxla (əsas dəyişikliklər üçün)

## 🎯 Task Prioritization

### Yüksək Prioritet (Blocker)
- Build errorları
- TypeScript errors
- Authentication issues
- Database connection problems

### Orta Prioritet
- UI/UX təkmilləşdirmələri
- Performance optimization
- Code refactoring

### Aşağı Prioritet
- Comentariy əlavələri
- Sənədləşdirmə yeniləmələri
- Minor styling changes

## 📊 Kod Keyfiyyət Standartları

### TypeScript
- `any` type-ından qaçın
- Interface-ləri proper adlandır (`IUser`, `BookType` etc.)
- Optional chaining istifadə et (`?.`)
- Nullish coalescing istifadə et (`??`)

### React/Next.js
- Server components üçün `async` functions
- Client components üçün `"use client"` directive
- Loading və error states handle et
- Suspense boundaries istifadə et

### Tailwind CSS
- Tailwind class-larını consistent sıralama
- Custom colors üçün `tailwind.config.ts` istifadə et
- Dark mode: `dark:` prefix ilə

## 🧪 Test Strategiyası

Layihədə formal test framework yoxdur, amma:
1. Manual UI testing - http://localhost:3000
2. TypeScript compile check - `npx tsc --noEmit`
3. Lint check - `npm run lint`
4. Build validation - `npm run build`

## 📝 Dokumentasiya Qaydaları

- **CLAUDE.md** - Agent-lər üçün əsas təlimatlar
- **AGENTS.md** - Bu fayl, universal agent konfiqurasiyası
- **README.md** - Layihə haqqında ümumi məlumat
- **.gemini/** - Gemini-spesifik təlimatlar

## 🔄 Git Workflow

```bash
# Feature branch (ixtiyari, əsasən main-də işləyirik)
git checkout -b feature/feature-name

# Commit convention:
# feat: yeni xüsusiyyət
# fix: bug düzəltmə
# docs: sənədləşdirmə
# refactor: kod refactoring
# style: formatlaşdırma
```

## ⚡ Performance Guidelines

- Images üçün Next.js `Image` component istifadə et
- Large lists üçün virtualization düşün
- API calls üçün debounce/throttle
- Unnecessary re-renders-dən qaçın

## 🌐 i18n Guidelines

Dil faylları: `/lib/i18n.ts`

```typescript
// Düzgün istifadə:
const t = translations[locale];
return t.home.title;

// Route-larda locale:
/[locale]/page-name → /az/audiobooks
```

## 🔐 Security Checklist

- [ ] User inputs sanitize et
- [ ] SQL injection-dan qorun (Supabase RLS)
- [ ] XSS prevention (React auto-escaping)
- [ ] CSRF tokens (Supabase handles)
- [ ] Secrets `.env.local`-da saxla

---

## 🤖 Agent-Spesifik Təlimatlar

### Claude/Claude Code
- `CLAUDE.md` faylını avtomatik oxuyur
- Memory sistemi var, vacib məlumatları saxla

### OpenAI Codex
- `AGENTS.md` fayllarını izləyir
- Task-stub format istifadə edə bilər

### GitHub Copilot
- Kontekst-əsaslı təkliflər
- Comment-based prompting

### Gemini
- `.gemini/` qovluğundakı faylları oxuyur
- Multi-modal dəstək

---

*Son yenilənmə: 2026-01-15*
