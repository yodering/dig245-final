//GRAPH JS
let artistSongsMap = {};
let svg;
let selectedNode = null;
let offset = {x: 0, y: 0};
let nodeIdCounter = 0;



document.addEventListener('DOMContentLoaded', function () {

  const setPlaylistNameButton = document.getElementById('setPlaylistName');
  const playlistNameInput = document.getElementById('playlistNameInput');
  const playlistHeader = document.querySelector('#playlistContainer h3'); // select the playlist header

  setPlaylistNameButton.addEventListener('click', function() {
      const playlistName = playlistNameInput.value;
      if (playlistName) {
          playlistHeader.textContent = playlistName; // update the playlist header user entered name
      }
  });


  svg = document.getElementById('graph');

  let lineIdCounter = 0; 


  function createLine(x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.classList.add("line");
    line.setAttribute('id', 'line-' + lineIdCounter);
    lineIdCounter++;
    svg.insertBefore(line, svg.firstChild);
    return line;
  }

  function createNode(x, y, isCentral) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", isCentral ? 70 : 50);
    circle.classList.add("node");
    if (isCentral) {
      circle.setAttribute('id', 'central-node');
  }
    svg.appendChild(circle);

    if (!isCentral) {
        const line = createLine(x, y, window.innerWidth / 2, window.innerHeight / 2);
        circle.setAttribute('data-line', line.id);
    }

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("dy", "0.35em"); 
    text.classList.add("node-text");
    svg.appendChild(text);


    circle.addEventListener('contextmenu', function(event) {
      showContextMenu(event.pageX, event.pageY, circle, event);
    });
    

    circle.setAttribute('data-node-id', 'node-' + nodeIdCounter);  // assign node ID
    nodeIdCounter++;

    

    
    return { circle, text };
}

createNode(window.innerWidth / 2, window.innerHeight / 2, true); // central node

svg.addEventListener('dblclick', function (event) {
  const rect = svg.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (!event.target.classList.contains('node')) { // avoid creating a node on the central node
      if (nodeIdCounter < 20) {  // check if the limit has been reached
          const newNode = createNode(x, y, false);
          nodeDoubleClick(newNode);
      } else {
          // display a message to the user that the node limit has been reached
          alert("Maximum of 20 nodes reached.");
      }
  }
});


async function nodeDoubleClick({ circle, text }) {
  const svgRect = svg.getBoundingClientRect();
  const x = parseFloat(circle.getAttribute('cx')) + svgRect.left;
  const y = parseFloat(circle.getAttribute('cy')) + svgRect.top;

  const input = document.createElement('input');
  input.type = 'text';
  input.style.position = 'absolute';
  input.style.left = `${x}px`;
  input.style.top = `${y}px`;
  document.body.appendChild(input);
  input.focus();

  input.setAttribute('data-for-node', circle.getAttribute('data-node-id')); // Link input box to node

  input.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
      text.textContent = input.value;
      document.body.removeChild(input);  // remove the input box
  
      const centralNode = document.getElementById('central-node');   // get the central node and calculate the distance
      const distance = calculateDistance(
        parseFloat(circle.getAttribute('cx')),
        parseFloat(circle.getAttribute('cy')),
        parseFloat(centralNode.getAttribute('cx')),
        parseFloat(centralNode.getAttribute('cy'))
      );
      const songsCount = getSongsCount(distance); // get the songs count based on the distance
      console.log(`Distance: ${distance}, Songs Count: ${songsCount}`); // Debugging line
  
      // Fetch the artist data and songs
      const artistId = await handleArtistData(input.value, songsCount, circle);
      if (artistId) {
        circle.setAttribute('data-artist-id', artistId);
      }
    }
  });
}





  function startDrag(event) {
    if (event.target.classList.contains('node') && event.target.id !== 'central-node') {
      selectedNode = event.target;
      offset = getMousePosition(event);
      offset.x -= parseFloat(selectedNode.getAttribute('cx'));
      offset.y -= parseFloat(selectedNode.getAttribute('cy'));
      svg.addEventListener('mousemove', drag);
    }
  }

  function drag(event) {
    if (selectedNode) {
      const coord = getMousePosition(event);
      const dx = coord.x - offset.x;
      const dy = coord.y - offset.y;
      selectedNode.setAttribute('cx', dx);
      selectedNode.setAttribute('cy', dy);

      const lineId = selectedNode.getAttribute('data-line'); // update the line connecting to the central node
      if (lineId) {
        const line = document.getElementById(lineId);
        line.setAttribute('x1', dx);
        line.setAttribute('y1', dy);
      }

      const textElement = selectedNode.nextElementSibling; // update the text position
      if (textElement && textElement.tagName === 'text') {
        textElement.setAttribute('x', dx);
        textElement.setAttribute('y', dy);
      }
      updateHoverColor(selectedNode);
    }
  }

  function endDrag() {
    if (selectedNode) {
      // recalculate the distance and adjust the number of songs
      updateSongs(selectedNode);
      selectedNode = null;
    }
    svg.removeEventListener('mousemove', drag);
  }
  

  function getMousePosition(event) {
    const coords = svg.getScreenCTM();
    return {
      x: (event.clientX - coords.e) / coords.a,
      y: (event.clientY - coords.f) / coords.d
    };
  }

  // event listeners for drag 
  svg.addEventListener('mousedown', startDrag);
  svg.addEventListener('mouseup', endDrag);
  svg.addEventListener('mouseleave', endDrag);


