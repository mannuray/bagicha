import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useStorage } from '../../lib/storage';
import { listView, type ListGroup, type ListStatus } from './list-view';

/** Where the plant page's back arrow finds the list view last used. */
export const LIST_VIEW_KEY = 'bagicha.plants.view';

/**
 * ViewModel for My plants: the group and tab live in the address (?group=, ?tab=),
 * so links open on them; the view is remembered for the plant page's back arrow;
 * "more" pages through, and any change of view starts again at page 1.
 */
export function usePlantList() {
  const [params, setParams] = useSearchParams();
  const storage = useStorage();
  const { group, status, kind } = listView(params);
  const viewKey = `${group}|${status}`;
  const [paging, setPaging] = useState({ viewKey, pages: 1 });
  // A different view (tab, group, the nav tab) starts again at page 1.
  if (paging.viewKey !== viewKey) setPaging({ viewKey, pages: 1 });

  const search = params.toString();
  useEffect(() => storage.set(LIST_VIEW_KEY, search ? `?${search}` : ''), [storage, search]);

  const go = (next: { group: ListGroup; status: ListStatus }) => {
    const query: Record<string, string> = {};
    if (next.group !== 'all') query.group = next.group;
    if (next.status !== 'active') query.tab = next.status;
    setParams(query, { replace: true });
  };

  return {
    group,
    status,
    kind,
    pages: paging.viewKey === viewKey ? paging.pages : 1,
    chooseGroup: (next: ListGroup) => go({ group: next, status }),
    chooseStatus: (next: ListStatus) => go({ group, status: next }),
    more: () => setPaging((p) => ({ viewKey, pages: (p.viewKey === viewKey ? p.pages : 1) + 1 })),
  };
}
