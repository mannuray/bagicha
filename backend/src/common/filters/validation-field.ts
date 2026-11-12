/** The field a class-validator message names, so a form can mark the right input. */
export function validationField(message: string): string {
  const property = /^property (\S+) should not exist/.exec(message);
  if (property) return property[1];
  const each = /^each value in (\S+)/.exec(message);
  if (each) return each[1];
  const first = /^([A-Za-z_][\w.]*)\s/.exec(message);
  return first ? first[1] : 'unknown';
}
