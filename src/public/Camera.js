import { tileSize } from './constants.js';
import { clamp } from './utils.js';

const canvas = document.querySelector('canvas');

export class Camera {
  constructor(width, height) {
    this.x;
    this.y;
  }

  follow(player, map) {
    this.x = clamp(
      player.x + player.radius - canvas.width / 2,
      0,
      map.mapData[0].length * tileSize - canvas.width,
    );
    this.y = clamp(
      player.y + player.radius - canvas.height / 2,
      0,
      map.mapData.length * tileSize - canvas.height,
    );
  }
}
