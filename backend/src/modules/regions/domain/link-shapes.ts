import { DISTRICTS, type District } from './districts';

/** A boundary shape as the build reads it: its name, the state it lies in, and a point inside it. */
export interface ShapeRef {
  name: string;
  state: string;
  lng: number;
  lat: number;
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const forms = (d: District) => [d.name, ...d.aliases].map(norm);
const byName = (name: string) => DISTRICTS.find((d) => d.name === name) ?? null;

/**
 * The list entry for a boundary shape: same name or alias in the state the shape
 * lies in, else a name that is unique across India (shapes the state join got
 * wrong). The unnamed area India counts as its own splits at latitude 35:
 * Pakistan-occupied Kashmir (J&K) to the south, Gilgit-Baltistan (Ladakh) to the north.
 */
export function linkShape(shape: ShapeRef): District | null {
  if (shape.name.trim() === 'DATA NOT AVAILABLE')
    return byName(
      shape.lat < 35
        ? 'Pakistan-occupied Kashmir'
        : 'Gilgit-Baltistan and Aksai Chin',
    );
  const name = norm(shape.name);
  const state = norm(shape.state);
  const inState = DISTRICTS.filter(
    (d) => norm(d.state) === state && forms(d).includes(name),
  );
  if (inState.length === 1) return inState[0];
  const anywhere = DISTRICTS.filter((d) => forms(d).includes(name));
  return anywhere.length === 1 ? anywhere[0] : null;
}
