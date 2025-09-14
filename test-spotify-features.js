// Тестовый скрипт для проверки Spotify audio features
const fetch = require('node-fetch');

async function testSpotifyFeatures() {
  console.log('🔍 Проверяем Spotify Audio Features API\n');
  
  // Здесь нужен валидный access token
  // Можно взять из data.json
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('./apps/web/data.json', 'utf-8'));
  
  const userWithSpotify = data.users.find(u => u.spotifyProfile?.accessToken);
  
  if (!userWithSpotify) {
    console.log('❌ Нет пользователей с Spotify токеном');
    return;
  }
  
  console.log('✅ Найден пользователь:', userWithSpotify.email);
  console.log('📅 Token expires at:', userWithSpotify.spotifyProfile.expiresAt);
  
  // Сначала получим top tracks
  const tracksResponse = await fetch(
    'https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term',
    {
      headers: {
        'Authorization': `Bearer ${userWithSpotify.spotifyProfile.accessToken}`
      }
    }
  );
  
  if (!tracksResponse.ok) {
    console.log('❌ Ошибка при запросе треков:', tracksResponse.status);
    console.log(await tracksResponse.text());
    return;
  }
  
  const tracks = await tracksResponse.json();
  console.log('\n📀 Top tracks получены:', tracks.items.length);
  
  const trackIds = tracks.items.map(t => t.id).join(',');
  console.log('🎵 Track IDs:', trackIds);
  
  // Теперь запросим audio features
  const featuresUrl = `https://api.spotify.com/v1/audio-features?ids=${trackIds}`;
  console.log('\n🔗 Features URL:', featuresUrl);
  
  const featuresResponse = await fetch(featuresUrl, {
    headers: {
      'Authorization': `Bearer ${userWithSpotify.spotifyProfile.accessToken}`
    }
  });
  
  console.log('📊 Features response status:', featuresResponse.status);
  
  const featuresData = await featuresResponse.json();
  console.log('\n🎯 Audio Features результат:');
  console.log(JSON.stringify(featuresData, null, 2));
  
  // Проверим каждый трек
  if (featuresData.audio_features) {
    featuresData.audio_features.forEach((f, i) => {
      if (f === null) {
        console.log(`\n⚠️  Track ${i} (${tracks.items[i]?.name}) - features = NULL`);
        console.log(`   ID: ${tracks.items[i]?.id}`);
        console.log(`   URI: ${tracks.items[i]?.uri}`);
      }
    });
  }
}

testSpotifyFeatures().catch(console.error);
