import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders the Sticky Notes text', () => {
    render(<App />);

    expect(screen.getByText('Sticky Notes')).toBeInTheDocument();
  });
});
