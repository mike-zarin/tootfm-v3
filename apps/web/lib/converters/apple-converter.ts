// lib/converters/apple-converter.ts
import { UnifiedTrack, UnifiedArtist } from '@/types/music';
export function convertAppleTrack(track: any): UnifiedTrack {
  const attributes = track.attributes || {};
  const relationships = track.relationships || {};
  // Apple Music использует URL шаблоны для артворка
  const artworkUrl = attributes.artwork?.url;
  const artwork = artworkUrl ? {
    small: artworkUrl.replace('{w}', '64').replace('{h}', '64'),
    medium: artworkUrl.replace('{w}', '300').replace('{h}', '300'),
    large: artworkUrl.replace('{w}', '600').replace('{h}', '600'),
  } : undefined;
  return {
    id: `apple_${track.id}`,
    // ISRC может быть в разных местах
    isrc: attributes.isrc || relationships?.songs?.data?.[0]?.attributes?.isrc,
    title: attributes.name || 'Unknown Track',
    artist: attributes.artistName || 'Unknown Artist',
    album: attributes.albumName,
    duration: attributes.durationInMillis || 0,
    releaseDate: attributes.releaseDate,
    // Apple Music специфичные
    appleMusicId: track.id,
    appleMusicUrl: attributes.url,
    // Метаданные
    genres: attributes.genreNames || [],
    previewUrl: attributes.previews?.[0]?.url,
    // Обложки
    artwork,
  };
}
export function convertAppleArtist(artist: any): UnifiedArtist {
  const attributes = artist.attributes || {};
  const artworkUrl = attributes.artwork?.url;
  const images = artworkUrl ? {
    small: artworkUrl.replace('{w}', '64').replace('{h}', '64'),
    medium: artworkUrl.replace('{w}', '300').replace('{h}', '300'),
    large: artworkUrl.replace('{w}', '600').replace('{h}', '600'),
  } : undefined;
  return {
    id: `apple_${artist.id}`,
    name: attributes.name || 'Unknown Artist',
    appleMusicId: artist.id,
    genres: attributes.genreNames || [],
    images,
  };
}
// Конвертер для Library (личная библиотека) отличается от Catalog
export function convertAppleLibraryTrack(track: any): UnifiedTrack {
  const attributes = track.attributes || {};
  return {
    id: `apple_lib_${track.id}`,
    title: attributes.name || 'Unknown Track',
    artist: attributes.artistName || 'Unknown Artist',
    album: attributes.albumName,
    duration: attributes.durationInMillis || 0,
    // В Library меньше метаданных
    appleMusicId: track.id,
    playCount: attributes.playParams?.playCount,
    lastPlayed: attributes.lastPlayedDate ? new Date(attributes.lastPlayedDate) : undefined,
    artwork: undefined, // Нужно отдельно запрашивать
  };
}
