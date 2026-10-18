import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_NOTE_COLOR } from '../domain/constants';
import { createNoteId } from '../domain/noteId';
import { NOTE_COLORS, type Note as NoteModel } from '../domain/types';
import { NOTE_COLOR_VALUES } from '../styles/noteColors';
import { Note } from './Note';

const BASE_NOTE: NoteModel = {
  id: createNoteId(),
  x: 120,
  y: 80,
  width: 240,
  height: 160,
  zIndex: 7,
};

describe('Note', () => {
  it('is positioned with a transform and sized from the model', () => {
    render(<Note note={BASE_NOTE} />);

    expect(screen.getByRole('article')).toHaveStyle({
      transform: 'translate3d(120px, 80px, 0)',
      width: '240px',
      height: '160px',
      zIndex: '7',
    });
  });

  it('renders the text', () => {
    render(<Note note={{ ...BASE_NOTE, text: 'Buy milk' }} />);

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('uses the default color when none is set', () => {
    render(<Note note={BASE_NOTE} />);

    expect(screen.getByRole('article')).toHaveStyle({
      backgroundColor: NOTE_COLOR_VALUES[DEFAULT_NOTE_COLOR],
    });
  });

  it.each(NOTE_COLORS)('renders the %s color', (color) => {
    render(<Note note={{ ...BASE_NOTE, color }} />);

    expect(screen.getByRole('article')).toHaveStyle({
      backgroundColor: NOTE_COLOR_VALUES[color],
    });
  });

  it('has an accessible name', () => {
    render(<Note note={BASE_NOTE} />);

    expect(screen.getByRole('article', { name: 'Sticky note' })).toBeInTheDocument();
  });
});
