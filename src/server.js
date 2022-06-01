import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { maps } from './maps.js';
import { tileSize, team } from './public/js/constants.js';
import { nextTeamGenerator } from './utility.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __dirname = dirname(fileURLToPath(import.meta.url));

const winningPoints = 3;
let players = {};
let nextBulletID = 0;
let bullets = {};
let hiddenItems = {};
const mapData = maps[0];
let points = { red: 0, blue: 0 };
let rooms = [];

const playerTeam = nextTeamGenerator(team);

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
  res.render('pages/home');
});
app.get('/game', (req, res) => {
  res.render('pages/index');
});
app.get('/gameover', (req, res) => {
  res.render('pages/gameover', { query: req.query });
});
app.use(express.static(__dirname + '/public'));

// Socket.io
io.on('connection', (socket) => {
  console.log('New client has connected with id:', socket.id);

  const newPlayerTeam = playerTeam.next().value;

  // Initialize player game
  socket.emit('newGameData', {
    team: newPlayerTeam,
    map: mapData,
    points,
    hiddenItems,
  });

  // Add new player
  socket.on('newPlayer', (PlayerData) => {
    players[socket.id] = {
      ...PlayerData,
      hp: 100,
      dead: false,
      team: newPlayerTeam,
      flagIndex: null,
    };
    io.emit('updatePlayers', players);
  });

  // Disconnect player
  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} has disconnected`);
    for (const index in hiddenItems) {
      if (hiddenItems[index] === socket.id) {
        delete hiddenItems[index];
      }
    }
    io.emit('updateHiddenItems', hiddenItems);
    delete players[socket.id];
    io.emit('updatePlayers', players);
  });

  // Create a new room
  // socket.on('createRoom', (callback) => {
  //   const roomID = Math.floor(100000 + Math.random() * 900000).toString();
  //   socket.join(roomID);
  //   rooms.push(roomID);
  //   callback(roomID);
  // });

  // Move player
  socket.on('movePlayer', (positionData) => {
    const player = players[socket.id];
    if (player == undefined) return;
    player.x = positionData.x;
    player.y = positionData.y;
    player.facingAngle = positionData.facingAngle;
    player.movingX = positionData.movingX;
    player.movingY = positionData.movingY;
    player.movingAngle = positionData.movingAngle;
    player.speed = positionData.speed;
  });

  // Shoot bullet
  socket.on('shootBullet', () => {
    if (players[socket.id] == undefined) return;
    if (players[socket.id].dead === true) return;
    const player = players[socket.id];
    bullets[nextBulletID] = {
      playerId: socket.id,
      x: player.x + (player.gunWidth - 10) * Math.cos(player.facingAngle),
      y: player.y + (player.gunWidth - 10) * Math.sin(player.facingAngle),
      radius: 10,
      movingAngle: player.facingAngle,
      speed: 15,
      color: player.team,
      damage: 10,
    };
    nextBulletID++;
    io.emit('updateBullets', bullets);
  });

  socket.on('pickupFlag', (flagIndex) => {
    if (players[socket.id] == undefined) return;
    if (players[socket.id].dead === true) return;
    hiddenItems[flagIndex] = socket.id;
    io.emit('updateHiddenItems', hiddenItems);
    players[socket.id].flagIndex = flagIndex;
    socket.broadcast.emit('updatePlayers', players);
  });

  socket.on('dropFlag', (flagIndex) => {
    if (players[socket.id] == undefined) return;
    if (players[socket.id].dead === true) return;
    players[socket.id].flagIndex = null;
    delete hiddenItems[flagIndex];

    // Check if a team has won
    if (players[socket.id].team === team.RED) {
      points.red++;
      if (points.red >= winningPoints) {
        io.emit('gameOver', 'red');
        reset();
      }
    } else if (players[socket.id].team === team.BLUE) {
      points.blue++;
      if (points.blue >= winningPoints) {
        io.emit('gameOver', 'blue');
        reset();
      }
    }

    io.emit('updateHiddenItems', hiddenItems);
    socket.broadcast.emit('updatePlayers', players);
    io.emit('updatePoints', points);
  });

  // Listen for update points events
  socket.on('grabBoost', (boostIndex) => {
    if (players[socket.id].dead === true) return;
    hiddenItems[boostIndex] = 'speed-boost';
    io.emit('updateHiddenItems', hiddenItems);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

setInterval(() => {
  for (const id in players) {
    if (players[id]) {
      if (players[id].hp < 100 && players[id].dead === false) {
        players[id].hp++;
        io.emit('updatePlayers', players);
      }
    }
  }
}, 1000);

// Reset game
function reset() {
  points = { red: 0, blue: 0 };
  players = {};
  bullets = {};
  hiddenItems = {};
  nextBulletID = 0;
}

// Update bullets
function UpdateBullets() {
  for (const id in bullets) {
    const bullet = bullets[id];
    const newBulletX = bullet.x + bullet.speed * Math.cos(bullet.movingAngle);
    const newBulletY = bullet.y + bullet.speed * Math.sin(bullet.movingAngle);

    for (const playerId in players) {
      const player = players[playerId];
      if (bullet.playerId != playerId && player.dead === false) {
        const dx = player.x - bullet.x;
        const dy = player.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius) {
          io.emit('playerHit', playerId);
          player.hp -= bullet.damage;
          if (player.hp <= 0) {
            io.emit('playerDead', playerId);
            player.dead = true;
            setTimeout(() => {
              player.hp = 100;
              player.dead = false;
              io.emit('respawnPlayer', playerId);
              io.emit('updatePlayers', players);
            }, 3000);
          }
          io.emit('updatePlayers', players);
          delete bullets[id];
        }
      }
    }

    if (
      mapData[Math.floor(newBulletY / tileSize)][
        Math.floor(newBulletX / tileSize)
      ] === 1
    ) {
      delete bullets[id];
    }

    bullet.x = newBulletX;
    bullet.y = newBulletY;
  }
}

setInterval(UpdateBullets, 16);

// Update all player positions
setInterval(() => {
  io.emit('updatePlayers', players);
}, 48);

// Update all bullets on all clients
setInterval(() => {
  io.emit('updateBullets', bullets);
}, 80);
