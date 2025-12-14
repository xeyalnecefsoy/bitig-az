
import { t, type Locale } from '@/lib/i18n'

export default async function RefundPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  return (
    <div className="container-max py-10 space-y-6">
      <h1 className="text-3xl font-bold">Geri Qaytarma Şərtləri</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        Son yenilənmə tarixi: {new Date().toLocaleDateString('az-AZ')}
      </p>

      <div className="prose dark:prose-invert max-w-none">
        <h3>1. Ümumi Şərtlər</h3>
        <p>
          Bitig platformasında aldığınız rəqəmsal məhsullar (səsli kitablar) dərhal çatdırıldığı üçün,
          adətən geri qaytarılmır. Lakin, müəyyən istisnalar mövcuddur.
        </p>

        <h3>2. Geri Qaytarma Halları</h3>
        <p>
          Aşağıdakı hallarda geri qaytarma tələb edə bilərsiniz:
        </p>
        <ul>
          <li>Fayl zədəlidirsə və ya oxunmursa.</li>
          <li>Səhv məhsul almısınızsa (dinləməyə başlamamısınızsa).</li>
          <li>Texniki problemlər səbəbindən məhsuldan istifadə edə bilmirsinizsə.</li>
        </ul>

        <h3>3. Müraciət Prosesi</h3>
        <p>
          Geri qaytarma tələbi üçün alış tarixindən etibarən 14 gün ərzində bizimlə əlaqə saxlamalısınız.
          Müraciətinizə 3 iş günü ərzində baxılacaq.
        </p>

        <h3>4. Əlaqə</h3>
        <p>
          Geri qaytarma ilə bağlı suallarınız üçün <a href={`/${locale}/contact`}>bizimlə əlaqə</a> saxlayın.
        </p>
      </div>
    </div>
  )
}
