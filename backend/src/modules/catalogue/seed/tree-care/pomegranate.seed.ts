import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Pomegranate care for a tree left to flower naturally, transcribed from the
 * source-checked table approved by the owner on 2026-11-23 with every
 * recommendation (docs/plant-care/pomegranate.md, with a source for every row).
 * Change it only through the add-plant playbook.
 *
 * Owner decision: no bahar (forced flowering season) steps; home gardeners let
 * the tree flower on its own. NORTH_INDIA = PAU, SOUTH_DECCAN = TNAU (December
 * prune only: no per-year bearing feed is sourced there). WEST_INDIA is
 * pending: every source times a grown tree from a forced bahar.
 */

const BOTH = ['YOUNG', 'BEARING'] as TreeCareItem['stages'];
const BEARING = ['BEARING'] as TreeCareItem['stages'];
const ALL_YEAR: Anchor = { kind: 'CALENDAR', from: [1, 1], to: [12, 31] };
const cal = (
  from: [number, number],
  to: [number, number],
): Extract<Anchor, { kind: 'CALENDAR' }> => ({
  kind: 'CALENDAR',
  from,
  to,
});

/** NIPHM: ring trench 45–60 cm from the stem. */
const TRENCH =
  'in a ring trench 15–20 cm wide and 8–10 cm deep, 45–60 cm from the stem; cover with soil and water lightly';
const TRENCH_HI =
  'तने से 45–60 cm दूर, 15–20 cm चौड़ी और 8–10 cm गहरी गोल खाई में डालें; मिट्टी से ढकें और हल्का पानी दें';
/** 10% Bordeaux paste (NRC 146 p.8). */
const PASTE =
  'Bordeaux paste (soak 100 g copper sulphate in 500 ml water and 100 g lime in another 500 ml overnight, mix in the morning; plastic or clay pot, never iron)';
const PASTE_HI =
  'Bordeaux paste (100 g copper sulphate 500 ml पानी में और 100 g चूना दूसरे 500 ml में रात भर भिगोएं, सुबह मिला लें; प्लास्टिक या मिट्टी का बर्तन लें, लोहे का कभी नहीं)';
/** 1% Bordeaux spray (NRC 146 p.7), only with no fruit on the tree. */
const SPRAY =
  '1% Bordeaux (10 g copper sulphate and 3–4 g lime per litre, each soaked overnight in plastic, mixed and strained; use the same day)';
const SPRAY_HI =
  '1% Bordeaux (प्रति लीटर 10 g copper sulphate और 3–4 g चूना, दोनों अलग-अलग प्लास्टिक में रात भर भिगोकर, मिलाकर छान लें; उसी दिन इस्तेमाल करें)';
const CYANTRANILIPROLE = (mlPerLitre: string) =>
  `Cyantraniliprole 10.26% OD, ${mlPerLitre} ml per litre. Wear gloves; never within 5 days of picking`;
const CYANTRANILIPROLE_HI = (mlPerLitre: string) =>
  `Cyantraniliprole 10.26% OD, ${mlPerLitre} ml प्रति लीटर। दस्ताने पहनें; तोड़ने से 5 दिन पहले तक नहीं`;
const KASUGAMYCIN =
  'Kasugamycin 5% + copper oxychloride 45% WP, 1 g per litre. Wear gloves; never within 10 days of picking';
const KASUGAMYCIN_HI =
  'Kasugamycin 5% + copper oxychloride 45% WP, 1 g प्रति लीटर। दस्ताने पहनें; तोड़ने से 10 दिन पहले तक नहीं';

/** PAU: 5 kg FYM per year of age (cap: the urea's 5 years). */
const MANURE_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 5000 }],
  chemical: [],
  maxAgeYears: 5,
};
/** PAU: 50 g urea per year of age up to 5 years, half in Feb, half in Apr. */
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 25 }],
  maxAgeYears: 5,
};

