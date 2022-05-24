import { tileSize, direction, team } from './constants.js';
import { clamp } from './utils.js';
import { texture } from './textures.js';

function updateHpBar(hp) {
  const hpBar = document.querySelector('#hp');
  hpBar.style.width = hp >= 0 ? `${hp}%` : '0%';
  if (hp <= 100 && hp > 50) {
    hpBar.style.backgroundColor = '#6bcb77';
  } else if (hp <= 50 && hp > 20) {
    hpBar.style.backgroundColor = '#FFD93D';
  } else if (hp <= 20) {
    hpBar.style.backgroundColor = '#FF6B6B';
  }
}

export class Player {
  constructor(name, team, radius, facingAngle, speed, map, client) {
    this.name = name;
    this.team = team;
    this.map = map;
    this.x = map.getSpawnPoint(team).x + tileSize / 2;
    this.y = map.getSpawnPoint(team).y + tileSize / 2;
    this.radius = radius;
    this.facingAngle = facingAngle;
    this.speed = speed;
    this.gunWidth = 55;
    this.gunHeight = 25;
    this.flag = null;
    this.client = client;
    this.alpha = 1;
    this.hp = 100;

    setInterval(() => {
      if (this.hp < 100) {
        this.hp++;
        if (this.client) {
          updateHpBar(this.hp);
        }
      }
    }, 1000);
  }

  draw(ctx, socket) {
    // Check if player touches item
    if (this.map.items.length > 0) {
      this.map.items.forEach((item, i) => {
        if (
          this.x + this.radius >= item.x &&
          this.x - this.radius <= item.x + item.width &&
          this.y + this.radius >= item.y &&
          this.y - this.radius <= item.y + item.height
        ) {
          if (item.type === 'flag' && item.team != this.team && this.client) {
            item.hidden = true;
            this.flag = item;
            socket.emit('pickupFlag', {
              item,
              index: i,
              playerId: socket.id,
            });
          }
          if (
            item.type === 'chest' &&
            item.team === this.team &&
            this.flag != null &&
            this.client
          ) {
            item.texture = texture.openChest;
            this.flag.hidden = false;
            this.flag = null;
            socket.emit('dropFlag', {
              item,
              index: i,
              playerId: socket.id,
            });
            setTimeout(() => {
              item.texture = texture.closeChest;
            }, 2000);
          }
        }
      });
    }

    // Gun
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#979797';
    ctx.translate(this.x, this.y);
    ctx.rotate(this.facingAngle);
    ctx.fillRect(0, -this.gunHeight / 2, this.gunWidth, this.gunHeight);
    ctx.restore();

    // Circle
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.team;
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

  move(controller) {
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

  hit() {
    if (this.client) {
      updateHpBar(this.hp);
    }
  }

  respawn() {
    this.x = this.map.getSpawnPoint(this.team).x + tileSize / 2;
    this.y = this.map.getSpawnPoint(this.team).y + tileSize / 2;
    if (this.client) {
      updateHpBar(100);
    }
  }
}
