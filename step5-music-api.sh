#!/bin/bash

# step5-music-api.sh - Music API Integration Package
# CTO: Spotify, Apple Music, Last.fm интеграции

set -e

echo "🎵 Step 5: Setting up Music API Package"
echo "========================================"

# Create music-api package directory
mkdir -p packages/music-api/src

# 1. Music API package.json
echo "📦 Creating music-api package.json..."
cat > packages/music-api/package.json << 'EOF'
{
  "name": "@tootfm/music-api",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@tootfm/database": "*",
    "spotify-web-api-node": "^5.0.2"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/spotify-web-api-node": "^5.0.11",
    "typescript": "^5.3.3"
  }
}
EOF

# 2. Core types and interfaces
echo "📝 Creating types.ts..."
cat > packages/music-api/src/types.ts << 'EOF'
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
EOF

# 3. Spotify Service Implementation
echo "�� Creating spotify.service.ts..."
cat > packages/music-api/src/spotify.service.ts << 'EOF'
import { MusicService, Track, Artist, AuthTokens } from './types';
import SpotifyWebApi from 'spotify-web-api-node';

export class SpotifyService implements MusicService {
  name = 'spotify';
  private spotifyApi: SpotifyWebApi;

  constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
  }

  async connect(userId: string, tokens: AuthTokens): Promise<void> {
    const { prisma } = await import('@tootfm/database');
    
    await prisma.musicProfile.upsert({
      where: {
        userId_service: {
          userId,
          service: 'spotify'
        }
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        lastSyncedAt: new Date()
      },
      create: {
        userId,
        service: 'spotify',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      }
    });
  }

  async disconnect(userId: string): Promise<void> {
    const { prisma } = await import('@tootfm/database');
    
    await prisma.musicProfile.delete({
      where: {
        userId_service: {
          userId,
          service: 'spotify'
        }
      }
    });
  }

  async getTopTracks(userId: string, limit = 50): Promise<Track[]> {
    const tokens = await this.getValidTokens(userId);
    this.spotifyApi.setAccessToken(tokens.accessToken);
    
    const response = await this.spotifyApi.getMyTopTracks({ 
      limit, 
      time_range: 'medium_term' 
    });
    
    return response.body.items.map(item => ({
      id: `spotify_${item.id}`,
      spotifyId: item.id,
      isrc: item.external_ids?.isrc,
      title: item.name,
      artist: item.artists[0]?.name || 'Unknown',
      album: item.album?.name,
      duration: item.duration_ms,
      imageUrl: item.album?.images[0]?.url,
      previewUrl: item.preview_url
    }));
  }

  async getTopArtists(userId: string, limit = 50): Promise<Artist[]> {
    const tokens = await this.getValidTokens(userId);
    this.spotifyApi.setAccessToken(tokens.accessToken);
    
    const response = await this.spotifyApi.getMyTopArtists({ 
      limit, 
      time_range: 'medium_term' 
    });
    
    return response.body.items.map(item => ({
      id: `spotify_${item.id}`,
      name: item.name,
      imageUrl: item.images[0]?.url,
      genres: item.genres
    }));
  }

  async searchTracks(query: string, limit = 20): Promise<Track[]> {
    // Use client credentials for search
    await this.spotifyApi.clientCredentialsGrant();
    
    const response = await this.spotifyApi.searchTracks(query, { limit });
    
    return response.body.tracks?.items.map(item => ({
      id: `spotify_${item.id}`,
      spotifyId: item.id,
      title: item.name,
      artist: item.artists[0]?.name || 'Unknown',
      album: item.album?.name,
      duration: item.duration_ms,
      imageUrl: item.album?.images[0]?.url,
      previewUrl: item.preview_url
    })) || [];
  }

  async createPlaylist(name: string, tracks: Track[], userId: string): Promise<string> {
    const tokens = await this.getValidTokens(userId);
    this.spotifyApi.setAccessToken(tokens.accessToken);
    
    const meResponse = await this.spotifyApi.getMe();
    const spotifyUserId = meResponse.body.id;
    
    const playlist = await this.spotifyApi.createPlaylist(spotifyUserId, name, {
      description: `Created by tootFM on ${new Date().toLocaleDateString()}`,
      public: false
    });
    
    const spotifyUris = tracks
      .filter(t => t.spotifyId)
      .map(t => `spotify:track:${t.spotifyId}`);
    
    if (spotifyUris.length > 0) {
      await this.spotifyApi.addTracksToPlaylist(playlist.body.id, spotifyUris);
    }
    
    return playlist.body.external_urls.spotify;
  }

  async refreshToken(userId: string): Promise<AuthTokens> {
    const { prisma } = await import('@tootfm/database');
    
    const profile = await prisma.musicProfile.findUnique({
      where: {
        userId_service: {
          userId,
          service: 'spotify'
        }
      }
    });
    
    if (!profile?.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    this.spotifyApi.setRefreshToken(profile.refreshToken);
    const data = await this.spotifyApi.refreshAccessToken();
    
    const tokens: AuthTokens = {
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token || profile.refreshToken,
      expiresAt: new Date(Date.now() + data.body.expires_in * 1000)
    };
    
    await prisma.musicProfile.update({
      where: { id: profile.id },
      data: {
        accessToken: tokens.accessToken,
        expiresAt: tokens.expiresAt
      }
    });
    
    return tokens;
  }

  private async getValidTokens(userId: string): Promise<AuthTokens> {
    const { prisma } = await import('@tootfm/database');
    
    const profile = await prisma.musicProfile.findUnique({
      where: {
        userId_service: {
          userId,
          service: 'spotify'
        }
      }
    });
    
    if (!profile?.accessToken) {
      throw new Error('User not connected to Spotify');
    }
    
    if (profile.expiresAt && profile.expiresAt < new Date()) {
      return await this.refreshToken(userId);
    }
    
    return {
      accessToken: profile.accessToken,
      refreshToken: profile.refreshToken || undefined,
      expiresAt: profile.expiresAt || undefined
    };
  }
}
EOF