const menu = document.getElementById('contextMenu'); // context menu event listeners
menu.addEventListener('click', function(event) {
  event.stopPropagation(); // prevents the click inside the menu from propagating
});

document.addEventListener('click', function(event) {
  if (event.target !== menu) {
    menu.style.display = 'none'; // hides the menu when clicking outside
  }
});

});

function updateSongs(node) {
  const artistName = node.nextSibling.textContent;
  if (artistName && artistSongsMap[artistName]) {
    const centralNode = document.getElementById('central-node');
    const distance = calculateDistance(
      parseFloat(node.getAttribute('cx')),
      parseFloat(node.getAttribute('cy')),
      parseFloat(centralNode.getAttribute('cx')),
      parseFloat(centralNode.getAttribute('cy'))
    );
    const songsCount = getSongsCount(distance);
    displaySongs(artistName, songsCount); // update display with new songsCount
  }
}







document.getElementById('shuffleButton').addEventListener('click', shuffleSongs);





document.querySelector(".playlist-space").addEventListener('click', function(event) {
  const sidebar = document.getElementById('side-bar');
  sidebar.classList.toggle('slide-in');
});


  function toggleHelpMenu() {
    const menu = document.getElementById('help-menu')
    menu.classList.toggle('visible')
    }
    document.querySelector(".question-mark-space").addEventListener('click', toggleHelpMenu)



  function toggleAccountMenu() {
    const menu = document.getElementById('user-menu')
    menu.classList.toggle('visible')
    }
    document.querySelector(".user-space").addEventListener('click', toggleAccountMenu)

    function toggleArtistMenu() {
      const menu = document.getElementById('artist-menu')
      menu.classList.toggle('visible')
      }
      document.querySelector(".artist-img-space").addEventListener('click', toggleArtistMenu)


// FONT ADJUSTMENT



//DISTANCE CALCULATION
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}



const MAX_DISTANCE = 900; // min distance at which the min number of songs is shown
const MIN_DISTANCE = 200; // min distance at which the maxnumber of songs is shown
const MAX_SONGS = 10; // max number of songs to display
const MIN_SONGS = 1; // min number of songs to display

function getSongsCount(distance) {

  const normalizedDistance = Math.min(distance, MAX_DISTANCE);

  const range = MAX_DISTANCE - MIN_DISTANCE;
  const interpolation = (MAX_SONGS - MIN_SONGS) * ((range - normalizedDistance) / range);
  const songsCount = Math.round(interpolation) + MIN_SONGS;

  return Math.min(Math.max(songsCount, MIN_SONGS), MAX_SONGS); // ensure the songs count is within the bounds
}


