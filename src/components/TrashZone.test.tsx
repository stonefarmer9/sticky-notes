import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TRASH_ZONE_SIZE } from '../domain/constants';
import { TrashZone } from './TrashZone';

describe('TrashZone', () => {
  it('is labelled and tells the user what to do', () => {
    render(<TrashZone />);

    expect(screen.getByLabelText('Trash zone')).toHaveTextContent('Drop here to delete');
  });

  it('has the size the hit test uses', () => {
    render(<TrashZone />);

    expect(screen.getByLabelText('Trash zone')).toHaveStyle({
      width: `${TRASH_ZONE_SIZE.width}px`,
      height: `${TRASH_ZONE_SIZE.height}px`,
    });
  });
});
