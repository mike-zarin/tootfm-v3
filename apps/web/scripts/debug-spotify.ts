// scripts/debug-spotify.ts
// Детальная проверка Spotify подключения
// Запуск: npx tsx scripts/debug-spotify.ts

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

async function debugSpotify() {
  console.log(`\n${colors.cyan}═══ SPOTIFY DEBUG ═══${colors.reset}\n`);
  
  // 1. Check environment variables
  console.log(`${colors.blue}1. Environment Variables:${colors.reset}`);
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const hasClientId = envContent.includes('SPOTIFY_CLIENT_ID=');
    const hasClientSecret = envContent.includes('SPOTIFY_CLIENT_SECRET=');
    const hasNextAuthUrl = envContent.includes('NEXTAUTH_URL=');
    
    console.log(`SPOTIFY_CLIENT_ID: ${hasClientId ? '✓ Set' : '✗ Missing'}`);
    console.log(`SPOTIFY_CLIENT_SECRET: ${hasClientSecret ? '✓ Set' : '✗ Missing'}`);
    console.log(`NEXTAUTH_URL: ${hasNextAuthUrl ? '✓ Set' : '✗ Missing'}`);
    
    // Extract NEXTAUTH_URL
    const urlMatch = envContent.match(/NEXTAUTH_URL=(.+)/);
    if (urlMatch) {
      console.log(`  Value: ${urlMatch[1]}`);
    }
  } catch (error) {
    console.log(`${colors.red}✗ .env.local not found${colors.reset}`);
  }
  
  // 2. Check data.json
  console.log(`\n${colors.blue}2. Data Storage:${colors.reset}`);
  const dataPath = path.join(process.cwd(), 'data.json');
  
  try {
    const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    console.log(`Users: ${data.users?.length || 0}`);
    
    if (data.users?.length > 0) {
      data.users.forEach((user: any, index: number) => {
        console.log(`\nUser ${index + 1}: ${user.email}`);
        
        // Check if spotifyProfile exists at all
        if ('spotifyProfile' in user) {
          console.log(`  ${colors.green}✓ Has spotifyProfile field${colors.reset}`);
          const sp = user.spotifyProfile;
          console.log(`    - accessToken: ${sp?.accessToken ? 'Yes' : 'No'}`);
          console.log(`    - refreshToken: ${sp?.refreshToken ? 'Yes' : 'No'}`);
          console.log(`    - displayName: ${sp?.displayName || 'N/A'}`);
        } else {
          console.log(`  ${colors.red}✗ No spotifyProfile field${colors.reset}`);
        }
      });
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error reading data.json${colors.reset}`);
  }
  
  // 3. Check API routes
  console.log(`\n${colors.blue}3. API Routes:${colors.reset}`);
  
  const routes = [
    'app/api/auth/spotify/connect/route.ts',
    'app/api/auth/spotify/callback/route.ts',
    'app/api/auth/spotify/status/route.ts',
  ];
  
  for (const route of routes) {
    const fullPath = path.join(process.cwd(), route);
    try {
      await fs.access(fullPath);
      console.log(`${colors.green}✓${colors.reset} ${route}`);
      
      // Check callback for critical parts
      if (route.includes('callback')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        const hasUpdateUser = content.includes('updateUser');
        const hasSpotifyProfile = content.includes('spotifyProfile:');
        
        console.log(`    - updateUser: ${hasUpdateUser ? '✓' : '✗'}`);
        console.log(`    - saves spotifyProfile: ${hasSpotifyProfile ? '✓' : '✗'}`);
      }
    } catch {
      console.log(`${colors.red}✗${colors.reset} ${route} - MISSING`);
    }
  }
  
  // 4. Test instructions
  console.log(`\n${colors.cyan}═══ TEST INSTRUCTIONS ═══${colors.reset}\n`);
  
  console.log('1. Open Chrome DevTools (F12) → Network tab');
  console.log('2. Clear site data: Application → Storage → Clear site data');
  console.log('3. Try connecting Spotify again');
  console.log('4. Watch for these requests:');
  console.log('   - /api/auth/spotify/connect (should redirect to Spotify)');
  console.log('   - Spotify authorization');
  console.log('   - /api/auth/spotify/callback (should redirect back)');
  console.log('\n5. Check Console tab for JavaScript errors');
  console.log('\n6. If callback fails, check server logs for errors');
  
  // 5. Common issues
  console.log(`\n${colors.yellow}═══ COMMON ISSUES ═══${colors.reset}\n`);
  
  console.log('1. Redirect URI mismatch:');
  console.log('   - Must be exactly: http://localhost:3000/api/auth/spotify/callback');
  console.log('   - Check in Spotify App Settings');
  
  console.log('\n2. Session lost during redirect:');
  console.log('   - Check cookies are enabled');
  console.log('   - Try different browser');
  
  console.log('\n3. Storage not saving:');
  console.log('   - Check file permissions on data.json');
  console.log('   - Check server logs for write errors');
}

debugSpotify().catch(console.error);