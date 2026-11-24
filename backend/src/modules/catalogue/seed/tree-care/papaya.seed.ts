import type {
  Anchor,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Papaya care, transcribed from the source-checked table approved by the owner
 * on 2026-11-23 with every recommendation (docs/plant-care/papaya.md, with a
 * source for every row). Change it only through the add-plant playbook.
 *
 * Most care counts from the planting date (FROM_PLANTING: "from the Nth month"
 * opens at day 30×N for 30 days); amounts are per plant per feed, in the text.
 * Regions: SOUTH_DECCAN = TNAU, COASTAL_HUMID = KAU, EAST_INDIA = Assam AU,
 * NORTH_INDIA = PAU (calendar only). WEST_INDIA (one Saurashtra note) and
 * CENTRAL_INDIA (no source) are pending. No region shares another's care: the
 * guides differ on the feed start, amount and count.
 */

const BOTH = ['YOUNG', 'BEARING'] as TreeCareItem['stages'];
const ALL_YEAR: Anchor = { kind: 'CALENDAR', from: [1, 1], to: [12, 31] };
const planted = (fromDays: number, toDays: number) =>
  ({ kind: 'FROM_PLANTING', fromDays, toDays }) as const;

/** Placement of every feed (NHB pap006). */
const PLACE =
  'in a ring 10 cm deep, 15–20 cm from the stem; cover and water lightly. Wear gloves';
const PLACE_HI =
  'तने से 15–20 cm दूर, 10 cm गहरे घेरे में डालें; मिट्टी से ढकें और हल्का पानी दें। दस्ताने पहनें';

/** Feeds every 60 days, each open 30 days, from `firstDay`. */
function feeds(
  count: number,
  firstDay: number,
  title: (n: number) => string,
  chemical: string,
  why: string,
  hi: { title: (n: number) => string; chemical: string; why: string },
): TreeCareItem[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `feed_${i + 1}`,
    title: title(i + 1),
    category: 'FEEDING',
    stages: BOTH,
    when: planted(firstDay + 60 * i, firstDay + 60 * i + 29),
    organic: '',
    chemical: `${chemical}, ${PLACE}`,
    why,
    hi: {
      title: hi.title(i + 1),
      chemical: `${hi.chemical}, ${PLACE_HI}`,
      why: hi.why,
    },
  }));
}

