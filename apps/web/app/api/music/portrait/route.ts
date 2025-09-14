// app/api/music/portrait/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { storage } from '@/lib/storage';
interface AudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  tempo: number;
}
interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    images: Array<{ url: string }>;
  };
}
interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
  genres: string[];
}
async function refreshSpotifyToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }
    return null;
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Error refreshing token:', error);
    return null;
  }
}
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ВАЖНО: getUserByEmail это async функция!
    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Проверяем Spotify подключение
    if (!user.spotifyProfile?.accessToken) {
      return NextResponse.json({ 
        error: 'No Spotify connection',
        musicPortrait: null
      }, { status: 200 });
    }
    // Проверяем не истёк ли токен
    let accessToken = user.spotifyProfile.accessToken;
    const now = new Date();
    const expiresAt = new Date(user.spotifyProfile.expiresAt);
    if (now >= expiresAt && user.spotifyProfile.refreshToken) {
      const newToken = await refreshSpotifyToken(user.spotifyProfile.refreshToken);
      if (newToken) {
        accessToken = newToken;
        // Обновляем токен в storage
        await storage.updateUser(user.id, {
          spotifyProfile: {
            ...user.spotifyProfile,
            accessToken: newToken,
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
          }
        });
      } else {
        return NextResponse.json({ 
          error: 'Failed to refresh Spotify token',
          musicPortrait: null
        }, { status: 401 });
      }
    }
    // Получаем top tracks
    const topTracksResponse = await fetch(
      'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    if (!topTracksResponse.ok) {
      console.error('[ERROR]' + ' ' + '[ERROR] Failed to fetch top tracks:', await topTracksResponse.text());
      return NextResponse.json({ 
        error: 'Failed to fetch Spotify data',
        musicPortrait: null
      }, { status: 500 });
    }
    const topTracksData = await topTracksResponse.json();
    // Получаем top artists
    const topArtistsResponse = await fetch(
      'https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const topArtistsData = await topArtistsResponse.json();
    // Получаем audio features для треков
    const trackIds = topTracksData.items.map((track: SpotifyTrack) => track.id).join(',');
    const audioFeaturesResponse = await fetch(
      `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    const audioFeaturesData = await audioFeaturesResponse.json();
    // Вычисляем средние значения audio features
    const avgFeatures: AudioFeatures = {
      danceability: 0,
      energy: 0,
      valence: 0,
      acousticness: 0,
      instrumentalness: 0,
      liveness: 0,
      speechiness: 0,
      tempo: 0
    };
    if (audioFeaturesData.audio_features) {
      audioFeaturesData.audio_features.forEach((features: any) => {
        if (features) {
          avgFeatures.danceability += features.danceability;
          avgFeatures.energy += features.energy;
          avgFeatures.valence += features.valence;
          avgFeatures.acousticness += features.acousticness;
          avgFeatures.instrumentalness += features.instrumentalness;
          avgFeatures.liveness += features.liveness;
          avgFeatures.speechiness += features.speechiness;
          avgFeatures.tempo += features.tempo;
        }
      });
      const count = audioFeaturesData.audio_features.filter((f: any) => f).length;
      if (count > 0) {
        Object.keys(avgFeatures).forEach(key => {
          avgFeatures[key as keyof AudioFeatures] = 
            Math.round((avgFeatures[key as keyof AudioFeatures] / count) * 
            (key === 'tempo' ? 1 : 100));
        });
      }
    }
    // ИСПРАВЛЕНИЕ БАГА 3: Добавляем отладку для жанров
    console.log('Top artists genres:', topArtistsData.items.map((a: SpotifyArtist) => ({ name: a.name, genres: a.genres })));
    
    // Собираем жанры
    const genres = new Set<string>();
    topArtistsData.items.forEach((artist: SpotifyArtist) => {
      artist.genres.forEach(genre => genres.add(genre));
    });
    
    console.log('Collected genres count:', genres.size);
    console.log('Collected genres:', Array.from(genres));
    // Формируем портрет
    const musicPortrait = {
      id: `portrait_${Date.now()}`,
      userId: user.id,
      source: 'spotify' as const,
      topTracks: topTracksData.items.slice(0, 10).map((track: SpotifyTrack) => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name,
        imageUrl: track.album.images[0]?.url || null
      })),
      topArtists: topArtistsData.items.slice(0, 10).map((artist: SpotifyArtist) => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url || null,
        genres: artist.genres.slice(0, 3)
      })),
      topGenres: Array.from(genres).slice(0, 10),
      audioFeatures: avgFeatures,
      partyReadiness: Math.round((avgFeatures.energy + avgFeatures.danceability) / 2),
      generatedAt: new Date().toISOString()
    };
    
    // ИСПРАВЛЕНИЕ БАГА 3: Дополнительная отладка для genreDistribution
    console.log('Music portrait topGenres:', musicPortrait.topGenres);
    console.log('Music portrait partyReadiness:', musicPortrait.partyReadiness);
    console.log('Audio features:', musicPortrait.audioFeatures);
    // Portrait generated successfully
    // Сохраняем портрет в storage
    await storage.updateUser(user.id, { musicPortrait });
    return NextResponse.json({ 
      success: true,
      musicPortrait 
    });
  } catch (error) {
    console.error('[ERROR]' + ' ' + '[ERROR] Error generating music portrait:', error);
    return NextResponse.json({ 
      error: 'Failed to generate music portrait',
      musicPortrait: null
    }, { status: 500 });
  }
}