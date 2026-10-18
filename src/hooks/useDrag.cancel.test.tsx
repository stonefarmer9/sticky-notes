import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toTranslate3d } from '../styles/transform';
import { BOARD, POINTER, START_TRANSFORM, setupDrag as setup } from '../test/dragHarness';

describe('useDrag cancellation and teardown', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('cancels with Escape: restores the position, releases capture and does not commit', () => {
    const { note, press, move, frames, onEnd } = setup();
    const release = vi.spyOn(note, 'releasePointerCapture');
    vi.spyOn(note, 'hasPointerCapture').mockReturnValue(true);

    press(150, 150);
    move(400, 400);
    frames.flush();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(note.style.transform).toBe(START_TRANSFORM);
    expect(note).not.toHaveAttribute('data-dragging');
    expect(release).toHaveBeenCalledWith(POINTER.pointerId);
    expect(frames.pending()).toBe(0);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('ignores moves after Escape', () => {
    const { note, press, move, frames } = setup();

    press();
    fireEvent.keyDown(window, { key: 'Escape' });
    move(400, 400);
    frames.flush();

    expect(note.style.transform).toBe(START_TRANSFORM);
  });

  it('ignores other keys', () => {
    const { note, press, move, frames } = setup();

    press(150, 150);
    fireEvent.keyDown(window, { key: 'a' });
    move(200, 200);
    frames.flush();

    expect(note.style.transform).toBe(toTranslate3d({ x: 150, y: 150 }));
  });

  it('cancels on pointercancel and never gets stuck', () => {
    const { note, press, move, frames, onEnd } = setup();

    press(150, 150);
    move(400, 400);
    frames.flush();
    fireEvent.pointerCancel(note, POINTER);

    expect(note.style.transform).toBe(START_TRANSFORM);
    expect(note).not.toHaveAttribute('data-dragging');
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('cancels when pointer capture is lost without a pointer up', () => {
    const { note, press, move, frames, onEnd } = setup();

    press(150, 150);
    move(400, 400);
    frames.flush();
    fireEvent.lostPointerCapture(note, POINTER);

    expect(note.style.transform).toBe(START_TRANSFORM);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('ignores pointercancel and lost capture from a different pointer', () => {
    const { note, press, onEnd } = setup();

    press();
    fireEvent.pointerCancel(note, { ...POINTER, pointerId: 2 });
    fireEvent.lostPointerCapture(note, { ...POINTER, pointerId: 2 });

    expect(note).toHaveAttribute('data-dragging', 'true');
    fireEvent.pointerUp(note, { ...POINTER, clientX: 150, clientY: 150 });
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('can start a new drag after a cancelled one', () => {
    const { note, press, move, release, onEnd } = setup();

    press();
    fireEvent.pointerCancel(note, POINTER);
    press(150, 150);
    move(160, 170);
    release(160, 170);

    expect(onEnd).toHaveBeenCalledExactlyOnceWith({ x: 110, y: 120 }, BOARD);
  });

  it('ignores a pointer up after capture was lost', () => {
    const { note, press, release, onEnd } = setup();

    press();
    fireEvent.lostPointerCapture(note, POINTER);
    release();

    expect(onEnd).not.toHaveBeenCalled();
  });

  it('ignores Escape after the drag has ended', () => {
    const { note, press, move, release, onStart, onEnd } = setup();

    press(150, 150);
    move(250, 250);
    release(250, 250);
    const committedTransform = note.style.transform;
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(note.style.transform).toBe(committedTransform);
    expect(note.style.transform).toBe(toTranslate3d({ x: 200, y: 200 }));
    expect(onStart).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('tears down an active drag when unmounted', () => {
    const { note, press, unmount, frames, onStart, onEnd } = setup();

    press(150, 150);
    fireEvent.pointerMove(note, { ...POINTER, clientX: 300, clientY: 300 });
    expect(frames.pending()).toBe(1);
    unmount();

    expect(frames.pending()).toBe(0);
    expect(() => fireEvent.keyDown(window, { key: 'Escape' })).not.toThrow();
    expect(onStart).toHaveBeenCalledOnce();
    expect(onEnd).not.toHaveBeenCalled();
    expect(note).not.toHaveAttribute('data-dragging');
  });
});
