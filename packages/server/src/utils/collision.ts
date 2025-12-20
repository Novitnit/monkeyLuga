export type RectLike = { x: number; y: number; w: number; h: number };

export function aabb(a: RectLike, b: RectLike): boolean {
  const aLeft = a.x - a.w / 2;
  const aRight = a.x + a.w / 2;
  const aTop = a.y - a.h / 2;
  const aBottom = a.y + a.h / 2;

  const bLeft = b.x;
  const bRight = b.x + b.w;
  const bTop = b.y;
  const bBottom = b.y + b.h;

  return (
    aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop
  );
}