'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

interface SpotifyWebPlayerProps {
  partyId: string;
  onPlayerReady?: (deviceId: string) => void;
  onPlayerStateChange?: (state: any) => void;
  className?: string;
}

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export default function SpotifyWebPlayer({ 
  partyId, 
  onPlayerReady, 
  onPlayerStateChange,
  className = '' 
}: SpotifyWebPlayerProps) {
  const { data: session } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const playerRef = useRef<any>(null);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if SDK is already loaded
    if (window.Spotify) {
      initializePlayer();
      return;
    }

    // Load the SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = initializePlayer;

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializePlayer = async () => {
    if (!window.Spotify || !(session as any)?.accessToken) return;

    try {
      const spotifyPlayer = new window.Spotify.Player({
        name: `tootFM Party ${partyId}`,
        getOAuthToken: (cb: (token: string) => void) => {
          cb((session as any).accessToken);
        },
        volume: volume / 100,
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify Web Player ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        onPlayerReady?.(device_id);
      });

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setIsReady(false);
      });

      // Initial State
      spotifyPlayer.addListener('initial_state', (state: any) => {
        console.log('Initial state:', state);
        if (state.track_window?.current_track) {
          setCurrentTrack(state.track_window.current_track);
        }
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);
      });

      // Playback Status Updates
      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        console.log('Player state changed:', state);
        if (state.track_window?.current_track) {
          setCurrentTrack(state.track_window.current_track);
        }
        setIsPlaying(!state.paused);
        setPosition(state.position);
        setDuration(state.duration);
        onPlayerStateChange?.(state);
      });

      // Error handling
      spotifyPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('Failed to authenticate:', message);
      });

      spotifyPlayer.addListener('account_error', ({ message }: { message: string }) => {
        console.error('Failed to validate Spotify account:', message);
      });

      spotifyPlayer.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('Failed to perform playback:', message);
      });

      // Connect to the player
      const success = await spotifyPlayer.connect();
      if (success) {
        console.log('Successfully connected to Spotify!');
        setPlayer(spotifyPlayer);
        playerRef.current = spotifyPlayer;
      }
    } catch (error) {
      console.error('Failed to initialize Spotify player:', error);
    }
  };

  // Player controls
  const togglePlayPause = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const playTrack = (uri: string) => {
    if (player && deviceId) {
      player.play({
        uris: [uri],
        device_id: deviceId
      });
    }
  };

  const setPlayerVolume = (newVolume: number) => {
    if (player) {
      player.setVolume(newVolume / 100);
      setVolume(newVolume);
    }
  };

  const seekTo = (positionMs: number) => {
    if (player) {
      player.seek(positionMs);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  // Format time helper
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!(session as any)?.accessToken) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-gray-500">Please connect to Spotify to use the player</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Album Art */}
        <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
          {currentTrack?.album?.images?.[0] ? (
            <img 
              src={currentTrack.album.images[0].url} 
              alt={currentTrack.album.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.794a1 1 0 011.617.794zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">
            {currentTrack?.name || 'No track playing'}
          </h3>
          <p className="text-gray-400 text-sm truncate">
            {currentTrack?.artists?.[0]?.name || 'Unknown artist'}
          </p>
        </div>

        {/* Player Status */}
        <div className="flex items-center space-x-2">
          {isReady ? (
            <span className="text-green-400 text-xs">● Connected</span>
          ) : (
            <span className="text-yellow-400 text-xs">● Connecting...</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>{formatTime(position)}</span>
          <div className="flex-1 bg-gray-700 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-300"
              style={{ 
                width: duration > 0 ? `${(position / duration) * 100}%` : '0%' 
              }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlayPause}
            disabled={!isReady}
            className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.794a1 1 0 011.617.794zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setPlayerVolume(Number(e.target.value))}
            className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Device ID for debugging */}
      {process.env.NODE_ENV === 'development' && deviceId && (
        <div className="mt-2 text-xs text-gray-500">
          Device ID: {deviceId}
        </div>
      )}
    </div>
  );
}