const string1 = 'ed2ae0fa7d99436d9c5cd5d11243f00c';
const string2 = 'faf27542287147d1adc2cfd7f72763ef';
const redirectUri = encodeURI('https://yodering.github.io/dig245-final/'); // redirect URI TEMP
let userAccessToken;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginButton').addEventListener('click', spotifyLogin);
    handleAuthRedirect();
});

async function handleAuthRedirect() {
  const queryString = window.location.search;
  console.log("Query string received:", queryString);

  const urlParams = new URLSearchParams(queryString);
  const code = urlParams.get('code');
  console.log("Authorization code:", code);

  if (code) {
      userAccessToken = await exchangeCodeForToken(code);
      console.log("User access token:", userAccessToken);
  }
}


async function exchangeCodeForToken(code) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(string2 + ':' + string1)
        },
        body: new URLSearchParams({
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });
    const data = await response.json();
    return data.access_token;
}

function spotifyLogin() {
  const scope = 'playlist-modify-public playlist-modify-private';
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${string2}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

  // open Spotify login in a new window
  window.open(authUrl, '_blank', 'width=800,height=600');

  console.log("Opening Spotify login in new window with URL:", authUrl);
}




async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(string2 + ':' + string1),
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

async function handleArtistData(artistName, songsCount, circle) {
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
            if (artist) {
                circle.setAttribute('data-artist-id', artist.id);
                if (!artistSongsMap[artistName]) {
                    artistSongsMap[artistName] = await fetchSongs(token, artist.id);
                }
                displaySongs(artistName, songsCount);
                displayImage(token, artist.id);
                return artist.id;
            }
        }
    }
}

async function fetchSongs(token, artistId) {
    const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=US`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (topTracksResponse.ok) {
        const topTracksData = await topTracksResponse.json();
        return topTracksData.tracks;
    } else {
        return [];
    }
}

async function displaySongs(artistName, songsCount) {
  const songListDiv = document.getElementById('songList');
  const existingArtistSongs = songListDiv.querySelectorAll(`[data-artist='${artistName}']`);
  existingArtistSongs.forEach(node => node.remove());

  const songs = artistSongsMap[artistName] || [];
  const limitedSongs = songs.slice(0, songsCount);

  for (const song of limitedSongs) {
      const songItem = document.createElement('div');
      songItem.classList.add('song-item');
      songItem.dataset.artist = artistName;

      
      const albumArtUrl = await fetchAlbumArt(song.album.id); // fetch album art

     
      if (albumArtUrl) {  // create an image element for album art
          const albumArtImg = document.createElement('img');
          albumArtImg.src = albumArtUrl;
          albumArtImg.alt = 'Album Art';
          albumArtImg.classList.add('album-art');
          songItem.appendChild(albumArtImg);
      }

      // add song name
      const songName = document.createElement('p');
      songName.textContent = `${song.name} (by ${artistName})`;
      songItem.appendChild(songName);

      songListDiv.appendChild(songItem);
  }
}


async function fetchAlbumArt(albumId) {
  const token = await getAccessToken();
  if (token) {
      const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });
      if (response.ok) {
          const albumData = await response.json();
          return albumData.images[0]?.url;
      }
  }
  return null;
}



async function displayImage(token, artistId, artistName) {
  const imagesContainer = document.getElementById('imagesContainer'); // get the container where images will be displayed
  let artistImage = imagesContainer.querySelector(`#artist-image-${artistId}`);
  if (!artistImage) { // fetch artist image data from Spotify API
    const imageResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      const imgUrl = imageData.images[0]?.url; // get the URL of the artist's image
      if (imgUrl) {       // create a new image element and set its properties
        artistImage = document.createElement("img");
        artistImage.src = imgUrl;
        artistImage.id = `artist-image-${artistId}`; // assign a unique ID based on the artistId
        artistImage.setAttribute('data-artist-name', artistName); // set the artist's name as a data attribute for easy lookup
        artistImage.style.maxWidth = '100px';
        artistImage.style.maxHeight = '100px';
        imagesContainer.appendChild(artistImage); // append the image to the container
      }
    }
  }
}



