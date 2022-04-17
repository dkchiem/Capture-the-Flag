import { Map } from './Map.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { tileSize, team, direction, map1Data } from './constants.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const socket = io();

const camera = new Camera();
const map1 = new Map(1, map1Data, team.RED);
const clientPlayer = new Player(
  'player1',
  team.RED,
  map1.width / 2 - tileSize / 2,
  canvas.height / 2,
  tileSize / 2,
  0,
  5,
);

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
const controller = { w: false, a: false, s: false, d: false };
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
    e.clientY - (clientPlayer.y + tileSize / 2 - camera.y),
    e.clientX - (clientPlayer.x + tileSize / 2 - camera.x),
  );
});

// Shoot client player bullet
addEventListener('click', (e) => {
  // socket.emit('shoot', {
  //   x: clientPlayer.x + tileSize / 2,
  //   y: clientPlayer.y + tileSize / 2,
  //   facingAngle: clientPlayer.facingAngle,
  // });
  clientPlayer.shoot();
});

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  camera.follow(clientPlayer, map1);
  ctx.translate(-camera.x, -camera.y);
  map1.draw(ctx);
  clientPlayer.draw(ctx, controller, map1);
  requestAnimationFrame(render);
}

render();