// "Only if you see it": plant page only.
const males = (ratio: string, ratioHi: string): TreeCareItem => ({
  key: 'extra_males',
  title: 'Pull out extra male plants',
  category: 'GENERAL',
  stages: BOTH,
  // Papaya flowers 3–7 months after planting (TNAU, NHB).
  when: planted(90, 239),
  conditional: 'Flowers open on seed-grown plants',
  organic: `Red Lady, Pusa Delicious, CO 3, CO 7, Coorg Honey Dew and Surya need no male. Otherwise keep one plant per pit and pull out extra males, keeping ${ratio}, spread around the garden; with only a few plants keep one male`,
  why: 'Males bear no fruit; a few are enough to pollinate',
  hi: {
    title: 'फालतू नर पौधे उखाड़ दें',
    conditional: 'बीज से उगे पौधों पर फूल खिलने लगें',
    organic: `Red Lady, Pusa Delicious, CO 3, CO 7, Coorg Honey Dew और Surya में नर पौधे की ज़रूरत नहीं। बाकी में हर गड्ढे में एक पौधा रखें और फालतू नर उखाड़ दें, ${ratioHi} रखें, पूरे बगीचे में फैलाकर; कुछ ही पौधे हों तो एक नर रखें`,
    why: 'नर पौधों पर फल नहीं लगते; परागण के लिए कुछ ही काफ़ी हैं',
  },
});
const VIRUS: TreeCareItem = {
  key: 'virus_plants',
  title: 'Uproot and burn virus-hit plants',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional:
    'Mottled, blistered, curled or shrunken top leaves, or ring spots on fruit',
  organic:
    "Uproot and burn the plant at once. Don't grow tomato, chilli, tobacco or cucurbits next to papaya. Knock aphids off young plants with a strong jet of water",
  why: 'Aphids carry the virus to healthy plants; there is no cure',
  hi: {
    title: 'वायरस वाले पौधे उखाड़कर जला दें',
    conditional:
      'ऊपर की पत्तियां चितकबरी, फफोलेदार, मुड़ी या सिकुड़ी हों, या फल पर छल्ले जैसे धब्बे',
    organic:
      'पौधे को तुरंत उखाड़कर जला दें। पपीते के पास टमाटर, मिर्च, तंबाकू या कद्दू-लौकी जैसी बेलें न लगाएं। छोटे पौधों से माहू (aphids) को पानी की तेज़ धार से हटाएं',
    why: 'माहू वायरस को स्वस्थ पौधों तक ले जाते हैं; इसका कोई इलाज नहीं',
  },
};
const COLLAR_ROT: TreeCareItem = {
  key: 'collar_rot',
  title: 'Treat rot at the stem base',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'Wet, dark rot at the stem base, with yellowing leaves',
  organic:
    'Keep water off the stem (ring basin) and drain the basin. Mild: scrape the rotten patch and cover it with Bordeaux paste (100 g copper sulphate in 1 L water, 100 g lime in another 1 L, then mix). Or drench the soil round the stem with 1% Bordeaux (10 g copper sulphate + 10 g lime per litre), 2–3 L per plant. Wear gloves. Rotting right round the stem: uproot the plant',
  why: 'Standing water rots the stem and the plant falls',
  hi: {
    title: 'तने के निचले हिस्से की सड़न का इलाज करें',
    conditional: 'तने के निचले हिस्से पर गीली, काली सड़न, और पत्तियां पीली',
    organic:
      'तने पर पानी न लगने दें (घेरे वाला थाला बनाएं) और थाले से पानी निकाल दें। हल्की सड़न: सड़ा हिस्सा खुरचकर उस पर Bordeaux paste लगाएं (100 g copper sulphate 1 L पानी में, 100 g चूना दूसरे 1 L में, फिर मिला लें)। या तने के चारों ओर की मिट्टी को 1% Bordeaux (10 g copper sulphate + 10 g चूना प्रति लीटर) से भिगोएं, 2–3 L प्रति पौधा। दस्ताने पहनें। सड़न तने के चारों ओर फैल गई हो: पौधा उखाड़ दें',
    why: 'खड़े पानी से तना सड़ जाता है और पौधा गिर जाता है',
  },
};
const mealybug = (withBiocontrol: boolean): TreeCareItem => ({
  key: 'mealybug',
  title: 'Clear papaya mealybug',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'White cottony clusters under leaves or on fruit',
  organic: `Pick off and burn infested leaves. Pull up hibiscus and weeds nearby${
    withBiocontrol
      ? '. Tie a sticky band or polythene sheet round the stem, destroy ant nests, and ask the KVK or agriculture office for the parasitoid Acerophagus papayae'
      : ''
  }`,
  why: 'Mealybug sucks sap and spreads fast between plants',
  hi: {
    title: 'पपीते का मिलीबग हटाएं',
    conditional: 'पत्तियों के नीचे या फल पर सफ़ेद रुई जैसे गुच्छे',
    organic: `कीड़े लगी पत्तियां तोड़कर जला दें। पास के गुड़हल और खरपतवार उखाड़ दें${
      withBiocontrol
        ? '। तने पर चिपचिपी पट्टी या पॉलिथीन बांधें, चींटियों के घर नष्ट करें, और KVK या कृषि दफ़्तर से परजीवी Acerophagus papayae मांगें'
        : ''
    }`,
    why: 'मिलीबग रस चूसता है और पौधों में तेज़ी से फैलता है',
  },
});
const POWDERY: TreeCareItem = {
  key: 'powdery_mildew',
  title: 'Treat white powder on leaves',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'White powder on leaves',
  organic: 'Remove badly affected leaves and keep the plants spaced',
  chemical:
    'Thiophanate-methyl 70 WP 0.7–0.95 g per litre; wear gloves; never within 8 days of picking',
  why: 'Powdery mildew weakens leaves and young fruit',
  hi: {
    title: 'पत्तियों पर सफ़ेद पाउडर का इलाज करें',
    conditional: 'पत्तियों पर सफ़ेद पाउडर',
    organic: 'ज़्यादा खराब पत्तियां हटा दें और पौधों के बीच दूरी रखें',
    chemical:
      'Thiophanate-methyl 70 WP 0.7–0.95 g प्रति लीटर; दस्ताने पहनें; तोड़ने से 8 दिन पहले तक नहीं',
    why: 'सफ़ेद फफूंद (powdery mildew) पत्तियों और छोटे फलों को कमज़ोर करती है',
  },
};
const NEMATODES: TreeCareItem = {
  key: 'nematodes',
  title: 'Treat knotted roots',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'Stunted, yellowing plants with knotted roots',
  organic:
    'Neem cake 250 g per plant, worked into the basin. Or 2 kg FYM mixed with 2 g Trichoderma harzianum 1% WP (1 g per kg) per plant, now and every 3 months for a year',
  why: 'Root-knot nematodes stunt the plant',
  hi: {
    title: 'गांठ वाली जड़ों का इलाज करें',
    conditional: 'पौधे बौने और पीले, जड़ों पर गांठें',
    organic:
      'नीम की खली 250 g प्रति पौधा, थाले की मिट्टी में मिलाएं। या 2 kg गोबर की खाद में 2 g Trichoderma harzianum 1% WP (1 g प्रति kg) मिलाकर प्रति पौधा दें, अभी और फिर हर 3 महीने, एक साल तक',
    why: 'जड़ में गांठ बनाने वाले नेमाटोड पौधे की बढ़त रोक देते हैं',
  },
};
const FRUIT_SPOTS: TreeCareItem = {
  key: 'fruit_spots',
  title: 'Remove fruit with sunken dark spots',
  category: 'PROTECTION',
  stages: ['BEARING'],
  when: ALL_YEAR,
  conditional: 'Sunken dark spots on fruit',
  organic:
    'Pick off and destroy spotted fruit and avoid bruising. Keep the basin drained. Bag fruit in paper about 15 days before picking',
  why: 'Anthracnose spreads from spotted fruit in wet weather',
  hi: {
    title: 'धंसे काले धब्बों वाले फल हटा दें',
    conditional: 'फल पर धंसे हुए काले धब्बे',
    organic:
      'धब्बे वाले फल तोड़कर नष्ट करें और फलों को चोट न लगने दें। थाले से पानी निकालते रहें। तोड़ने से करीब 15 दिन पहले फलों पर कागज़ की थैली चढ़ा दें',
    why: 'गीले मौसम में एन्थ्रेक्नोज़ धब्बे वाले फलों से फैलता है',
  },
};
const ZINC_SIGNS: TreeCareItem = {
  key: 'small_leaves',
  title: 'Spray zinc and boron on small leaves',
  category: 'FEEDING',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'Small, pale or misshapen new leaves',
  organic: '',
  chemical:
    'Zinc sulphate 5 g + boric acid 1 g per litre, sprayed on the leaves. A fertiliser: no waiting period. Wear gloves',
  why: 'Zinc and boron shortage stunts leaves and fruit',
  hi: {
    title: 'छोटी पत्तियों पर zinc और boron स्प्रे करें',
    conditional: 'नई पत्तियां छोटी, पीली या टेढ़ी-मेढ़ी',
    chemical:
      'Zinc sulphate 5 g + boric acid 1 g प्रति लीटर, पत्तियों पर स्प्रे करें। यह खाद है: तोड़ने से पहले रुकने की ज़रूरत नहीं। दस्ताने पहनें',
    why: 'zinc और boron की कमी से पत्तियां और फल छोटे रह जाते हैं',
  },
};
const PICKING: TreeCareItem = {
  key: 'pick_ripe',
  title: 'Pick fruit as it starts to yellow',
  category: 'GENERAL',
  stages: ['BEARING'],
  when: ALL_YEAR,
  conditional: 'A yellow streak on a full-size fruit, or watery latex',
  organic:
    'Pick by twisting, in the morning. Collect fallen and over-ripe fruit, which draws fruit fly',
  why: 'Picked at first colour it ripens well and escapes fruit fly',
  hi: {
    title: 'फल पीला होने लगे तो तोड़ लें',
    conditional: 'पूरे बड़े फल पर पीली धारी, या दूध (latex) पानी जैसा',
    organic:
      'सुबह के समय मरोड़कर तोड़ें। गिरे और ज़्यादा पके फल इकट्ठा करें, वे फल मक्खी को खींचते हैं',
    why: 'पहला रंग आने पर तोड़ा गया फल अच्छा पकता है और फल मक्खी से बचता है',
  },
};

