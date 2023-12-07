//GRAPH JS
let artistSongsMap = {};
let svg;
let selectedNode = null;
let offset = {x: 0, y: 0};

document.addEventListener('DOMContentLoaded', function () {
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
    
    
    return { circle, text };
}

createNode(window.innerWidth / 2, window.innerHeight / 2, true); // central node

svg.addEventListener('dblclick', function (event) {
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!event.target.classList.contains('node')) { // avoid creating a node on the central node
        const newNode = createNode(x, y, false);
        nodeDoubleClick(newNode);
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





document.querySelector(".playlist-space").addEventListener('click', function(event) {
   const sidebar = document.getElementById('side-bar')
    sidebar.classList.toggle('visible')
  })


function toggleHelpMenu() {
  const menu = document.getElementById('help-menu')
  menu.classList.toggle('visible')
  }
  document.querySelector(".question-mark-space").addEventListener('click', function(event) {
  toggleHelpMenu()
  })



//DISTANCE CALCULATION
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}



const MAX_DISTANCE = 800; // min distance at which the min number of songs is shown
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





// SPOTIFY JS

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
        displayImage(token, artist.id); // display the artist image
        return artist.id; // return the artist's Spotify ID
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
    return topTracksData.tracks; // return all top tracks
  } else {
    console.error('Error fetching top tracks');
    return [];
  }
}





function getRandomElements(array, numElements) {
  const shuffledArray = array.sort(() => Math.random() - 0.5);
  return shuffledArray.slice(0, numElements);
}



function displaySongs(artistName, songsCount) {
  const songListDiv = document.getElementById('songList');
  const existingArtistSongs = songListDiv.querySelectorAll(`[data-artist='${artistName}']`);
  existingArtistSongs.forEach(node => node.remove()); // clear existing songs for the artist

  const songs = artistSongsMap[artistName] || [];
  const limitedSongs = songs.slice(0, songsCount); // limit the songs to the number allowed by distance

  limitedSongs.forEach(song => {
    const songItem = document.createElement('p');
    songItem.dataset.artist = artistName;
    songItem.textContent = `${song.name} (by ${artistName})`;
    songListDiv.appendChild(songItem); // append each song to the playlist
  });
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