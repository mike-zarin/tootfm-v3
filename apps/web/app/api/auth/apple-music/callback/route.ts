export const dynamic = 'force-dynamic';
export const revalidate = 0;

// app/api/auth/apple-music/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage-factory';
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in first.' },
        { status: 401 }
      );
    }
    // Get user from database using email
    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    // Parse request body
    const body = await request.json();
    const { userToken, developerToken } = body;
    // Validate token
    if (!userToken || typeof userToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing music user token' },
        { status: 400 }
      );
    }
    // Check if user already has Apple Music connected
    const existingProfile = await storage.getAppleMusicProfile(user.id);
    
    // ИСПРАВЛЕНИЕ БАГА 2: Определение региона по IP или из профиля
    const storefront = request.headers.get('cf-ipcountry') || 'cy'; // Cyprus default
    
    // Save or update Apple Music profile
    const profile = {
      userId: user.id,
      musicUserToken: userToken,
      storefront: storefront, // Dynamic storefront based on IP
      connectedAt: existingProfile?.connectedAt || new Date().toISOString(),
      // Apple Music tokens are valid for 6 months
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    };
    await storage.saveAppleMusicProfile(profile);
    // Log successful connection
    console.log(`Apple Music connected for user: ${user.email} (${user.id})`);
    return NextResponse.json({ 
      success: true,
      message: 'Apple Music connected successfully',
      profile: {
        userId: user.id,
        connectedAt: profile.connectedAt,
        expiresAt: profile.expiresAt
      }
    });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Apple Music callback error:', error);
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
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Get user from database using email
    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    const profile = await storage.getAppleMusicProfile(user.id);
    if (!profile) {
      return NextResponse.json({
        connected: false,
        message: 'Apple Music not connected'
      });
    }
    // Check if token is expired
    const now = new Date();
    const expiresAt = profile.expiresAt ? new Date(profile.expiresAt) : null;
    const isExpired = expiresAt ? now >= expiresAt : false;
    return NextResponse.json({
      connected: !isExpired,
      profile: {
        storefront: profile.storefront,
        connectedAt: profile.connectedAt,
        expiresAt: profile.expiresAt,
        isExpired
      }
    });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Apple Music status check error:', error);
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
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // Get user from database using email
    const user = await storage.getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    await storage.removeAppleMusicProfile(user.id);
    console.log(`Apple Music disconnected for user: ${user.email} (${user.id})`);
    return NextResponse.json({
      success: true,
      message: 'Apple Music disconnected successfully'
    });
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Apple Music disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Apple Music' },
      { status: 500 }
    );
  }
}