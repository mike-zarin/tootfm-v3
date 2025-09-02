// scripts/comprehensive-check.ts
// Полная проверка работы системы
// Запуск: npx tsx scripts/comprehensive-check.ts

import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

async function comprehensiveCheck() {
  console.log(`\n${colors.cyan}═══ COMPREHENSIVE SYSTEM CHECK ═══${colors.reset}\n`);
  
  // 1. Check data.json structure
  console.log(`${colors.blue}1. DATA.JSON ANALYSIS${colors.reset}\n`);
  
  const dataPath = path.join(process.cwd(), 'data.json');
  try {
    const content = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Check users
    if (data.users && data.users.length > 0) {
      console.log(`${colors.green}✓${colors.reset} Found ${data.users.length} user(s)`);
      
      data.users.forEach((user: any, index: number) => {
        console.log(`\n  User ${index + 1}: ${user.email}`);
        console.log(`  - ID: ${user.id}`);
        console.log(`  - Name: ${user.name || 'Not set'}`);
        
        // Check fields that might be missing
        const fields = [
          'spotifyProfile',
          'appleMusicProfile', 
          'musicPortrait',
          'unifiedMusicPortrait'
        ];
        
        fields.forEach(field => {
          if (user[field]) {
            console.log(`  ${colors.green}✓${colors.reset} ${field} exists`);
            
            // Show details
            if (field === 'spotifyProfile') {
              console.log(`    - Access Token: ${user[field].accessToken ? 'Yes' : 'No'}`);
              console.log(`    - Refresh Token: ${user[field].refreshToken ? 'Yes' : 'No'}`);
              console.log(`    - Display Name: ${user[field].displayName || 'N/A'}`);
            }
            if (field === 'musicPortrait') {
              console.log(`    - Source: ${user[field].source}`);
              console.log(`    - Genres: ${user[field].topGenres?.length || 0}`);
              console.log(`    - Party Readiness: ${user[field].partyReadiness || 0}%`);
            }
          } else {
            console.log(`  ${colors.red}✗${colors.reset} ${field} missing`);
          }
        });
      });
    } else {
      console.log(`${colors.red}✗${colors.reset} No users found`);
    }
    
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Failed to read data.json:`, error);
  }
  
  // 2. Check Spotify callback route
  console.log(`\n${colors.blue}2. SPOTIFY CALLBACK ANALYSIS${colors.reset}\n`);
  
  const spotifyCallbackPath = path.join(process.cwd(), 'app/api/auth/spotify/callback/route.ts');
  try {
    const content = await fs.readFile(spotifyCallbackPath, 'utf-8');
    
    // Check if it saves spotifyProfile
    if (content.includes('spotifyProfile')) {
      console.log(`${colors.green}✓${colors.reset} Callback saves spotifyProfile`);
    } else {
      console.log(`${colors.red}✗${colors.reset} Callback doesn't save spotifyProfile`);
    }
    
    // Check if it uses storage.updateUser
    if (content.includes('storage.updateUser')) {
      console.log(`${colors.green}✓${colors.reset} Uses storage.updateUser`);
    } else if (content.includes('storage.createUser')) {
      console.log(`${colors.yellow}⚠${colors.reset} Uses storage.createUser (might overwrite)`);
    }
    
    // Check if it redirects correctly
    if (content.includes('redirect')) {
      console.log(`${colors.green}✓${colors.reset} Has redirect after callback`);
    }
    
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Failed to read callback route`);
  }
  
  // 3. Check SpotifyConnect component
  console.log(`\n${colors.blue}3. SPOTIFY CONNECT COMPONENT${colors.reset}\n`);
  
  const spotifyConnectPath = path.join(process.cwd(), 'components/spotify/SpotifyConnect.tsx');
  try {
    const content = await fs.readFile(spotifyConnectPath, 'utf-8');
    
    // Check status endpoint
    if (content.includes('/api/auth/spotify/status')) {
      console.log(`${colors.green}✓${colors.reset} Checks /api/auth/spotify/status`);
      
      // Check if status endpoint exists
      const statusPath = path.join(process.cwd(), 'app/api/auth/spotify/status/route.ts');
      try {
        await fs.access(statusPath);
        console.log(`${colors.green}✓${colors.reset} Status endpoint exists`);
      } catch {
        console.log(`${colors.red}✗${colors.reset} Status endpoint MISSING!`);
        console.log(`  ${colors.yellow}→ This is why Spotify doesn't show as connected!${colors.reset}`);
      }
    }
    
    // Check portrait generation
    if (content.includes('checkAndGeneratePortrait')) {
      console.log(`${colors.green}✓${colors.reset} Has auto-portrait generation`);
    }
    
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Failed to read SpotifyConnect`);
  }
  
  // 4. Check main page type issues
  console.log(`\n${colors.blue}4. TYPE DEFINITIONS${colors.reset}\n`);
  
  const typesPath = path.join(process.cwd(), 'types/index.ts');
  try {
    const content = await fs.readFile(typesPath, 'utf-8');
    
    // Check User type
    if (content.includes('interface User') || content.includes('type User')) {
      console.log(`${colors.green}✓${colors.reset} User type defined`);
      
      // Check fields
      const fields = ['spotifyProfile', 'appleMusicProfile', 'musicPortrait'];
      fields.forEach(field => {
        if (content.includes(field)) {
          console.log(`  ${colors.green}✓${colors.reset} ${field} in type`);
        } else {
          console.log(`  ${colors.red}✗${colors.reset} ${field} NOT in type`);
        }
      });
    }
  } catch {
    console.log(`${colors.red}✗${colors.reset} types/index.ts not found or not readable`);
  }
  
  // 5. Final diagnosis
  console.log(`\n${colors.cyan}═══ DIAGNOSIS ═══${colors.reset}\n`);
  
  console.log(`${colors.yellow}MAIN ISSUES:${colors.reset}`);
  console.log(`1. TypeScript types don't match actual data structure`);
  console.log(`2. /api/auth/spotify/status endpoint might be missing`);
  console.log(`3. Data might not persist after Spotify callback`);
  
  console.log(`\n${colors.green}SOLUTIONS:${colors.reset}`);
  console.log(`1. Create /api/auth/spotify/status/route.ts`);
  console.log(`2. Fix User type definition in types/index.ts`);
  console.log(`3. Verify Spotify callback saves data correctly`);
}

comprehensiveCheck().catch(console.error);