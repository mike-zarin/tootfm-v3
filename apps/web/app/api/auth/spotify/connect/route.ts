export const dynamic = 'force-dynamic';
export const revalidate = 0;

// apps/web/app/api/auth/spotify/connect/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private', 
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/signin`);
  }
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state') || 'default';
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    scope: SPOTIFY_SCOPES,
    state: state,
  });
  const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  // ВАЖНОЕ ИЗМЕНЕНИЕ: редирект вместо JSON
  return NextResponse.redirect(authUrl);
}