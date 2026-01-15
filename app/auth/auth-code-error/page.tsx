import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4 text-center text-white">
      <h1 className="text-4xl font-bold text-red-500">Giriş Xətası</h1>
      <p className="mt-4 text-lg text-neutral-300">
        Təhlükəsizlik kodunun vaxtı bitib və ya artıq istifadə olunub.
      </p>
      <div className="mt-8 flex gap-4">
        <Link 
          href="/"
          className="rounded-md bg-neutral-800 px-6 py-2 transition hover:bg-neutral-700"
        >
          Ana Səhifə
        </Link>
        <Link 
          href="/az/login"
          className="rounded-md bg-green-600 px-6 py-2 font-semibold transition hover:bg-green-500"
        >
          Yenidən Giriş et
        </Link>
      </div>
    </div>
  )
}
