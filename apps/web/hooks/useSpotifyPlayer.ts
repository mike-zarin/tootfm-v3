'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SpotifyPlayerState {
  isPlaying: boolean;
  currentTrack: any;
  position: number;
  duration: number;
  volume: number;
  deviceId: string | null;
}

interface UseSpotifyPlayerReturn {
  playerState: SpotifyPlayerState;
  playTrack: (trackUri: string, deviceId?: string) => Promise<boolean>;
  pause: (deviceId?: string) => Promise<boolean>;
  togglePlayPause: (deviceId?: string) => Promise<boolean>;
  nextTrack: (deviceId?: string) => Promise<boolean>;
  previousTrack: (deviceId?: string) => Promise<boolean>;
  seekTo: (positionMs: number, deviceId?: string) => Promise<boolean>;
  setVolume: (volume: number, deviceId?: string) => Promise<boolean>;
  getCurrentState: () => Promise<any>;
  isLoading: boolean;
  error: string | null;
}

export function useSpotifyPlayer(): UseSpotifyPlayerReturn {
  const { data: session } = useSession();
  const [playerState, setPlayerState] = useState<SpotifyPlayerState>({
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    volume: 50,
    deviceId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = useCallback(async (action: string, body: any = {}) => {
    if (!(session as any)?.accessToken) {
      setError('Not authenticated');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spotify/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...body }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to control playback');
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [(session as any)?.accessToken]);

  const playTrack = useCallback(async (trackUri: string, deviceId?: string) => {
    return makeRequest('play', { trackUri, deviceId });
  }, [makeRequest]);

  const pause = useCallback(async (deviceId?: string) => {
    return makeRequest('pause', { deviceId });
  }, [makeRequest]);

  const togglePlayPause = useCallback(async (deviceId?: string) => {
    return makeRequest('toggle', { deviceId });
  }, [makeRequest]);

  const nextTrack = useCallback(async (deviceId?: string) => {
    return makeRequest('next', { deviceId });
  }, [makeRequest]);

  const previousTrack = useCallback(async (deviceId?: string) => {
    return makeRequest('previous', { deviceId });
  }, [makeRequest]);

  const seekTo = useCallback(async (positionMs: number, deviceId?: string) => {
    return makeRequest('seek', { positionMs, deviceId });
  }, [makeRequest]);

  const setVolume = useCallback(async (volume: number, deviceId?: string) => {
    const success = await makeRequest('volume', { volume, deviceId });
    if (success) {
      setPlayerState(prev => ({ ...prev, volume }));
    }
    return success;
  }, [makeRequest]);

  const getCurrentState = useCallback(async () => {
    if (!(session as any)?.accessToken) {
      setError('Not authenticated');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spotify/player');
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to get playback state');
        return null;
      }

      const state = await response.json();
      
      // Update local state with Spotify data
      setPlayerState(prev => ({
        ...prev,
        isPlaying: state.is_playing || false,
        currentTrack: state.item || null,
        position: state.progress_ms || 0,
        duration: state.item?.duration_ms || 0,
        volume: state.device?.volume_percent || prev.volume,
        deviceId: state.device?.id || prev.deviceId,
      }));

      return state;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [(session as any)?.accessToken]);

  return {
    playerState,
    playTrack,
    pause,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    getCurrentState,
    isLoading,
    error,
  };
}
