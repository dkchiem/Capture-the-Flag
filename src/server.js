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
const players = {};
let nextBulletID = 0;
let bullets = {};
const mapData = maps[0];
let points = { red: 0, blue: 0 };

const playerTeam = nextTeamGenerator(team);

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => {
  res.render('pages/home');
});
app.get('/game', (req, res) => {
  res.render('pages/index');
});
app.use(express.static(__dirname + '/public'));

// Socket.io
io.on('connection', (socket) => {
  console.log('New client has connected with id:', socket.id);

  const newPlayerTeam = playerTeam.next().value;

  // Initialize player game
  socket.emit('newGameData', { team: newPlayerTeam, map: mapData, points });

  // Add new player
  socket.on('newPlayer', (PlayerData) => {
    players[socket.id] = {
      ...PlayerData,
      hp: 100,
      team: newPlayerTeam,
    };
    io.emit('updatePlayers', players);
  });

  // Disconnect player
  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} has disconnected`);
    delete players[socket.id];
    io.emit('updatePlayers', players);
  });

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

  socket.on('pickupFlag', (flagData) => {
    if (players[socket.id] == undefined) return;
    players[socket.id].flag = flagData.item;
    socket.broadcast.emit('updatePlayers', players);
    socket.broadcast.emit('pickupFlag', flagData);
  });

  socket.on('dropFlag', (flagData) => {
    if (players[socket.id] == undefined) return;
    players[socket.id].flag = null;
    if (players[socket.id].team === team.RED) {
      points.red++;
      if (points.red >= winningPoints) {
        io.emit('gameOver', 'Red');
        reset();
      }
    } else if (players[socket.id].team === team.BLUE) {
      points.blue++;
      if (points.blue >= winningPoints) {
        io.emit('gameOver', 'Blue');
        reset();
      }
    }
    socket.broadcast.emit('updatePlayers', players);
    io.emit('dropFlag', { ...flagData, points });
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
        players[id].hp++;
        io.emit('updatePlayers', players);
      }
    }
  }
}, 1000);

// Reset game
function reset() {
  points = { red: 0, blue: 0 };
  bullets = {};
}

// Update bullets
function UpdateBullets() {
  for (const id in bullets) {
    const bullet = bullets[id];
    const newBulletX = bullet.x + bullet.speed * Math.cos(bullet.movingAngle);
    const newBulletY = bullet.y + bullet.speed * Math.sin(bullet.movingAngle);

    for (const playerId in players) {
      if (bullet.playerId != playerId) {
        const player = players[playerId];
        const dx = player.x - bullet.x;
        const dy = player.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius) {
          io.emit('playerHit', playerId);
          player.hp -= bullet.damage;
          if (player.hp <= 0) {
            io.emit('playerDead', playerId);
            player.hp = 100;
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
