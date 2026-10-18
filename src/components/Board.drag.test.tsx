import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotesProvider, useNotesState } from '../state/NotesContext';
import { initialNotesState } from '../state/notesReducer';
import { POINTER } from '../test/dragHarness';
import { createNote, installManualFrames, stubBounds } from '../test/testHelpers';
import { Board } from './Board';

const StateProbe = () => {
  const { notes } = useNotesState();
  return <output>{notes.map((note) => `${note.x},${note.y},z${note.zIndex}`).join(' | ')}</output>;
};

const setup = () => {
  const frames = installManualFrames();
  const first = createNote(initialNotesState, { x: 100, y: 100, width: 200, height: 200 });
  const second = createNote(first.state, { x: 500, y: 300, width: 200, height: 200 });
  render(
    <NotesProvider initialState={second.state}>
      <Board />
      <StateProbe />
    </NotesProvider>,
  );
  stubBounds(screen.getByRole('main'), { x: 0, y: 0, width: 1000, height: 800 });
  const [firstNote, secondNote] = screen.getAllByRole('article');
  if (firstNote === undefined || secondNote === undefined) {
    throw new Error('Expected two notes');
  }
  return { frames, firstNote, secondNote, probe: () => screen.getByRole('status') };
};

describe('dragging notes on the board', () => {
  it('brings the pressed note to the front', () => {
    const { firstNote, probe } = setup();

    fireEvent.pointerDown(firstNote, { ...POINTER, clientX: 150, clientY: 150 });

    expect(probe()).toHaveTextContent('100,100,z3 | 500,300,z2');
    expect(firstNote).toHaveStyle({ zIndex: '3' });
  });

  it('does not touch the store while dragging, then commits once on release', () => {
    const { frames, firstNote, probe } = setup();

    fireEvent.pointerDown(firstNote, { ...POINTER, clientX: 150, clientY: 150 });
    fireEvent.pointerMove(firstNote, { ...POINTER, clientX: 250, clientY: 350 });
    frames.flush();

    expect(firstNote).toHaveStyle({ transform: 'translate3d(200px, 300px, 0)' });
    expect(probe()).toHaveTextContent('100,100,z3 | 500,300,z2');

    fireEvent.pointerUp(firstNote, { ...POINTER, clientX: 250, clientY: 350 });

    expect(probe()).toHaveTextContent('200,300,z3 | 500,300,z2');
    expect(firstNote).toHaveStyle({ transform: 'translate3d(200px, 300px, 0)' });
  });

  it('starts a second drag from the position committed by the first', () => {
    const { firstNote, probe } = setup();

    fireEvent.pointerDown(firstNote, { ...POINTER, clientX: 150, clientY: 150 });
    fireEvent.pointerMove(firstNote, { ...POINTER, clientX: 250, clientY: 250 });
    fireEvent.pointerUp(firstNote, { ...POINTER, clientX: 250, clientY: 250 });
    fireEvent.pointerDown(firstNote, { ...POINTER, clientX: 250, clientY: 250 });
    fireEvent.pointerMove(firstNote, { ...POINTER, clientX: 300, clientY: 270 });
    fireEvent.pointerUp(firstNote, { ...POINTER, clientX: 300, clientY: 270 });

    expect(probe()).toHaveTextContent('250,220,z3 | 500,300,z2');
  });

  it('only moves the dragged note', () => {
    const { firstNote, secondNote } = setup();

    fireEvent.pointerDown(firstNote, { ...POINTER, clientX: 150, clientY: 150 });
    fireEvent.pointerMove(firstNote, { ...POINTER, clientX: 250, clientY: 250 });
    fireEvent.pointerUp(firstNote, { ...POINTER, clientX: 250, clientY: 250 });

    expect(secondNote).toHaveStyle({ transform: 'translate3d(500px, 300px, 0)' });
  });

  it('leaves the store unchanged when the drag is cancelled with Escape', () => {
    const { frames, firstNote, probe } = setup();

    fireEvent.pointerDown(firstNote, { ...POINTER, clientX: 150, clientY: 150 });
    fireEvent.pointerMove(firstNote, { ...POINTER, clientX: 400, clientY: 400 });
    frames.flush();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(firstNote).toHaveStyle({ transform: 'translate3d(100px, 100px, 0)' });
    expect(probe()).toHaveTextContent('100,100,z3 | 500,300,z2');
  });
});
