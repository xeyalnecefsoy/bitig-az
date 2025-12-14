
import { t, type Locale } from '@/lib/i18n'

export default async function PrivacyPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  return (
    <div className="container-max py-10 space-y-6">
      <h1 className="text-3xl font-bold">Məxfilik Siyasəti</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        Son yenilənmə tarixi: {new Date().toLocaleDateString('az-AZ')}
      </p>

      <div className="prose dark:prose-invert max-w-none">
        <h3>1. Məlumatların Toplanması</h3>
        <p>
          Biz xidmətlərimizi göstərmək üçün müəyyən şəxsi məlumatlarınızı (ad, e-poçt ünvanı və s.) toplaya bilərik.
          Bu məlumatlar hesab yaratmaq, ödənişləri emal etmək və xidmət keyfiyyətini artırmaq üçün istifadə olunur.
        </p>

        <h3>2. Məlumatların İstifadəsi</h3>
        <p>
          Topladığımız məlumatlar aşağıdakı məqsədlər üçün istifadə olunur:
        </p>
        <ul>
          <li>Xidmətlərimizi təmin etmək və təkmilləşdirmək</li>
          <li>Sizinlə əlaqə saxlamaq və bildirişlər göndərmək</li>
          <li>Qanun pozuntularının qarşısını almaq</li>
        </ul>

        <h3>3. Məlumatların Paylaşılması</h3>
        <p>
          Şəxsi məlumatlarınızı üçüncü tərəflərlə satmırıq. Yalnız qanuni tələblər olduqda və ya xidmət təminatçıları ilə
          (məsələn, ödəniş sistemləri) zəruri hallarda məlumat paylaşa bilərik.
        </p>

        <h3>4. Təhlükəsizlik</h3>
        <p>
          Məlumatlarınızın təhlükəsizliyini qorumaq üçün lazımi texniki və təşkilati tədbirlər görürük.
        </p>

        <h3>5. Kookilər (Cookies)</h3>
        <p>
          Veb saytımızda istifadəçi təcrübəsini yaxşılaşdırmaq üçün kookilərdən istifadə olunur. Brauzer ayarlarınızdan
          kookiləri idarə edə bilərsiniz.
        </p>
      </div>
    </div>
  )
}
