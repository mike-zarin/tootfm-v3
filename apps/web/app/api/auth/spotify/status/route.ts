// apps/web/app/api/auth/spotify/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    // Получаем сессию пользователя
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { connected: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Получаем данные пользователя из storage
    const user = storage.getUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { connected: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Проверяем наличие Spotify профиля
    if (!user.spotifyProfile) {
      return NextResponse.json({
        connected: false,
        message: 'Spotify not connected'
      });
    }

    // Проверяем валидность токена
    const now = new Date();
    const expiresAt = new Date(user.spotifyProfile.expiresAt);
    const isExpired = now >= expiresAt;

    // Если токен истёк, пробуем обновить
    if (isExpired && user.spotifyProfile.refreshToken) {
      try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
            ).toString('base64')
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: user.spotifyProfile.refreshToken
          })
        });

        if (response.ok) {
          const tokens = await response.json();
          
          // Обновляем токены в storage
          const updatedProfile = {
            ...user.spotifyProfile,
            accessToken: tokens.access_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          };
          
          storage.updateUser(user.id, { spotifyProfile: updatedProfile });
          
          return NextResponse.json({
            connected: true,
            profile: {
              id: updatedProfile.id,
              displayName: updatedProfile.displayName,
              email: updatedProfile.email,
              product: updatedProfile.product
            },
            tokenValid: true,
            expiresAt: updatedProfile.expiresAt
          });
        }
      } catch (error) {
        console.error('Error refreshing Spotify token:', error);
      }
    }

    // Возвращаем статус
    return NextResponse.json({
      connected: true,
      profile: {
        id: user.spotifyProfile.id,
        displayName: user.spotifyProfile.displayName,
        email: user.spotifyProfile.email,
        product: user.spotifyProfile.product
      },
      tokenValid: !isExpired,
      expiresAt: user.spotifyProfile.expiresAt
    });

  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return NextResponse.json(
      { connected: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}