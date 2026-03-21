import { showPlayerHint } from '@/lib/playerHintRegistry'

const ACTIVE_PREV = 'Cari kitabda növbədəki öncəki bölməyə keçir.'
const ACTIVE_NEXT = 'Cari kitabda növbədəki sonrakı bölməyə keçir.'

/** Öncəki bölüm — aktiv / deaktiv vəziyyətə uyğun (uzun basım). */
export function hintPrevChapterLongPress(opts: {
  canSkip: boolean
  queueLength: number
  /** false: başqa kitab oxunur və ya bu kitab növbədə deyil (məs. kitab səhifəsi). */
  bookContextActive?: boolean
}) {
  const bookOk = opts.bookContextActive !== false
  if (opts.canSkip) {
    showPlayerHint('Öncəki bölüm', ACTIVE_PREV)
    return
  }
  if (!bookOk) {
    showPlayerHint('Öncəki bölüm', 'Bölmələr arası keçmək üçün əvvəlcə bu kitabı Oxut düyməsi ilə başladın.')
    return
  }
  if (opts.queueLength <= 1) {
    showPlayerHint('Öncəki bölüm', 'Bu kitabda yalnız bir bölüm var.')
    return
  }
  showPlayerHint('Öncəki bölüm', 'Artıq birinci bölmədəsiniz.')
}

/** Sonrakı bölüm — aktiv / deaktiv vəziyyətə uyğun (uzun basım). */
export function hintNextChapterLongPress(opts: {
  canSkip: boolean
  queueLength: number
  bookContextActive?: boolean
}) {
  const bookOk = opts.bookContextActive !== false
  if (opts.canSkip) {
    showPlayerHint('Sonrakı bölüm', ACTIVE_NEXT)
    return
  }
  if (!bookOk) {
    showPlayerHint('Sonrakı bölüm', 'Bölmələr arası keçmək üçün əvvəlcə bu kitabı Oxut düyməsi ilə başladın.')
    return
  }
  if (opts.queueLength <= 1) {
    showPlayerHint('Sonrakı bölüm', 'Bu kitabda yalnız bir bölüm var.')
    return
  }
  showPlayerHint('Sonrakı bölüm', 'Son bölmədəsiniz.')
}

/** Oxut / fasilə — bölüm yoxdursa (məs. boş kitab). */
export function hintPlayPauseLongPress(opts: { tracksEmpty: boolean; isPlaying: boolean }) {
  if (opts.tracksEmpty) {
    showPlayerHint('Oxut', 'Bu kitabda hələ bölüm yoxdur.')
    return
  }
  showPlayerHint(
    opts.isPlaying ? 'Fasilə' : 'Oxut',
    opts.isPlaying ? 'Oxumanı müvəqqəti dayandırır.' : 'Seçilmiş bölmədən oxumanı başladır və ya davam etdirir.'
  )
}

/** ±15 saniyə — yalnız aktiv oxunu zamanı işləyir. */
export function hintSeekSecondsLongPress(isActive: boolean, direction: 'back' | 'forward') {
  if (isActive) {
    showPlayerHint(
      direction === 'back' ? '15 saniyə geri' : '15 saniyə irəli',
      direction === 'back'
        ? 'Cari bölmədə oxunu 15 saniyə geri çəkir.'
        : 'Cari bölmədə oxunu 15 saniyə irəli çəkir.'
    )
    return
  }
  showPlayerHint(
    direction === 'back' ? '15 saniyə geri' : '15 saniyə irəli',
    'Bu düymələr cari bölüm üzrə işləyir. Əvvəlcə bu kitabı Oxut düyməsi ilə başladın və ya tam ekran pleyerdə aktiv bölüm seçin.'
  )
}
