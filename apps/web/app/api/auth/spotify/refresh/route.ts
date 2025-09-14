import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage';
import { refreshSpotifyToken } from '@/lib/spotify';
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const spotifyProfile = await storage.getSpotifyProfile(user.id);
    if (!spotifyProfile) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 404 });
    }
    const tokens = await refreshSpotifyToken(spotifyProfile.refreshToken);
    await storage.updateSpotifyTokens(
      user.id,
      tokens.access_token,
      spotifyProfile.refreshToken,
      tokens.expires_in
    );
    return NextResponse.json({
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in
    });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Token refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
}