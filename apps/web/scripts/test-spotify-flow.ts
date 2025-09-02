// scripts/test-spotify-flow.ts
// Тестирует полный flow подключения Spotify
// Запуск: npx tsx scripts/test-spotify-flow.ts

import { promises as fs } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function testSpotifyFlow() {
  console.log(`\n${colors.cyan}═══ SPOTIFY INTEGRATION TEST ═══${colors.reset}\n`);
  
  // 1. Проверяем data.json до подключения
  console.log(`${colors.blue}1. Current Data Status:${colors.reset}`);
  
  const dataPath = path.join(process.cwd(), 'data.json');
  const dataBefore = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
  
  const user = dataBefore.users?.[0];
  if (user) {
    console.log(`User: ${user.email}`);
    console.log(`Has spotifyProfile: ${!!(user as any).spotifyProfile}`);
    
    if ((user as any).spotifyProfile) {
      const sp = (user as any).spotifyProfile;
      console.log(`  - Access Token: ${sp.accessToken ? 'Yes' : 'No'}`);
      console.log(`  - Refresh Token: ${sp.refreshToken ? 'Yes' : 'No'}`);
      console.log(`  - Display Name: ${sp.displayName || 'N/A'}`);
      console.log(`  - Expires At: ${sp.expiresAt || 'N/A'}`);
    }
  }
  
  // 2. Проверяем callback route
  console.log(`\n${colors.blue}2. Callback Route Analysis:${colors.reset}`);
  
  const callbackPath = path.join(process.cwd(), 'app/api/auth/spotify/callback/route.ts');
  const callbackContent = await fs.readFile(callbackPath, 'utf-8');
  
  // Проверяем критичные части более точно
  const checks = [
    { name: 'Token URL defined', pattern: /SPOTIFY_TOKEN_URL/ },
    { name: 'Uses fetch for token', pattern: /fetch\(.*SPOTIFY_TOKEN_URL|fetch\(['"`]https:\/\/accounts\.spotify/ },
    { name: 'Gets profile from /me', pattern: /fetch\(.*\/me['"`]?\)/ },
    { name: 'Saves spotifyProfile', pattern: /spotifyProfile:\s*\{/ },
    { name: 'Uses storage.updateUser', pattern: /storage\.updateUser/ },
    { name: 'Logs success', pattern: /console\.log.*Spotify.*saved/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(callbackContent)) {
      console.log(`${colors.green}✓${colors.reset} ${check.name}`);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${check.name}`);
    }
  });
  
  // 3. Инструкции для тестирования
  console.log(`\n${colors.cyan}═══ MANUAL TEST INSTRUCTIONS ═══${colors.reset}\n`);
  
  console.log(`1. Open browser console (F12) before clicking Connect`);
  console.log(`2. Go to Network tab`);
  console.log(`3. Click "Connect Spotify"`);
  console.log(`4. After authorization, watch for:`);
  console.log(`   - /callback request (should be 307 redirect)`);
  console.log(`   - Final redirect URL`);
  console.log(`5. Check browser console for errors`);
  
  console.log(`\n${colors.yellow}After connecting, run:${colors.reset}`);
  console.log(`npx tsx scripts/quick-check.ts`);
  
  console.log(`\n${colors.cyan}═══ COMMON ISSUES ═══${colors.reset}\n`);
  
  console.log(`${colors.yellow}If redirect goes to /party?spotify=connected but no data saved:${colors.reset}`);
  console.log(`- Session might be lost during redirect`);
  console.log(`- Check if cookies are being set correctly`);
  
  console.log(`\n${colors.yellow}If you see "spotify_denied" error:${colors.reset}`);
  console.log(`- User declined authorization`);
  console.log(`- Scopes might be too broad`);
  
  console.log(`\n${colors.yellow}If token exchange fails:${colors.reset}`);
  console.log(`- Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local`);
  console.log(`- Verify redirect URI matches exactly in Spotify app settings`);
}

testSpotifyFlow().catch(console.error);