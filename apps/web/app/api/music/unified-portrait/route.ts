// app/api/music/unified-portrait/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { storage } from '@/lib/storage';
import { getSpotifyToken } from '@/lib/spotify';
import { getAppleMusicPortrait } from '@/lib/apple-music-api';
import { generateAppleToken } from '@/lib/apple-music-jwt';

interface UnifiedTrack {
  id: string;
  name: string;
  artist: string;
  imageUrl: string | null;
  isrc?: string;
  sources: {
    spotify?: string;
    appleMusic?: string;
  };
  popularity: number;
}

interface UnifiedArtist {
  name: string;
  imageUrl: string | null;
  genres: string[];
  sources: {
    spotify?: boolean;
    appleMusic?: boolean;
  };
  popularity: number;
}

interface UnifiedMusicPortrait {
  userId: string;
  sources: string[];
  topTracks: UnifiedTrack[];
  topArtists: UnifiedArtist[];
  topGenres: string[];
  audioFeatures: {
    danceability: number;
    energy: number;
    valence: number;
    acousticness: number;
    instrumentalness: number;
    tempo: number;
  };
  partyReadiness: number;
  generatedAt: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sources: string[] = [];
    let spotifyData: any = null;
    let appleMusicData: any = null;
    let audioFeatures: any = {
      danceability: 0,
      energy: 0,
      valence: 0,
      acousticness: 0,
      instrumentalness: 0,
      tempo: 120
    };

