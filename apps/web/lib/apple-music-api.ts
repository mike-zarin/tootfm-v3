// lib/apple-music-api.ts
import { storage } from './storage';
interface AppleMusicTrack {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    genreNames: string[];
    durationInMillis: number;
    artwork?: {
      url: string;
      width: number;
      height: number;
    };
    isrc?: string;
    previews?: Array<{
      url: string;
    }>;
  };
}
interface AppleMusicArtist {
  id: string;
  attributes: {
    name: string;
    genreNames: string[];
    artwork?: {
      url: string;
    };
  };
}
interface AppleMusicPortrait {
  topTracks: Array<{
    id: string;
    name: string;
    artist: string;
    imageUrl: string | null;
    isrc?: string;
  }>;
  topArtists: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    genres: string[];
  }>;
  topGenres: string[];
  listeningHistory: Array<{
    playCount: number;
    track: AppleMusicTrack;
  }>;
}
export class AppleMusicAPI {
  private developerToken: string;
  private musicUserToken: string | null = null;
  constructor(developerToken: string) {
    this.developerToken = developerToken;
  }
  setMusicUserToken(token: string) {
    this.musicUserToken = token;
  }
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.musicUserToken) {
      throw new Error('Music User Token not set');
    }
    const response = await fetch(`https://api.music.apple.com${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.developerToken}`,
        'Music-User-Token': this.musicUserToken,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (!response.ok) {
      const error = await response.text();
      console.error('[ERROR]' + ' ' + `Apple Music API error: ${response.status}`, error);
      throw new Error(`Apple Music API error: ${response.status}`);
    }
    return response.json();
  }
  // Получить Heavy Rotation (частые прослушивания)
  async getHeavyRotation(limit: number = 20) {
    try {
      const data = await this.makeRequest(
        `/v1/me/history/heavy-rotation?limit=${limit}`
      );
      return data.data || [];
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to fetch heavy rotation:', error);
      return [];
    }
  }
  // Получить недавно проигранные треки
  async getRecentlyPlayed(limit: number = 30) {
    try {
      const data = await this.makeRequest(
        `/v1/me/recent/played?limit=${limit}`
      );
      return data.data || [];
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to fetch recently played:', error);
      return [];
    }
  }
  // Получить рекомендации на основе истории
  async getRecommendations() {
    try {
      const data = await this.makeRequest(
        `/v1/me/recommendations?limit=30`
      );
      return data.data || [];
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to fetch recommendations:', error);
      return [];
    }
  }
  // Получить библиотеку пользователя
  async getLibrarySongs(limit: number = 100) {
    try {
      const data = await this.makeRequest(
        `/v1/me/library/songs?limit=${limit}`
      );
      return data.data || [];
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to fetch library songs:', error);
      return [];
    }
  }
  // Получить плейлисты пользователя
  async getLibraryPlaylists(limit: number = 25) {
    try {
      const data = await this.makeRequest(
        `/v1/me/library/playlists?limit=${limit}`
      );
      return data.data || [];
    } catch (error) {
      console.error('[ERROR]' + ' ' + 'Failed to fetch library playlists:', error);
      return [];
    }
  }
  // Поиск треков для сопоставления ISRC
  async searchTrackByISRC(isrc: string) {
    try {
      const data = await this.makeRequest(
        `/v1/catalog/us/songs?filter[isrc]=${isrc}`
      );
      return data.data?.[0] || null;
    } catch (error) {
      console.error('[ERROR]' + ' ' + `Failed to search track by ISRC ${isrc}:`, error);
      return null;
    }
  }
  // Генерация музыкального портрета
  async generateMusicPortrait(): Promise<AppleMusicPortrait> {
    const [heavyRotation, recentlyPlayed, librarySongs] = await Promise.all([
      this.getHeavyRotation(50),
      this.getRecentlyPlayed(50),
      this.getLibrarySongs(100)
    ]);
    // Объединяем все треки
    const allTracks = [...heavyRotation, ...recentlyPlayed, ...librarySongs];
    // Подсчитываем частоту треков
    const trackFrequency = new Map<string, { count: number; track: AppleMusicTrack }>();
    allTracks.forEach((item: any) => {
      const track = item.attributes ? item : item.data?.[0];
      if (track?.id) {
        const existing = trackFrequency.get(track.id);
        trackFrequency.set(track.id, {
          count: (existing?.count || 0) + 1,
          track
        });
      }
    });
    // Сортируем по популярности
    const sortedTracks = Array.from(trackFrequency.values())
      .sort((a, b) => b.count - a.count);
    // Собираем жанры
    const genreMap = new Map<string, number>();
    sortedTracks.forEach(({ track }) => {
      track.attributes?.genreNames?.forEach((genre: string) => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    });
    const topGenres = Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([genre]) => genre);
    // Собираем артистов
    const artistMap = new Map<string, { count: number; genres: Set<string> }>();
    sortedTracks.forEach(({ track }) => {
      const artistName = track.attributes?.artistName;
      if (artistName) {
        const existing = artistMap.get(artistName);
        const genres = new Set(existing?.genres || []);
        track.attributes?.genreNames?.forEach((g: string) => genres.add(g));
        artistMap.set(artistName, {
          count: (existing?.count || 0) + 1,
          genres
        });
      }
    });
    const topArtists = Array.from(artistMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([name, data]) => ({
        id: `artist_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name,
        imageUrl: null, // Apple Music API не всегда возвращает изображения артистов
        genres: Array.from(data.genres)
      }));
    // Форматируем топ треки
    const topTracks = sortedTracks.slice(0, 30).map(({ track }) => ({
      id: track.id,
      name: track.attributes?.name || 'Unknown',
      artist: track.attributes?.artistName || 'Unknown Artist',
      imageUrl: track.attributes?.artwork?.url
        ?.replace('{w}', '300')
        ?.replace('{h}', '300') || null,
      isrc: track.attributes?.isrc
    }));
    return {
      topTracks,
      topArtists,
      topGenres,
      listeningHistory: sortedTracks.slice(0, 100).map(({ count, track }) => ({
        playCount: count,
        track
      }))
    };
  }
}
// Хелпер для получения портрета Apple Music пользователя
export async function getAppleMusicPortrait(userId: string, developerToken: string) {
  const user = await storage.getUserById(userId);
  if (!user?.appleMusicProfile?.musicUserToken) {
    throw new Error('Apple Music not connected');
  }
  const api = new AppleMusicAPI(developerToken);
  api.setMusicUserToken(user.appleMusicProfile.musicUserToken);
  return api.generateMusicPortrait();
}