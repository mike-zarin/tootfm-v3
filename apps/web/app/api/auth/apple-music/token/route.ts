// apps/web/app/api/auth/apple-music/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateAppleMusicToken } from '@/lib/apple-music-jwt';

export async function GET(request: NextRequest) {
  try {
    // Генерируем developer token для Apple Music
    const developerToken = generateAppleMusicToken();
    
    return NextResponse.json({
      developerToken,
      success: true
    });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Error generating Apple Music token:', error);
    return NextResponse.json(
      { error: 'Failed to generate Apple Music token' },
      { status: 500 }
    );
  }
}