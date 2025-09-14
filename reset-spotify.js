const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./apps/web/data.json', 'utf-8'));
const user = data.users.find(u => u.email === 'mihail.zarin@gmail.com');

if (user && user.spotifyProfile) {
  console.log('🔄 Сбрасываем Spotify подключение для:', user.email);
  console.log('Было:', user.spotifyProfile.displayName);
  
  // Удаляем Spotify профиль
  delete user.spotifyProfile;
  
  fs.writeFileSync('./apps/web/data.json', JSON.stringify(data, null, 2));
  console.log('✅ Spotify подключение сброшено!');
  console.log('📌 Теперь обнови страницу в браузере и подключи Spotify заново');
} else {
  console.log('❌ Пользователь или Spotify профиль не найден');
}
