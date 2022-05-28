import { clamp } from './utils.js';

const canvas = document.querySelector('canvas');

export class Camera {
  follow(player, map) {
    this.x = Math.round(
      clamp(
        player.x - canvas.width / 2,
        0,
        canvas.width > map.width
          ? (map.width - canvas.width) / 2
          : map.width - canvas.width,
      ),
    );
    this.y = Math.round(
      clamp(
        player.y - canvas.height / 2,
        0,
        canvas.height > map.height
          ? (map.height - canvas.height) / 2
          : map.height - canvas.height,
      ),
    );
  }
}
