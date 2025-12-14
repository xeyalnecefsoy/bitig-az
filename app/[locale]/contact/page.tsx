
import { t, type Locale } from '@/lib/i18n'

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  return (
    <div className="container-max py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Bizimlə Əlaqə</h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl">
          Sualınız var? Təklifiniz var? Yoxsa sadəcə salam vermək istəyirsiniz?
          Aşağıdakı vasitələrlə bizimlə əlaqə saxlaya bilərsiniz.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-xl font-semibold mb-4">Əlaqə Məlumatları</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-brand/10 text-brand rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div>
                  <h4 className="font-medium">Telefon</h4>
                  <p className="text-neutral-600 dark:text-neutral-400">+994 50 123 45 67</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-brand/10 text-brand rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                </div>
                <div>
                  <h4 className="font-medium">E-poçt</h4>
                  <p className="text-neutral-600 dark:text-neutral-400">info@bitig.az</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-brand/10 text-brand rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div>
                  <h4 className="font-medium">Ünvan</h4>
                  <p className="text-neutral-600 dark:text-neutral-400">Bakı şəhəri, Azərbaycan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Optional: Add a contact form here later if needed */}
          <div className="bg-neutral-100 dark:bg-neutral-800 p-8 rounded-2xl h-full flex items-center justify-center text-center">
            <div>
               <h3 className="text-xl font-semibold mb-2">Sosial Media</h3>
               <p className="text-neutral-600 dark:text-neutral-400 mb-6">Bizi sosial şəbəkələrdə izləyin</p>
               <div className="flex gap-4 justify-center">
                  {/* Social icons placeholders */}
                  <a href="#" className="p-3 bg-white dark:bg-neutral-900 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition">Instagram</a>
                  <a href="#" className="p-3 bg-white dark:bg-neutral-900 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition">Facebook</a>
                  <a href="#" className="p-3 bg-white dark:bg-neutral-900 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition">Twitter</a>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
