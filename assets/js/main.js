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


  function handleNodeDoubleClick({ circle, text }) {
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

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
          text.textContent = input.value;
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
      const lineId = selectedNode.getAttribute('data-line');
      if (lineId) {
        const line = document.getElementById(lineId);
        line.setAttribute('x1', dx);
        line.setAttribute('y1', dy);
      }

      // update text position
      const textElement = selectedNode.nextElementSibling;
      if (textElement && textElement.tagName === 'text') {
        textElement.setAttribute('x', dx);
        textElement.setAttribute('y', dy);
      }
    }
  }

  function endDrag() { 
    selectedNode = null;
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






// spotify js




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
    document.getElementById('artistInput').value = ''; // clear input
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
    songs.forEach((song) => {
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