    // Получаем данные из Spotify
    if (user.spotifyProfile?.accessToken) {
      try {
        const spotifyToken = await getSpotifyToken(user.id);
        if (spotifyToken) {
          // Получаем топ треки
          const [tracksRes, artistsRes] = await Promise.all([
            fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
              headers: { 'Authorization': `Bearer ${spotifyToken}` }
            }),
            fetch('https://api.spotify.com/v1/me/top/artists?limit=30&time_range=medium_term', {
              headers: { 'Authorization': `Bearer ${spotifyToken}` }
            })
          ]);

          if (tracksRes.ok && artistsRes.ok) {
            const tracksData = await tracksRes.json();
            const artistsData = await artistsRes.json();
            
            // Получаем audio features
            const trackIds = tracksData.items.map((t: any) => t.id).join(',');
            const featuresRes = await fetch(
              `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
              { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
            );

            if (featuresRes.ok) {
              const featuresData = await featuresRes.json();
              const features = featuresData.audio_features?.filter((f: any) => f !== null) || [];
              
              if (features.length > 0) {
                const totals = features.reduce((acc: any, feat: any) => ({
                  danceability: acc.danceability + (feat.danceability || 0),
                  energy: acc.energy + (feat.energy || 0),
                  valence: acc.valence + (feat.valence || 0),
                  acousticness: acc.acousticness + (feat.acousticness || 0),
                  instrumentalness: acc.instrumentalness + (feat.instrumentalness || 0),
                  tempo: acc.tempo + (feat.tempo || 0)
                }), audioFeatures);

                audioFeatures = {
                  danceability: Math.round((totals.danceability / features.length) * 100),
                  energy: Math.round((totals.energy / features.length) * 100),
                  valence: Math.round((totals.valence / features.length) * 100),
                  acousticness: Math.round((totals.acousticness / features.length) * 100),
                  instrumentalness: Math.round((totals.instrumentalness / features.length) * 100),
                  tempo: Math.round(totals.tempo / features.length)
                };
              }
            }

            spotifyData = {
              tracks: tracksData.items,
              artists: artistsData.items
            };
            sources.push('spotify');
          }
        }
      } catch (error) {
        console.error('Spotify fetch error:', error);
      }
    }

    // Получаем данные из Apple Music
    if (user.appleMusicProfile?.musicUserToken) {
      try {
        const developerToken = await generateAppleToken();
        appleMusicData = await getAppleMusicPortrait(user.id, developerToken);
        sources.push('apple-music');
      } catch (error) {
        console.error('Apple Music fetch error:', error);
      }
    }

    // Объединяем треки по ISRC (если есть)
    const trackMap = new Map<string, UnifiedTrack>();
    const isrcMap = new Map<string, string>(); // ISRC -> unified track ID

    // Добавляем Spotify треки
    if (spotifyData?.tracks) {
      spotifyData.tracks.forEach((track: any, index: number) => {
        const unifiedId = `unified_${track.id}`;
        const unifiedTrack: UnifiedTrack = {
          id: unifiedId,
          name: track.name,
          artist: track.artists.map((a: any) => a.name).join(', '),
          imageUrl: track.album.images[0]?.url || null,
          isrc: track.external_ids?.isrc,
          sources: { spotify: track.id },
          popularity: 50 - index // Чем выше в топе, тем популярнее
        };
        
        trackMap.set(unifiedId, unifiedTrack);
        if (track.external_ids?.isrc) {
          isrcMap.set(track.external_ids.isrc, unifiedId);
        }
      });
    }

    // Добавляем или объединяем Apple Music треки
    if (appleMusicData?.topTracks) {
      appleMusicData.topTracks.forEach((track: any, index: number) => {
        // Проверяем, есть ли трек с таким же ISRC
        const existingId = track.isrc ? isrcMap.get(track.isrc) : null;
        
        if (existingId) {
          // Объединяем с существующим треком
          const existing = trackMap.get(existingId)!;
          existing.sources.appleMusic = track.id;
          existing.popularity += (30 - index); // Добавляем популярность
        } else {
          // Создаем новый unified трек
          const unifiedId = `unified_apple_${track.id}`;
          const unifiedTrack: UnifiedTrack = {
            id: unifiedId,
            name: track.name,
            artist: track.artist,
            imageUrl: track.imageUrl,
            isrc: track.isrc,
            sources: { appleMusic: track.id },
            popularity: 30 - index
          };
          
          trackMap.set(unifiedId, unifiedTrack);
          if (track.isrc) {
            isrcMap.set(track.isrc, unifiedId);
          }
        }
      });
    }

    // Объединяем артистов
    const artistMap = new Map<string, UnifiedArtist>();
    
    // Добавляем Spotify артистов
    if (spotifyData?.artists) {
      spotifyData.artists.forEach((artist: any, index: number) => {
        const key = artist.name.toLowerCase();
        artistMap.set(key, {
          name: artist.name,
          imageUrl: artist.images[0]?.url || null,
          genres: artist.genres,
          sources: { spotify: true },
          popularity: 30 - index
        });
      });
    }

    // Добавляем или объединяем Apple Music артистов
    if (appleMusicData?.topArtists) {
      appleMusicData.topArtists.forEach((artist: any, index: number) => {
        const key = artist.name.toLowerCase();
        const existing = artistMap.get(key);
        
        if (existing) {
          existing.sources.appleMusic = true;
          existing.popularity += (20 - index);
          // Объединяем жанры
          existing.genres = [...new Set([...existing.genres, ...artist.genres])];
        } else {
          artistMap.set(key, {
            name: artist.name,
            imageUrl: artist.imageUrl,
            genres: artist.genres,
            sources: { appleMusic: true },
            popularity: 20 - index
          });
        }
      });
    }

    // Объединяем жанры
    const genreMap = new Map<string, number>();
    
    // Из Spotify
    if (spotifyData?.artists) {
      spotifyData.artists.forEach((artist: any) => {
        artist.genres.forEach((genre: string) => {
          genreMap.set(genre, (genreMap.get(genre) || 0) + 2); // Вес 2 для Spotify
        });
      });
    }
    
    // Из Apple Music
    if (appleMusicData?.topGenres) {
      appleMusicData.topGenres.forEach((genre: string) => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + 1); // Вес 1 для Apple
      });
    }

    // Сортируем и берем топ
    const topTracks = Array.from(trackMap.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 30);

    const topArtists = Array.from(artistMap.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20);

    const topGenres = Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([genre]) => genre);

    // Рассчитываем Party Readiness Score
    const partyReadiness = Math.round(
      (audioFeatures.danceability * 0.35) +
      (audioFeatures.energy * 0.35) +
      (audioFeatures.valence * 0.20) +
      ((100 - audioFeatures.acousticness) * 0.10)
    );

    const unifiedPortrait: UnifiedMusicPortrait = {
      userId: user.id,
      sources,
      topTracks,
      topArtists,
      topGenres,
      audioFeatures,
      partyReadiness,
      generatedAt: new Date().toISOString()
    };

    // Сохраняем unified портрет
    storage.updateUser(user.id, {
      unifiedMusicPortrait: unifiedPortrait
    });

    return NextResponse.json({
      portrait: unifiedPortrait,
      stats: {
        totalTracks: topTracks.length,
        totalArtists: topArtists.length,
        totalGenres: topGenres.length,
        connectedServices: sources,
        mergedByISRC: topTracks.filter(t => 
          t.sources.spotify && t.sources.appleMusic
        ).length
      }
    });

  } catch (error) {
    console.error('Error generating unified portrait:', error);
    return NextResponse.json(
      { error: 'Failed to generate unified music portrait' },
      { status: 500 }
    );
  }
}