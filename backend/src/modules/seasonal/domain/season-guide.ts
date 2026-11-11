/**
 * Home "season guidance": the season as gardeners in each region name it, and
 * a headline with a few points for the month. Typical home-garden practice for
 * the region (no weather, temperatures or forecasts); the "good to sow now"
 * list beside it comes from the crop calendar. Months are calendar months in IST.
 */
import { RegionCluster } from '@prisma/client';
import { istMonth } from '../../../common/time';

export interface SeasonMonth {
  season: string;
  headline: string;
  points: string[];
}

const m = (
  season: string,
  headline: string,
  ...points: string[]
): SeasonMonth => ({ season, headline, points });

/** North, East and Central plains share most of the year's rhythm. */
const PLAINS = (opts: {
  winterTip: string;
  mangoNote: string;
}): SeasonMonth[] => [
  m(
    'Winter',
    'Cold nights: protect young plants and keep winter vegetables growing.',
    opts.winterTip,
    'Water in the late morning, and less often; cold, wet roots rot.',
    'Keep harvesting peas, palak and methi; sow another row of greens.',
  ),
  m(
    'Winter',
    'The tail of winter: prune and feed before trees wake up.',
    'Prune dead and crossing branches of guava, citrus and pomegranate.',
    'Give fruit trees well-rotted compost now, before new growth.',
    opts.mangoNote,
  ),
  m(
    'Spring',
    'Trees flower and new leaves come: care now decides the fruit.',
    "Don't over-water mango in flower; watch for hoppers and powdery mildew.",
    'Sow okra, gourds and cucumber as days warm.',
    'Mulch beds before the heat arrives.',
  ),
  m(
    'Summer',
    'Heat builds: water deeply and shade young plants.',
    'Water early in the morning; deep watering beats a daily sprinkle.',
    'Mulch thickly around trees and beds to hold moisture.',
    'Give new saplings some afternoon shade.',
  ),
  m(
    'Summer',
    'Peak heat: help plants hold on until the rains.',
    'Water fruit trees deeply once or twice a week, and pots daily.',
    "Thin out fruit on young trees so the branches don't strain.",
    'Pick summer vegetables often so they keep bearing.',
  ),
  m(
    'Summer',
    'Mango season and the wait for rain.',
    "Harvest mangoes as they colour; don't let ripe fruit hang too long.",
    'Dig pits and get compost ready to plant new trees in the rains.',
    'Clear drains and gutters before the monsoon.',
  ),
  m(
    'Monsoon',
    'The rains are here: the best month to plant trees.',
    'Plant new fruit trees and saplings now, in pits prepared with compost.',
    'Make sure water drains away from tree trunks and pots.',
    'Sow monsoon vegetables like okra, gourds and beans.',
  ),
  m(
    'Monsoon',
    'Wet and humid: watch for fungus and standing water.',
    'Remove fallen, rotting fruit and leaves under trees.',
    'Look under leaves for fungus and pests after long wet spells.',
    "Stake young trees so the wind and rain don't bend them.",
  ),
  m(
    'Monsoon',
    'The rains ease: start the winter vegetable nursery.',
    'Raise tomato, brinjal, cauliflower and cabbage seedlings in trays.',
    'Weed beds and add compost for winter sowing.',
    'Feed fruit trees after the heavy rains.',
  ),
  m(
    'Post-monsoon',
    'Clear skies: the main sowing month for winter vegetables.',
    'Sow palak, methi, coriander, radish and carrot; transplant nursery seedlings.',
    'Water a little less as nights cool.',
    'Sow winter flowers like calendula, dianthus and petunia.',
  ),
  m(
    'Post-monsoon',
    'Cool, dry days: the heart of winter gardening.',
    'Sow peas and another row of greens; keep transplanting seedlings.',
    'Water mango and citrus less as nights cool; mango likes it dry before flowering.',
    'Mulch beds to keep the soil moist.',
  ),
  m(
    'Winter',
    'Winter sets in: keep beds productive and roots warm.',
    opts.winterTip,
    'Harvest winter greens often to keep them coming.',
    'Water less, in the late morning.',
  ),
];

