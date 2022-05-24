import { Map } from './Map.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { Bullet } from './Bullet.js';
import { tileSize, team, direction } from './constants.js';

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
    gunWidth: clientPlayer.gunWidth,
    facingAngle: clientPlayer.facingAngle,
  });

  setup();
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

    // Update position of other players
    // if (id != socket.id) {
    //   otherPlayers[id].x = playersData[id].x;
    //   otherPlayers[id].y = playersData[id].y;
    //   otherPlayers[id].facingAngle = playersData[id].facingAngle;
    // }

    for (const id in otherPlayers) {
      const player = otherPlayers[id];
      if (player.x != undefined) {
        player.x += (player.targetX - player.x) * 0.16;
        player.y += (player.targetY - player.y) * 0.16;
        // Interpolate angle while avoiding the positive/negative issue
        const dir = (player.targetFacingAngle - p.rotation) / (Math.PI * 2);
        dir -= Math.round(dir);
        dir = dir * Math.PI * 2;
        p.rotation += dir * 0.16;
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
});

socket.on('dropFlag', (flagData) => {
  otherPlayers[flagData.playerId].flag = null;
});

// Listen for hide flag events
socket.on('updateFlag', (flagData) => {
  const redPointsText = document.querySelector('#red-points');
  const bluePointsText = document.querySelector('#blue-points');
  redPointsText.innerText = flagData.points.red;
  bluePointsText.innerText = flagData.points.blue;
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
    // const bullet = new Bullet(
    //   clientPlayer.x +
    //     (clientPlayer.gunWidth - 10) * Math.cos(clientPlayer.facingAngle),
    //   clientPlayer.y +
    //     (clientPlayer.gunWidth - 10) * Math.sin(clientPlayer.facingAngle),
    //   10,
    //   clientPlayer.facingAngle,
    //   1,
    //   clientPlayer.teamColor,
    //   map,
    //   clientPlayer,
    // );
    // shotBullets.push(bullet);
    socket.emit('shootBullet');
  });

  // Send new player position to server
  setInterval(() => {
    socket.emit('movePlayer', {
      x: clientPlayer.x,
      y: clientPlayer.y,
      facingAngle: clientPlayer.facingAngle,
    });
  }, 100);
}

export function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  camera.follow(clientPlayer, map);
  ctx.translate(-camera.x, -camera.y);
  map.draw(ctx);
  shotBullets.forEach((bullet) => {
    bullet.draw(ctx);
  });
  clientPlayer.draw(ctx, socket);
  clientPlayer.move(controller);
  for (const id in otherPlayers) {
    otherPlayers[id].draw(ctx, socket);
  }
  requestAnimationFrame(render);
}
