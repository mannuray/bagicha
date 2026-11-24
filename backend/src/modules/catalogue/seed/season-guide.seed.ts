import type { RegionCluster } from '@prisma/client';
import type { SeasonGuideSeed, SeasonMonth } from '../domain/season-guide';

/**
 * Home "season guidance": the season as gardeners in each region name it, and
 * a headline with a few points for each month (January first). Typical
 * home-garden practice for the region; no weather or forecasts. Moved word for
 * word from code in stage 4 (docs/superpowers/specs/2026-11-24-season-guidance-in-catalogue-design.md).
 * Hindi sits beside each English line (round 2, everyday spoken Hindi).
 */

/** Season names in Hindi, keyed by the English name the region uses. */
const SEASON_HI = {
  Winter: 'सर्दी',
  Spring: 'वसंत',
  Summer: 'गर्मी',
  Monsoon: 'बरसात',
  'Post-monsoon': 'बरसात के बाद',
  'Cool season': 'ठंडा मौसम',
  'Dry season': 'सूखा मौसम',
  'Southwest monsoon': 'दक्षिण-पश्चिम मानसून',
  'Northeast monsoon': 'उत्तर-पूर्वी मानसून',
  Autumn: 'पतझड़',
} as const;

type Season = keyof typeof SEASON_HI;
/** An English line and its Hindi. */
type Line = [en: string, hi: string];

const m = (
  season: Season,
  [headline, hiHeadline]: Line,
  ...points: Line[]
): SeasonMonth => ({
  season,
  headline,
  points: points.map(([en]) => en),
  hi: {
    season: SEASON_HI[season],
    headline: hiHeadline,
    points: points.map(([, hi]) => hi),
  },
});

