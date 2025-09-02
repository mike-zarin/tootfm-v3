// scripts/check-system.ts
// Запуск: npx tsx scripts/check-system.ts

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJSON(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function checkSystemHealth() {
  const projectRoot = '/Users/mz/tootfm-v3';
  const webRoot = path.join(projectRoot, 'apps/web');
  
  log.header('tootFM System Health Check v1.0');
  
  // 1. Проверка структуры файлов
  log.header('File Structure Check');
  
  const criticalFiles = [
    // Data storage
    { path: 'data.json', type: 'Storage' },
    
    // API Routes - Music
    { path: 'app/api/music/portrait/route.ts', type: 'API' },
    { path: 'app/api/music/unified-portrait/route.ts', type: 'API', optional: true },
    
    // API Routes - Auth
    { path: 'app/api/auth/[...nextauth]/route.ts', type: 'Auth' },
    { path: 'app/api/auth/spotify/callback/route.ts', type: 'Spotify' },
    { path: 'app/api/auth/spotify/connect/route.ts', type: 'Spotify' },
    { path: 'app/api/auth/apple-music/token/route.ts', type: 'Apple Music' },
    { path: 'app/api/auth/apple-music/callback/route.ts', type: 'Apple Music' },
    
    // API Routes - Parties
    { path: 'app/api/parties/route.ts', type: 'Party' },
    { path: 'app/api/parties/[id]/route.ts', type: 'Party' },
    { path: 'app/api/parties/join/route.ts', type: 'Party' },
    
    // Libraries
    { path: 'lib/storage.ts', type: 'Core' },
    { path: 'lib/spotify.ts', type: 'Integration' },
    { path: 'lib/apple-music-jwt.ts', type: 'Integration' },
    { path: 'lib/apple-music-api.ts', type: 'Integration', optional: true },
    { path: 'lib/auth-config.ts', type: 'Auth' },
    
    // Components
    { path: 'components/music/MusicPortraitDisplay.tsx', type: 'UI' },
    { path: 'components/music/EnhancedMusicPortrait.tsx', type: 'UI', optional: true },
    { path: 'components/spotify/SpotifyConnect.tsx', type: 'UI' },
    { path: 'components/apple-music/AppleMusicConnect.tsx', type: 'UI' },
    
    // Pages
    { path: 'app/page.tsx', type: 'Page' },
    { path: 'app/party/[id]/page.tsx', type: 'Page' },
    { path: 'app/party/create/page.tsx', type: 'Page' },
    { path: 'app/party/join/page.tsx', type: 'Page' },
  ];
  
  let fileCheckPassed = true;
  
  for (const file of criticalFiles) {
    const fullPath = path.join(webRoot, file.path);
    const exists = await fileExists(fullPath);
    
    if (exists) {
      log.success(`[${file.type}] ${file.path}`);
    } else if (file.optional) {
      log.warning(`[${file.type}] ${file.path} (optional - not found)`);
    } else {
      log.error(`[${file.type}] ${file.path} - MISSING!`);
      fileCheckPassed = false;
    }
  }
  
  // 2. Проверка данных
  log.header('Data Storage Check');
  
  const dataPath = path.join(webRoot, 'data.json');
  const data = await readJSON(dataPath);
  
  if (data) {
    log.success(`data.json loaded successfully`);
    log.info(`Users: ${data.users?.length || 0}`);
    log.info(`Parties: ${data.parties?.length || 0}`);
    log.info(`Tracks: ${data.tracks?.length || 0}`);
    log.info(`Memberships: ${data.memberships?.length || 0}`);
    
    // Проверка интеграций
    let spotifyUsers = 0;
    let appleUsers = 0;
    let usersWithPortraits = 0;
    
    data.users?.forEach((user: any) => {
      if (user.spotifyProfile?.accessToken) spotifyUsers++;
      if (user.appleMusicProfile?.musicUserToken) appleUsers++;
      if (user.musicPortrait) usersWithPortraits++;
    });
    
    log.info(`Spotify connected: ${spotifyUsers} users`);
    log.info(`Apple Music connected: ${appleUsers} users`);
    log.info(`Music portraits generated: ${usersWithPortraits} users`);
  } else {
    log.error('Failed to load data.json');
  }
  
  // 3. Проверка окружения
  log.header('Environment Check');
  
  const envPath = path.join(webRoot, '.env.local');
  const envExists = await fileExists(envPath);
  
  if (envExists) {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const envVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'SPOTIFY_CLIENT_ID',
      'SPOTIFY_CLIENT_SECRET',
      'APPLE_TEAM_ID',
      'APPLE_KEY_ID',
      'APPLE_PRIVATE_KEY',
    ];
    
    envVars.forEach(varName => {
      if (envContent.includes(`${varName}=`)) {
        log.success(`${varName} is set`);
      } else {
        log.warning(`${varName} is missing`);
      }
    });
  } else {
    log.error('.env.local file not found');
  }
  
  // 4. Проверка дубликатов API
  log.header('API Duplication Check');
  
  const apiPaths = [
    'app/api/music/portrait/route.ts',
    'app/api/music/unified-portrait/route.ts',
  ];
  
  for (const apiPath of apiPaths) {
    const fullPath = path.join(webRoot, apiPath);
    if (await fileExists(fullPath)) {
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Проверяем, что делает endpoint
      if (content.includes('getSpotifyToken') && content.includes('audio-features')) {
        log.info(`${apiPath} - Handles Spotify audio features`);
      }
      if (content.includes('AppleMusicAPI') || content.includes('apple-music-api')) {
        log.info(`${apiPath} - Handles Apple Music integration`);
      }
      if (content.includes('UnifiedTrack') || content.includes('unified')) {
        log.info(`${apiPath} - Handles unified music data`);
      }
    }
  }
  
  // 5. Проверка компонентов портрета
  log.header('UI Components Check');
  
  const portraitComponents = [
    'components/music/MusicPortraitDisplay.tsx',
    'components/music/EnhancedMusicPortrait.tsx',
  ];
  
  for (const compPath of portraitComponents) {
    const fullPath = path.join(webRoot, compPath);
    if (await fileExists(fullPath)) {
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Проверяем функциональность
      const features = [];
      if (content.includes('audioFeatures')) features.push('AudioFeatures');
      if (content.includes('partyReadiness')) features.push('PartyReadiness');
      if (content.includes('unified')) features.push('UnifiedData');
      if (content.includes('topGenres')) features.push('Genres');
      if (content.includes('topArtists')) features.push('Artists');
      
      log.info(`${compPath} supports: ${features.join(', ')}`);
    }
  }
  
  // 6. Тестовый запрос к API
  log.header('API Health Test');
  
  log.info('Testing API endpoints requires running server');
  log.info('Run: npm run dev');
  log.info('Then test:');
  log.info('  - GET /api/music/portrait');
  log.info('  - GET /api/music/unified-portrait (if exists)');
  log.info('  - GET /api/parties');
  
  // 7. Итоговый отчет
  log.header('Summary Report');
  
  if (fileCheckPassed) {
    log.success('All critical files are present');
  } else {
    log.error('Some critical files are missing');
  }
  
  // Рекомендации
  log.header('Recommendations');
  
  const recommendations = [];
  
  if (!await fileExists(path.join(webRoot, 'app/api/music/unified-portrait/route.ts'))) {
    recommendations.push('Create unified-portrait API to merge Spotify + Apple Music data');
  }
  
  if (!await fileExists(path.join(webRoot, 'lib/apple-music-api.ts'))) {
    recommendations.push('Add apple-music-api.ts for better Apple Music integration');
  }
  
  if (!await fileExists(path.join(webRoot, 'components/music/EnhancedMusicPortrait.tsx'))) {
    recommendations.push('Consider using EnhancedMusicPortrait for better UI');
  }
  
  if (data && data.parties?.length > 0) {
    const partiesWithVoting = data.parties.filter((p: any) => p.votingEnabled).length;
    if (partiesWithVoting === 0) {
      recommendations.push('Implement voting system for parties');
    }
  }
  
  if (recommendations.length > 0) {
    recommendations.forEach(rec => log.warning(rec));
  } else {
    log.success('System is fully configured!');
  }
  
  // Проверка на дубликаты функциональности
  log.header('Checking for Duplicates');
  
  const portraitRoute = path.join(webRoot, 'app/api/music/portrait/route.ts');
  const unifiedRoute = path.join(webRoot, 'app/api/music/unified-portrait/route.ts');
  
  if (await fileExists(portraitRoute) && await fileExists(unifiedRoute)) {
    log.warning('Both portrait and unified-portrait routes exist');
    log.info('Consider consolidating into one endpoint');
    log.info('Recommended: Use unified-portrait for all music data');
  }
  
  const oldComponent = path.join(webRoot, 'components/music/MusicPortraitDisplay.tsx');
  const newComponent = path.join(webRoot, 'components/music/EnhancedMusicPortrait.tsx');
  
  if (await fileExists(oldComponent) && await fileExists(newComponent)) {
    log.warning('Both MusicPortraitDisplay and EnhancedMusicPortrait exist');
    log.info('Consider using only EnhancedMusicPortrait');
  }
}

// Запуск проверки
checkSystemHealth().catch(console.error);