# Mobil tətbiq üçün auth konfiqurasiyası

Login və Google OAuth-in mobil tətbiqdə tam işləməsi üçün aşağıdakı addımları yerinə yetirin.

---

## 1. Environment dəyişənləri

Mobil layihənin kökündə (veb layihə ilə eyni `.env` istifadə etmirik) `.env` və ya `.env.local` faylı yaradın və Supabase açarlarını yazın:

```env
EXPO_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **EXPO_PUBLIC_SUPABASE_URL:** Supabase layihə Dashboard → Settings → API → Project URL.
- **EXPO_PUBLIC_SUPABASE_ANON_KEY:** Eyni səhifədə Project API keys → `anon` public key.

Bu fayllar `.gitignore`-dadır; commit etməyin.

---

## 2. Supabase Dashboard – Redirect URLs (vacib)

Google ilə girişdən sonra istifadəçi **mobil tətbiqə** qayıtmalıdır, vebə yox. Bunun üçün Supabase-də mobil redirect URL-lər icazəli olmalıdır.

1. [Supabase Dashboard](https://supabase.com/dashboard) açın, layihəni seçin.
2. Soldan **Authentication** → **URL Configuration**.
3. **Redirect URLs** bölməsində **Add URL** ilə aşağıdakıları **bir-bir** əlavə edin:

| İstifadə | Redirect URL |
|----------|----------------|
| Production (release build) | `bitig://**` |
| **Brauzerdə (Expo Web)** – `npx expo start` ilə brauzerdə açanda | **`http://localhost:8081/**`** – bu əlavə olunmazsa redirect veb sayta (bitig.az) gedəcək. |
| Development (Expo Go – telefon/emulator) | **Dəqiq URL lazımdır** – tətbiqdə "Google ilə daxil ol" basanda development rejimində çıxan alert-də göstərilən URL-i kopyalayıb Supabase-ə əlavə edin (məs. `exp://192.168.1.5:8081/--/auth/callback`). |

**Qeyd:** Brauzerdə test edirsinizsə, linkdə `redirect_to=http://localhost:8081/...` görünür – Supabase-də **`http://localhost:8081/**`** olmalıdır. Expo Go-da isə URL cihazın IP-si ilə fərqlənir; alert-də göstərilən dəqiq URL-i əlavə edin.

Əlavə etdikdən sonra **Save** edin.

**Əgər Google ilə girişdən sonra sizi veb sayta (bitig.az) yönləndirirsə:** Supabase siyahıda bu redirect URL-i tanımır və **Site URL**-ə (bitig.az) yönləndirir. **Brauzerdə** (localhost:8081) test edirsinizsə → Supabase-ə **`http://localhost:8081/**`** əlavə edin. Expo Go-da test edirsinizsə → alert-də göstərilən dəqiq `exp://...` URL-i əlavə edin.

---

## 3. Supabase – Google provider

Google ilə daxil olmaq üçün provider açıq olmalıdır:

1. Dashboard → **Authentication** → **Providers**.
2. **Google**-ı tapıb **Enable** edin.
3. **Client ID** və **Client Secret** (Google Cloud Console-dan) daxil edin və saxlayın.

Google Cloud Console-da:

- **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
- Application type: **Web application** (Supabase veb redirect üçün) və ya əlavə olaraq **iOS / Android** client ID-lər istifadə edə bilərsiniz.
- Authorized redirect URIs: Supabase sizə göstərəcəyi callback URL (məs. `https://XXXX.supabase.co/auth/v1/callback`) əlavə olunmalıdır.

---

## 4. Development vs production

- **Expo Go** ilə test edəndə tətbiq `exp://...` redirect URL göndərir. Supabase-də **mutləq** `exp://**` və ya dəqiq URL (məs. `exp://192.168.1.5:8081/--/auth/callback`) Redirect URLs-ə əlavə olunmalıdır; əks halda Supabase Site URL-ə (veb sayta) yönləndirir və "vebə giriş" görünür.
- **Custom scheme** (`bitig://`) **development/production build** (EAS Build, `expo run:ios` və s.) ilə işləyir. Bu rejimdə tətbiq `bitig://auth/callback` göndərir; Supabase-də `bitig://**` kifayətdir.

**Expo Go:** Development rejimində "Google ilə daxil ol" düyməsinə basanda tətbiq avtomatik olaraq istifadə olunan redirect URL-i alert ilə göstərir – bu URL-i kopyalayıb Supabase Redirect URLs-ə əlavə edin və Save edin.

---

## 5. Yoxlama siyahısı

- [ ] `.env` / `.env.local`-da `EXPO_PUBLIC_SUPABASE_URL` və `EXPO_PUBLIC_SUPABASE_ANON_KEY` təyin olunub.
- [ ] Supabase → Authentication → URL Configuration → Redirect URLs-də `bitig://**` (və lazım gələrsə `exp://...`) əlavə olunub.
- [ ] Supabase → Authentication → Providers → Google açıqdır və Client ID / Secret düzgündür.
- [ ] Tətbiqi yenidən başladıb (env dəyişəndə) Google ilə girişi yenidən sınayın.

Bu addımlardan sonra mobil tətbiqdə email/şifrə ilə giriş və qeydiyyat, həmçinin Google ilə giriş (redirect mobil app-ə qayıdır və sessiya qurulur) işləməlidir.
