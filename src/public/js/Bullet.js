import { tileSize } from './constants.js';

export class Bullet {
  constructor(x, y, radius, facingAngle, speed, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.facingAngle = facingAngle;
    this.speed = speed;
    this.speedX = Math.cos(facingAngle) * speed;
    this.speedY = Math.sin(facingAngle) * speed;
    this.color = color;
  }

  draw(ctx, gunWidth) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle);
    ctx.fillStyle = this.color;
    ctx.arc(gunWidth, 0, this.radius, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    this.x += this.speedX;
    this.y += this.speedY;
  }
}
