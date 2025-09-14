// apps/web/scripts/fix-spotify-user.ts
// Быстрое решение: копируем Spotify профиль на правильного пользователя

import fs from 'fs/promises';
import path from 'path';

async function fixSpotifyUser() {
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    
    console.log('🔍 Анализируем текущие данные...');
    
    // Находим пользователей
    const mihail = data.users.find((u: any) => u.email === 'mihail.zarin@gmail.com');
    const mike = data.users.find((u: any) => u.email === 'mike.zarin@cyndicate.club');
    
    console.log(`📧 mihail.zarin@gmail.com: ID = ${mihail?.id}`);
    console.log(`📧 mike.zarin@cyndicate.club: ID = ${mike?.id}`);
    
    // Находим Spotify профили
    const mikeSpotify = data.spotifyProfiles.find((p: any) => 
      p.userId === '115440351466817056421'
    );
    
    const mihailSpotify = data.spotifyProfiles.find((p: any) => 
      p.userId === '107793802893242446523'
    );
    
    console.log(`🎵 Spotify профиль mike: ${mikeSpotify ? 'найден' : 'не найден'}`);
    console.log(`🎵 Spotify профиль mihail: ${mihailSpotify ? 'найден' : 'не найден'}`);
    
    if (mikeSpotify && mihail) {
      // Копируем Spotify профиль для mihail
      const newMihailSpotify = {
        ...mikeSpotify,
        userId: mihail.id,
        email: mihail.email
      };
      
      // Удаляем старый профиль mihail если есть
      data.spotifyProfiles = data.spotifyProfiles.filter((p: any) => 
        p.userId !== mihail.id
      );
      
      // Добавляем новый
      data.spotifyProfiles.push(newMihailSpotify);
      
      // Удаляем spotifyProfile из user объекта если есть
      if (mihail.spotifyProfile) {
        delete mihail.spotifyProfile;
        console.log('🗑️ Удален spotifyProfile из user объекта');
      }
      
      await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
      
      console.log('✅ Исправление завершено:');
      console.log(`   - Spotify профиль скопирован для ${mihail.email}`);
      console.log(`   - User ID: ${mihail.id}`);
      console.log(`   - Spotify ID: ${newMihailSpotify.id}`);
      
    } else {
      console.log('❌ Не удалось найти нужные данные для копирования');
    }
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении:', error);
  }
}

fixSpotifyUser();
