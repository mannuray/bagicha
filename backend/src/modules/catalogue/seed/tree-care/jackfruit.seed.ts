import {
  ALL_YEAR,
  groupCare,
  type ItemSpec,
  type PhaseSpec,
  type Window,
} from './build';
import type { Dose, FamilyCare, RegionCare } from '../../domain/tree-care';

/**
 * Jackfruit care, transcribed from the source-checked table approved by the
 * owner on 2026-11-12 (docs/plant-care/jackfruit.md, with a source for every
 * row). Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * Timing groups: E = East (AAU and NIPHM; harvest in June, mealybug trunk band
 * as for mango's North+East); K = coastal (KAU: harvest in June, and "jack is
 * rarely manured", so no feeding reminders); S = South Deccan (TNAU: harvest
 * March–July). Feeding (May–June + Sep–Oct) is NIPHM's and TNAU's, for E and S.
 *
 * Dose: per year of age, up to 5 years (TNAU = NIPHM), in two equal splits.
 * No pesticide has a jackfruit label claim, so pest rows are organic or
 * cultural only.
 */
type Group = 'E' | 'K' | 'S';

/** Per split: FYM 5 kg + urea 163 g + SSP 250 g + MOP 83 g × age, up to 5 years. */
const SPLIT_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 5000 }],
  chemical: [
    { what: 'urea', grams: 163 },
    { what: 'SSP', grams: 250 },
    { what: 'MOP', grams: 83 },
  ],
  maxAgeYears: 5,
};

const MAY_JUN: Window = [
  [5, 1],
  [6, 30],
];
const SEP_OCT: Window = [
  [9, 1],
  [10, 31],
];

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'pre_monsoon_feed',
    title: 'Feed before the monsoon',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "Half the year's FYM in a ring under the canopy, mixed into the soil",
    chemical:
      "Half the year's urea + SSP + MOP in the same ring; water in; wear gloves",
    dose: SPLIT_DOSE,
    why: "Feeds the new season's growth; manures and fertilisers both go in two splits",
    hi: {
      title: 'बारिश से पहले खाद दें',
      organic:
        'साल की आधी गोबर की खाद (FYM) छतरी के नीचे गोल घेरे में डालें, मिट्टी में मिला दें',
      chemical:
        'साल का आधा urea + SSP + MOP उसी घेरे में डालें; पानी दें; दस्ताने पहनें',
      why: 'नए सीज़न की बढ़त को खुराक मिलती है; गोबर की खाद और रासायनिक खाद दोनों दो बार में दी जाती हैं',
    },
    windows: { E: MAY_JUN, S: MAY_JUN },
  },
  {
    key: 'post_monsoon_feed',
    title: 'Feed after the monsoon',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: 'The other half of the FYM, the same way',
    chemical:
      'The other half of urea + SSP + MOP; water in if no rain; wear gloves',
    dose: SPLIT_DOSE,
    why: 'Last feed before the dry months and the next fruiting',
    hi: {
      title: 'बारिश के बाद खाद दें',
      organic: 'बाकी आधी गोबर की खाद, उसी तरह',
      chemical:
        'बाकी आधा urea + SSP + MOP; बारिश न हो तो पानी दें; दस्ताने पहनें',
      why: 'सूखे महीनों और अगले फलन से पहले की आखिरी खाद',
    },
    windows: { E: SEP_OCT, S: SEP_OCT },
  },
  {
    key: 'soak_and_rake',
    title: 'Soak and rake soil round the trunk',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Flood the basin once in October; in November dig and rake the soil around the trunk to expose mealybug eggs; pull weeds',
    why: 'Kills the eggs before the young bugs climb in winter',
    hi: {
      title: 'तने के आसपास मिट्टी भिगोएं और गुड़ाई करें',
      organic:
        'अक्टूबर में एक बार थाले में पानी भर दें; नवंबर में तने के आसपास की मिट्टी खोदकर पलटें ताकि मिलीबग के अंडे खुल जाएं; खरपतवार निकालें',
      why: 'सर्दी में छोटे कीड़े ऊपर चढ़ें, उससे पहले अंडे मर जाते हैं',
    },
    windows: {
      E: [
        [10, 1],
        [11, 30],
      ],
    },
  },
  {
    key: 'mealybug_band',
    title: 'Band the trunk against mealybug',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Mud-plaster a 25 cm ring on the trunk 30 cm above ground; tie a 25 cm wide polythene band (400 gauge) over it with twine by mid-December',
    why: 'Stops the young bugs climbing to the shoots and flowers',
    hi: {
      title: 'मिलीबग से बचाने के लिए तने पर पट्टी बांधें',
      organic:
        'ज़मीन से 30 cm ऊपर तने पर 25 cm चौड़ी मिट्टी की लिपाई करें; दिसंबर के बीच तक उस पर 25 cm चौड़ी पॉलीथीन पट्टी (400 gauge) सुतली से बांध दें',
      why: 'छोटे कीड़े टहनियों और फूलों तक नहीं चढ़ पाते',
    },
    windows: {
      E: [
        [12, 1],
        [1, 15],
      ],
    },
  },
  {
    key: 'cut_ripe_fruit',
    title: 'Cut ripe fruit off by the stalk',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      'Cut through the fruit stalk; pick up and destroy rotting fruit from the tree and ground',
    why: 'Rotting fruit carries fruit rot to the next crop',
    hi: {
      title: 'पके फल को डंठल से काटें',
      organic: 'फल का डंठल काटें; पेड़ और ज़मीन से सड़े फल उठाकर नष्ट करें',
      why: 'सड़े फल से फल सड़न अगली फसल तक पहुंचती है',
    },
    windows: {
      E: [
        [6, 1],
        [6, 30],
      ],
      K: [
        [6, 1],
        [6, 30],
      ],
      S: [
        [3, 1],
        [7, 31],
      ],
    },
  },
];

