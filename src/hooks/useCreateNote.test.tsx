import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_NOTE_SIZE } from '../domain/constants';
import { stubBounds } from '../test/testHelpers';
import { useCreateNote } from './useCreateNote';

const AREA = { x: 100, y: 50, width: 1000, height: 800 };

const renderArea = (onCreate: () => void) => {
  const Area = () => {
    const { onDoubleClick } = useCreateNote({ onCreate });
    return (
      <section aria-label="area" onDoubleClick={onDoubleClick}>
        <button type="button">child</button>
      </section>
    );
  };
  render(<Area />);
  const area = screen.getByRole('region', { name: 'area' });
  stubBounds(area, AREA);
  return area;
};

describe('useCreateNote', () => {
  it('reports a default-size rect centered on the pointer, relative to the element', () => {
    const onCreate = vi.fn();
    const area = renderArea(onCreate);

    fireEvent.doubleClick(area, { clientX: 600, clientY: 450 });

    expect(onCreate).toHaveBeenCalledExactlyOnceWith(
      {
        x: 600 - AREA.x - DEFAULT_NOTE_SIZE.width / 2,
        y: 450 - AREA.y - DEFAULT_NOTE_SIZE.height / 2,
        ...DEFAULT_NOTE_SIZE,
      },
      { width: AREA.width, height: AREA.height },
    );
  });

  it('does not clamp: that is left to the reducer', () => {
    const onCreate = vi.fn();
    const area = renderArea(onCreate);

    fireEvent.doubleClick(area, { clientX: AREA.x, clientY: AREA.y });

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        x: -DEFAULT_NOTE_SIZE.width / 2,
        y: -DEFAULT_NOTE_SIZE.height / 2,
      }),
      expect.anything(),
    );
  });

  it('ignores double-clicks that start on a child element', () => {
    const onCreate = vi.fn();
    renderArea(onCreate);

    fireEvent.doubleClick(screen.getByRole('button', { name: 'child' }));

    expect(onCreate).not.toHaveBeenCalled();
  });
});
