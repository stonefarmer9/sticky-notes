import type { NoteColor } from '../domain/types';

// Record<NoteColor, ...> makes adding a color to NOTE_COLORS a compile error until it has a value.
export const NOTE_COLOR_VALUES: Readonly<Record<NoteColor, string>> = {
  yellow: '#fff3a3',
  pink: '#ffc2d4',
  blue: '#bfe3ff',
  green: '#c7f0c2',
  orange: '#ffd6a0',
};
