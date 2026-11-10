export interface SpeciesConfig {
  /** Month (1–12, IST) in which a new fruiting cycle starts. */
  cycleStartMonth: number;
}

const DEFAULT_SPECIES_CONFIG: SpeciesConfig = { cycleStartMonth: 1 };

/** Species-specific values. Adding a species is a data change here, not a code change elsewhere. */
export const SPECIES_CONFIG: Readonly<Record<string, SpeciesConfig>> = {
  mango: { cycleStartMonth: 11 },
  litchi: { cycleStartMonth: 11 },
  citrus: { cycleStartMonth: 7 },
  guava: { cycleStartMonth: 6 },
  pomegranate: { cycleStartMonth: 6 },
  banana: { cycleStartMonth: 1 },
};

export function speciesConfigFor(speciesFamily: string): SpeciesConfig {
  return SPECIES_CONFIG[speciesFamily] ?? DEFAULT_SPECIES_CONFIG;
}
