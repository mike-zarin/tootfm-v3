export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage-factory';

// Get current playback state
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await storage.getUserByEmail(session.user.email);
    if (!user?.spotifyProfile?.accessToken) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 404 });
    }

    // Get current playback state from Spotify
    const response = await fetch('https://api.spotify.com/v1/me/player', {
      headers: {
        'Authorization': `Bearer ${user.spotifyProfile.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshResponse = await fetch('/api/auth/spotify/refresh', {
          method: 'POST',
        });
        
        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          // Retry with new token
          const retryResponse = await fetch('https://api.spotify.com/v1/me/player', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (retryResponse.ok) {
            const playerState = await retryResponse.json();
            return NextResponse.json(playerState);
          }
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to get playback state',
        message: await response.text()
      }, { status: response.status });
    }

    const playerState = await response.json();
    return NextResponse.json(playerState);
  } catch (error) {
    console.error('[Spotify Player] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Control playback (play, pause, skip, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await storage.getUserByEmail(session.user.email);
    if (!user?.spotifyProfile?.accessToken) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 404 });
    }

    const body = await request.json();
    const { action, deviceId, trackUri, positionMs, volume } = body;

    let spotifyUrl = 'https://api.spotify.com/v1/me/player';
    let method = 'PUT';
    let requestBody: any = {};

    switch (action) {
      case 'play':
        spotifyUrl += '/play';
        if (deviceId) {
          spotifyUrl += `?device_id=${deviceId}`;
        }
        if (trackUri) {
          requestBody.uris = [trackUri];
        }
        break;
      
      case 'pause':
        spotifyUrl += '/pause';
        if (deviceId) {
          spotifyUrl += `?device_id=${deviceId}`;
        }
        break;
      
      case 'toggle':
        spotifyUrl += '/play';
        if (deviceId) {
          spotifyUrl += `?device_id=${deviceId}`;
        }
        // First get current state to determine if we should play or pause
        const currentState = await fetch('https://api.spotify.com/v1/me/player', {
          headers: {
            'Authorization': `Bearer ${user.spotifyProfile.accessToken}`,
          },
        });
        
        if (currentState.ok) {
          const state = await currentState.json();
          if (state.is_playing) {
            spotifyUrl = 'https://api.spotify.com/v1/me/player/pause';
          }
        }
        break;
      
      case 'next':
        spotifyUrl += '/next';
        if (deviceId) {
          spotifyUrl += `?device_id=${deviceId}`;
        }
        break;
      
      case 'previous':
        spotifyUrl += '/previous';
        if (deviceId) {
          spotifyUrl += `?device_id=${deviceId}`;
        }
        break;
      
      case 'seek':
        spotifyUrl += `/seek?position_ms=${positionMs}`;
        if (deviceId) {
          spotifyUrl += `&device_id=${deviceId}`;
        }
        break;
      
      case 'volume':
        spotifyUrl += `/volume?volume_percent=${volume}`;
        if (deviceId) {
          spotifyUrl += `&device_id=${deviceId}`;
        }
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const response = await fetch(spotifyUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${user.spotifyProfile.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshResponse = await fetch('/api/auth/spotify/refresh', {
          method: 'POST',
        });
        
        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          // Retry with new token
          const retryResponse = await fetch(spotifyUrl, {
            method,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
          });
          
          if (retryResponse.ok) {
            return NextResponse.json({ success: true });
          }
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to control playback',
        message: await response.text()
      }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Spotify Player] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}