const phase = (
  from: [number, number],
  to: [number, number],
  name: string,
  avoid: string[],
  watch: string[],
  hi: { avoid: string[]; watch: string[] },
): PhaseWindow => ({
  when: { kind: 'CALENDAR', from, to },
  stages: BOTH,
  phase: name,
  avoid,
  watch,
  hi,
});

const ZINC_BORON =
  'Zinc sulphate 5 g + boric acid 1 g per litre (0.5% + 0.1%), sprayed on the leaves. A fertiliser: no waiting period. Wear gloves';
const ZINC_BORON_HI =
  'Zinc sulphate 5 g + boric acid 1 g प्रति लीटर (0.5% + 0.1%), पत्तियों पर स्प्रे करें। यह खाद है: तोड़ने से पहले रुकने की ज़रूरत नहीं। दस्ताने पहनें';

const SOUTH_DECCAN: RegionCare = {
  items: [
    {
      key: 'planting_mix',
      title: 'Mix manure and microbes in at planting',
      category: 'FEEDING',
      stages: BOTH,
      when: planted(0, 29),
      organic:
        '10 kg FYM in the pit. Around the roots: arbuscular mycorrhiza 50 g, phosphate-solubilising bacteria 25 g and Azospirillum 50 g',
      why: 'Feeds the roots and helps them take up phosphorus from the start',
      hi: {
        title: 'लगाते समय गोबर की खाद और जीवाणु खाद मिलाएं',
        organic:
          '10 kg गोबर की खाद गड्ढे में। जड़ों के आसपास: arbuscular mycorrhiza 50 g, phosphate-solubilising bacteria 25 g और Azospirillum 50 g',
        why: 'जड़ों को खुराक मिलती है और शुरू से phosphorus लेने में मदद होती है',
      },
    },
    {
      key: 'water_new_plant',
      title: 'Water the new plant weekly, off the stem',
      category: 'WATERING',
      stages: BOTH,
      when: planted(0, 29),
      organic:
        'Soak well after planting, then water once a week. Use a ring basin so water never touches the stem, and let no water stand',
      why: 'The roots settle; wet stems get collar rot',
      hi: {
        title: 'नए पौधे को हर हफ़्ते पानी दें, तने से दूर',
        organic:
          'लगाने के बाद अच्छी तरह भिगोएं, फिर हफ़्ते में एक बार पानी दें। घेरे वाला थाला बनाएं ताकि पानी कभी तने को न छुए, और पानी खड़ा न रहने दें',
        why: 'जड़ें जम जाती हैं; गीले तने के निचले हिस्से में सड़न लगती है',
      },
    },
    ...feeds(
      11,
      90,
      (n) => `Give feed ${n}: 50 g each of N, P and K`,
      'Urea 110 g + SSP 310 g + MOP 85 g (50 g each of N, P₂O₅, K₂O)',
      'Papaya flowers and fruits non-stop and needs small, regular feeds',
      {
        title: (n) => `खाद नंबर ${n} दें: N, P और K हर एक 50 g`,
        chemical: 'Urea 110 g + SSP 310 g + MOP 85 g (N, P₂O₅, K₂O हर एक 50 g)',
        why: 'पपीते में लगातार फूल और फल आते हैं, इसलिए इसे थोड़ी-थोड़ी खाद नियमित चाहिए',
      },
    ),
    {
      key: 'zinc_boron_1',
      title: 'Spray zinc and boron on the leaves',
      category: 'FEEDING',
      stages: BOTH,
      when: planted(120, 149),
      organic: '',
      chemical: ZINC_BORON,
      why: 'Better growth and fruit set',
      hi: {
        title: 'पत्तियों पर zinc और boron स्प्रे करें',
        chemical: ZINC_BORON_HI,
        why: 'बढ़त अच्छी होती है और फल अच्छे लगते हैं',
      },
    },
    {
      key: 'microbe_booster',
      title: 'Add Azospirillum and phosphobacteria',
      category: 'FEEDING',
      stages: BOTH,
      when: planted(180, 209),
      organic:
        '20 g each of Azospirillum and phosphobacteria, mixed into a handful of FYM around the plant',
      why: 'Tops up the soil microbes at six months',
      hi: {
        title: 'Azospirillum और phosphobacteria डालें',
        organic:
          'Azospirillum और phosphobacteria हर एक 20 g, मुट्ठी भर गोबर की खाद में मिलाकर पौधे के आसपास डालें',
        why: 'छह महीने पर मिट्टी के जीवाणु फिर से बढ़ जाते हैं',
      },
    },
    {
      key: 'zinc_boron_2',
      title: 'Spray zinc and boron again',
      category: 'FEEDING',
      stages: BOTH,
      when: planted(240, 269),
      organic: '',
      chemical: ZINC_BORON,
      why: 'Better growth and fruit set',
      hi: {
        title: 'zinc और boron फिर से स्प्रे करें',
        chemical: ZINC_BORON_HI,
        why: 'बढ़त अच्छी होती है और फल अच्छे लगते हैं',
      },
    },
    males('1 male for every 20 females', 'हर 20 मादा पर 1 नर'),
    VIRUS,
    COLLAR_ROT,
    mealybug(true),
    POWDERY,
    NEMATODES,
    PICKING,
  ],
  phases: [
    phase(
      [1, 1],
      [12, 31],
      'year_round',
      ['Water standing in the basin or touching the stem'],
      [
        'Mottled or curled leaves (virus)',
        'White cottony clusters (mealybug)',
        'Rot at the stem base',
      ],
      {
        avoid: ['थाले में पानी खड़ा रहना या तने को छूना'],
        watch: [
          'चितकबरी या मुड़ी पत्तियां (वायरस)',
          'सफ़ेद रुई जैसे गुच्छे (मिलीबग)',
          'तने के निचले हिस्से पर सड़न',
        ],
      },
    ),
  ],
};

