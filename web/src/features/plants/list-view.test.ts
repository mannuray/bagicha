import { describe, expect, it } from 'vitest';
import { listView } from './list-view';

const params = (q: string) => new URLSearchParams(q);

describe('listView: what the plant list opens on, from its link', () => {
  it('defaults to all growing plants', () => {
    expect(listView(params(''))).toEqual({ group: 'all', status: 'active', kind: undefined });
  });

  it('reads the group and tab from Home\'s links', () => {
    expect(listView(params('group=crops&tab=planned'))).toEqual({ group: 'crops', status: 'planned', kind: 'crop' });
    expect(listView(params('group=flowers&tab=ended'))).toEqual({ group: 'flowers', status: 'ended', kind: 'flower' });
    expect(listView(params('group=trees'))).toEqual({ group: 'trees', status: 'active', kind: 'tree' });
  });

  it('ignores anything it does not know', () => {
    expect(listView(params('group=rocks&tab=sold'))).toEqual({ group: 'all', status: 'active', kind: undefined });
  });
});
