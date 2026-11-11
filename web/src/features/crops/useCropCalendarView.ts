import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useCropCalendar, usePlaces } from './api';
import { filterCalendar, sunniest, type CalendarFilter } from './names';
import { useCropsOnList } from './useCropsOnList';

export type CalendarView = 'CROP' | 'FLOWER';
/** Vegetables filter by a quick harvest; flowers by a long bloom. */
const TAG_FILTERS: Record<CalendarView, CalendarFilter[]> = { CROP: ['container', 'beginner', 'quick'], FLOWER: ['container', 'beginner', 'long'] };

/**
 * ViewModel for the sowing calendar: vegetables or flowers (?kind=flower), search,
 * filters (sun only once a place has its sun set), the open / soon / later lists.
 */
export function useCropCalendarView() {
  const calendar = useCropCalendar();
  const places = usePlaces();
  const onList = useCropsOnList();
  const [params, setParams] = useSearchParams();
  const view: CalendarView = params.get('kind') === 'flower' ? 'FLOWER' : 'CROP';
  const [filters, setFilters] = useState<CalendarFilter[]>([]);
  const [query, setQuery] = useState('');
  const [showLater, setShowLater] = useState(false);
  const sun = sunniest(places.data ?? []);

  return {
    calendar,
    onList,
    view,
    chooseView: (next: CalendarView) => {
      setParams(next === 'FLOWER' ? { kind: 'flower' } : {}, { replace: true });
      setFilters([]);
    },
    query,
    setQuery,
    filters,
    toggle: (f: CalendarFilter) => setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f])),
    filterList: sun === null ? TAG_FILTERS[view] : [...TAG_FILTERS[view], 'sun' as const],
    showLater,
    setShowLater,
    ...filterCalendar(calendar.data ?? [], { kind: view, query, filters, sun }),
  };
}
