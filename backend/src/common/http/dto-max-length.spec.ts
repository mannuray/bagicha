import 'reflect-metadata';
import { getMetadataStorage } from 'class-validator';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

/** Validators that already cap a string's length. */
const BOUNDED = new Set([
  'maxLength',
  'isLength',
  'isUuid',
  'isIn',
  'isEnum',
  'isPhoneNumber',
  'isMobilePhone',
  'isDateString',
  'isIso8601',
  'matches',
]);

function dtoFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return dtoFiles(full);
    return /dto/.test(full) &&
      full.endsWith('.ts') &&
      !full.endsWith('.spec.ts')
      ? [full]
      : [];
  });
}

type Meta = { propertyName: string; name?: string; type: string };

describe('request DTOs', () => {
  it('cap every free-text string (long input is storage, log and AI cost)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    dtoFiles(join(__dirname, '../..')).forEach((file) => require(file));
    const storage = getMetadataStorage() as unknown as {
      validationMetadatas: Map<object, Meta[]>;
    };
    const unbounded: string[] = [];
    for (const [target, list] of storage.validationMetadatas) {
      const byProp = new Map<string, Set<string>>();
      for (const m of list) {
        const set = byProp.get(m.propertyName) ?? new Set<string>();
        set.add(m.name ?? m.type);
        byProp.set(m.propertyName, set);
      }
      for (const [prop, names] of byProp) {
        if (!names.has('isString')) continue;
        if ([...names].some((n) => BOUNDED.has(n))) continue;
        unbounded.push(`${(target as { name: string }).name}.${prop}`);
      }
    }
    expect(unbounded).toEqual([]);
  });
});
