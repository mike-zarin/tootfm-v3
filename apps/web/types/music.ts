// types/music.ts
// ============= Основные унифицированные типы =============
export interface UnifiedTrack {
  // Идентификаторы
  id: string;                    // наш внутренний ID
  isrc?: string;                 // International Standard Recording Code
  // Основная информация
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  duration: number;              // в ms
  releaseDate?: string;          // ISO date
  // Идентификаторы источников
  spotifyId?: string;
  appleMusicId?: string;
  youtubeId?: string;
  lastfmMbid?: string;          // MusicBrainz ID от Last.fm
  // Метаданные для анализа
  genres?: string[];
  energy?: number;               // 0-1 (Spotify/вычисляемый)
  valence?: number;              // 0-1 настроение (Spotify)
  danceability?: number;         // 0-1 (Spotify)
  tempo?: number;                // BPM
  popularity?: number;           // 0-100
  acousticness?: number;         // 0-1
  instrumentalness?: number;     // 0-1
  // Last.fm специфика
  playCount?: number;            // сколько раз слушал юзер
  lastPlayed?: Date;             // когда последний раз
  userLoved?: boolean;           // лайкнул на Last.fm
  tags?: string[];               // теги от Last.fm
  // URL для стриминга/превью
  spotifyUri?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  previewUrl?: string;           // 30-сек превью
  // Обложки
  artwork?: {
    small?: string;              // 64x64
    medium?: string;             // 300x300
    large?: string;              // 600x600
  };
}
export interface UnifiedArtist {
  id: string;
  name: string;
  // Идентификаторы
  spotifyId?: string;
  appleMusicId?: string;
  lastfmMbid?: string;
  // Метрики
  popularity?: number;           // 0-100
  followers?: number;
  monthlyListeners?: number;
  // Жанры и теги
  genres?: string[];
  tags?: string[];               // Last.fm теги
  // Статистика пользователя
  playCount?: number;            // Last.fm scrobbles
  userRank?: number;             // позиция в топе юзера
  images?: {
    small?: string;
    medium?: string;
    large?: string;
  };
}
export interface AudioFeatures {
  trackId: string;
  energy: number;
  valence: number;
  danceability: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
  loudness: number;
  key: number;
  mode: number;
  timeSignature: number;
}
export interface MusicSource {
  type: 'spotify' | 'apple' | 'lastfm' | 'youtube';
  isConnected: boolean;
  // Базовые методы
  searchTracks(query: string): Promise<UnifiedTrack[]>;
  getTrack(id: string): Promise<UnifiedTrack | null>;
  // Персональные данные
  getTopTracks(period?: 'short' | 'medium' | 'long'): Promise<UnifiedTrack[]>;
  getTopArtists(period?: 'short' | 'medium' | 'long'): Promise<UnifiedArtist[]>;
  getRecentlyPlayed(limit?: number): Promise<UnifiedTrack[]>;
  // Аналитика (если поддерживается)
  getAudioFeatures?(trackIds: string[]): Promise<AudioFeatures[]>;
  getListeningHistory?(from: Date, to: Date): Promise<ListeningEntry[]>;
}
export interface ListeningEntry {
  track: UnifiedTrack;
  playedAt: Date;
  context?: string;              // playlist, album, radio
  skipped?: boolean;
  duration?: number;              // сколько слушал
}
export interface GenrePreference {
  name: string;
  score: number;                // 0-100 насколько любит
  trackCount: number;
  source: ('spotify' | 'apple' | 'lastfm')[];
}
export interface MusicPortrait {
  userId: string;
  // Подключенные источники
  sources: {
    spotify?: {
      connected: boolean;
      lastSync?: Date;
      trackCount?: number;
    };
    apple?: {
      connected: boolean;
      lastSync?: Date;
      trackCount?: number;
    };
    lastfm?: {
      connected: boolean;
      username?: string;
      scrobbles?: number;
      lastSync?: Date;
    };
    youtube?: {
      connected: boolean;
      lastSync?: Date;
    };
  };
  // Агрегированные данные
  topTracks: {
    allTime: UnifiedTrack[];
    recent: UnifiedTrack[];      // последние 4 недели
    sixMonths: UnifiedTrack[];   // последние 6 месяцев
  };
  topArtists: {
    allTime: UnifiedArtist[];
    recent: UnifiedArtist[];
    sixMonths: UnifiedArtist[];
  };
  // Жанровый профиль
  genres: GenrePreference[];
  // Временные паттерны
  listeningPatterns: {
    hourlyDistribution: number[]; // 24 часа, активность
    weeklyDistribution: number[]; // 7 дней
    seasonalTrends?: any;
  };
  // Характеристики вкуса
  audioProfile: {
    energy: number;               // средняя энергичность
    valence: number;              // средняя позитивность
    danceability: number;
    tempo: number;
    acousticness: number;
    mainstreamScore: number;      // 0-100 насколько мейнстрим
  };
  // История и статистика
  stats: {
    totalTracks: number;
    totalArtists: number;
    totalPlayTime?: number;       // в минутах
    avgPlaysPerTrack?: number;
    discoveryRate?: number;       // новые треки в месяц
  };
  lastUpdated: Date;
}
// Для матчинга треков между сервисами
export interface TrackMatcher {
  matchByISRC(isrc: string): Promise<UnifiedTrack[]>;
  matchByMetadata(
    title: string, 
    artist: string, 
    album?: string
  ): Promise<UnifiedTrack[]>;
  calculateSimilarity(track1: UnifiedTrack, track2: UnifiedTrack): number;
}
// Типы для конвертеров
export type TrackConverter<T> = (sourceTrack: T) => UnifiedTrack;
export type ArtistConverter<T> = (sourceArtist: T) => UnifiedArtist;
