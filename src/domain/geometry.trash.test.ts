import { describe, expect, it } from 'vitest';

import { TRASH_ZONE_SIZE } from './constants';
import { isOverTrash, trashRect } from './geometry';
import type { Rect, Size } from './types';

const BOARD: Size = { width: 1000, height: 800 };
const NOTE_SIZE: Size = { width: 200, height: 200 };

describe('trashRect', () => {
  it('is centered horizontally and sits on the bottom edge of the board', () => {
    expect(trashRect(BOARD)).toEqual({
      x: (BOARD.width - TRASH_ZONE_SIZE.width) / 2,
      y: BOARD.height - TRASH_ZONE_SIZE.height,
      ...TRASH_ZONE_SIZE,
    });
  });

  it('follows the board size', () => {
    const wider = trashRect({ width: 2000, height: 800 });

    expect(wider.x).toBe((2000 - TRASH_ZONE_SIZE.width) / 2);
  });
});

describe('isOverTrash', () => {
  const trash = trashRect(BOARD);
  const at = (x: number, y: number): Rect => ({ x, y, ...NOTE_SIZE });

  it('is true for a note overlapping the trash', () => {
    expect(isOverTrash(at(trash.x, trash.y), BOARD)).toBe(true);
  });

  it('is true for a note that only overlaps a corner', () => {
    expect(
      isOverTrash(at(trash.x - NOTE_SIZE.width + 1, trash.y - NOTE_SIZE.height + 1), BOARD),
    ).toBe(true);
  });

  it('is false for a note beside the trash', () => {
    expect(isOverTrash(at(0, BOARD.height - NOTE_SIZE.height), BOARD)).toBe(false);
  });

  it('is false for a note above the trash', () => {
    expect(isOverTrash(at(trash.x, 0), BOARD)).toBe(false);
  });

  it('is false when the note only touches the trash edge', () => {
    expect(isOverTrash(at(trash.x - NOTE_SIZE.width, trash.y), BOARD)).toBe(false);
    expect(isOverTrash(at(trash.x, trash.y - NOTE_SIZE.height), BOARD)).toBe(false);
  });
});
