export class Item {
  constructor(type, x, y, width, height, texture, team) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.texture = texture;
    this.team = team;
  }

  draw(ctx) {
    ctx.drawImage(this.texture, this.x, this.y, this.width, this.height);
  }
}
