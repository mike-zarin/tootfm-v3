// /apps/web/scripts/check-env.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the root .env.local file
config({ path: resolve(process.cwd(), '../../.env.local') });

const requiredEnvVars = {
  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  
  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // Spotify
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI,
  
  // Apple Music
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
  APPLE_KEY_ID: process.env.APPLE_KEY_ID,
  APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
  
  // Pusher
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_KEY: process.env.PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
  
  // Feature Flags
  ENABLE_SPOTIFY: process.env.ENABLE_SPOTIFY,
  ENABLE_APPLE_MUSIC: process.env.ENABLE_APPLE_MUSIC,
};

console.log('Environment Variables Check:');
console.log('============================');

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`❌ ${key}: MISSING`);
  } else if (key.includes('SECRET') || key.includes('PRIVATE')) {
    console.log(`✅ ${key}: [REDACTED]`);
  } else {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  }
});

// Check for production values
if (process.env.NEXTAUTH_URL?.includes('localhost')) {
  console.log('\n⚠️  WARNING: NEXTAUTH_URL contains localhost!');
}

if (process.env.SPOTIFY_REDIRECT_URI?.includes('localhost')) {
  console.log('⚠️  WARNING: SPOTIFY_REDIRECT_URI contains localhost!');
}

// Check for production deployment
if (process.env.NODE_ENV === 'production') {
  console.log('\n🚀 Production Environment Detected');
  
  if (!process.env.NEXTAUTH_URL?.includes('tootfm.world')) {
    console.log('⚠️  WARNING: NEXTAUTH_URL should be https://tootfm.world in production');
  }
  
  if (!process.env.SPOTIFY_REDIRECT_URI?.includes('tootfm.world')) {
    console.log('⚠️  WARNING: SPOTIFY_REDIRECT_URI should include https://tootfm.world in production');
  }
}

// Check critical missing variables
const criticalMissing = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value && ['NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'].includes(key));

if (criticalMissing.length > 0) {
  console.log('\n🚨 CRITICAL MISSING VARIABLES:');
  criticalMissing.forEach(([key]) => {
    console.log(`   - ${key}`);
  });
  process.exit(1);
}

console.log('\n✅ Environment check completed successfully!');
