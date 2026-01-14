---
description: Build və deploy yoxlama workflow-u
---

# Build və Deploy Workflow

Bu workflow production-a deploy etməzdən əvvəl layihəni yoxlamaq üçündür.

// turbo-all

## Əvvəlcədən Yoxlamalar

1. **Lint yoxla**
   ```bash
   npm run lint
   ```

2. **Type errors yoxla**
   ```bash
   npx tsc --noEmit
   ```

3. **Build et**
   ```bash
   npm run build
   ```

## Build Uğurlu Oldusa

4. **Lokal olaraq test et**
   ```bash
   npm start
   ```
   
   http://localhost:3000 adresində yoxla

5. **Əsas funksionallıqları test et:**
   - [ ] Ana səhifə yüklənir
   - [ ] Kitablar səhifəsi işləyir
   - [ ] Authentication işləyir
   - [ ] Responsive dizayn düzgün görünür

6. **Commit və push et (əgər hər şey yaxşıdırsa)**
   ```bash
   git add .
   git commit -m "chore: production build ready"
   git push origin main
   ```

## Vercel Auto-Deploy

- `main` branch-ə push zamanı Vercel avtomatik deploy edir
- Deploy statusu: https://vercel.com/dashboard
- Production URL: https://bitig.az

## Build Error Həll Etmə

Əgər build error varsa:

1. Error mesajını oxu
2. Faylı tap və düzəlt
3. `npm run build` ilə yenidən yoxla
4. Uğurlu olana qədər təkrarla

### Ümumi Errorlar

**Type Error:**
```bash
npx tsc --noEmit
# Xətti və faylı göstərəcək
```

**Module Not Found:**
```bash
npm install
# və ya spesifik paket:
npm install package-name
```

**Import Error:**
- Import path-i yoxla
- Fayl mövcuddur mu yoxla
- Case-sensitivity (BookCard vs bookcard)
