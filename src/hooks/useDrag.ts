import { clampToBoard, isOverTrash } from '../domain/geometry';
import type { Point, Rect, Size } from '../domain/types';
import { usePointerGesture } from './usePointerGesture';

interface UseDragOptions {
  readonly rect: Rect;
  readonly onStart: () => void;
  readonly onEnd: (position: Point, board: Size) => void;
  readonly onTrash: () => void;
}

// Styled in TrashZone.module.css and Note.module.css.
const TRASH_ACTIVE_ATTRIBUTE = 'data-trash-active';

const computeDrag = (start: Rect, delta: Point, board: Size): Rect =>
  clampToBoard({ ...start, x: start.x + delta.x, y: start.y + delta.y }, board);

const TRASH_FLAG = { attribute: TRASH_ACTIVE_ATTRIBUTE, test: isOverTrash };

// Releasing over the trash is decided from the final rect, not from the last frame's flag.
export const useDrag = ({ rect, onStart, onEnd, onTrash }: UseDragOptions) =>
  usePointerGesture({
    rect,
    activeAttribute: 'data-dragging',
    compute: computeDrag,
    boardFlag: TRASH_FLAG,
    onStart,
    onEnd: (finalRect, board) => {
      if (isOverTrash(finalRect, board)) {
        onTrash();
      } else {
        onEnd({ x: finalRect.x, y: finalRect.y }, board);
      }
    },
  });