const ALL = { E: ALL_YEAR, K: ALL_YEAR, S: ALL_YEAR };

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'coast_no_feeding',
    title: 'Jack on the coast is rarely manured',
    category: 'GENERAL',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'You are looking for a feeding schedule',
    organic:
      'KAU says jack is rarely manured, and Kerala trees do well with no fertiliser, so the app sends no feeding reminders on the coast',
    why: 'Coastal trees come up well without fertiliser',
    hi: {
      title: 'तट पर कटहल में खाद कम ही डाली जाती है',
      organic:
        'KAU के अनुसार कटहल में खाद कम ही डाली जाती है, और केरल के पेड़ बिना रासायनिक खाद के अच्छे रहते हैं, इसलिए ऐप तट पर खाद के रिमाइंडर नहीं भेजता',
      why: 'तट के पेड़ बिना रासायनिक खाद के अच्छे बढ़ते हैं',
      conditional: 'आप खाद देने का शेड्यूल ढूंढ रहे हैं',
    },
    windows: { K: ALL_YEAR },
  },
  {
    key: 'aau_dose',
    title: 'Flat bearing-tree dose from AAU (Assam)',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'You want a flat yearly dose for a bearing tree',
    organic:
      'Not per year of age: 20–30 kg FYM, N 200 g, P₂O₅ 320 g, K₂O 960 g and 5 kg ash a year',
    why: "Assam's own package gives a flat dose, not per year of age",
    hi: {
      title: 'फल देने वाले पेड़ की तय खुराक, AAU (असम) से',
      organic:
        'उम्र के हिसाब से नहीं: साल में 20–30 kg गोबर की खाद, N 200 g, P₂O₅ 320 g, K₂O 960 g और 5 kg राख',
      why: 'असम का अपना पैकेज उम्र के हिसाब से नहीं, एक तय खुराक देता है',
      conditional: 'आप फल देने वाले पेड़ के लिए साल की एक तय खुराक चाहते हैं',
    },
    windows: { E: ALL_YEAR },
  },
  {
    key: 'water_young',
    title: 'Water the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'The soil around a young tree is drying',
    organic:
      'Weekly until it is established, then whenever the soil dries; never let a young tree face drought. Mulch the basin with dry leaves',
    why: 'Young roots dry out fast',
    hi: {
      title: 'छोटे पेड़ को पानी दें',
      organic:
        'जमने तक हर हफ्ते, फिर जब भी मिट्टी सूखे; छोटे पेड़ को कभी सूखा न झेलने दें। थाले में सूखे पत्तों की मल्च बिछाएं',
      why: 'छोटी जड़ें जल्दी सूख जाती हैं',
      conditional: 'छोटे पेड़ के आसपास की मिट्टी सूख रही है',
    },
    windows: ALL,
  },
  {
    key: 'water_flowering',
    title: 'Keep the tree watered at flowering and fruit set',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'The tree is flowering or setting fruit',
    organic:
      'Never let the tree go dry at flowering and fruit set, but drain well',
    why: 'Too much soil water makes the flakes insipid',
    hi: {
      title: 'फूल और फल बनते समय पानी देते रहें',
      organic:
        'फूल और फल बनते समय पेड़ को कभी सूखने न दें, पर पानी की निकासी अच्छी रखें',
      why: 'मिट्टी में ज़्यादा पानी से कोए फीके हो जाते हैं',
      conditional: 'पेड़ पर फूल आ रहे हैं या फल बन रहे हैं',
    },
    windows: ALL,
  },
  {
    key: 'spittle_bug',
    title: 'Wipe off spittle bug froth',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Frothy spit masses on young shoots at flowering',
    organic: 'Wipe off the froth, cut off affected shoots',
    why: 'Spittle bug',
    hi: {
      title: 'स्पिटल बग का झाग पोंछ दें',
      organic: 'झाग पोंछ दें, प्रभावित टहनियां काट दें',
      why: 'स्पिटल बग',
      conditional: 'फूल आने पर नई टहनियों पर थूक जैसा झाग',
    },
    windows: ALL,
  },
  {
    key: 'shoot_fruit_borer',
    title: 'Cut off borer-attacked shoots and fruit',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Fruits or shoots show tunnels and black patches',
    organic:
      'Cut off and destroy attacked shoots and fruits. Covering young fruit with polythene bags stops egg-laying',
    why: 'Shoot and fruit borer',
    hi: {
      title: 'छेदक लगी टहनियां और फल काट दें',
      organic:
        'छेदक लगी टहनियां और फल काटकर नष्ट करें। छोटे फलों को पॉलीथीन थैलियों से ढकने पर कीड़ा अंडे नहीं दे पाता',
      why: 'टहनी और फल छेदक',
      conditional: 'फलों या टहनियों में सुरंगें और काले धब्बे दिखें',
    },
    windows: ALL,
  },
  {
    key: 'fruit_rot',
    title: 'Remove rotting flowers and young fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional:
      'Flowers or young fruits rot with grey, then black velvety growth from the stalk',
    organic:
      'Remove and destroy them from the tree and ground; prune for air; fix drainage',
    why: 'Rhizopus fruit rot',
    hi: {
      title: 'सड़ते फूल और छोटे फल हटा दें',
      organic:
        'उन्हें पेड़ और ज़मीन से हटाकर नष्ट करें; हवा के लिए छंटाई करें; पानी की निकासी ठीक करें',
      why: 'Rhizopus फल सड़न',
      conditional:
        'फूल या छोटे फल डंठल की तरफ से सड़ें, पहले स्लेटी फिर काली मखमली फफूंद के साथ',
    },
    windows: ALL,
  },
  {
    key: 'stem_borer',
    title: 'Treat stem borer holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Holes with sawdust on the trunk or branches',
    organic:
      'Clean the tunnel with a wire, pour in a little kerosene, plug with cotton and seal with mud; cut out dead, badly bored branches',
    why: 'Stem borer, bark-eating caterpillar',
    hi: {
      title: 'तना छेदक के छेदों का इलाज करें',
      organic:
        'तार से सुरंग साफ करें, थोड़ा केरोसिन डालें, रुई से बंद करके मिट्टी से सील करें; सूखी, बहुत ज़्यादा छिदी डालियां काट दें',
      why: 'तना छेदक, छाल खाने वाली सुंडी',
      conditional: 'तने या डालियों पर बुरादे के साथ छेद',
    },
    windows: ALL,
  },
  {
    key: 'scale_aphid',
    title: 'Cut off parts with scales or aphids',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'Leaves turn yellow with scales, aphids or black sooty coating',
    organic: 'Cut off affected parts',
    why: 'Scales and aphids',
    hi: {
      title: 'स्केल या माहू वाले हिस्से काट दें',
      organic: 'प्रभावित हिस्से काट दें',
      why: 'स्केल कीट और माहू',
      conditional:
        'पत्ते पीले पड़ें और उन पर स्केल, माहू या काली कालिख जैसी परत हो',
    },
    windows: ALL,
  },
  {
    key: 'dead_branches',
    title: 'Cut back dead and diseased branches',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Dead, dried or diseased branches',
    organic:
      'Cut them back into healthy wood, about 3 inches below the damage; thin crowding for air; seal cuts with cow-dung paste. NIPHM prefers summer for pruning scale-infested parts',
    why: 'Dieback, pink disease, scale',
    hi: {
      title: 'सूखी और रोगी डालियां काट दें',
      organic:
        'उन्हें स्वस्थ लकड़ी तक काटें, नुकसान से लगभग 3 inch नीचे; हवा के लिए घनी डालियां छांटें; कटे हिस्सों पर गोबर का लेप लगाएं। स्केल लगे हिस्सों की छंटाई के लिए NIPHM गर्मी को बेहतर मानता है',
      why: 'डाईबैक, पिंक रोग, स्केल कीट',
      conditional: 'मरी, सूखी या रोगी डालियां',
    },
    windows: ALL,
  },
  {
    key: 'mealybug_after_band',
    title: 'Prune twigs still carrying mealybugs',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Mealybugs are still on shoots after banding',
    organic: 'Prune and burn the infested twigs',
    why: 'Mealybug',
    hi: {
      title: 'मिलीबग वाली टहनियों की छंटाई करें',
      organic: 'मिलीबग लगी टहनियां काटकर जला दें',
      why: 'मिलीबग',
      conditional: 'पट्टी बांधने के बाद भी टहनियों पर मिलीबग हैं',
    },
    windows: { E: ALL_YEAR },
  },
  {
    key: 'shape_young',
    title: 'Build a clean trunk on the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Early side branches or sprouts below the graft',
    organic:
      'Remove all side branches that come early, to build a clean trunk 1.5–2 m tall, where the fruit will form. Remove sprouts from below the graft joint as they appear. Keep the graft staked',
    why: 'The fruit forms on the clean trunk',
    hi: {
      title: 'छोटे पेड़ का साफ तना बनाएं',
      organic:
        '1.5–2 m ऊंचा साफ तना बनाने के लिए जल्दी आने वाली सभी बगल की डालियां हटाएं, फल इसी तने पर लगेंगे। ग्राफ्ट जोड़ के नीचे से निकलने वाले फुटाव दिखते ही हटाएं। ग्राफ्ट को डंडे का सहारा दिए रखें',
      why: 'फल साफ तने पर लगते हैं',
      conditional: 'जल्दी निकली बगल की डालियां या ग्राफ्ट के नीचे से फुटाव',
    },
    windows: ALL,
  },
];

