const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));

// Находим user ID по email
const user = data.users.find(u => u.email === 'mihail.zarin@gmail.com');
const correctUserId = user.id; // user_1756401795176
const wrongHostId = '107793802893242446523';

console.log(`Меняем hostId с ${wrongHostId} на ${correctUserId}`);

// Обновляем hostId во всех партиях
data.parties = data.parties.map(party => {
  if (party.hostId === wrongHostId) {
    console.log(`  Обновляем партию ${party.code}`);
    party.hostId = correctUserId;
  }
  return party;
});

// Обновляем memberships
data.memberships = data.memberships.map(m => {
  if (m.userId === wrongHostId) {
    m.userId = correctUserId;
  }
  return m;
});

fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
console.log('✅ Готово!');
