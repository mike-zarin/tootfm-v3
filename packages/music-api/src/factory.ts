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
