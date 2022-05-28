import { Map } from './Map.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { Bullet } from './Bullet.js';
import { tileSize, team, direction } from './constants.js';
import { updateLeaderboard } from './gui.js';

const socket = io();
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const camera = new Camera();
const shotBullets = [];
const otherPlayers = {};
let clientPlayer;
let map;

// Initialize player game
socket.on('newGameData', (gameData) => {
  map = new Map(gameData.map);
  clientPlayer = new Player(
    'client',
    gameData.team,
    tileSize / 2,
    0,
    5,
    map,
    true,
  );

  socket.emit('newPlayer', {
    x: clientPlayer.x,
    y: clientPlayer.y,
    radius: clientPlayer.radius,
    gunWidth: clientPlayer.gunWidth,
    facingAngle: clientPlayer.facingAngle,
    speed: clientPlayer.speed,
  });

  setup();
  updateLeaderboard(gameData.points);
  render();
});

// Listen for player update events
socket.on('updatePlayers', (playersData) => {
  let playersFound = {};
  for (const id in playersData) {
    // If the player hasn't been created yet
    if (otherPlayers[id] == undefined && id != socket.id) {
      const playerData = playersData[id];
      const player = new Player(
        'player',
        playerData.team,
        tileSize / 2,
        playerData.facingAngle,
        5,
        map,
        false,
      );
      otherPlayers[id] = player;
      console.log(
        'Created new player at (' + playerData.x + ', ' + playerData.y + ')',
      );
    }
    playersFound[id] = true;

    // Update hp of players
    if (playersData[id]) {
      if (id === socket.id) {
        clientPlayer.hp = playersData[id].hp;
      } else {
        otherPlayers[id].hp = playersData[id].hp;
      }
    }

    // Update player data of other players
    if (id != socket.id) {
      otherPlayers[id].x = playersData[id].x;
      otherPlayers[id].y = playersData[id].y;
      otherPlayers[id].movingX = playersData[id].movingX;
      otherPlayers[id].movingY = playersData[id].movingY;
      otherPlayers[id].movingAngle = playersData[id].movingAngle;
      otherPlayers[id].facingAngle = playersData[id].facingAngle;
    }
  }

  // Check if a player is missing and delete them
  for (const id in otherPlayers) {
    if (!playersFound[id]) {
      delete otherPlayers[id];
    }
  }
});

// Listen for bullet update events
socket.on('updateBullets', (serverBullets) => {
  serverBullets.forEach((bullet, i) => {
    if (shotBullets[i] == undefined) {
      shotBullets[i] = new Bullet(
        bullet.x,
        bullet.y,
        bullet.radius,
        bullet.facingAngle,
        bullet.speed,
        bullet.color,
        map,
      );
    } else {
      shotBullets[i].x = bullet.x;
      shotBullets[i].y = bullet.y;
    }
  });
  for (let i = serverBullets.length; i < shotBullets.length; i++) {
    shotBullets[i].destroy();
    shotBullets.splice(i, 1);
    i--;
  }
});

// Listen for player hit events
socket.on('playerHit', (id) => {
  if (id === socket.id) {
    clientPlayer.hit();
  } else {
    otherPlayers[id].hit();
  }
});

// Listen for player dead events
socket.on('playerDead', (id) => {
  if (id === socket.id) {
    clientPlayer.respawn();
  } else {
    otherPlayers[id].respawn();
  }
});

socket.on('pickupFlag', (flagData) => {
  otherPlayers[flagData.playerId].flag = map.items[flagData.index];
  map.items[flagData.index].hidden = flagData.item.hidden;
});

socket.on('dropFlag', (flagData) => {
  updateLeaderboard(flagData.points);
  otherPlayers[flagData.playerId].flag = null;
  map.items[flagData.index].hidden = flagData.item.hidden;
});

// Listen for gameover events
socket.on('gameOver', (winningTeam) => {
  alert(`${winningTeam} has won!`);
});

const controller = { w: false, a: false, s: false, d: false };

function setup() {
  // Resize the canvas to fill the screen
  resizeCanvas();
  addEventListener('resize', () => {
    resizeCanvas();
  });
  function resizeCanvas() {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
  }

  // Client player movements
  addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.key in controller) {
      controller[e.key] = true;
    }
  });
  addEventListener('keyup', (e) => {
    e.preventDefault();
    if (e.key in controller) {
      controller[e.key] = false;
    }
  });

  // Client player facing direction
  addEventListener('mousemove', (e) => {
    clientPlayer.facingAngle = Math.atan2(
      e.clientY - (clientPlayer.y - camera.y),
      e.clientX - (clientPlayer.x - camera.x),
    );
  });

  // Shoot client player bullet
  addEventListener('click', (e) => {
    socket.emit('shootBullet');
  });

  // Move players and bullets
  setInterval(() => {
    clientPlayer.move(controller);
    for (const id in otherPlayers) {
      const otherPlayer = otherPlayers[id];
      if (otherPlayer.movingX)
        otherPlayer.x += otherPlayer.speed * Math.cos(otherPlayer.movingAngle);
      if (otherPlayer.movingY)
        otherPlayer.y += otherPlayer.speed * Math.sin(otherPlayer.movingAngle);
    }
    shotBullets.forEach((bullet) => {
      bullet.x += bullet.speed * Math.cos(bullet.facingAngle);
      bullet.y += bullet.speed * Math.sin(bullet.facingAngle);
    });
  }, 16);

  // Send new player position to server
  setInterval(() => {
    socket.emit('movePlayer', {
      x: clientPlayer.x,
      y: clientPlayer.y,
      facingAngle: clientPlayer.facingAngle,
      movingX: clientPlayer.movingX,
      movingY: clientPlayer.movingY,
      movingAngle: clientPlayer.movingAngle,
    });
  }, 80);
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  camera.follow(clientPlayer, map);
  ctx.translate(-camera.x, -camera.y);
  map.draw(ctx);
  shotBullets.forEach((bullet) => {
    bullet.draw(ctx);
  });
  clientPlayer.draw(ctx, socket);
  for (const id in otherPlayers) {
    otherPlayers[id].draw(ctx, socket);
  }
  requestAnimationFrame(render);
}