const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic:
      'Dose per year of age, half each time, in a ring under the canopy, mixed into the soil',
    dose: SPLIT_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      organic:
        'उम्र के हर साल के हिसाब से खुराक, हर बार आधी, छतरी के नीचे घेरे में, मिट्टी में मिलाकर',
      why: 'मज़बूत ढांचे के लिए लगातार बढ़त',
    },
    windows: { E: [MAY_JUN, SEP_OCT], S: [MAY_JUN, SEP_OCT] },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'harvest',
    avoid: ['Leaving rotting fruit on tree or ground'],
    watch: ['Fruit rot', 'Fruit borer', 'Fruit fly (regional)'],
    hi: {
      avoid: ['सड़े फल पेड़ या ज़मीन पर छोड़ना'],
      watch: ['फल सड़न', 'फल छेदक', 'फल मक्खी (कुछ इलाकों में)'],
    },
    months: { E: [6, 6], K: [6, 6], S: [3, 7] },
  },
  {
    phase: 'post_harvest_recovery',
    avoid: ['Waterlogging in the monsoon'],
    watch: ['Stem borer', 'Dieback', 'Pink disease on branches'],
    hi: {
      avoid: ['बारिश में पानी भरना'],
      watch: ['तना छेदक', 'डाईबैक', 'डालियों पर पिंक रोग'],
    },
    months: { E: [7, 10], K: [7, 10], S: [8, 10] },
  },
  {
    phase: 'before_harvest',
    avoid: [
      'Water stress at flowering and fruit set',
      'Heavy watering (insipid flakes)',
    ],
    watch: [
      'Mealybug (Dec–Jan)',
      'Spittle bug',
      'Shoot and fruit borer',
      'Rhizopus rot of flowers and young fruit',
    ],
    hi: {
      avoid: ['फूल और फल बनते समय पानी की कमी', 'ज़्यादा पानी (फीके कोए)'],
      watch: [
        'मिलीबग (दिसंबर–जनवरी)',
        'स्पिटल बग',
        'टहनी और फल छेदक',
        'फूलों और छोटे फलों में Rhizopus सड़न',
      ],
    },
    months: { E: [11, 5] },
  },
  {
    phase: 'before_harvest',
    avoid: [
      'Water stress at flowering and fruit set',
      'Heavy watering (insipid flakes)',
    ],
    watch: [
      'Spittle bug',
      'Shoot and fruit borer',
      'Rhizopus rot of flowers and young fruit',
    ],
    hi: {
      avoid: ['फूल और फल बनते समय पानी की कमी', 'ज़्यादा पानी (फीके कोए)'],
      watch: [
        'स्पिटल बग',
        'टहनी और फल छेदक',
        'फूलों और छोटे फलों में Rhizopus सड़न',
      ],
    },
    months: { K: [11, 5], S: [11, 2] },
  },
];

const regionCare = (group: Group): RegionCare =>
  // Young trees have no phase table in the approved content: they read as 'growing'.
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const JACKFRUIT_CARE: FamilyCare = {
  family: 'jackfruit',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'TNAU Agritech jack',
    'NIPHM/DPPQS AESA-based IPM package for jackfruit',
    'KAU Centre for e-Learning jackfruit pages (celkau.in)',
    'AAU Package of Practices for Horticultural Crops of Assam (2021)',
  ],
  grownIn: ['EAST_INDIA', 'COASTAL_HUMID', 'SOUTH_DECCAN'],
  regions: {
    EAST_INDIA: regionCare('E'),
    COASTAL_HUMID: regionCare('K'),
    SOUTH_DECCAN: regionCare('S'),
  },
};
