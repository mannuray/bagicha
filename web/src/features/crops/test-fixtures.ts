/** A calendar entry for tests; override any field. */
export const cropItem = (over: Record<string, unknown> = {}) => ({
  id: 'palak', kind: 'CROP', name: 'Spinach (Palak)', aliases: ['palak'], family: 'AMARANTHACEAE', method: 'DIRECT_SOW',
  tags: ['container', 'beginner', 'quick'], days_to_first_harvest: [30, 40],
  guide: { plants_for_family_of_4: 'a 1-metre row every 2 weeks', container: '8-inch pot', spacing_cm: [10, 15] },
  scientific_name: 'Spinacia oleracea', description: 'Fast, forgiving greens.', sun: 'PARTIAL',
  status: 'open', opens_in_days: null, next_month: null, window_label: 'Sep–Nov', ...over,
});

/** A seasonal flower on the calendar. */
export const flowerItem = (over: Record<string, unknown> = {}) =>
  cropItem({
    id: 'marigold', kind: 'FLOWER', name: 'Marigold (Genda)', aliases: ['genda', 'गेंदा'], family: 'ASTERACEAE', method: 'NURSERY_TRANSPLANT',
    tags: ['container', 'beginner', 'long'], days_to_first_harvest: [55, 70], sun: 'FULL', scientific_name: 'Tagetes erecta',
    description: 'The festival flower.', guide: { plants_for_family_of_4: '6–8 plants for a bright patch', container: '8–10 inch pot per plant', spacing_cm: [30, 45] },
    ...over,
  });
