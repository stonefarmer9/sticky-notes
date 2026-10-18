import { useCallback, type MouseEvent } from 'react';

import { DEFAULT_NOTE_SIZE } from '../domain/constants';
import { originCenteredOn } from '../domain/geometry';
import type { Rect, Size } from '../domain/types';

interface UseCreateNoteOptions {
  readonly onCreate: (rect: Rect, board: Size) => void;
}

// Clamping to the board is the reducer's job; the hook only reports where the user clicked.
export const useCreateNote = ({ onCreate }: UseCreateNoteOptions) => {
  const onDoubleClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }
      const bounds = event.currentTarget.getBoundingClientRect();
      const origin = originCenteredOn(
        { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
        DEFAULT_NOTE_SIZE,
      );
      onCreate({ ...origin, ...DEFAULT_NOTE_SIZE }, { width: bounds.width, height: bounds.height });
    },
    [onCreate],
  );

  return { onDoubleClick };
};
