import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('is a real button that calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('while busy is disabled, marked aria-busy and ignores clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button busy onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('meets the 44px touch target and river-stone shape', () => {
    render(<Button variant="secondary">Go</Button>);
    const button = screen.getByRole('button', { name: 'Go' });
    expect(button).toHaveClass('min-h-11', 'rounded-full');
  });

  it('has a small size for in-card actions: shorter, smaller text, a softer shadow', () => {
    render(<Button size="sm">Done</Button>);
    const button = screen.getByRole('button', { name: 'Done' });
    expect(button.className).toMatch(/\bmin-h-10\b/);
    expect(button.className).toMatch(/\btext-xs\b/);
    expect(button.className).not.toMatch(/\bmin-h-11\b/);
    expect(button.className).not.toMatch(/shadow-\[0_8px_40px/);
  });
});
