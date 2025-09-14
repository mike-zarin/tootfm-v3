const fs = require('fs');
const fetch = require('node-fetch');

async function refreshToken() {
  const data = JSON.parse(fs.readFileSync('./apps/web/data.json', 'utf-8'));
  const user = data.users.find(u => u.spotifyProfile?.refreshToken);
  
  if (!user) {
    console.log('❌ Нет пользователя с refresh token');
    return;
  }
  
  console.log('🔄 Обновляем токен для:', user.email);
  
  const clientId = '68a7ea6587af43cc893cc0994a584eff';
  const clientSecret = 'cd2b848b64e743c784600947a13459f2';
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.spotifyProfile.refreshToken
    })
  });
  
  if (!response.ok) {
    console.log('❌ Ошибка:', response.status);
    console.log(await response.text());
    return;
  }
  
  const tokenData = await response.json();
  console.log('✅ Новый токен получен!');
  
  // Обновляем в data.json
  user.spotifyProfile.accessToken = tokenData.access_token;
  user.spotifyProfile.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  
  // Если пришел новый refresh token - обновляем и его
  if (tokenData.refresh_token) {
    user.spotifyProfile.refreshToken = tokenData.refresh_token;
    console.log('🔄 Refresh token тоже обновлен');
  }
  
  fs.writeFileSync('./apps/web/data.json', JSON.stringify(data, null, 2));
  console.log('💾 Токен сохранен в data.json');
  console.log('📅 Истекает:', user.spotifyProfile.expiresAt);
  
  // Сразу проверим что токен работает
  console.log('\n🧪 Проверяем новый токен...');
  const testResponse = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`
    }
  });
  
  if (testResponse.ok) {
    const profile = await testResponse.json();
    console.log('✅ Токен работает! Пользователь:', profile.display_name || profile.id);
  } else {
    console.log('❌ Токен не работает:', testResponse.status);
  }
}

refreshToken().catch(console.error);