/** North, East and Central plains share most of the year's rhythm. */
const PLAINS = (opts: { winterTip: Line; mangoNote: Line }): SeasonMonth[] => [
  m(
    'Winter',
    [
      'Cold nights: protect young plants and keep winter vegetables growing.',
      'ठंडी रातें: छोटे पौधों को बचाएं और सर्दी की सब्ज़ियां उगाते रहें।',
    ],
    opts.winterTip,
    [
      'Water in the late morning, and less often; cold, wet roots rot.',
      'देर सुबह पानी दें, और कम बार; ठंडी, गीली जड़ें सड़ जाती हैं।',
    ],
    [
      'Keep harvesting peas, palak and methi; sow another row of greens.',
      'मटर, पालक और मेथी तोड़ते रहें; पत्तेदार सब्ज़ियों की एक और कतार बोएं।',
    ],
  ),
  m(
    'Winter',
    [
      'The tail of winter: prune and feed before trees wake up.',
      'सर्दी का आखिरी दौर: पेड़ों के जागने से पहले छंटाई करें और खाद दें।',
    ],
    [
      'Prune dead and crossing branches of guava, citrus and pomegranate.',
      'अमरूद, नींबू-संतरा और अनार की सूखी और आपस में फंसी डालियां काटें।',
    ],
    [
      'Give fruit trees well-rotted compost now, before new growth.',
      'नई बढ़त से पहले, अभी फलदार पेड़ों को अच्छी सड़ी कम्पोस्ट दें।',
    ],
    opts.mangoNote,
  ),
  m(
    'Spring',
    [
      'Trees flower and new leaves come: care now decides the fruit.',
      'पेड़ों पर फूल और नए पत्ते आते हैं: अभी की देखभाल से फल तय होते हैं।',
    ],
    [
      "Don't over-water mango in flower; watch for hoppers and powdery mildew.",
      'बौर वाले आम को ज़्यादा पानी न दें; भुनगा (हॉपर) और पाउडरी मिल्ड्यू पर नज़र रखें।',
    ],
    [
      'Sow okra, gourds and cucumber as days warm.',
      'दिन गर्म होने पर भिंडी, लौकी-तोरी और खीरा बोएं।',
    ],
    [
      'Mulch beds before the heat arrives.',
      'गर्मी आने से पहले क्यारियों में मल्च बिछाएं।',
    ],
  ),
  m(
    'Summer',
    [
      'Heat builds: water deeply and shade young plants.',
      'गर्मी बढ़ रही है: गहरा पानी दें और छोटे पौधों को छांव दें।',
    ],
    [
      'Water early in the morning; deep watering beats a daily sprinkle.',
      'सुबह जल्दी पानी दें; रोज़ थोड़ा छिड़कने से गहरा पानी देना बेहतर है।',
    ],
    [
      'Mulch thickly around trees and beds to hold moisture.',
      'नमी बनाए रखने के लिए पेड़ों और क्यारियों के आसपास मोटी मल्च बिछाएं।',
    ],
    [
      'Give new saplings some afternoon shade.',
      'नए पौधों को दोपहर में थोड़ी छांव दें।',
    ],
  ),
  m(
    'Summer',
    [
      'Peak heat: help plants hold on until the rains.',
      'सबसे तेज़ गर्मी: बारिश आने तक पौधों को टिके रहने में मदद करें।',
    ],
    [
      'Water fruit trees deeply once or twice a week, and pots daily.',
      'फलदार पेड़ों को हफ़्ते में एक-दो बार गहरा पानी दें, और गमलों को रोज़।',
    ],
    [
      "Thin out fruit on young trees so the branches don't strain.",
      'छोटे पेड़ों पर कुछ फल तोड़कर कम करें ताकि डालियों पर ज़ोर न पड़े।',
    ],
    [
      'Pick summer vegetables often so they keep bearing.',
      'गर्मी की सब्ज़ियां बार-बार तोड़ें ताकि पौधे फलते रहें।',
    ],
  ),
  m(
    'Summer',
    ['Mango season and the wait for rain.', 'आम का मौसम और बारिश का इंतज़ार।'],
    [
      "Harvest mangoes as they colour; don't let ripe fruit hang too long.",
      'रंग आते ही आम तोड़ें; पके फल को ज़्यादा देर पेड़ पर न लटकने दें।',
    ],
    [
      'Dig pits and get compost ready to plant new trees in the rains.',
      'बारिश में नए पेड़ लगाने के लिए गड्ढे खोदें और कम्पोस्ट तैयार रखें।',
    ],
    [
      'Clear drains and gutters before the monsoon.',
      'मानसून से पहले नालियां और पनाले साफ़ करें।',
    ],
  ),
  m(
    'Monsoon',
    [
      'The rains are here: the best month to plant trees.',
      'बारिश आ गई: पेड़ लगाने का सबसे अच्छा महीना।',
    ],
    [
      'Plant new fruit trees and saplings now, in pits prepared with compost.',
      'कम्पोस्ट डालकर तैयार किए गड्ढों में अभी नए फलदार पेड़ और पौधे लगाएं।',
    ],
    [
      'Make sure water drains away from tree trunks and pots.',
      'ध्यान रखें कि पानी पेड़ के तनों और गमलों से दूर बह जाए।',
    ],
    [
      'Sow monsoon vegetables like okra, gourds and beans.',
      'भिंडी, लौकी-तोरी और सेम जैसी बरसात की सब्ज़ियां बोएं।',
    ],
  ),
  m(
    'Monsoon',
    [
      'Wet and humid: watch for fungus and standing water.',
      'गीला और उमस भरा मौसम: फफूंद और रुके पानी पर नज़र रखें।',
    ],
    [
      'Remove fallen, rotting fruit and leaves under trees.',
      'पेड़ों के नीचे गिरे, सड़ते फल और पत्ते हटाएं।',
    ],
    [
      'Look under leaves for fungus and pests after long wet spells.',
      'लंबी बारिश के बाद पत्तों के नीचे फफूंद और कीड़े देखें।',
    ],
    [
      "Stake young trees so the wind and rain don't bend them.",
      'छोटे पेड़ों को डंडे का सहारा दें ताकि हवा और बारिश उन्हें झुका न दें।',
    ],
  ),
  m(
    'Monsoon',
    [
      'The rains ease: start the winter vegetable nursery.',
      'बारिश कम हो रही है: सर्दी की सब्ज़ियों की नर्सरी शुरू करें।',
    ],
    [
      'Raise tomato, brinjal, cauliflower and cabbage seedlings in trays.',
      'ट्रे में टमाटर, बैंगन, फूलगोभी और पत्तागोभी की पौध तैयार करें।',
    ],
    [
      'Weed beds and add compost for winter sowing.',
      'सर्दी की बुवाई के लिए क्यारियों की निराई करें और कम्पोस्ट डालें।',
    ],
    [
      'Feed fruit trees after the heavy rains.',
      'तेज़ बारिश के बाद फलदार पेड़ों को खाद दें।',
    ],
  ),
  m(
    'Post-monsoon',
    [
      'Clear skies: the main sowing month for winter vegetables.',
      'साफ़ आसमान: सर्दी की सब्ज़ियों की बुवाई का मुख्य महीना।',
    ],
    [
      'Sow palak, methi, coriander, radish and carrot; transplant nursery seedlings.',
      'पालक, मेथी, धनिया, मूली और गाजर बोएं; नर्सरी की पौध रोपें।',
    ],
    [
      'Water a little less as nights cool.',
      'रातें ठंडी होने पर पानी थोड़ा कम दें।',
    ],
    [
      'Sow winter flowers like calendula, dianthus and petunia.',
      'कैलेंडुला, डायंथस और पेटूनिया जैसे सर्दी के फूल बोएं।',
    ],
  ),
  m(
    'Post-monsoon',
    [
      'Cool, dry days: the heart of winter gardening.',
      'ठंडे, सूखे दिन: सर्दी की बागवानी का सबसे अच्छा समय।',
    ],
    [
      'Sow peas and another row of greens; keep transplanting seedlings.',
      'मटर और पत्तेदार सब्ज़ियों की एक और कतार बोएं; पौध रोपते रहें।',
    ],
    [
      'Water mango and citrus less as nights cool; mango likes it dry before flowering.',
      'रातें ठंडी होने पर आम और नींबू-संतरा को कम पानी दें; बौर से पहले आम को सूखा पसंद है।',
    ],
    [
      'Mulch beds to keep the soil moist.',
      'मिट्टी नम रखने के लिए क्यारियों में मल्च बिछाएं।',
    ],
  ),
  m(
    'Winter',
    [
      'Winter sets in: keep beds productive and roots warm.',
      'सर्दी शुरू: क्यारियों से उपज लेते रहें और जड़ों को गर्म रखें।',
    ],
    opts.winterTip,
    [
      'Harvest winter greens often to keep them coming.',
      'सर्दी की पत्तेदार सब्ज़ियां बार-बार तोड़ें ताकि वे आती रहें।',
    ],
    ['Water less, in the late morning.', 'पानी कम दें, देर सुबह।'],
  ),
];

