import { describe, expect, it } from 'vitest';

import { MAX_NOTE_SIZE, MIN_NOTE_SIZE } from './constants';
import { clamp, clampSize, clampToBoard, originCenteredOn, rectsIntersect } from './geometry';
import type { Rect, Size } from './types';

const BOARD: Size = { width: 1000, height: 800 };

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('limits values below min and above max', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('prefers min when the range is inverted', () => {
    expect(clamp(5, 0, -10)).toBe(0);
  });
});

describe('clampSize', () => {
  it('keeps sizes within the default limits unchanged', () => {
    const size: Size = { width: 300, height: 250 };

    expect(clampSize(size)).toEqual(size);
  });

  it('raises sizes below the minimum', () => {
    expect(clampSize({ width: 1, height: 1 })).toEqual(MIN_NOTE_SIZE);
  });

  it('lowers sizes above the default maximum', () => {
    expect(clampSize({ width: 9999, height: 9999 })).toEqual(MAX_NOTE_SIZE);
  });

  it('respects a custom maximum', () => {
    const max: Size = { width: 300, height: 200 };

    expect(clampSize({ width: 500, height: 500 }, max)).toEqual(max);
  });

  it('never goes below the minimum even when the custom maximum is smaller', () => {
    expect(clampSize({ width: 500, height: 500 }, { width: 10, height: 10 })).toEqual(
      MIN_NOTE_SIZE,
    );
  });
});

describe('clampToBoard', () => {
  const rect: Rect = { x: 100, y: 100, width: 200, height: 200 };

  it('leaves a rect inside the board unchanged', () => {
    expect(clampToBoard(rect, BOARD)).toEqual(rect);
  });

  it('pushes a rect back from the top-left edges', () => {
    expect(clampToBoard({ ...rect, x: -50, y: -50 }, BOARD)).toMatchObject({ x: 0, y: 0 });
  });

  it('pushes a rect back from the bottom-right edges', () => {
    expect(clampToBoard({ ...rect, x: 5000, y: 5000 }, BOARD)).toMatchObject({
      x: BOARD.width - rect.width,
      y: BOARD.height - rect.height,
    });
  });

  it('keeps the size untouched', () => {
    const clamped = clampToBoard({ ...rect, x: 5000 }, BOARD);

    expect(clamped.width).toBe(rect.width);
    expect(clamped.height).toBe(rect.height);
  });

  it('preserves extra fields of the input type', () => {
    const note: Rect & { readonly id: string } = { ...rect, id: 'a', x: -10 };

    expect(clampToBoard(note, BOARD).id).toBe('a');
  });

  it('pins a rect larger than the board to the origin', () => {
    const huge: Rect = { x: 50, y: 50, width: 2000, height: 2000 };

    expect(clampToBoard(huge, BOARD)).toMatchObject({ x: 0, y: 0 });
  });
});

describe('rectsIntersect', () => {
  const a: Rect = { x: 0, y: 0, width: 100, height: 100 };

  it('detects overlapping rects', () => {
    expect(rectsIntersect(a, { x: 50, y: 50, width: 100, height: 100 })).toBe(true);
  });

  it('detects a rect fully containing another', () => {
    expect(rectsIntersect(a, { x: 10, y: 10, width: 10, height: 10 })).toBe(true);
  });

  it('is symmetric', () => {
    const b: Rect = { x: 50, y: 50, width: 100, height: 100 };

    expect(rectsIntersect(b, a)).toBe(rectsIntersect(a, b));
  });

  it('returns false for separated rects', () => {
    expect(rectsIntersect(a, { x: 200, y: 0, width: 100, height: 100 })).toBe(false);
    expect(rectsIntersect(a, { x: 0, y: 200, width: 100, height: 100 })).toBe(false);
  });

  it('returns false when rects only share an edge, on every side', () => {
    expect(rectsIntersect(a, { x: 100, y: 0, width: 100, height: 100 })).toBe(false);
    expect(rectsIntersect(a, { x: -100, y: 0, width: 100, height: 100 })).toBe(false);
    expect(rectsIntersect(a, { x: 0, y: 100, width: 100, height: 100 })).toBe(false);
    expect(rectsIntersect(a, { x: 0, y: -100, width: 100, height: 100 })).toBe(false);
  });
});

describe('originCenteredOn', () => {
  it('returns the top-left corner that centers the size on the point', () => {
    expect(originCenteredOn({ x: 500, y: 400 }, { width: 200, height: 200 })).toEqual({
      x: 400,
      y: 300,
    });
  });

  it('can produce negative coordinates near the origin', () => {
    expect(originCenteredOn({ x: 0, y: 0 }, { width: 200, height: 100 })).toEqual({
      x: -100,
      y: -50,
    });
  });
});
