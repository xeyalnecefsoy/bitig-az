
import { t, type Locale } from '@/lib/i18n'

export default async function TermsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  return (
    <div className="container-max py-10 space-y-6">
      <h1 className="text-3xl font-bold">İstifadəçi Şərtləri</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        Son yenilənmə tarixi: {new Date().toLocaleDateString('az-AZ')}
      </p>

      <div className="prose dark:prose-invert max-w-none">
        <h3>1. Giriş</h3>
        <p>
          Bitig platformasına xoş gəlmisiniz. Bu şərtlər sizin platformamızdan istifadənizi tənzimləyir.
          Xidmətlərimizdən istifadə edərək bu şərtləri qəbul etmiş olursunuz.
        </p>

        <h3>2. Xidmətlərdən İstifadə</h3>
        <p>
          Platformadan yalnız qanuni məqsədlər üçün istifadə etməlisiniz. Başqalarının hüquqlarını pozan,
          təhqiramiz və ya qanunsuz məzmun paylaşmaq qadağandır.
        </p>

        <h3>3. Hesab Təhlükəsizliyi</h3>
        <p>
          Hesabınızın təhlükəsizliyini qorumaq sizin məsuliyyətinizdədir. Şifrənizi gizli saxlayın və
          üçüncü şəxslərlə paylaşmayın.
        </p>

        <h3>4. Əqli Mülkiyyət</h3>
        <p>
          Platformada mövcud olan bütün məzmun (mətnlər, qrafiklər, logolar, səsli kitablar və s.)
          Bitig və ya onun lisenziya verənlərinə məxsusdur və müəllif hüquqları qanunları ilə qorunur.
        </p>

        <h3>5. Dəyişikliklər</h3>
        <p>
          Biz bu şərtləri istənilən vaxt yeniləmək hüququnu özümüzdə saxlayırıq. Dəyişikliklər edildikdən sonra
          platformadan istifadə etməyə davam etməyiniz, yeni şərtləri qəbul etdiyiniz anlamına gəlir.
        </p>

        <h3>6. Əlaqə</h3>
        <p>
          Sualınız varsa, bizimlə əlaqə səhifəsi vasitəsilə əlaqə saxlaya bilərsiniz.
        </p>
      </div>
    </div>
  )
}
