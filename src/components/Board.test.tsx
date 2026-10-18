import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { MIN_BOARD_SIZE } from '../domain/constants';
import type { NoteId } from '../domain/types';
import { NotesProvider, useNotesDispatch } from '../state/NotesContext';
import { initialNotesState, type NotesState } from '../state/notesReducer';
import { createNote } from '../test/testHelpers';
import { Board } from './Board';

const DeleteButton = ({ id }: { readonly id: NoteId }) => {
  const dispatch = useNotesDispatch();
  return (
    <button type="button" onClick={() => dispatch({ type: 'DELETE_NOTE', id })}>
      delete
    </button>
  );
};

const renderBoard = (state: NotesState = initialNotesState, extra?: ReactNode) =>
  render(
    <NotesProvider initialState={state}>
      {extra}
      <Board />
    </NotesProvider>,
  );

describe('Board', () => {
  it('renders an empty board without notes', () => {
    renderBoard();

    expect(screen.getByRole('main', { name: 'Sticky notes board' })).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('enforces the minimum board size', () => {
    renderBoard();

    expect(screen.getByRole('main')).toHaveStyle({
      minWidth: `${MIN_BOARD_SIZE.width}px`,
      minHeight: `${MIN_BOARD_SIZE.height}px`,
    });
  });

  it('renders one element per note', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state, { x: 400, y: 300, width: 250, height: 150 });
    renderBoard(second.state);

    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('renders notes in creation order', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);
    renderBoard({
      notes: second.state.notes.map((note, index) => ({ ...note, text: `note ${index + 1}` })),
    });

    expect(screen.getAllByRole('article').map((element) => element.textContent)).toEqual([
      'note 1',
      'note 2',
    ]);
  });

  it('stacks notes with z-index', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);
    renderBoard(second.state);

    const [firstElement, secondElement] = screen.getAllByRole('article');

    expect(firstElement).toHaveStyle({ zIndex: '1' });
    expect(secondElement).toHaveStyle({ zIndex: '2' });
  });

  it('keeps the DOM node of a remaining note when another note is deleted', async () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state, { x: 400, y: 300, width: 200, height: 200 });
    renderBoard(second.state, <DeleteButton id={first.id} />);
    const [, remaining] = screen.getAllByRole('article');

    await userEvent.click(screen.getByRole('button', { name: 'delete' }));

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(remaining?.isConnected).toBe(true);
  });
});
