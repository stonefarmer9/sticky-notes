import type { PointerEvent as ReactPointerEvent } from 'react';

import { resizeWithinBoard } from '../domain/geometry';
import type { Point, Rect, Size } from '../domain/types';
import { usePointerGesture } from './usePointerGesture';

interface UseResizeOptions {
  readonly rect: Rect;
  readonly onStart: () => void;
  readonly onEnd: (size: Size, board: Size) => void;
}

const computeResize = (start: Rect, delta: Point, board: Size): Rect =>
  resizeWithinBoard(start, { width: start.width + delta.x, height: start.height + delta.y }, board);

const noteOf = (handle: HTMLElement): HTMLElement | null => handle.parentElement;

// The handlers go on a handle element inside the note; the gesture resizes the note itself.
export const useResize = ({ rect, onStart, onEnd }: UseResizeOptions) => {
  const gesture = usePointerGesture({
    rect,
    activeAttribute: 'data-resizing',
    targetOf: noteOf,
    compute: computeResize,
    onStart,
    onEnd: (finalRect, board) => onEnd({ width: finalRect.width, height: finalRect.height }, board),
  });

  // Stops the press from also starting a drag on the note that contains the handle.
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
    gesture.onPointerDown(event);
  };

  return { ...gesture, onPointerDown };
};
