import type { FormEvent } from 'react';

/** A form's onSubmit for a ViewModel command: stops the browser's submit, then runs it. */
export function formSubmit(command: () => unknown) {
  return (event: FormEvent) => {
    event.preventDefault();
    void command();
  };
}
