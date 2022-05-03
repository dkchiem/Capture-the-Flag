const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const path = require('path');

const team = {
  RED: '#E74E4E',
  BLUE: '#4E6FE7',
};

// let parties = [
//   { id: 123456, players: ['123456', '123456'] },
//   { id: 123457, players: ['123456', '123456'] },
// ];
let players = {};
let bullets = [];
let mapData;
let tileSize;
let points = { red: 0, blue: 0 };
let nextTeam = team.RED;

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('pages/home');
});

app.get('/game', (req, res) => {
  res.render('pages/index');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  console.log('New client has connected with id:', socket.id);

  if (nextTeam === team.RED) {
    nextTeam = team.BLUE;
  } else {
    nextTeam = team.RED;
  }
  socket.emit('teamColor', nextTeam);

  socket.on('newMap', (map) => {
    mapData = map.data;
    tileSize = map.tileSize;
  });

  socket.on('newPlayer', (playerData) => {
    // io.emit('createMap', { id: 1, data: map1Data });
    players[socket.id] = playerData;
    io.emit('updatePlayers', players);
  });

  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} has disconnected`);
    delete players[socket.id];
    io.emit('updatePlayers', players);
  });

  socket.on('movePlayer', (positionData) => {
    if (players[socket.id] == undefined) return;
    players[socket.id].x = positionData.x;
    players[socket.id].y = positionData.y;
    players[socket.id].facingAngle = positionData.facingAngle;
    socket.broadcast.emit('updatePlayers', players);
  });

  socket.on('shootBullet', (bulletData) => {
    if (players[socket.id] == undefined) return;
    const newBullet = bulletData;
    bulletData.playerId = socket.id;
    bullets.push(newBullet);
  });

  socket.on('pickupFlag', (flagData) => {
    if (players[socket.id] == undefined) return;
    players[socket.id].flag = flagData.item;
    io.emit('updateFlag', { ...flagData, points });
    socket.broadcast.emit('updatePlayers', players);
    socket.broadcast.emit('pickupFlag', flagData);
  });

  socket.on('dropFlag', (flagData) => {
    if (players[socket.id] == undefined) return;
    players[socket.id].flag = null;
    console.log(players[socket.id]);
    if (players[socket.id].teamColor === team.RED) {
      points.red += 1;
      if (points.red >= 2) {
        io.emit('gameOver', 'Red');
        reset();
      }
    } else if (players[socket.id].teamColor === team.BLUE) {
      points.blue += 1;
      if (points.blue >= 2) {
        io.emit('gameOver', 'Blue');
        reset();
      }
    }
    io.emit('updateFlag', { ...flagData, points });
    socket.broadcast.emit('updatePlayers', players);
    socket.broadcast.emit('dropFlag', flagData);
  });

  // socket.on('createRoom', (room) => {
  //   const roomID = Math.floor(100000 + Math.random() * 900000).toString();
  //   socket.join(room);
  //   console.log(socket);
  //   parties.push({ id: roomID, players: [socket.id] });
  // });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

setInterval(() => {
  for (const id in players) {
    if (players[id]) {
      if (players[id].hp < 100) {
        players[id].hp += 1;
        io.emit('updatePlayers', players);
      }
    }
  }
}, 1000);

// Check bullets
function CheckBullets() {
  bullets.forEach((bullet, i) => {
    bullet.x += bullet.speedX;
    bullet.y += bullet.speedY;

    for (const id in players) {
      if (bullet.playerId != id) {
        var dx = players[id].x - bullet.x;
        var dy = players[id].y - bullet.y;
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < players[id].radius) {
          io.emit('playerHit', id);
          players[id].hp -= bullet.damage;
          io.emit('updatePlayers', players);
          if (players[id].hp <= 0) {
            io.emit('playerDead', id);
            players[id].hp = 100;
            io.emit('updatePlayers', players);
          }
          bullets.splice(i, 1);
        }
      }
    }

    mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block === 1) {
          const blockX = x * tileSize;
          const blockY = y * tileSize;
          if (
            bullet.x + bullet.radius >= blockX &&
            bullet.x - bullet.radius <= blockX + tileSize &&
            bullet.y + bullet.radius >= blockY &&
            bullet.y - bullet.radius <= blockY + tileSize
          ) {
            bullets.splice(i, 1);
          }
        }
      });
    });
  });

  io.emit('bulletsUpdate', bullets);
}

function reset() {
  points = { red: 0, blue: 0 };
  bullets = [];
  nextTeam = team.RED;
}

setInterval(CheckBullets, 16);
