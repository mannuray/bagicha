/**
 * Stage 2 parity: the seed holds exactly today's fruit, life-profile and
 * perennial-flower data. Deleted with the old constants (stage 2 plan, Task 7).
 */
import { PERENNIAL_FLOWERS } from '../../plant-ledger/domain/flower-care';
import { lifeProfileFor } from '../../plant-ledger/domain/species-life-profiles';
import { SpeciesNormalizationService } from '../../plant-ledger/services/species-normalization.service';
import { FRUIT_CATALOGUE } from '../../plants/domain/fruit-catalogue';
import { CATALOGUE_SEED } from '../seed';

const OLD_ALIASES = (
  new SpeciesNormalizationService() as unknown as {
    familyAliases: Record<string, string[]>;
  }
).familyAliases;

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

  it('every old alias resolves to the first seed fruit type that matches it', () => {
    const service = new SpeciesNormalizationService();
    for (const alias of Object.values(OLD_ALIASES).flat()) {
      const first = CATALOGUE_SEED.fruitTypes.find((t) =>
        t.match_aliases.some((a) => hasWords(alias, a)),
      );
      expect(service.resolveSpeciesFamily({ species: alias })).toBe(first?.key);
    }
  });
});
