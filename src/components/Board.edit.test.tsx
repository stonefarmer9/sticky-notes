import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { NotesProvider, useNotesState } from '../state/NotesContext';
import { initialNotesState, type NotesState } from '../state/notesReducer';
import { createNote, stubBounds } from '../test/testHelpers';
import { Board } from './Board';

const StateProbe = () => {
  const { notes } = useNotesState();
  return (
    <output>
      {notes.map((note) => (note.text === undefined ? 'none' : `[${note.text}]`)).join(' ')}
    </output>
  );
};

const setup = (state: NotesState = initialNotesState) => {
  render(
    <NotesProvider initialState={state}>
      <Board />
      <StateProbe />
    </NotesProvider>,
  );
  const board = screen.getByRole('main');
  stubBounds(board, { x: 0, y: 0, width: 1000, height: 800 });
  return { board, user: userEvent.setup(), probe: () => screen.getByRole('status') };
};

const withText = (state: NotesState, texts: readonly string[]): NotesState => ({
  notes: state.notes.map((note, index) => ({ ...note, text: texts[index] })),
});

describe('editing notes on the board', () => {
  it('opens a focused editor in a note created by double-click', () => {
    const { board } = setup();

    fireEvent.doubleClick(board, { clientX: 500, clientY: 400 });

    expect(screen.getByRole('textbox', { name: 'Note text' })).toHaveFocus();
  });

  it('keeps what was typed into a new note when the editor loses focus', async () => {
    const { board, user, probe } = setup();

    fireEvent.doubleClick(board, { clientX: 500, clientY: 400 });
    await user.keyboard('Remember the milk');
    await user.tab();

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Remember the milk', { selector: 'p' })).toBeInTheDocument();
    expect(probe()).toHaveTextContent('[Remember the milk]');
  });

  it('edits an existing note when it is double-clicked', async () => {
    const { user, probe } = setup(withText(createNote(initialNotesState).state, ['draft']));

    fireEvent.doubleClick(screen.getByRole('article'));
    expect(screen.getByRole('textbox')).toHaveValue('draft');
    await user.keyboard(' v2');
    await user.tab();

    expect(probe()).toHaveTextContent('[draft v2]');
  });

  it('does not create a second note when an existing note is double-clicked to edit', () => {
    setup(withText(createNote(initialNotesState).state, ['draft']));

    fireEvent.doubleClick(screen.getByRole('article'));

    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('discards the edit on Escape', async () => {
    const { user, probe } = setup(withText(createNote(initialNotesState).state, ['draft']));

    fireEvent.doubleClick(screen.getByRole('article'));
    await user.keyboard(' changed{Escape}');

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(probe()).toHaveTextContent('[draft]');
    expect(screen.getByRole('article')).toHaveFocus();
  });

  it('edits with the keyboard: Enter on a focused note opens the editor', async () => {
    const { user } = setup(withText(createNote(initialNotesState).state, ['draft']));

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('lets only one note be edited at a time', () => {
    const first = createNote(initialNotesState);
    const second = createNote(first.state, { x: 500, y: 300, width: 200, height: 200 });
    setup(second.state);
    const [firstNote, secondNote] = screen.getAllByRole('article');
    if (firstNote === undefined || secondNote === undefined) {
      throw new Error('Expected two notes');
    }

    fireEvent.doubleClick(firstNote);
    fireEvent.doubleClick(secondNote);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('can clear a note: an empty edit is saved as empty text', async () => {
    const { user, probe } = setup(withText(createNote(initialNotesState).state, ['draft']));

    fireEvent.doubleClick(screen.getByRole('article'));
    await user.clear(screen.getByRole('textbox'));
    await user.tab();

    expect(probe()).toHaveTextContent('[]');
    expect(screen.getByRole('article')).toHaveTextContent('');
  });
});
