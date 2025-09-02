// lib/converters/spotify-converter.ts

import { UnifiedTrack, UnifiedArtist } from '@/types/music';
import { SpotifyTrack } from '@/types';

export function convertSpotifyTrack(track: SpotifyTrack): UnifiedTrack {
  return {
    id: `spotify_${track.id}`,
    isrc: track.isrc,
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    duration: track.duration_ms,
    spotifyId: track.id,
    spotifyUri: track.uri,
    popularity: track.popularity,
    previewUrl: track.preview_url,
    artwork: {
      small: track.album.images[2]?.url,
      medium: track.album.images[1]?.url,
      large: track.album.images[0]?.url,
    }
  };
}

export function convertSpotifyArtist(artist: any): UnifiedArtist {
  return {
    id: `spotify_${artist.id}`,
    name: artist.name,
    spotifyId: artist.id,
    popularity: artist.popularity,
    followers: artist.followers?.total,
    genres: artist.genres || [],
    images: {
      small: artist.images?.[2]?.url,
      medium: artist.images?.[1]?.url,
      large: artist.images?.[0]?.url,
    }
  };
}
