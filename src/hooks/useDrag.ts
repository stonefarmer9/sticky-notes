import { clampToBoard } from '../domain/geometry';
import type { Point, Rect, Size } from '../domain/types';
import { usePointerGesture } from './usePointerGesture';

interface UseDragOptions {
  readonly rect: Rect;
  readonly onStart: () => void;
  readonly onEnd: (position: Point, board: Size) => void;
}

const computeDrag = (start: Rect, delta: Point, board: Size): Rect =>
  clampToBoard({ ...start, x: start.x + delta.x, y: start.y + delta.y }, board);

export const useDrag = ({ rect, onStart, onEnd }: UseDragOptions) =>
  usePointerGesture({
    rect,
    activeAttribute: 'data-dragging',
    compute: computeDrag,
    onStart,
    onEnd: (finalRect, board) => onEnd({ x: finalRect.x, y: finalRect.y }, board),
  });