const PLAINS_NORTH = PLAINS({
  winterTip: [
    'Cover young saplings and seedlings on the coldest nights; frost can scorch them.',
    'सबसे ठंडी रातों में छोटे पौधों और पौध को ढकें; पाला उन्हें झुलसा सकता है।',
  ],
  mangoNote: [
    'Mango panicles start soon: hold back water until flowers set.',
    'आम में जल्द बौर आने लगेगा: फल लगने तक पानी रोककर रखें।',
  ],
});
const PLAINS_EAST = PLAINS({
  winterTip: [
    'Cover young saplings on cold, foggy nights.',
    'ठंडी, कोहरे वाली रातों में छोटे पौधों को ढकें।',
  ],
  mangoNote: [
    'Mango and litchi flower soon: hold back water until flowers set.',
    'आम और लीची में जल्द फूल आएंगे: फल लगने तक पानी रोककर रखें।',
  ],
});
const PLAINS_CENTRAL = PLAINS({
  winterTip: [
    'Cover young saplings on the coldest nights.',
    'सबसे ठंडी रातों में छोटे पौधों को ढकें।',
  ],
  mangoNote: [
    'Mango flowers soon: hold back water until flowers set.',
    'आम में जल्द फूल आएंगे: फल लगने तक पानी रोककर रखें।',
  ],
});

const WEST: SeasonMonth[] = [
  m(
    'Winter',
    [
      'Mild, dry winter: the best growing weather of the year.',
      'हल्की, सूखी सर्दी: साल का सबसे अच्छा उगाने का मौसम।',
    ],
    [
      'Keep sowing greens, carrot and radish.',
      'पत्तेदार सब्ज़ियां, गाजर और मूली बोते रहें।',
    ],
    [
      'Water in the morning; dry air pulls moisture from pots fast.',
      'सुबह पानी दें; सूखी हवा गमलों की नमी जल्दी खींच लेती है।',
    ],
    ['Watch for aphids on new growth.', 'नई बढ़त पर माहू (एफिड) पर नज़र रखें।'],
  ),
  m(
    'Winter',
    [
      'Late winter: prune and feed before the heat.',
      'सर्दी का आखिरी दौर: गर्मी से पहले छंटाई करें और खाद दें।',
    ],
    [
      'Prune guava, pomegranate and citrus lightly.',
      'अमरूद, अनार और नींबू-संतरा की हल्की छंटाई करें।',
    ],
    [
      'Add compost around fruit trees.',
      'फलदार पेड़ों के आसपास कम्पोस्ट डालें।',
    ],
    [
      'Mango flowers now: hold back water until flowers set.',
      'आम में अभी फूल आते हैं: फल लगने तक पानी रोककर रखें।',
    ],
  ),
  m(
    'Spring',
    [
      'Days warm fast: mulch and switch to summer crops.',
      'दिन जल्दी गर्म होते हैं: मल्च बिछाएं और गर्मी की फसलें शुरू करें।',
    ],
    [
      'Mulch beds and tree bases thickly.',
      'क्यारियों में और पेड़ों के तने के पास मोटी मल्च बिछाएं।',
    ],
    ['Sow okra, gourds and cucumber.', 'भिंडी, लौकी-तोरी और खीरा बोएं।'],
    ['Water early in the morning.', 'सुबह जल्दी पानी दें।'],
  ),
  m(
    'Summer',
    [
      'Dry heat: water deeply and shade young plants.',
      'सूखी गर्मी: गहरा पानी दें और छोटे पौधों को छांव दें।',
    ],
    [
      'Water deeply and less often rather than a daily sprinkle.',
      'रोज़ थोड़ा छिड़कने के बजाय कम बार, पर गहरा पानी दें।',
    ],
    [
      'Shade saplings and pots in the afternoon.',
      'दोपहर में पौधों और गमलों को छांव दें।',
    ],
    ['Keep mulch topped up.', 'मल्च कम होने पर और डालते रहें।'],
  ),
  m(
    'Summer',
    [
      'Peak heat: help plants hold on until the rains.',
      'सबसे तेज़ गर्मी: बारिश आने तक पौधों को टिके रहने में मदद करें।',
    ],
    [
      'Water pots daily and trees deeply once or twice a week.',
      'गमलों को रोज़ पानी दें और पेड़ों को हफ़्ते में एक-दो बार गहरा पानी।',
    ],
    ['Harvest mangoes as they colour.', 'रंग आते ही आम तोड़ें।'],
    [
      'Prepare pits and compost for planting in the rains.',
      'बारिश में पेड़ लगाने के लिए गड्ढे और कम्पोस्ट तैयार करें।',
    ],
  ),
  m(
    'Monsoon',
    [
      'The monsoon arrives: plant trees and clear drains.',
      'मानसून आ गया: पेड़ लगाएं और नालियां साफ़ करें।',
    ],
    [
      'Plant new fruit trees once the soil is wet.',
      'मिट्टी गीली होते ही नए फलदार पेड़ लगाएं।',
    ],
    [
      'Make sure water drains away from trunks and pots.',
      'ध्यान रखें कि पानी तनों और गमलों से दूर बह जाए।',
    ],
    [
      'Sow monsoon vegetables and gourds.',
      'बरसात की सब्ज़ियां और लौकी-तोरी बोएं।',
    ],
  ),
  m(
    'Monsoon',
    [
      'Heavy rain: guard against rot and fungus.',
      'तेज़ बारिश: सड़न और फफूंद से बचाएं।',
    ],
    [
      'Clear fallen fruit and leaves under trees.',
      'पेड़ों के नीचे गिरे फल और पत्ते साफ़ करें।',
    ],
    [
      'Stake young trees against wind.',
      'हवा से बचाने के लिए छोटे पेड़ों को डंडे का सहारा दें।',
    ],
    [
      'Check leaves for fungus after wet spells.',
      'बारिश के दौर के बाद पत्तों पर फफूंद देखें।',
    ],
  ),
  m(
    'Monsoon',
    [
      'Steady rains: keep drainage clear and plants staked.',
      'लगातार बारिश: पानी की निकासी साफ़ रखें और पौधों को सहारा देकर रखें।',
    ],
    [
      'Weed often; weeds grow fast now.',
      'बार-बार निराई करें; अभी खरपतवार तेज़ी से बढ़ते हैं।',
    ],
    [
      'Look for pests under leaves after wet spells.',
      'बारिश के दौर के बाद पत्तों के नीचे कीड़े देखें।',
    ],
    [
      'Feed fruit trees in a dry break.',
      'बारिश रुकने पर फलदार पेड़ों को खाद दें।',
    ],
  ),
  m(
    'Monsoon',
    [
      'The rains ease: start the winter nursery.',
      'बारिश कम हो रही है: सर्दी की नर्सरी शुरू करें।',
    ],
    [
      'Raise tomato, brinjal and cauliflower seedlings in trays.',
      'ट्रे में टमाटर, बैंगन और फूलगोभी की पौध तैयार करें।',
    ],
    [
      'Add compost to beds for winter sowing.',
      'सर्दी की बुवाई के लिए क्यारियों में कम्पोस्ट डालें।',
    ],
    [
      'Feed fruit trees after the rains.',
      'बारिश के बाद फलदार पेड़ों को खाद दें।',
    ],
  ),
  m(
    'Post-monsoon',
    [
      'The main sowing month for winter vegetables.',
      'सर्दी की सब्ज़ियों की बुवाई का मुख्य महीना।',
    ],
    [
      'Sow palak, methi, coriander and radish; transplant seedlings.',
      'पालक, मेथी, धनिया और मूली बोएं; पौध रोपें।',
    ],
    [
      'Water a little less as the air dries.',
      'हवा सूखने पर पानी थोड़ा कम दें।',
    ],
    [
      'Sow winter flowers like calendula and petunia.',
      'कैलेंडुला और पेटूनिया जैसे सर्दी के फूल बोएं।',
    ],
  ),
  m(
    'Post-monsoon',
    [
      'Pleasant days: keep sowing and transplanting.',
      'सुहाने दिन: बुवाई और पौध रोपना जारी रखें।',
    ],
    [
      'Sow peas and another row of greens.',
      'मटर और पत्तेदार सब्ज़ियों की एक और कतार बोएं।',
    ],
    [
      'Mulch beds to hold moisture in the dry air.',
      'सूखी हवा में नमी बनाए रखने के लिए क्यारियों में मल्च बिछाएं।',
    ],
    [
      'Water mango less; it likes it dry before flowering.',
      'आम को कम पानी दें; बौर से पहले उसे सूखा पसंद है।',
    ],
  ),
  m(
    'Winter',
    [
      'Winter: steady growth and easy harvests.',
      'सर्दी: लगातार बढ़त और आसान तुड़ाई।',
    ],
    [
      'Harvest greens and peas often.',
      'पत्तेदार सब्ज़ियां और मटर बार-बार तोड़ें।',
    ],
    ['Water in the morning.', 'सुबह पानी दें।'],
    [
      'Watch for aphids and whitefly.',
      'माहू (एफिड) और सफ़ेद मक्खी पर नज़र रखें।',
    ],
  ),
];

