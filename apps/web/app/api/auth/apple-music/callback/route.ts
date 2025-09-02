// app/api/auth/apple-music/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { saveAppleMusicProfile, getAppleMusicProfile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { musicUserToken } = body;

    // Validate token
    if (!musicUserToken || typeof musicUserToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing music user token' },
        { status: 400 }
      );
    }

    // Check if user already has Apple Music connected
    const existingProfile = await getAppleMusicProfile(session.user.id);
    
    // Save or update Apple Music profile
    const profile = {
      userId: session.user.id,
      musicUserToken,
      connectedAt: existingProfile?.connectedAt || new Date().toISOString(),
      // Apple Music tokens are valid for 6 months
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    };

    await saveAppleMusicProfile(profile);

    // Log successful connection
    console.log(`Apple Music connected for user: ${session.user.id}`);

    return NextResponse.json({ 
      success: true,
      message: 'Apple Music connected successfully',
      profile: {
        userId: session.user.id,
        connectedAt: profile.connectedAt,
        expiresAt: profile.expiresAt
      }
    });

  } catch (error) {
    console.error('Apple Music callback error:', error);
    
    // Detailed error response for debugging
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to save Apple Music profile',
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save Apple Music profile' },
      { status: 500 }
    );
  }
}

// GET endpoint to check connection status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await getAppleMusicProfile(session.user.id);
    
    if (!profile) {
      return NextResponse.json({
        connected: false,
        message: 'Apple Music not connected'
      });
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(profile.expiresAt);
    const isExpired = now >= expiresAt;

    return NextResponse.json({
      connected: !isExpired,
      profile: {
        connectedAt: profile.connectedAt,
        expiresAt: profile.expiresAt,
        isExpired
      }
    });

  } catch (error) {
    console.error('Apple Music status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Apple Music status' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to disconnect Apple Music
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { removeAppleMusicProfile } = await import('@/lib/storage');
    await removeAppleMusicProfile(session.user.id);

    console.log(`Apple Music disconnected for user: ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Apple Music disconnected successfully'
    });

  } catch (error) {
    console.error('Apple Music disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Apple Music' },
      { status: 500 }
    );
  }
}