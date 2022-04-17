import { Item } from './Item.js';
import { tileSize, team } from './constants.js';
import { texture } from './textures.js';

export class Map {
  constructor(id, mapData, teamColor) {
    this.id = id;
    this.mapData = mapData;
    this.width = this.mapData[0].length * tileSize;
    this.height = this.mapData.length * tileSize;
    this.items = [];
    this.teamColor = teamColor;

    this.mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        switch (block) {
          case 4:
            this.items.push(
              new Item(
                'flag',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                this.teamColor === team.RED
                  ? texture.blueFlag
                  : texture.redFlag,
                this.teamColor === team.RED ? team.BLUE : team.RED,
              ),
            );
            break;

          case 5:
            this.items.push(
              new Item(
                'flag',
                x * tileSize,
                y * tileSize,
                tileSize,
                tileSize,
                this.teamColor === team.RED
                  ? texture.redFlag
                  : texture.blueFlag,
                this.teamColor,
              ),
            );
            break;

          default:
            break;
        }
      });
    });
  }

  draw(ctx) {
    ctx.save();

    this.mapData.forEach((row, y) => {
      row.forEach((block, x) => {
        ctx.save();
        switch (block) {
          case 0:
            ctx.fillStyle = ctx.createPattern(texture.grass, 'repeat');
            break;

          case 1:
            ctx.fillStyle = ctx.createPattern(texture.rocks, 'repeat');
            break;

          case 2:
          case 3:
          case 4:
          case 5:
            ctx.fillStyle = ctx.createPattern(texture.stone, 'repeat');
            break;

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

        ctx.restore();
      });
    });

    this.items.forEach((item) => {
      item.draw(ctx);
    });

    ctx.restore();
  }
}
