import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Feather } from '@expo/vector-icons'
import { useAudio } from '@/context/audio'
import { resolvePlaybackDurationSimple } from '@/lib/playbackDuration'
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/Colors'
import { Typography } from '@/components/ui/Typography'
import { PLAYBACK_SPEEDS, SLEEP_TIMER_OPTIONS, type SleepTimerOption } from '@/lib/playbackConstants'
import { hintSeekSecondsLongPress } from '@/lib/playerHints'

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
  /** When false, controls are dimmed (e.g. wrong book context). */
  isActive: boolean
}

/**
 * Shared transport: progress slider, skip, speed, sleep timer — used by full-screen player.
 * Sleep/chapter logic matches [AudiobookPlayer](../audiobook/AudiobookPlayer.tsx).
 */
export function PlayerTransportShared({ isActive }: Props) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  const { seekTo, playbackRate, setPlaybackRate, activeTrack, position, duration, pausePlayback } =
    useAudio()

  const displayDuration = useMemo(
    () => resolvePlaybackDurationSimple(duration, activeTrack),
    [duration, activeTrack]
  )
  const sliderMax = Math.max(displayDuration, 1)
  const sliderPosition =
    isActive && displayDuration > 0 ? Math.min(Math.max(0, position), displayDuration) : 0

  const [speedOpen, setSpeedOpen] = useState(false)
  const [sleepOpen, setSleepOpen] = useState(false)
  const [sleepTimerMode, setSleepTimerMode] = useState<'time' | null>(null)
  const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(null)
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
      setSleepTimerMode('time')
      setSleepRemainingSec(minutes * 60)
      setSleepOpen(false)
    },
    [cancelSleepTimer]
  )

  return (
    <View style={{ width: '100%' }}>
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
      <View style={styles.sliderBlock}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={sliderMax}
          value={sliderPosition}
          minimumTrackTintColor={Colors.brand}
          maximumTrackTintColor={colors.border}
          thumbTintColor={Colors.brand}
          disabled={!isActive || displayDuration <= 0}
          onSlidingComplete={(v) => {
            if (!isActive || displayDuration <= 0) return
            seekTo(Math.min(v, displayDuration))
          }}
        />
        <View style={styles.timeRow}>
          <Typography style={[styles.timeText, { color: colors.textTertiary }]}>
            {formatTime(isActive ? position : 0)}
          </Typography>
          <Typography style={[styles.timeText, { color: colors.textTertiary }]}>
            {formatTime(isActive ? displayDuration : 0)}
          </Typography>
        </View>
        <View style={styles.seek15Row}>
          <Pressable
            onPress={() => {
              if (isActive) void seekTo(Math.max(0, position - 15))
            }}
            onLongPress={() => hintSeekSecondsLongPress(isActive, 'back')}
            delayLongPress={450}
            style={[styles.seek15Btn, { borderColor: colors.border, opacity: !isActive ? 0.45 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="15 saniyə geri"
            accessibilityHint="Uzun bas: izah"
            accessibilityState={{ disabled: !isActive }}
          >
            <Feather name="rotate-ccw" size={16} color={colors.textSecondary} />
            <Typography style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>15s</Typography>
          </Pressable>
          <Pressable
            onPress={() => {
              if (isActive && displayDuration > 0) void seekTo(Math.min(position + 15, displayDuration))
            }}
            onLongPress={() => hintSeekSecondsLongPress(isActive, 'forward')}
            delayLongPress={450}
            style={[styles.seek15Btn, { borderColor: colors.border, opacity: !isActive ? 0.45 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="15 saniyə irəli"
            accessibilityHint="Uzun bas: izah"
            accessibilityState={{ disabled: !isActive }}
          >
            <Typography style={{ color: colors.textSecondary, fontSize: FontSize.sm }}>15s</Typography>
            <Feather name="rotate-cw" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.pillRow, { borderTopColor: colors.borderLight }]}>
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
            {sleepTimerMode === 'time' && sleepRemainingSec !== null ? formatTime(sleepRemainingSec) : 'Yuxu'}
          </Typography>
        </Pressable>
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
            {SLEEP_TIMER_OPTIONS.filter((m) => m > 0).map((m) => (
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
  sleepBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  sliderBlock: {
    width: '100%',
  },
  seek15Row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  seek15Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  slider: { width: '100%', height: Platform.OS === 'ios' ? 40 : 48 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  timeText: { fontSize: FontSize.xs, fontVariant: ['tabular-nums'] },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
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
