// app/api/auth/spotify/callback/route.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { storage } from '@/lib/storage';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors from Spotify
    if (error) {
      console.error('Spotify auth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=spotify_${error}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=no_code`
      );
    }

    // Get current session - БЕЗ authOptions
    const session = await getServerSession();
    console.log('Session in callback:', session); // DEBUG
    
    if (!session?.user?.email) {
      console.error('No session or email found');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=no_session`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/spotify/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    console.log('Got tokens, expires_in:', tokens.expires_in); // DEBUG
    console.log('Access token length:', tokens.access_token?.length); // DEBUG токена
    
    // Get user profile from Spotify
    const profileResponse = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('Failed to fetch Spotify profile');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=profile_fetch_failed`
      );
    }

    const profile = await profileResponse.json();
    console.log('Got Spotify profile:', profile.display_name); // DEBUG

    // ИСПРАВЛЕНО: getUserByEmail это ASYNC функция!
    const userEmail = session.user.email;
    const user = await storage.getUserByEmail(userEmail); // ДОБАВИЛИ await
    
    if (user) {
      // Обновляем пользователя с Spotify профилем
      const updateData = {
        spotifyProfile: {
          id: profile.id,
          email: profile.email || userEmail,
          displayName: profile.display_name,
          accessToken: tokens.access_token, // Реальный токен
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
          product: profile.product,
          country: profile.country,
          images: profile.images,
          spotifyId: profile.id,
        }
      };
      
      // updateUser тоже async!
      const updated = await storage.updateUser(user.id, updateData);
      
      if (updated) {
        console.log(`✅ Spotify profile saved for user: ${userEmail}`);
        console.log(`   Display name: ${profile.display_name}`);
        console.log(`   Product: ${profile.product}`);
        console.log(`   Token saved: ${tokens.access_token.substring(0, 20)}...`);
        
        // Проверяем что токен действительно сохранился
        const checkUser = await storage.getUserByEmail(userEmail);
        console.log(`   Verification - token in storage: ${checkUser?.spotifyProfile?.accessToken?.substring(0, 20)}...`);
      } else {
        console.error('Failed to update user in storage');
      }
      
      // Успешное подключение - редирект на главную
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?spotify=connected`
      );
    } else {
      console.error(`User not found in storage: ${userEmail}`);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=user_not_found`
      );
    }

  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=callback_error`
    );
  }
}