const COASTAL_HUMID: RegionCare = {
  items: [
    {
      key: 'shade_new_plant',
      title: 'Shade and water the new seedling',
      category: 'WATERING',
      stages: BOTH,
      when: planted(0, 29),
      organic:
        'Shade the seedling until it settles. Water in a ring basin, not on the stem, if no rain falls',
      why: 'Young seedlings scorch; wet stems rot',
      hi: {
        title: 'नए पौधे को छाया और पानी दें',
        organic:
          'पौधा जमने तक उसे छाया दें। बारिश न हो तो घेरे वाले थाले में पानी दें, तने पर नहीं',
        why: 'छोटे पौधे धूप से झुलस जाते हैं; गीले तने सड़ जाते हैं',
      },
    },
    // KAU gives "bimonthly" with no start: the first feed is one interval after planting.
    ...feeds(
      12,
      60,
      (n) => `Give feed ${n}: 40 g N, 40 g P, 80 g K`,
      'Urea 87 g + SSP 250 g + MOP 135 g (40 g N, 40 g P₂O₅, 80 g K₂O)',
      'Regular feeding, potash-heavy for fruit',
      {
        title: (n) => `खाद नंबर ${n} दें: 40 g N, 40 g P, 80 g K`,
        chemical:
          'Urea 87 g + SSP 250 g + MOP 135 g (40 g N, 40 g P₂O₅, 80 g K₂O)',
        why: 'नियमित खाद, फल के लिए ज़्यादा पोटाश वाली',
      },
    ),
    {
      key: 'monsoon_manure',
      title: 'Spread manure as the monsoon starts',
      category: 'FEEDING',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [6, 1], to: [6, 30] },
      organic:
        '10–25 kg FYM or compost a year, in the basin around the plant. Hand-dig and weed at the same time',
      why: 'The yearly organic feed, given when rain wets it in',
      hi: {
        title: 'मानसून शुरू होते ही गोबर की खाद डालें',
        organic:
          'साल में 10–25 kg गोबर की खाद या कम्पोस्ट, पौधे के चारों ओर थाले में। साथ ही हाथ से गुड़ाई करें और खरपतवार निकालें',
        why: 'साल की जैविक खाद, तब दी जाती है जब बारिश उसे मिट्टी में मिला दे',
      },
    },
    {
      key: 'winter_digging',
      title: 'Dig around the plant and pull weeds',
      category: 'GENERAL',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [1, 1], to: [2, 29] },
      organic: 'Hand-dig the basin lightly and pull the weeds',
      why: 'Papaya roots are shallow; weeds take their food',
      hi: {
        title: 'पौधे के आसपास गुड़ाई करें और खरपतवार निकालें',
        organic: 'थाले की हाथ से हल्की गुड़ाई करें और खरपतवार निकालें',
        why: 'पपीते की जड़ें ऊपर ही रहती हैं; खरपतवार उनकी खुराक ले लेते हैं',
      },
    },
    {
      key: 'summer_water',
      title: 'Water in a ring through the dry months',
      category: 'WATERING',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [1, 1], to: [5, 31] },
      organic:
        'Water grown plants every 4–5 days in a ring basin, never on the stem',
      why: 'Dry soil turns flowers male and drops fruit',
      hi: {
        title: 'सूखे महीनों में घेरे में पानी देते रहें',
        organic:
          'बड़े पौधों को हर 4–5 दिन घेरे वाले थाले में पानी दें, तने पर कभी नहीं',
        why: 'सूखी मिट्टी से फूल नर बन जाते हैं और फल गिर जाते हैं',
      },
    },
    males('1 male for every 10 females', 'हर 10 मादा पर 1 नर'),
    VIRUS,
    COLLAR_ROT,
    mealybug(true),
    POWDERY,
    FRUIT_SPOTS,
    ZINC_SIGNS,
    PICKING,
  ],
  phases: [
    phase(
      [1, 1],
      [5, 31],
      'summer_dry',
      ['Letting the basin dry out', 'Water on the stem'],
      ['Mealybug'],
      { avoid: ['थाले को सूखने देना', 'तने पर पानी'], watch: ['मिलीबग'] },
    ),
    phase(
      [6, 1],
      [9, 30],
      'monsoon',
      ['Water standing around the trunk'],
      ['Collar rot', 'Virus-infected plants'],
      {
        avoid: ['तने के आसपास पानी खड़ा रहना'],
        watch: ['तने के निचले हिस्से की सड़न', 'वायरस वाले पौधे'],
      },
    ),
    phase(
      [10, 1],
      [12, 31],
      'post_monsoon',
      ['Water standing around the trunk'],
      ['Collar rot', 'Anthracnose on fruit'],
      {
        avoid: ['तने के आसपास पानी खड़ा रहना'],
        watch: ['तने के निचले हिस्से की सड़न', 'फल पर एन्थ्रेक्नोज़'],
      },
    ),
  ],
};

