#!/bin/bash
echo "Testing Spotify Integration..."
curl -v http://localhost:3000/api/auth/spotify/login
