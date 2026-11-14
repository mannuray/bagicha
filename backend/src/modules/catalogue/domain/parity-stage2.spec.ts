/**
 * Stage 2 parity: the seed holds exactly today's fruit, life-profile and
 * perennial-flower data. Deleted with the old constants (stage 2 plan, Task 7).
 */
import { PERENNIAL_FLOWERS } from '../../plant-ledger/domain/flower-care';
import { lifeProfileFor } from '../../plant-ledger/domain/species-life-profiles';
import { LEGACY_FRUIT_ALIASES } from '../../plant-ledger/domain/legacy-fruit-aliases';
import { SpeciesResolver } from '../../plant-ledger/domain/species-resolver';
import { FRUIT_CATALOGUE } from '../../plants/domain/fruit-catalogue';
import { CATALOGUE_SEED } from '../seed';
import { Catalogue } from './catalogue';
import { validateSeed } from './schemas';

const OLD_ALIASES = LEGACY_FRUIT_ALIASES;

const hasWords = (haystack: string, alias: string) =>
  ` ${haystack} `.includes(` ${alias} `);

describe('stage 2 seed parity', () => {
  it('fruit plants equal FRUIT_CATALOGUE, in order', () => {
    const seeded = CATALOGUE_SEED.fruitPlants.map(
      ({ status: _s, notes: _n, key: _k, ...rest }) => rest,
    );
    expect(seeded).toEqual(
      FRUIT_CATALOGUE.map((e) => ({
        species_family: e.species_family,
        species: e.species,
        variety: e.variety ?? null,
        display_name: e.display_name,
        plant_type: e.plant_type,
        aliases: e.aliases,
        languages: e.languages ?? null,
        regions: e.regions ?? [],
        confidence_weight: e.confidence_weight ?? 0.5,
      })),
    );
  });

  it('fruit types carry the old matching aliases and life profiles, in order', () => {
    expect(CATALOGUE_SEED.fruitTypes.map((t) => t.key)).toEqual(
      Object.keys(OLD_ALIASES),
    );
    for (const t of CATALOGUE_SEED.fruitTypes) {
      expect(t.match_aliases).toEqual(OLD_ALIASES[t.key]);
      expect(t.life).toEqual(lifeProfileFor(t.key));
    }
  });

  it('perennial flowers equal PERENNIAL_FLOWERS, with the periwinkle note', () => {
    expect(
      CATALOGUE_SEED.perennialFlowers.map(
        ({ status: _s, notes: _n, note_key: _k, ...rest }) => rest,
      ),
    ).toEqual(PERENNIAL_FLOWERS);
    for (const f of CATALOGUE_SEED.perennialFlowers)
      expect(f.note_key).toBe(f.family === 'periwinkle' ? 'periwinkle' : null);
  });

  it('every old alias resolves as the old first-match did', () => {
    const resolver = new SpeciesResolver(
      Catalogue.from(validateSeed(CATALOGUE_SEED), 1),
    );
    for (const alias of Object.values(OLD_ALIASES).flat()) {
      const oldFamily = Object.entries(OLD_ALIASES).find(([, words]) =>
        words.some((a) => hasWords(alias, a)),
      )?.[0];
      expect(resolver.family({ species: alias })).toBe(oldFamily);
    }
  });
});