const EAST_INDIA: RegionCare = {
  items: [
    ...feeds(
      10,
      0,
      (n) => `Give feed ${n} of 10: 50 g each of N, P, K`,
      'Urea 110 g + SSP 310 g + MOP 85 g (50 g each of N, P₂O₅, K₂O)',
      'Small, regular feeds for a plant that fruits all year',
      {
        title: (n) => `खाद नंबर ${n} (10 में से) दें: N, P, K हर एक 50 g`,
        chemical: 'Urea 110 g + SSP 310 g + MOP 85 g (N, P₂O₅, K₂O हर एक 50 g)',
        why: 'साल भर फल देने वाले पौधे के लिए थोड़ी-थोड़ी, नियमित खाद',
      },
    ),
    males('1 male for every 10 females', 'हर 10 मादा पर 1 नर'),
    VIRUS,
    COLLAR_ROT,
    mealybug(true),
    POWDERY,
    ZINC_SIGNS,
    PICKING,
  ],
  phases: [
    phase(
      [1, 1],
      [12, 31],
      'year_round',
      ['Poor drainage'],
      ['Mosaic', 'Leaf curl', 'Ringspot', 'Mealybug'],
      {
        avoid: ['पानी की खराब निकासी'],
        watch: ['मोज़ेक रोग', 'पत्ती मरोड़ रोग', 'रिंग स्पॉट', 'मिलीबग'],
      },
    ),
  ],
};

