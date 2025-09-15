export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage-factory';
const SPOTIFY_API = 'https://api.spotify.com/v1';
async function searchTracks(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Get search query from request
    let query = '';
    // For GET request - from URL params
    if (request.method === 'GET') {
      const searchParams = request.nextUrl.searchParams;
      query = searchParams.get('q') || searchParams.get('query') || '';
    }
    // For POST request - from body
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        query = body.query || body.q || '';
      } catch (e) {
        // If body parsing fails, try URL params
        const searchParams = request.nextUrl.searchParams;
        query = searchParams.get('q') || searchParams.get('query') || '';
      }
    }
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }
    // Get Spotify profile
    const spotifyProfile = await storage.getSpotifyProfile(session.user.id);
    if (!spotifyProfile) {
      return NextResponse.json(
        { error: 'Spotify not connected' },
        { status: 400 }
      );
    }
    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(spotifyProfile.expiresAt);
    if (now >= expiresAt) {
      return NextResponse.json(
        { error: 'Spotify token expired. Please reconnect.' },
        { status: 401 }
      );
    }
    // Search Spotify
    const response = await fetch(
      `${SPOTIFY_API}/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${spotifyProfile.accessToken}`,
        },
      }
    );
    if (!response.ok) {
      console.error('[ERROR]' + ' ' + 'Spotify search error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to search tracks' },
        { status: response.status }
      );
    }
    const data = await response.json();
    // Format tracks for frontend
    const tracks = data.tracks?.items?.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => ({ name: artist.name })),
      album: {
        name: track.album.name,
        images: track.album.images
      },
      duration_ms: track.duration_ms,
      uri: track.uri,
      external_ids: track.external_ids
    })) || [];
    return NextResponse.json({ 
      tracks,
      query,
      total: data.tracks?.total || 0
    });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
// GET method
export async function GET(request: NextRequest) {
  return searchTracks(request);
}
// POST method
export async function POST(request: NextRequest) {
  return searchTracks(request);
}
export const revalidate = 3600; // Cache for 1 hour