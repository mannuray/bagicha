import { describe, expect, it } from 'vitest';
import { filterCalendar } from './names';

const crop = (id: string, over: Record<string, unknown> = {}) => ({
  id, name: id, aliases: [] as string[], kind: 'CROP', status: 'open', tags: [] as string[], sun: 'FULL' as 'FULL' | 'PARTIAL', ...over,
});

describe('filterCalendar: what the sowing calendar shows', () => {
  const items = [
    crop('okra', { tags: ['beginner'] }),
    crop('spinach', { status: 'soon', sun: 'PARTIAL', tags: ['container', 'quick'] }),
    crop('cabbage', { status: 'later' }),
    crop('marigold', { kind: 'FLOWER', tags: ['long'] }),
  ];

  it('splits one kind into open, soon and later', () => {
    const r = filterCalendar(items, { kind: 'CROP', query: '', filters: [], sun: null });
    expect([r.open, r.soon, r.later].map((l) => l.map((c) => c.id))).toEqual([['okra'], ['spinach'], ['cabbage']]);
  });

  it('every tag filter must match, and search narrows by name', () => {
    expect(filterCalendar(items, { kind: 'CROP', query: '', filters: ['container', 'quick'], sun: null }).soon.map((c) => c.id)).toEqual(['spinach']);
    expect(filterCalendar(items, { kind: 'CROP', query: 'ok', filters: [], sun: null }).open.map((c) => c.id)).toEqual(['okra']);
  });

  it('the sun filter keeps crops that suit the sunniest place (and is ignored with no places)', () => {
    expect(filterCalendar(items, { kind: 'CROP', query: '', filters: ['sun'], sun: 'PARTIAL' }).open).toEqual([]);
    expect(filterCalendar(items, { kind: 'CROP', query: '', filters: ['sun'], sun: null }).open.map((c) => c.id)).toEqual(['okra']);
  });

  it('flowers are their own view', () => {
    expect(filterCalendar(items, { kind: 'FLOWER', query: '', filters: ['long'], sun: null }).open.map((c) => c.id)).toEqual(['marigold']);
  });
});
