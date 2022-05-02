import { tileSize, direction, team } from './constants.js';
import { clamp } from './utils.js';
import { Bullet } from './Bullet.js';
import { texture } from './textures.js';

const redPointsText = document.querySelector('#red-points');
const bluePointsText = document.querySelector('#blue-points');
let points = { red: 0, blue: 0 };

export class Player {
  constructor(name, teamColor, radius, facingAngle, speed, map) {
    this.name = name;
    this.teamColor = teamColor;
    this.map = map;
    this.x = map.getSpawnPoint(teamColor).x + tileSize / 2;
    this.y = map.getSpawnPoint(teamColor).y + tileSize / 2;
    this.radius = radius;
    this.facingAngle = facingAngle;
    this.speed = speed;
    this.shotBullets = [];
    this.gunWidth = 55;
    this.gunHeight = 25;
    this.flag = null;
  }

  draw(ctx, controller) {
    // Move player
    Object.keys(controller).forEach((key) => {
      if (controller[key]) {
        switch (key) {
          case direction.UP:
            if (!this.didCollide(1, direction.UP)) {
              this.y = clamp(
                this.y - this.speed,
                0,
                tileSize * this.map.mapData.length - tileSize,
              );
            }
            break;
          case direction.DOWN:
            if (!this.didCollide(1, direction.DOWN)) {
              this.y = clamp(
                this.y + this.speed,
                0,
                tileSize * this.map.mapData.length - tileSize,
              );
            }
            break;
          case direction.LEFT:
            if (!this.didCollide(1, direction.LEFT)) {
              this.x = clamp(
                this.x - this.speed,
                0,
                tileSize * this.map.mapData[0].length - tileSize,
              );
            }
            break;
          case direction.RIGHT:
            if (!this.didCollide(1, direction.RIGHT)) {
              this.x = clamp(
                this.x + this.speed,
                0,
                tileSize * this.map.mapData[0].length - tileSize,
              );
            }
            break;
          default:
            break;
        }
      }
    });

    // Check if player touches item
    if (this.map.items.length > 0) {
      this.map.items.forEach((item) => {
        if (
          this.x + this.radius >= item.x &&
          this.x - this.radius <= item.x + item.width &&
          this.y + this.radius >= item.y &&
          this.y - this.radius <= item.y + item.height
        ) {
          if (item.type === 'flag' && item.team != this.teamColor) {
            item.hidden = true;
            this.flag = item;
          }
          if (
            item.type === 'chest' &&
            item.team === this.teamColor &&
            this.flag != null
          ) {
            item.texture = texture.openChest;
            this.flag.hidden = false;
            this.flag = null;
            if (this.teamColor === team.RED) {
              points.red += 1;
              redPointsText.innerText = points.red;
            }
            if (this.teamColor === team.BLUE) {
              points.blue += 1;
              bluePointsText.innerText = points.blue;
            }
            setTimeout(() => {
              item.texture = texture.closeChest;
            }, 2000);
          }
        }
      });
    }

    // Bullets
    this.shotBullets.forEach((bullet) => {
      bullet.draw(ctx, this.gunWidth);
    });

    // Gun
    ctx.save();
    ctx.fillStyle = '#979797';
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle);
    ctx.fillRect(0, -this.gunHeight / 2, this.gunWidth, this.gunHeight);
    ctx.restore();

    // Circle
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = this.teamColor;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();

    // Flag
    if (this.flag != null) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.facingAngle - Math.PI / 2);
      ctx.drawImage(
        this.flag.texture,
        -tileSize / 2,
        -tileSize,
        tileSize,
        tileSize,
      );
      ctx.restore();
    }
  }

  shoot() {
    this.shotBullets.push(
      new Bullet(
        this.x,
        this.y,
        10,
        this.facingAngle,
        15,
        this.teamColor,
        this.map,
        this,
      ),
    );
  }

  didCollide(blockNumber, movingDirection) {
    switch (movingDirection) {
      case direction.UP:
        const upValue1 = this.map.getTileAt(
          this.x - this.radius + 1,
          this.y - this.radius - this.speed,
        );
        const upValue2 = this.map.getTileAt(
          this.x + this.radius - 1,
          this.y - this.radius - this.speed,
        );
        return upValue1 === 1 || upValue2 === 1;

      case direction.RIGHT:
        const rightValue1 = this.map.getTileAt(
          this.x + this.radius,
          this.y - this.radius + 1,
        );
        const rightValue2 = this.map.getTileAt(
          this.x + this.radius,
          this.y + this.radius - 1,
        );
        return rightValue1 === 1 || rightValue2 === 1;

      case direction.DOWN:
        const downValue1 = this.map.getTileAt(
          this.x - this.radius + 1,
          this.y + this.radius,
        );
        const downValue2 = this.map.getTileAt(
          this.x + this.radius - 1,
          this.y + this.radius,
        );
        return downValue1 === 1 || downValue2 === 1;

      case direction.LEFT:
        const leftValue1 = this.map.getTileAt(
          this.x - this.radius - this.speed,
          this.y - this.radius + 1,
        );
        const leftValue2 = this.map.getTileAt(
          this.x - this.radius - this.speed,
          this.y + this.radius - 1,
        );
        return leftValue1 === 1 || leftValue2 === 1;
      default:
        return false;
    }
  }
}
