// apps/web/scripts/deployment-check.ts
import fs from 'fs';
import path from 'path';

console.log('🚀 TootFM v3 - Deployment Readiness Check\n');

const checks = {
  envVars: false,
  dataFile: false,
  build: false,
  criticalAPIs: false,
  criticalPages: false
};

// 1. Check ENV variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  checks.envVars = 
    env.includes('NEXTAUTH_SECRET') &&
    env.includes('GOOGLE_CLIENT_ID') &&
    env.includes('SPOTIFY_CLIENT_ID');
  console.log(`✓ ENV variables: ${checks.envVars ? '✅' : '❌'}`);
} else {
  console.log(`✓ ENV variables: ❌ (.env.local not found)`);
}

// 2. Check data.json
const dataPath = path.join(process.cwd(), 'data.json');
if (fs.existsSync(dataPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    checks.dataFile = 
      data.hasOwnProperty('users') &&
      data.hasOwnProperty('parties') &&
      data.hasOwnProperty('tracks');
    console.log(`✓ Data file: ${checks.dataFile ? '✅' : '❌'}`);
    console.log(`  - Users: ${data.users?.length || 0}`);
    console.log(`  - Parties: ${data.parties?.length || 0}`);
    console.log(`  - Tracks: ${data.tracks?.length || 0}`);
  } catch (error) {
    console.log(`✓ Data file: ❌ (Invalid JSON)`);
  }
} else {
  console.log(`✓ Data file: ❌ (data.json not found)`);
}

// 3. Check critical pages
const pages = [
  'app/page.tsx',
  'app/party/[id]/page.tsx',
  'app/party/create/page.tsx',
  'app/party/join/page.tsx'
];

checks.criticalPages = pages.every(page => 
  fs.existsSync(path.join(process.cwd(), page))
);
console.log(`✓ Critical pages: ${checks.criticalPages ? '✅' : '❌'}`);

// 4. Check critical APIs
const apis = [
  'app/api/auth/spotify/connect/route.ts',
  'app/api/parties/route.ts',
  'app/api/music/portrait/route.ts'
];

checks.criticalAPIs = apis.every(api => 
  fs.existsSync(path.join(process.cwd(), api))
);
console.log(`✓ Critical APIs: ${checks.criticalAPIs ? '✅' : '❌'}`);

// 5. Check for missing files that cause build errors
const missingFiles = [
  'lib/pusher-server.ts',
  'hooks/usePlaybackSync.ts'
];

const missingFilesFound = missingFiles.filter(file => 
  !fs.existsSync(path.join(process.cwd(), file))
);

if (missingFilesFound.length > 0) {
  console.log(`⚠️  Missing files: ${missingFilesFound.join(', ')}`);
  checks.build = false;
} else {
  checks.build = true;
}

// Final verdict
const allChecks = Object.values(checks).every(v => v === true);
console.log('\n' + '='.repeat(50));
console.log(allChecks ? 
  '✅ READY FOR DEPLOYMENT!' : 
  '❌ NOT READY - Fix issues above'
);
console.log('='.repeat(50));

// Deployment checklist
console.log('\n📋 Deployment Checklist:');
console.log('1. [ ] Update NEXTAUTH_URL in production');
console.log('2. [ ] Update SPOTIFY_REDIRECT_URI for production domain');
console.log('3. [ ] Set up database backup strategy');
console.log('4. [ ] Configure monitoring (Sentry/LogRocket)');
console.log('5. [ ] Set up SSL certificate');
console.log('6. [ ] Configure CDN for static assets');
console.log('7. [ ] Set up CI/CD pipeline');

process.exit(allChecks ? 0 : 1);
