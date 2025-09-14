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
      previewUrl: item.preview_url || undefined
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
      previewUrl: item.preview_url || undefined
    })) || [];
  }

  async createPlaylist(name: string, tracks: Track[], userId: string): Promise<string> {
    const tokens = await this.getValidTokens(userId);
    this.spotifyApi.setAccessToken(tokens.accessToken);
    
    const meResponse = await this.spotifyApi.getMe();
    const spotifyUserId = meResponse.body.id;
    
    const playlistResponse = await (this.spotifyApi as any).createPlaylist(spotifyUserId, name, {
      description: `Created by tootFM on ${new Date().toLocaleDateString()}`,
      public: false
    });
    
    const spotifyUris = tracks
      .filter(t => t.spotifyId)
      .map(t => `spotify:track:${t.spotifyId}`);
    
    if (spotifyUris.length > 0) {
      await this.spotifyApi.addTracksToPlaylist((playlistResponse as any).body.id, spotifyUris);
    }
    
    return (playlistResponse as any).body.external_urls.spotify;
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