/** PAU's feed: 20 kg FYM and 1.25 kg of urea : SSP : MOP at 1 : 2 : ⅓, at each feed. */
const PAU_FEED = {
  organic: '20 kg well-rotted FYM in the basin',
  chemical: `With it: urea 375 g + SSP 750 g + MOP 125 g (1.25 kg of a 1 : 2 : ⅓ mix), ${PLACE}`,
};
const PAU_FEED_HI = {
  organic: '20 kg अच्छी सड़ी गोबर की खाद थाले में',
  chemical: `इसके साथ: urea 375 g + SSP 750 g + MOP 125 g (1 : 2 : ⅓ के मिश्रण का 1.25 kg), ${PLACE_HI}`,
};

const NORTH_INDIA: RegionCare = {
  items: [
    {
      key: 'frost_cover',
      title: 'Cover young papaya against frost',
      category: 'PROTECTION',
      stages: ['YOUNG'],
      when: { kind: 'CALENDAR', from: [11, 1], to: [2, 29] },
      organic:
        'Cover the plant with clear plastic, sarkanda, a straw thatch or similar. Take it off when frost is over',
      why: 'Papaya is very sensitive to frost',
      hi: {
        title: 'छोटे पपीते को पाले से बचाने के लिए ढकें',
        organic:
          'पौधे को साफ़ प्लास्टिक, सरकंडा, पुआल के छप्पर या ऐसी किसी चीज़ से ढकें। पाला खत्म होने पर हटा दें',
        why: 'पपीते पर पाले का बहुत असर होता है',
      },
    },
    {
      key: 'feed_feb',
      title: 'Give the February manure and fertiliser',
      category: 'FEEDING',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [2, 1], to: [2, 29] },
      ...PAU_FEED,
      why: 'Feeds the spring growth and fruit',
      hi: {
        title: 'फ़रवरी में गोबर की खाद और रासायनिक खाद दें',
        ...PAU_FEED_HI,
        why: 'बसंत की नई बढ़त और फलों को खुराक मिलती है',
      },
    },
    {
      key: 'feed_aug',
      title: 'Give the August manure and fertiliser',
      category: 'FEEDING',
      stages: BOTH,
      when: { kind: 'CALENDAR', from: [8, 1], to: [8, 31] },
      ...PAU_FEED,
      why: 'Feeds the monsoon flush and fruit',
      hi: {
        title: 'अगस्त में गोबर की खाद और रासायनिक खाद दें',
        ...PAU_FEED_HI,
        why: 'मानसून की नई बढ़त और फलों को खुराक मिलती है',
      },
    },
    males('1 male for every 10 females', 'हर 10 मादा पर 1 नर'),
    VIRUS,
    COLLAR_ROT,
    mealybug(false),
    POWDERY,
    FRUIT_SPOTS,
    ZINC_SIGNS,
    PICKING,
  ],
  phases: [
    phase(
      [11, 1],
      [2, 29],
      'frost_season',
      ['Leaving young plants uncovered', 'Wet soil'],
      ['Frost damage'],
      {
        avoid: ['छोटे पौधों को खुला छोड़ना', 'गीली मिट्टी'],
        watch: ['पाले से नुकसान'],
      },
    ),
    phase(
      [4, 1],
      [6, 30],
      'dry_heat',
      ['Letting the soil dry out (stress turns flowers male)'],
      ['Whitefly, which spreads leaf curl'],
      {
        avoid: ['मिट्टी को सूखने देना (तनाव से फूल नर बन जाते हैं)'],
        watch: ['सफ़ेद मक्खी, जो पत्ती मरोड़ रोग फैलाती है'],
      },
    ),
    phase(
      [7, 1],
      [9, 30],
      'monsoon',
      ['Irrigation water touching the stem', 'Standing water'],
      ['Collar and stem rot'],
      {
        avoid: ['सिंचाई का पानी तने को छूना', 'खड़ा पानी'],
        watch: ['तने के निचले हिस्से और तने की सड़न'],
      },
    ),
    phase(
      [10, 1],
      [10, 31],
      'autumn',
      ['Transplanting after Oct 15'],
      ['Collar rot in wet soil'],
      {
        avoid: ['15 अक्टूबर के बाद रोपाई'],
        watch: ['गीली मिट्टी में तने के निचले हिस्से की सड़न'],
      },
    ),
  ],
};

export const PAPAYA_CARE: FamilyCare = {
  family: 'papaya',
  sources: [
    'TNAU Crop Production Guide, Horticulture Crops 2020, papaya pp.33–34',
    'KAU Package of Practices Recommendations: Crops, 15th ed. 2016, papaya pp.221–222',
    'Assam Agricultural University, Package of Practices for Horticultural Crops of Assam 2023, papaya pp.27–29',
    'PAU Package of Practices for Cultivation of Fruits 2021, papaya pp.115–118',
    'National Horticulture Board papaya crop sheets pap002–pap007',
    'NIPHM/DPPQS AESA-based IPM package, Papaya',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'WEST_INDIA',
    'CENTRAL_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
  ],
  pendingRegions: ['WEST_INDIA', 'CENTRAL_INDIA'],
  regions: { SOUTH_DECCAN, COASTAL_HUMID, EAST_INDIA, NORTH_INDIA },
};
