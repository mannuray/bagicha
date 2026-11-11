export type ListStatus = 'active' | 'planned' | 'ended';
export type ListGroup = 'all' | 'trees' | 'crops' | 'flowers';
export const LIST_GROUPS: ListGroup[] = ['all', 'trees', 'crops', 'flowers'];

const KIND = { trees: 'tree', crops: 'crop', flowers: 'flower' } as const;

/** What the plant list opens on, from its link (Home links with ?group= and &tab=); unknown values are ignored. */
export function listView(params: URLSearchParams): { group: ListGroup; status: ListStatus; kind: 'tree' | 'crop' | 'flower' | undefined } {
  const rawGroup = params.get('group');
  const group: ListGroup = LIST_GROUPS.includes(rawGroup as ListGroup) ? (rawGroup as ListGroup) : 'all';
  const tab = params.get('tab');
  const status: ListStatus = tab === 'planned' || tab === 'ended' ? tab : 'active';
  return { group, status, kind: group === 'all' ? undefined : KIND[group] };
}
