import { tileSize } from './constants.js';

export class Bullet {
  constructor(x, y, radius, facingAngle, speed, color, map) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.facingAngle = facingAngle;
    this.speed = speed;
    this.speedX = Math.cos(facingAngle) * speed;
    this.speedY = Math.sin(facingAngle) * speed;
    this.color = color;
    this.map = map;
    this.destroyed = false;
  }

  draw(ctx) {
    if (!this.destroyed) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(this.x, this.y);
      // ctx.rotate(this.facingAngle);
      ctx.fillStyle = this.color;
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.restore();

      // // Collision detection
      this.map.mapData.forEach((row, y) => {
        row.forEach((block, x) => {
          if (block === 1) {
            const blockX = x * tileSize;
            const blockY = y * tileSize;

            if (
              this.x + this.radius >= blockX &&
              this.x - this.radius <= blockX + tileSize &&
              this.y + this.radius >= blockY &&
              this.y - this.radius <= blockY + tileSize
            ) {
              this.destroy();
            }
          }
        });
      });
    }
  }

  destroy() {
    this.destroyed = true;
  }
}
