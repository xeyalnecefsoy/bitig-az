---
description: Bitig.az layihəsi üzrə qazanılmış təcrübələr və proqramlaşdırma dərsləri
---

# 🧠 Bitig.az - Layihə İnsaytdarı və Dərslər

Bu sənəd Bitig.az platformasının inkişafı zamanı qarşılaşdığımız xətalar, tapdığımız həllər və tətbiq etdiyimiz ən yaxşı təcrübələri (Best Practices) ehtiva edir.

## 🔐 1. Autentifikasiya və Context İdarəçiliyi
- **Problem:** Bir neçə fərqli provider-də (Social, Audio) eyni vaxtda `onAuthStateChange` dinlənilirdi, bu da race condition və performans itkisinə səbəb olurdu.
- **Həll:** Mərkəzi unikal `AuthProvider` yaradıldı. Bütün digər provider-lər (`useAuth`) hook-u vasitəsilə sessiyanı birbaşa oradan alır.
- **Dərs:** Lazy-load və ya asinxron məlumatlarda autentifikasiya vəziyyətini həmişə tək bir mənbədən idarə et.

## 🌍 2. Next.js App Router & i18n
- **Problem:** `/favicon.ico` və ya `sw.js` kimi statik fayllar `[locale]` route-una düşəndə `t(locale, key)` funksiyası xəta verirdi.
- **Həll:** `t()` funksiyasına `locale` yoxlaması əlavə edildi (gözlənilməz locale gəldikdə `defaultLocale`-ə alternativ olunur).
- **Dərs:** i18n sistemini resilient (dayanıqlı) qur, çünki middleware bəzən hər şeyi filtrələyə bilmir.

## 🎣 3. React Hooks Qaydaları (Rules of Hooks)
- **Problem:** `FloatingPlayer`-də hook-lardan əvvəl `if (!track) return null` yoxlaması var idi, bu da "Hook order changed" xətasına səbəb olurdu.
- **Həll:** Bütün `useEffect` və `useState` hook-ları komponentin ən yuxarı hissəsinə, hər hansı asinxron və ya `if` şərtli geri dönüşlərdən əvvələ çəkildi.
- **Dərs:** Hook-ların çağırılma ardıcıllığı hər render-də eyni olmalıdır. Şərtləri daxili `useEffect` içində və ya render blokunda yoxla.

## 🎨 4. Premium UI/UX Dizayn
- **İnsayt:** Emojilər (📖, 🎯) tətbiqi sadə və qeyri-peşəkar göstərir.
- **Həll:** `react-icons` (xüsusilə Feather Icons - `fi`) istifadəsi və ikonlara yumşaq rəngli fonlar (`bg-brand/10`) vermək dizaynı bir neçə səviyyə yuxarı qaldırır.
- **Dərs:** Müasir platformalarda minimalist vektor ikonlar və glassmorphism (backdrop-blur) daha premium hiss yaradır.

## 🏗️ 5. Database vs Local Data Sync
- **Problem:** `lib/data.ts`-dəki məlumatlarla Supabase-dəki məlumatlar fərqli idi, bu da UI-da təkrarlanmalara və şəkil xətalarına gətirib çıxarırdı.
- **Həll:** `fix_books.sql` kimi xüsusi skriptlərlə bazanı mütəmadi olaraq local data ilə sinxronlaşdırmalı və köhnə datanı təmizləməli (cleanup).
- **Dərs:** Database-i proyektin sümükləri hesab et, oradakı sütun adları (`sort_order` vs `position`) həmişə front-end modelləri ilə eyni olmalıdır.

## 🛠️ 6. Audio Proqres İzləmə
- **Həll:** İstifadəçinin dinləmə proqresini hər 30 saniyədən bir asinxron olaraq Supabase-ə yazan `useListeningProgress` hook-u yaradıldı. Bu, həm "Davam et" bölməsini, həm də Gamification (xp, streak) sistemini qidalandırır.
