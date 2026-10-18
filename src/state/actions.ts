import type { NoteId, Point, Rect, Size } from '../domain/types';

// The caller generates the id so the reducer stays deterministic.
export interface CreateNoteAction {
  readonly type: 'CREATE_NOTE';
  readonly id: NoteId;
  readonly rect: Rect;
  readonly board: Size;
}

export interface MoveNoteAction {
  readonly type: 'MOVE_NOTE';
  readonly id: NoteId;
  readonly position: Point;
  readonly board: Size;
}

export interface ResizeNoteAction {
  readonly type: 'RESIZE_NOTE';
  readonly id: NoteId;
  readonly size: Size;
  readonly board: Size;
}

export interface DeleteNoteAction {
  readonly type: 'DELETE_NOTE';
  readonly id: NoteId;
}

export interface BringToFrontAction {
  readonly type: 'BRING_TO_FRONT';
  readonly id: NoteId;
}

export type NotesAction =
  CreateNoteAction | MoveNoteAction | ResizeNoteAction | DeleteNoteAction | BringToFrontAction;
