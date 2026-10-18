import { MAX_NOTE_SIZE, MIN_NOTE_SIZE } from './constants';
import type { Point, Rect, Size } from './types';

// When max < min the minimum wins, so a rect larger than its container pins to the origin.
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

export const clampSize = (size: Size, max: Size = MAX_NOTE_SIZE): Size => ({
  width: clamp(size.width, MIN_NOTE_SIZE.width, max.width),
  height: clamp(size.height, MIN_NOTE_SIZE.height, max.height),
});

export const clampToBoard = (rect: Rect, board: Size): Rect => ({
  ...rect,
  x: clamp(rect.x, 0, board.width - rect.width),
  y: clamp(rect.y, 0, board.height - rect.height),
});

// Rects that only share an edge do not intersect.
export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

export const centerOn = (center: Point, size: Size): Point => ({
  x: center.x - size.width / 2,
  y: center.y - size.height / 2,
});