/** "Only if you see it": plant page only, in every region with care. */
const SIGNS: TreeCareItem[] = [
  {
    key: 'bag_fruit',
    title: 'Bag young fruits against the anar butterfly',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional: 'Small fruits have set',
    organic:
      'Slip a paper or white non-woven bag over each fruit as soon as it sets, no later than 5 cm across, tied loosely at the stalk. Pick off and destroy any fruit with a hole and dark droppings. Pull up flowering daisy-family weeds nearby. The bags also keep off fruit fly, fruit-piercing moth and birds',
    chemical: `From flowering: ${CYANTRANILIPROLE('0.75')}`,
    why: 'The anar butterfly lays eggs on young fruit; the caterpillar rots it from inside',
    hi: {
      title: 'अनार की तितली से बचाने को छोटे फलों पर थैली चढ़ाएं',
      conditional: 'छोटे फल लग गए हैं',
      organic:
        'हर फल लगते ही उस पर कागज़ की या सफ़ेद non-woven थैली चढ़ाएं, फल 5 cm से बड़ा होने से पहले, और डंठल पर ढीला बांधें। जिस फल में छेद और काली बीट हो उसे तोड़कर नष्ट करें। पास में फूल वाले daisy-परिवार के खरपतवार उखाड़ दें। थैलियां फल मक्खी, फल चूसने वाले पतंगे और चिड़ियों से भी बचाती हैं',
      chemical: `फूल आने के बाद से: ${CYANTRANILIPROLE_HI('0.75')}`,
      why: 'अनार की तितली छोटे फल पर अंडे देती है; उसकी सुंडी फल को अंदर से सड़ा देती है',
    },
  },
  {
    key: 'even_water',
    title: 'Water evenly while fruit grows to stop cracking',
    category: 'WATERING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Fruit is forming',
    organic:
      'Water regularly from fruit set to harvest; never let the soil dry hard and then flood it. Mulch the basin. Pick fruit as soon as it is ripe',
    chemical:
      'Young trees that crack (lack of boron): boric acid 0.5 g per litre on the leaves before bloom and at fruit set, never near ripening. A fertiliser: no waiting period. Wear gloves',
    why: 'A dry spell followed by heavy water splits the fruit',
    hi: {
      title: 'फल बढ़ते समय बराबर पानी दें ताकि फल न फटें',
      conditional: 'फल बन रहे हैं',
      organic:
        'फल लगने से तुड़ाई तक नियमित पानी दें; मिट्टी को कभी सूखकर सख़्त न होने दें और फिर एकदम ज़्यादा पानी न भरें। थाले में मल्च बिछाएं। फल पकते ही तोड़ लें',
      chemical:
        'जिन छोटे पेड़ों के फल फटें (boron की कमी): boric acid 0.5 g प्रति लीटर पत्तियों पर, फूल आने से पहले और फल लगने पर, पकने के पास कभी नहीं। यह खाद है: तोड़ने से पहले रुकने की ज़रूरत नहीं। दस्ताने पहनें',
      why: 'सूखे के बाद एकदम ज़्यादा पानी से फल फट जाते हैं',
    },
  },
  {
    key: 'blight',
    title: 'Cut out and treat oily-spot blight',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Dark, oily, water-soaked spots on leaves or fruit; fruit splitting in an L shape; dark cankers on twigs',
    organic: `Cut affected twigs 5–10 cm below the canker and cover each cut with ${PASTE}. Pick and burn or bury spotted fruit and fallen leaves. Wipe the secateurs in bleach (2–3 ml per litre) between cuts. Water at the base only. Only when no fruit is on the tree: spray ${SPRAY}. Wear gloves`,
    chemical: KASUGAMYCIN,
    why: 'Bacterial blight spreads by rain splash, tools and cuttings',
    hi: {
      title: 'तेलिया धब्बा रोग वाली टहनियां काटें और इलाज करें',
      conditional:
        'पत्तियों या फल पर काले, तेल जैसे, पानी से भीगे धब्बे; फल L आकार में फटना; टहनियों पर काले घाव',
      organic: `खराब टहनियां घाव से 5–10 cm नीचे से काटें और हर कटी जगह पर ${PASTE_HI} लगाएं। धब्बे वाले फल और गिरी पत्तियां उठाकर जला दें या गाड़ दें। हर कट के बीच कैंची को bleach (2–3 ml प्रति लीटर) से पोंछें। पानी सिर्फ़ जड़ में दें। जब पेड़ पर कोई फल न हो, तभी ${SPRAY_HI} स्प्रे करें। दस्ताने पहनें`,
      chemical: KASUGAMYCIN_HI,
      why: 'बैक्टीरिया वाला यह झुलसा रोग बारिश की छींटों, औज़ारों और कलमों से फैलता है',
    },
  },
  {
    key: 'wilt',
    title: 'Remove a wilting tree with its roots',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Leaves yellow and dry on one branch, then the whole tree; the wood inside is dark brown',
    organic:
      "Once a whole branch is affected, dig out the whole tree with its roots and burn it. Don't replant there until the soil has been sun-baked under clear plastic. Never let water stand in the basin",
    why: 'Wilt has no cure and spreads through the soil to nearby trees',
    hi: {
      title: 'मुरझाते पेड़ को जड़ समेत निकाल दें',
      conditional:
        'एक डाल पर पत्तियां पीली होकर सूखें, फिर पूरे पेड़ पर; अंदर की लकड़ी गहरी भूरी',
      organic:
        'जब पूरी एक डाल पर असर हो जाए, पूरे पेड़ को जड़ों समेत खोदकर जला दें। वहां तब तक दोबारा न लगाएं जब तक मिट्टी को साफ़ प्लास्टिक के नीचे धूप में तपा न लिया जाए। थाले में कभी पानी खड़ा न रहने दें',
      why: 'उकठा (wilt) का कोई इलाज नहीं और यह मिट्टी से पास के पेड़ों में फैलता है',
    },
  },
  {
    key: 'thrips',
    title: 'Check thrips on buds and young fruit',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Scabby, scraped marks on buds and fruit, or new leaves curled and tips dried',
    organic:
      "Snip off and destroy affected shoots. Hang blue sticky traps. Don't grow chilli, onion, garlic, brinjal or tomato beside the tree",
    chemical: CYANTRANILIPROLE('0.75'),
    why: 'Thrips scar the fruit skin and stunt new shoots',
    hi: {
      title: 'कलियों और छोटे फलों पर थ्रिप्स देखें',
      conditional:
        'कलियों और फल पर खुरदरे, खुरचे हुए निशान, या नई पत्तियां मुड़ी और सिरे सूखे',
      organic:
        'खराब टहनियां काटकर नष्ट करें। नीले चिपचिपे ट्रैप टांगें। पेड़ के पास मिर्च, प्याज़, लहसुन, बैंगन या टमाटर न लगाएं',
      chemical: CYANTRANILIPROLE_HI('0.75'),
      why: 'थ्रिप्स फल के छिलके पर दाग़ डालते हैं और नई टहनियों की बढ़त रोकते हैं',
    },
  },
  {
    key: 'aphids_whitefly',
    title: 'Wash off aphids and whitefly',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Sticky leaves, black sooty mould, or clusters of small insects on new shoots and under leaves',
    organic:
      "Hose the undersides of the leaves with a strong jet of water. Hang yellow sticky traps. Ask the KVK for green lacewing larvae to release when flowers begin. Don't grow roses beside the tree",
    chemical: CYANTRANILIPROLE('0.9'),
    why: 'They suck sap from new growth and the honeydew grows black mould',
    hi: {
      title: 'माहू और सफ़ेद मक्खी को पानी से धो दें',
      conditional:
        'चिपचिपी पत्तियां, काली फफूंद, या नई टहनियों पर और पत्तियों के नीचे छोटे कीड़ों के झुंड',
      organic:
        'पत्तियों के नीचे पानी की तेज़ धार मारें। पीले चिपचिपे ट्रैप टांगें। फूल शुरू होने पर छोड़ने के लिए KVK से green lacewing के लार्वा मांगें। पेड़ के पास गुलाब न लगाएं',
      chemical: CYANTRANILIPROLE_HI('0.9'),
      why: 'ये नई बढ़त का रस चूसते हैं और इनके चिपचिपे मीठे रस पर काली फफूंद उगती है',
    },
  },
  {
    key: 'mites',
    title: 'Water regularly to keep mites down',
    category: 'WATERING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Shiny white or brown patches under leaves; leaves curl and fall, and a pressed leaf stains red',
    organic:
      'Keep watering regularly through dry spells; mites are worst from April to October in dry weather',
    why: 'Mites build up on dry, stressed trees',
    hi: {
      title: 'माइट्स कम रखने के लिए नियमित पानी दें',
      conditional:
        'पत्तियों के नीचे चमकीले सफ़ेद या भूरे धब्बे; पत्तियां मुड़कर गिरती हैं, और दबाने पर पत्ती लाल दाग़ छोड़ती है',
      organic:
        'सूखे दिनों में नियमित पानी देते रहें; सूखे मौसम में अप्रैल से अक्टूबर तक माइट्स सबसे ज़्यादा होते हैं',
      why: 'सूखे, कमज़ोर पेड़ों पर माइट्स बढ़ते हैं',
    },
  },
  {
    key: 'suckers',
    title: 'Pull out suckers from the base',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Shoots coming up from the base or roots',
    organic:
      'Remove them as soon as they appear. Keep the trunk clear of shoots to 30–60 cm, with 3–4 main branches above',
    why: 'Suckers take food from the fruiting branches',
    hi: {
      title: 'नीचे से निकलने वाली टहनियां उखाड़ दें',
      conditional: 'तने के निचले हिस्से या जड़ों से निकलती टहनियां',
      organic:
        'दिखते ही हटा दें। तने को 30–60 cm तक टहनियों से साफ़ रखें, ऊपर 3–4 मुख्य डालियां रखें',
      why: 'ये टहनियां फल वाली डालियों की खुराक ले लेती हैं',
    },
  },
  {
    key: 'fungal_spots',
    title: 'Treat dark fungal spots on leaves and fruit',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Dry, dark, round spots on leaves or fruit that are not oily or sticky',
    organic:
      'Pick off and destroy spotted fruit, leaves and twigs. Thin crowded branches to let air in',
    chemical:
      'Propineb 70% WP, 3 g per litre. Wear gloves; never within 10 days of picking',
    why: 'Leaf and fruit spots spread in damp, crowded canopies',
    hi: {
      title: 'पत्तियों और फल पर काले फफूंद धब्बों का इलाज करें',
      conditional:
        'पत्तियों या फल पर सूखे, काले, गोल धब्बे जो तेल जैसे या चिपचिपे न हों',
      organic:
        'धब्बे वाले फल, पत्तियां और टहनियां तोड़कर नष्ट करें। घनी डालियां छांटें ताकि हवा आए',
      chemical:
        'Propineb 70% WP, 3 g प्रति लीटर। दस्ताने पहनें; तोड़ने से 10 दिन पहले तक नहीं',
      why: 'नमी वाली घनी छतरी में पत्ती और फल के धब्बे फैलते हैं',
    },
  },
  {
    key: 'deadwood',
    title: 'Cut out dead, crossing and trunk shoots',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Dead, broken or crossing branches, or shoots on the trunk',
    organic: `Cut them out. Cover cuts thicker than 1 cm with ${PASTE}. Wear gloves`,
    why: 'Dead wood harbours blight and borers',
    hi: {
      title: 'सूखी, आपस में फंसी और तने की टहनियां काटें',
      conditional:
        'सूखी, टूटी या आपस में फंसी डालियां, या तने पर निकली टहनियां',
      organic: `इन्हें काट दें। 1 cm से मोटे कट पर ${PASTE_HI} लगाएं। दस्ताने पहनें`,
      why: 'सूखी लकड़ी में झुलसा रोग और छेदक कीड़े पलते हैं',
    },
  },
  {
    key: 'bark_caterpillar',
    title: 'Clear bark-eating caterpillar from the trunk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Webbing of chewed wood and droppings on the bark, with holes',
    organic:
      'Clear the webbing. Push a cotton swab wet with kerosene into each hole and seal it with wet mud',
    why: 'The caterpillar tunnels into the trunk and weakens branches',
    hi: {
      title: 'तने से छाल खाने वाली सुंडी हटाएं',
      conditional: 'छाल पर चबाई लकड़ी और बीट का जाला, साथ में छेद',
      organic:
        'जाला साफ़ करें। हर छेद में मिट्टी के तेल में भीगी रुई डालें और गीली मिट्टी से बंद कर दें',
      why: 'सुंडी तने में सुरंग बनाती है और डालियों को कमज़ोर करती है',
    },
  },
];

