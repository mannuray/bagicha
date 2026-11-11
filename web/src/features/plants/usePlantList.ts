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
  const [pages, setPages] = useState(1);

  const go = (next: { group: ListGroup; status: ListStatus }) => {
    const query: Record<string, string> = {};
    if (next.group !== 'all') query.group = next.group;
    if (next.status !== 'active') query.tab = next.status;
    setParams(query, { replace: true });
    setPages(1);
  };

  return {
    group,
    status,
    kind,
    pages,
    chooseGroup: (next: ListGroup) => go({ group: next, status }),
    chooseStatus: (next: ListStatus) => go({ group, status: next }),
    more: () => setPages((p) => p + 1),
  };
}
