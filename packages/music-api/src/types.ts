// Core music service types
export interface Track {
  id: string;
  isrc?: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  imageUrl?: string;
  previewUrl?: string;
  spotifyId?: string;
  appleId?: string;
  lastfmId?: string;
  energy?: number;
  danceability?: number;
  valence?: number;
}

export interface Artist {
  id: string;
  name: string;
  imageUrl?: string;
  genres?: string[];
}

export interface MusicProfile {
  service: 'spotify' | 'apple' | 'lastfm';
  topTracks: Track[];
  topArtists: Artist[];
  topGenres: { name: string; weight: number }[];
  lastSyncedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface MusicService {
  name: string;
  connect(userId: string, tokens: AuthTokens): Promise<void>;
  disconnect(userId: string): Promise<void>;
  getTopTracks(userId: string, limit?: number): Promise<Track[]>;
  getTopArtists(userId: string, limit?: number): Promise<Artist[]>;
  searchTracks(query: string, limit?: number): Promise<Track[]>;
  createPlaylist(name: string, tracks: Track[], userId: string): Promise<string>;
  refreshToken?(userId: string): Promise<AuthTokens>;
}
