import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotesProvider, useNotesState } from '../state/NotesContext';
import { initialNotesState } from '../state/notesReducer';
import { POINTER } from '../test/dragHarness';
import { createNote, installManualFrames, stubBounds } from '../test/testHelpers';
import { Board } from './Board';

const StateProbe = () => {
  const { notes } = useNotesState();
  return <output>{notes.map((note) => `${note.x},${note.y}`).join(' | ') || 'empty'}</output>;
};

// Board 1000x800: the trash spans x 420..580, y 704..800. Notes are 200x200.
const setup = () => {
  const frames = installManualFrames();
  const first = createNote(initialNotesState, { x: 100, y: 100, width: 200, height: 200 });
  const second = createNote(first.state, { x: 700, y: 100, width: 200, height: 200 });
  render(
    <NotesProvider initialState={second.state}>
      <Board />
      <StateProbe />
    </NotesProvider>,
  );
  const board = screen.getByRole('main');
  stubBounds(board, { x: 0, y: 0, width: 1000, height: 800 });
  const [firstNote] = screen.getAllByRole('article');
  if (firstNote === undefined) {
    throw new Error('Expected notes');
  }
  const dragTo = (x: number, y: number) => {
    fireEvent.pointerDown(firstNote, { ...POINTER, clientX: 150, clientY: 150 });
    fireEvent.pointerMove(firstNote, {
      ...POINTER,
      clientX: 150 + x - 100,
      clientY: 150 + y - 100,
    });
    frames.flush();
  };
  return { frames, board, firstNote, dragTo, probe: () => screen.getByRole('status') };
};

describe('trash zone on the board', () => {
  it('renders the trash zone', () => {
    setup();

    expect(screen.getByLabelText('Trash zone')).toBeInTheDocument();
  });

  it('highlights the board while a dragged note is over the trash', () => {
    const { board, dragTo } = setup();

    dragTo(400, 600);

    expect(board).toHaveAttribute('data-trash-active');
  });

  it('deletes only the dropped note when released over the trash', () => {
    const { dragTo, firstNote, probe, board } = setup();

    dragTo(400, 600);
    fireEvent.pointerUp(firstNote, { ...POINTER, clientX: 450, clientY: 650 });

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(probe()).toHaveTextContent('700,100');
    expect(board).not.toHaveAttribute('data-trash-active');
  });

  it('moves the note normally when released away from the trash', () => {
    const { dragTo, firstNote, probe } = setup();

    dragTo(100, 400);
    fireEvent.pointerUp(firstNote, { ...POINTER, clientX: 150, clientY: 450 });

    expect(probe()).toHaveTextContent('100,400 | 700,100');
  });

  it('does not delete a note that is resized over the trash', () => {
    const first = createNote(initialNotesState, { x: 420, y: 504, width: 200, height: 200 });
    render(
      <NotesProvider initialState={first.state}>
        <Board />
      </NotesProvider>,
    );
    stubBounds(screen.getByRole('main'), { x: 0, y: 0, width: 1000, height: 800 });
    const handle = screen.getByTitle('Resize');

    fireEvent.pointerDown(handle, { ...POINTER, clientX: 620, clientY: 704 });
    fireEvent.pointerMove(handle, { ...POINTER, clientX: 650, clientY: 730 });
    fireEvent.pointerUp(handle, { ...POINTER, clientX: 650, clientY: 730 });

    expect(screen.getAllByRole('article')).toHaveLength(1);
  });
});
