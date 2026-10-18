import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import type { Rect } from '../domain/types';
import { useDrag } from '../hooks/useDrag';
import { useResize } from '../hooks/useResize';
import { toTranslate3d } from '../styles/transform';
import { BOARD, installManualFrames, stubBounds } from './testHelpers';

export { BOARD };

export const NOTE: Rect = { x: 100, y: 100, width: 200, height: 200 };
export const START_TRANSFORM = toTranslate3d(NOTE);
export const POINTER = { pointerId: 1, isPrimary: true, button: 0 };

export const setupDrag = () => {
  const frames = installManualFrames();
  const onStart = vi.fn();
  const onEnd = vi.fn();
  const onTrash = vi.fn();
  const Harness = () => {
    const drag = useDrag({ rect: NOTE, onStart, onEnd, onTrash });
    return (
      <div aria-label="board">
        <div role="article" aria-label="note" style={{ transform: START_TRANSFORM }} {...drag} />
      </div>
    );
  };
  const view = render(<Harness />);
  stubBounds(screen.getByLabelText('board'), {
    x: 0,
    y: 0,
    width: BOARD.width,
    height: BOARD.height,
  });
  const note = screen.getByRole('article');

  return {
    ...view,
    frames,
    note,
    board: screen.getByLabelText('board'),
    onStart,
    onEnd,
    onTrash,
    press: (clientX = 150, clientY = 150) =>
      fireEvent.pointerDown(note, { ...POINTER, clientX, clientY }),
    move: (clientX: number, clientY: number) =>
      fireEvent.pointerMove(note, { ...POINTER, clientX, clientY }),
    release: (clientX = 150, clientY = 150) =>
      fireEvent.pointerUp(note, { ...POINTER, clientX, clientY }),
  };
};

export const setupResize = () => {
  const frames = installManualFrames();
  const onStart = vi.fn();
  const onEnd = vi.fn();
  const onNotePointerDown = vi.fn();
  const Harness = () => {
    const resize = useResize({ rect: NOTE, onStart, onEnd });
    return (
      <div aria-label="board">
        <div
          role="article"
          aria-label="note"
          style={{
            transform: START_TRANSFORM,
            width: NOTE.width,
            height: NOTE.height,
          }}
          onPointerDown={onNotePointerDown}
        >
          <div title="Resize" {...resize} />
        </div>
      </div>
    );
  };
  const view = render(<Harness />);
  stubBounds(screen.getByLabelText('board'), {
    x: 0,
    y: 0,
    width: BOARD.width,
    height: BOARD.height,
  });
  const handle = screen.getByTitle('Resize');
  const note = screen.getByRole('article');
  const corner = { x: NOTE.x + NOTE.width, y: NOTE.y + NOTE.height };

  return {
    ...view,
    frames,
    handle,
    note,
    onStart,
    onEnd,
    onNotePointerDown,
    press: () =>
      fireEvent.pointerDown(handle, { ...POINTER, clientX: corner.x, clientY: corner.y }),
    move: (dx: number, dy: number) =>
      fireEvent.pointerMove(handle, { ...POINTER, clientX: corner.x + dx, clientY: corner.y + dy }),
    release: (dx: number, dy: number) =>
      fireEvent.pointerUp(handle, { ...POINTER, clientX: corner.x + dx, clientY: corner.y + dy }),
  };
};
