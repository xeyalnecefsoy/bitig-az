import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  useColorScheme,
  Modal,
  ScrollView,
  Platform,
} from 'react-native'
import Slider from '@react-native-community/slider'
import { Image } from 'expo-image'
import { Feather } from '@expo/vector-icons'
import { useAudio } from '@/context/audio'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import type { Book, BookTrack } from '@/lib/types'
import { resolvePlaybackDuration } from '@/lib/playbackDuration'
import { PLAYBACK_SPEEDS, SLEEP_TIMER_OPTIONS, type SleepTimerOption } from '@/lib/playbackConstants'
import {
  hintNextChapterLongPress,
  hintPlayPauseLongPress,
  hintPrevChapterLongPress,
} from '@/lib/playerHints'

function formatTime(n: number): string {
  if (!Number.isFinite(n)) return '0:00'
  const h = Math.floor(n / 3600)
  const m = Math.floor((n % 3600) / 60)
  const s = Math.floor(n % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function sleepLabel(minutes: SleepTimerOption): string {
  if (minutes === 0) return 'Bölüm sonu'
  if (minutes === 60) return '1 saat'
  return `${minutes} dəq`
}

type Props = {
  book: Book
  tracks: BookTrack[]
  resolveCover: (cover?: string | null, coverUrl?: string | null) => string
}

export function AudiobookPlayer({ book, tracks, resolveCover }: Props) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const {
    isPlaying,
    seekTo,
    queueBookId,
    activeQueueIndex,
    activeTrack,
    playbackRate,
    setPlaybackRate,
    position,
    duration,
    playTrackAt: playChapterAt,
    startOrTogglePlayback,
    pausePlayback,
  } = useAudio()
  const [showPlaylist, setShowPlaylist] = useState(true)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [sleepOpen, setSleepOpen] = useState(false)

  const [sleepTimerMode, setSleepTimerMode] = useState<'time' | 'chapter' | null>(null)
  const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(null)
  const sleepTimerModeRef = useRef<'time' | 'chapter' | null>(null)
  useEffect(() => {
    sleepTimerModeRef.current = sleepTimerMode
  }, [sleepTimerMode])

  const userInitiatedSkipRef = useRef(false)
  const prevIndexRef = useRef(-1)

  const playTrackAtIndex = useCallback(
    async (index: number) => {
      userInitiatedSkipRef.current = true
      try {
        await playChapterAt(book, tracks, resolveCover, index)
      } finally {
        setTimeout(() => {
          userInitiatedSkipRef.current = false
        }, 600)
      }
    },
    [book, tracks, resolveCover, playChapterAt]
  )

  useEffect(() => {
    if (
      sleepTimerModeRef.current === 'chapter' &&
      !userInitiatedSkipRef.current &&
      activeQueueIndex > prevIndexRef.current &&
      prevIndexRef.current >= 0
    ) {
      void pausePlayback()
      setSleepTimerMode(null)
      setSleepRemainingSec(null)
    }
    prevIndexRef.current = activeQueueIndex
  }, [activeQueueIndex, pausePlayback])

  /** Countdown only while mode is `time`; deps exclude remaining seconds so the interval is not reset every tick. */
  useEffect(() => {
    if (sleepTimerMode !== 'time') return
    const id = setInterval(() => {
      setSleepRemainingSec((prev) => {
        if (prev === null || prev <= 1) {
          void pausePlayback()
          setSleepTimerMode(null)
          return null
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [sleepTimerMode, pausePlayback])

  const cancelSleepTimer = useCallback(() => {
    setSleepTimerMode(null)
    setSleepRemainingSec(null)
  }, [])

  const applySleepTimer = useCallback(
    (minutes: SleepTimerOption) => {
      cancelSleepTimer()
      if (minutes === 0) {
        setSleepTimerMode('chapter')
        setSleepOpen(false)
        return
      }
      setSleepTimerMode('time')
      setSleepRemainingSec(minutes * 60)
      setSleepOpen(false)
    },
    [cancelSleepTimer]
  )

  const onPrimary = async () => {
    await startOrTogglePlayback(book, tracks, resolveCover)
  }

  const chapterHint =
    queueBookId === book.id && activeTrack?.title ? activeTrack.title : tracks[0]?.title ?? '—'

  const isThisBookPlaying = queueBookId === book.id
  const idx = activeQueueIndex
  const canSkipPrev = isThisBookPlaying && idx > 0
  const canSkipNext = isThisBookPlaying && idx >= 0 && idx < tracks.length - 1

  const onPrevChapter = () => {
    if (!canSkipPrev) return
    void playTrackAtIndex(idx - 1)
  }

  const onNextChapter = () => {
    if (!canSkipNext) return
    void playTrackAtIndex(idx + 1)
  }

  const displayDuration = useMemo(
    () => resolvePlaybackDuration(duration, activeTrack, tracks, idx),
    [duration, activeTrack, tracks, idx]
  )
  const sliderMax = Math.max(displayDuration, 1)
  const sliderPosition =
    isThisBookPlaying && displayDuration > 0 ? Math.min(Math.max(0, position), displayDuration) : 0

  const cardBg = isDark ? '#171717' : colors.surface
  const cardBorder = isDark ? '#2a2a2a' : colors.border

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.warning,
          {
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.15)',
            borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 119, 6, 0.35)',
          },
        ]}
      >
        <Typography style={{ fontSize: 16 }}>⚠️</Typography>
        <Typography style={[styles.warningText, { color: isDark ? '#fcd34d' : '#92400e' }]}>
          Bu demo səs faylıdır. Əsl kitab səsləri tezliklə əlavə olunacaq.
        </Typography>
      </View>

      <View style={[styles.card, { borderColor: cardBorder, backgroundColor: cardBg }]}>
        <View style={styles.cardHeader}>
          <Image
            source={resolveCover(book.cover, book.cover_url ?? null)}
            style={styles.thumb}
            contentFit="cover"
          />
          <View style={styles.cardHeaderText}>
            <Typography weight="semibold" numberOfLines={2} style={{ color: colors.text }}>
              {book.title}
            </Typography>
            <Typography numberOfLines={1} style={{ color: colors.textSecondary, fontSize: FontSize.sm, marginTop: 4 }}>
              {chapterHint}
            </Typography>
          </View>
        </View>

        {sleepTimerMode === 'time' && sleepRemainingSec !== null && (
          <View
            style={[
              styles.sleepBanner,
              { backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.12)' },
            ]}
          >
            <Typography style={{ color: isDark ? '#c4b5fd' : '#6d28d9', fontSize: FontSize.sm }}>
              {formatTime(sleepRemainingSec)} sonra dayanacaq
            </Typography>
            <Pressable onPress={cancelSleepTimer}>
              <Typography style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>Ləğv et</Typography>
            </Pressable>
          </View>
        )}
        {sleepTimerMode === 'chapter' && (
          <View
            style={[
              styles.sleepBanner,
              { backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.12)' },
            ]}
          >
            <Typography style={{ color: isDark ? '#c4b5fd' : '#6d28d9', fontSize: FontSize.sm }}>
              Bölüm sonunda dayanacaq
            </Typography>
            <Pressable onPress={cancelSleepTimer}>
              <Typography style={{ color: colors.textSecondary, fontSize: FontSize.xs }}>Ləğv et</Typography>
            </Pressable>
          </View>
        )}

        <View style={styles.transport}>
          <View style={styles.playRow}>
            <Pressable
              onPress={onPrevChapter}
              onLongPress={() =>
                hintPrevChapterLongPress({
                  canSkip: canSkipPrev,
                  queueLength: tracks.length,
                  bookContextActive: isThisBookPlaying,
                })
              }
              delayLongPress={450}
              style={[
                styles.chapterBtn,
                {
                  borderColor: isDark ? '#333' : colors.border,
                  backgroundColor: isDark ? '#141414' : colors.background,
                  opacity: !canSkipPrev ? 0.35 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Öncəki bölüm"
              accessibilityHint="Uzun bas: izah"
              accessibilityState={{ disabled: !canSkipPrev }}
            >
              <Feather name="chevrons-left" size={22} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => {
                if (tracks.length === 0) return
                void onPrimary()
              }}
              onLongPress={() =>
                hintPlayPauseLongPress({
                  tracksEmpty: tracks.length === 0,
                  isPlaying: isThisBookPlaying && isPlaying,
                })
              }
              delayLongPress={450}
              style={[styles.playBtn, { opacity: tracks.length === 0 ? 0.5 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={isThisBookPlaying && isPlaying ? 'Fasilə' : 'Oxut'}
              accessibilityHint="Uzun bas: izah"
              accessibilityState={{ disabled: tracks.length === 0 }}
            >
              <Feather name={isThisBookPlaying && isPlaying ? 'pause' : 'play'} size={28} color="#06140A" />
            </Pressable>

            <Pressable
              onPress={onNextChapter}
              onLongPress={() =>
                hintNextChapterLongPress({
                  canSkip: canSkipNext,
                  queueLength: tracks.length,
                  bookContextActive: isThisBookPlaying,
                })
              }
              delayLongPress={450}
              style={[
                styles.chapterBtn,
                {
                  borderColor: isDark ? '#333' : colors.border,
                  backgroundColor: isDark ? '#141414' : colors.background,
                  opacity: !canSkipNext ? 0.35 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sonrakı bölüm"
              accessibilityHint="Uzun bas: izah"
              accessibilityState={{ disabled: !canSkipNext }}
            >
              <Feather name="chevrons-right" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.sliderCol}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={sliderMax}
              value={sliderPosition}
              minimumTrackTintColor={Colors.brand}
              maximumTrackTintColor={isDark ? '#3a3a3a' : colors.border}
              thumbTintColor={Colors.brand}
              disabled={!isThisBookPlaying || displayDuration <= 0}
              onSlidingComplete={(v) => {
                if (!isThisBookPlaying || displayDuration <= 0) return
                seekTo(Math.min(v, displayDuration))
              }}
            />
            <View style={styles.timeRow}>
              <Typography style={[styles.timeText, { color: colors.textTertiary }]}>
                {formatTime(isThisBookPlaying ? position : 0)}
              </Typography>
              <Typography style={[styles.timeText, { color: colors.textTertiary }]}>
                {formatTime(isThisBookPlaying ? displayDuration : 0)}
              </Typography>
            </View>
          </View>
        </View>

        <View style={[styles.pillRow, { borderTopColor: isDark ? '#2a2a2a' : colors.borderLight }]}>
          <Pressable
            onPress={() => setSpeedOpen(true)}
            style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.background }]}
          >
            <Feather name="clock" size={14} color={colors.textSecondary} />
            <Typography style={{ color: playbackRate !== 1 ? Colors.brand : colors.text, fontSize: FontSize.sm }}>
              {playbackRate}x
            </Typography>
          </Pressable>
          <Pressable
            onPress={() => setSleepOpen(true)}
            style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.background }]}
          >
            <Feather name="moon" size={14} color={sleepTimerMode ? '#a78bfa' : colors.textSecondary} />
            <Typography style={{ color: sleepTimerMode ? '#a78bfa' : colors.text, fontSize: FontSize.sm }}>
              {sleepTimerMode === 'chapter'
                ? 'Bölüm'
                : sleepTimerMode === 'time' && sleepRemainingSec !== null
                  ? formatTime(sleepRemainingSec)
                  : 'Yuxu'}
            </Typography>
          </Pressable>
        </View>
      </View>

      <View style={[styles.listCard, { borderColor: cardBorder, backgroundColor: cardBg }]}>
        <Pressable onPress={() => setShowPlaylist(!showPlaylist)} style={[styles.listHeader, { backgroundColor: isDark ? '#141414' : 'rgba(128,128,128,0.06)' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="list" size={18} color={colors.text} />
            <Typography weight="semibold" style={{ color: colors.text }}>
              Siyahı ({tracks.length})
            </Typography>
          </View>
          <Typography weight="medium" style={{ color: Colors.brand, fontSize: FontSize.sm }}>
            {showPlaylist ? 'Gizlət' : 'Göstər'}
          </Typography>
        </Pressable>
        {showPlaylist && (
          <View>
            {tracks.map((t, i) => {
              const isActive = queueBookId === book.id && idx === i
              const isPlayingRow = isActive && isPlaying && isThisBookPlaying
              return (
                <Pressable
                  key={t.id}
                  onPress={() => void playTrackAtIndex(i)}
                  style={[
                    styles.listRow,
                    { borderTopColor: colors.borderLight },
                    isActive ? { backgroundColor: isDark ? 'rgba(74, 216, 96, 0.14)' : 'rgba(74, 216, 96, 0.1)' } : null,
                  ]}
                >
                  <View
                    style={[
                      styles.numCircle,
                      { backgroundColor: isActive ? Colors.brand : colors.background },
                    ]}
                  >
                    {isPlayingRow ? (
                      <Feather name="volume-2" size={14} color="#06140A" />
                    ) : (
                      <Typography weight="bold" style={{ color: isActive ? '#06140A' : colors.textTertiary, fontSize: FontSize.sm }}>
                        {i + 1}
                      </Typography>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      numberOfLines={1}
                      weight="medium"
                      style={{ color: isActive ? Colors.brand : colors.text }}
                    >
                      {t.title}
                    </Typography>
                    {t.duration > 0 && (
                      <Typography style={{ color: colors.textTertiary, fontSize: FontSize.xs, marginTop: 2 }}>
                        {formatTime(t.duration)}
                      </Typography>
                    )}
                  </View>
                  {isActive && (
                    <View style={styles.playingBadge}>
                      <Typography style={{ color: Colors.brand, fontSize: FontSize.xs }} weight="semibold">
                        Oynanır
                      </Typography>
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        )}
      </View>

      <Modal visible={speedOpen} transparent animationType="fade" onRequestClose={() => setSpeedOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSpeedOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Typography weight="semibold" style={{ color: colors.text, marginBottom: Spacing.md }}>
              Oxuma sürəti
            </Typography>
            <ScrollView style={{ maxHeight: 280 }}>
              {PLAYBACK_SPEEDS.map((s) => (
                <Pressable
                  key={s}
                  onPress={async () => {
                    await setPlaybackRate(s)
                    setSpeedOpen(false)
                  }}
                  style={styles.modalRow}
                >
                  <Typography style={{ color: playbackRate === s ? Colors.brand : colors.text }}>
                    {s}x {s === 1 ? '(Normal)' : ''}
                  </Typography>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={sleepOpen} transparent animationType="fade" onRequestClose={() => setSleepOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSleepOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <Typography weight="semibold" style={{ color: colors.text, marginBottom: Spacing.sm }}>
              Yuxu vaxtı
            </Typography>
            {sleepTimerMode && (
              <Pressable onPress={cancelSleepTimer} style={styles.modalRow}>
                <Typography style={{ color: '#ef4444' }}>Ləğv et</Typography>
              </Pressable>
            )}
            {SLEEP_TIMER_OPTIONS.map((m) => (
              <Pressable key={m} onPress={() => applySleepTimer(m)} style={styles.modalRow}>
                <Typography style={{ color: colors.text }}>{sleepLabel(m)}</Typography>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  warningText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  cardHeader: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  thumb: { width: 56, height: 56, borderRadius: BorderRadius.md },
  cardHeaderText: { flex: 1, minWidth: 0, justifyContent: 'center' },
  sleepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  transport: {
    gap: Spacing.md,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  chapterBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderCol: { width: '100%' },
  slider: { width: '100%', height: Platform.OS === 'ios' ? 40 : 48 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  timeText: { fontSize: FontSize.xs, fontVariant: ['tabular-nums'] },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 999,
    borderWidth: 1,
  },
  listCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  numCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(74, 216, 96, 0.15)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '70%',
  },
  modalRow: { paddingVertical: Spacing.md },
})
