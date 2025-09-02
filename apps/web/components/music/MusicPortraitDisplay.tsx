// components/music/EnhancedMusicPortrait.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Music, Zap, Heart, Mic, Users, TrendingUp, Loader2 } from 'lucide-react';
import { SpotifyIcon, AppleMusicIcon } from '@/components/icons';

interface UnifiedPortrait {
  sources: string[];
  topTracks: Array<{
    id: string;
    name: string;
    artist: string;
    imageUrl: string | null;
    sources: {
      spotify?: string;
      appleMusic?: string;
    };
  }>;
  topArtists: Array<{
    name: string;
    imageUrl: string | null;
    genres: string[];
    sources: {
      spotify?: boolean;
      appleMusic?: boolean;
    };
  }>;
  topGenres: string[];
  audioFeatures: {
    danceability: number;
    energy: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    tempo: number;
  };
  partyReadiness: number;
  generatedAt: string;
}

export function EnhancedMusicPortrait() {
  const [portrait, setPortrait] = useState<UnifiedPortrait | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortrait = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/music/unified-portrait');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load portrait');
      }
      
      setPortrait(data.portrait);
    } catch (err) {
      console.error('Error fetching portrait:', err);
      setError(err instanceof Error ? err.message : 'Failed to load music portrait');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortrait();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Analyzing your music taste...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="py-6">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchPortrait}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!portrait) {
    return (
      <Card className="w-full">
        <CardContent className="py-6">
          <p className="text-muted-foreground">No music portrait available</p>
        </CardContent>
      </Card>
    );
  }

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'energy': return <Zap className="h-4 w-4" />;
      case 'danceability': return <Music className="h-4 w-4" />;
      case 'valence': return <Heart className="h-4 w-4" />;
      case 'acousticness': return <Mic className="h-4 w-4" />;
      default: return <Music className="h-4 w-4" />;
    }
  };

  const getFeatureColor = (value: number) => {
    if (value >= 70) return 'text-green-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPartyReadinessColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header with Party Readiness */}
      <Card className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Your Music Portrait</span>
            <div className="flex gap-2">
              {portrait.sources.includes('spotify') && (
                <Badge variant="secondary" className="bg-green-500">
                  <SpotifyIcon className="h-4 w-4 mr-1" />
                  Spotify
                </Badge>
              )}
              {portrait.sources.includes('apple-music') && (
                <Badge variant="secondary" className="bg-gray-800">
                  <AppleMusicIcon className="h-4 w-4 mr-1" />
                  Apple
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">Party Readiness</span>
                <span className="text-2xl font-bold">{portrait.partyReadiness}%</span>
              </div>
              <Progress 
                value={portrait.partyReadiness} 
                className="h-4"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)'
                }}
              />
              <div className={`h-full ${getPartyReadinessColor(portrait.partyReadiness)}`} 
                   style={{ width: `${portrait.partyReadiness}%` }} />
            </div>
            <p className="text-sm opacity-90">
              {portrait.partyReadiness >= 70 
                ? "🎉 Your music is perfect for parties! High energy and danceability detected."
                : portrait.partyReadiness >= 40
                ? "🎵 Good party potential! Mix in some high-energy tracks for better vibes."
                : "😌 Your taste is more chill. Consider adding party anthems for events!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Audio Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Music Profile Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(portrait.audioFeatures)
              .filter(([key]) => key !== 'tempo')
              .map(([feature, value]) => (
                <div key={feature} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getFeatureIcon(feature)}
                    <span className="text-sm capitalize">{feature}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={value} className="flex-1" />
                    <span className={`text-sm font-bold ${getFeatureColor(value)}`}>
                      {value}%
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Tempo</span>
              <span className="font-mono font-bold">{portrait.audioFeatures.tempo} BPM</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Genres */}
      <Card>
        <CardHeader>
          <CardTitle>Top Genres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {portrait.topGenres.map((genre, index) => (
              <Badge 
                key={genre} 
                variant={index < 3 ? "default" : "secondary"}
                className={index < 3 ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}
              >
                {genre}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Artists */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {portrait.topArtists.slice(0, 10).map((artist, index) => (
              <div key={`${artist.name}-${index}`} className="text-center space-y-2">
                <div className="relative">
                  {artist.imageUrl ? (
                    <img 
                      src={artist.imageUrl} 
                      alt={artist.name}
                      className="w-full aspect-square rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      <Music className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 flex gap-1">
                    {artist.sources.spotify && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <SpotifyIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {artist.sources.appleMusic && (
                      <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                        <AppleMusicIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-sm truncate">{artist.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {artist.genres[0] || 'Various'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Tracks Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Top Tracks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {portrait.topTracks.slice(0, 5).map((track, index) => (
              <div key={track.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                <span className="text-lg font-bold text-muted-foreground w-8">
                  {index + 1}
                </span>
                {track.imageUrl ? (
                  <img 
                    src={track.imageUrl} 
                    alt={track.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                </div>
                <div className="flex gap-1">
                  {track.sources.spotify && (
                    <Badge variant="outline" className="px-2">
                      <SpotifyIcon className="h-3 w-3" />
                    </Badge>
                  )}
                  {track.sources.appleMusic && (
                    <Badge variant="outline" className="px-2">
                      <AppleMusicIcon className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(portrait.generatedAt).toLocaleString()}
        <button
          onClick={fetchPortrait}
          className="ml-4 text-primary hover:underline"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}