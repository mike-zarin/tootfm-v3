import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSpotifyAuthUrl } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get('state') || 'default';
  
  const authUrl = getSpotifyAuthUrl(state);
  return NextResponse.json({ url: authUrl });
}