/** "Spinach (Palak)" → "Palak": the everyday name gardeners use. */
export function shortName(crop: { name: string }): string {
  return /\(([^)]+)\)/.exec(crop.name)?.[1] ?? crop.name;
}