const phase = (
  from: [number, number],
  to: [number, number],
  name: string,
  avoid: string[],
  watch: string[],
  hi: { avoid: string[]; watch: string[] },
): PhaseWindow => ({
  when: cal(from, to),
  stages: BOTH,
  phase: name,
  avoid,
  watch,
  hi,
});

const NORTH_INDIA: RegionCare = {
  items: [
    {
      key: 'manure_dec',
      title: 'Spread the yearly manure in December',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [12, 31]),
      organic: `Well-rotted FYM ${TRENCH}`,
      dose: MANURE_DOSE,
      why: "The year's organic feed, given while the tree is bare",
      hi: {
        title: 'दिसंबर में साल की गोबर की खाद डालें',
        organic: `अच्छी सड़ी गोबर की खाद ${TRENCH_HI}`,
        why: 'साल की जैविक खाद, जब पेड़ पर पत्ते नहीं होते',
      },
    },
    {
      key: 'urea_feb',
      title: "Give half the year's urea in February",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([2, 1], [2, 29]),
      organic: '',
      chemical: `Urea ${TRENCH}. Wear gloves`,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the spring flush and the flowers',
      hi: {
        title: 'फ़रवरी में साल का आधा urea दें',
        chemical: `Urea ${TRENCH_HI}। दस्ताने पहनें`,
        why: 'बसंत की नई बढ़त और फूलों को खुराक मिलती है',
      },
    },
    {
      key: 'urea_apr',
      title: 'Give the other half of the urea in April',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([4, 1], [4, 30]),
      organic: '',
      chemical: `Urea ${TRENCH}. Wear gloves`,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the setting fruit',
      hi: {
        title: 'अप्रैल में बाकी आधा urea दें',
        chemical: `Urea ${TRENCH_HI}। दस्ताने पहनें`,
        why: 'लगते हुए फलों को खुराक मिलती है',
      },
    },
    {
      key: 'summer_water',
      title: 'Water every 10–15 days through the summer',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        'Water the basin every 10–15 days. Keep it steady once fruit has set: dry soil followed by a flood cracks fruit',
      why: 'Fruit drops or cracks when the soil dries out',
      hi: {
        title: 'गर्मी भर हर 10–15 दिन पानी दें',
        organic:
          'हर 10–15 दिन थाले में पानी दें। फल लगने के बाद पानी एक जैसा रखें: सूखी मिट्टी के बाद एकदम ज़्यादा पानी से फल फटते हैं',
        why: 'मिट्टी सूखने पर फल गिरते या फटते हैं',
      },
    },
    {
      key: 'black_spot_rains',
      title: 'Guard fruit against black spot as rains near',
      category: 'PROTECTION',
      stages: BEARING,
      when: cal([5, 1], [7, 31]),
      organic:
        'Pick up and burn or bury fallen leaves and any fruit with dark, oily spots. Keep weeds down under the tree. Water at the base, never over the leaves',
      chemical: `${KASUGAMYCIN}. Once each in May, June and July`,
      why: 'Black spot (bacterial blight) spreads with rain splash onto the ripening fruit',
      hi: {
        title: 'बारिश पास आते ही फलों को काले धब्बों से बचाएं',
        organic:
          'गिरी पत्तियां और काले, तेल जैसे धब्बों वाले फल उठाकर जला दें या गाड़ दें। पेड़ के नीचे खरपतवार न बढ़ने दें। पानी जड़ में दें, पत्तियों पर कभी नहीं',
        chemical: `${KASUGAMYCIN_HI}। मई, जून और जुलाई में एक-एक बार`,
        why: 'काले धब्बे (बैक्टीरिया वाला झुलसा) बारिश की छींटों से पकते फलों पर फैलते हैं',
      },
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [12, 1],
      [2, 29],
      'winter_bare',
      ['Heavy watering; water lightly only in a long dry spell'],
      ['Branches with dark cankers'],
      {
        avoid: ['ज़्यादा पानी; लंबे सूखे में ही हल्का पानी दें'],
        watch: ['काले घाव वाली डालियां'],
      },
    ),
    phase(
      [4, 1],
      [6, 30],
      'hot_dry',
      ['Letting the basin dry out'],
      ['Fruit borer on young fruit', 'Aphids on new shoots'],
      {
        avoid: ['थाले को सूखने देना'],
        watch: ['छोटे फलों पर फल छेदक', 'नई टहनियों पर माहू'],
      },
    ),
    phase(
      [7, 1],
      [9, 30],
      'monsoon',
      ['Water standing in the basin'],
      ['Black spots on fruit once the rains start', 'Ripe fruit cracking'],
      {
        avoid: ['थाले में पानी खड़ा रहना'],
        watch: ['बारिश शुरू होने पर फलों पर काले धब्बे', 'पके फलों का फटना'],
      },
    ),
  ],
};

