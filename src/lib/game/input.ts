/** Preserve native keyboard activation, focused inputs, shortcuts and key repeat. */
export function ignoreGameKey(event: KeyboardEvent): boolean {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return true;
  return (
    event.target instanceof Element &&
    Boolean(
      event.target.closest(
        "input, textarea, select, button, a, [contenteditable='true'], [role='slider']",
      ),
    )
  );
}
