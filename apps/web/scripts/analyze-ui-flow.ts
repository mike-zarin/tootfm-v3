// scripts/analyze-ui-flow.ts
// Полный анализ UI компонентов и user flow
// Запуск: npx tsx scripts/analyze-ui-flow.ts

import { promises as fs } from 'fs';
import path from 'path';

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
  flow: (msg: string) => console.log(`${colors.magenta}→${colors.reset} ${msg}`),
};

async function readFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

async function analyzeComponent(filePath: string, content: string) {
  const analysis: any = {
    buttons: [],
    links: [],
    forms: [],
    apiCalls: [],
    imports: [],
    hooks: [],
  };

  // Find buttons
  const buttonMatches = content.matchAll(/<Button[^>]*>([^<]+)<\/Button>/g);
  for (const match of buttonMatches) {
    const onClick = match[0].match(/onClick=\{([^}]+)\}/);
    analysis.buttons.push({
      text: match[1].trim(),
      action: onClick ? onClick[1] : 'none'
    });
  }

  // Find Links
  const linkMatches = content.matchAll(/<Link[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/Link>/g);
  for (const match of linkMatches) {
    analysis.links.push({
      href: match[1],
      text: match[2].trim()
    });
  }

  // Find API calls
  const fetchMatches = content.matchAll(/fetch\(['"`]([^'"`]+)['"`]/g);
  for (const match of fetchMatches) {
    analysis.apiCalls.push(match[1]);
  }

  // Find forms
  if (content.includes('<form') || content.includes('onSubmit')) {
    analysis.forms.push('Has form');
  }

  // Find hooks
  const hookMatches = content.matchAll(/use[A-Z]\w+/g);
  for (const match of hookMatches) {
    if (!analysis.hooks.includes(match[0])) {
      analysis.hooks.push(match[0]);
    }
  }

  return analysis;
}

async function analyzeUIFlow() {
  const projectRoot = '/Users/mz/tootfm-v3/apps/web';
  
  log.header('tootFM UI Flow Analysis');
  
  // 1. Analyze main page
  log.header('1. MAIN PAGE (app/page.tsx)');
  
  const mainPagePath = path.join(projectRoot, 'app/page.tsx');
  const mainPageContent = await readFile(mainPagePath);
  
  if (mainPageContent) {
    const mainAnalysis = await analyzeComponent(mainPagePath, mainPageContent);
    
    // Check what components are imported
    const componentImports = mainPageContent.match(/from ['"]@\/components[^'"]+['"]/g) || [];
    log.info('Imported components:');
    componentImports.forEach(imp => {
      const compName = imp.match(/components\/(.+)['"]/)?.[1];
      if (compName) log.flow(compName);
    });
    
    // Check for buttons/links
    if (mainAnalysis.buttons.length > 0) {
      log.info('\nButtons found:');
      mainAnalysis.buttons.forEach((btn: any) => {
        log.flow(`"${btn.text}" → ${btn.action}`);
      });
    }
    
    if (mainAnalysis.links.length > 0) {
      log.info('\nLinks found:');
      mainAnalysis.links.forEach((link: any) => {
        log.flow(`"${link.text}" → ${link.href}`);
      });
    }
    
    // Check for Spotify/Apple Music components
    if (mainPageContent.includes('SpotifyConnect')) {
      log.success('Has SpotifyConnect component');
    }
    if (mainPageContent.includes('AppleMusicConnect')) {
      log.success('Has AppleMusicConnect component');
    }
    if (mainPageContent.includes('MusicPortrait')) {
      log.success('Has MusicPortrait display');
    }
  }
  
  // 2. Analyze Spotify Connect Component
  log.header('2. SPOTIFY CONNECT (components/spotify/SpotifyConnect.tsx)');
  
  const spotifyConnectPath = path.join(projectRoot, 'components/spotify/SpotifyConnect.tsx');
  const spotifyContent = await readFile(spotifyConnectPath);
  
  if (spotifyContent) {
    const spotifyAnalysis = await analyzeComponent(spotifyConnectPath, spotifyContent);
    
    log.info('Spotify Connect features:');
    
    // Check connection flow
    if (spotifyContent.includes('/api/auth/spotify/connect')) {
      log.success('Has connect button → /api/auth/spotify/connect');
    }
    
    if (spotifyContent.includes('/api/auth/spotify/disconnect')) {
      log.success('Has disconnect functionality');
    }
    
    // Check if it auto-generates portrait
    if (spotifyContent.includes('/api/music/portrait')) {
      log.success('Auto-generates portrait after connection');
    } else {
      log.warning('Does NOT auto-generate portrait');
    }
    
    // Check what it displays
    if (spotifyContent.includes('displayName')) {
      log.info('Shows user display name');
    }
    if (spotifyContent.includes('product')) {
      log.info('Shows Spotify subscription type');
    }
  }
  
  // 3. Analyze Apple Music Connect
  log.header('3. APPLE MUSIC CONNECT (components/apple-music/AppleMusicConnect.tsx)');
  
  const appleConnectPath = path.join(projectRoot, 'components/apple-music/AppleMusicConnect.tsx');
  const appleContent = await readFile(appleConnectPath);
  
  if (appleContent) {
    log.info('Apple Music Connect features:');
    
    if (appleContent.includes('MusicKit')) {
      log.success('Uses MusicKit');
    }
    
    if (appleContent.includes('authorize')) {
      log.success('Has authorize functionality');
    }
    
    if (appleContent.includes('/api/auth/apple-music/callback')) {
      log.success('Saves token via callback');
    }
  }
  
  // 4. Analyze Music Portrait Display
  log.header('4. MUSIC PORTRAIT DISPLAY');
  
  const portraitPaths = [
    'components/music/MusicPortraitDisplay.tsx',
    'components/music/EnhancedMusicPortrait.tsx'
  ];
  
  for (const portraitPath of portraitPaths) {
    const fullPath = path.join(projectRoot, portraitPath);
    const content = await readFile(fullPath);
    
    if (content) {
      log.info(`\n${portraitPath}:`);
      
      // Check if it auto-fetches
      if (content.includes('useEffect') && content.includes('/api/music/portrait')) {
        log.success('Auto-fetches portrait on mount');
      } else {
        log.warning('Does NOT auto-fetch portrait');
      }
      
      // Check if it has refresh button
      if (content.includes('refresh') || content.includes('Refresh')) {
        log.success('Has refresh functionality');
      }
      
      // Check what it displays
      const displays = [];
      if (content.includes('audioFeatures')) displays.push('AudioFeatures');
      if (content.includes('partyReadiness')) displays.push('PartyReadiness');
      if (content.includes('topGenres')) displays.push('Genres');
      if (content.includes('topArtists')) displays.push('Artists');
      if (content.includes('topTracks')) displays.push('Tracks');
      
      if (displays.length > 0) {
        log.info(`Displays: ${displays.join(', ')}`);
      }
    }
  }
  
  // 5. Check Party Pages
  log.header('5. PARTY PAGES');
  
  const partyPages = [
    'app/party/create/page.tsx',
    'app/party/join/page.tsx',
    'app/party/[id]/page.tsx'
  ];
  
  for (const pagePath of partyPages) {
    const fullPath = path.join(projectRoot, pagePath);
    const content = await readFile(fullPath);
    
    if (content) {
      log.info(`\n${pagePath}:`);
      const analysis = await analyzeComponent(fullPath, content);
      
      if (analysis.apiCalls.length > 0) {
        log.info(`API calls: ${analysis.apiCalls.join(', ')}`);
      }
      
      if (analysis.forms.length > 0) {
        log.info('Has form submission');
      }
    }
  }
  
  // 6. Complete User Flow
  log.header('COMPLETE USER FLOW');
  
  log.info('1. USER LANDS ON HOME PAGE (/)');
  log.flow('Sees: Party list, Sign in button');
  
  log.info('\n2. USER SIGNS IN');
  log.flow('Via Google OAuth → Creates user in data.json');
  
  log.info('\n3. MUSIC SERVICE CONNECTION');
  log.flow('Option A: Connect Spotify button → /api/auth/spotify/connect');
  log.flow('Option B: Connect Apple Music → MusicKit authorize');
  
  log.info('\n4. AFTER CONNECTION');
  log.warning('❓ UNKNOWN: Does portrait auto-generate?');
  log.warning('❓ UNKNOWN: Is there a "Generate Portrait" button?');
  log.warning('❓ UNKNOWN: Where does user see their portrait?');
  
  log.info('\n5. PARTY CREATION');
  log.flow('/party/create → Form → POST /api/parties');
  
  log.info('\n6. PARTY VIEW');
  log.flow('/party/[id] → Shows party details');
  
  // 7. Missing pieces
  log.header('MISSING/UNCLEAR PIECES');
  
  log.error('1. Portrait Generation Trigger:');
  log.info('   - Not clear if auto-generates after Spotify connect');
  log.info('   - No visible "Generate Portrait" button found');
  
  log.error('2. Portrait Display:');
  log.info('   - Component exists but unclear where it\'s shown');
  log.info('   - Not clear if it\'s on main page or separate page');
  
  log.error('3. Music Integration in Parties:');
  log.info('   - How does portrait connect to parties?');
  log.info('   - Where is voting implemented?');
  log.info('   - How does playback work?');
  
  // 8. Recommendations
  log.header('RECOMMENDATIONS TO FIX FLOW');
  
  log.success('1. Add to SpotifyConnect.tsx:');
  log.info('   After successful connection, auto-call /api/music/portrait');
  
  log.success('2. Add to main page.tsx:');
  log.info('   If user has Spotify, show MusicPortraitDisplay component');
  log.info('   Add "Refresh Portrait" button if portrait exists');
  
  log.success('3. Create dedicated /profile page:');
  log.info('   Show all music data and portrait');
  log.info('   Allow regeneration of portrait');
}

// Run analysis
analyzeUIFlow().catch(console.error);