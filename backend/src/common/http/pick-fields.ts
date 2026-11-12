/**
 * Copies only the listed fields: the building block of response allow-lists.
 * A field not on the list never reaches a client, whatever the row grows to hold.
 */
export function pickFields<T extends object, K extends keyof T>(
  row: T,
  fields: readonly K[],
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const field of fields) if (field in row) out[field] = row[field];
  return out;
}
