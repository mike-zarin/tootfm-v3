const fs = require('fs');
const fetch = require('node-fetch');

async function test() {
  const data = JSON.parse(fs.readFileSync('./apps/web/data.json', 'utf8'));
  const token = data.users[0].spotifyProfile.accessToken;
  
  const response = await fetch('https://api.spotify.com/v1/audio-features/0VjIjW4GlUZAMYd2vXMi3b', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status:', response.status);
  console.log('Response:', await response.json());
}

test().catch(console.error);
