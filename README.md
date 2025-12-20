# 📚 Bitig

**Bitig** — Azərbaycan dilində səsli kitablar platforması. Modern, istifadəçi dostu interfeys ilə kitabları kəşf edin, dinləyin və paylaşın.

🌐 **[bitig.az](https://bitig.az)**

---

## ✨ Xüsusiyyətlər

### 🎧 Səsli Kitablar
- Geniş Azərbaycan və dünya ədəbiyyatı kolleksiyası
- Yüksək keyfiyyətli audio streaming
- Əlfəçin və yer işarələri dəstəyi
- Offline dinləmə imkanı (tezliklə)

### 🌍 Çoxdilli Dəstək
- İki dildə tam interfeys (Azərbaycan və İngilis)
- Avtomatik dil seçimi
- Route-based locale sistemi

### 🛒 E-ticarət Funksionallığı
- Səbət və checkout sistemi
- Təhlükəsiz ödəniş inteqrasiyası
- Alış tarixçəsi və qəbzlər
- Promo kod sistemi

### 👥 Sosial Funksiyalar
- İstifadəçi profilləri və avatar sistemi
- Kitab rəyləri və qiymətləndirmələr
- Sosial paylaşım (post, like, comment)
- Kitab mention sistemi
- İzləmə (follow/unfollow) funksiyası

### 🎨 Modern UI/UX
- Responsive dizayn (mobil, tablet, desktop)
- Dark mode dəstəyi
- Premium gradient və glassmorphism effektləri
- Smooth animasiyalar
- Marka rəngi: `#4AD860` (Yaşıl)

### 🔐 Autentifikasiya
- Google OAuth ilə giriş
- Email/şifrə ilə qeydiyyat
- Təhlükəsiz session management
- Profil idarəetməsi

### ⚡ Performance
- Next.js 16 (App Router) ilə optimize edilmiş
- Server-Side Rendering (SSR)
- Image optimization
- Cloudflare R2 ilə CDN
- OPUS audio format (kiçik ölçü, yüksək keyfiyyət)

---

## 🛠 Texnologiyalar

### Frontend
- **Next.js 16** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **React Icons** - Icon library

### Backend & İnfrastruktur
- **Supabase** - Authentication & Database
- **Cloudflare R2** - Audio storage və CDN
- **Vercel** - Deployment və hosting

### Kitabxanalar
- `@supabase/ssr` - Supabase SSR support
- `@radix-ui/react-popover` - Accessible UI components
- `cmdk` - Command palette
- `use-debounce` - Input debouncing

---

## 🚀 Quraşdırma

### Tələblər
- Node.js 18.17+ və ya 20+
- npm və ya yarn

### Lokal Development

1. **Repository-ni klonlayın:**
   ```bash
   git clone https://github.com/xeyalnecefsoy/bitig-az.git
   cd bitig-az
   ```

2. **Asılılıqları quraşdırın:**
   ```bash
   npm install
   ```

3. **Environment dəyişənlərini konfiqurasiya edin:**
   
   `.env.local` faylı yaradın və lazımi API açarlarını əlavə edin.

4. **Development serverini işə salın:**
   ```bash
   npm run dev
   ```

5. **Brauzerdə açın:**
   
   [http://localhost:3000](http://localhost:3000)

---

## 📁 Layihə Strukturu

```
bitig-az/
├── app/                      # Next.js App Router
│   ├── [locale]/            # Locale-based routing (az, en)
│   │   ├── audiobooks/      # Kitab səhifələri
│   │   ├── cart/            # Səbət
│   │   ├── checkout/        # Checkout
│   │   ├── profile/         # İstifadəçi profili
│   │   ├── social/          # Sosial feed
│   │   └── admin/           # Admin panel
│   ├── api/                 # API routes
│   └── auth/                # Authentication callbacks
├── components/              # React komponentləri
├── context/                 # React Context (Cart, Social)
├── lib/                     # Utility functions
│   ├── i18n.ts             # İnternationalization
│   ├── data.ts             # Sample data
│   └── supabase/           # Supabase clients
├── public/                  # Static fayllar
└── supabase/               # Database migrations
```

---

## 📜 Skriptlər

```bash
# Development server
npm run dev

# Production build
npm run build

# Production server
npm start

# Linting
npm run lint
```

---

## 🌐 Deployment

Layihə **Vercel**-də host olunur və avtomatik deploy sistemi aktivdir:

- **Production**: [bitig.az](https://bitig.az)
- **Auto-deploy**: `main` branch-ə push zamanı avtomatik deploy

---

## 📱 SEO & PWA

- Meta tags və Open Graph dəstəyi
- Sitemap və robots.txt
- JSON-LD structured data
- Progressive Web App (PWA) hazır
- Favicon və app icons

---

## 🔒 Təhlükəsizlik

- Supabase Row Level Security (RLS) policies
- CORS konfiqurasiyası
- Secure authentication
- Input validation
- XSS prevention

---

## 🎯 Gələcək Planlar

- [ ] Mobil aplikasiya (React Native)
- [ ] Offline dinləmə dəstəyi
- [ ] Podcast inteqrasiyası
- [ ] AI-powered tövsiyələr
- [ ] Advanced search və filterlər
- [ ] Müəllif paneli
- [ ] Subscription planları

---

## 🤝 Töhfə

Pull request və issue-lər xoş qarşılanır! Böyük dəyişikliklər üçün əvvəlcə issue açaraq nə dəyişdirmək istədiyinizi müzakirə edin.

---

## 📄 Lisenziya

Bu layihə şəxsi istifadə üçündür.

---

## 📧 Əlaqə

Suallar və təkliflər üçün:
- **Website**: [bitig.az](https://bitig.az)
- **GitHub**: [@xeyalnecefsoy](https://github.com/xeyalnecefsoy)

---

<div align="center">
  <p>💚 Azərbaycan dilində səsli kitablarla tanış olun</p>
  <p><strong>Bitig</strong> — Kitablar dinlənilmək üçündür</p>
</div>
