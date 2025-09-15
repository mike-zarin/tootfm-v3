export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage-factory';
import { getSpotifyClient } from '@/lib/spotify';
// Play/Resume
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { deviceId, uris, position_ms = 0 } = body;
    const user = await storage.getUserByEmail(session.user.email);
    const spotifyProfile = await storage.getSpotifyProfile(user!.id);
    if (!spotifyProfile) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 404 });
    }
    const spotify = await getSpotifyClient(user!.id);
    if (uris && uris.length > 0) {
      // Play specific tracks
      await spotify.play({
        device_id: deviceId,
        uris: uris,
        position_ms: position_ms
      });
    } else {
      // Resume playback
      await spotify.play({ device_id: deviceId });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Player error:', error);
    return NextResponse.json({ error: 'Playback failed' }, { status: 500 });
  }
}
// Pause
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await storage.getUserByEmail(session.user.email);
    const spotify = await getSpotifyClient(user!.id);
    await spotify.pause();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Pause error:', error);
    return NextResponse.json({ error: 'Pause failed' }, { status: 500 });
  }
}
// Get player state
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await storage.getUserByEmail(session.user.email);
    const spotify = await getSpotifyClient(user!.id);
    const state = await spotify.getMyCurrentPlaybackState();
    return NextResponse.json(state.body);
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Get state error:', error);
    return NextResponse.json({ error: 'Failed to get player state' }, { status: 500 });
  }
}