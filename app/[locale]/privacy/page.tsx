import type { Locale } from '@/lib/i18n'

const LAST_UPDATED = '24.03.2026'

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const isAz = locale !== 'en'

  return (
    <div className="container-max py-10 space-y-6">
      <h1 className="text-3xl font-bold">{isAz ? 'Məxfilik Siyasəti' : 'Privacy Policy'}</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        {isAz ? 'Son yenilənmə' : 'Last updated'}: {LAST_UPDATED}
      </p>

      <div className="prose dark:prose-invert max-w-none">
        <p>
          {isAz
            ? 'Bitig (“biz”, “platforma”) istifadəçilərin məxfiliyinə hörmət edir. Bu sənəd hansı məlumatları topladığımızı, niyə topladığımızı, necə saxladığımızı və hansı hallarda paylaşdığımızı izah edir.'
            : 'Bitig (“we”, “platform”) respects user privacy. This document explains what data we collect, why we collect it, how we store it, and when we may share it.'}
        </p>

        <h3>1. {isAz ? 'Topladığımız məlumatlar' : 'Data We Collect'}</h3>
        <h4>{isAz ? '1.1 Hesab və identifikasiya məlumatları' : '1.1 Account and identity data'}</h4>
        <ul>
          <li>{isAz ? 'E-poçt ünvanı' : 'Email address'}</li>
          <li>{isAz ? 'Şifrə (birbaşa bizdə saxlanmır, auth xidməti tərəfindən idarə olunur)' : 'Password (not stored directly by us, handled by auth provider)'}</li>
          <li>{isAz ? 'Google ilə giriş zamanı profil məlumatları (məs., ad, avatar URL)' : 'Profile data received during Google sign-in (e.g., name, avatar URL)'}</li>
          <li>{isAz ? 'Qeydiyyat zamanı daxil edilən ad və yaş' : 'Name and age entered during sign-up'}</li>
        </ul>

        <h4>{isAz ? '1.2 Profil məlumatları' : '1.2 Profile data'}</h4>
        <ul>
          <li>{isAz ? 'İstifadəçi adı (username), bio' : 'Username and bio'}</li>
          <li>{isAz ? 'Avatar və banner şəkilləri' : 'Avatar and banner images'}</li>
          <li>{isAz ? 'Platformadaxili rol və reputasiya göstəriciləri' : 'Platform role and reputation-related metrics'}</li>
        </ul>

        <h4>{isAz ? '1.3 İstifadəçi məzmunu' : '1.3 User-generated content'}</h4>
        <ul>
          <li>{isAz ? 'Postlar, şərhlər, bəyənmələr, sorğular və səslər' : 'Posts, comments, likes, polls and votes'}</li>
          <li>{isAz ? 'İzləmə (follow) əlaqələri və bildirişlər' : 'Follow relationships and notifications'}</li>
          <li>{isAz ? 'Şikayət (report) məlumatları' : 'Report/moderation submissions'}</li>
          <li>{isAz ? 'Mesajlaşma məlumatları (DM məzmunu və metadata)' : 'Direct message data (content and metadata)'}</li>
        </ul>

        <h4>{isAz ? '1.4 Fayl və media məlumatları' : '1.4 File and media data'}</h4>
        <ul>
          <li>{isAz ? 'Profil və post şəkilləri' : 'Profile and post images'}</li>
          <li>{isAz ? 'Admin panel üzərindən yüklənən audio trek faylları' : 'Audio track files uploaded via admin panel'}</li>
        </ul>

        <h4>{isAz ? '1.5 Texniki və təhlükəsizlik məlumatları' : '1.5 Technical and security data'}</h4>
        <ul>
          <li>{isAz ? 'Sessiya/cookie məlumatları (girişin idarəsi üçün)' : 'Session/cookie data (for authentication)'}</li>
          <li>{isAz ? 'IP ünvanı və sorğu metadata-sı (rate limiting və anti-abuse üçün)' : 'IP address and request metadata (for rate limiting and anti-abuse)'}</li>
          <li>{isAz ? 'Xəta və sistem logları' : 'Error and system logs'}</li>
        </ul>

        <h4>{isAz ? '1.6 Analitika' : '1.6 Analytics'}</h4>
        <p>
          {isAz
            ? 'Platformada Google Analytics, Microsoft Clarity və Vercel Speed Insights istifadə olunur. Bu alətlər istifadəyə dair toplu statistikaları emal edə bilər.'
            : 'We use Google Analytics, Microsoft Clarity, and Vercel Speed Insights. These tools may process aggregated usage statistics.'}
        </p>

        <h4>{isAz ? '1.7 Mobil bildirişlər' : '1.7 Mobile notifications'}</h4>
        <p>
          {isAz
            ? 'Mobil tətbiqdə push bildiriş icazəsi soruşula və cihaz tokeni əldə oluna bilər. (Hazırda tokenin daimi saxlanması məhdud/inkişaf mərhələsində ola bilər.)'
            : 'In mobile apps, push notification permission may be requested and a device push token may be obtained. (Persistent token storage may be limited/in development.)'}
        </p>

        <h3>2. {isAz ? 'Məhdudiyyətlər və toplanmayan məlumatlar' : 'What We Do Not Collect (in current scope)'}</h3>
        <ul>
          <li>
            {isAz
              ? 'İstifadəçilərdən birbaşa “səs yazısı” toplama funksiyası hazırkı axında aktiv deyil.'
              : 'Direct end-user voice recording collection is not currently active in the main user flow.'}
          </li>
          <li>
            {isAz
              ? 'Ödəniş kartı məlumatları platforma daxilində birbaşa emal edilmir.'
              : 'Payment card details are not directly processed by the platform.'}
          </li>
        </ul>

        <h3>3. {isAz ? 'Məlumatların istifadə məqsədi' : 'Why We Use Data'}</h3>
        <ul>
          <li>{isAz ? 'Hesab yaratmaq, giriş və identifikasiya' : 'Account creation, login, and authentication'}</li>
          <li>{isAz ? 'Sosial funksiyaların işləməsi (post, şərh, mesajlaşma və s.)' : 'Social features (posts, comments, messaging, etc.)'}</li>
          <li>{isAz ? 'Təhlükəsizlik, sui-istifadənin qarşısının alınması, moderasiya' : 'Security, abuse prevention, and moderation'}</li>
          <li>{isAz ? 'Performans və məhsulun təkmilləşdirilməsi' : 'Performance monitoring and product improvement'}</li>
          <li>{isAz ? 'Qanuni öhdəliklərə əməl etmə' : 'Compliance with legal obligations'}</li>
        </ul>

        <h3>4. {isAz ? 'Məlumatların paylaşılması' : 'Data Sharing'}</h3>
        <p>
          {isAz
            ? 'Şəxsi məlumatlar satılmır. Məlumatlar yalnız xidmətin göstərilməsi üçün texniki tərəfdaşlarla, qanuni tələb olduqda səlahiyyətli orqanlarla və ya istifadəçi razılığı ilə paylaşıla bilər.'
            : 'We do not sell personal data. Data may be shared only with technical service providers to operate the service, with authorities when legally required, or with user consent.'}
        </p>

        <h3>5. {isAz ? 'İstifadə edilən üçüncü tərəf xidmətləri' : 'Third-Party Services'}</h3>
        <ul>
          <li>Supabase (auth, database, storage)</li>
          <li>Cloudflare R2 (media storage)</li>
          <li>Vercel (hosting/infrastructure)</li>
          <li>Google Analytics, Microsoft Clarity (analytics)</li>
          <li>Google OAuth (sign-in)</li>
          <li>Expo services (mobile notifications, where applicable)</li>
        </ul>

        <h3>6. {isAz ? 'İctimai məzmun barədə qeyd' : 'Public Content Notice'}</h3>
        <p>
          {isAz
            ? 'Bitig-də ictimai paylaşımlar və profil elementlərinin bir hissəsi internetdə indekslənə və axtarış sistemlərində görünə bilər.'
            : 'Public posts and some profile elements on Bitig may be indexed and appear in search engines.'}
        </p>

        <h3>7. {isAz ? 'Məlumatların saxlanması' : 'Data Retention'}</h3>
        <p>
          {isAz
            ? 'Məlumatlar hesab aktiv olduğu müddətdə və hüquqi/təhlükəsizlik tələblərinə uyğun zəruri müddətdə saxlanılır.'
            : 'Data is retained while accounts are active and as required for legal/security purposes.'}
        </p>

        <h3>8. {isAz ? 'Təhlükəsizlik' : 'Security'}</h3>
        <p>
          {isAz
            ? 'Autentifikasiya, səlahiyyət idarəsi, rate limit və digər texniki tədbirlərlə məlumatların qorunması üçün səylər göstəririk. Bununla belə, internet üzərindən ötürmədə 100% təhlükəsizlik təminatı mümkün deyil.'
            : 'We apply authentication, authorization, rate limiting, and other technical controls to protect data. However, no internet transmission is 100% secure.'}
        </p>

        <h3>9. {isAz ? 'Yaş məhdudiyyəti' : 'Children'}</h3>
        <p>
          {isAz
            ? 'Platforma 13 yaşdan aşağı istifadəçilər üçün nəzərdə tutulmayıb.'
            : 'The platform is not intended for children under 13.'}
        </p>

        <h3>10. {isAz ? 'Sizin hüquqlarınız' : 'Your Rights'}</h3>
        <p>
          {isAz
            ? 'Qanunvericiliyə uyğun olaraq məlumatlara çıxış, düzəliş, silinmə və emalın məhdudlaşdırılması kimi hüquqlara malik ola bilərsiniz.'
            : 'Depending on applicable law, you may have rights to access, correct, delete, or restrict processing of your data.'}
        </p>

        <h3 id="account-deletion">11. {isAz ? 'Hesabın və şəxsi məlumatların silinməsi' : 'Account and personal data deletion'}</h3>
        <p>
          <strong>Bitig</strong>
          {isAz
            ? ' istifadəçilərə hesablarını və əlaqəli şəxsi məlumatları silməyi tələb etmək imkanı verir. Bu proses veb və mobil tətbiqdə eynidir.'
            : ' allows users to request deletion of their account and associated personal data. The same process applies on web and in the mobile app.'}
        </p>
        <p>
          {isAz ? 'Addımlar:' : 'Steps:'}
        </p>
        <ol>
          <li>
            {isAz
              ? 'Qeydiyyatdan keçdiyiniz e-poçt ünvanından info@bitig.az ünvanına yazın.'
              : 'Send an email to info@bitig.az from the email address registered on your Bitig account.'}
          </li>
          <li>
            {isAz
              ? 'Mövzu sətirinə “Hesab silinməsi” və ya “Account deletion” yazın və mesajda Bitig istifadəçi adınızı (@username) qeyd edin.'
              : 'Use the subject line “Account deletion” or “Hesab silinməsi” and include your Bitig username (@username) in the message.'}
          </li>
          <li>
            {isAz
              ? 'Sorğuları mümkün qədər tez, adətən 30 təqvim günü ərzində emal edirik. Şübhəli təhlükəsizlik halında əlavə təsdiq istəyə bilərik.'
              : 'We process requests as soon as reasonably possible, typically within 30 calendar days. We may request additional verification in cases of suspected abuse.'}
          </li>
        </ol>
        <p>
          {isAz ? 'Silinən və ya anonimləşdirilən məlumatlar (əlaqəli olması halında):' : 'Data that will be deleted or anonymised (where applicable):'}
        </p>
        <ul>
          <li>{isAz ? 'Hesab və profil (auth qeydi, profil cədvəli)' : 'Account and profile (auth record, profile row)'}</li>
          <li>{isAz ? 'İctimai paylaşımlar, şərhlər, bəyənmələr, izləmə əlaqələri' : 'Public posts, comments, likes, follow relationships'}</li>
          <li>{isAz ? 'Birbaşa mesajlar (DM) və bildirişlər' : 'Direct messages (DMs) and in-app notifications'}</li>
          <li>{isAz ? 'Profil və post şəkilləri (əlçatan saxlama məkanlarından)' : 'Profile and post media (from our storage where applicable)'}</li>
        </ul>
        <p>
          {isAz
            ? 'Məhdud saxlana bilən məlumatlar: qanuni öhdəlik, mübahisə həlli və ya təhlükəsizlik (suistifadə qarşısı) üçün zəruri olan minimum saxlama müddətində anonimləşdirilmiş və ya məhdud log/qeydlər; ödəniş tarixçəsi üçün isə ödəniş provayderinin siyasəti tətbiq oluna bilər.'
            : 'Limited retention may apply: minimal anonymised or restricted logs where required for legal obligations, dispute resolution, or security abuse prevention; payment records may be governed by our payment provider’s policies where purchases were made.'}
        </p>

        <h3>12. {isAz ? 'Dəyişikliklər' : 'Changes to this Policy'}</h3>
        <p>
          {isAz
            ? 'Bu Məxfilik Siyasəti yenilənə bilər. Yenilənmiş versiya bu səhifədə “Son yenilənmə” tarixi ilə dərc olunur.'
            : 'This Privacy Policy may be updated. The latest version will be published on this page with an updated date.'}
        </p>
      </div>
    </div>
  )
}
