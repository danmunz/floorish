import type { FocusEvent } from 'react';

export function selectAllOnFocus(event: FocusEvent<HTMLInputElement>) {
  try {
    event.target.select();
  } catch {
    // Some browsers do not support text selection APIs on number inputs.
  }
}