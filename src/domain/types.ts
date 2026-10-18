export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export type Rect = Point & Size;

export type NoteId = string & { readonly __brand: 'NoteId' };

export const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green', 'orange'] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

export interface Note extends Rect {
  readonly id: NoteId;
  readonly zIndex: number;
  readonly text?: string;
  readonly color?: NoteColor;
}
