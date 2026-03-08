import React, { createContext, useContext, useEffect, useState } from 'react';
import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
  useTrackPlayerEvents,
} from 'react-native-track-player';

interface AudioContextType {
  isReady: boolean;
  activeTrack: any | null;
  isPlaying: boolean;
  setupPlayer: () => Promise<void>;
  playTrack: (track: any) => Promise<void>;
  playQueue: (tracks: any[], startIndex?: number) => Promise<void>;
  togglePlayback: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [activeTrack, setActiveTrack] = useState<any | null>(null);
  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;

  useEffect(() => {
    setupPlayer();
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.index !== undefined) {
      const track = await TrackPlayer.getTrack(event.index);
      setActiveTrack(track);
    }
  });

  async function setupPlayer() {
    if (isReady) return;
    
    try {
      await TrackPlayer.setupPlayer();
      await TrackPlayer.updateOptions({
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
          Capability.SeekTo,
          Capability.JumpForward,
          Capability.JumpBackward,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        forwardJumpInterval: 15,
        backwardJumpInterval: 15,
      });
      await TrackPlayer.setRepeatMode(RepeatMode.Queue);
      setIsReady(true);
    } catch (e) {
      console.log('Error setting up player', e);
      // Might already be initialized
      setIsReady(true);
    }
  }

  async function playTrack(track: any) {
    if (!isReady) await setupPlayer();
    await TrackPlayer.reset();
    await TrackPlayer.add(track);
    await TrackPlayer.play();
  }

  async function playQueue(tracks: any[], startIndex = 0) {
    if (!isReady) await setupPlayer();
    await TrackPlayer.reset();
    await TrackPlayer.add(tracks);
    if (startIndex > 0) {
      await TrackPlayer.skip(startIndex);
    }
    await TrackPlayer.play();
  }

  async function togglePlayback() {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  }

  async function seekTo(position: number) {
    await TrackPlayer.seekTo(position);
  }

  return (
    <AudioContext.Provider
      value={{
        isReady,
        activeTrack,
        isPlaying,
        setupPlayer,
        playTrack,
        playQueue,
        togglePlayback,
        seekTo,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
