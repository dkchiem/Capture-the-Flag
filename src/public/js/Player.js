import { tileSize, direction } from './constants.js';
import { clamp } from './utils.js';
import { Bullet } from './Bullet.js';

export class Player {
  constructor(name, teamColor, map, radius, facingAngle, speed) {
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
  }

  draw(ctx, controller, map) {
    // Move player
    console.log(this.x / tileSize, this.y / tileSize);
    Object.keys(controller).forEach((key) => {
      if (controller[key]) {
        switch (key) {
          case direction.UP:
            if (!this.didCollide(1, direction.UP)) {
              this.y = clamp(
                this.y - this.speed,
                0,
                tileSize * map.mapData.length - tileSize,
              );
            }
            break;
          case direction.DOWN:
            if (!this.didCollide(1, direction.DOWN)) {
              this.y = clamp(
                this.y + this.speed,
                0,
                tileSize * map.mapData.length - tileSize,
              );
            }
            break;
          case direction.LEFT:
            if (!this.didCollide(1, direction.LEFT)) {
              this.x = clamp(
                this.x - this.speed,
                0,
                tileSize * map.mapData[0].length - tileSize,
              );
            }
            break;
          case direction.RIGHT:
            if (!this.didCollide(1, direction.RIGHT)) {
              this.x = clamp(
                this.x + this.speed,
                0,
                tileSize * map.mapData[0].length - tileSize,
              );
            }
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
  }

  shoot() {
    this.shotBullets.push(
      new Bullet(this.x, this.y, 10, this.facingAngle, 15, this.teamColor),
    );
  }

  didCollide(blockNumber, movingDirection) {
    // let collide = false;
    // const tileX = Math.floor(this.x / tileSize);
    // const tileY = Math.floor(this.y / tileSize);

    // this.map.mapData.forEach((row, y) => {
    //   row.forEach((block, x) => {
    //     if (block === blockNumber) {
    //       const blockX = x * tileSize;
    //       const blockY = y * tileSize;

    //       if (
    //         this.x + this.radius >= blockX &&
    //         this.x - this.radius <= x * tileSize + tileSize &&
    //         this.y + this.radius >= blockY &&
    //         this.y - this.radius <= blockYw + tileSize
    //       ) {
    //         collide = true;
    //         console.log(this.x, this.y);
    //       }
    //     }
    //   });
    // });

    // this.map.mapData.forEach((row, y) => {
    //   row.forEach((block, x) => {
    //     if (
    //       x <= tileX + 1 &&
    //       x >= tileX - 1 &&
    //       y <= tileY + 1 &&
    //       y >= tileY - 1
    //     ) {
    //       if (block === blockNumber) {
    //         switch (movingDirection) {
    //           case direction.UP:
    //             if (
    //               this.y - this.radius - this.speed <
    //               y * tileSize + tileSize
    //             ) {
    //               collide = true;
    //             }
    //             break;
    //           case direction.RIGHT:
    //             if (this.x + this.radius + this.speed < x * tileSize) {
    //               collide = true;
    //             }
    //             break;
    //           case direction.DOWN:
    //             if (this.y + this.radius + this.speed < y * tileSize) {
    //               collide = true;
    //             }
    //             break;
    //           case direction.LEFT:
    //             if (
    //               this.x - this.radius - this.speed <
    //               x * tileSize + tileSize
    //             ) {
    //               collide = true;
    //             }
    //             break;
    //           default:
    //             break;
    //         }
    //       }
    //     }
    //   });
    // });
    // return collide ? movingDirection : false;
    switch (movingDirection) {
      case direction.UP:
        const upValue1 =
          this.map.mapData[
            Math.floor((this.y - this.radius - this.speed) / tileSize)
          ][Math.floor(this.x / tileSize - 0.5)];
        const upValue2 =
          this.map.mapData[
            Math.floor((this.y - this.radius - this.speed) / tileSize)
          ][Math.floor(this.x / tileSize + 0.5)];
        return upValue1 === 1 || upValue2 === 1;
      case direction.RIGHT:
        const rightValue1 =
          this.map.mapData[Math.floor(this.y / tileSize - 0.5)][
            Math.floor((this.x + this.radius) / tileSize)
          ];
        const rightValue2 =
          this.map.mapData[Math.floor(this.y / tileSize + 0.5)][
            Math.floor((this.x + this.radius) / tileSize)
          ];
        return rightValue1 === 1 || rightValue2 === 1;
      case direction.DOWN:
        const downValue1 =
          this.map.mapData[Math.floor((this.y + this.radius) / tileSize)][
            Math.floor(this.x / tileSize - 0.5)
          ];
        const downValue2 =
          this.map.mapData[Math.floor((this.y + this.radius) / tileSize)][
            Math.floor(this.x / tileSize + 0.5)
          ];
        return downValue1 === 1 || downValue2 === 1;
      case direction.LEFT:
        const leftValue1 =
          this.map.mapData[Math.floor(this.y / tileSize - 0.5)][
            Math.floor((this.x - this.radius - this.speed) / tileSize)
          ];
        const leftValue2 =
          this.map.mapData[Math.floor(this.y / tileSize + 0.5)][
            Math.floor((this.x - this.radius - this.speed) / tileSize)
          ];
        return leftValue1 === 1 || leftValue2 === 1;
      default:
        return false;
    }
  }
}
