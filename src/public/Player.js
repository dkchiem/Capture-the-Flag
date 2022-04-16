import { tileSize, direction } from './constants.js';
import { clamp } from './utils.js';

export class Player {
  constructor(name, teamColor, x, y, radius, facingAngle, speed) {
    this.name = name;
    this.teamColor = teamColor;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.facingAngle = facingAngle;
    this.speed = speed;
  }

  draw(ctx) {
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

  move(controller, map) {
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
  }
}
