'use client';
import { AppleMusicConnect } from '@/components/apple-music/AppleMusicConnect';
import { SpotifyConnect } from '@/components/spotify/SpotifyConnect';
import { EnhancedMusicPortrait } from '@/components/music/MusicPortraitDisplay';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
export default function TestApplePage() {
  const { data: session } = useSession();
  const [portrait, setPortrait] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchPortrait = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/music/portrait?refresh=true');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch portrait');
      }
      const data = await response.json();
      setPortrait(data.portrait);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portrait');
    } finally {
      setLoading(false);
    }
  };
  if (!session) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Please sign in first</h1>
        <p>You need to be signed in to connect music services.</p>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Music Services Test</h1>
        <p className="text-gray-600">Connect your music services and generate your music portrait</p>
      </div>
      {/* Services Connection */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Spotify</h2>
          <SpotifyConnect />
        </div>
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Apple Music</h2>
          <AppleMusicConnect />
        </div>
      </div>
      {/* Generate Portrait */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Music Portrait</h2>
        <Button 
          onClick={fetchPortrait}
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Generating...' : 'Generate Portrait'}
        </Button>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg mb-4">
            {error}
          </div>
        )}
        {portrait && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              {portrait.sources?.spotify && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  Spotify Connected
                </span>
              )}
              {portrait.sources?.apple && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  Apple Music Connected
                </span>
              )}
            </div>
            <div className="text-white">
              <h3 className="text-xl font-bold mb-4">Apple Music Portrait</h3>
              <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(portrait, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}