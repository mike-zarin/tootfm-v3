export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    console.error('[Apple Music] Token generation failed:', error);
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}