import { describe, expect, it } from 'vitest';

import { MAX_NOTE_SIZE, MIN_NOTE_SIZE } from './constants';
import { maxSizeWithin, resizeWithinBoard } from './geometry';
import type { Rect, Size } from './types';

const BOARD: Size = { width: 1000, height: 800 };

describe('maxSizeWithin', () => {
  it('is capped by the maximum note size far from the board edges', () => {
    expect(maxSizeWithin({ x: 0, y: 0 }, BOARD)).toEqual(MAX_NOTE_SIZE);
  });

  it('is capped by the space left to the board edges', () => {
    expect(maxSizeWithin({ x: BOARD.width - 250, y: BOARD.height - 150 }, BOARD)).toEqual({
      width: 250,
      height: 150,
    });
  });

  it('can be smaller than the minimum when the origin is at the edge', () => {
    expect(maxSizeWithin({ x: BOARD.width, y: BOARD.height }, BOARD)).toEqual({
      width: 0,
      height: 0,
    });
  });
});

describe('resizeWithinBoard', () => {
  const rect: Rect = { x: 100, y: 100, width: 200, height: 200 };

  it('applies a size inside all limits and keeps the position', () => {
    expect(resizeWithinBoard(rect, { width: 300, height: 250 }, BOARD)).toEqual({
      ...rect,
      width: 300,
      height: 250,
    });
  });

  it('enforces the minimum and maximum note sizes', () => {
    expect(resizeWithinBoard(rect, { width: 1, height: 1 }, BOARD)).toMatchObject(MIN_NOTE_SIZE);
    expect(
      resizeWithinBoard({ ...rect, x: 0, y: 0 }, { width: 9999, height: 9999 }, BOARD),
    ).toMatchObject(MAX_NOTE_SIZE);
  });

  it('does not grow past the board edge', () => {
    const atEdge: Rect = { x: 800, y: 600, width: 150, height: 150 };

    expect(resizeWithinBoard(atEdge, { width: 500, height: 500 }, BOARD)).toEqual({
      x: 800,
      y: 600,
      width: 200,
      height: 200,
    });
  });

  it('shifts the rect back when even the minimum size does not fit next to the edge', () => {
    const atEdge: Rect = { x: 950, y: 750, width: 40, height: 40 };

    expect(resizeWithinBoard(atEdge, { width: 500, height: 500 }, BOARD)).toEqual({
      x: BOARD.width - MIN_NOTE_SIZE.width,
      y: BOARD.height - MIN_NOTE_SIZE.height,
      ...MIN_NOTE_SIZE,
    });
  });

  it('keeps extra fields of the input type', () => {
    const withId = { ...rect, id: 'a' };

    expect(resizeWithinBoard(withId, { width: 300, height: 300 }, BOARD).id).toBe('a');
  });
});
