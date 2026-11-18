/**
 * Add-tree entries renamed after trees were saved under their old name: old
 * display name → the entry's key. A tree still carrying the old name keeps
 * the entry's Hindi name. Add a line here when a display name changes.
 */
export const FORMER_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  // Citrus by kind, 2026-11-18
  Lemon: 'citrus',
  'Lemon (Kagzi)': 'citrus:Kagzi',
  'Orange (Kinnow)': 'citrus:kinnow',
};
