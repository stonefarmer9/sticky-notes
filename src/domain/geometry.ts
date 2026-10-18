import { MAX_NOTE_SIZE, MIN_NOTE_SIZE } from './constants';
import type { Point, Rect, Size } from './types';

// When max < min the minimum wins.
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

export const clampSize = (size: Size, max: Size = MAX_NOTE_SIZE): Size => ({
  width: clamp(size.width, MIN_NOTE_SIZE.width, max.width),
  height: clamp(size.height, MIN_NOTE_SIZE.height, max.height),
});

// Largest note size that fits between `origin` and the board's far edges. May drop below the minimum.
export const maxSizeWithin = (origin: Point, board: Size): Size => ({
  width: Math.min(MAX_NOTE_SIZE.width, board.width - origin.x),
  height: Math.min(MAX_NOTE_SIZE.height, board.height - origin.y),
});

// A rect larger than the board pins to the origin. Generic so callers keep their own fields (e.g. Note).
export const clampToBoard = <T extends Rect>(rect: T, board: Size): T => ({
  ...rect,
  x: clamp(rect.x, 0, board.width - rect.width),
  y: clamp(rect.y, 0, board.height - rect.height),
});

// Applies a requested size to a rect: within min/max and the board edge, shifting the rect back if needed.
export const resizeWithinBoard = <T extends Rect>(rect: T, size: Size, board: Size): T =>
  clampToBoard({ ...rect, ...clampSize(size, maxSizeWithin(rect, board)) }, board);

// Rects that only share an edge do not intersect.
export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

export const originCenteredOn = (center: Point, size: Size): Point => ({
  x: center.x - size.width / 2,
  y: center.y - size.height / 2,
});
