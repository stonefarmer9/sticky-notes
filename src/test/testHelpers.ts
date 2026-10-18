import { vi } from 'vitest';

import { createNoteId } from '../domain/noteId';
import type { Note, NoteId, Rect, Size } from '../domain/types';
import { notesReducer, type NotesState } from '../state/notesReducer';

export const BOARD: Size = { width: 1000, height: 800 };

const DEFAULT_RECT: Rect = { x: 100, y: 100, width: 200, height: 200 };

export const deepFreeze = <T extends object>(value: T): T => {
  const children: unknown[] = Object.values(value);
  for (const child of children) {
    if (typeof child === 'object' && child !== null) {
      deepFreeze(child);
    }
  }
  return Object.freeze(value);
};

// States are frozen before and after the reducer runs, so a reducer that mutates its input throws.
export const createNote = (
  state: NotesState,
  rect: Rect = DEFAULT_RECT,
): { state: NotesState; id: NoteId } => {
  const id = createNoteId();
  const next = notesReducer(deepFreeze(state), { type: 'CREATE_NOTE', id, rect, board: BOARD });
  return { id, state: deepFreeze(next) };
};

export const findNote = (state: NotesState, id: NoteId): Note => {
  const note = state.notes.find((candidate) => candidate.id === id);
  if (note === undefined) {
    throw new Error(`Note ${id} not found`);
  }
  return note;
};

// jsdom has no layout, so getBoundingClientRect returns zeros unless an element is given bounds.
export const stubBounds = (element: HTMLElement, bounds: Rect): void => {
  element.getBoundingClientRect = () =>
    new DOMRect(bounds.x, bounds.y, bounds.width, bounds.height);
};

// Replaces requestAnimationFrame so tests decide when a frame runs.
export const installManualFrames = () => {
  const queue = new Map<number, FrameRequestCallback>();
  let nextId = 1;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextId;
    nextId += 1;
    queue.set(id, callback);
    return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue.delete(id);
  });
  return {
    pending: () => queue.size,
    flush: () => {
      const callbacks = [...queue.values()];
      queue.clear();
      callbacks.forEach((callback) => callback(0));
    },
  };
};