const SOUTH: SeasonMonth[] = [
  m(
    'Cool season',
    [
      'Pleasant, dry weeks: great for vegetables and flowers.',
      'सुहाने, सूखे हफ़्ते: सब्ज़ियों और फूलों के लिए बढ़िया।',
    ],
    [
      'Keep sowing greens, beans and tomato.',
      'पत्तेदार सब्ज़ियां, सेम और टमाटर बोते रहें।',
    ],
    [
      'Water in the morning as the air dries.',
      'हवा सूखने लगे तो सुबह पानी दें।',
    ],
    [
      'Mango flowers now: hold back water until flowers set.',
      'आम में अभी फूल आते हैं: फल लगने तक पानी रोककर रखें।',
    ],
  ),
  m(
    'Cool season',
    [
      'Warming up: mulch and prune before summer.',
      'मौसम गर्म हो रहा है: गर्मियों से पहले मल्च बिछाएं और छंटाई करें।',
    ],
    [
      'Prune guava, citrus and pomegranate lightly.',
      'अमरूद, नींबू-संतरा और अनार की हल्की छंटाई करें।',
    ],
    [
      'Mulch beds and tree bases.',
      'क्यारियों में और पेड़ों के तने के पास मल्च बिछाएं।',
    ],
    ['Feed fruit trees with compost.', 'फलदार पेड़ों को कम्पोस्ट दें।'],
  ),
  m(
    'Summer',
    [
      'Heat builds: water deeply and shade young plants.',
      'गर्मी बढ़ रही है: गहरा पानी दें और छोटे पौधों को छांव दें।',
    ],
    [
      'Water early in the morning, deeply rather than daily.',
      'सुबह जल्दी पानी दें, रोज़ थोड़ा नहीं, बल्कि गहरा।',
    ],
    [
      'Shade saplings and pots in the afternoon.',
      'दोपहर में पौधों और गमलों को छांव दें।',
    ],
    ['Sow okra, gourds and amaranth.', 'भिंडी, लौकी-तोरी और चौलाई बोएं।'],
  ),
  m(
    'Summer',
    [
      'Peak summer: help plants hold on.',
      'भरी गर्मी: पौधों को टिके रहने में मदद करें।',
    ],
    [
      'Water pots daily; trees deeply once or twice a week.',
      'गमलों को रोज़ पानी दें; पेड़ों को हफ़्ते में एक-दो बार गहरा पानी।',
    ],
    ['Keep mulch thick around trees.', 'पेड़ों के आसपास मल्च मोटी रखें।'],
    ['Harvest mangoes as they colour.', 'रंग आते ही आम तोड़ें।'],
  ),
  m(
    'Summer',
    [
      'The last hot month: get ready for the rains.',
      'गर्मी का आखिरी महीना: बारिश की तैयारी करें।',
    ],
    [
      'Dig pits and prepare compost for planting.',
      'पेड़ लगाने के लिए गड्ढे खोदें और कम्पोस्ट तैयार करें।',
    ],
    ['Clear drains before the monsoon.', 'मानसून से पहले नालियां साफ़ करें।'],
    ['Pick summer vegetables often.', 'गर्मी की सब्ज़ियां बार-बार तोड़ें।'],
  ),
  m(
    'Southwest monsoon',
    [
      'Rains begin: plant trees and sow monsoon crops.',
      'बारिश शुरू: पेड़ लगाएं और बरसात की फसलें बोएं।',
    ],
    [
      'Plant new fruit trees once the soil is wet.',
      'मिट्टी गीली होते ही नए फलदार पेड़ लगाएं।',
    ],
    ['Sow beans, gourds and okra.', 'सेम, लौकी-तोरी और भिंडी बोएं।'],
    [
      'Make sure water drains away from trunks.',
      'ध्यान रखें कि पानी तनों से दूर बह जाए।',
    ],
  ),
  m(
    'Southwest monsoon',
    [
      'Monsoon growth: weed, stake and watch for fungus.',
      'मानसून में तेज़ बढ़त: निराई करें, सहारा दें और फफूंद पर नज़र रखें।',
    ],
    [
      'Weed often; everything grows fast now.',
      'बार-बार निराई करें; अभी सब कुछ तेज़ी से बढ़ता है।',
    ],
    [
      'Stake young trees against wind.',
      'हवा से बचाने के लिए छोटे पेड़ों को डंडे का सहारा दें।',
    ],
    ['Clear fallen fruit and leaves.', 'गिरे फल और पत्ते साफ़ करें।'],
  ),
  m(
    'Southwest monsoon',
    [
      'Steady rains: keep drainage clear.',
      'लगातार बारिश: पानी की निकासी साफ़ रखें।',
    ],
    [
      'Look for pests under leaves after wet spells.',
      'बारिश के दौर के बाद पत्तों के नीचे कीड़े देखें।',
    ],
    [
      'Feed fruit trees in a dry break.',
      'बारिश रुकने पर फलदार पेड़ों को खाद दें।',
    ],
    [
      'Keep sowing greens in raised beds.',
      'ऊंची क्यारियों में पत्तेदार सब्ज़ियां बोते रहें।',
    ],
  ),
  m(
    'Southwest monsoon',
    [
      'The southwest monsoon tails off: start the nursery.',
      'दक्षिण-पश्चिम मानसून थम रहा है: नर्सरी शुरू करें।',
    ],
    [
      'Raise tomato, brinjal and chilli seedlings in trays.',
      'ट्रे में टमाटर, बैंगन और मिर्च की पौध तैयार करें।',
    ],
    [
      'Add compost to beds for the next season.',
      'अगले मौसम के लिए क्यारियों में कम्पोस्ट डालें।',
    ],
    [
      'Feed fruit trees after the rains.',
      'बारिश के बाद फलदार पेड़ों को खाद दें।',
    ],
  ),
  m(
    'Northeast monsoon',
    [
      'The second rains arrive: a fine time to plant.',
      'दूसरी बारिश आ गई: पौधे लगाने का अच्छा समय।',
    ],
    [
      'Transplant seedlings and sow greens and beans.',
      'पौध रोपें, और पत्तेदार सब्ज़ियां और सेम बोएं।',
    ],
    ['Plant trees while the soil is moist.', 'मिट्टी नम रहते पेड़ लगाएं।'],
    [
      'Check drainage again before heavy showers.',
      'तेज़ बौछारों से पहले पानी की निकासी फिर से जांचें।',
    ],
  ),
  m(
    'Northeast monsoon',
    [
      'Heavy showers in many places: guard roots and leaves.',
      'कई जगह तेज़ बौछारें: जड़ों और पत्तों को बचाएं।',
    ],
    [
      'Make sure pots and beds drain well; raise pots off the ground.',
      'ध्यान रखें कि गमलों और क्यारियों से पानी अच्छे से निकले; गमलों को ज़मीन से ऊपर रखें।',
    ],
    ['Clear fallen leaves and fruit.', 'गिरे पत्ते और फल साफ़ करें।'],
    [
      'Watch for fungus on leaves after wet spells.',
      'बारिश के दौर के बाद पत्तों पर फफूंद पर नज़र रखें।',
    ],
  ),
  m(
    'Northeast monsoon',
    [
      'Rains ease: sow the cool-season vegetables.',
      'बारिश कम हो रही है: ठंडे मौसम की सब्ज़ियां बोएं।',
    ],
    [
      'Sow carrot, radish, palak and coriander.',
      'गाजर, मूली, पालक और धनिया बोएं।',
    ],
    [
      'Weed and add compost to beds.',
      'क्यारियों की निराई करें और कम्पोस्ट डालें।',
    ],
    [
      'Sow flowers like marigold and zinnia.',
      'गेंदा और ज़िनिया जैसे फूल बोएं।',
    ],
  ),
];

