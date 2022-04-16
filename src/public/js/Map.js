import { tileSize } from './constants.js';
import { texture } from './textures.js';

export class Map {
  constructor(id, mapData) {
    this.id = id;
    this.mapData = mapData;
    this.width = this.mapData[0].length * tileSize;
    this.height = this.mapData.length * tileSize;
  }

  draw(ctx) {
    ctx.save();
    this.mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        switch (block) {
          case 0:
            const grass = ctx.createPattern(texture.grass, 'repeat');
            ctx.fillStyle = grass;
            break;

          case 1:
            const rocks = ctx.createPattern(texture.rocks, 'repeat');
            ctx.fillStyle = rocks;
            break;

          case 2:
          case 3:
            const stone = ctx.createPattern(texture.stone, 'repeat');
            ctx.fillStyle = stone;

          default:
            break;
        }

        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);

        // Development block outline
        // ctx.strokeStyle = 'yellow';
        // ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

        // Development block numbers
        // ctx.fillStyle = 'white';
        // ctx.font = '12px Arial';
        // ctx.fillText(`${x},${y}`, x * tileSize + 4, y * tileSize + 12);
      });
    });
    ctx.restore();
  }
}
