import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { listView, type ListGroup, type ListStatus } from './list-view';

/**
 * ViewModel for My plants: the group and tab live in the address (?group=, ?tab=),
 * so links open on them and coming back keeps them; "more" pages through.
 */
export function usePlantList() {
  const [params, setParams] = useSearchParams();
  const { group, status, kind } = listView(params);
  // Pages belong to one view: when the address changes (a tab, a group, the nav tab), start again.
  const viewKey = `${group}|${status}`;
  const [paging, setPaging] = useState({ viewKey, pages: 1 });
  const pages = paging.viewKey === viewKey ? paging.pages : 1;

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
    pages,
    chooseGroup: (next: ListGroup) => go({ group: next, status }),
    chooseStatus: (next: ListStatus) => go({ group, status: next }),
    more: () => setPaging({ viewKey, pages: pages + 1 }),
  };
}
