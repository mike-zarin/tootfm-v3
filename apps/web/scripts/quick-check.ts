// scripts/quick-check.ts
// Быстрая проверка после подключения сервисов
// Запуск: npx tsx scripts/quick-check.ts

import { promises as fs } from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

async function quickCheck() {
  console.log(`\n${colors.cyan}═══ tootFM Quick Status Check ═══${colors.reset}\n`);
  
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    const data = JSON.parse(content);
    
    const user = data.users?.[0];
    
    if (!user) {
      console.log(`${colors.red}✗ No users found${colors.reset}`);
      return;
    }
    
    console.log(`${colors.blue}User:${colors.reset} ${user.email}\n`);
    
    // Spotify Status
    console.log(`${colors.cyan}Spotify Status:${colors.reset}`);
    if (user.spotifyProfile?.accessToken) {
      console.log(`${colors.green}✓ Connected${colors.reset}`);
      
      if (user.spotifyProfile.expiresAt) {
        const expiresAt = new Date(user.spotifyProfile.expiresAt);
        const now = new Date();
        if (expiresAt > now) {
          const hoursLeft = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
          console.log(`  Token valid for ${hoursLeft} hours`);
        } else {
          console.log(`${colors.yellow}  Token expired - needs refresh${colors.reset}`);
        }
      }
      
      if (user.spotifyProfile.displayName) {
        console.log(`  Display Name: ${user.spotifyProfile.displayName}`);
      }
    } else {
      console.log(`${colors.red}✗ Not connected${colors.reset}`);
    }
    
    // Apple Music Status
    console.log(`\n${colors.cyan}Apple Music Status:${colors.reset}`);
    if (user.appleMusicProfile?.musicUserToken) {
      console.log(`${colors.green}✓ Connected${colors.reset}`);
      console.log(`  Token: ${user.appleMusicProfile.musicUserToken.substring(0, 20)}...`);
    } else {
      console.log(`${colors.red}✗ Not connected${colors.reset}`);
    }
    
    // Music Portrait Status
    console.log(`\n${colors.cyan}Music Portrait:${colors.reset}`);
    if (user.musicPortrait) {
      console.log(`${colors.green}✓ Generated${colors.reset}`);
      console.log(`  Source: ${user.musicPortrait.source}`);
      console.log(`  Genres: ${user.musicPortrait.topGenres?.length || 0}`);
      console.log(`  Artists: ${user.musicPortrait.topArtists?.length || 0}`);
      console.log(`  Tracks: ${user.musicPortrait.topTracks?.length || 0}`);
      
      const features = user.musicPortrait.audioFeatures;
      if (features) {
        console.log(`\n  ${colors.magenta}Audio Features:${colors.reset}`);
        console.log(`    Energy: ${features.energy}%`);
        console.log(`    Danceability: ${features.danceability}%`);
        console.log(`    Valence (Mood): ${features.valence}%`);
        console.log(`    Party Readiness: ${user.musicPortrait.partyReadiness}%`);
        
        // Check if all zero
        const allZero = Object.values(features)
          .filter((v: any) => typeof v === 'number' && v !== features.tempo)
          .every((v: any) => v === 0);
        
        if (allZero) {
          console.log(`\n${colors.red}  ⚠ WARNING: All audio features are 0!${colors.reset}`);
          console.log(`  This means Spotify API didn't return audio features.`);
          console.log(`  Try regenerating the portrait.`);
        }
      }
    } else {
      console.log(`${colors.red}✗ Not generated${colors.reset}`);
    }
    
    // Unified Portrait Status
    console.log(`\n${colors.cyan}Unified Portrait:${colors.reset}`);
    if (user.unifiedMusicPortrait) {
      console.log(`${colors.green}✓ Generated${colors.reset}`);
      console.log(`  Sources: ${user.unifiedMusicPortrait.sources?.join(', ')}`);
      console.log(`  Party Readiness: ${user.unifiedMusicPortrait.partyReadiness}%`);
    } else {
      console.log(`${colors.yellow}✗ Not generated${colors.reset}`);
    }
    
    // Parties
    console.log(`\n${colors.cyan}Parties:${colors.reset}`);
    console.log(`  Total: ${data.parties?.length || 0}`);
    
    const userParties = data.parties?.filter((p: any) => p.hostId === user.id) || [];
    console.log(`  Hosted by you: ${userParties.length}`);
    
    // Next Steps
    console.log(`\n${colors.cyan}═══ Next Steps ═══${colors.reset}\n`);
    
    if (!user.spotifyProfile && !user.appleMusicProfile) {
      console.log(`1. Connect Spotify or Apple Music at http://localhost:3000`);
    } else if (!user.musicPortrait) {
      console.log(`1. Generate music portrait at http://localhost:3000/api/music/portrait`);
    } else if (user.musicPortrait?.audioFeatures?.energy === 0) {
      console.log(`1. Regenerate portrait - audio features are broken`);
      console.log(`   Visit: http://localhost:3000/api/music/portrait`);
    } else if (!user.unifiedMusicPortrait) {
      console.log(`1. Generate unified portrait at http://localhost:3000/api/music/unified-portrait`);
    } else {
      console.log(`${colors.green}✓ Everything looks good!${colors.reset}`);
      console.log(`\nYou can now:`);
      console.log(`- Create a party`);
      console.log(`- Invite friends`);
      console.log(`- Start the music!`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
  }
}

// Run
quickCheck();