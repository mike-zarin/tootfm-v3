// app/api/auth/apple-music/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { generateAppleMusicToken } from '@/lib/apple-music-jwt';

export async function GET(request: NextRequest) {
  try {
    const developerToken = generateAppleMusicToken();
    
    return NextResponse.json({
      developerToken,
      success: true
    });
  } catch (error) {
    console.error('Apple Music token generation failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}