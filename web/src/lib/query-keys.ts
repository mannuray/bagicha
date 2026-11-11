/** Every server-state cache key in one place, so invalidations can't drift. */
export const queryKeys = {
  plants: {
    all: ['plants'] as const,
    list: (status: 'active' | 'planned' | 'ended', page: number, kind: 'tree' | 'crop' | 'flower' | 'all' = 'all') => ['plants', 'list', status, page, kind] as const,
    everything: ['plants', 'everything'] as const,
    allPlanned: ['plants', 'everything', 'planned'] as const,
    detail: (id: string) => ['plants', id, 'detail'] as const,
    timelineAll: (id: string) => ['plants', id, 'timeline'] as const,
    /** Under timelineAll, so invalidating timelineAll refreshes every filter. */
    timeline: (id: string, filter: string) => ['plants', id, 'timeline', filter] as const,
    cycles: (id: string) => ['plants', id, 'cycles'] as const,
    cyclesAll: (id: string) => ['plants', id, 'cycles', 'all'] as const,
    tasks: (id: string) => ['plants', id, 'tasks'] as const,
    intelligence: (id: string) => ['plants', id, 'intelligence'] as const,
    mitigation: (id: string) => ['plants', id, 'mitigation'] as const,
  },
  tasks: {
    mineAll: ['tasks', 'mine'] as const,
  },
  guide: ['seasonal', 'guide'] as const,
  crops: {
    calendar: ['crops', 'calendar'] as const,
    detail: (cropId: string) => ['crops', 'calendar', cropId] as const,
    places: ['crops', 'places'] as const,
    rotation: (placeId: string, cropId: string) => ['crops', 'rotation', placeId, cropId] as const,
  },
  catalogue: {
    search: (q: string) => ['catalogue', 'search', q] as const,
    resolve: (q: string | null) => ['catalogue', 'resolve', q] as const,
  },
  regions: { districts: ['regions', 'districts'] as const },
  media: { url: (key: string) => ['media', 'url', key] as const },
};
