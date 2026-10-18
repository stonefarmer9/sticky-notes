import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createNoteId } from '../domain/noteId';
import { NotesProvider, useNotesDispatch, useNotesState } from './NotesContext';
import { initialNotesState, type NotesState } from './notesReducer';
import { BOARD, createNote } from '../test/testHelpers';

const useNotesContext = () => ({ state: useNotesState(), dispatch: useNotesDispatch() });

const wrapperWith =
  (initialState?: NotesState) =>
  ({ children }: { children: ReactNode }) => (
    <NotesProvider initialState={initialState}>{children}</NotesProvider>
  );

describe('NotesProvider', () => {
  it('starts empty by default', () => {
    const { result } = renderHook(useNotesContext, { wrapper: wrapperWith() });

    expect(result.current.state.notes).toEqual([]);
  });

  it('starts from the provided initial state', () => {
    const { state } = createNote(initialNotesState);
    const { result } = renderHook(useNotesContext, { wrapper: wrapperWith(state) });

    expect(result.current.state).toBe(state);
  });

  it('applies dispatched actions to the state', () => {
    const { result } = renderHook(useNotesContext, { wrapper: wrapperWith() });
    const id = createNoteId();

    act(() => {
      result.current.dispatch({
        type: 'CREATE_NOTE',
        id,
        rect: { x: 10, y: 20, width: 200, height: 200 },
        board: BOARD,
      });
    });

    expect(result.current.state.notes).toHaveLength(1);
    expect(result.current.state.notes[0]).toMatchObject({ id, x: 10, y: 20 });
  });

  it('keeps the dispatch function stable across state changes', () => {
    const { result } = renderHook(useNotesContext, { wrapper: wrapperWith() });
    const { dispatch } = result.current;

    act(() => {
      dispatch({
        type: 'CREATE_NOTE',
        id: createNoteId(),
        rect: { x: 0, y: 0, width: 200, height: 200 },
        board: BOARD,
      });
    });

    expect(result.current.dispatch).toBe(dispatch);
  });
});

describe('split contexts', () => {
  it('does not re-render dispatch-only consumers when the notes change', async () => {
    const onDispatchRender = vi.fn();
    const onStateRender = vi.fn();
    const DispatchOnly = () => {
      onDispatchRender();
      const dispatch = useNotesDispatch();
      return (
        <button
          type="button"
          onClick={() =>
            dispatch({
              type: 'CREATE_NOTE',
              id: createNoteId(),
              rect: { x: 0, y: 0, width: 200, height: 200 },
              board: BOARD,
            })
          }
        >
          add
        </button>
      );
    };
    const StateOnly = () => {
      onStateRender();
      return <output>{useNotesState().notes.length}</output>;
    };
    render(
      <NotesProvider>
        <DispatchOnly />
        <StateOnly />
      </NotesProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'add' }));

    expect(screen.getByRole('status')).toHaveTextContent('1');
    expect(onStateRender).toHaveBeenCalledTimes(2);
    expect(onDispatchRender).toHaveBeenCalledTimes(1);
  });
});

describe('context hooks outside a provider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('useNotesState throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(useNotesState)).toThrow(/NotesProvider/);
  });

  it('useNotesDispatch throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(useNotesDispatch)).toThrow(/NotesProvider/);
  });
});
