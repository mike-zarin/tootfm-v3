// scripts/check-spotify-callback.ts
// Проверяет почему Spotify callback не сохраняет данные
// Запуск: npx tsx scripts/check-spotify-callback.ts

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

async function checkCallback() {
  console.log(`\n${colors.cyan}═══ SPOTIFY CALLBACK CHECK ═══${colors.reset}\n`);
  
  const callbackPath = path.join(process.cwd(), 'app/api/auth/spotify/callback/route.ts');
  
  try {
    const content = await fs.readFile(callbackPath, 'utf-8');
    
    console.log(`${colors.blue}Analyzing callback route...${colors.reset}\n`);
    
    // Check critical parts
    const checks = [
      {
        name: 'Gets code from URL',
        pattern: /searchParams\.get\(['"]code['"]\)/,
        found: false
      },
      {
        name: 'Exchanges code for tokens',
        pattern: /exchangeCodeForTokens|token.*grant_type.*authorization_code/,
        found: false
      },
      {
        name: 'Gets user profile',
        pattern: /spotify\.com\/v1\/me|getUserProfile/,
        found: false
      },
      {
        name: 'Saves to storage',
        pattern: /storage\.(updateUser|createUser)/,
        found: false
      },
      {
        name: 'Saves spotifyProfile field',
        pattern: /spotifyProfile\s*:/,
        found: false
      },
      {
        name: 'Redirects after success',
        pattern: /NextResponse\.redirect|redirect\(/,
        found: false
      }
    ];
    
    checks.forEach(check => {
      check.found = check.pattern.test(content);
      if (check.found) {
        console.log(`${colors.green}✓${colors.reset} ${check.name}`);
      } else {
        console.log(`${colors.red}✗${colors.reset} ${check.name}`);
      }
    });
    
    // Show what the callback is actually doing
    console.log(`\n${colors.yellow}Current callback behavior:${colors.reset}`);
    
    // Check redirect URL
    const redirectMatch = content.match(/redirect\(.*?['"`]([^'"`]+)['"`]/);
    if (redirectMatch) {
      console.log(`Redirects to: ${redirectMatch[1]}`);
      if (redirectMatch[1].includes('spotify=connected')) {
        console.log(`${colors.yellow}⚠ Redirects with query param but doesn't save data!${colors.reset}`);
      }
    }
    
    // Check if it's using the right storage method
    if (content.includes('storage.updateUser')) {
      console.log(`${colors.green}Uses updateUser (good)${colors.reset}`);
    } else if (content.includes('storage.createUser')) {
      console.log(`${colors.yellow}Uses createUser (might overwrite)${colors.reset}`);
    } else {
      console.log(`${colors.red}Doesn't save to storage at all!${colors.reset}`);
    }
    
    // Suggest fix
    console.log(`\n${colors.cyan}═══ SUGGESTED FIX ═══${colors.reset}\n`);
    
    if (!checks[4].found) {
      console.log(`The callback needs to save the Spotify data. Add this after getting tokens:\n`);
      console.log(`${colors.green}
// Save Spotify profile to user
const user = storage.getUserByEmail(session.user.email);
if (user) {
  storage.updateUser(user.id, {
    spotifyProfile: {
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      product: profile.product
    }
  });
}
${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.red}Error reading callback file:${colors.reset}`, error);
  }
}

checkCallback().catch(console.error);