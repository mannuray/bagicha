import { describe, expect, it, vi } from 'vitest';
import type { FormEvent } from 'react';
import { formSubmit } from './form-submit';

describe('formSubmit', () => {
  it('stops the browser submit and runs the command', () => {
    const command = vi.fn();
    const event = { preventDefault: vi.fn() } as unknown as FormEvent;
    formSubmit(command)(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(command).toHaveBeenCalledTimes(1);
  });
});
