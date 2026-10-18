import type { NoteColor, Size } from './types';

export const DEFAULT_NOTE_SIZE: Size = { width: 200, height: 200 };
export const MIN_NOTE_SIZE: Size = { width: 120, height: 100 };
export const MAX_NOTE_SIZE: Size = { width: 600, height: 600 };
export const DEFAULT_NOTE_COLOR: NoteColor = 'yellow';

export const TRASH_ZONE_SIZE: Size = { width: 160, height: 96 };
export const MIN_BOARD_SIZE: Size = { width: 1024, height: 768 };
