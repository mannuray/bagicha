import { ALL_YEAR, groupCare, type ItemSpec, type PhaseSpec } from './build';
import type { Dose, FamilyCare, RegionCare } from '../../domain/tree-care';

/**
 * Amla (aonla) care, transcribed from the source-checked table approved by the
 * owner on 2026-11-12 (docs/plant-care/amla.md, with a source for every row).
 * Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * One timing group: A = North, from ICAR-CISH's month-by-month calendar for
 * the subtropical belt. Central and East are pending: they were inferred
 * copies of the North with no source of their own.
 *
 * Dose: CISH, per year of age up to 10 years, split as NHB gives it. No
 * pesticide has an aonla label claim, so there are no chemical sprays.
 */
type Group = 'A';

/** Row 2 (Jan–Feb): FYM 5 kg + urea 110 g + SSP 310 g + MOP 85 g × age. */
const MAIN_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 5000 }],
  chemical: [
    { what: 'urea', grams: 110 },
    { what: 'SSP', grams: 310 },
    { what: 'MOP', grams: 85 },
  ],
  maxAgeYears: 10,
};
/** Row 5 (Jul–Aug): urea 110 g + MOP 85 g × age. */
const SECOND_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 110 },
    { what: 'MOP', grams: 85 },
  ],
  maxAgeYears: 10,
};

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'prune',
    title: 'Prune dry, diseased and galled shoots',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut out dry, diseased, insect-hit, broken and crossing branches and swollen shoot galls; burn the prunings. Bearing trees need no other pruning',
    why: 'Clears borer and gall-maker hiding places before new growth',
    hi: {
      title: 'सूखी, रोगी और गांठ वाली टहनियां छांटें',
      organic:
        'सूखी, रोगी, कीड़े लगी, टूटी और आपस में टकराती डालियां और टहनियों पर फूली गांठें काट दें; कटी टहनियां जला दें। फल देने वाले पेड़ों को और कोई छंटाई नहीं चाहिए',
      why: 'नई बढ़वार से पहले छेदक और गांठ बनाने वाले कीटों के छिपने की जगहें साफ़ होती हैं',
    },
    windows: {
      A: [
        [1, 1],
        [2, 15],
      ],
    },
  },
  {
    key: 'main_feed',
    title: 'Dig the basin and give the main feed',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "Dig the basin. Spread all the year's FYM in a ring 1–1.5 m from the trunk and mix it 15–20 cm into the soil; water lightly afterwards",
    chemical:
      "Half the year's urea + all the SSP + half the MOP in the same ring; wear gloves",
    dose: MAIN_DOSE,
    why: 'Feeds the spring flush; digging exposes stone borer and fruit midge larvae resting in the soil',
    hi: {
      title: 'थाला खोदें और मुख्य खुराक दें',
      organic:
        'थाला खोदें। साल भर की सारी गोबर की खाद तने से 1–1.5 m दूर घेरे में बिखेरें और 15–20 cm गहरी मिट्टी में मिलाएं; बाद में हल्का पानी दें',
      chemical:
        'साल भर के urea का आधा + सारा SSP + आधा MOP उसी घेरे में; दस्ताने पहनें',
      why: 'बसंत की फुटान को खुराक मिलती है; खुदाई से मिट्टी में छिपे गुठली छेदक और फल मिज के लार्वा बाहर आ जाते हैं',
    },
    windows: {
      A: [
        [1, 1],
        [2, 15],
      ],
    },
  },
  {
    key: 'hold_water',
    title: 'Hold back water while it flowers',
    category: 'WATERING',
    stages: ['BEARING'],
    organic: "Don't water bearing trees, and keep the basin from staying wet",
    why: 'Excess moisture at bloom hurts flowering',
    hi: {
      title: 'फूल आते समय पानी रोकें',
      organic: 'फल देने वाले पेड़ों को पानी न दें, और थाले को गीला न रहने दें',
      why: 'फूल आते समय ज़्यादा नमी फूलों को नुकसान पहुंचाती है',
    },
    windows: {
      A: [
        [3, 10],
        [4, 30],
      ],
    },
  },
  {
    key: 'summer_water',
    title: 'Water every 15–20 days in dry summer',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      'Water the ring basin every 15–20 days until the monsoon; mulch after watering with paddy straw or dry grass',
    why: 'Small fruits sit dormant now; a little moisture stops them dropping',
    hi: {
      title: 'सूखी गर्मी में हर 15–20 दिन पानी दें',
      organic:
        'मानसून तक हर 15–20 दिन घेरे वाले थाले में पानी दें; पानी के बाद धान की पराली या सूखी घास का मल्च बिछाएं',
      why: 'छोटे फल अभी रुके पड़े रहते हैं; थोड़ी नमी से वे झड़ते नहीं',
    },
    windows: {
      A: [
        [5, 1],
        [6, 20],
      ],
    },
  },
  {
    key: 'second_feed',
    title: 'Give the second feed',
    category: 'FEEDING',
    stages: ['BEARING'],
    // The table's organic cell is empty; the app always shows an organic line.
    organic: "None now: all the year's FYM went in with the main feed",
    chemical:
      'Other half of the urea + other half of the MOP in the ring; water in if there is no rain; wear gloves',
    dose: SECOND_DOSE,
    why: 'Feeds fruit growth. CISH says July, NHB says August',
    hi: {
      title: 'दूसरी खुराक दें',
      organic:
        'अभी कुछ नहीं: साल भर की सारी गोबर की खाद मुख्य खुराक के साथ डल चुकी है',
      chemical:
        'urea का बाकी आधा + MOP का बाकी आधा घेरे में; बारिश न हो तो पानी दें; दस्ताने पहनें',
      why: 'फलों की बढ़वार को खुराक मिलती है। CISH जुलाई कहता है, NHB अगस्त',
    },
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
    },
  },
  {
    key: 'keep_moist',
    title: 'Keep the basin moist as fruit swells',
    category: 'WATERING',
    stages: ['BEARING'],
    organic: 'If the rains break, water the basin so it never dries out',
    why: 'Fruit grows fastest now',
    hi: {
      title: 'फल बढ़ते समय थाला नम रखें',
      organic: 'बारिश रुक जाए तो थाले में पानी दें ताकि वह कभी न सूखे',
      why: 'फल अभी सबसे तेज़ बढ़ते हैं',
    },
    windows: {
      A: [
        [8, 15],
        [9, 30],
      ],
    },
  },
  {
    key: 'borax_spray',
    title: 'Spray borax against browning inside fruit',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      'Borax 6 g per litre (0.6%), 2–3 sprays 10–15 days apart; wear gloves. A nutrient spray, not a pesticide: no waiting period is set, and the last spray falls before picking',
    why: 'Boron shortage turns the flesh brown and corky (mostly Banarasi and Francis; Chakaiya, NA-6 and NA-7 resist)',
    hi: {
      title: 'फल के अंदर भूरापन रोकने के लिए borax स्प्रे करें',
      organic:
        'Borax 6 g प्रति लीटर (0.6%), 10–15 दिन के अंतर पर 2–3 स्प्रे; दस्ताने पहनें। यह पोषक स्प्रे है, कीटनाशक नहीं: कोई इंतज़ार तय नहीं, और आखिरी स्प्रे तुड़ाई से पहले हो जाता है',
      why: 'boron की कमी से गूदा भूरा और कॉर्क जैसा हो जाता है (ज़्यादातर Banarasi और Francis में; Chakaiya, NA-6 और NA-7 इससे बचे रहते हैं)',
    },
    windows: {
      A: [
        [9, 1],
        [10, 15],
      ],
    },
  },
  {
    key: 'pick',
    title: 'Pick fruit as soon as it is fully mature',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      'Pick by hand in the early morning or late evening, without dropping or scratching the fruit. Banarasi, Krishna and NA-10 ripen in Oct; Kanchan, NA-6 and NA-7 in Nov; Chakaiya in Dec',
    why: "Fruit left too long drops, and it cuts next year's crop. Scratched fruit gets blue mould",
    hi: {
      title: 'फल पूरा तैयार होते ही तोड़ें',
      organic:
        'सुबह जल्दी या देर शाम हाथ से तोड़ें, फल को गिराए या खरोंचे बिना। Banarasi, Krishna और NA-10 अक्टूबर में पकते हैं; Kanchan, NA-6 और NA-7 नवंबर में; Chakaiya दिसंबर में',
      why: 'ज़्यादा देर छोड़ा फल झड़ जाता है, और इससे अगले साल की फसल घटती है। खरोंच लगे फल पर नीली फफूंद लगती है',
    },
    windows: {
      A: [
        [10, 15],
        [12, 31],
      ],
    },
  },
];

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'bark_caterpillar',
    title: 'Treat bark-eating caterpillar holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'Silk-and-sawdust webbing on bark with holes at branch joints (from April)',
    organic:
      'Scrape off the webbing, push a wire into each hole to kill the caterpillar, put a few drops of kerosene in the hole and seal it with wet mud',
    why: 'Bark-eating caterpillar',
    hi: {
      title: 'छाल खाने वाली सुंडी के छेदों का इलाज करें',
      conditional:
        'छाल पर रेशम और बुरादे का जाला, डालियों के जोड़ पर छेद (अप्रैल से)',
      organic:
        'जाला खुरचकर हटाएं, हर छेद में तार डालकर सुंडी मारें, छेद में केरोसिन की कुछ बूंदें डालें और गीली मिट्टी से बंद कर दें',
      why: 'छाल खाने वाली सुंडी',
    },
    windows: { A: ALL_YEAR },
  },
  {
    key: 'shoot_gall',
    title: 'Cut and burn galled shoots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Shoot tips swell into galls',
    organic:
      "Cut the galled shoots after harvest and burn them; don't let branches crowd",
    why: 'Shoot gall maker',
    hi: {
      title: 'गांठ वाली टहनियां काटकर जलाएं',
      conditional: 'टहनियों के सिरे फूलकर गांठ बन जाते हैं',
      organic:
        'तुड़ाई के बाद गांठ वाली टहनियां काटकर जला दें; डालियों को घना न होने दें',
      why: 'टहनी गांठ कीट',
    },
    // Seen Oct–Nov.
    windows: {
      A: [
        [10, 1],
        [11, 30],
      ],
    },
  },
  {
    key: 'mealybug_aphid',
    title: 'Clip shoots with mealybugs or aphids',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'New shoots twist with white mealybugs or aphids and ants on them',
    organic: 'Clip off and destroy the infested shoots early',
    why: 'Mealybug and aphids',
    hi: {
      title: 'मिलीबग या माहू वाली टहनियां काटें',
      conditional:
        'नई टहनियां मुड़ जाती हैं, उन पर सफेद मिलीबग या माहू और चींटियां',
      organic: 'कीट लगी टहनियां जल्दी काटकर नष्ट करें',
      why: 'मिलीबग और माहू',
    },
    windows: { A: ALL_YEAR },
  },
  {
    key: 'leaf_roller',
    title: 'Clip rolled leaves',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Leaves webbed together with a small caterpillar inside',
    organic: 'Clip the rolled leaves at the start and destroy them',
    why: 'Leaf roller',
    hi: {
      title: 'लिपटे पत्ते तोड़ें',
      conditional: 'पत्ते जाले से जुड़े हैं और अंदर छोटी सुंडी है',
      organic: 'शुरुआत में ही लिपटे पत्ते तोड़कर नष्ट करें',
      why: 'पत्ता लपेटक',
    },
    windows: { A: ALL_YEAR },
  },
  {
    key: 'pomegranate_butterfly',
    title: 'Pick off bored young fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Young fruits have bore holes with frass',
    organic:
      "Pick and destroy them. Don't grow pomegranate or guava right next to amla",
    why: 'Pomegranate butterfly',
    hi: {
      title: 'छेद वाले छोटे फल तोड़ें',
      conditional: 'छोटे फलों में छेद और उनमें बीट',
      organic:
        'उन्हें तोड़कर नष्ट करें। आंवले के ठीक पास अनार या अमरूद न लगाएं',
      why: 'अनार की तितली',
    },
    windows: {
      A: [
        [9, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'rust',
    title: 'Cut out rust-infected shoots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Reddish-brown pustules in rings on fruit or leaves',
    organic:
      'Cut out badly infected shoots and keep the canopy open. Banarasi and Chakaiya are fairly free of it. No fungicide has an aonla label claim',
    why: 'Rust',
    hi: {
      title: 'रतुआ लगी टहनियां काटें',
      conditional: 'फलों या पत्तों पर घेरों में लाल-भूरे दाने',
      organic:
        'ज़्यादा रोगी टहनियां काट दें और पेड़ को खुला रखें। Banarasi और Chakaiya में यह काफ़ी कम होता है। आंवले के लिए किसी फफूंदनाशक को लेबल मंज़ूरी नहीं है',
      why: 'रतुआ (rust)',
    },
    windows: {
      A: [
        [7, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'prop_branches',
    title: 'Prop branches under a heavy crop',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Branches split under a heavy crop (Lakshmi-52, NA-6, NA-7)',
    organic: 'Prop them in September',
    why: 'Branches split under a heavy crop',
    hi: {
      title: 'भारी फसल में डालियों को सहारा दें',
      conditional: 'भारी फसल से डालियां फट जाती हैं (Lakshmi-52, NA-6, NA-7)',
      organic: 'सितंबर में उन्हें सहारा दें',
      why: 'भारी फसल से डालियां फट जाती हैं',
    },
    windows: {
      A: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'cross_pollination',
    title: 'Plant a second variety for fruit set',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'A lone tree flowers but sets little fruit',
    organic: 'Amla needs a second variety nearby for cross-pollination',
    why: 'Amla needs cross-pollination',
    hi: {
      title: 'फल लगने के लिए दूसरी किस्म लगाएं',
      conditional: 'अकेले पेड़ पर फूल आते हैं पर फल कम लगते हैं',
      organic: 'आंवले को पर-परागण के लिए पास में दूसरी किस्म चाहिए',
      why: 'आंवले को पर-परागण चाहिए',
    },
    windows: { A: ALL_YEAR },
  },
  {
    key: 'alkaline_soil',
    title: 'Add micronutrients on alkaline soil',
    category: 'GENERAL',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'The soil is alkaline (usar/sodic)',
    organic:
      'Mix borax, zinc sulphate and copper sulphate, 100 g each, into the January fertiliser ring, scaled to tree age and vigour; wear gloves. This is a soil nutrient dressing, not a spray',
    why: 'A soil nutrient dressing for usar/sodic soil',
    hi: {
      title: 'क्षारीय मिट्टी में सूक्ष्म पोषक तत्व डालें',
      conditional: 'मिट्टी क्षारीय है (ऊसर/sodic)',
      organic:
        'borax, zinc sulphate और copper sulphate, हर एक 100 g, जनवरी वाले खाद के घेरे में मिलाएं, पेड़ की उम्र और ताकत के हिसाब से घटा-बढ़ाकर; दस्ताने पहनें। यह मिट्टी में डालने वाला पोषक है, स्प्रे नहीं',
      why: 'ऊसर/sodic मिट्टी के लिए मिट्टी में डालने वाला पोषक',
    },
    // The January fertiliser ring: the main feed's window.
    windows: {
      A: [
        [1, 1],
        [2, 15],
      ],
    },
  },
];

const YOUNG_TEXT =
  'Same per-year-of-age dose as the bearing tree, in a ring mixed into the soil and watered lightly';
const YOUNG_TEXT_HI =
  'फल देने वाले पेड़ जितनी ही, उम्र के हर साल के हिसाब से खुराक, घेरे में मिट्टी में मिलाकर हल्का पानी दें';

const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young_main',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: MAIN_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      organic: YOUNG_TEXT_HI,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़वार',
    },
    windows: {
      A: [
        [1, 1],
        [2, 15],
      ],
    },
  },
  {
    key: 'feed_young_second',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: SECOND_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      organic: YOUNG_TEXT_HI,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़वार',
    },
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
    },
  },
  {
    key: 'water_young',
    title: 'Water the young tree every 15–20 days',
    category: 'WATERING',
    stages: ['YOUNG'],
    organic:
      'Every 15–20 days in March, regularly through April–June; clean the ring basin and mulch after watering',
    why: 'Young roots dry out fast',
    hi: {
      title: 'छोटे पेड़ को हर 15–20 दिन पानी दें',
      organic:
        'मार्च में हर 15–20 दिन, अप्रैल–जून में नियमित; घेरे वाला थाला साफ़ करें और पानी के बाद मल्च बिछाएं',
      why: 'छोटी जड़ें जल्दी सूख जाती हैं',
    },
    windows: {
      A: [
        [3, 1],
        [6, 20],
      ],
    },
  },
  {
    key: 'frost_cover',
    title: 'Cover the young tree against frost',
    category: 'PROTECTION',
    stages: ['YOUNG'],
    organic:
      'Wrap with straw on all sides through Dec–Jan and take it off in the second week of Feb; water in cold spells and mulch the basin; a cow-dung paste on the trunk also helps',
    why: 'Frost on young trees',
    hi: {
      title: 'छोटे पेड़ को पाले से बचाने के लिए ढकें',
      organic:
        'दिसंबर–जनवरी में चारों तरफ़ पुआल लपेटें और फरवरी के दूसरे हफ्ते में हटा दें; ठंड के दिनों में पानी दें और थाले में मल्च बिछाएं; तने पर गोबर का लेप भी मदद करता है',
      why: 'छोटे पेड़ों पर पाला',
    },
    windows: {
      A: [
        [12, 1],
        [2, 14],
      ],
    },
  },
  {
    key: 'shape_young',
    title: 'Shape to 2–4 main branches',
    category: 'PRUNING',
    stages: ['YOUNG'],
    organic:
      'Let the first branches start 0.75–1 m up; keep 2–4 wide-angled branches facing opposite ways and pinch off the rest (later years: 4–6 branches)',
    why: 'Wide-angled main branches',
    hi: {
      title: 'पेड़ को 2–4 मुख्य डालियों का आकार दें',
      organic:
        'पहली डालियां 0.75–1 m ऊंचाई से शुरू होने दें; उल्टी दिशाओं में फैली 2–4 चौड़े कोण वाली डालियां रखें और बाकी तोड़ दें (बाद के सालों में 4–6 डालियां)',
      why: 'चौड़े कोण वाली मुख्य डालियां',
    },
    windows: {
      A: [
        [3, 1],
        [4, 30],
      ],
    },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'pre_flowering',
    avoid: ['Leaving dead and galled wood on the tree'],
    watch: ['Frost on young trees'],
    hi: {
      avoid: ['पेड़ पर सूखी और गांठ वाली लकड़ी छोड़ना'],
      watch: ['छोटे पेड़ों पर पाला'],
    },
    months: { A: [1, 2] },
  },
  {
    phase: 'flowering',
    avoid: ['Watering bearing trees', 'A wet basin'],
    watch: ['Mealybug and aphids on new shoots'],
    hi: {
      avoid: ['फल देने वाले पेड़ों को पानी देना', 'गीला थाला'],
      watch: ['नई टहनियों पर मिलीबग और माहू'],
    },
    months: { A: [3, 4] },
  },
  {
    phase: 'fruit_dormancy',
    avoid: ['Letting the basin go bone dry'],
    watch: ['Bark-eating caterpillar', 'Leaf roller', 'Fruitlet drop'],
    hi: {
      avoid: ['थाले को बिल्कुल सूखने देना'],
      watch: ['छाल खाने वाली सुंडी', 'पत्ता लपेटक', 'छोटे फल झड़ना'],
    },
    months: { A: [5, 6] },
  },
  {
    phase: 'fruit_development',
    avoid: ['Waterlogging round the trunk'],
    watch: [
      'Rust',
      'Stone borer (pea-size fruit)',
      'Pomegranate butterfly',
      'Shoot gall',
    ],
    hi: {
      avoid: ['तने के आसपास पानी भरना'],
      watch: [
        'रतुआ',
        'गुठली छेदक (मटर जितने फल)',
        'अनार की तितली',
        'टहनी गांठ',
      ],
    },
    months: { A: [7, 9] },
  },
  {
    phase: 'harvest',
    avoid: ['Leaving ripe fruit on the tree', 'Bruising or dropping fruit'],
    watch: ['Fruit midge', 'Blue mould on bruised fruit'],
    hi: {
      avoid: ['पके फल पेड़ पर छोड़ना', 'फल को चोट लगना या गिराना'],
      watch: ['फल मिज', 'चोट लगे फलों पर नीली फफूंद'],
    },
    months: { A: [10, 12] },
  },
];

const regionCare = (group: Group): RegionCare =>
  // Young trees have no phase table in the approved content: they read as 'growing'.
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const AMLA_CARE: FamilyCare = {
  family: 'amla',
  sources: [
    'ICAR-CISH, Annual crop management practices in aonla, Indian Horticulture 70(1), 2025',
    'National Horticulture Board model project report, Aonla',
    'NHM IPM schedule for aonla pests (2012)',
    'NIPHM/DPPQS AESA-based IPM package for amla',
    'TNAU Agritech amla',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: ['NORTH_INDIA', 'CENTRAL_INDIA', 'EAST_INDIA'],
  pendingRegions: ['CENTRAL_INDIA', 'EAST_INDIA'],
  regions: {
    NORTH_INDIA: regionCare('A'),
  },
};
