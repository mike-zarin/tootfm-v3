// lib/converters/utils.ts

// Нормализация жанров между сервисами
export function normalizeGenre(genre: string): string {
  const genreMap: Record<string, string> = {
    // Spotify -> Common
    'indie rock': 'indie',
    'alternative rock': 'alternative',
    'hip hop': 'hip-hop',
    'r&b': 'rnb',
    // Apple Music -> Common
    'Alternative': 'alternative',
    'Hip-Hop/Rap': 'hip-hop',
    'R&B/Soul': 'rnb',
    // Last.fm -> Common
    'electronic': 'electronic',
    'electronica': 'electronic',
  };
  
  const normalized = genre.toLowerCase().trim();
  return genreMap[normalized] || normalized;
}

// Безопасное извлечение ISRC
export function extractISRC(track: any): string | undefined {
  // Spotify
  if (track.external_ids?.isrc) return track.external_ids.isrc;
  // Apple Music
  if (track.attributes?.isrc) return track.attributes.isrc;
  if (track.relationships?.songs?.data?.[0]?.attributes?.isrc) {
    return track.relationships.songs.data[0].attributes.isrc;
  }
  // Прямое поле
  if (track.isrc) return track.isrc;
  
  return undefined;
}

// Генерация уникального ID
export function generateTrackId(service: string, id?: string, fallback?: string): string {
  if (id) return `${service}_${id}`;
  if (fallback) return `${service}_${fallback.replace(/\s+/g, '_')}`;
  return `${service}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
