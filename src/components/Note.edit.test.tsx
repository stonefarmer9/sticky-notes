import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { createNoteId } from '../domain/noteId';
import type { Note as NoteModel } from '../domain/types';
import { POINTER } from '../test/dragHarness';
import { createNoteActions } from '../test/testHelpers';
import { Note } from './Note';

const NOTE: NoteModel = {
  id: createNoteId(),
  x: 0,
  y: 0,
  width: 240,
  height: 160,
  zIndex: 1,
  text: 'Buy milk',
};

const setup = (isEditing: boolean, note: NoteModel = NOTE) => {
  const actions = createNoteActions();
  render(<Note note={note} isEditing={isEditing} actions={actions} />);
  return { actions, user: userEvent.setup() };
};

describe('Note editing: entering edit mode', () => {
  it('starts editing on double-click', () => {
    const { actions } = setup(false);

    fireEvent.doubleClick(screen.getByRole('article'));

    expect(actions.startEditing).toHaveBeenCalledExactlyOnceWith(NOTE.id);
  });

  it('starts editing when Enter is pressed on the focused note', async () => {
    const { actions, user } = setup(false);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('article')).toHaveFocus();
    expect(actions.startEditing).toHaveBeenCalledExactlyOnceWith(NOTE.id);
  });

  it('does not start editing when the resize handle is double-clicked', () => {
    const { actions } = setup(false);

    fireEvent.doubleClick(screen.getByTitle('Resize'));

    expect(actions.startEditing).not.toHaveBeenCalled();
  });

  it('shows a text field instead of the text while editing', () => {
    setup(true);

    expect(screen.getByRole('textbox', { name: 'Note text' })).toHaveValue('Buy milk');
    expect(screen.queryByText('Buy milk', { selector: 'p' })).not.toBeInTheDocument();
  });

  it('focuses the text field when editing starts', () => {
    setup(true);

    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});

describe('Note editing: leaving edit mode', () => {
  it('saves changed text and stops editing on blur', async () => {
    const { actions, user } = setup(true);

    await user.type(screen.getByRole('textbox'), ' and eggs');
    await user.tab();

    expect(actions.updateText).toHaveBeenCalledExactlyOnceWith(NOTE.id, 'Buy milk and eggs');
    expect(actions.stopEditing).toHaveBeenCalledOnce();
  });

  it('stops editing without saving when the text is unchanged', async () => {
    const { actions, user } = setup(true);

    await user.tab();

    expect(actions.updateText).not.toHaveBeenCalled();
    expect(actions.stopEditing).toHaveBeenCalledOnce();
  });

  it('treats a note without text as an empty string', async () => {
    const { actions, user } = setup(true, { ...NOTE, text: undefined });

    await user.tab();

    expect(actions.updateText).not.toHaveBeenCalled();
  });

  it('discards the edit on Escape and returns focus to the note', async () => {
    const { actions, user } = setup(true);

    await user.type(screen.getByRole('textbox'), ' and eggs');
    await user.keyboard('{Escape}');

    expect(actions.updateText).not.toHaveBeenCalled();
    expect(actions.stopEditing).toHaveBeenCalledOnce();
    expect(screen.getByRole('article')).toHaveFocus();
  });

  it('lets Enter insert a new line instead of saving', async () => {
    const { actions, user } = setup(true);

    await user.type(screen.getByRole('textbox'), '{Enter}more');

    expect(screen.getByRole('textbox')).toHaveValue('Buy milk\nmore');
    expect(actions.stopEditing).not.toHaveBeenCalled();
    expect(actions.startEditing).not.toHaveBeenCalled();
  });
});

describe('Note editing and dragging', () => {
  it('does not start a drag when the press is inside the text field', () => {
    const { actions } = setup(true);

    fireEvent.pointerDown(screen.getByRole('textbox'), { ...POINTER, clientX: 10, clientY: 10 });

    expect(screen.getByRole('article')).not.toHaveAttribute('data-dragging');
    expect(actions.bringToFront).not.toHaveBeenCalled();
  });
});
