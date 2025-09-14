// apps/web/scripts/migrate-auth-data.ts
// Скрипт для миграции данных авторизации

import fs from 'fs/promises';
import path from 'path';

interface OldUser {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  spotifyProfile?: any;
  appleMusicProfile?: any;
  musicPortrait?: any;
  unifiedMusicPortrait?: any;
}

interface OldData {
  users: OldUser[];
  spotifyProfiles: any[];
  appleMusicProfiles: any[];
  [key: string]: any;
}

async function migrateAuthData() {
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const backupPath = path.join(process.cwd(), `data.backup.${Date.now()}.json`);
    
    // Читаем текущие данные
    const content = await fs.readFile(dataPath, 'utf-8');
    const data: OldData = JSON.parse(content);
    
    // Создаем бэкап
    await fs.writeFile(backupPath, content);
    console.log(`✅ Backup created: ${backupPath}`);
    
    // Мигрируем пользователей
    const migratedUsers = data.users.map(user => {
      const { spotifyProfile, appleMusicProfile, ...cleanUser } = user;
      return cleanUser;
    });
    
    // Обновляем данные
    const migratedData = {
      ...data,
      users: migratedUsers
    };
    
    // Сохраняем мигрированные данные
    await fs.writeFile(dataPath, JSON.stringify(migratedData, null, 2));
    
    console.log('✅ Migration completed:');
    console.log(`   - Removed spotifyProfile from ${data.users.length} users`);
    console.log(`   - Kept spotifyProfiles array with ${data.spotifyProfiles.length} profiles`);
    console.log(`   - Kept appleMusicProfiles array with ${data.appleMusicProfiles.length} profiles`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Запускаем миграцию
migrateAuthData();
