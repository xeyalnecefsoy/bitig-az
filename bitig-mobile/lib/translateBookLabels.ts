/** Display genres in Azerbaijani (same rules as web translateGenre az map). */
const GENRE_TO_AZ: Record<string, string> = {
  Fantasy: 'Fantastika',
  Business: 'Biznes',
  'Self-Help': 'Şəxsi İnkişaf',
  Psychology: 'Psixologiya',
  Novel: 'Roman',
  History: 'Tarix',
  "Children's Literature": 'Uşaq ədəbiyyatı',
  Fiction: 'Bədii',
  'Non-fiction': 'Qeyri-bədii',
  Nonfiction: 'Qeyri-bədii',
  Memoir: 'Memuar',
  'Sci-Fi': 'Elmi-fantastika',
  Biography: 'Bioqrafiya',
  Science: 'Elm',
  Classics: 'Klassik',
  Mystery: 'Detektiv',
  'Science Fiction': 'Elmi-fantastika',
  Religion: 'Din',
  Philosophy: 'Fəlsəfə',
}

export function translateGenreAz(genre: string | null | undefined): string {
  if (!genre) return ''
  const direct = GENRE_TO_AZ[genre] ?? GENRE_TO_AZ[genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase()]
  return direct ?? genre
}

const VOICE_LABELS: Record<string, string> = {
  single: 'Tək Səsləndirici',
  multiple: 'Çoxlu Səsləndirici',
  radio_theater: 'Radio Teatrı',
}

export function translateVoiceType(voiceType: string | null | undefined): string | null {
  if (!voiceType) return null
  return VOICE_LABELS[voiceType] ?? null
}

export function formatDurationFromSeconds(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds)) return ''
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h} saat ${m} dəq`
  return `${m} dəq`
}
