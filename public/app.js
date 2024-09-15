document.addEventListener('DOMContentLoaded', () => {
  const socket = io();
  const square = document.getElementById('square');
  const userCircles = {};
  const keyState = {};

  // Event handler for initializing the user's circle
  socket.on('initializeCircle', (data) => {
    createCircle(data);
  });

  // Event handler for initializing existing circles
  socket.on('initializeExistingCircles', (data) => {
    data.forEach((circleData) => {
      createCircle(circleData);
    });
  });

  // Event handler for user disconnection
  socket.on('userDisconnected', (userId) => {
    removeCircle(userId);
  });

  // Notify the server about the impending disconnection when the tab is closed
  window.addEventListener('beforeunload', () => {
    socket.emit('disconnecting');
  });

  // Event handlers for W, S, A, D keys
  document.addEventListener('keydown', (event) => {
    const direction = getDirectionByKey(event.key);
    if (direction) {
      keyState[event.key] = true;
      controlCircle(getCombinedDirection());
    }
  });

  document.addEventListener('keyup', (event) => {
    keyState[event.key] = false;
    controlCircle(getCombinedDirection());
  });

  // Function to map key to direction
  function getDirectionByKey(key) {
    switch (key) {
      case 'w':
        return 'up';
      case 's':
        return 'down';
      case 'a':
        return 'left';
      case 'd':
        return 'right';
      default:
        return null;
    }
  }

  const up = document.getElementById('up');
  const down = document.getElementById('down');
  const left = document.getElementById('left');
  const right = document.getElementById('right');

  // Function to get the combined direction based on pressed keys
  function getCombinedDirection() {
    let combinedDirection = '';
    if (keyState['w']) combinedDirection += 'up';
    if (keyState['s']) combinedDirection += 'down';
    if (keyState['a']) combinedDirection += 'left';
    if (keyState['d']) combinedDirection += 'right';

    return combinedDirection;
  }

  // Function to create or update the user's circle on the UI
  function createCircle(data) {
    let userCircle = userCircles[data.id];

    if (!userCircle) {
      userCircle = document.createElement('div');
      userCircle.id = data.id;
      userCircle.className = 'circle';
      square.appendChild(userCircle);
      userCircles[data.id] = userCircle;
    }

    userCircle.style.backgroundColor = data.color;
    userCircle.style.left = `${data.left}px`;
    userCircle.style.top = `${data.top}px`;
  }

  // Function to remove the user's circle from the UI
  function removeCircle(userId) {
    const userCircle = userCircles[userId];
    if (userCircle) {
      userCircle.remove();
      delete userCircles[userId];
    }
  }

  // Function to control the user's circle
  function controlCircle(combinedDirection) {
    socket.emit('controlCircle', { id: socket.id, direction: combinedDirection });
  }

  // Function to move the user's circle to a new position immediately
  function moveUserCircle(id, direction) {
    const userCircle = userCircles[id];

    if (userCircle) {
      const step = 10;
      let newLeft = parseInt(userCircle.style.left, 10) || 0;
      let newTop = parseInt(userCircle.style.top, 10) || 0;

      switch (direction) {
        case 'up':
          newTop = Math.max(newTop - step, 0);
          break;
        case 'down':
          newTop = Math.min(newTop + step, square.offsetHeight - 30);
          break;
        case 'left':
          newLeft = Math.max(newLeft - step, 0);
          break;
        case 'right':
          newLeft = Math.min(newLeft + step, square.offsetWidth - 30);
          break;
        case 'upleft':
          newTop = Math.max(newTop - step, 0);
          newLeft = Math.max(newLeft - step, 0);
          break;
        case 'upright':
          newTop = Math.max(newTop - step, 0);
          newLeft = Math.min(newLeft + step, square.offsetWidth - 30);
          break;
        case 'downleft':
          newTop = Math.min(newTop + step, square.offsetHeight - 30);
          newLeft = Math.max(newLeft - step, 0);
          break;
        case 'downright':
          newTop = Math.min(newTop + step, square.offsetHeight - 30);
          newLeft = Math.min(newLeft + step, square.offsetWidth - 30);
          break;
        default:
          break;
      }

      userCircle.style.left = `${newLeft}px`;
      userCircle.style.top = `${newTop}px`;
    }
  }

  // Socket event listener for moving the circle
  socket.on('moveCircle', (data) => {
    moveUserCircle(data.id, data.direction);
  });
});
