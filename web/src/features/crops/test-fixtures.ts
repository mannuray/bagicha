/** A calendar entry for tests; override any field. */
export const cropItem = (over: Record<string, unknown> = {}) => ({
  id: 'palak', name: 'Spinach (Palak)', aliases: ['palak'], family: 'AMARANTHACEAE', method: 'DIRECT_SOW',
  tags: ['container', 'beginner', 'quick'], days_to_first_harvest: [30, 40],
  guide: { plants_for_family_of_4: 'a 1-metre row every 2 weeks', container: '8-inch pot', spacing_cm: [10, 15] },
  scientific_name: 'Spinacia oleracea', description: 'Fast, forgiving greens.', sun: 'PARTIAL',
  status: 'open', opens_in_days: null, next_month: null, window_label: 'Sep–Nov', ...over,
});
