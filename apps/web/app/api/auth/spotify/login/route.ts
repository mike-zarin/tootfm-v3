// apps/web/app/api/auth/spotify/login/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/spotify/callback';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');
export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // Redirect to sign in first
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/api/auth/spotify/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }
    // Create state for security (CSRF protection)
    const state = Buffer.from(JSON.stringify({
      userId: session.user.email,
      timestamp: Date.now()
    })).toString('base64');
    // Build Spotify auth URL
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      state: state,
      show_dialog: 'false' // Set to 'true' to force re-approval
    });
    const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Spotify login error:', error);
    return NextResponse.redirect(new URL('/party?spotify=error', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  }
}