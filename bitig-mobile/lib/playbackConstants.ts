/** Mirrors web [context/audio.tsx](context/audio.tsx) playback options. */
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

/** Minutes; 0 = end of current chapter */
export const SLEEP_TIMER_OPTIONS = [5, 15, 30, 45, 60, 0] as const
export type SleepTimerOption = (typeof SLEEP_TIMER_OPTIONS)[number]