# 4. Music Service Factory
echo "🏭 Creating service factory..."
cat > packages/music-api/src/factory.ts << 'EOF'
import { MusicService, MusicProfile } from './types';
import { SpotifyService } from './spotify.service';

export class MusicServiceFactory {
  private static services: Map<string, MusicService> = new Map([
    ['spotify', new SpotifyService()]
  ]);

  static getService(type: 'spotify' | 'apple' | 'lastfm'): MusicService {
    const service = this.services.get(type);
    if (!service) {
      throw new Error(`Music service ${type} not implemented yet`);
    }
    return service;
  }

  static async syncUserProfile(userId: string, service: 'spotify' | 'apple' | 'lastfm'): Promise<MusicProfile> {
    const musicService = this.getService(service);
    
    const [topTracks, topArtists] = await Promise.all([
      musicService.getTopTracks(userId, 50),
      musicService.getTopArtists(userId, 50)
    ]);
    
    // Calculate genre weights
    const genreMap = new Map<string, number>();
    topArtists.forEach(artist => {
      artist.genres?.forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
      });
    });
    
    const topGenres = Array.from(genreMap.entries())
      .map(([name, count]) => ({ name, weight: count }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 20);
    
    // Store in database
    const { prisma } = await import('@tootfm/database');
    
    await prisma.musicProfile.update({
      where: {
        userId_service: {
          userId,
          service
        }
      },
      data: {
        topTracks: topTracks as any,
        topArtists: topArtists as any,
        topGenres: topGenres as any,
        lastSyncedAt: new Date()
      }
    });
    
    return {
      service,
      topTracks,
      topArtists,
      topGenres,
      lastSyncedAt: new Date()
    };
  }
}
EOF

# 5. Main index export
echo "📄 Creating index.ts..."
cat > packages/music-api/src/index.ts << 'EOF'
export * from './types';
export { SpotifyService } from './spotify.service';
export { MusicServiceFactory } from './factory';
EOF

# 6. tsconfig for music-api package
echo "⚙️ Creating music-api tsconfig.json..."
cat > packages/music-api/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

echo ""
echo "✅ Step 5 Complete: Music API package created!"
echo ""
echo "📋 Created files:"
echo "  - packages/music-api/src/types.ts"
echo "  - packages/music-api/src/spotify.service.ts"
echo "  - packages/music-api/src/factory.ts"
echo "  - packages/music-api/src/index.ts"
echo ""
echo "🎵 Features:"
echo "  - Spotify integration ready"
echo "  - Type-safe interfaces"
echo "  - Token refresh logic"
echo "  - Service factory pattern"
echo ""
echo "Ready for Step 6: UI Components"