const SOUTH_DECCAN: RegionCare = {
  items: [
    {
      key: 'prune_dec',
      title: "Prune last season's shoots back by a third",
      category: 'PRUNING',
      stages: BEARING,
      when: cal([12, 1], [12, 31]),
      organic: `After the last fruit is picked, shorten each of last season's shoots by one third. Cut out dried, diseased and crossing branches, root suckers and water shoots. Cover every cut with ${PASTE}. With no fruit left, spray ${SPRAY} the same evening. Wear gloves`,
      why: "New shoots carry next season's flowers; clean cuts keep blight out",
      hi: {
        title: 'पिछले सीज़न की टहनियां एक-तिहाई काटें',
        organic: `आखिरी फल तोड़ने के बाद पिछले सीज़न की हर टहनी को एक-तिहाई छोटा करें। सूखी, रोगी और आपस में फंसी डालियां, जड़ से निकली टहनियां और सीधी तेज़ बढ़ने वाली (water shoots) टहनियां काट दें। हर कटी जगह पर ${PASTE_HI} लगाएं। जब कोई फल न बचा हो, उसी शाम ${SPRAY_HI} स्प्रे करें। दस्ताने पहनें`,
        why: 'नई टहनियों पर अगले सीज़न के फूल आते हैं; साफ़ कट से झुलसा रोग अंदर नहीं जाता',
      },
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [5, 1],
      [7, 31],
      'flowering',
      ['Letting the soil dry out'],
      ['Fruit borer eggs on flowers and young fruit', 'Aphids', 'Thrips'],
      {
        avoid: ['मिट्टी को सूखने देना'],
        watch: ['फूलों और छोटे फलों पर फल छेदक के अंडे', 'माहू', 'थ्रिप्स'],
      },
    ),
    phase(
      [8, 1],
      [9, 30],
      'fruit_growth',
      ['Uneven watering (cracking)'],
      ['Oily spots on leaves and fruit in wet spells'],
      {
        avoid: ['असमान पानी (फल फटते हैं)'],
        watch: ['गीले दिनों में पत्तियों और फल पर तेल जैसे धब्बे'],
      },
    ),
    phase(
      [10, 1],
      [1, 31],
      'harvest',
      ['Leaving ripe fruit on the tree (it cracks)'],
      ['Fruit fly and fruit-piercing moth on ripening fruit'],
      {
        avoid: ['पके फल पेड़ पर छोड़ना (वे फट जाते हैं)'],
        watch: ['पकते फलों पर फल मक्खी और फल चूसने वाला पतंगा'],
      },
    ),
  ],
};

export const POMEGRANATE_CARE: FamilyCare = {
  family: 'pomegranate',
  sources: [
    'PAU Package of Practices for Cultivation of Fruits, pomegranate pp.119–121',
    'TNAU Crop Production Guide, Horticulture Crops 2020, pomegranate pp.36–38',
    'ICAR-NRC Pomegranate advisories 89, 117 and 146 (IDIPM schedule, 2023)',
    'National Horticulture Board pomegranate crop sheets pom002–pom010',
    'NIPHM/DPPQS AESA-based IPM package, Pomegranate',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: ['NORTH_INDIA', 'WEST_INDIA', 'SOUTH_DECCAN'],
  pendingRegions: ['WEST_INDIA'],
  regions: { NORTH_INDIA, SOUTH_DECCAN },
};
