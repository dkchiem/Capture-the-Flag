import { Map } from './Map.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { Bullet } from './Bullet.js';
import { tileSize, team, direction } from './constants.js';
import { updateLeaderboard, updateHpBar } from './gui.js';

const socket = io();
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
resizeCanvas();

const camera = new Camera();
const bullets = {};
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
  map.updateHiddenItems(gameData.hiddenItems);
  render();
});

// Listen for player update events
socket.on('updatePlayers', (playersData) => {
  let playersFound = {};
  for (const id in playersData) {
    // If the player hasn't been created yet
    if (otherPlayers[id] === undefined && id != socket.id) {
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
    if (id === socket.id) {
      clientPlayer.hp = playersData[id].hp;
      updateHpBar(clientPlayer.hp);
    } else {
      otherPlayers[id].hp = playersData[id].hp;
    }

    // Update player data of other players
    if (id != socket.id) {
      otherPlayers[id].x = playersData[id].x;
      otherPlayers[id].y = playersData[id].y;
      otherPlayers[id].movingX = playersData[id].movingX;
      otherPlayers[id].movingY = playersData[id].movingY;
      otherPlayers[id].movingAngle = playersData[id].movingAngle;
      otherPlayers[id].facingAngle = playersData[id].facingAngle;
      // Update other player flags
      if (playersData[id].flagIndex) {
        otherPlayers[id].flagIndex = playersData[id].flagIndex;
      } else {
        otherPlayers[id].flagIndex = null;
      }
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
  for (const id in serverBullets) {
    const bulletData = serverBullets[id];
    if (bullets[id] == undefined) {
      const shootSound = new Audio('/sounds/shoot.wav');
      shootSound.play();
      bullets[id] = new Bullet(
        bulletData.x,
        bulletData.y,
        bulletData.radius,
        bulletData.movingAngle,
        bulletData.speed,
        bulletData.color,
        map,
      );
    } else {
      bullets[id].x = bulletData.x;
      bullets[id].y = bulletData.y;
    }
  }
  const destroyedBullets = Object.keys(bullets).filter(
    (bullet) => !Object.keys(serverBullets).includes(bullet),
  );
  destroyedBullets.forEach((id) => {
    delete bullets[id];
  });
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
  const deathSound = new Audio('/sounds/death.flac');
  deathSound.play();
  if (id === socket.id) {
    clientPlayer.respawn();
  } else {
    otherPlayers[id].respawn();
  }
});

// Listen for update hidden items events
socket.on('updateHiddenItems', (serverHiddenItems) => {
  map.updateHiddenItems(serverHiddenItems);
});

// Listen for update points events
socket.on('updatePoints', (points) => {
  updateLeaderboard(points);
});

// Listen for gameover events
socket.on('gameOver', (winningTeam) => {
  window.location.href = '/gameover?team=' + winningTeam;
});

/*
 * Setup the game
 */
const controller = { w: false, a: false, s: false, d: false };
function setup() {
  // Resize the canvas to fill the screen
  addEventListener('resize', () => {
    resizeCanvas();
  });

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
    for (const id in bullets) {
      const bullet = bullets[id];
      bullet.x += bullet.speed * Math.cos(bullet.movingAngle);
      bullet.y += bullet.speed * Math.sin(bullet.movingAngle);
    }
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
      speed: clientPlayer.speed,
    });
  }, 48);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  camera.follow(clientPlayer, map);
  ctx.translate(-camera.x, -camera.y);
  map.draw(ctx, camera);
  for (const id in bullets) {
    const bullet = bullets[id];
    if (camera.isInViewCircle(bullet.x, bullet.y, bullet.radius)) {
      bullet.draw(ctx);
    }
  }
  clientPlayer.draw(ctx, socket);
  for (const id in otherPlayers) {
    const otherPlayer = otherPlayers[id];
    if (
      camera.isInViewCircle(otherPlayer.x, otherPlayer.y, otherPlayer.radius)
    ) {
      otherPlayers[id].draw(ctx, socket);
    }
  }
  requestAnimationFrame(render);
}
