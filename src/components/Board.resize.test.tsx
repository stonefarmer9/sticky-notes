import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotesProvider, useNotesState } from '../state/NotesContext';
import { initialNotesState } from '../state/notesReducer';
import { POINTER } from '../test/dragHarness';
import { createNote, installManualFrames, stubBounds } from '../test/testHelpers';
import { Board } from './Board';

const StateProbe = () => {
  const { notes } = useNotesState();
  return (
    <output>
      {notes
        .map((note) => `${note.x},${note.y} ${note.width}x${note.height} z${note.zIndex}`)
        .join(' | ')}
    </output>
  );
};

const setup = () => {
  const frames = installManualFrames();
  const first = createNote(initialNotesState, { x: 100, y: 100, width: 200, height: 200 });
  const second = createNote(first.state, { x: 800, y: 600, width: 150, height: 150 });
  render(
    <NotesProvider initialState={second.state}>
      <Board />
      <StateProbe />
    </NotesProvider>,
  );
  stubBounds(screen.getByRole('main'), { x: 0, y: 0, width: 1000, height: 800 });
  const [firstNote, secondNote] = screen.getAllByRole('article');
  const [firstHandle, secondHandle] = screen.getAllByTitle('Resize');
  if (!firstNote || !secondNote || !firstHandle || !secondHandle) {
    throw new Error('Expected two notes with handles');
  }
  return {
    frames,
    firstNote,
    secondNote,
    firstHandle,
    secondHandle,
    probe: () => screen.getByRole('status'),
  };
};

describe('resizing notes on the board', () => {
  it('gives every note a resize handle', () => {
    setup();

    expect(screen.getAllByTitle('Resize')).toHaveLength(2);
  });

  it('brings the resized note to the front', () => {
    const { firstHandle, probe } = setup();

    fireEvent.pointerDown(firstHandle, { ...POINTER, clientX: 300, clientY: 300 });

    expect(probe()).toHaveTextContent('100,100 200x200 z3 | 800,600 150x150 z2');
  });

  it('does not touch the store while resizing, then commits once on release', () => {
    const { frames, firstNote, firstHandle, probe } = setup();

    fireEvent.pointerDown(firstHandle, { ...POINTER, clientX: 300, clientY: 300 });
    fireEvent.pointerMove(firstHandle, { ...POINTER, clientX: 400, clientY: 350 });
    frames.flush();

    expect(firstNote).toHaveStyle({ width: '300px', height: '250px' });
    expect(probe()).toHaveTextContent('100,100 200x200 z3 | 800,600 150x150 z2');

    fireEvent.pointerUp(firstHandle, { ...POINTER, clientX: 400, clientY: 350 });

    expect(probe()).toHaveTextContent('100,100 300x250 z3 | 800,600 150x150 z2');
  });

  it('resizes without moving the note', () => {
    const { firstNote, firstHandle } = setup();

    fireEvent.pointerDown(firstHandle, { ...POINTER, clientX: 300, clientY: 300 });
    fireEvent.pointerMove(firstHandle, { ...POINTER, clientX: 360, clientY: 340 });
    fireEvent.pointerUp(firstHandle, { ...POINTER, clientX: 360, clientY: 340 });

    expect(firstNote).toHaveStyle({ transform: 'translate3d(100px, 100px, 0)' });
  });

  it('cannot grow a note past the board edge', () => {
    const { secondHandle, probe } = setup();

    fireEvent.pointerDown(secondHandle, { ...POINTER, clientX: 950, clientY: 750 });
    fireEvent.pointerMove(secondHandle, { ...POINTER, clientX: 5000, clientY: 5000 });
    fireEvent.pointerUp(secondHandle, { ...POINTER, clientX: 5000, clientY: 5000 });

    expect(probe()).toHaveTextContent('100,100 200x200 z1 | 800,600 200x200 z2');
  });

  it('leaves the store unchanged when the resize is cancelled with Escape', () => {
    const { frames, firstNote, firstHandle, probe } = setup();

    fireEvent.pointerDown(firstHandle, { ...POINTER, clientX: 300, clientY: 300 });
    fireEvent.pointerMove(firstHandle, { ...POINTER, clientX: 450, clientY: 450 });
    frames.flush();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(firstNote).toHaveStyle({ width: '200px', height: '200px' });
    expect(probe()).toHaveTextContent('100,100 200x200 z3 | 800,600 150x150 z2');
  });

  it('starts a second resize from the size committed by the first', () => {
    const { firstHandle, probe } = setup();

    fireEvent.pointerDown(firstHandle, { ...POINTER, clientX: 300, clientY: 300 });
    fireEvent.pointerMove(firstHandle, { ...POINTER, clientX: 350, clientY: 350 });
    fireEvent.pointerUp(firstHandle, { ...POINTER, clientX: 350, clientY: 350 });
    fireEvent.pointerDown(firstHandle, { ...POINTER, clientX: 350, clientY: 350 });
    fireEvent.pointerMove(firstHandle, { ...POINTER, clientX: 380, clientY: 360 });
    fireEvent.pointerUp(firstHandle, { ...POINTER, clientX: 380, clientY: 360 });

    expect(probe()).toHaveTextContent('100,100 280x260 z3 | 800,600 150x150 z2');
  });
});