//COLOR

function getColor(distance) {
  const maxDistance = 800; // graph scale
  const normalizedDistance = Math.min(distance, maxDistance) / maxDistance; // normalize between 0 and 1

  const red = Math.floor(255 * normalizedDistance); // create gradient from green to red for hover effect
  const green = Math.floor(255 * (1 - normalizedDistance));
  return `rgb(${red}, ${green}, 0)`; // green to yellow to red 
}


function updateHoverColor(node) {
  const centralNode = document.getElementById('central-node');
  const distance = calculateDistance(
    parseFloat(node.getAttribute('cx')),
    parseFloat(node.getAttribute('cy')),
    parseFloat(centralNode.getAttribute('cx')),
    parseFloat(centralNode.getAttribute('cy'))
  );
  const hoverColor = getColor(distance);
  node.style.setProperty('--hover-color', hoverColor); // css variable
}




//DELETE NODE

function deleteNode(node, svg) {
  if(node.id === 'central-node') {
    console.error('Central node cannot be deleted.');
    return; // Prevent deletion of the central node
  }
  const textElement = node.nextElementSibling; // retrieve the text element and artist name
  const artistName = textElement.textContent;
  const artistId = node.getAttribute('data-artist-id');

  if (artistSongsMap[artistName]) { // remove the artist's songs from the playlist
    delete artistSongsMap[artistName];
  }
  updatePlaylist();

  const imagesContainer = document.getElementById('imagesContainer'); // retrieve the container where images are displayed
  const artistImage = imagesContainer.querySelector(`#artist-image-${artistId}`);

  if (artistImage) {
    imagesContainer.removeChild(artistImage); // remove the artist's image from the container
  }

  const lineId = node.getAttribute('data-line');   // remove the line connected to the node
  if (lineId) {
    const line = svg.querySelector(`#${lineId}`);
    if (line) {
      svg.removeChild(line);
    }
  }

  if (textElement && textElement.tagName === 'text') {   // remove the text element for the node
    svg.removeChild(textElement);
  }
  svg.removeChild(node); // remove node

  const nodeId = node.getAttribute('data-node-id');
  const inputBox = document.querySelector(`input[data-for-node='${nodeId}']`);
  if (inputBox) {
      document.body.removeChild(inputBox);  // remove the linked input box
  }

}


function updatePlaylist() {
  const songListDiv = document.getElementById('songList');
  songListDiv.innerHTML = ''; // clear the existing songs

  const nodes = document.querySelectorAll('.node:not(#central-node)');
  nodes.forEach(node => {
    const artistName = node.nextSibling.textContent;
    const distance = calculateDistance(
      parseFloat(node.getAttribute('cx')),
      parseFloat(node.getAttribute('cy')),
      parseFloat(document.getElementById('central-node').getAttribute('cx')),
      parseFloat(document.getElementById('central-node').getAttribute('cy'))
    );

    const songsCount = getSongsCount(distance);
    displaySongs(artistName, songsCount);
  });
}


function showContextMenu(x, y, node, event) {
  event.preventDefault();
  const menu = document.getElementById('contextMenu');
  menu.style.display = 'block';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  const deleteNodeButton = document.getElementById('deleteNode');
  deleteNodeButton.onclick = () => {
    deleteNode(node, document.getElementById('graph'));
    menu.style.display = 'none'; // hide the context menu
  };
}



// hide menu when clicking elsewhere
document.addEventListener('click', function(event) {
  const menu = document.getElementById('contextMenu');
  if (event.target !== menu) {
    menu.style.display = 'none';
  }
});


// SHUFFLE SONGS


// randomize array elements
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // swap elements
  }
  return array;
}

// shuffle songs
function shuffleSongs() {
  for (const artistName in artistSongsMap) {
    if (artistSongsMap.hasOwnProperty(artistName)) {
      artistSongsMap[artistName] = shuffleArray(artistSongsMap[artistName]);
    }
  }
  updatePlaylist(); // refresh the playlist with songs
}