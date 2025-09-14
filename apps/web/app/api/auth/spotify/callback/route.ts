// apps/web/app/api/auth/spotify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    // Handle errors from Spotify
    if (error) {
      console.error('[ERROR]' + ' ' + 'Spotify auth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=spotify_auth_failed`
      );
    }
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=no_code`
      );
    }
    // Get session to find current user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[ERROR]' + ' ' + 'No session or email found');
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
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      }),
    });
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('[ERROR]' + ' ' + 'Token exchange failed:', error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=token_exchange_failed`
      );
    }
    const tokens: SpotifyTokenResponse = await tokenResponse.json();
    // Get user profile from Spotify
    const profileResponse = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    if (!profileResponse.ok) {
      console.error('[ERROR]' + ' ' + 'Failed to fetch Spotify profile');
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=profile_fetch_failed`
      );
    }
    const profile = await profileResponse.json();
    // Get user from storage
    const userEmail = session.user.email;
    const user = await storage.getUserByEmail(userEmail);
    if (user) {
      // Сохраняем в user.spotifyProfile (для обратной совместимости)
      const updateData = {
        spotifyProfile: {
          id: profile.id,
          email: profile.email || userEmail,
          displayName: profile.display_name,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
          product: profile.product,
          country: profile.country,
          images: profile.images,
          spotifyId: profile.id,
        }
      };
      const updated = await storage.updateUser(user.id, updateData);
      // ВАЖНО: Также сохраняем в отдельный массив spotifyProfiles
      await storage.saveSpotifyProfile({
        userId: user.id,
        id: profile.id,
        email: profile.email || userEmail,
        displayName: profile.display_name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
        product: profile.product,
        country: profile.country,
        images: profile.images,
        spotifyId: profile.id,
      });
      if (updated) {
        // Проверяем что токен действительно сохранился
        const checkUser = await storage.getUserByEmail(userEmail);
        // Проверяем также в spotifyProfiles
        const spotifyProfile = await storage.getSpotifyProfile(user.id);
      } else {
        console.error('[ERROR]' + ' ' + 'Failed to update user in storage');
      }
      // Успешное подключение - редирект на главную
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?spotify=connected`
      );
    } else {
      console.error('[ERROR]' + ' ' + `User not found in storage: ${userEmail}`);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=user_not_found`
      );
    }
  } catch (error) {
    console.error('[ERROR]' + ' ' + 'Spotify callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=callback_error`
    );
  }
}