const COASTAL: SeasonMonth[] = [
  m(
    'Dry season',
    [
      'Dry, sunny weeks: water regularly and keep sowing.',
      'सूखे, धूप वाले हफ़्ते: नियम से पानी दें और बोते रहें।',
    ],
    [
      'Water in the morning; sandy coastal soil dries fast.',
      'सुबह पानी दें; समुद्र किनारे की रेतीली मिट्टी जल्दी सूखती है।',
    ],
    ['Sow greens, beans and tomato.', 'पत्तेदार सब्ज़ियां, सेम और टमाटर बोएं।'],
    [
      'Mulch beds to hold moisture.',
      'नमी बनाए रखने के लिए क्यारियों में मल्च बिछाएं।',
    ],
  ),
  m(
    'Dry season',
    [
      'Dry and warming: mulch and feed trees.',
      'सूखा और गर्म होता मौसम: मल्च बिछाएं और पेड़ों को खाद दें।',
    ],
    [
      'Add compost and mulch around coconut, mango and banana.',
      'नारियल, आम और केले के आसपास कम्पोस्ट और मल्च डालें।',
    ],
    [
      'Prune dead and crossing branches.',
      'सूखी और आपस में फंसी डालियां काटें।',
    ],
    [
      'Mango flowers now: hold back water until flowers set.',
      'आम में अभी फूल आते हैं: फल लगने तक पानी रोककर रखें।',
    ],
  ),
  m(
    'Summer',
    [
      'Heat and humidity rise: water deeply and early.',
      'गर्मी और उमस बढ़ रही है: सुबह जल्दी और गहरा पानी दें।',
    ],
    ['Water early in the morning, deeply.', 'सुबह जल्दी, गहरा पानी दें।'],
    [
      'Shade young plants in the afternoon.',
      'दोपहर में छोटे पौधों को छांव दें।',
    ],
    ['Sow okra, gourds and amaranth.', 'भिंडी, लौकी-तोरी और चौलाई बोएं।'],
  ),
  m(
    'Summer',
    [
      'Hot, humid summer: help plants hold on.',
      'गर्म, उमस भरी गर्मी: पौधों को टिके रहने में मदद करें।',
    ],
    [
      'Water pots daily; mulch thickly.',
      'गमलों को रोज़ पानी दें; मोटी मल्च बिछाएं।',
    ],
    [
      'Harvest mangoes and jackfruit as they ripen.',
      'आम और कटहल पकते ही तोड़ें।',
    ],
    ['Watch for mealybugs on new growth.', 'नई बढ़त पर मिलीबग पर नज़र रखें।'],
  ),
  m(
    'Summer',
    [
      'The last hot weeks: get ready for the monsoon.',
      'गर्मी के आखिरी हफ़्ते: मानसून की तैयारी करें।',
    ],
    [
      'Clear drains and raise pots off the ground.',
      'नालियां साफ़ करें और गमलों को ज़मीन से ऊपर रखें।',
    ],
    [
      'Dig pits and prepare compost for planting.',
      'पेड़ लगाने के लिए गड्ढे खोदें और कम्पोस्ट तैयार करें।',
    ],
    [
      'Cut back overgrown branches before the storms.',
      'आंधी-तूफ़ान से पहले बहुत बढ़ी डालियां छांट दें।',
    ],
  ),
  m(
    'Southwest monsoon',
    [
      'The monsoon arrives: plant trees and check drainage.',
      'मानसून आ गया: पेड़ लगाएं और पानी की निकासी जांचें।',
    ],
    [
      'Plant new trees and saplings once the soil is wet.',
      'मिट्टी गीली होते ही नए पेड़ और पौधे लगाएं।',
    ],
    [
      'Make sure water never stands around trunks.',
      'ध्यान रखें कि तनों के आसपास पानी कभी न रुके।',
    ],
    [
      'Stake young plants against wind.',
      'हवा से बचाने के लिए छोटे पौधों को डंडे का सहारा दें।',
    ],
  ),
  m(
    'Southwest monsoon',
    [
      'Very heavy rain: protect roots from waterlogging.',
      'बहुत तेज़ बारिश: जड़ों को जलभराव से बचाएं।',
    ],
    [
      'Keep drains clear; lift pots so they drain.',
      'नालियां साफ़ रखें; गमले ऊपर उठाएं ताकि पानी निकल जाए।',
    ],
    [
      'Clear fallen leaves and fruit to stop rot.',
      'सड़न रोकने के लिए गिरे पत्ते और फल साफ़ करें।',
    ],
    ['Hold off feeding until a dry break.', 'बारिश रुकने तक खाद न दें।'],
  ),
  m(
    'Southwest monsoon',
    [
      'Monsoon growth: weed and watch for fungus.',
      'मानसून में तेज़ बढ़त: निराई करें और फफूंद पर नज़र रखें।',
    ],
    [
      'Weed often; everything grows fast.',
      'बार-बार निराई करें; सब कुछ तेज़ी से बढ़ता है।',
    ],
    [
      'Check leaves for fungus after wet spells.',
      'बारिश के दौर के बाद पत्तों पर फफूंद देखें।',
    ],
    [
      'Sow greens in raised beds or containers.',
      'ऊंची क्यारियों या गमलों में पत्तेदार सब्ज़ियां बोएं।',
    ],
  ),
  m(
    'Southwest monsoon',
    [
      "The rains ease: start the next season's nursery.",
      'बारिश कम हो रही है: अगले मौसम की नर्सरी शुरू करें।',
    ],
    [
      'Raise tomato, brinjal and chilli seedlings in trays.',
      'ट्रे में टमाटर, बैंगन और मिर्च की पौध तैयार करें।',
    ],
    [
      'Feed fruit trees in a dry spell.',
      'सूखे दिनों में फलदार पेड़ों को खाद दें।',
    ],
    ['Add compost to beds.', 'क्यारियों में कम्पोस्ट डालें।'],
  ),
  m(
    'Post-monsoon',
    [
      'Rains retreat: a fine time to sow and transplant.',
      'बारिश लौट रही है: बुवाई और पौध रोपने का अच्छा समय।',
    ],
    [
      'Transplant seedlings; sow beans and greens.',
      'पौध रोपें; सेम और पत्तेदार सब्ज़ियां बोएं।',
    ],
    [
      'Weed and refresh beds with compost.',
      'निराई करें और कम्पोस्ट डालकर क्यारियां फिर से तैयार करें।',
    ],
    [
      'Sow flowers like marigold and zinnia.',
      'गेंदा और ज़िनिया जैसे फूल बोएं।',
    ],
  ),
  m(
    'Post-monsoon',
    [
      'Showers fade: the start of the best growing weeks.',
      'बौछारें थम रही हैं: उगाने के सबसे अच्छे हफ़्तों की शुरुआत।',
    ],
    [
      'Sow carrot, radish, palak and coriander.',
      'गाजर, मूली, पालक और धनिया बोएं।',
    ],
    ['Water as the soil dries out.', 'मिट्टी सूखने पर पानी दें।'],
    ['Watch for pests on young seedlings.', 'छोटी पौध पर कीड़ों पर नज़र रखें।'],
  ),
  m(
    'Dry season',
    [
      'Pleasant, dry weeks: steady growth and easy harvests.',
      'सुहाने, सूखे हफ़्ते: लगातार बढ़त और आसान तुड़ाई।',
    ],
    [
      'Keep sowing greens every few weeks.',
      'हर कुछ हफ़्तों में पत्तेदार सब्ज़ियां बोते रहें।',
    ],
    [
      'Water regularly; mulch beds.',
      'नियम से पानी दें; क्यारियों में मल्च बिछाएं।',
    ],
    ['Harvest vegetables often.', 'सब्ज़ियां बार-बार तोड़ें।'],
  ),
];

