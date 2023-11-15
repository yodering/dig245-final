document.addEventListener('DOMContentLoaded', function () {
    const svg = document.getElementById('graph');
    let selectedNode = null;
    let offset = null;
    let lineIdCounter = 0; // counter for lines
  
    function createLine(x1, y1, x2, y2) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.classList.add("line");
      line.setAttribute('id', 'line-' + lineIdCounter); // assign a unique id to the line
      lineIdCounter++;
      svg.insertBefore(line, svg.firstChild); // ensure the line is under the nodes
      return line;
    }
  
    function createNode(x, y, isCentral) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", x);
      circle.setAttribute("cy", y);
      circle.setAttribute("r", isCentral ? 100 : 50);
      circle.classList.add("node");
      if (!isCentral) {
        const line = createLine(x, y, window.innerWidth / 2, window.innerHeight / 2);
        circle.setAttribute('data-line', line.id);
      } else {
        circle.setAttribute('id', 'central-node');
      }
      svg.appendChild(circle);
      return circle;
    }
  
    // add a central node
    const centralNode = createNode(window.innerWidth / 2, window.innerHeight / 2, true);
  
    svg.addEventListener('dblclick', function (event) {
      const rect = svg.getBoundingClientRect();
      createNode(event.clientX - rect.left, event.clientY - rect.top, false);
    });
  
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
          const lineId = selectedNode.getAttribute('data-line'); // retrieve and update the corresponding line
          if (lineId) {
            const line = document.getElementById(lineId);
            line.setAttribute('x1', dx);
            line.setAttribute('y1', dy);
          }
        }
      }
    
  
    function endDrag(event) {
      selectedNode = null;
      svg.removeEventListener('mousemove', drag);
    }
  
    function getMousePosition(event) {
      const CTM = svg.getScreenCTM();
      return {
        x: (event.clientX - CTM.e) / CTM.a,
        y: (event.clientY - CTM.f) / CTM.d
      };
    }
  
    // event listeners for drag 
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);
  
    // central node is on top 
    svg.appendChild(centralNode);
  });
  