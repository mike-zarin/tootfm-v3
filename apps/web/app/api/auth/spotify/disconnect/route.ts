export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage-factory';


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

    // Clear Spotify profile
    await storage.updateUser(user.id, {
      spotifyProfile: undefined
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Spotify Disconnect]:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
