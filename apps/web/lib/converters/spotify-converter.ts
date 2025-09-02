// lib/converters/spotify-converter.ts

import { UnifiedTrack, UnifiedArtist, AudioFeatures } from '@/types/music';
import { SpotifyTrack } from '@/types';

export function convertSpotifyTrack(track: SpotifyTrack): UnifiedTrack {
  // Безопасное извлечение изображений
  const images = track.album?.images || [];
  const artwork = {
    large: images[0]?.url,
    medium: images[1]?.url || images[0]?.url,
    small: images[2]?.url || images[1]?.url || images[0]?.url,
  };

  return {
    id: `spotify_${track.id}`,
    isrc: track.isrc,
    title: track.name || 'Unknown Track',
    artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    album: track.album?.name,
    // Убираем поля которых нет в типе SpotifyTrack
    duration: track.duration_ms || 0,
    
    // Spotify специфичные поля
    spotifyId: track.id,
    spotifyUri: track.uri,
    popularity: track.popularity,
    previewUrl: track.preview_url || undefined,
    
    // Обложки с fallback
    artwork: artwork.large ? artwork : undefined,
    
    // Жанры будем получать из артиста
    genres: undefined,
  };
}

export function convertSpotifyArtist(artist: any): UnifiedArtist {
  const images = artist.images || [];
  const artistImages = {
    large: images[0]?.url,
    medium: images[1]?.url || images[0]?.url,
    small: images[2]?.url || images[1]?.url || images[0]?.url,
  };

  return {
    id: `spotify_${artist.id}`,
    name: artist.name || 'Unknown Artist',
    spotifyId: artist.id,
    popularity: artist.popularity,
    followers: artist.followers?.total,
    genres: artist.genres || [],
    images: artistImages.large ? artistImages : undefined,
  };
}

export function convertSpotifyAudioFeatures(features: any): AudioFeatures {
  return {
    trackId: features.id,
    energy: features.energy || 0,
    valence: features.valence || 0,
    danceability: features.danceability || 0,
    tempo: features.tempo || 0,
    acousticness: features.acousticness || 0,
    instrumentalness: features.instrumentalness || 0,
    speechiness: features.speechiness || 0,
    liveness: features.liveness || 0,
    loudness: features.loudness || 0,
    key: features.key || 0,
    mode: features.mode || 0,
    timeSignature: features.time_signature || 4,
  };
}

// Конвертер для полного трека из Spotify Web API (не из нашего типа)
export function convertSpotifyApiTrack(track: any): UnifiedTrack {
  const images = track.album?.images || [];
  const artwork = {
    large: images[0]?.url,
    medium: images[1]?.url || images[0]?.url,
    small: images[2]?.url || images[1]?.url || images[0]?.url,
  };

  return {
    id: `spotify_${track.id}`,
    isrc: track.external_ids?.isrc,
    title: track.name || 'Unknown Track',
    artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
    album: track.album?.name,
    albumArtist: track.album?.artists?.[0]?.name,
    duration: track.duration_ms || 0,
    releaseDate: track.album?.release_date,
    
    spotifyId: track.id,
    spotifyUri: track.uri,
    popularity: track.popularity,
    previewUrl: track.preview_url || undefined,
    
    artwork: artwork.large ? artwork : undefined,
  };
}