const PLAINS_NORTH = PLAINS({
  winterTip:
    'Cover young saplings and seedlings on the coldest nights; frost can scorch them.',
  mangoNote: 'Mango panicles start soon: hold back water until flowers set.',
});
const PLAINS_EAST = PLAINS({
  winterTip: 'Cover young saplings on cold, foggy nights.',
  mangoNote: 'Mango and litchi flower soon: hold back water until flowers set.',
});
const PLAINS_CENTRAL = PLAINS({
  winterTip: 'Cover young saplings on the coldest nights.',
  mangoNote: 'Mango flowers soon: hold back water until flowers set.',
});

const WEST: SeasonMonth[] = [
  m(
    'Winter',
    'Mild, dry winter: the best growing weather of the year.',
    'Keep sowing greens, carrot and radish.',
    'Water in the morning; dry air pulls moisture from pots fast.',
    'Watch for aphids on new growth.',
  ),
  m(
    'Winter',
    'Late winter: prune and feed before the heat.',
    'Prune guava, pomegranate and citrus lightly.',
    'Add compost around fruit trees.',
    'Mango flowers now: hold back water until flowers set.',
  ),
  m(
    'Spring',
    'Days warm fast: mulch and switch to summer crops.',
    'Mulch beds and tree bases thickly.',
    'Sow okra, gourds and cucumber.',
    'Water early in the morning.',
  ),
  m(
    'Summer',
    'Dry heat: water deeply and shade young plants.',
    'Water deeply and less often rather than a daily sprinkle.',
    'Shade saplings and pots in the afternoon.',
    'Keep mulch topped up.',
  ),
  m(
    'Summer',
    'Peak heat: help plants hold on until the rains.',
    'Water pots daily and trees deeply once or twice a week.',
    'Harvest mangoes as they colour.',
    'Prepare pits and compost for planting in the rains.',
  ),
  m(
    'Monsoon',
    'The monsoon arrives: plant trees and clear drains.',
    'Plant new fruit trees once the soil is wet.',
    'Make sure water drains away from trunks and pots.',
    'Sow monsoon vegetables and gourds.',
  ),
  m(
    'Monsoon',
    'Heavy rain: guard against rot and fungus.',
    'Clear fallen fruit and leaves under trees.',
    'Stake young trees against wind.',
    'Check leaves for fungus after wet spells.',
  ),
  m(
    'Monsoon',
    'Steady rains: keep drainage clear and plants staked.',
    'Weed often; weeds grow fast now.',
    'Look for pests under leaves after wet spells.',
    'Feed fruit trees in a dry break.',
  ),
  m(
    'Monsoon',
    'The rains ease: start the winter nursery.',
    'Raise tomato, brinjal and cauliflower seedlings in trays.',
    'Add compost to beds for winter sowing.',
    'Feed fruit trees after the rains.',
  ),
  m(
    'Post-monsoon',
    'The main sowing month for winter vegetables.',
    'Sow palak, methi, coriander and radish; transplant seedlings.',
    'Water a little less as the air dries.',
    'Sow winter flowers like calendula and petunia.',
  ),
  m(
    'Post-monsoon',
    'Pleasant days: keep sowing and transplanting.',
    'Sow peas and another row of greens.',
    'Mulch beds to hold moisture in the dry air.',
    'Water mango less; it likes it dry before flowering.',
  ),
  m(
    'Winter',
    'Winter: steady growth and easy harvests.',
    'Harvest greens and peas often.',
    'Water in the morning.',
    'Watch for aphids and whitefly.',
  ),
];

