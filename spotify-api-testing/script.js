const string1 = 'faf27542287147d1adc2cfd7f72763ef'; // api client id
const string2 = 'ed2ae0fa7d99436d9c5cd5d11243f00c'; // api client secret

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
    const artist = document.getElementById('artistInput').value;
    const token = await getAccessToken();

    if (token) {
        const artistResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artist)}&type=artist`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (artistResponse.ok) {
            const artistData = await artistResponse.json();
            const artistId = artistData.artists.items[0].id;

            getRandomSongs(token, artistId);
            displayArtistImage(token, artistId);
        } else {
            return null;
        }
    }
}

async function getRandomSongs(token, artistId) {
    const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=US`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (topTracksResponse.ok) {
        const topTracksData = await topTracksResponse.json();
        const randomSongs = getRandomElements(topTracksData.tracks, 5);
        displayRandomSongs(randomSongs);
    } else {
        return null;
    }
}

function getRandomElements(array, numElements) {
    const shuffledArray = array.sort(() => Math.random() - 0.5);
    return shuffledArray.slice(0, numElements);
}

function displayRandomSongs(songs) {
    const songListDiv = document.getElementById('songList');
    songListDiv.innerHTML = '';

    songs.forEach((song, index) => {
        const songItem = document.createElement('p');
        songItem.textContent = `${index + 1}. ${song.name}`;
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
        img.style.maxWidth = '300px';
        img.style.maxHeight = '300px';

        const imageDiv = document.getElementById('image');
        imageDiv.innerHTML = ''; // clear previous images
        imageDiv.appendChild(img);
    } else {
        return null;
    }
}
