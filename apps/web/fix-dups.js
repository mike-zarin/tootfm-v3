const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
fs.writeFileSync('data.backup.' + Date.now() + '.json', JSON.stringify(data, null, 2));
const unique = [];
const seen = new Set();
data.memberships.forEach(m => {
  const key = m.userId + '-' + m.partyId;
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(m);
  }
});
console.log('Removed: ' + (data.memberships.length - unique.length) + ' duplicates');
data.memberships = unique;
fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
