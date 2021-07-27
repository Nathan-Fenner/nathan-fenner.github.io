export class Pos {
  private static cache = new Map<string, Pos>();
  constructor(public readonly x: number, public readonly y: number) {
    if (x !== Math.floor(x)) {
      throw new Error("non-integer x");
    }
    if (y !== Math.floor(y)) {
      throw new Error("non-integer y");
    }
    if (Pos.cache.has(this.toString())) {
      return Pos.cache.get(this.toString())!;
    }
    Pos.cache.set(this.toString(), this);
  }
  public toString(): string {
    return `${this.x};${this.y}`;
  }
  public shift(dx: number, dy: number): Pos {
    return new Pos(this.x + dx, this.y + dy);
  }
  public add(other: Pos): Pos {
    return this.shift(other.x, other.y);
  }
  public sub(other: Pos): Pos {
    return this.shift(-other.x, -other.y);
  }
  public neighbors(): Pos[] {
    return [
      this.shift(1, 0),
      this.shift(0, 1),
      this.shift(-1, 0),
      this.shift(0, -1),
    ];
  }
  public distance(other: Pos): number {
    return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
  }
}
