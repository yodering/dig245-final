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