'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { Search, Plus, Music2 } from 'lucide-react';
interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images?: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  uri: string;
}
interface TrackSearchProps {
  partyId: string;
  onTrackAdded?: () => void;
}
export default function TrackSearch({ partyId, onTrackAdded }: TrackSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addingTrack, setAddingTrack] = useState<string | null>(null);
  const { toast } = useToast();
  const searchTracks = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const response = await fetch('/api/music/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setResults(data.tracks || []);
    } catch (error) {
      toast({
        title: 'Search failed',
        description: 'Could not search for tracks. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSearching(false);
    }
  };
  const addTrack = async (track: SpotifyTrack) => {
    setAddingTrack(track.id);
    try {
      const response = await fetch(`/api/parties/${partyId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotifyId: track.id,
          title: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          imageUrl: track.album.images?.[0]?.url || '',
          duration: track.duration_ms,
          previewUrl: track.uri
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add track');
      }
      toast({
        title: 'Track added!',
        description: `${track.name} has been added to the queue`,
      });
      // Clear search
      setQuery('');
      setResults([]);
      // Notify parent
      if (onTrackAdded) {
        onTrackAdded();
      }
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Error adding track:', error);
      toast({
        title: 'Failed to add track',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setAddingTrack(null);
    }
  };
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  // Helper function to get album image safely
  const getAlbumImage = (track: SpotifyTrack) => {
    return track.album?.images?.[0]?.url || null;
  };
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search for songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchTracks()}
          className="flex-1"
        />
        <Button onClick={searchTracks} disabled={searching}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
      {/* Search Results */}
      {results.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Search Results</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((track) => {
              const albumImage = getAlbumImage(track);
              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  {/* Album Art */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    {albumImage ? (
                      <Image
                        src={albumImage}
                        alt={track.album.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded bg-muted flex items-center justify-center">
                        <Music2 className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{track.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artists.map(a => a.name).join(', ')} • {track.album.name}
                    </p>
                  </div>
                  {/* Duration */}
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(track.duration_ms)}
                  </span>
                  {/* Add Button */}
                  <Button
                    size="sm"
                    onClick={() => addTrack(track)}
                    disabled={addingTrack === track.id}
                  >
                    {addingTrack === track.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}