const HILLS: SeasonMonth[] = [
  m(
    'Winter',
    [
      'Deep winter: protect plants and rest the garden.',
      'कड़ाके की सर्दी: पौधों को बचाएं और बगीचे को आराम दें।',
    ],
    [
      'Cover young plants and pots on freezing nights; frost and snow can damage them.',
      'जमा देने वाली रातों में छोटे पौधों और गमलों को ढकें; पाला और बर्फ़ उन्हें नुकसान पहुंचा सकते हैं।',
    ],
    [
      'Water only when the soil is dry, around midday.',
      'मिट्टी सूखी हो तभी पानी दें, दोपहर के आसपास।',
    ],
    [
      'Prune dormant apple, pear and plum trees.',
      'सर्दी में सोए सेब, नाशपाती और आलूबुखारे के पेड़ों की छंटाई करें।',
    ],
  ),
  m(
    'Winter',
    [
      'Late winter: finish pruning before buds swell.',
      'सर्दी का आखिरी दौर: कलियां फूलने से पहले छंटाई पूरी करें।',
    ],
    [
      'Finish pruning dormant fruit trees.',
      'सर्दी में सोए फलदार पेड़ों की छंटाई पूरी करें।',
    ],
    [
      'Add compost around fruit trees.',
      'फलदार पेड़ों के आसपास कम्पोस्ट डालें।',
    ],
    [
      'Keep pots sheltered from snow and frost.',
      'गमलों को बर्फ़ और पाले से बचाकर रखें।',
    ],
  ),
  m(
    'Spring',
    [
      'Spring wakes the garden: start sowing.',
      'वसंत में बगीचा जाग उठता है: बुवाई शुरू करें।',
    ],
    [
      'Sow peas, palak, coriander and lettuce.',
      'मटर, पालक, धनिया और लेट्यूस बोएं।',
    ],
    [
      'Watch fruit blossom for late frost; cover small trees if needed.',
      'फलों के फूलों को देर से पड़ने वाले पाले से बचाएं; ज़रूरत हो तो छोटे पेड़ ढकें।',
    ],
    [
      'Feed fruit trees as growth starts.',
      'बढ़त शुरू होते ही फलदार पेड़ों को खाद दें।',
    ],
  ),
  m(
    'Spring',
    ['Blossom time and fresh growth.', 'फूलों का समय और नई बढ़त।'],
    [
      'Sow beans, tomato and cucumber in sheltered spots.',
      'आड़ वाली जगहों पर सेम, टमाटर और खीरा बोएं।',
    ],
    ['Water regularly as days lengthen.', 'दिन लंबे होने पर नियम से पानी दें।'],
    [
      'Thin out seedlings for space.',
      'जगह बनाने के लिए घनी पौध में से कुछ निकाल दें।',
    ],
  ),
  m(
    'Spring',
    [
      'Warm days: the main sowing and planting weeks.',
      'गर्म दिन: बुवाई और रोपाई के मुख्य हफ़्ते।',
    ],
    [
      'Transplant tomato and capsicum seedlings.',
      'टमाटर और शिमला मिर्च की पौध रोपें।',
    ],
    [
      'Mulch beds to hold moisture.',
      'नमी बनाए रखने के लिए क्यारियों में मल्च बिछाएं।',
    ],
    [
      'Thin fruit on heavily set trees.',
      'जिन पेड़ों पर बहुत फल लगे हों, उनके कुछ फल तोड़कर कम करें।',
    ],
  ),
  m(
    'Summer',
    [
      'Mild summer: steady growth before the rains.',
      'हल्की गर्मी: बारिश से पहले लगातार बढ़त।',
    ],
    [
      'Water in the morning; mulch keeps roots cool.',
      'सुबह पानी दें; मल्च जड़ों को ठंडा रखती है।',
    ],
    [
      'Stake tall plants like tomato and beans.',
      'टमाटर और सेम जैसे लंबे पौधों को डंडे का सहारा दें।',
    ],
    ['Clear drains before the monsoon.', 'मानसून से पहले नालियां साफ़ करें।'],
  ),
  m(
    'Monsoon',
    [
      'The rains arrive: guard slopes and drainage.',
      'बारिश आ गई: ढलानों और पानी की निकासी का ध्यान रखें।',
    ],
    [
      'Make sure water runs off and never pools around trunks.',
      'ध्यान रखें कि पानी बह जाए और तनों के आसपास कभी जमा न हो।',
    ],
    [
      'Plant new fruit trees once the soil is wet.',
      'मिट्टी गीली होते ही नए फलदार पेड़ लगाएं।',
    ],
    [
      'Watch for slugs and snails on leaves.',
      'पत्तों पर स्लग और घोंघों पर नज़र रखें।',
    ],
  ),
  m(
    'Monsoon',
    [
      'Wet, misty weeks: watch for fungus.',
      'गीले, धुंध भरे हफ़्ते: फफूंद पर नज़र रखें।',
    ],
    ['Clear fallen fruit and leaves.', 'गिरे फल और पत्ते साफ़ करें।'],
    [
      'Check leaves for scab and mildew after wet spells.',
      'बारिश के दौर के बाद पत्तों पर स्कैब और मिल्ड्यू देखें।',
    ],
    [
      'Stake young trees on slopes.',
      'ढलानों पर छोटे पेड़ों को डंडे का सहारा दें।',
    ],
  ),
  m(
    'Monsoon',
    [
      'The rains ease: harvest and plan for autumn.',
      'बारिश कम हो रही है: तुड़ाई करें और पतझड़ की तैयारी सोचें।',
    ],
    [
      'Harvest apples, pears and plums as they ripen.',
      'सेब, नाशपाती और आलूबुखारा पकते ही तोड़ें।',
    ],
    [
      'Weed beds and add compost.',
      'क्यारियों की निराई करें और कम्पोस्ट डालें।',
    ],
    [
      'Sow radish, turnip and greens for autumn.',
      'पतझड़ के लिए मूली, शलगम और पत्तेदार सब्ज़ियां बोएं।',
    ],
  ),
  m(
    'Autumn',
    [
      'Clear, cool autumn: plant and sow for winter.',
      'साफ़, ठंडा पतझड़: सर्दी के लिए पौधे लगाएं और बोएं।',
    ],
    [
      'Sow garlic, onion sets, palak and peas.',
      'लहसुन, प्याज़ की छोटी गांठें, पालक और मटर बोएं।',
    ],
    [
      'Plant new fruit trees before the ground gets cold.',
      'ज़मीन ठंडी होने से पहले नए फलदार पेड़ लगाएं।',
    ],
    ['Water less as days shorten.', 'दिन छोटे होने पर पानी कम दें।'],
  ),
  m(
    'Autumn',
    [
      'Last mild weeks: get the garden ready for winter.',
      'आखिरी हल्के हफ़्ते: बगीचे को सर्दी के लिए तैयार करें।',
    ],
    [
      'Mulch beds and tree bases against the cold.',
      'ठंड से बचाने के लिए क्यारियों में और पेड़ों के तने के पास मल्च बिछाएं।',
    ],
    [
      'Bring tender pots to a sheltered spot.',
      'नाज़ुक पौधों के गमले आड़ वाली जगह ले आएं।',
    ],
    [
      'Harvest late vegetables before frost.',
      'पाला पड़ने से पहले बची हुई सब्ज़ियां तोड़ लें।',
    ],
  ),
  m(
    'Winter',
    [
      'Winter returns: shelter plants and rest.',
      'सर्दी लौट आई: पौधों को आड़ दें और बगीचे को आराम दें।',
    ],
    [
      'Cover young plants on frosty nights.',
      'पाले वाली रातों में छोटे पौधों को ढकें।',
    ],
    [
      'Water sparingly, only around midday.',
      'थोड़ा पानी दें, सिर्फ़ दोपहर के आसपास।',
    ],
    [
      "Plan next year's beds and order seeds.",
      'अगले साल की क्यारियों की योजना बनाएं और बीज मंगवाएं।',
    ],
  ),
];

const MONTHS: Record<RegionCluster, SeasonMonth[]> = {
  NORTH_INDIA: PLAINS_NORTH,
  EAST_INDIA: PLAINS_EAST,
  CENTRAL_INDIA: PLAINS_CENTRAL,
  WEST_INDIA: WEST,
  SOUTH_DECCAN: SOUTH,
  COASTAL_HUMID: COASTAL,
  HILLS_COOL: HILLS,
};

export const SEASON_GUIDE_SEED: SeasonGuideSeed[] = (
  Object.entries(MONTHS) as Array<[RegionCluster, SeasonMonth[]]>
).map(([region, months]) => ({
  region,
  months,
  status: 'APPROVED',
  notes: null,
}));
