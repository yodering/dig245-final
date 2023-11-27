const string1 = 'faf27542287147d1adc2cfd7f72763ef';
const string2 = 'ed2ae0fa7d99436d9c5cd5d11243f00c';

document.getElementById('getSongs').addEventListener('click', handleArtistData);

async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(string1 + ':' + string2),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    if (response.ok) {
        const data = await response.json();
        return data.access_token;
    } else {
        console.error('Error fetching access token');
        return null;
    }
}

async function handleArtistData() {
    const artistName = document.getElementById('artistInput').value;
    const token = await getAccessToken();
    if (token && artistName) {
        const artistResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (artistResponse.ok) {
            const artistData = await artistResponse.json();
            const artist = artistData.artists.items[0];
            getRandomSongs(token, artist.id);
            displayArtistImage(token, artist.id);
        } else {
            console.error('Error fetching artist data');
        }
    }
    document.getElementById('artistInput').value = ''; // Clear the input field after adding an artist
}

async function getRandomSongs(token, artistId) {
    const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=US`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (topTracksResponse.ok) {
        const topTracksData = await topTracksResponse.json();
        const randomSongs = getRandomElements(topTracksData.tracks, 10);
        displayRandomSongs(randomSongs);
    } else {
        console.error('Error fetching top tracks');
    }
}

function getRandomElements(array, numElements) {
    const shuffledArray = array.sort(() => Math.random() - 0.5);
    return shuffledArray.slice(0, numElements);
}

function displayRandomSongs(songs) {
    const songListDiv = document.getElementById('songList');
    songs.forEach((song, index) => {
        const songItem = document.createElement('p');
        songItem.textContent = `${song.name} (by ${song.artists[0].name})`;
        songListDiv.appendChild(songItem);
    });
}

async function displayArtistImage(token, artistId) {
    const imageResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imgUrl = imageData.images[0].url;
        const img = document.createElement("img");
        img.src = imgUrl;
        img.style.maxWidth = '100px';
        img.style.maxHeight = '100px';
        const imagesContainer = document.getElementById('imagesContainer');
        imagesContainer.appendChild(img);
    } else {
        console.error('Error fetching artist image');
    }
}
