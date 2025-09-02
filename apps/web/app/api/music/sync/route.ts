// app/api/music/sync/route.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
// Этот файл нужно обновить, чтобы использовать spotifyProfile из storage, а не из session

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { storage } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Получаем пользователя из storage
    const user = await storage.getUserByEmail(session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // ИСПРАВЛЕНО: Используем spotifyProfile из storage, а не из session
    const spotifyProfile = user.spotifyProfile;
    
    if (!spotifyProfile?.accessToken || !spotifyProfile?.refreshToken) {
      return NextResponse.json(
        { error: 'Spotify not connected. Please connect your Spotify account first.' },
        { status: 400 }
      );
    }
    
    // Проверяем, не истек ли токен
    const expiresAt = new Date(spotifyProfile.expiresAt);
    const now = new Date();
    
    if (expiresAt <= now) {
      // Токен истек, нужно обновить
      // TODO: Implement token refresh logic
      return NextResponse.json(
        { error: 'Spotify token expired. Please reconnect your account.' },
        { status: 401 }
      );
    }
    
    // Здесь должна быть логика синхронизации с Spotify API
    // Используйте spotifyProfile.accessToken для запросов к Spotify
    
    return NextResponse.json({
      success: true,
      message: 'Music sync started',
      // Добавьте результаты синхронизации
    });
    
  } catch (error) {
    console.error('Music sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync music' },
      { status: 500 }
    );
  }
}