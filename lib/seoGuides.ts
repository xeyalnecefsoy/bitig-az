import type { Locale } from "@/lib/i18n";

type Localized<T> = Record<Locale, T>;

export type SeoGuide = {
  slug: string;
  title: Localized<string>;
  description: Localized<string>;
  excerpt: Localized<string>;
  keywords: Localized<string[]>;
  sections: Array<{
    heading: Localized<string>;
    paragraphs: Localized<string[]>;
  }>;
  faq: Array<{
    question: Localized<string>;
    answer: Localized<string>;
  }>;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
};

export const seoGuides: SeoGuide[] = [
  {
    slug: "sesli-kitab-nedir",
    title: {
      az: "Səsli kitab nədir? Yeni başlayanlar üçün qısa bələdçi",
      en: "What is an audiobook? A practical beginner guide",
    },
    description: {
      az: "Səsli kitabın nə olduğunu, niyə populyarlaşdığını və gündəlik həyatda necə istifadə edilə biləcəyini öyrənin.",
      en: "Learn what an audiobook is, why it is popular, and how it fits into everyday life.",
    },
    excerpt: {
      az: "Səsli kitab oxumağın alternativi deyil, yeni bir dinləmə təcrübəsidir. Bu bələdçidə əsas anlayışları sadə dildə izah edirik.",
      en: "Audiobooks are not just a replacement for reading, they are a different listening experience. This guide explains the basics clearly.",
    },
    keywords: {
      az: ["səsli kitab nədir", "audiokitab", "kitab dinləmək", "bitig"],
      en: ["what is an audiobook", "audiobook basics", "listen to books", "bitig"],
    },
    sections: [
      {
        heading: {
          az: "Səsli kitab anlayışı",
          en: "The audiobook concept",
        },
        paragraphs: {
          az: [
            "Səsli kitab, yazılı mətnin peşəkar və ya müəllif tərəfindən səsləndirilmiş versiyasıdır. İstifadəçi kitabı ekrandan oxumaq əvəzinə qulaq asaraq qəbul edir.",
            "Bu format xüsusilə yolda, idman zamanı və gündəlik işlərdə vaxtı daha səmərəli istifadə etməyə kömək edir.",
          ],
          en: [
            "An audiobook is a narrated version of written text, recorded by a professional voice actor or the author. Instead of reading on screen, the listener follows the content by audio.",
            "This format is especially useful while commuting, exercising, or doing routine tasks.",
          ],
        },
      },
      {
        heading: {
          az: "Niyə bu qədər sevilir?",
          en: "Why do people love it?",
        },
        paragraphs: {
          az: [
            "Səsli kitablar çox vaxt qənaəti yaradır, çünki dinləmə ilə digər sadə işləri eyni anda etmək mümkündür.",
            "Düzgün səsləndirmə hekayəni daha emosional və yadda qalan edir, xüsusən bədii əsərlərdə.",
          ],
          en: [
            "Audiobooks save time because listening can happen in parallel with simple daily activities.",
            "Great narration can make stories more emotional and memorable, especially in fiction.",
          ],
        },
      },
    ],
    faq: [
      {
        question: {
          az: "Səsli kitab oxumağın yerini tam tuturmu?",
          en: "Do audiobooks fully replace reading?",
        },
        answer: {
          az: "Xeyr. Hər iki formatın üstünlükləri fərqlidir. Bir çox istifadəçi yazılı kitab və səsli kitabı birlikdə istifadə edir.",
          en: "No. Both formats have different strengths, and many people combine print or e-books with audiobooks.",
        },
      },
      {
        question: {
          az: "Yeni başlayanlar üçün hansı janr daha uyğundur?",
          en: "Which genre is best for beginners?",
        },
        answer: {
          az: "Qısa müddətli hekayələr, şəxsi inkişaf və ya maraqlı memuarlar yaxşı başlanğıc seçimidir.",
          en: "Short stories, self-development titles, or engaging memoirs are usually a good starting point.",
        },
      },
    ],
    readingMinutes: 4,
    publishedAt: "2026-03-08",
    updatedAt: "2026-03-08",
  },
  {
    slug: "bitig-nedir",
    title: {
      az: "Bitig nədir? Platformanın əsas imkanları",
      en: "What is Bitig? Core features of the platform",
    },
    description: {
      az: "Bitig platformasında səsli kitabları necə kəşf etmək, dinləmək və icma ilə əlaqə qurmaq mümkün olduğunu öyrənin.",
      en: "Discover how Bitig helps people find audiobooks, listen smoothly, and connect with a reading community.",
    },
    excerpt: {
      az: "Bitig sadəcə kitab kataloqu deyil. O, dinləmə təcrübəsi və sosial oxucu icmasını birləşdirən müasir platformadır.",
      en: "Bitig is more than a catalog. It combines audiobook listening with a social community for readers and listeners.",
    },
    keywords: {
      az: ["bitig nədir", "bitig az", "azərbaycanca səsli kitab", "audiokitab platforması"],
      en: ["what is bitig", "bitig platform", "azerbaijani audiobook app", "audiobook community"],
    },
    sections: [
      {
        heading: {
          az: "Bitig-in məqsədi",
          en: "Bitig's mission",
        },
        paragraphs: {
          az: [
            "Bitig Azərbaycan dilində keyfiyyətli səsli kitab təcrübəsini hər kəs üçün əlçatan etməyi hədəfləyir.",
            "Platforma həm yeni dinləyicilər, həm də davamlı kitab sevərlər üçün sadə və rahat interfeys təqdim edir.",
          ],
          en: [
            "Bitig aims to make high-quality Azerbaijani audiobook experiences accessible to everyone.",
            "The platform offers a simple and comfortable interface for both new and regular listeners.",
          ],
        },
      },
      {
        heading: {
          az: "Əsas funksiyalar",
          en: "Main capabilities",
        },
        paragraphs: {
          az: [
            "Bitig-də janr, müəllif və müxtəlif filtrlərlə kitab tapmaq asandır. Dinləmə təcrübəsi mobil və masaüstündə optimallaşdırılıb.",
            "Bundan əlavə, sosial bölmə vasitəsilə istifadəçilər müzakirələrə qoşula və yeni kitab tövsiyələri ala bilir.",
          ],
          en: [
            "Bitig makes discovery easy with filters by genre, author, and other listening preferences. The experience is optimized for both mobile and desktop.",
            "In addition, the social area helps users join discussions and discover new recommendations.",
          ],
        },
      },
    ],
    faq: [
      {
        question: {
          az: "Bitig-də kitabları pulsuz dinləmək mümkündürmü?",
          en: "Can I listen to books for free on Bitig?",
        },
        answer: {
          az: "Bəli, platformada pulsuz dinlənə bilən kitablar mövcuddur. Həmçinin ödənişli kitablar üçün də seçimlər təqdim edilir.",
          en: "Yes, Bitig includes free audiobooks, while also offering paid titles for wider content choices.",
        },
      },
      {
        question: {
          az: "Bitig-ə niyə hesabla daxil olmaq lazımdır?",
          en: "Why should I sign in to Bitig?",
        },
        answer: {
          az: "Hesab şəxsi kitabxana, səbət, sosial funksiyalar və dinləmə prosesinin daha rahat idarəsi üçün vacibdir.",
          en: "An account enables personal library features, cart access, social actions, and a smoother listening workflow.",
        },
      },
    ],
    readingMinutes: 5,
    publishedAt: "2026-03-08",
    updatedAt: "2026-03-08",
  },
  {
    slug: "azerbaycanca-sesli-kitablar",
    title: {
      az: "Azərbaycanca səsli kitablar: nəyi, necə seçməli?",
      en: "Azerbaijani audiobooks: what to choose and how",
    },
    description: {
      az: "Azərbaycanca səsli kitab seçimində janr, səsləndirmə keyfiyyəti və dinləmə məqsədi kimi əsas meyarları öyrənin.",
      en: "Learn the key criteria for choosing Azerbaijani audiobooks, including genre, narration quality, and listening goals.",
    },
    excerpt: {
      az: "Doğru kitab seçimi dinləmə vərdişini formalaşdırır. Bu yazı ilə özünüzə uyğun azərbaycanca səsli kitab tapmaq daha asan olacaq.",
      en: "The right first choice builds the listening habit. This guide helps you pick Azerbaijani audiobooks that match your goals.",
    },
    keywords: {
      az: ["azərbaycanca səsli kitablar", "səsli kitab seçimi", "audiokitab platforması", "bitig"],
      en: ["azerbaijani audiobooks", "how to choose audiobooks", "audiobook recommendations", "bitig"],
    },
    sections: [
      {
        heading: {
          az: "Məqsədə görə seçim",
          en: "Choose by purpose",
        },
        paragraphs: {
          az: [
            "Əgər məqsədiniz öyrənməkdirsə, şəxsi inkişaf, biznes və tarix janrları yaxşı seçimdir.",
            "Əgər istirahət etmək istəyirsinizsə, bədii ədəbiyyat, roman və fantastika daha uyğun ola bilər.",
          ],
          en: [
            "If your goal is learning, self-development, business, and history can be strong choices.",
            "If your goal is relaxation, fiction, novels, and fantasy are often a better fit.",
          ],
        },
      },
      {
        heading: {
          az: "Səsləndirmə keyfiyyətini necə qiymətləndirmək olar?",
          en: "How to evaluate narration quality",
        },
        paragraphs: {
          az: [
            "Səsləndiricinin tələffüzü, tempi və vurğuları məzmunu daha rahat qəbul etməyə təsir edir.",
            "Mümkünsə, tam kitaba keçməzdən əvvəl qısa nümunə dinləyin. Bu, uyğunluğu tez anlamağa kömək edir.",
          ],
          en: [
            "Narrator pronunciation, pacing, and emphasis directly influence comprehension and enjoyment.",
            "If available, listen to a short sample before starting the full title to check fit quickly.",
          ],
        },
      },
    ],
    faq: [
      {
        question: {
          az: "Azərbaycanca səsli kitablar hansı səviyyələr üçün uyğundur?",
          en: "Are Azerbaijani audiobooks suitable for all levels?",
        },
        answer: {
          az: "Bəli. Sadə dildən klassik üsluba qədər müxtəlif səviyyələrdə kitablar mövcuddur.",
          en: "Yes. Content ranges from simple language to advanced literary styles.",
        },
      },
      {
        question: {
          az: "Bir kitabı neçə günə bitirmək realdır?",
          en: "How quickly can I finish one audiobook?",
        },
        answer: {
          az: "Bu, gündəlik dinləmə vaxtından asılıdır. Gündə 20-30 dəqiqə dinləmə ilə orta kitabı bir neçə günə bitirmək mümkündür.",
          en: "It depends on your daily listening routine. With 20-30 minutes per day, many average-length books can be finished in a few days.",
        },
      },
    ],
    readingMinutes: 6,
    publishedAt: "2026-03-08",
    updatedAt: "2026-03-08",
  },
  {
    slug: "seslendirme-nece-olur",
    title: {
      az: "Səsləndirmə necə olur? Audiokitabın hazırlanma prosesi",
      en: "How narration works: audiobook production explained",
    },
    description: {
      az: "Audiokitab səsləndirməsinin mərhələlərini, studiya işini və keyfiyyət üçün vacib texniki detalları sadə şəkildə izah edirik.",
      en: "Understand audiobook narration stages, studio workflow, and key quality details in a clear format.",
    },
    excerpt: {
      az: "Yaxşı audiokitab təsadüfi yaranmır. Mətn hazırlığından montaja qədər hər mərhələ dinləmə keyfiyyətinə birbaşa təsir edir.",
      en: "Great audiobooks are not accidental. From script prep to editing, each step shapes the final listening quality.",
    },
    keywords: {
      az: ["səsləndirmə necə olur", "audiokitab səsləndirmə", "narrator işi", "bitig"],
      en: ["audiobook narration process", "how audiobooks are recorded", "narrator workflow", "bitig"],
    },
    sections: [
      {
        heading: {
          az: "Hazırlıq mərhələsi",
          en: "Preparation phase",
        },
        paragraphs: {
          az: [
            "Səsləndirmədən əvvəl mətn redaktə edilir, tələffüz qeydləri hazırlanır və personaj tonları planlaşdırılır.",
            "Bu mərhələ düzgün aparıldıqda sonradan montaj və düzəliş ehtiyacı azalır.",
          ],
          en: [
            "Before recording, the script is prepared, pronunciation notes are documented, and character tones are planned.",
            "Strong preparation reduces editing complexity later in production.",
          ],
        },
      },
      {
        heading: {
          az: "Yazı və post-prodakşn",
          en: "Recording and post-production",
        },
        paragraphs: {
          az: [
            "Səs yazısı studiyada və ya uyğun akustik mühitdə aparılır. Ardınca nəfəs səsləri, pauzalar və texniki qüsurlar təmizlənir.",
            "Sonda yekun mastering ilə səs səviyyəsi balanslanır və dinləyici üçün sabit keyfiyyət təmin olunur.",
          ],
          en: [
            "Recording is done in a studio or controlled acoustic space, then cleaned for breathing noise, pauses, and technical artifacts.",
            "Final mastering balances loudness to provide a stable listening experience across devices.",
          ],
        },
      },
    ],
    faq: [
      {
        question: {
          az: "Bir audiokitabın səsləndirilməsi nə qədər vaxt aparır?",
          en: "How long does audiobook narration take?",
        },
        answer: {
          az: "Mətnin uzunluğuna və prodakşn standartına görə dəyişir. Qısa kitablar bir neçə günə, daha böyük layihələr həftələrə tamamlanır.",
          en: "It varies by script length and production standards. Short projects may take days, while larger ones can take weeks.",
        },
      },
      {
        question: {
          az: "Yaxşı səsləndirməni necə tanımaq olar?",
          en: "How can I spot high-quality narration?",
        },
        answer: {
          az: "Səsləndirmə aydın, ritmik və məzmuna uyğun emosional olmalıdır. Texniki səs qüsurları minimum olmalıdır.",
          en: "Good narration is clear, well-paced, and emotionally aligned with the text, with minimal technical noise.",
        },
      },
    ],
    readingMinutes: 5,
    publishedAt: "2026-03-08",
    updatedAt: "2026-03-08",
  },
];

export function getSeoGuideBySlug(slug: string): SeoGuide | undefined {
  return seoGuides.find((guide) => guide.slug === slug);
}
