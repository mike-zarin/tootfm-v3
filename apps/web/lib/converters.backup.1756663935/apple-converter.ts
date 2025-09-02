// lib/converters/apple-converter.ts

import { UnifiedTrack, UnifiedArtist } from '@/types/music';

export function convertAppleTrack(track: any): UnifiedTrack {
  return {
    id: `apple_${track.id}`,
    isrc: track.attributes?.isrc,
    title: track.attributes?.name || '',
    artist: track.attributes?.artistName || '',
    album: track.attributes?.albumName,
    duration: track.attributes?.durationInMillis || 0,
    releaseDate: track.attributes?.releaseDate,
    appleMusicId: track.id,
    appleMusicUrl: track.attributes?.url,
    genres: track.attributes?.genreNames,
    previewUrl: track.attributes?.previews?.[0]?.url,
    artwork: {
      small: track.attributes?.artwork?.url?.replace('{w}x{h}', '64x64'),
      medium: track.attributes?.artwork?.url?.replace('{w}x{h}', '300x300'),
      large: track.attributes?.artwork?.url?.replace('{w}x{h}', '600x600'),
    }
  };
}

export function convertAppleArtist(artist: any): UnifiedArtist {
  return {
    id: `apple_${artist.id}`,
    name: artist.attributes?.name || '',
    appleMusicId: artist.id,
    genres: artist.attributes?.genreNames || [],
    images: {
      small: artist.attributes?.artwork?.url?.replace('{w}x{h}', '64x64'),
      medium: artist.attributes?.artwork?.url?.replace('{w}x{h}', '300x300'),
      large: artist.attributes?.artwork?.url?.replace('{w}x{h}', '600x600'),
    }
  };
}
