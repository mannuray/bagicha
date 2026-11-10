/** Every server-state cache key in one place, so invalidations can't drift. */
export const queryKeys = {
  plants: {
    all: ['plants'] as const,
    list: (page: number) => ['plants', 'list', page] as const,
    detail: (id: string) => ['plants', id, 'detail'] as const,
    timeline: (id: string, page: number) => ['plants', id, 'timeline', page] as const,
    timelineAll: (id: string) => ['plants', id, 'timeline'] as const,
    cycles: (id: string) => ['plants', id, 'cycles'] as const,
    tasks: (id: string) => ['plants', id, 'tasks'] as const,
    seasonalState: (id: string) => ['plants', id, 'seasonal-state'] as const,
    intelligence: (id: string) => ['plants', id, 'intelligence'] as const,
    mitigation: (id: string) => ['plants', id, 'mitigation'] as const,
  },
  tasks: {
    mine: (page: number) => ['tasks', 'mine', page] as const,
    mineAll: ['tasks', 'mine'] as const,
  },
  guide: ['seasonal', 'guide'] as const,
  catalogue: { search: (q: string) => ['catalogue', 'search', q] as const },
  media: { url: (key: string) => ['media', 'url', key] as const },
};
