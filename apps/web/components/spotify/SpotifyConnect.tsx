// components/spotify/SpotifyConnect.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music, Loader2, CheckCircle, X } from 'lucide-react';
export function SpotifyConnect() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  useEffect(() => {
    checkSpotifyConnection();
  }, [session]);
  const checkSpotifyConnection = async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/auth/spotify/status');
      const data = await response.json();
      if (data.connected) {
        setIsConnected(true);
        setProfile(data.profile);
        // Check if portrait exists, if not - generate it
        checkAndGeneratePortrait();
      }
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to check Spotify connection:', error);
    }
  };
  const checkAndGeneratePortrait = async () => {
    try {
      // Check if portrait exists
      const checkResponse = await fetch('/api/music/portrait/status');
      const checkData = await checkResponse.json();
      if (!checkData.exists || checkData.needsRefresh) {
        // Auto-generate portrait
        setGeneratingPortrait(true);
        const portraitResponse = await fetch('/api/music/portrait');
        const portraitData = await portraitResponse.json();
        if (portraitData.musicPortrait) {
          // Trigger a page refresh to show the portrait
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to generate portrait:', error);
    } finally {
      setGeneratingPortrait(false);
    }
  };
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // BUILD URL DIRECTLY - NO API CALL!
      const params = new URLSearchParams({
        client_id: '68a7ea6587af43cc893cc0994a584eff',
        response_type: 'code',
        redirect_uri: 'https://tootfm.world/api/auth/spotify/callback',
        scope: 'user-read-email user-read-private user-top-read user-read-recently-played user-library-read playlist-read-private playlist-read-collaborative streaming user-read-playback-state user-modify-playback-state user-read-currently-playing',
        state: 'default'
      });
      
      // DIRECT BROWSER REDIRECT - NO FETCH!
      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
      
    } catch (error) {
      console.error('Spotify connection error:', error);
      setIsLoading(false);
    }
  };
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Spotify?')) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/spotify/disconnect', {
        method: 'POST'
      });
      if (response.ok) {
        setIsConnected(false);
        setProfile(null);
        window.location.reload();
      }
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to disconnect Spotify:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleRefreshPortrait = async () => {
    setGeneratingPortrait(true);
    try {
      const response = await fetch('/api/music/portrait');
      const data = await response.json();
      if (data.musicPortrait) {
        window.location.reload();
      }
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to refresh portrait:', error);
    } finally {
      setGeneratingPortrait(false);
    }
  };
  if (generatingPortrait) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-green-500" />
          <span className="text-sm">Analyzing your music taste...</span>
        </div>
      </Card>
    );
  }
  if (isConnected && profile) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Spotify Connected</p>
                <p className="text-sm text-muted-foreground">{profile.displayName || profile.email}</p>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleRefreshPortrait}
              variant="outline"
              size="sm"
              disabled={generatingPortrait}
              className="flex-1"
            >
              Refresh Portrait
            </Button>
            <Button
              onClick={handleDisconnect}
              variant="ghost"
              size="sm"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <Music className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium">Spotify</p>
            <p className="text-sm text-muted-foreground">Not connected</p>
          </div>
        </div>
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Spotify'
          )}
        </Button>
      </div>
    </Card>
  );
}