import { Item } from './Item.js';
import { tileSize, team, direction } from './constants.js';
import { texture } from './textures.js';

const canvas = document.querySelector('canvas');

export class Map {
  constructor(mapData) {
    this.mapData = mapData;
    this.width = this.mapData[0].length * tileSize;
    this.height = this.mapData.length * tileSize;
    this.items = [];
    this.redSpawnpoints = [];
    this.blueSpawnpoints = [];

    this.offScreenCanvas = document.createElement('canvas');
    this.offScreenCanvas.width = this.width;
    this.offScreenCanvas.height = this.height;

    const offScreenCtx = this.offScreenCanvas.getContext('2d');
    this.mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        offScreenCtx.save();
        switch (block) {
          case 0:
            offScreenCtx.fillStyle = offScreenCtx.createPattern(
              texture.woodFloor,
              'repeat',
            );
            break;

          case 1:
            offScreenCtx.fillStyle = offScreenCtx.createPattern(
              texture.steelWall,
              'repeat',
            );
            break;

          case 2:
            offScreenCtx.fillStyle = offScreenCtx.createPattern(
              texture.steelFloor,
              'repeat',
            );
            break;

          case 3:
          case 4:
            offScreenCtx.fillStyle = offScreenCtx.createPattern(
              texture.steelFloor,
              'repeat',
            );
            if (block === 3)
              this.blueSpawnpoints.push({ x: x * tileSize, y: y * tileSize });
            if (block === 4)
              this.redSpawnpoints.push({ x: x * tileSize, y: y * tileSize });
            break;

          case 5:
          case 6:
            offScreenCtx.fillStyle = offScreenCtx.createPattern(
              texture.steelFloor,
              'repeat',
            );
            this.items.push(
              new Item(
                'flag',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                block === 6 ? texture.blueFlag : texture.redFlag,
                block === 6 ? team.BLUE : team.RED,
              ),
            );
            break;

          case 7:
          case 8:
            offScreenCtx.fillStyle = offScreenCtx.createPattern(
              texture.steelFloor,
              'repeat',
            );
            this.items.push(
              new Item(
                'chest',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                texture.closeChest,
                block === 8 ? team.RED : team.BLUE,
              ),
            );
            break;

          case 9:
            offScreenCtx.fillStyle = offScreenCtx.createPattern(
              texture.woodFloor,
              'repeat',
            );
            this.items.push(
              new Item(
                'speed-boost',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                texture.bolt,
              ),
            );
            break;

          default:
            break;
        }
        offScreenCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        offScreenCtx.restore();

        // Development block outline
        // offScreenCtx.strokeStyle = 'yellow';
        // offScreenCtx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

        // Development block numbers
        // offScreenCtx.fillStyle = 'white';
        // offScreenCtx.font = '12px Arial';
        // offScreenCtx.fillText(`${x},${y}`, x * tileSize + 4, y * tileSize + 12);
      });
    });
  }

  draw(ctx, camera) {
    ctx.drawImage(this.offScreenCanvas, 0, 0);

    ctx.save();
    this.items.forEach((item) => {
      if (camera.isInViewRect(item.x, item.y, item.width, item.height)) {
        item.draw(ctx);
      }
    });
    ctx.restore();
  }

  getSpawnPoint(playerTeam) {
    if (playerTeam === team.BLUE) {
      return this.blueSpawnpoints[
        Math.floor(Math.random() * this.blueSpawnpoints.length)
      ];
    } else if (playerTeam === team.RED) {
      return this.redSpawnpoints[
        Math.floor(Math.random() * this.redSpawnpoints.length)
      ];
    }
  }

  getTileAt(x, y) {
    return this.mapData[Math.floor(y / tileSize)][Math.floor(x / tileSize)];
  }

  updateHiddenItems(hiddenItems) {
    this.items.forEach((item, i) => {
      if (hiddenItems[i]) {
        item.hidden = true;
      } else {
        item.hidden = false;
      }
    });
  }
}
