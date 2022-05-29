import { tileSize } from './constants.js';

export class Bullet {
  constructor(x, y, radius, movingAngle, speed, color, map) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.movingAngle = movingAngle;
    this.speed = speed;
    this.speedX = Math.cos(movingAngle) * speed;
    this.speedY = Math.sin(movingAngle) * speed;
    this.color = color;
    this.map = map;
    this.destroyed = false;
  }

  draw(ctx) {
    if (!this.destroyed) {
      ctx.save();
      ctx.beginPath();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = this.color;
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.restore();

      const newBulletX = this.x + this.speedX;
      const newBulletY = this.y + this.speedY;
      if (this.map.getTileAt(newBulletX, newBulletY) === 1) this.destroy();
    }
  }

  destroy() {
    this.destroyed = true;
  }
}
