// lib/converters/lastfm-converter.ts
import { UnifiedTrack, UnifiedArtist } from '@/types/music';
// Last.fm возвращает разные структуры для разных методов
export function convertLastfmTrack(track: any, method?: string): UnifiedTrack {
  // Обработка разных форматов artist
  let artistName = '';
  if (typeof track.artist === 'string') {
    artistName = track.artist;
  } else if (track.artist?.name) {
    artistName = track.artist.name;
  } else if (track.artist?.['#text']) {
    artistName = track.artist['#text'];
  }
  // Обработка изображений (может быть массив или отсутствовать)
  const images = track.image || [];
  const artwork = images.length > 0 ? {
    small: images.find((i: any) => i.size === 'small')?.['#text'],
    medium: images.find((i: any) => i.size === 'medium')?.['#text'],
    large: images.find((i: any) => i.size === 'large')?.['#text'] ||
            images.find((i: any) => i.size === 'extralarge')?.['#text'],
  } : undefined;
  // Duration может быть в секундах или миллисекундах, или отсутствовать
  let duration = 0;
  if (track.duration) {
    // Если больше 10000, скорее всего в миллисекундах
    duration = track.duration > 10000 ? track.duration : track.duration * 1000;
  }
  return {
    id: `lastfm_${track.mbid || `${track.name}_${artistName}`.replace(/\s+/g, '_')}`,
    lastfmMbid: track.mbid || undefined,
    title: track.name || 'Unknown Track',
    artist: artistName || 'Unknown Artist',
    album: track.album?.['#text'] || track.album?.title,
    duration,
    // Last.fm специфичные
    playCount: track.playcount ? parseInt(track.playcount) : undefined,
    userLoved: track.loved === '1' || track.loved === 1,
    tags: track.toptags?.tag?.map((t: any) => t.name) || [],
    // Для user.getRecentTracks
    lastPlayed: track.date?.uts ? new Date(parseInt(track.date.uts) * 1000) : undefined,
    artwork: artwork?.large || artwork?.medium || artwork?.small ? artwork : undefined,
  };
}
export function convertLastfmArtist(artist: any): UnifiedArtist {
  const images = artist.image || [];
  const artistImages = images.length > 0 ? {
    small: images.find((i: any) => i.size === 'small')?.['#text'],
    medium: images.find((i: any) => i.size === 'medium')?.['#text'],
    large: images.find((i: any) => i.size === 'large')?.['#text'] ||
            images.find((i: any) => i.size === 'extralarge')?.['#text'],
  } : undefined;
  return {
    id: `lastfm_${artist.mbid || artist.name?.replace(/\s+/g, '_')}`,
    name: artist.name || 'Unknown Artist',
    lastfmMbid: artist.mbid || undefined,
    // Статистика
    playCount: artist.playcount ? parseInt(artist.playcount) : undefined,
    userRank: artist['@attr']?.rank ? parseInt(artist['@attr'].rank) : undefined,
    // Метаданные
    tags: artist.tags?.tag?.map((t: any) => t.name) || [],
    images: artistImages?.large || artistImages?.medium || artistImages?.small ? artistImages : undefined,
  };
}
// Специальный конвертер для getTopTracks где структура отличается
export function convertLastfmTopTrack(track: any): UnifiedTrack {
  return convertLastfmTrack({
    ...track,
    artist: track.artist?.name || track.artist,
    playcount: track.playcount,
    '@attr': track['@attr'],
  }, 'topTracks');
}
