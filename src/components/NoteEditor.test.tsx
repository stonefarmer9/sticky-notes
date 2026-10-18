import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { POINTER } from '../test/dragHarness';
import { NoteEditor } from './NoteEditor';

const setup = (initialText = 'hello') => {
  const onCommit = vi.fn();
  const onCancel = vi.fn();
  const onPointerDown = vi.fn();
  render(
    <div onPointerDown={onPointerDown}>
      <NoteEditor initialText={initialText} onCommit={onCommit} onCancel={onCancel} />
    </div>,
  );
  return { onCommit, onCancel, onPointerDown, textbox: screen.getByRole('textbox') };
};

describe('NoteEditor', () => {
  it('focuses the field with the caret at the end of the text', () => {
    const { textbox } = setup('hello');

    expect(textbox).toHaveFocus();
    expect(textbox).toHaveProperty('selectionStart', 5);
    expect(textbox).toHaveProperty('selectionEnd', 5);
  });

  it('commits the current text once on blur', async () => {
    const { onCommit, onCancel } = setup('hello');

    await userEvent.keyboard(' world');
    fireEvent.blur(screen.getByRole('textbox'));
    fireEvent.blur(screen.getByRole('textbox'));

    expect(onCommit).toHaveBeenCalledExactlyOnceWith('hello world');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels on Escape and ignores the blur that can follow', async () => {
    const { onCommit, onCancel, textbox } = setup('hello');

    await userEvent.keyboard('!{Escape}');
    fireEvent.blur(textbox);

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits on blur when focus moves with Tab and does not cancel', async () => {
    const { onCommit, onCancel } = setup();

    await userEvent.keyboard('abc{Tab}');

    expect(onCancel).not.toHaveBeenCalled();
    expect(onCommit).toHaveBeenCalledOnce();
  });

  it('keeps pointer presses from reaching ancestors', () => {
    const { onPointerDown, textbox } = setup();

    fireEvent.pointerDown(textbox, { ...POINTER, clientX: 1, clientY: 1 });

    expect(onPointerDown).not.toHaveBeenCalled();
  });
});
