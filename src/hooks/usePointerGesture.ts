import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import type { Point, Rect, Size } from '../domain/types';
import { applyRect } from './applyRect';

export interface PointerGestureOptions {
  readonly rect: Rect;
  // Attribute set on the target while the gesture runs; styling hooks into it.
  readonly activeAttribute: string;
  // Element whose style the gesture writes. Defaults to the element receiving the pointer events.
  readonly targetOf?: (eventElement: HTMLElement) => HTMLElement | null;
  readonly compute: (start: Rect, delta: Point, board: Size) => Rect;
  // Presence of this attribute on the board mirrors `test` once per frame and is cleared when the gesture ends.
  readonly boardFlag?: {
    readonly attribute: string;
    readonly test: (rect: Rect, board: Size) => boolean;
  };
  readonly onStart: () => void;
  readonly onEnd: (rect: Rect, board: Size) => void;
}

interface Gesture {
  readonly pointerId: number;
  readonly captureElement: HTMLElement;
  readonly target: HTMLElement;
  readonly boardElement: HTMLElement;
  readonly boardFlag: PointerGestureOptions['boardFlag'];
  readonly attribute: string;
  readonly startPointer: Point;
  readonly startRect: Rect;
  readonly startCssText: string;
  readonly board: Size;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  latest: Rect;
  frame: number | null;
}

const isSameRect = (a: Rect, b: Rect): boolean =>
  a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;

// The gesture lives in a ref and writes the target's style directly, once per animation frame,
// so React only renders when the final rect is committed through `onEnd`.
// The target's parent must be the board: its bounds are read once, at pointer down.
export const usePointerGesture = (options: PointerGestureOptions) => {
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
    gesture.target.removeAttribute(gesture.attribute);
    if (gesture.boardFlag !== undefined) {
      gesture.boardElement.removeAttribute(gesture.boardFlag.attribute);
    }
    if (gesture.captureElement.hasPointerCapture(gesture.pointerId)) {
      gesture.captureElement.releasePointerCapture(gesture.pointerId);
    }

    if (commit && !isSameRect(gesture.latest, gesture.startRect)) {
      applyRect(gesture.target, gesture.latest);
      optionsRef.current.onEnd(gesture.latest, gesture.board);
    } else {
      gesture.target.style.cssText = gesture.startCssText;
    }
  }, []);

  useEffect(() => () => endGesture(false), [endGesture]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const captureElement = event.currentTarget;
      const { rect, activeAttribute, targetOf, boardFlag, onStart } = optionsRef.current;
      const target = targetOf === undefined ? captureElement : targetOf(captureElement);
      const boardElement = target?.parentElement;
      if (
        gestureRef.current !== null ||
        !event.isPrimary ||
        event.button !== 0 ||
        target === null ||
        boardElement === null ||
        boardElement === undefined
      ) {
        return;
      }
      const bounds = boardElement.getBoundingClientRect();
      const onKeyDown = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key === 'Escape') {
          endGesture(false);
        }
      };

      gestureRef.current = {
        pointerId: event.pointerId,
        captureElement,
        target,
        boardElement,
        boardFlag,
        attribute: activeAttribute,
        startPointer: { x: event.clientX, y: event.clientY },
        startRect: rect,
        startCssText: target.style.cssText,
        board: { width: bounds.width, height: bounds.height },
        onKeyDown,
        latest: rect,
        frame: null,
      };
      captureElement.setPointerCapture(event.pointerId);
      target.setAttribute(activeAttribute, 'true');
      window.addEventListener('keydown', onKeyDown);
      onStart();
    },
    [endGesture],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (gesture === null || event.pointerId !== gesture.pointerId) {
      return;
    }
    const delta = {
      x: event.clientX - gesture.startPointer.x,
      y: event.clientY - gesture.startPointer.y,
    };
    gesture.latest = optionsRef.current.compute(gesture.startRect, delta, gesture.board);
    if (gesture.frame === null) {
      gesture.frame = requestAnimationFrame(() => {
        gesture.frame = null;
        applyRect(gesture.target, gesture.latest);
        const { boardFlag } = gesture;
        if (boardFlag !== undefined) {
          gesture.boardElement.toggleAttribute(
            boardFlag.attribute,
            boardFlag.test(gesture.latest, gesture.board),
          );
        }
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

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture: onPointerCancel,
  };
};