const SOUTH: SeasonMonth[] = [
  m(
    'Cool season',
    'Pleasant, dry weeks: great for vegetables and flowers.',
    'Keep sowing greens, beans and tomato.',
    'Water in the morning as the air dries.',
    'Mango flowers now: hold back water until flowers set.',
  ),
  m(
    'Cool season',
    'Warming up: mulch and prune before summer.',
    'Prune guava, citrus and pomegranate lightly.',
    'Mulch beds and tree bases.',
    'Feed fruit trees with compost.',
  ),
  m(
    'Summer',
    'Heat builds: water deeply and shade young plants.',
    'Water early in the morning, deeply rather than daily.',
    'Shade saplings and pots in the afternoon.',
    'Sow okra, gourds and amaranth.',
  ),
  m(
    'Summer',
    'Peak summer: help plants hold on.',
    'Water pots daily; trees deeply once or twice a week.',
    'Keep mulch thick around trees.',
    'Harvest mangoes as they colour.',
  ),
  m(
    'Summer',
    'The last hot month: get ready for the rains.',
    'Dig pits and prepare compost for planting.',
    'Clear drains before the monsoon.',
    'Pick summer vegetables often.',
  ),
  m(
    'Southwest monsoon',
    'Rains begin: plant trees and sow monsoon crops.',
    'Plant new fruit trees once the soil is wet.',
    'Sow beans, gourds and okra.',
    'Make sure water drains away from trunks.',
  ),
  m(
    'Southwest monsoon',
    'Monsoon growth: weed, stake and watch for fungus.',
    'Weed often; everything grows fast now.',
    'Stake young trees against wind.',
    'Clear fallen fruit and leaves.',
  ),
  m(
    'Southwest monsoon',
    'Steady rains: keep drainage clear.',
    'Look for pests under leaves after wet spells.',
    'Feed fruit trees in a dry break.',
    'Keep sowing greens in raised beds.',
  ),
  m(
    'Southwest monsoon',
    'The southwest monsoon tails off: start the nursery.',
    'Raise tomato, brinjal and chilli seedlings in trays.',
    'Add compost to beds for the next season.',
    'Feed fruit trees after the rains.',
  ),
  m(
    'Northeast monsoon',
    'The second rains arrive: a fine time to plant.',
    'Transplant seedlings and sow greens and beans.',
    'Plant trees while the soil is moist.',
    'Check drainage again before heavy showers.',
  ),
  m(
    'Northeast monsoon',
    'Heavy showers in many places: guard roots and leaves.',
    'Make sure pots and beds drain well; raise pots off the ground.',
    'Clear fallen leaves and fruit.',
    'Watch for fungus on leaves after wet spells.',
  ),
  m(
    'Northeast monsoon',
    'Rains ease: sow the cool-season vegetables.',
    'Sow carrot, radish, palak and coriander.',
    'Weed and add compost to beds.',
    'Sow flowers like marigold and zinnia.',
  ),
];

const COASTAL: SeasonMonth[] = [
  m(
    'Dry season',
    'Dry, sunny weeks: water regularly and keep sowing.',
    'Water in the morning; sandy coastal soil dries fast.',
    'Sow greens, beans and tomato.',
    'Mulch beds to hold moisture.',
  ),
  m(
    'Dry season',
    'Dry and warming: mulch and feed trees.',
    'Add compost and mulch around coconut, mango and banana.',
    'Prune dead and crossing branches.',
    'Mango flowers now: hold back water until flowers set.',
  ),
  m(
    'Summer',
    'Heat and humidity rise: water deeply and early.',
    'Water early in the morning, deeply.',
    'Shade young plants in the afternoon.',
    'Sow okra, gourds and amaranth.',
  ),
  m(
    'Summer',
    'Hot, humid summer: help plants hold on.',
    'Water pots daily; mulch thickly.',
    'Harvest mangoes and jackfruit as they ripen.',
    'Watch for mealybugs on new growth.',
  ),
  m(
    'Summer',
    'The last hot weeks: get ready for the monsoon.',
    'Clear drains and raise pots off the ground.',
    'Dig pits and prepare compost for planting.',
    'Cut back overgrown branches before the storms.',
  ),
  m(
    'Southwest monsoon',
    'The monsoon arrives: plant trees and check drainage.',
    'Plant new trees and saplings once the soil is wet.',
    'Make sure water never stands around trunks.',
    'Stake young plants against wind.',
  ),
  m(
    'Southwest monsoon',
    'Very heavy rain: protect roots from waterlogging.',
    'Keep drains clear; lift pots so they drain.',
    'Clear fallen leaves and fruit to stop rot.',
    'Hold off feeding until a dry break.',
  ),
  m(
    'Southwest monsoon',
    'Monsoon growth: weed and watch for fungus.',
    'Weed often; everything grows fast.',
    'Check leaves for fungus after wet spells.',
    'Sow greens in raised beds or containers.',
  ),
  m(
    'Southwest monsoon',
    "The rains ease: start the next season's nursery.",
    'Raise tomato, brinjal and chilli seedlings in trays.',
    'Feed fruit trees in a dry spell.',
    'Add compost to beds.',
  ),
  m(
    'Post-monsoon',
    'Rains retreat: a fine time to sow and transplant.',
    'Transplant seedlings; sow beans and greens.',
    'Weed and refresh beds with compost.',
    'Sow flowers like marigold and zinnia.',
  ),
  m(
    'Post-monsoon',
    'Showers fade: the start of the best growing weeks.',
    'Sow carrot, radish, palak and coriander.',
    'Water as the soil dries out.',
    'Watch for pests on young seedlings.',
  ),
  m(
    'Dry season',
    'Pleasant, dry weeks: steady growth and easy harvests.',
    'Keep sowing greens every few weeks.',
    'Water regularly; mulch beds.',
    'Harvest vegetables often.',
  ),
];

