import { tileSize } from './constants.js';

export class Map {
  constructor(id, mapData) {
    this.id = id;
    this.mapData = mapData;
  }

  draw(ctx) {
    ctx.save();
    this.mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block === 0) {
          ctx.fillStyle = '#E7A04E';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }

        // Development block outline
        ctx.strokeStyle = 'yellow';
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

        // Development block numbers
        // ctx.fillStyle = 'white';
        // ctx.font = '12px Arial';
        // ctx.fillText(`${x},${y}`, x * tileSize + 4, y * tileSize + 12);
      });
    });
    ctx.restore();
  }
}
