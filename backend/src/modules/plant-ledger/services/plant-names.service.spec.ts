import { hindiSeed, seededCatalogueStore } from '../../catalogue/testing';
import { toPlantView } from '../domain/plant-view';
import { mapTaskView } from '../domain/task-view';
import { PlantNamesService } from './plant-names.service';

const names = new PlantNamesService(seededCatalogueStore(hindiSeed()));
const tomato = {
  id: 'p1',
  name: 'Tomato',
  crop_id: 'tomato',
  species_family: null,
};

describe('plant names in the request language', () => {
  it('shows the Hindi name beside the saved one, never instead of it', async () => {
    const view = toPlantView(tomato, await names.namer('hi'));
    expect(view.name).toBe('Tomato');
    expect(view.display_name).toBe('टमाटर');
  });

  it('shows a renamed plant as written', async () => {
    const view = toPlantView(
      { ...tomato, name: "Dadi's tomato" },
      await names.namer('hi'),
    );
    expect(view.display_name).toBe("Dadi's tomato");
  });

  it('names the plants it replaces, or was replaced by, the same way', async () => {
    const view = toPlantView(
      {
        ...tomato,
        replaced_by: { ...tomato, id: 'p2' },
        replaces: [{ ...tomato, id: 'p0', name: "Dadi's tomato" }],
      },
      await names.namer('hi'),
    );
    expect(view.replaced_by).toMatchObject({
      id: 'p2',
      name: 'Tomato',
      display_name: 'टमाटर',
    });
    expect(view.replaces).toEqual([
      expect.objectContaining({ id: 'p0', display_name: "Dadi's tomato" }),
    ]);
  });

  it('shows the saved name in English', async () => {
    expect(toPlantView(tomato, await names.namer('en')).display_name).toBe(
      'Tomato',
    );
    expect(toPlantView(tomato).display_name).toBe('Tomato');
  });

  it("names a reminder's plant in Hindi", async () => {
    const task = {
      id: 't1',
      type: 'WATER',
      title: 'Water it',
      category: 'WATERING',
      priority: 'MEDIUM',
      status: 'PENDING',
      source: 'SYSTEM',
      reason: null,
      due_date: new Date(),
      completed_at: null,
      plant_cycle_id: null,
      plant: { ...tomato, record_kind: 'CROP' },
    } as unknown as Parameters<typeof mapTaskView>[0];
    expect(mapTaskView(task, await names.namer('hi')).tree_name).toBe('टमाटर');
    expect(mapTaskView(task).tree_name).toBe('Tomato');
  });

  describe('reminder titles', () => {
    const base = {
      id: 't1',
      type: 'OBSERVE',
      category: 'OBSERVATION',
      priority: 'MEDIUM',
      status: 'PENDING',
      reason: null,
      due_date: new Date(),
      completed_at: null,
      plant_cycle_id: null,
      plant: { ...tomato, record_kind: 'CROP' },
    };
    const task = (over: Record<string, unknown>) =>
      ({ ...base, ...over }) as unknown as Parameters<typeof mapTaskView>[0];

    it('writes a crop reminder in Hindi from its saved sentence', async () => {
      const t = task({
        source: 'CROP_PLAN',
        title: 'Stake the tomato plants',
        metadata: {
          crop_id: 'tomato',
          step: 'stake',
          title: { key: 'care', crop: 'tomato', step: 'stake' },
        },
      });
      const hi = mapTaskView(
        t,
        await names.namer('hi'),
        await names.titler('hi'),
      );
      expect(hi.title).toBe('टमाटर के पौधों को डंडी से सहारा दें');
      const en = mapTaskView(
        t,
        await names.namer('en'),
        await names.titler('en'),
      );
      expect(en.title).toBe('Stake the tomato plants');
    });

    it('keeps an older crop reminder with no saved sentence in English', async () => {
      const t = task({
        source: 'CROP_PLAN',
        title: 'Stake the tomato plants',
        metadata: { crop_id: 'tomato', step: 'stake' },
      });
      expect(
        mapTaskView(t, await names.namer('hi'), await names.titler('hi')).title,
      ).toBe('Stake the tomato plants');
    });

    it('writes perennial flower care and untitled reminders in Hindi', async () => {
      const flower = task({
        source: 'FLOWER_CARE',
        title: 'Prune the rose',
        source_key: 'rose:prune:2026-10',
      });
      expect(
        mapTaskView(flower, await names.namer('hi'), await names.titler('hi'))
          .title,
      ).toMatch(/गुलाब/);
      const untitled = task({ source: 'SYSTEM', type: 'WATER', title: null });
      expect(
        mapTaskView(untitled, await names.namer('hi'), await names.titler('hi'))
          .title,
      ).toBe('पौधे को पानी दें');
      expect(mapTaskView(untitled).title).toBe('Water the plant');
    });

    it('leaves tree care and typed reminders as saved', async () => {
      const t = task({ source: 'TREE_CARE', title: 'Bag the guava fruits' });
      expect(
        mapTaskView(t, await names.namer('hi'), await names.titler('hi')).title,
      ).toBe('Bag the guava fruits');
    });
  });
});
