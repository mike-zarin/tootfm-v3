"use client"

// apps/web/components/music/ConnectSpotify.tsx

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

export function ConnectSpotify() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<any>(null);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  const checkConnection = async () => {
    try {
      const res = await fetch('/api/music/sync');
      const data = await res.json();
      setStatus(data);
      setIsConnected(data.hasSpotify);
    } catch (_error) {
      // console.error('Failed to check connection:', error);
    }
  };
  
  const handleConnect = () => {
    signIn('spotify', { callbackUrl: window.location.pathname });
  };
  
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/music/sync', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert(`Synced ${data.tracksCount} tracks and ${data.artistsCount} artists!`);
        checkConnection(); // Обновляем статус
      } else {
        alert('Failed to sync: ' + (data.error || 'Unknown error'));
      }
    } catch (_error) {
      // console.error('Sync failed:', error);
      alert('Failed to sync music profile');
    } finally {
      setIsSyncing(false);
    }
  };
  
  if (isConnected) {
    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-green-50 border-green-300">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-green-600">●</span>
            <span className="font-medium">Spotify Connected</span>
          </div>
          {status && (
            <div className="text-sm text-gray-600 mt-1">
              {status.tracksCount > 0 ? (
                <>
                  {status.tracksCount} tracks • {status.artistsCount} artists
                  {status.lastSync && (
                    <> • Last synced: {new Date(status.lastSync).toLocaleTimeString()}</>
                  )}
                </>
              ) : (
                'No tracks synced yet'
              )}
            </div>
          )}
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : 'Sync Tracks'}
        </button>
      </div>
    );
  }
  
  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
    >
      Connect Spotify
    </button>
  );
}