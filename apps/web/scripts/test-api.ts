// scripts/test-api.ts
// Запуск: npx tsx scripts/test-api.ts
// Убедитесь, что сервер запущен: npm run dev

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
};

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  data?: any;
  error?: string;
}

async function testEndpoint(
  endpoint: string, 
  method: string = 'GET',
  body?: any,
  headers?: any
): Promise<TestResult> {
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
    const data = await response.json();
    
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
  log.header('tootFM API Testing Suite');
  
  const results: TestResult[] = [];
  
  // 1. Test Party APIs
  log.header('Testing Party APIs');
  
  // Get all parties
  const partiesResult = await testEndpoint('/parties');
  results.push(partiesResult);
  
  if (partiesResult.success) {
    log.success(`GET /parties - ${partiesResult.status} - Found ${partiesResult.data?.parties?.length || 0} parties`);
    
    // If there are parties, test getting one
    if (partiesResult.data?.parties?.length > 0) {
      const partyId = partiesResult.data.parties[0].id;
      const partyResult = await testEndpoint(`/parties/${partyId}`);
      results.push(partyResult);
      
      if (partyResult.success) {
        log.success(`GET /parties/${partyId} - ${partyResult.status}`);
        log.info(`Party: ${partyResult.data?.party?.name || 'Unknown'}`);
      } else {
        log.error(`GET /parties/${partyId} - ${partyResult.status}`);
      }
    }
  } else {
    log.error(`GET /parties - ${partiesResult.status} - ${partiesResult.error}`);
  }
  
  // 2. Test Music Portrait API
  log.header('Testing Music Portrait APIs');
  
  // Test original portrait endpoint
  const portraitResult = await testEndpoint('/music/portrait');
  results.push(portraitResult);
  
  if (portraitResult.success) {
    log.success(`GET /music/portrait - ${portraitResult.status}`);
    
    const portrait = portraitResult.data?.musicPortrait;
    if (portrait) {
      log.info(`Source: ${portrait.source || 'Unknown'}`);
      log.info(`Genres: ${portrait.topGenres?.length || 0}`);
      log.info(`Artists: ${portrait.topArtists?.length || 0}`);
      log.info(`Tracks: ${portrait.topTracks?.length || 0}`);
      
      if (portrait.audioFeatures) {
        log.info(`Audio Features:`);
        log.info(`  Energy: ${portrait.audioFeatures.energy}%`);
        log.info(`  Danceability: ${portrait.audioFeatures.danceability}%`);
        log.info(`  Valence: ${portrait.audioFeatures.valence}%`);
        log.info(`  Party Readiness: ${portrait.partyReadiness}%`);
      } else {
        log.warning('No audio features found');
      }
    }
  } else {
    log.warning(`GET /music/portrait - ${portraitResult.status} - ${portraitResult.data?.error || portraitResult.error}`);
  }
  
  // Test unified portrait endpoint (if exists)
  const unifiedResult = await testEndpoint('/music/unified-portrait');
  results.push(unifiedResult);
  
  if (unifiedResult.success) {
    log.success(`GET /music/unified-portrait - ${unifiedResult.status}`);
    
    const unified = unifiedResult.data?.portrait;
    if (unified) {
      log.info(`Sources: ${unified.sources?.join(', ') || 'None'}`);
      log.info(`Merged tracks: ${unified.topTracks?.length || 0}`);
      log.info(`Party Readiness: ${unified.partyReadiness}%`);
      
      const stats = unifiedResult.data?.stats;
      if (stats) {
        log.info(`Merged by ISRC: ${stats.mergedByISRC} tracks`);
      }
    }
  } else {
    log.warning(`GET /music/unified-portrait - Not implemented or error`);
  }
  
  // 3. Test Auth Status
  log.header('Testing Auth Endpoints');
  
  // Note: These require authentication
  log.info('Auth endpoints require session - skipping in automated test');
  log.info('Manual test required for:');
  log.info('  - /auth/spotify/connect');
  log.info('  - /auth/apple-music/token');
  
  // 4. Summary
  log.header('Test Summary');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log.info(`Total tests: ${results.length}`);
  log.success(`Successful: ${successful}`);
  if (failed > 0) {
    log.error(`Failed: ${failed}`);
  }
  
  // 5. Data Quality Check
  log.header('Data Quality Analysis');
  
  if (portraitResult.success && portraitResult.data?.musicPortrait) {
    const portrait = portraitResult.data.musicPortrait;
    const audioFeatures = portrait.audioFeatures;
    
    if (audioFeatures) {
      const allZero = Object.values(audioFeatures)
        .filter(v => typeof v === 'number')
        .every(v => v === 0);
      
      if (allZero) {
        log.error('❌ CRITICAL: All audio features are 0 - API not working correctly!');
        log.info('Check Spotify token and audio-features endpoint');
      } else {
        log.success('✅ Audio features are being calculated correctly');
      }
      
      if (portrait.partyReadiness === 0) {
        log.warning('Party Readiness is 0 - check calculation formula');
      } else if (portrait.partyReadiness > 70) {
        log.success(`Great party music! Score: ${portrait.partyReadiness}%`);
      } else if (portrait.partyReadiness > 40) {
        log.info(`Moderate party potential: ${portrait.partyReadiness}%`);
      } else {
        log.info(`Low party energy: ${portrait.partyReadiness}%`);
      }
    }
  }
  
  // 6. Recommendations
  log.header('Recommendations');
  
  const recommendations = [];
  
  if (!portraitResult.success || portraitResult.data?.error === 'No Spotify connection') {
    recommendations.push('Connect Spotify account first');
  }
  
  if (!unifiedResult.success) {
    recommendations.push('Implement unified-portrait endpoint for multi-source data');
  }
  
  if (portraitResult.data?.musicPortrait?.audioFeatures?.energy === 0) {
    recommendations.push('Fix audio features calculation in portrait API');
  }
  
  if (recommendations.length > 0) {
    recommendations.forEach(rec => log.warning(rec));
  } else {
    log.success('All systems operational!');
  }
}

// Запуск тестов
console.log('Starting API tests...');
console.log('Make sure server is running on http://localhost:3000');
console.log('');

runTests().catch(error => {
  log.error('Test suite failed:');
  console.error(error);
});