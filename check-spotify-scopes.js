const fs = require('fs');

// Читаем data.json
const data = JSON.parse(fs.readFileSync('./apps/web/data.json', 'utf-8'));
const user = data.users.find(u => u.spotifyProfile?.accessToken);

if (user?.spotifyProfile) {
  console.log('📋 Spotify Profile данные:');
  console.log('Scopes:', user.spotifyProfile.scope || 'НЕ СОХРАНЕНЫ');
  console.log('\n🔍 Проверяем что сохранено в профиле:');
  console.log(JSON.stringify(user.spotifyProfile, null, 2));
}

// Проверим какие scopes определены в коде
console.log('\n📝 Scopes в коде (lib/spotify.ts):');
const spotifyFile = fs.readFileSync('./apps/web/lib/spotify.ts', 'utf-8');
const scopesMatch = spotifyFile.match(/SPOTIFY_SCOPES = \[([\s\S]*?)\]/);
if (scopesMatch) {
  console.log(scopesMatch[0]);
}
