import golden from './__fixtures__/golden.json';
import { CYCLE_ENTRY_FIXTURES } from './__fixtures__/inputs';
import { buildCycleSnapshot } from './cycle-summary';

const normalize = (v: unknown) => JSON.parse(JSON.stringify(v)) as unknown;

describe('buildCycleSnapshot (golden: identical to the pre-refactor service)', () => {
  it.each(Object.keys(CYCLE_ENTRY_FIXTURES))('%s cycle', (name) => {
    const snapshot = buildCycleSnapshot(
      CYCLE_ENTRY_FIXTURES[name] as Parameters<typeof buildCycleSnapshot>[0],
    );
    expect(normalize(snapshot)).toEqual(
      (golden.cycles as Record<string, unknown>)[name],
    );
  });
});
