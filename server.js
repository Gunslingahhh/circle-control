const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));

const squareSize = 300;
const userCircles = {};

function emitCircleInformation() {
  const existingCircles = Object.entries(userCircles).map(([id, userCircle]) => ({
    id,
    color: userCircle.color,
    left: userCircle.left,
    top: userCircle.top,
  }));
  io.emit('initializeExistingCircles', existingCircles);
}

io.on('connection', (socket) => {
  const userColor = getRandomColor();
  const left = (squareSize - 30) / 2;
  const top = (squareSize - 30) / 2;
  userCircles[socket.id] = { color: userColor, left, top };
  io.to(socket.id).emit('initializeCircle', { id: socket.id, color: userColor, left, top });
  emitCircleInformation();

  socket.on('controlCircle', ({ id, direction }) => {
    moveUserCircle(id, direction);
  });

  socket.on('disconnecting', () => {
    delete userCircles[socket.id];
    io.emit('userDisconnected', socket.id);
    emitCircleInformation();
  });
});

function moveUserCircle(id, direction) {
  const userCircle = userCircles[id];
  if (userCircle) {
    const step = 10;
    let newLeft = userCircle.left;
    let newTop = userCircle.top;

    switch (direction) {
      case 'up':
        newTop = Math.max(newTop - step, 0);
        break;
      case 'down':
        newTop = Math.min(newTop + step, squareSize - 30);
        break;
      case 'left':
        newLeft = Math.max(newLeft - step, 0);
        break;
      case 'right':
        newLeft = Math.min(newLeft + step, squareSize - 30);
        break;
      default:
        break;
    }

    newLeft = Math.min(Math.max(newLeft, 0), squareSize - 30);
    newTop = Math.min(Math.max(newTop, 0), squareSize - 30);

    userCircles[id].left = newLeft;
    userCircles[id].top = newTop;

    emitCircleInformation();
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
