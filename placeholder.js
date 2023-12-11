async function savePlaylistToSpotify() {
  // Check for user access token
  if (!userAccessToken) {
    alert('Please log in to Spotify first.');
    return;
  }

  // Get the user's Spotify ID
  const userId = await fetchSpotifyUserId();

  // Get the playlist name from the input field
  const playlistName = document.getElementById('playlistNameInput').value || 'My New Playlist';

  // Create a new playlist
  const playlistId = await createSpotifyPlaylist(userId, playlistName);

  // Collect track URIs from your application's data
  const trackUris = Object.values(artistSongsMap).flat().map(song => song.uri);

  // Add tracks to the new playlist
  await addTracksToPlaylist(playlistId, trackUris);

  alert(`Playlist '${playlistName}' saved to your Spotify account!`);
}

async function createSpotifyPlaylist(userId, playlistName) {
  const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: playlistName,
      description: 'Created from my app',
      public: false
    })
  });
  const data = await response.json();
  return data.id;
}

async function addTracksToPlaylist(playlistId, trackUris) {
  await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uris: trackUris
    })
  });
}

// Add this function to a button or another event in your existing code
document.getElementById('savePlaylistButton').addEventListener('click', savePlaylistToSpotify);
