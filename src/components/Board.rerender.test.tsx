import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentPropsWithoutRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotesProvider } from '../state/NotesContext';
import { initialNotesState, type NotesState } from '../state/notesReducer';
import { POINTER } from '../test/dragHarness';
import { createNote, installManualFrames, stubBounds } from '../test/testHelpers';
import { Board } from './Board';

// Note renders exactly one ResizeHandle per render, so handle renders count note renders.
const { handleRender } = vi.hoisted(() => ({ handleRender: vi.fn() }));

vi.mock('./ResizeHandle', () => ({
  ResizeHandle: (props: ComponentPropsWithoutRef<'div'>) => {
    handleRender();
    return <div title="Resize" {...props} />;
  },
}));

const seedNotes = (count: number): NotesState => {
  let state = initialNotesState;
  for (let index = 0; index < count; index += 1) {
    state = createNote(state, { x: 20 + index * 120, y: 100, width: 100, height: 100 }).state;
  }
  return state;
};

const setup = (noteCount: number) => {
  const frames = installManualFrames();
  const { unmount } = render(
    <NotesProvider initialState={seedNotes(noteCount)}>
      <Board />
    </NotesProvider>,
  );
  stubBounds(screen.getByRole('main'), { x: 0, y: 0, width: 1000, height: 800 });
  const [firstNote] = screen.getAllByRole('article');
  const [firstHandle] = screen.getAllByTitle('Resize');
  if (firstNote === undefined || firstHandle === undefined) {
    throw new Error('Expected notes');
  }
  handleRender.mockClear();
  return { frames, firstNote, firstHandle, unmount };
};

interface DragCounts {
  readonly afterMove: number;
  readonly afterRelease: number;
}

const dragFirstNote = (noteCount: number): DragCounts => {
  const { frames, firstNote, unmount } = setup(noteCount);
  const at = (clientX: number, clientY: number) => ({ ...POINTER, clientX, clientY });

  fireEvent.pointerDown(firstNote, at(50, 150));
  fireEvent.pointerMove(firstNote, at(150, 250));
  frames.flush();
  const afterMove = handleRender.mock.calls.length;
  fireEvent.pointerUp(firstNote, at(150, 250));

  const counts = { afterMove, afterRelease: handleRender.mock.calls.length };
  unmount();
  return counts;
};

const resizeFirstNote = (noteCount: number): DragCounts => {
  const { frames, firstHandle, unmount } = setup(noteCount);
  const at = (clientX: number, clientY: number) => ({ ...POINTER, clientX, clientY });

  fireEvent.pointerDown(firstHandle, at(120, 200));
  fireEvent.pointerMove(firstHandle, at(170, 250));
  frames.flush();
  const afterMove = handleRender.mock.calls.length;
  fireEvent.pointerUp(firstHandle, at(170, 250));

  const counts = { afterMove, afterRelease: handleRender.mock.calls.length };
  unmount();
  return counts;
};

describe('Board re-renders while manipulating one note', () => {
  beforeEach(() => {
    handleRender.mockClear();
  });

  it('does not re-render any note on mere pointer movement beyond the press', () => {
    const { frames, firstNote } = setup(3);

    fireEvent.pointerDown(firstNote, { ...POINTER, clientX: 50, clientY: 150 });
    const afterPress = handleRender.mock.calls.length;
    expect(afterPress).toBe(1);
    fireEvent.pointerMove(firstNote, { ...POINTER, clientX: 150, clientY: 250 });
    fireEvent.pointerMove(firstNote, { ...POINTER, clientX: 200, clientY: 300 });
    frames.flush();

    expect(handleRender).toHaveBeenCalledTimes(afterPress);
  });

  it('re-renders only the dragged note, independent of how many other notes exist', () => {
    const three = dragFirstNote(3);
    handleRender.mockClear();
    const six = dragFirstNote(6);

    expect(six).toEqual(three);
    // One render for the bring-to-front on press, one for the committed position on release.
    expect(three).toEqual({ afterMove: 1, afterRelease: 2 });
  });

  it('re-renders only the resized note, independent of how many other notes exist', () => {
    const three = resizeFirstNote(3);
    handleRender.mockClear();
    const six = resizeFirstNote(6);

    expect(six).toEqual(three);
    expect(three).toEqual({ afterMove: 1, afterRelease: 2 });
  });
});
