// scripts/test-api-auth.ts
// Запуск: npx tsx scripts/test-api-auth.ts
// Убедитесь, что сервер запущен: npm run dev

import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000/api';
const WEB_BASE = 'http://localhost:3000';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
  data: (msg: string) => console.log(`${colors.magenta}→${colors.reset} ${msg}`),
};

// Читаем data.json напрямую для получения информации о пользователях
async function getLocalData() {
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log.error('Failed to read data.json');
    return null;
  }
}

async function testEndpoint(
  endpoint: string, 
  method: string = 'GET',
  body?: any,
  headers?: any
) {
  try {
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    return {
      endpoint,
      method,
      status: response.status,
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runTests() {
  log.header('tootFM API Testing Suite v2.0');
  
  // 1. Проверяем локальные данные
  log.header('Local Data Analysis');
  
  const localData = await getLocalData();
  if (localData) {
    log.success('data.json loaded');
    
    // Анализируем пользователей
    const users = localData.users || [];
    log.info(`Total users: ${users.length}`);
    
    if (users.length > 0) {
      users.forEach((user: any, index: number) => {
        log.data(`User ${index + 1}: ${user.email || 'No email'}`);
        
        // Проверяем интеграции
        const integrations = [];
        if (user.spotifyProfile?.accessToken) {
          integrations.push('Spotify');
          log.success(`  → Spotify connected`);
          
          // Проверяем свежесть токена
          if (user.spotifyProfile.expiresAt) {
            const expiresAt = new Date(user.spotifyProfile.expiresAt);
            const now = new Date();
            if (expiresAt > now) {
              log.success(`  → Spotify token valid until ${expiresAt.toLocaleString()}`);
            } else {
              log.warning(`  → Spotify token expired at ${expiresAt.toLocaleString()}`);
            }
          }
        }
        
        if (user.appleMusicProfile?.musicUserToken) {
          integrations.push('Apple Music');
          log.success(`  → Apple Music connected`);
        }
        
        if (user.musicPortrait) {
          log.info(`  → Has music portrait (source: ${user.musicPortrait.source})`);
          
          const features = user.musicPortrait.audioFeatures;
          if (features) {
            const nonZero = Object.entries(features)
              .filter(([k, v]) => k !== 'tempo' && Number(v) > 0);
            
            if (nonZero.length > 0) {
              log.success(`  → Audio features: ${nonZero.length}/7 have values`);
              log.data(`     Energy: ${features.energy}%, Dance: ${features.danceability}%, Mood: ${features.valence}%`);
            } else {
              log.error(`  → All audio features are 0!`);
            }
          }
          
          if (user.musicPortrait.partyReadiness) {
            log.info(`  → Party Readiness: ${user.musicPortrait.partyReadiness}%`);
          }
        }
        
        if (user.unifiedMusicPortrait) {
          log.info(`  → Has unified portrait (sources: ${user.unifiedMusicPortrait.sources?.join(', ')})`);
        }
        
        if (integrations.length === 0) {
          log.warning(`  → No music services connected`);
        }
      });
    } else {
      log.warning('No users found in data.json');
    }
    
    // Анализируем партии
    const parties = localData.parties || [];
    log.info(`\nTotal parties: ${parties.length}`);
    
    if (parties.length > 0) {
      const activeParties = parties.filter((p: any) => p.status === 'ACTIVE').length;
      const waitingParties = parties.filter((p: any) => p.status === 'WAITING').length;
      
      log.data(`Active: ${activeParties}, Waiting: ${waitingParties}`);
      
      // Показываем последние 3 партии
      parties.slice(-3).forEach((party: any) => {
        log.info(`  Party: ${party.name} (${party.code}) - ${party.status}`);
      });
    }
  } else {
    log.error('Could not load local data');
  }
  
  // 2. Тестируем API endpoints без авторизации
  log.header('Testing Public API Endpoints');
  
  // Health check
  const healthResult = await testEndpoint('/health');
  if (healthResult.status === 404) {
    log.warning('No health endpoint - consider adding one');
  } else if (healthResult.success) {
    log.success('Health check passed');
  }
  
  // 3. Информация для ручного тестирования
  log.header('Manual Testing Instructions');
  
  log.info('To test authenticated endpoints:');
  log.info('1. Open browser and go to http://localhost:3000');
  log.info('2. Sign in with Google');
  log.info('3. Connect Spotify/Apple Music');
  log.info('4. Then check these endpoints in browser:');
  log.data('   http://localhost:3000/api/music/portrait');
  log.data('   http://localhost:3000/api/music/unified-portrait');
  log.data('   http://localhost:3000/api/parties');
  
  // 4. Проверяем структуру API
  log.header('API Structure Analysis');
  
  const apiFiles = [
    'app/api/music/portrait/route.ts',
    'app/api/music/unified-portrait/route.ts',
    'app/api/auth/apple-music/token/route.ts',
  ];
  
  for (const file of apiFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      await fs.access(filePath);
      log.success(`${file} exists`);
    } catch {
      log.error(`${file} missing`);
    }
  }
  
  // 5. Рекомендации на основе анализа
  log.header('Recommendations Based on Analysis');
  
  if (localData) {
    const hasSpotifyUsers = localData.users?.some((u: any) => u.spotifyProfile?.accessToken);
    const hasAppleUsers = localData.users?.some((u: any) => u.appleMusicProfile?.musicUserToken);
    const hasPortraits = localData.users?.some((u: any) => u.musicPortrait);
    const hasUnifiedPortraits = localData.users?.some((u: any) => u.unifiedMusicPortrait);
    
    if (!hasSpotifyUsers && !hasAppleUsers) {
      log.warning('No users have connected music services');
      log.info('→ Sign in and connect Spotify or Apple Music first');
    }
    
    if (hasSpotifyUsers && !hasPortraits) {
      log.warning('Users have Spotify but no portraits generated');
      log.info('→ Check if portrait generation is triggered after Spotify connect');
    }
    
    if (hasPortraits) {
      const zeroFeatures = localData.users?.some((u: any) => 
        u.musicPortrait?.audioFeatures && 
        Object.values(u.musicPortrait.audioFeatures).every((v: any) => v === 0 || v === '0')
      );
      
      if (zeroFeatures) {
        log.error('Some portraits have all audio features as 0');
        log.info('→ Check Spotify API calls in portrait/route.ts');
        log.info('→ Verify audio-features endpoint is being called');
      }
    }
    
    if (hasPortraits && hasUnifiedPortraits) {
      log.warning('Both portrait and unified portrait exist');
      log.info('→ Consider using only unified-portrait for consistency');
    }
  }
  
  // 6. Quick fixes
  log.header('Quick Fixes Available');
  
  log.info('1. If Spotify tokens expired:');
  log.data('   → User needs to reconnect Spotify');
  
  log.info('2. If audio features are 0:');
  log.data('   → Check if Spotify token has correct scopes');
  log.data('   → Verify user-top-read scope is included');
  
  log.info('3. To consolidate endpoints:');
  log.data('   → Use unified-portrait as main endpoint');
  log.data('   → Redirect portrait to unified-portrait');
}

// Запуск тестов
console.log('Starting enhanced API tests...');
console.log('This will analyze local data and provide recommendations');
console.log('');

runTests().catch(error => {
  log.error('Test suite failed:');
  console.error(error);
});