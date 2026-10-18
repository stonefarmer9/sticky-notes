import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import { clampToBoard } from '../domain/geometry';
import type { Point, Rect, Size } from '../domain/types';
import { toTranslate3d } from '../styles/transform';

interface UseDragOptions {
  readonly rect: Rect;
  readonly onStart: () => void;
  readonly onEnd: (position: Point, board: Size) => void;
}

interface Gesture {
  readonly pointerId: number;
  readonly element: HTMLElement;
  readonly startPointer: Point;
  readonly startRect: Rect;
  readonly startTransform: string;
  readonly board: Size;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  latest: Point;
  frame: number | null;
}

const DRAGGING_ATTRIBUTE = 'data-dragging';

// The gesture lives in a ref and moves the element's transform directly, once per animation frame,
// so React is only involved when the final position is committed through `onEnd`.
// The element's offset parent must be the board: its bounds are read once, at pointer down.
export const useDrag = (options: UseDragOptions) => {
  const optionsRef = useRef(options);
  const gestureRef = useRef<Gesture | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  });

  const endGesture = useCallback((commit: boolean) => {
    const gesture = gestureRef.current;
    if (gesture === null) {
      return;
    }
    gestureRef.current = null;
    if (gesture.frame !== null) {
      cancelAnimationFrame(gesture.frame);
    }
    window.removeEventListener('keydown', gesture.onKeyDown);
    gesture.element.removeAttribute(DRAGGING_ATTRIBUTE);
    if (gesture.element.hasPointerCapture(gesture.pointerId)) {
      gesture.element.releasePointerCapture(gesture.pointerId);
    }

    const moved =
      gesture.latest.x !== gesture.startRect.x || gesture.latest.y !== gesture.startRect.y;
    if (commit && moved) {
      gesture.element.style.transform = toTranslate3d(gesture.latest);
      optionsRef.current.onEnd(gesture.latest, gesture.board);
    } else {
      gesture.element.style.transform = gesture.startTransform;
    }
  }, []);

  useEffect(() => () => endGesture(false), [endGesture]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const element = event.currentTarget;
      const boardElement = element.parentElement;
      if (
        gestureRef.current !== null ||
        !event.isPrimary ||
        event.button !== 0 ||
        boardElement === null
      ) {
        return;
      }
      const bounds = boardElement.getBoundingClientRect();
      const { rect } = optionsRef.current;
      const onKeyDown = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key === 'Escape') {
          endGesture(false);
        }
      };

      gestureRef.current = {
        pointerId: event.pointerId,
        element,
        startPointer: { x: event.clientX, y: event.clientY },
        startRect: rect,
        startTransform: element.style.transform,
        board: { width: bounds.width, height: bounds.height },
        onKeyDown,
        latest: { x: rect.x, y: rect.y },
        frame: null,
      };
      element.setPointerCapture(event.pointerId);
      element.setAttribute(DRAGGING_ATTRIBUTE, 'true');
      window.addEventListener('keydown', onKeyDown);
      optionsRef.current.onStart();
    },
    [endGesture],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (gesture === null || event.pointerId !== gesture.pointerId) {
      return;
    }
    const { x, y } = clampToBoard(
      {
        ...gesture.startRect,
        x: gesture.startRect.x + event.clientX - gesture.startPointer.x,
        y: gesture.startRect.y + event.clientY - gesture.startPointer.y,
      },
      gesture.board,
    );
    gesture.latest = { x, y };
    if (gesture.frame === null) {
      gesture.frame = requestAnimationFrame(() => {
        gesture.frame = null;
        gesture.element.style.transform = toTranslate3d(gesture.latest);
      });
    }
  }, []);

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerId === gestureRef.current?.pointerId) {
        endGesture(true);
      }
    },
    [endGesture],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerId === gestureRef.current?.pointerId) {
        endGesture(false);
      }
    },
    [endGesture],
  );

  const onLostPointerCapture = onPointerCancel;

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture };
};
