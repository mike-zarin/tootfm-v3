// lib/converters/lastfm-converter.ts

import { UnifiedTrack, UnifiedArtist } from '@/types/music';

export function convertLastfmTrack(track: any): UnifiedTrack {
  return {
    id: `lastfm_${track.mbid || track.name + '_' + track.artist?.name}`,
    lastfmMbid: track.mbid,
    title: track.name || '',
    artist: track.artist?.name || track.artist?.['#text'] || '',
    album: track.album?.['#text'],
    duration: track.duration ? parseInt(track.duration) * 1000 : 0,
    playCount: track.playcount ? parseInt(track.playcount) : undefined,
    userLoved: track.loved === '1',
    tags: track.toptags?.tag?.map((t: any) => t.name),
    artwork: {
      small: track.image?.find((i: any) => i.size === 'small')?.['#text'],
      medium: track.image?.find((i: any) => i.size === 'medium')?.['#text'],
      large: track.image?.find((i: any) => i.size === 'large')?.['#text'],
    }
  };
}

export function convertLastfmArtist(artist: any): UnifiedArtist {
  return {
    id: `lastfm_${artist.mbid || artist.name}`,
    name: artist.name || '',
    lastfmMbid: artist.mbid,
    playCount: artist.playcount ? parseInt(artist.playcount) : undefined,
    tags: artist.tags?.tag?.map((t: any) => t.name),
    images: {
      small: artist.image?.find((i: any) => i.size === 'small')?.['#text'],
      medium: artist.image?.find((i: any) => i.size === 'medium')?.['#text'],
      large: artist.image?.find((i: any) => i.size === 'large')?.['#text'],
    }
  };
}
