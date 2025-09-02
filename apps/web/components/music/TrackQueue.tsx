"use client"

// apps/web/components/music/TrackQueue.tsx


import { useState, useEffect } from 'react';
import { Music, ThumbsUp, ThumbsDown, Trash2, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Track } from '@/types';
import Image from 'next/image';

interface TrackQueueProps {
  partyId: string;
  isHost: boolean;
  currentUserId: string;
}

interface TrackWithVotes extends Track {
  votes: number;
  userVote?: 'up' | 'down';
}

export function TrackQueue({ partyId, isHost, currentUserId }: TrackQueueProps) {
  const [tracks, setTracks] = useState<TrackWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTracks = async () => {
    try {
      const response = await fetch(`/api/parties/${partyId}/tracks`);
      if (!response.ok) throw new Error('Failed to fetch tracks');
      
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (_error) {
      toast({
        title: 'Error loading tracks',
        description: 'Could not load the track queue.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
    // Refresh every 5 seconds
    const interval = setInterval(fetchTracks, 5000);
    return () => clearInterval(interval);
  }, [partyId]);

  const handleVote = async (trackId: string, type: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/parties/${partyId}/tracks/${trackId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (!response.ok) throw new Error('Vote failed');
      
      // Refresh tracks
      fetchTracks();
    } catch (_error) {
      toast({
        title: 'Vote failed',
        description: 'Could not register your vote.',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (trackId: string) => {
    if (!confirm('Are you sure you want to remove this track?')) return;

    try {
      const response = await fetch(`/api/parties/${partyId}/tracks/${trackId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');
      
      toast({
        title: 'Track removed',
        description: 'The track has been removed from the queue.'
      });
      
      // Refresh tracks
      fetchTracks();
    } catch (_error) {
      toast({
        title: 'Delete failed',
        description: 'Could not remove the track.',
        variant: 'destructive'
      });
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '--:--';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading tracks...</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No tracks in queue yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Search and add some tracks to get the party started!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {tracks.map((track, index) => (
        <Card key={track.id} className="p-4">
          <div className="flex items-center gap-4">
            {/* Position */}
            <div className="text-2xl font-bold text-gray-400 w-8 text-center">
              {index + 1}
            </div>

            {/* Album Art */}
            <div className="relative w-16 h-16 flex-shrink-0">
              {track.imageUrl ? (
                <Image
                  src={track.imageUrl}
                  alt={track.album || 'Album art'}
                  fill
                  className="object-cover rounded"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                  <Music className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{track.title}</p>
              <p className="text-sm text-gray-500 truncate">
                {track.artist} {track.album && `• ${track.album}`}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">
                  {formatDuration(track.duration)}
                </span>
                {track.addedByName && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {track.addedByName}
                  </span>
                )}
              </div>
            </div>

            {/* Vote Count */}
            <div className="text-center">
              <Badge variant={track.votes > 0 ? 'default' : 'secondary'}>
                {track.votes > 0 && '+'}{track.votes}
              </Badge>
            </div>

            {/* Vote Buttons */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={track.userVote === 'up' ? 'default' : 'outline'}
                onClick={() => handleVote(track.id, 'up')}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={track.userVote === 'down' ? 'default' : 'outline'}
                onClick={() => handleVote(track.id, 'down')}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>

            {/* Delete Button (Host Only) */}
            {isHost && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(track.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}