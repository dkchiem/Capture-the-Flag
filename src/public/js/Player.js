import { tileSize, direction } from './constants.js';
import { clamp } from './utils.js';
import { Bullet } from './Bullet.js';

export class Player {
  constructor(name, teamColor, x, y, radius, facingAngle, speed) {
    this.name = name;
    this.teamColor = teamColor;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.facingAngle = facingAngle;
    this.speed = speed;
    this.shotBullets = [];
    this.gunWidth = 55;
    this.gunHeight = 25;
  }

  draw(ctx, controller, map) {
    // Move player
    Object.keys(controller).forEach((key) => {
      if (controller[key]) {
        switch (key) {
          case direction.UP:
            this.y = clamp(
              this.y - this.speed,
              0,
              tileSize * map.mapData.length - tileSize,
            );
            break;
          case direction.DOWN:
            this.y = clamp(
              this.y + this.speed,
              0,
              tileSize * map.mapData.length - tileSize,
            );
            break;
          case direction.LEFT:
            this.x = clamp(
              this.x - this.speed,
              0,
              tileSize * map.mapData[0].length - tileSize,
            );
            break;
          case direction.RIGHT:
            this.x = clamp(
              this.x + this.speed,
              0,
              tileSize * map.mapData[0].length - tileSize,
            );
            break;
          default:
            break;
        }
      }
    });

    // Check if player touches item
    if (map.items.length > 0) {
      map.items.forEach((item) => {
        if (
          this.x + this.radius >= item.x &&
          this.x - this.radius <= item.x + item.width &&
          this.y + this.radius >= item.y &&
          this.y - this.radius <= item.y + item.height
        ) {
          if (item.type === 'flag' && item.team != this.teamColor) {
            map.items.splice(map.items.indexOf(item), 1);
          }
        }
      });
    }

    // Bullets
    this.shotBullets.forEach((bullet) => {
      bullet.draw(ctx, this.gunWidth);
      if (
        bullet.x < 0 ||
        bullet.y < 0 ||
        bullet.x > map.width ||
        bullet.y > map.height
      ) {
        this.shotBullets.splice(this.shotBullets.indexOf(bullet), 1);
      }
    });

    // Gun
    ctx.save();
    ctx.fillStyle = '#979797';
    ctx.translate(this.x + tileSize / 2, this.y + tileSize / 2);
    ctx.rotate(this.facingAngle);
    ctx.fillRect(0, -this.gunHeight / 2, this.gunWidth, this.gunHeight);
    ctx.restore();

    // Circle
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.teamColor;
    ctx.arc(
      this.x + tileSize / 2,
      this.y + tileSize / 2,
      this.radius,
      0,
      Math.PI * 2,
      true,
    );
    ctx.fill();
    ctx.restore();
  }

  shoot() {
    this.shotBullets.push(
      new Bullet(
        this.x + tileSize / 2,
        this.y + tileSize / 2,
        10,
        this.facingAngle,
        15,
        this.teamColor,
      ),
    );
  }
}
