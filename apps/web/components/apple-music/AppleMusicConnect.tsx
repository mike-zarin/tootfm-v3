'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
declare global {
  interface Window {
    MusicKit: any;
  }
}
export function AppleMusicConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Load MusicKit JS
    if (!window.MusicKit) {
      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);
  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // Get developer token from backend
      const tokenResponse = await fetch('/api/auth/apple-music/token');
      if (!tokenResponse.ok) {
        throw new Error('Failed to get developer token');
      }
      const { developerToken } = await tokenResponse.json();
      // Wait for MusicKit to load
      let attempts = 0;
      while (!window.MusicKit && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (!window.MusicKit) {
        throw new Error('MusicKit failed to load');
      }
      // Configure MusicKit
      await window.MusicKit.configure({
        developerToken,
        app: {
          name: 'tootFM',
          build: '1.0.0'
        }
      });
      // Get music instance
      const music = window.MusicKit.getInstance();
      // Authorize user - this will open Apple Music login popup
      const musicUserToken = await music.authorize();
      if (!musicUserToken) {
        throw new Error('User cancelled authorization');
      }
      console.log('Music User Token obtained:', musicUserToken.substring(0, 20) + '...');
      // Save token to backend
      const saveResponse = await fetch('/api/auth/apple-music/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ musicUserToken }),
      });
      if (!saveResponse.ok) {
        throw new Error('Failed to save Apple Music profile');
      }
      setIsConnected(true);
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Apple Music connection failed:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };
  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Music className="h-5 w-5" />
        <span>Apple Music Connected</span>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant="outline"
        className="gap-2"
      >
        <Music className="h-5 w-5" />
        {isConnecting ? 'Connecting...' : 'Connect Apple Music'}
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}