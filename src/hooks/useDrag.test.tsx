import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toTranslate3d } from '../styles/transform';
import { BOARD, NOTE, POINTER, START_TRANSFORM, setupDrag as setup } from '../test/dragHarness';

describe('useDrag', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts on pointer down: captures the pointer, marks the note and calls onStart', () => {
    const { note, press, onStart } = setup();
    const capture = vi.spyOn(note, 'setPointerCapture');

    press();

    expect(capture).toHaveBeenCalledWith(POINTER.pointerId);
    expect(note).toHaveAttribute('data-dragging', 'true');
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('moves the note by the pointer delta on the next frame, without committing', () => {
    const { note, press, move, frames, onEnd } = setup();

    press(150, 150);
    move(200, 260);
    expect(note.style.transform).toBe(START_TRANSFORM);
    frames.flush();

    expect(note.style.transform).toBe(toTranslate3d({ x: 150, y: 210 }));
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('coalesces several moves into a single frame that uses the latest position', () => {
    const { note, press, move, frames } = setup();

    press(150, 150);
    move(160, 160);
    move(170, 170);
    move(180, 190);

    expect(frames.pending()).toBe(1);
    frames.flush();
    expect(note.style.transform).toBe(toTranslate3d({ x: 130, y: 140 }));
  });

  it('commits the final position and board size on pointer up', () => {
    const { note, press, move, release, onEnd } = setup();

    press(150, 150);
    move(250, 350);
    release(250, 350);

    expect(onEnd).toHaveBeenCalledExactlyOnceWith({ x: 200, y: 300 }, BOARD);
    expect(note).not.toHaveAttribute('data-dragging');
    expect(note.style.transform).toBe(toTranslate3d({ x: 200, y: 300 }));
  });

  it('does not wait for a frame to commit the last pointer position', () => {
    const { press, move, release, onEnd, frames } = setup();

    press(150, 150);
    move(250, 350);
    expect(frames.pending()).toBe(1);
    release(250, 350);

    expect(frames.pending()).toBe(0);
    expect(onEnd).toHaveBeenCalledWith({ x: 200, y: 300 }, BOARD);
  });

  it('keeps the note inside the board', () => {
    const { press, move, release, onEnd } = setup();

    press(150, 150);
    move(5000, 5000);
    release(5000, 5000);
    expect(onEnd).toHaveBeenLastCalledWith(
      { x: BOARD.width - NOTE.width, y: BOARD.height - NOTE.height },
      BOARD,
    );
  });

  it('does not let the note leave through the top-left corner', () => {
    const { press, move, release, onEnd } = setup();

    press(150, 150);
    move(-5000, -5000);
    release(-5000, -5000);

    expect(onEnd).toHaveBeenCalledWith({ x: 0, y: 0 }, BOARD);
  });

  it('does not commit when the note ends where it started', () => {
    const { press, move, release, onEnd } = setup();

    press(150, 150);
    move(300, 300);
    move(150, 150);
    release(150, 150);

    expect(onEnd).not.toHaveBeenCalled();
  });

  it('only reacts to the primary button', () => {
    const { note, onStart } = setup();

    fireEvent.pointerDown(note, { ...POINTER, button: 2 });

    expect(onStart).not.toHaveBeenCalled();
    expect(note).not.toHaveAttribute('data-dragging');
  });

  it('only reacts to the primary pointer', () => {
    const { note, onStart } = setup();

    fireEvent.pointerDown(note, { ...POINTER, isPrimary: false });

    expect(onStart).not.toHaveBeenCalled();
  });

  it('ignores moves and releases from a different pointer', () => {
    const { note, press, frames, onEnd } = setup();

    press(150, 150);
    fireEvent.pointerMove(note, { ...POINTER, pointerId: 2, clientX: 400, clientY: 400 });
    fireEvent.pointerUp(note, { ...POINTER, pointerId: 2, clientX: 400, clientY: 400 });

    expect(frames.pending()).toBe(0);
    expect(onEnd).not.toHaveBeenCalled();
    expect(note).toHaveAttribute('data-dragging', 'true');
  });

  it('ignores a second pointer down while a drag is active', () => {
    const { note, press, onStart } = setup();

    press();
    fireEvent.pointerDown(note, { ...POINTER, pointerId: 2 });

    expect(onStart).toHaveBeenCalledOnce();
  });
});
