import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MIN_BOARD_SIZE } from '../domain/constants';
import { NotesProvider } from '../state/NotesContext';
import { initialNotesState, type NotesState } from '../state/notesReducer';
import { createNote } from '../state/testHelpers';
import { Board } from './Board';

const renderBoard = (state: NotesState = initialNotesState) =>
  render(
    <NotesProvider initialState={state}>
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

  it('stacks notes with z-index and keeps them in creation order in the DOM', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state);
    renderBoard(second.state);

    const [firstElement, secondElement] = screen.getAllByRole('article');

    expect(firstElement).toHaveStyle({ zIndex: '1' });
    expect(secondElement).toHaveStyle({ zIndex: '2' });
  });
});
