// app/api/auth/apple-music/token/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateAppleMusicToken } from '@/lib/apple-music-jwt';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Генерируем developer token для Apple Music
    const developerToken = await generateAppleMusicToken();
    
    return NextResponse.json({
      developerToken,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    console.error('Error generating Apple Music token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}