const HILLS: SeasonMonth[] = [
  m(
    'Winter',
    'Deep winter: protect plants and rest the garden.',
    'Cover young plants and pots on freezing nights; frost and snow can damage them.',
    'Water only when the soil is dry, around midday.',
    'Prune dormant apple, pear and plum trees.',
  ),
  m(
    'Winter',
    'Late winter: finish pruning before buds swell.',
    'Finish pruning dormant fruit trees.',
    'Add compost around fruit trees.',
    'Keep pots sheltered from snow and frost.',
  ),
  m(
    'Spring',
    'Spring wakes the garden: start sowing.',
    'Sow peas, palak, coriander and lettuce.',
    'Watch fruit blossom for late frost; cover small trees if needed.',
    'Feed fruit trees as growth starts.',
  ),
  m(
    'Spring',
    'Blossom time and fresh growth.',
    'Sow beans, tomato and cucumber in sheltered spots.',
    'Water regularly as days lengthen.',
    'Thin out seedlings for space.',
  ),
  m(
    'Spring',
    'Warm days: the main sowing and planting weeks.',
    'Transplant tomato and capsicum seedlings.',
    'Mulch beds to hold moisture.',
    'Thin fruit on heavily set trees.',
  ),
  m(
    'Summer',
    'Mild summer: steady growth before the rains.',
    'Water in the morning; mulch keeps roots cool.',
    'Stake tall plants like tomato and beans.',
    'Clear drains before the monsoon.',
  ),
  m(
    'Monsoon',
    'The rains arrive: guard slopes and drainage.',
    'Make sure water runs off and never pools around trunks.',
    'Plant new fruit trees once the soil is wet.',
    'Watch for slugs and snails on leaves.',
  ),
  m(
    'Monsoon',
    'Wet, misty weeks: watch for fungus.',
    'Clear fallen fruit and leaves.',
    'Check leaves for scab and mildew after wet spells.',
    'Stake young trees on slopes.',
  ),
  m(
    'Monsoon',
    'The rains ease: harvest and plan for autumn.',
    'Harvest apples, pears and plums as they ripen.',
    'Weed beds and add compost.',
    'Sow radish, turnip and greens for autumn.',
  ),
  m(
    'Autumn',
    'Clear, cool autumn: plant and sow for winter.',
    'Sow garlic, onion sets, palak and peas.',
    'Plant new fruit trees before the ground gets cold.',
    'Water less as days shorten.',
  ),
  m(
    'Autumn',
    'Last mild weeks: get the garden ready for winter.',
    'Mulch beds and tree bases against the cold.',
    'Bring tender pots to a sheltered spot.',
    'Harvest late vegetables before frost.',
  ),
  m(
    'Winter',
    'Winter returns: shelter plants and rest.',
    'Cover young plants on frosty nights.',
    'Water sparingly, only around midday.',
    "Plan next year's beds and order seeds.",
  ),
];

export const SEASON_GUIDE: Record<RegionCluster, SeasonMonth[]> = {
  NORTH_INDIA: PLAINS_NORTH,
  EAST_INDIA: PLAINS_EAST,
  CENTRAL_INDIA: PLAINS_CENTRAL,
  WEST_INDIA: WEST,
  SOUTH_DECCAN: SOUTH,
  COASTAL_HUMID: COASTAL,
  HILLS_COOL: HILLS,
};

/** This month's season and advice for a region (the month as seen in India). */
export function seasonGuide(region: RegionCluster, now: Date): SeasonMonth {
  return SEASON_GUIDE[region][istMonth(now) - 1];
}
