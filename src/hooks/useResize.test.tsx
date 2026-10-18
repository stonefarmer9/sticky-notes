import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MAX_NOTE_SIZE, MIN_NOTE_SIZE } from '../domain/constants';
import { BOARD, NOTE, POINTER, START_TRANSFORM, setupResize as setup } from '../test/dragHarness';

describe('useResize', () => {
  it('starts on pointer down: marks the note, not the handle, and calls onStart', () => {
    const { note, handle, press, onStart } = setup();

    press();

    expect(note).toHaveAttribute('data-resizing', 'true');
    expect(handle).not.toHaveAttribute('data-resizing');
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('does not let the press reach the note, so the note is not dragged', () => {
    const { press, onNotePointerDown } = setup();

    press();

    expect(onNotePointerDown).not.toHaveBeenCalled();
  });

  it('resizes the note by the pointer delta on the next frame, without committing', () => {
    const { note, press, move, frames, onEnd } = setup();

    press();
    move(100, 50);
    expect(note.style.width).toBe(`${NOTE.width}px`);
    frames.flush();

    expect(note.style.width).toBe('300px');
    expect(note.style.height).toBe('250px');
    expect(note.style.transform).toBe(START_TRANSFORM);
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('commits the final size and board size on pointer up', () => {
    const { note, press, move, release, onEnd } = setup();

    press();
    move(80, 120);
    release(80, 120);

    expect(onEnd).toHaveBeenCalledExactlyOnceWith({ width: 280, height: 320 }, BOARD);
    expect(note).not.toHaveAttribute('data-resizing');
    expect(note.style.width).toBe('280px');
  });

  it('does not shrink below the minimum size', () => {
    const { press, move, release, onEnd } = setup();

    press();
    move(-900, -900);
    release(-900, -900);

    expect(onEnd).toHaveBeenCalledWith(MIN_NOTE_SIZE, BOARD);
  });

  it('does not grow beyond the maximum size', () => {
    const { press, move, release, onEnd } = setup();

    press();
    move(900, 900);
    release(900, 900);

    expect(onEnd).toHaveBeenCalledWith(MAX_NOTE_SIZE, BOARD);
  });

  it('does not commit when the size is unchanged', () => {
    const { press, move, release, onEnd } = setup();

    press();
    move(50, 50);
    move(0, 0);
    release(0, 0);

    expect(onEnd).not.toHaveBeenCalled();
  });

  it('restores the original size on Escape without committing', () => {
    const { note, press, move, frames, onEnd } = setup();

    press();
    move(100, 100);
    frames.flush();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(note.style.width).toBe(`${NOTE.width}px`);
    expect(note.style.height).toBe(`${NOTE.height}px`);
    expect(note).not.toHaveAttribute('data-resizing');
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('restores the original size on pointercancel', () => {
    const { handle, note, press, move, frames, onEnd } = setup();

    press();
    move(100, 100);
    frames.flush();
    fireEvent.pointerCancel(handle, POINTER);

    expect(note.style.width).toBe(`${NOTE.width}px`);
    expect(onEnd).not.toHaveBeenCalled();
  });
  it('restores the original size when pointer capture is lost, without committing', () => {
    const { handle, note, press, move, frames, onEnd } = setup();

    press();
    move(100, 100);
    frames.flush();
    expect(note.style.width).toBe('300px');
    fireEvent.lostPointerCapture(handle, POINTER);

    expect(note.style.width).toBe(`${NOTE.width}px`);
    expect(note.style.height).toBe(`${NOTE.height}px`);
    expect(note).not.toHaveAttribute('data-resizing');
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('ignores a pointercancel from a different pointer', () => {
    const { handle, note, press, move, release, frames, onEnd } = setup();

    press();
    move(100, 100);
    frames.flush();
    fireEvent.pointerCancel(handle, { ...POINTER, pointerId: 2 });

    expect(note).toHaveAttribute('data-resizing', 'true');
    expect(note.style.width).toBe('300px');

    release(100, 100);
    expect(onEnd).toHaveBeenCalledExactlyOnceWith({ width: 300, height: 300 }, BOARD);
  });
});
