import { clamp } from './utils.js';

const canvas = document.querySelector('canvas');

export class Camera {
  follow(player, map) {
    this.x = clamp(
      player.x + player.radius - canvas.width / 2,
      0,
      canvas.width > map.width
        ? (map.width - canvas.width) / 2
        : map.width - canvas.width,
    );
    // console.log(this.x);
    this.y = clamp(
      player.y + player.radius - canvas.height / 2,
      0,
      canvas.height > map.height
        ? (map.height - canvas.height) / 2
        : map.height - canvas.height,
    );
  }
}
