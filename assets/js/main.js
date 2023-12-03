//GRAPH JS
let artistSongsMap = {};

document.addEventListener('DOMContentLoaded', function () {
  const svg = document.getElementById('graph'); 
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
    circle.setAttribute("r", isCentral ? 100 : 50);
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
    return { circle, text };
}

createNode(window.innerWidth / 2, window.innerHeight / 2, true);

svg.addEventListener('dblclick', function (event) {
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // avoid creating a node on the central node
    if (!event.target.classList.contains('node')) {
        const newNode = createNode(x, y, false);
        handleNodeDoubleClick(newNode);
    }
});


async function handleNodeDoubleClick({ circle, text }) {
  const svgRect = svg.getBoundingClientRect();
  const x = parseFloat(circle.getAttribute('cx')) + svgRect.left;
  const y = parseFloat(circle.getAttribute('cy')) + svgRect.top;

  const input = document.createElement('input');
  input.type = 'text';
  input.style.position = 'absolute';
  input.style.left = x + 'px';
  input.style.top = y + 'px';
  document.body.appendChild(input);
  input.focus();

  input.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
        text.textContent = input.value;
        const centralNode = document.getElementById('central-node'); 
        const distance = calculateDistance( // calculate distance from the central node
            parseFloat(circle.getAttribute('cx')),
            parseFloat(circle.getAttribute('cy')),
            parseFloat(centralNode.getAttribute('cx')),
            parseFloat(centralNode.getAttribute('cy'))
        );
        const songsCount = getSongsCount(distance); // determine the number of songs based on the distance
        await handleArtistData(input.value, songsCount); // fetch and display songs for the artist based on distance
        document.body.removeChild(input);
    }
  });
      input.onblur = function() {
      document.body.removeChild(input);
  };
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
    }
  }

  function endDrag() {
    if (selectedNode) {
      updateSongsForNode(selectedNode); // recalculate the distance and adjust the number of songs
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

});

function updateSongsForNode(node) {
  const artistName = node.nextSibling.textContent;
  const centralNode = document.getElementById('central-node');
  const distance = calculateDistance(
    parseFloat(node.getAttribute('cx')),
    parseFloat(node.getAttribute('cy')),
    parseFloat(centralNode.getAttribute('cx')),
    parseFloat(centralNode.getAttribute('cy'))
  );

  const songsCount = getSongsCount(distance); // calculate the number of songs to show based on the distance
  displaySongs(artistName, songsCount); // display the appropriate number of songs for the artist
}


//TEMP
document.addEventListener('keypress', function(event) {
  if (event.key === 'm' || event.key === 'M') {
      var sidebar = document.querySelector('.side-bar');
      if (sidebar.style.visibility === 'visible') {
          sidebar.style.visibility = 'hidden';
      } else {
          sidebar.style.visibility = 'visible';
      }
  }
});
//TEMP

function toggleMenu() {
  const menu = document.getElementById('menu')
  menu.classList.toggle('visible')
  }
  
  document.querySelector(".question-mark-space").addEventListener('click', function(event) {
  toggleMenu()
  })



//DISTANCE CALCULATION
function calculateDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}



const MAX_DISTANCE = 900; // min distance at which the min number of songs is shown
const MIN_DISTANCE = 5; // min distance at which the maxnumber of songs is shown
const MAX_SONGS = 15; // max number of songs to display
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

async function handleArtistData(artistName, distance) {
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
      if (artist) { // always fetch 10 songs
        const songs = await fetchArtistSongs(token, artist.id);
        artistSongsMap[artistName] = songs; // store the songs
        const songsCount = getSongsCount(distance);  // display songs based on distance
        displaySongs(artistName, songsCount);
        displayImage(token, artist.id); // display the artist image
      }
    } else {
      console.error('Error fetching artist data');
    }
  }
}

async function fetchArtistSongs(token, artistId) {
  const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=US`, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
  });

  if (topTracksResponse.ok) {
    const topTracksData = await topTracksResponse.json();
    return topTracksData.tracks.slice(0, 10);  // return up to 10 songs
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
  existingArtistSongs.forEach(node => node.remove());
  const songs = artistSongsMap[artistName]; // get list of songs for artist
  for (let i = 0; i < songsCount; i++) { // add songs up to the number defined by songsCount
    const song = songs[i]; // get the song at the current index
    if (song) {
      const songItem = document.createElement('p');
      songItem.dataset.artist = artistName;
      songItem.textContent = `${song.name} (by ${artistName})`;
      songListDiv.appendChild(songItem);
    }
  }
}



async function displayImage(token, artistId) {
  const imagesContainer = document.getElementById('imagesContainer');
  if (!imagesContainer.querySelector(`#artist-image-${artistId}`)) {  // check if the image is already displayed
      const imageResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });
      if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imgUrl = imageData.images[0]?.url;
          if (imgUrl) {
              const img = document.createElement("img");
              img.src = imgUrl;
              img.id = `artist-image-${artistId}`; // assign a unique ID based on the artistId
              img.style.maxWidth = '100px';
              img.style.maxHeight = '100px';
              imagesContainer.appendChild(img);
          }
        } else {
            console.error('Error fetching artist image');
      }
  }
}
