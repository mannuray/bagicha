import { LogType, Prisma } from '@prisma/client';
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

describe('buildCycleSnapshot yield: the season total', () => {
  const harvest = (metadata: Prisma.JsonObject, day: number) => ({
    type: LogType.HARVEST,
    metadata,
    timestamp: new Date(Date.UTC(2026, 5, day)),
  });

  it('sums every harvest in the latest harvest unit', () => {
    const s = buildCycleSnapshot([
      harvest({ quantity_value: 10, quantity_unit: 'kg' }, 1),
      harvest({ quantity_value: 15, quantity_unit: 'kg' }, 8),
      harvest({ quantity_value: 5, quantity_unit: 'kg', quality: 'good' }, 15),
    ]);
    expect(s.yield_quantity).toBe(30);
    expect(s.yield_unit).toBe('kg');
    expect(s.yield_quality).toBe('GOOD');
  });

  it('leaves out harvests in another unit', () => {
    const s = buildCycleSnapshot([
      harvest({ quantity_value: 10, quantity_unit: 'kg' }, 1),
      harvest({ quantity_value: 3, quantity_unit: 'crates' }, 8),
      harvest({ quantity_value: 5, quantity_unit: 'kg' }, 15),
    ]);
    expect(s.yield_quantity).toBe(15);
    expect(s.yield_unit).toBe('kg');
  });

  it('reads the legacy quantity string', () => {
    const s = buildCycleSnapshot([
      harvest({ quantity: '4 kg' }, 1),
      harvest({ quantity_value: 6, quantity_unit: 'kg' }, 8),
    ]);
    expect(s.yield_quantity).toBe(10);
  });

  it('has no yield when no harvest carries an amount', () => {
    const s = buildCycleSnapshot([harvest({ quality: 'fair' }, 1)]);
    expect(s.yield_quantity).toBeNull();
  });
});

describe('buildCycleSnapshot yield: a harvest without an amount', () => {
  it('keeps the season total when the last harvest only notes quality', () => {
    const at = (day: number) => new Date(Date.UTC(2026, 5, day));
    const s = buildCycleSnapshot([
      {
        type: LogType.HARVEST,
        metadata: { quantity_value: 10, quantity_unit: 'kg' },
        timestamp: at(1),
      },
      {
        type: LogType.HARVEST,
        metadata: { quantity_value: 15, quantity_unit: 'kg' },
        timestamp: at(8),
      },
      {
        type: LogType.HARVEST,
        metadata: { quality: 'good' },
        timestamp: at(15),
      },
    ]);
    expect(s.yield_quantity).toBe(25);
    expect(s.yield_unit).toBe('kg');
  });
});
