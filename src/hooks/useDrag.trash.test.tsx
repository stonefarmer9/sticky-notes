import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BOARD, POINTER, setupDrag as setup } from '../test/dragHarness';

// With the 1000x800 board the trash spans x 420..580 and y 704..800. The note is 200x200 and
// starts at (100, 100), so a pointer delta of (dx, dy) puts it at (100 + dx, 100 + dy).
const OVER_TRASH = { dx: 300, dy: 500 };
const BESIDE_TRASH = { dx: 0, dy: 500 };
const TOUCHING_TRASH_EDGE = { dx: 120, dy: 500 };
const FLAG = 'data-trash-active';

describe('useDrag over the trash', () => {
  it('raises the flag on the board once a frame shows the note over the trash', () => {
    const { board, press, move, frames } = setup();

    press(150, 150);
    move(150 + OVER_TRASH.dx, 150 + OVER_TRASH.dy);
    expect(board).not.toHaveAttribute(FLAG);
    frames.flush();

    expect(board).toHaveAttribute(FLAG);
  });

  it('lowers the flag when the note moves back out of the trash', () => {
    const { board, press, move, frames } = setup();

    press(150, 150);
    move(150 + OVER_TRASH.dx, 150 + OVER_TRASH.dy);
    frames.flush();
    move(150 + BESIDE_TRASH.dx, 150 + BESIDE_TRASH.dy);
    frames.flush();

    expect(board).not.toHaveAttribute(FLAG);
  });

  it('does not raise the flag for a note beside the trash or only touching its edge', () => {
    const { board, press, move, frames } = setup();

    press(150, 150);
    move(150 + BESIDE_TRASH.dx, 150 + BESIDE_TRASH.dy);
    frames.flush();
    expect(board).not.toHaveAttribute(FLAG);

    move(150 + TOUCHING_TRASH_EDGE.dx, 150 + TOUCHING_TRASH_EDGE.dy);
    frames.flush();
    expect(board).not.toHaveAttribute(FLAG);
  });

  it('calls onTrash and not onEnd when released over the trash, even if no frame ran', () => {
    const { press, move, release, onEnd, onTrash } = setup();

    press(150, 150);
    move(150 + OVER_TRASH.dx, 150 + OVER_TRASH.dy);
    release(150 + OVER_TRASH.dx, 150 + OVER_TRASH.dy);

    expect(onTrash).toHaveBeenCalledOnce();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('commits a normal move and never calls onTrash when released elsewhere', () => {
    const { press, move, release, onEnd, onTrash } = setup();

    press(150, 150);
    move(150 + BESIDE_TRASH.dx, 150 + BESIDE_TRASH.dy);
    release(150 + BESIDE_TRASH.dx, 150 + BESIDE_TRASH.dy);

    expect(onEnd).toHaveBeenCalledExactlyOnceWith({ x: 100, y: 600 }, BOARD);
    expect(onTrash).not.toHaveBeenCalled();
  });

  it('clears the flag after a drop on the trash', () => {
    const { board, press, move, release, frames } = setup();

    press(150, 150);
    move(150 + OVER_TRASH.dx, 150 + OVER_TRASH.dy);
    frames.flush();
    release(150 + OVER_TRASH.dx, 150 + OVER_TRASH.dy);

    expect(board).not.toHaveAttribute(FLAG);
  });

  it('clears the flag and does not delete when cancelled with Escape over the trash', () => {
    const { board, press, move, frames, onTrash, onEnd } = setup();

    press(150, 150);
    move(150 + OVER_TRASH.dx, 150 + OVER_TRASH.dy);
    frames.flush();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(board).not.toHaveAttribute(FLAG);
    expect(onTrash).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('clears the flag and does not delete on pointercancel over the trash', () => {
    const { board, note, press, move, frames, onTrash } = setup();

    press(150, 150);
    move(150 + OVER_TRASH.dx, 150 + OVER_TRASH.dy);
    frames.flush();
    fireEvent.pointerCancel(note, POINTER);

    expect(board).not.toHaveAttribute(FLAG);
    expect(onTrash).not.toHaveBeenCalled();
  });

  it('does not delete a note that was only pressed and released', () => {
    const { press, release, onTrash } = setup();

    press();
    release();

    expect(onTrash).not.toHaveBeenCalled();
  });
});
