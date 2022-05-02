import { Map } from './Map.js';
import { Player } from './Player.js';
import { Camera } from './Camera.js';
import { tileSize, team, direction, map1Data } from './constants.js';

const socket = io();
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const camera = new Camera();
const map1 = new Map(1, map1Data);
// const clientPlayer = new Player('player1', team.RED, tileSize / 2, 0, 5, map1);

socket.emit(
  'newPlayer',
  new Player('player1', team.RED, tileSize / 2, 0, 5, map1),
);

socket.on('create-player', function (state) {
  // CreateShip is a function I've already defined to create and return a sprite
  CreateShip(1, state.x, state.y, state.angle);
});

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
    e.clientY - (clientPlayer.y - camera.y),
    e.clientX - (clientPlayer.x - camera.x),
  );
});

// Shoot client player bullet
addEventListener('click', (e) => {
  clientPlayer.shoot();
});

export function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  camera.follow(clientPlayer, map1);
  ctx.translate(-camera.x, -camera.y);
  map1.draw(ctx);
  clientPlayer.draw(ctx, controller);
  requestAnimationFrame(render);
}
