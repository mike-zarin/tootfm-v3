'use client';

import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

interface SpotifyPlayerProps {
  partyId: string;
  isHost: boolean;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export function SpotifyPlayer({ partyId, isHost }: SpotifyPlayerProps) {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const { toast } = useToast();

  const initializePlayer = useCallback(async () => {
    // Get access token
    const tokenResponse = await fetch('/api/auth/spotify/refresh', { method: 'POST' });
    const { accessToken } = await tokenResponse.json();

    if (!accessToken) {
      toast({
        title: 'Spotify Not Connected',
        description: 'Please connect your Spotify account first.',
        variant: 'destructive',
      });
      return;
    }

    const player = new window.Spotify.Player({
      name: 'tootFM Web Player',
      getOAuthToken: async (cb: (token: string) => void) => {
        // Refresh token if needed
        const response = await fetch('/api/auth/spotify/refresh', { method: 'POST' });
        const data = await response.json();
        cb(data.accessToken);
      },
      volume: volume / 100,
    });

    // Ready
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Ready with Device ID', device_id);
      setDeviceId(device_id);
      toast({
        title: 'Player Ready',
        description: 'Spotify player is ready to play music!',
      });
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Player state changed
    player.addListener('player_state_changed', (state: any) => {
      if (!state) return;

      setCurrentTrack(state.track_window.current_track);
      setPosition(state.position);
      setDuration(state.duration);
      setIsPlaying(!state.paused);
    });

    // Connect to the player
    player.connect();
    setPlayer(player);
  }, [volume, toast]);

  // Load Spotify SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (!player) return;

    if (isPlaying) {
      await fetch('/api/spotify/player', { method: 'POST' });
    } else {
      await fetch('/api/spotify/player', { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (player) {
      player.setVolume(newVolume / 100);
    }
  };

  const handleSkip = async () => {
    if (!player) return;
    player.nextTrack();
  };

  const handlePrevious = async () => {
    if (!player) return;
    player.previousTrack();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!deviceId) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Initializing Spotify Player...</p>
          <p className="text-sm text-muted-foreground">
            Make sure you have Spotify Premium and the web player is allowed in your browser.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {currentTrack ? (
          <div className="flex items-center gap-4">
            <Image 
              src={currentTrack.album.images[0]?.url || '/placeholder.png'} 
              alt={currentTrack.name}
              width={64}
              height={64}
              className="w-16 h-16 rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{currentTrack.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {currentTrack.artists.map((a: any) => a.name).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No track playing</p>
          </div>
        )}

        <div className="space-y-2">
          <Slider
            value={[position]}
            max={duration}
            step={1000}
            className="w-full"
            disabled={!isHost}
            onValueChange={(value) => {
              if (player && isHost) {
                player.seek(value[0]);
              }
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {isHost && (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePrevious}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-8a1 1 0 00-1.555-.832L3 9.168a1 1 0 000 1.664l5.445 4z"/>
                <path d="M1 10a1 1 0 011-1h.01a1 1 0 110 2H2a1 1 0 01-1-1z"/>
              </svg>
            </Button>
            
            <Button
              size="icon"
              onClick={handlePlayPause}
              className="w-12 h-12"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                </svg>
              )}
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSkip}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.555 5.168a1 1 0 00-1.555.832v8a1 1 0 001.555.832L17 10.832a1 1 0 000-1.664l-5.445-4z"/>
                <path d="M19 10a1 1 0 00-1-1h-.01a1 1 0 100 2H18a1 1 0 001-1z"/>
              </svg>
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"/>
          </svg>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            className="w-24"
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>
    </Card>
  );
}