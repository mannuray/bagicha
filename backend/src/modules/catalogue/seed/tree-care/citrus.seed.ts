import { ALL_YEAR, groupCare, type ItemSpec, type PhaseSpec } from './build';
import type {
  CareKind,
  Dose,
  FamilyCare,
  RegionCare,
} from '../../domain/tree-care';

/**
 * Citrus care by kind, transcribed from the source-checked draft approved on
 * 2026-11-18 with every recommendation (docs/plant-care/citrus.md; review doc
 * "Citrus care by kind — owner review"). Change it only through the add-plant
 * playbook: source check, then the owner's yes.
 *
 * NORTH = North India, from PAU (Punjab). SOUTH = South Deccan, from TNAU
 * (Tamil Nadu), for acid lime and sweet orange only. Every other region is
 * pending: its trees keep the season pack. A citrus tree of no known kind
 * (just "nimbu") gets no care. Chemicals are listed only with a citrus label
 * claim, a per-litre dose and a waiting period (CIB&RC MUP to 30.09.2026).
 *
 * Pomelo (chakotra, batabi) added from the draft approved on 2026-11-24 with
 * every recommendation (docs/plant-care/citrus-pomelo.md): North India from
 * IH 2026 (ICAR Indian Horticulture) and PAU's citrus-wide rows; "Citrus" label
 * claims read as the genus. Its East India stays pending.
 */
// Every region a kind has no checked care for is pending (approved doc §5), even
// outside its grownIn: otherwise the engine would lend it the nearest region's care.
type Group = 'NORTH' | 'SOUTH';
type Kind = 'lime' | 'lemon' | 'mandarin' | 'sweet_orange' | 'pomelo';
type Item = ItemSpec<Group> & { kinds?: Kind[] };

/** PAU p.21: Kinnow, per year of age up to 8 years. */
const MANDARIN_FYM: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [],
  maxAgeYears: 8,
};
const MANDARIN_UREA: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 120 }],
  maxAgeYears: 8,
};
/** PAU p.21: lime, lemon and sweet orange come as age bands, not per year. */
const FYM_BANDS =
  '5–20 kg at 1–3 years, 25–50 kg at 4–6, 60–90 kg at 7–9, 100 kg from 10 years';
const UREA_BANDS =
  '110–330 g a year at 1–3 years, 440–550 g at 4–6, 660–880 g at 7–9, 880–1760 g from 10 years';
/** IH 2026 p.19: pomelo, 10 kg FYM per year of age up to 5 years (the table's lower figure). */
const POMELO_FYM: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [],
  maxAgeYears: 5,
};
/** IH 2026 p.19: N by year as urea (N ÷ 0.46), halved for each of the two feeds. */
const POMELO_UREA_HALF =
  '90–110 g (1st year), 175–220 g (2nd), 325–380 g (3rd), 490–545 g (4th), 650–705 g (5th on)';
const BORDEAUX_PASTE =
  'Bordeaux paste (200 g copper sulphate in 1.5 L water, 300 g quicklime in 1.5 L, mixed); wear gloves';
const SPOTS_CHEMICAL =
  'Copper sulphate 47.15% + mancozeb 30% WDG 5 g per litre; wear gloves; not within 10 days of picking';
const PSYLLA_CHEMICAL =
  'Thiamethoxam 25 WG 0.1 g per litre (1 g in 10 L); spray in the evening, not on open flowers; wear gloves; not within 20 days of picking';
const LEAF_MINER_CHEMICAL =
  'Thiamethoxam 12.6% + lambda-cyhalothrin 9.5% ZC 0.3 ml per litre; wear gloves; not within 10 days of picking';

const FYM_BANDS_HI =
  '1–3 साल पर 5–20 kg, 4–6 पर 25–50 kg, 7–9 पर 60–90 kg, 10 साल से 100 kg';
const UREA_BANDS_HI =
  '1–3 साल पर साल में 110–330 g, 4–6 पर 440–550 g, 7–9 पर 660–880 g, 10 साल से 880–1760 g';
const POMELO_UREA_HALF_HI =
  '90–110 g (पहला साल), 175–220 g (दूसरा), 325–380 g (तीसरा), 490–545 g (चौथा), 650–705 g (5वें से आगे)';
// Ends the sentence ("… पर" + this), so the verb comes before the gloves note.
const BORDEAUX_PASTE_HI =
  'Bordeaux paste लगाएं (200 g copper sulphate 1.5 L पानी में, 300 g quicklime 1.5 L में, फिर दोनों मिलाएं); दस्ताने पहनें';
const SPOTS_CHEMICAL_HI =
  'Copper sulphate 47.15% + mancozeb 30% WDG 5 g प्रति लीटर; दस्ताने पहनें; तोड़ने से 10 दिन पहले तक नहीं';
const PSYLLA_CHEMICAL_HI =
  'Thiamethoxam 25 WG 0.1 g प्रति लीटर (10 L में 1 g); शाम को स्प्रे करें, खुले फूलों पर नहीं; दस्ताने पहनें; तोड़ने से 20 दिन पहले तक नहीं';
const LEAF_MINER_CHEMICAL_HI =
  'Thiamethoxam 12.6% + lambda-cyhalothrin 9.5% ZC 0.3 ml प्रति लीटर; दस्ताने पहनें; तोड़ने से 10 दिन पहले तक नहीं';

const OTHERS: Kind[] = ['lime', 'lemon', 'sweet_orange'];
const month = (
  m: number,
  from = 1,
  to?: number,
): [[number, number], [number, number]] => [
  [m, from],
  // February counts 29, as in build.ts, so a leap day is never uncovered.
  [m, to ?? (m === 2 ? 29 : new Date(Date.UTC(2026, m, 0)).getUTCDate())],
];

const NORTH_ITEMS: Item[] = [
  {
    key: 'manure',
    kinds: ['mandarin'],
    title: "Spread the year's manure under the tree",
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic:
      "All the year's FYM in the basin under the canopy, forked in lightly: 10 kg per year of age, up to 8 years",
    dose: MANDARIN_FYM,
    why: 'Manure goes in during the winter rest, before spring growth',
    hi: {
      title: 'साल भर की खाद पेड़ के नीचे डालें',
      organic:
        'साल भर की पूरी गोबर की खाद (FYM) छतरी के नीचे थाले में डालें और हल्का गोड़कर मिलाएं: पेड़ की उम्र के हर साल पर 10 kg, 8 साल तक',
      why: 'खाद सर्दी के आराम में डलती है, बसंत की बढ़वार से पहले',
    },
    windows: { NORTH: month(12) },
  },
  {
    key: 'manure',
    kinds: OTHERS,
    title: "Spread the year's manure under the tree",
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: `All the year's FYM in the basin under the canopy, forked in lightly: ${FYM_BANDS}`,
    why: 'Manure goes in during the winter rest, before spring growth',
    hi: {
      title: 'साल भर की खाद पेड़ के नीचे डालें',
      organic: `साल भर की पूरी गोबर की खाद (FYM) छतरी के नीचे थाले में डालें और हल्का गोड़कर मिलाएं: ${FYM_BANDS_HI}`,
      why: 'खाद सर्दी के आराम में डलती है, बसंत की बढ़वार से पहले',
    },
    windows: { NORTH: month(12) },
  },
  {
    key: 'first_feed',
    kinds: ['mandarin'],
    title: 'Give the first feed before new growth',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "Half the year's urea in the basin, plus SSP from the 4th year (1.37–2.4 kg at 4–7 years, 2.73 kg from 8); water in; wear gloves",
    dose: MANDARIN_UREA,
    why: 'Feeds the spring flush and the flowers',
    hi: {
      title: 'नई बढ़वार से पहले पहली खाद दें',
      chemical:
        'साल भर के urea का आधा थाले में, और चौथे साल से SSP भी (4–7 साल पर 1.37–2.4 kg, 8 से 2.73 kg); पानी दें; दस्ताने पहनें',
      why: 'बसंत की नई फुटान और फूलों को खुराक देती है',
    },
    windows: { NORTH: month(2) },
  },
  {
    key: 'first_feed',
    kinds: OTHERS,
    title: 'Give the first feed before new growth',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical: `Half the year's urea in the basin (${UREA_BANDS}); water in; wear gloves`,
    why: 'Feeds the spring flush and the flowers',
    hi: {
      title: 'नई बढ़वार से पहले पहली खाद दें',
      chemical: `साल भर के urea का आधा थाले में (${UREA_BANDS_HI}); पानी दें; दस्ताने पहनें`,
      why: 'बसंत की नई फुटान और फूलों को खुराक देती है',
    },
    windows: { NORTH: month(2) },
  },
  {
    key: 'second_feed',
    kinds: ['mandarin'],
    title: 'Give the second feed after fruit set',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "The other half of the year's urea in the basin; water in; wear gloves",
    dose: MANDARIN_UREA,
    why: 'Feeds the young fruit',
    hi: {
      title: 'फल बनने के बाद दूसरी खाद दें',
      chemical: 'साल भर के urea का बाकी आधा थाले में; पानी दें; दस्ताने पहनें',
      why: 'छोटे फलों को खुराक देती है',
    },
    windows: {
      NORTH: [
        [4, 1],
        [5, 31],
      ],
    },
  },
  {
    key: 'second_feed',
    kinds: OTHERS,
    title: 'Give the second feed after fruit set',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "The other half of the year's urea in the basin; water in; wear gloves",
    why: 'Feeds the young fruit',
    hi: {
      title: 'फल बनने के बाद दूसरी खाद दें',
      chemical: 'साल भर के urea का बाकी आधा थाले में; पानी दें; दस्ताने पहनें',
      why: 'छोटे फलों को खुराक देती है',
    },
    windows: {
      NORTH: [
        [4, 1],
        [5, 31],
      ],
    },
  },
  {
    key: 'prune',
    kinds: [...OTHERS, 'pomelo'],
    title: 'Prune out dead and diseased twigs',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic: `Cut dead, dried and diseased twigs back to healthy wood, open up the centre and burn the prunings; seal cuts with ${BORDEAUX_PASTE}`,
    why: 'Stops die-back spreading and lets light in',
    hi: {
      title: 'सूखी और रोगी टहनियां काट दें',
      organic: `सूखी, मरी और रोगी टहनियों को स्वस्थ लकड़ी तक काटें, बीच से पेड़ खोलें और कटी टहनियां जला दें; कटे हिस्सों पर ${BORDEAUX_PASTE_HI}`,
      why: 'डाईबैक (ऊपर से सूखना) फैलने से रुकता है और धूप अंदर आती है',
    },
    windows: {
      NORTH: [
        [1, 1],
        [2, 29],
      ],
    },
  },
  {
    key: 'prune',
    kinds: ['mandarin'],
    title: 'Prune out dead and diseased twigs',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic: `After picking, cut dead, dried and diseased twigs back to healthy wood, open up the centre and burn the prunings; seal cuts with ${BORDEAUX_PASTE}`,
    why: 'Stops die-back spreading and lets light in',
    hi: {
      title: 'सूखी और रोगी टहनियां काट दें',
      organic: `फल तोड़ने के बाद, सूखी, मरी और रोगी टहनियों को स्वस्थ लकड़ी तक काटें, बीच से पेड़ खोलें और कटी टहनियां जला दें; कटे हिस्सों पर ${BORDEAUX_PASTE_HI}`,
      why: 'डाईबैक (ऊपर से सूखना) फैलने से रुकता है और धूप अंदर आती है',
    },
    windows: { NORTH: month(2) },
  },
  {
    key: 'bordeaux_spray',
    kinds: ['mandarin', 'sweet_orange', 'pomelo'],
    title: 'Spray Bordeaux mixture after pruning',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      "Bordeaux mixture 2:2:250: 8 g copper sulphate and 8 g quicklime per litre, each dissolved in half the water, then the copper poured into the lime while stirring; skip it if fruit is still on the tree, and don't spray in rain or in great heat; wear gloves",
    why: 'Protects cuts and the new flush from die-back',
    hi: {
      title: 'छंटाई के बाद Bordeaux mixture स्प्रे करें',
      organic:
        'Bordeaux mixture 2:2:250: 8 g copper sulphate और 8 g quicklime प्रति लीटर, दोनों को आधे-आधे पानी में घोलें, फिर copper वाला घोल चलाते हुए lime वाले घोल में डालें; पेड़ पर अभी फल हों तो यह न करें, और बारिश या तेज़ गर्मी में स्प्रे न करें; दस्ताने पहनें',
      why: 'कटे हिस्सों और नई फुटान को डाईबैक से बचाता है',
    },
    windows: { NORTH: month(3) },
  },
  {
    key: 'summer_water',
    kinds: ['lime', 'lemon', 'mandarin', 'sweet_orange'],
    title: 'Water every 2–3 weeks in the hot months',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      "Water every 2–3 weeks into a ring basin so water doesn't touch the trunk; don't flood",
    why: 'Dry soil after fruit set sheds flowers and fruit',
    hi: {
      title: 'गर्मी के महीनों में हर 2–3 हफ्ते पानी दें',
      organic:
        'हर 2–3 हफ्ते रिंग थाले में पानी दें ताकि पानी तने को न छुए; पानी न भरें',
      why: 'फल बनने के बाद सूखी मिट्टी से फूल और फल झड़ जाते हैं',
    },
    windows: {
      NORTH: [
        [4, 1],
        [6, 30],
      ],
    },
  },
  {
    key: 'psylla',
    title: 'Spray against citrus psylla',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    organic: 'Pinch off and destroy curled new shoots carrying nymphs',
    chemical: PSYLLA_CHEMICAL,
    why: 'Psylla sucks the new shoots and spreads greening disease',
    hi: {
      title: 'सिट्रस सिल्ला के लिए स्प्रे करें',
      organic:
        'मुड़ी हुई नई टहनियां, जिन पर शिशु (nymph) हों, तोड़कर नष्ट करें',
      chemical: PSYLLA_CHEMICAL_HI,
      why: 'सिल्ला नई टहनियों का रस चूसता है और ग्रीनिंग रोग फैलाता है',
    },
    windows: { NORTH: [month(3), month(9, 1, 10)] },
  },
  {
    key: 'leaf_miner',
    title: 'Spray young trees for leaf miner',
    category: 'PROTECTION',
    stages: ['YOUNG'],
    organic: 'Pick off and burn leaves with silvery tunnels',
    chemical: LEAF_MINER_CHEMICAL,
    why: 'Tunnels curl young leaves and open the way for canker',
    hi: {
      title: 'छोटे पेड़ों पर लीफ माइनर के लिए स्प्रे करें',
      organic: 'चांदी जैसी सुरंगों वाली पत्तियां तोड़कर जला दें',
      chemical: LEAF_MINER_CHEMICAL_HI,
      why: 'सुरंगों से नई पत्तियां मुड़ जाती हैं और कैंकर का रास्ता खुलता है',
    },
    windows: {
      NORTH: [
        [
          [4, 1],
          [5, 31],
        ],
        [
          [8, 1],
          [9, 30],
        ],
      ],
    },
  },
  {
    key: 'canker',
    kinds: ['lime'],
    title: 'Spray lime trees against canker',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    organic: 'Cut out and burn twigs with canker spots',
    chemical: SPOTS_CHEMICAL,
    why: 'Kagzi lime is highly susceptible: corky spots on leaves and fruit',
    hi: {
      title: 'कागज़ी नींबू पर कैंकर के लिए स्प्रे करें',
      organic: 'कैंकर के धब्बों वाली टहनियां काटकर जला दें',
      chemical: SPOTS_CHEMICAL_HI,
      why: 'कागज़ी नींबू को कैंकर बहुत जल्दी लगता है: पत्तियों और फलों पर कॉर्क जैसे धब्बे',
    },
    windows: { NORTH: [month(10), month(12), month(2)] },
  },
  {
    key: 'fallen_fruit',
    kinds: ['mandarin', 'sweet_orange', 'pomelo'],
    title: 'Collect and bury fallen fruit',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      'From now until picking, collect stung or fallen fruit and bury it deep',
    why: 'Flies sting fruit at colour break; the fruit rots and drops',
    hi: {
      title: 'गिरे फल इकट्ठा करके गाड़ दें',
      organic:
        'अब से फल तोड़ने तक, डंक लगे या गिरे फल इकट्ठा करें और गहरा गाड़ दें',
      why: 'रंग बदलते समय मक्खियां फल पर डंक मारती हैं; फल सड़कर गिर जाता है',
    },
    windows: { NORTH: month(8, 8, 14) },
  },
  {
    key: 'pick_kinnow',
    kinds: ['mandarin'],
    title: 'Pick Kinnow with clippers',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      "Clip the fruit with a short button stalk; don't pull. Don't pick in dew or just after rain; outer fruit first",
    why: 'Pulling tears the skin and the fruit rots',
    hi: {
      title: 'किन्नू कैंची से तोड़ें',
      organic:
        'फल को छोटी बटन जैसी डंठल के साथ काटें; खींचें नहीं। ओस में या बारिश के तुरंत बाद न तोड़ें; पहले बाहर वाले फल तोड़ें',
      why: 'खींचने से छिलका फटता है और फल सड़ जाता है',
    },
    windows: {
      NORTH: [
        [1, 15],
        [2, 15],
      ],
    },
  },
  {
    key: 'potassium_nitrate',
    kinds: ['mandarin'],
    title: 'Spray potassium nitrate for bigger fruit',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: '',
    chemical:
      'Potassium nitrate 10 g per litre (1%); a fertiliser, so no waiting days; wear gloves',
    why: 'Bigger fruit and a higher yield',
    hi: {
      title: 'बड़े फलों के लिए potassium nitrate स्प्रे करें',
      chemical:
        'Potassium nitrate 10 g प्रति लीटर (1%); यह खाद है, इसलिए तोड़ने से पहले रुकने की ज़रूरत नहीं; दस्ताने पहनें',
      why: 'बड़े फल और ज़्यादा पैदावार',
    },
    windows: { NORTH: [month(5, 21), month(6, 21), month(7, 21)] },
  },
  {
    key: 'thin_young',
    kinds: ['mandarin'],
    title: 'Thin fruit on young Kinnow trees',
    category: 'GENERAL',
    stages: ['YOUNG'],
    organic:
      'Soon after fruit set in the 3rd and 4th year, thin heavy loads (400–500 fruits is too many)',
    why: 'An over-loaded young tree can die',
    hi: {
      title: 'छोटे किन्नू पेड़ों पर फल कम करें',
      organic:
        'तीसरे और चौथे साल में फल बनने के जल्दी बाद भारी लदान कम करें (400–500 फल बहुत ज़्यादा हैं)',
      why: 'ज़्यादा लदा छोटा पेड़ मर सकता है',
    },
    windows: { NORTH: month(5) },
  },
  // Pomelo's own rows (IH 2026): its dose, summer watering and Oct–Nov picking.
  {
    key: 'manure',
    kinds: ['pomelo'],
    title: "Spread the year's manure under the tree",
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic:
      "All the year's FYM in the basin under the canopy, forked in lightly: 10 kg per year of age, up to 5 years (50 kg)",
    dose: POMELO_FYM,
    why: 'Manure goes in during the winter rest, before spring growth',
    hi: {
      title: 'साल भर की खाद पेड़ के नीचे डालें',
      organic:
        'साल भर की पूरी गोबर की खाद (FYM) छतरी के नीचे थाले में डालें और हल्का गोड़कर मिलाएं: पेड़ की उम्र के हर साल पर 10 kg, 5 साल तक (50 kg)',
      why: 'खाद सर्दी के आराम में डलती है, बसंत की बढ़वार से पहले',
    },
    windows: {
      NORTH: [
        [12, 1],
        [1, 31],
      ],
    },
  },
  {
    key: 'first_feed',
    kinds: ['pomelo'],
    title: 'Give the first feed before flowering',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical: `Half the year's urea in the basin: ${POMELO_UREA_HALF}; water in; wear gloves`,
    why: 'Feeds the spring flush and the flowers',
    hi: {
      title: 'फूल आने से पहले पहली खाद दें',
      chemical: `साल भर के urea का आधा थाले में: ${POMELO_UREA_HALF_HI}; पानी दें; दस्ताने पहनें`,
      why: 'बसंत की नई फुटान और फूलों को खुराक देती है',
    },
    windows: { NORTH: month(2) },
  },
  {
    key: 'second_feed',
    kinds: ['pomelo'],
    title: 'Give the second feed after fruit set',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical: `The other half of the year's urea in the basin: ${POMELO_UREA_HALF}; water in; wear gloves`,
    why: 'Feeds the young fruit',
    hi: {
      title: 'फल बनने के बाद दूसरी खाद दें',
      chemical: `साल भर के urea का बाकी आधा थाले में: ${POMELO_UREA_HALF_HI}; पानी दें; दस्ताने पहनें`,
      why: 'छोटे फलों को खुराक देती है',
    },
    windows: {
      NORTH: [
        [4, 1],
        [5, 31],
      ],
    },
  },
  {
    key: 'summer_water_pomelo',
    kinds: ['pomelo'],
    title: 'Water every 7–10 days through the summer',
    category: 'WATERING',
    stages: ['YOUNG', 'BEARING'],
    organic:
      "Bearing tree: every 7–10 days. Young tree: twice a week. Use a ring basin so water doesn't touch the trunk; don't flood. Keep the basin weed-free",
    why: 'Steady water from flowering to harvest holds the fruit and stops splitting',
    hi: {
      title: 'पूरी गर्मी हर 7–10 दिन पानी दें',
      organic:
        'फल देने वाला पेड़: हर 7–10 दिन। छोटा पेड़: हफ्ते में दो बार। रिंग थाला बनाएं ताकि पानी तने को न छुए; पानी न भरें। थाले में खरपतवार न रहने दें',
      why: 'फूल से फसल तक लगातार पानी से फल टिके रहते हैं और फटते नहीं',
    },
    windows: {
      NORTH: [
        [4, 1],
        [6, 30],
      ],
    },
  },
  {
    key: 'pick_pomelo',
    kinds: ['pomelo'],
    title: 'Pick pomelos when the rind turns bright yellow',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      "Pick at full eating ripeness: the oil glands on the rind grow larger and glossier, and the colour turns from dull to bright yellow. Clip with a short stalk; don't pull. Pick on time: fruit left too long goes dry and grainy inside",
    why: "Pomelo doesn't ripen further once picked",
    hi: {
      title: 'छिलका चमकीला पीला हो तब चकोतरा तोड़ें',
      organic:
        'पूरी तरह खाने लायक पकने पर तोड़ें: छिलके पर तेल की ग्रंथियां बड़ी और ज़्यादा चमकदार हो जाती हैं, और रंग फीके से चमकीला पीला हो जाता है। छोटी डंठल के साथ काटें; खींचें नहीं। समय पर तोड़ें: ज़्यादा देर छोड़ा फल अंदर से सूखा और दानेदार हो जाता है',
      why: 'चकोतरा तोड़ने के बाद और नहीं पकता',
    },
    windows: {
      NORTH: [
        [10, 1],
        [11, 30],
      ],
    },
  },
  // Shown on the plant page when the gardener sees the problem; never reminders.
  {
    key: 'gummosis',
    title: 'Treat gum oozing from the trunk',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Gum oozing from the trunk base, cracked bark, pale leaves',
    organic: `Keep water off the trunk with a ring basin; don't flood or hoe deep; scrape the lesion clean and cover it with ${BORDEAUX_PASTE}`,
    chemical:
      'Cymoxanil 8% + mancozeb 64% WP: drench 2.5 g per litre, 10 L per tree, or paint the lesion with 25 g per litre of linseed oil; wear gloves; not within 82 days of picking',
    why: 'A soil fungus rots the bark at the collar',
    hi: {
      title: 'तने से निकलते गोंद का इलाज करें',
      organic: `रिंग थाले से पानी तने से दूर रखें; पानी न भरें, गहरी गुड़ाई न करें; घाव को खुरचकर साफ़ करें और उस पर ${BORDEAUX_PASTE_HI}`,
      chemical:
        'Cymoxanil 8% + mancozeb 64% WP: 2.5 g प्रति लीटर का घोल, 10 L प्रति पेड़ जड़ में डालें, या 25 g प्रति लीटर linseed oil में मिलाकर घाव पर लगाएं; दस्ताने पहनें; तोड़ने से 82 दिन पहले तक नहीं',
      why: 'मिट्टी की फफूंद तने के निचले हिस्से (कॉलर) की छाल सड़ा देती है',
      conditional: 'तने के निचले हिस्से से गोंद निकलना, फटी छाल, फीकी पत्तियां',
    },
    windows: {
      NORTH: [
        [
          [2, 1],
          [3, 31],
        ],
        [
          [7, 1],
          [8, 31],
        ],
      ],
    },
  },
  {
    key: 'zinc_manganese',
    title: 'Spray zinc and manganese on the leaves',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Mottled leaves, or small narrow "little leaf"',
    organic: '',
    chemical:
      'Zinc sulphate 4.7 g + manganese sulphate 3.3 g per litre on fully grown flush leaves; keep a week from any Bordeaux spray; a fertiliser, so no waiting days; wear gloves',
    why: 'Corrects a zinc and manganese shortage',
    hi: {
      title: 'पत्तियों पर zinc और manganese स्प्रे करें',
      chemical:
        'Zinc sulphate 4.7 g + manganese sulphate 3.3 g प्रति लीटर, पूरी बढ़ चुकी नई पत्तियों पर; किसी भी Bordeaux स्प्रे से एक हफ्ते का फ़ासला रखें; यह खाद है, इसलिए तोड़ने से पहले रुकने की ज़रूरत नहीं; दस्ताने पहनें',
      why: 'zinc और manganese की कमी पूरी करता है',
      conditional: 'चितकबरी पत्तियां, या छोटी पतली पत्तियां ("little leaf")',
    },
    windows: { NORTH: [month(4, 20), month(8, 10, 20)] },
  },
  {
    key: 'bark_caterpillar',
    title: 'Clear bark-eating caterpillars',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Webbing and chewed bark on the trunk',
    organic: 'Pull off the webbing and push kerosene into the holes',
    why: 'The caterpillar tunnels into the bark',
    hi: {
      title: 'छाल खाने वाली इल्लियां हटाएं',
      organic: 'जाला हटा दें और छेदों में मिट्टी का तेल (kerosene) डालें',
      why: 'इल्ली छाल में सुरंग बनाती है',
      conditional: 'तने पर जाला और कुतरी हुई छाल',
    },
    windows: {
      NORTH: [
        [
          [9, 1],
          [10, 31],
        ],
        [
          [1, 1],
          [2, 29],
        ],
      ],
    },
  },
  {
    key: 'mites',
    title: 'Spray against mites',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fine specks and dusty-looking leaves',
    organic: '',
    chemical:
      'Diafenthiuron 50 WP 2 g per litre; wear gloves; not within 30 days of picking',
    why: 'Mites suck the leaves pale',
    hi: {
      title: 'माइट के लिए स्प्रे करें',
      chemical:
        'Diafenthiuron 50 WP 2 g प्रति लीटर; दस्ताने पहनें; तोड़ने से 30 दिन पहले तक नहीं',
      why: 'माइट पत्तियों का रस चूसकर उन्हें फीका कर देते हैं',
      conditional: 'बारीक चित्तियां और धूल भरी दिखती पत्तियां',
    },
    windows: {
      NORTH: [
        [
          [5, 1],
          [6, 30],
        ],
        [
          [8, 1],
          [9, 30],
        ],
      ],
    },
  },
  {
    key: 'mealybug',
    title: 'Clear mealybugs',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'White cottony clusters on shoots and fruit',
    organic:
      'Keep branches off the ground, prune and destroy infested shoots, destroy ant nests; or spray Verticillium lecanii 1.15% WP about 4.5 g per litre; wear gloves',
    why: 'Mealybugs suck sap and bring sooty mould',
    hi: {
      title: 'मिलीबग हटाएं',
      organic:
        'डालियां ज़मीन से ऊपर रखें, कीड़े लगी टहनियां काटकर नष्ट करें, चींटियों के घोंसले नष्ट करें; या Verticillium lecanii 1.15% WP लगभग 4.5 g प्रति लीटर स्प्रे करें; दस्ताने पहनें',
      why: 'मिलीबग रस चूसते हैं और काली फफूंद (sooty mould) लाते हैं',
      conditional: 'टहनियों और फलों पर सफ़ेद रुई जैसे गुच्छे',
    },
    windows: {
      NORTH: [
        [7, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'canker_spots',
    kinds: ['lemon', 'mandarin', 'sweet_orange', 'pomelo'],
    title: 'Cut out canker spots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Corky raised spots on leaves, twigs or fruit',
    organic: 'Cut out and burn spotted twigs before the monsoon',
    chemical: `If it spreads: ${SPOTS_CHEMICAL}`,
    why: 'Canker spreads in rain and through leaf miner tunnels',
    // "Before the monsoon"
    hi: {
      title: 'कैंकर के धब्बे काट दें',
      organic: 'बरसात से पहले धब्बों वाली टहनियां काटकर जला दें',
      chemical: `फैले तो: ${SPOTS_CHEMICAL_HI}`,
      why: 'कैंकर बारिश में और लीफ माइनर की सुरंगों से फैलता है',
      conditional: 'पत्तियों, टहनियों या फलों पर कॉर्क जैसे उभरे धब्बे',
    },
    windows: {
      NORTH: [
        [5, 1],
        [6, 30],
      ],
    },
  },
  {
    key: 'fruit_drop',
    title: 'Cut down fruit drop',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Fruit dropping before it ripens',
    organic:
      'Destroy dried fruit left on the tree, bury fallen fruit deep, prune and feed on schedule, and keep water from standing in the basin',
    why: 'Disease and water stress cause most fruit drop',
    hi: {
      title: 'फल गिरना कम करें',
      organic:
        'पेड़ पर बचे सूखे फल नष्ट करें, गिरे फल गहरा गाड़ दें, समय पर छंटाई करें और खाद दें, और थाले में पानी रुकने न दें',
      why: 'ज़्यादातर फल रोग और पानी की तंगी से गिरते हैं',
      conditional: 'पकने से पहले फल गिरना',
    },
    windows: { NORTH: ALL_YEAR },
  },
  {
    key: 'fruit_fly_trap',
    kinds: ['mandarin', 'sweet_orange'],
    title: 'Hang a fruit fly trap',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fruit with sting marks, rotting at colour break',
    organic:
      'Hang a PAU fruit fly trap 1–1.5 m up in shade until picking; recharge it if fresh damage appears. PAU says traps work less well in home gardens than in orchards',
    why: 'Flies sting fruit at colour break; the fruit rots and drops',
    // Second week of August until picking (Valencia, the last, in March)
    hi: {
      title: 'फल मक्खी का ट्रैप टांगें',
      organic:
        'PAU fruit fly trap 1–1.5 m ऊंचाई पर छांव में फल तोड़ने तक टांगें; नया नुकसान दिखे तो उसे फिर से भरें (recharge)। PAU के अनुसार घर के बगीचों में ट्रैप बागों जितना असर नहीं करते',
      why: 'रंग बदलते समय मक्खियां फल पर डंक मारती हैं; फल सड़कर गिर जाता है',
      conditional: 'डंक के निशान वाले फल, जो रंग बदलते समय सड़ रहे हों',
    },
    windows: {
      NORTH: [
        [8, 8],
        [3, 31],
      ],
    },
  },
  {
    key: 'young_water',
    title: 'Water a young tree every week',
    category: 'WATERING',
    stages: ['YOUNG'],
    conditional: 'A young tree, up to 3–4 years old',
    organic: 'Water every week into a ring basin, off the trunk',
    why: 'Young roots dry out fast',
    hi: {
      title: 'छोटे पेड़ को हर हफ्ते पानी दें',
      organic: 'हर हफ्ते रिंग थाले में पानी दें, तने से दूर',
      why: 'छोटी जड़ें जल्दी सूखती हैं',
      conditional: 'छोटा पेड़, 3–4 साल तक का',
    },
    windows: { NORTH: ALL_YEAR },
  },
  {
    key: 'fruit_fly_trap',
    kinds: ['pomelo'],
    title: 'Hang a fruit fly trap',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fruit with sting marks, rotting at colour break',
    organic:
      'Hang a PAU fruit fly trap 1–1.5 m up in shade until picking; recharge it if fresh damage appears. PAU says traps work less well in home gardens than in orchards',
    why: 'Flies sting fruit at colour break; the fruit rots and drops',
    // Second week of August until picking (pomelo, by November)
    hi: {
      title: 'फल मक्खी का ट्रैप टांगें',
      organic:
        'PAU fruit fly trap 1–1.5 m ऊंचाई पर छांव में फल तोड़ने तक टांगें; नया नुकसान दिखे तो उसे फिर से भरें (recharge)। PAU के अनुसार घर के बगीचों में ट्रैप बागों जितना असर नहीं करते',
      why: 'रंग बदलते समय मक्खियां फल पर डंक मारती हैं; फल सड़कर गिर जाता है',
      conditional: 'डंक के निशान वाले फल, जो रंग बदलते समय सड़ रहे हों',
    },
    windows: {
      NORTH: [
        [8, 8],
        [11, 30],
      ],
    },
  },
  {
    key: 'fruit_split',
    kinds: ['pomelo'],
    title: 'Water evenly to stop pomelo fruit splitting',
    category: 'WATERING',
    stages: ['BEARING'],
    conditional:
      'Fruit cracking lengthwise near the bottom end, juice sacs showing',
    organic:
      'Water evenly from flowering to harvest; never let the basin dry hard and then flood it. Mulch the basin',
    chemical:
      'Boric acid 1 g per litre (0.1%) on the leaves; a fertiliser, so no waiting days; wear gloves',
    why: 'Uneven water splits the rind as the fruit swells',
    hi: {
      title: 'चकोतरे का फल फटने से रोकने के लिए बराबर पानी दें',
      organic:
        'फूल से फसल तक बराबर पानी दें; थाले को कभी सूखकर सख़्त न होने दें और फिर उसमें पानी न भरें। थाले में मल्च बिछाएं',
      chemical:
        'Boric acid 1 g प्रति लीटर (0.1%) पत्तियों पर; यह खाद है, इसलिए तोड़ने से पहले रुकने की ज़रूरत नहीं; दस्ताने पहनें',
      why: 'फल बढ़ते समय असमान पानी से छिलका फट जाता है',
      conditional: 'नीचे के सिरे के पास फल लंबाई में फटना, रस की थैलियां दिखना',
    },
    windows: { NORTH: ALL_YEAR },
  },
  {
    key: 'greening',
    kinds: ['pomelo'],
    title: 'Remove a tree with citrus greening',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'New leaves yellow and blotchy, fruit small, lopsided and staying green, with insipid juice',
    organic:
      'Remove and destroy the infected tree. Replant only with disease-free nursery plants, and keep psylla down',
    why: 'No spray cures greening; a sick tree spreads it',
    hi: {
      title: 'सिट्रस ग्रीनिंग वाला पेड़ हटा दें',
      organic:
        'रोगी पेड़ उखाड़कर नष्ट करें। दोबारा सिर्फ़ रोग-मुक्त नर्सरी पौधे लगाएं, और सिल्ला को काबू में रखें',
      why: 'कोई स्प्रे ग्रीनिंग ठीक नहीं करता; बीमार पेड़ इसे फैलाता है',
      conditional:
        'नई पत्तियां पीली और धब्बेदार, फल छोटे, टेढ़े और हरे ही रहें, रस फीका',
    },
    windows: { NORTH: ALL_YEAR },
  },
];

const SOUTH_LIME_ITEMS: Item[] = [
  {
    key: 'main_feed',
    title: 'Feed manure, P, K and half the nitrogen',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic:
      "The year's FYM (10 kg in year 1, 5 kg more each year, 30 kg from year 6) with Pseudomonas 20 g and VAM 200 g, mixed into the basin",
    chemical:
      "All the year's P and K and half the N in the basin (N 200 g in year 1, +100 g a year, 600 g from year 6; P₂O₅ 100 g, +25 g, 200 g; K₂O 100 g, +40 g, 300 g); water in; wear gloves",
    why: 'The main feed, after the monsoon flush',
    hi: {
      title: 'खाद, P, K और आधी नाइट्रोजन दें',
      organic:
        'साल भर की गोबर की खाद (पहले साल 10 kg, हर साल 5 kg ज़्यादा, 6वें साल से 30 kg) के साथ Pseudomonas 20 g और VAM 200 g, थाले में मिलाएं',
      chemical:
        'साल भर का पूरा P और K और आधा N थाले में (N पहले साल 200 g, हर साल +100 g, 6वें साल से 600 g; P₂O₅ 100 g, +25 g, 200 g; K₂O 100 g, +40 g, 300 g); पानी दें; दस्ताने पहनें',
      why: 'मुख्य खाद, बरसात की नई फुटान के बाद',
    },
    windows: { SOUTH: month(10) },
  },
  {
    key: 'second_feed',
    title: 'Give the second half of the nitrogen',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "The other half of the year's N in the basin; water in; wear gloves",
    why: 'Feeds the spring flush',
    hi: {
      title: 'बाकी आधी नाइट्रोजन दें',
      chemical: 'साल भर के N का बाकी आधा थाले में; पानी दें; दस्ताने पहनें',
      why: 'बसंत की नई फुटान को खुराक देती है',
    },
    windows: { SOUTH: month(3) },
  },
  {
    key: 'zinc_spray',
    title: 'Spray zinc on the new flush',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      'Zinc sulphate 5 g per litre (0.5%) once the new flush has opened; a fertiliser, so no waiting days; wear gloves',
    why: 'Prevents little leaf and twig die-back',
    hi: {
      title: 'नई फुटान पर zinc स्प्रे करें',
      chemical:
        'Zinc sulphate 5 g प्रति लीटर (0.5%), जब नई फुटान खुल जाए; यह खाद है, इसलिए तोड़ने से पहले रुकने की ज़रूरत नहीं; दस्ताने पहनें',
      why: 'छोटी पत्ती (little leaf) और टहनियों का सूखना रोकता है',
    },
    windows: { SOUTH: [month(3), month(7), month(10)] },
  },
  {
    key: 'psylla',
    title: 'Spray against citrus psylla',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Curled new shoots with psylla nymphs',
    organic: 'Pinch off and destroy curled new shoots carrying nymphs',
    chemical: PSYLLA_CHEMICAL,
    why: 'Psylla sucks the new shoots and spreads greening disease',
    hi: {
      title: 'सिट्रस सिल्ला के लिए स्प्रे करें',
      organic:
        'मुड़ी हुई नई टहनियां, जिन पर शिशु (nymph) हों, तोड़कर नष्ट करें',
      chemical: PSYLLA_CHEMICAL_HI,
      why: 'सिल्ला नई टहनियों का रस चूसता है और ग्रीनिंग रोग फैलाता है',
      conditional: 'मुड़ी हुई नई टहनियां, जिन पर सिल्ला के शिशु हों',
    },
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'leaf_miner',
    title: 'Spray for leaf miner',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Silvery tunnels in young leaves',
    organic: 'Pick off and burn leaves with silvery tunnels',
    chemical: LEAF_MINER_CHEMICAL,
    why: 'Tunnels curl young leaves and open the way for canker',
    hi: {
      title: 'लीफ माइनर के लिए स्प्रे करें',
      organic: 'चांदी जैसी सुरंगों वाली पत्तियां तोड़कर जला दें',
      chemical: LEAF_MINER_CHEMICAL_HI,
      why: 'सुरंगों से नई पत्तियां मुड़ जाती हैं और कैंकर का रास्ता खुलता है',
      conditional: 'नई पत्तियों में चांदी जैसी सुरंगें',
    },
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'rust_mite',
    title: 'Spray against rust mite',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Rusty, bronzed fruit skin',
    organic: '',
    chemical:
      'Diafenthiuron 50 WP 2 g per litre; wear gloves; not within 30 days of picking',
    why: 'Mites scar the fruit skin',
    hi: {
      title: 'रस्ट माइट के लिए स्प्रे करें',
      chemical:
        'Diafenthiuron 50 WP 2 g प्रति लीटर; दस्ताने पहनें; तोड़ने से 30 दिन पहले तक नहीं',
      why: 'माइट फल के छिलके पर दाग डालते हैं',
      conditional: 'फल का छिलका जंग जैसा, कांसे के रंग का',
    },
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'mealybug',
    title: 'Clear mealybugs',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'White cottony clusters on shoots and fruit',
    organic:
      'Debark infested branches, tie a 5 cm sticky band on fruiting shoots; or spray Verticillium lecanii 1.15% WP 5 g per litre; wear gloves',
    why: 'Mealybugs suck sap and bring sooty mould',
    hi: {
      title: 'मिलीबग हटाएं',
      organic:
        'कीड़े लगी डालियों की छाल उतारें, फल वाली टहनियों पर 5 cm चिपचिपी पट्टी बांधें; या Verticillium lecanii 1.15% WP 5 g प्रति लीटर स्प्रे करें; दस्ताने पहनें',
      why: 'मिलीबग रस चूसते हैं और काली फफूंद (sooty mould) लाते हैं',
      conditional: 'टहनियों और फलों पर सफ़ेद रुई जैसे गुच्छे',
    },
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'canker',
    title: 'Cut out canker spots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Corky raised spots on leaves, twigs or fruit',
    organic: 'Cut out and burn spotted twigs',
    chemical: SPOTS_CHEMICAL,
    why: 'Canker spreads in rain and through leaf miner tunnels',
    hi: {
      title: 'कैंकर के धब्बे काट दें',
      organic: 'धब्बों वाली टहनियां काटकर जला दें',
      chemical: SPOTS_CHEMICAL_HI,
      why: 'कैंकर बारिश में और लीफ माइनर की सुरंगों से फैलता है',
      conditional: 'पत्तियों, टहनियों या फलों पर कॉर्क जैसे उभरे धब्बे',
    },
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'twig_blight',
    title: 'Cut back dried twigs',
    category: 'PRUNING',
    stages: ['BEARING'],
    conditional: 'Twigs drying back from the tip',
    organic: 'Cut each dried twig back with 2–3 cm of green wood and burn it',
    why: 'Stops the blight spreading down the twig',
    hi: {
      title: 'सूखी टहनियां काट दें',
      organic: 'हर सूखी टहनी को 2–3 cm हरी लकड़ी समेत काटें और जला दें',
      why: 'झुलसा टहनी में नीचे की ओर फैलने से रुकता है',
      conditional: 'सिरे से नीचे की ओर सूखती टहनियां',
    },
    windows: { SOUTH: ALL_YEAR },
  },
  {
    key: 'young_water',
    title: 'Water a young tree regularly',
    category: 'WATERING',
    stages: ['YOUNG'],
    conditional: 'A young tree',
    organic:
      'Water every 8–10 days after the monsoon and every 5–7 days in summer into a ring basin, with no water standing; remove side branches on the main stem up to 45 cm',
    why: 'Young roots dry out fast; a clear stem gives a strong frame',
    hi: {
      title: 'छोटे पेड़ को नियम से पानी दें',
      organic:
        'बरसात के बाद हर 8–10 दिन और गर्मी में हर 5–7 दिन रिंग थाले में पानी दें, पानी रुकने न दें; मुख्य तने पर 45 cm तक की बगल वाली डालियां हटा दें',
      why: 'छोटी जड़ें जल्दी सूखती हैं; साफ़ तने से मज़बूत ढांचा बनता है',
      conditional: 'छोटा पेड़',
    },
    windows: { SOUTH: ALL_YEAR },
  },
];

const SOUTH_SWEET_ORANGE_ITEMS: Item[] = [
  {
    key: 'main_feed',
    title: 'Feed manure, P, K and half the nitrogen',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic:
      "The year's FYM in the basin 70 cm from the trunk, mixed in: 10 kg in year 1, 5 kg more each year, 30 kg from year 6",
    chemical:
      "All the year's P and K and half the N (N 200 g in year 1, +100 g a year, 600 g from year 6; P 100 g, +20 g, 200 g; K 100 g, +40 g, 300 g); water in; wear gloves",
    why: 'The main feed, after the monsoon flush',
    hi: {
      title: 'खाद, P, K और आधी नाइट्रोजन दें',
      organic:
        'साल भर की गोबर की खाद तने से 70 cm दूर थाले में डालकर मिलाएं: पहले साल 10 kg, हर साल 5 kg ज़्यादा, 6वें साल से 30 kg',
      chemical:
        'साल भर का पूरा P और K और आधा N (N पहले साल 200 g, हर साल +100 g, 6वें साल से 600 g; P 100 g, +20 g, 200 g; K 100 g, +40 g, 300 g); पानी दें; दस्ताने पहनें',
      why: 'मुख्य खाद, बरसात की नई फुटान के बाद',
    },
    windows: { SOUTH: month(10) },
  },
  {
    key: 'second_feed',
    title: 'Give the second half of the nitrogen',
    category: 'FEEDING',
    stages: ['YOUNG', 'BEARING'],
    organic: '',
    chemical:
      "The other half of the year's N in the basin; water in; wear gloves",
    why: 'Feeds the spring flush',
    hi: {
      title: 'बाकी आधी नाइट्रोजन दें',
      chemical: 'साल भर के N का बाकी आधा थाले में; पानी दें; दस्ताने पहनें',
      why: 'बसंत की नई फुटान को खुराक देती है',
    },
    windows: { SOUTH: month(3) },
  },
];

const PHASES = (kind: Kind): PhaseSpec<Group>[] => {
  const mandarin = kind === 'mandarin';
  return [
    {
      phase: 'winter_rest',
      hi: {
        avoid: ['बढ़वार के समय भारी छंटाई'],
        watch: ['छाल खाने वाली इल्ली'],
      },
      months: { NORTH: mandarin ? [12, 12] : [12, 1] },
      avoid: ['Heavy pruning in active growth'],
      watch: ['Bark-eating caterpillar'],
    },
    ...(mandarin
      ? [
          {
            phase: 'harvest',
            hi: {
              avoid: ['फल खींचकर तोड़ना', 'ओस में या बारिश के बाद तोड़ना'],
              watch: ['फल गिरना'],
            },
            months: { NORTH: [1, 2] as [number, number] },
            avoid: ['Pulling fruit off', 'Picking in dew or after rain'],
            watch: ['Fruit drop'],
          },
        ]
      : []),
    {
      phase: 'spring_flush_and_flowering',
      hi: {
        avoid: [
          'फुटाव से पहले और फल बनने के बाद पानी की कमी',
          'खुले फूलों पर कीटनाशक',
        ],
        watch: ['सिल्ला', 'माहू (aphid)', 'थ्रिप्स', 'लीफ माइनर'],
      },
      months: { NORTH: mandarin ? [3, 4] : [2, 4] },
      avoid: [
        'Water stress before sprouting and after fruit set',
        'Insecticide on open flowers',
      ],
      watch: ['Psylla', 'Aphids', 'Thrips', 'Leaf miner'],
    },
    {
      phase: 'summer',
      hi: {
        avoid: ['थाला सूखने देना', 'पानी भरकर सिंचाई'],
        watch: ['माइट', 'लीफ माइनर'],
      },
      months: { NORTH: [5, 6] },
      avoid: ['Letting the basin dry out', 'Flood irrigation'],
      watch: ['Mites', 'Leaf miner'],
    },
    {
      phase: 'monsoon',
      hi: {
        avoid: ['थाले में पानी रुकना या तने को छूना'],
        watch: [
          'गोंद रोग (gummosis)',
          'स्कैब और मेलानोज़',
          'मिलीबग',
          'फल मक्खी',
        ],
      },
      months: { NORTH: [7, 9] },
      avoid: ['Water standing in the basin or touching the trunk'],
      watch: ['Gummosis', 'Scab and melanose', 'Mealybug', 'Fruit fly'],
    },
    {
      phase: 'autumn',
      hi: {
        avoid: ['पानी भरकर सिंचाई'],
        watch: kind === 'lime' ? ['लीफ माइनर', 'कैंकर'] : ['लीफ माइनर'],
      },
      months: { NORTH: [10, 11] },
      avoid: ['Flood irrigation'],
      watch: kind === 'lime' ? ['Leaf miner', 'Canker'] : ['Leaf miner'],
    },
  ];
};

/** Pomelo, North India: flowers Mar–Apr, picked Oct–Nov (IH 2026 p.19). */
const POMELO_PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'winter_rest',
    hi: {
      avoid: [
        'ज़्यादा पानी देना; फल देने वाले पेड़ को सर्दी में सिर्फ़ हर 30–40 दिन पानी चाहिए',
      ],
      watch: ['छाल खाने वाली इल्ली'],
    },
    months: { NORTH: [12, 2] },
    avoid: [
      'Heavy watering; a bearing tree needs water only every 30–40 days in winter',
    ],
    watch: ['Bark-eating caterpillar'],
  },
  {
    phase: 'spring_flush_and_flowering',
    hi: {
      avoid: ['फूल आना शुरू होने के बाद पानी की कमी', 'खुले फूलों पर कीटनाशक'],
      watch: ['सिल्ला', 'थ्रिप्स', 'लीफ माइनर'],
    },
    months: { NORTH: [3, 4] },
    avoid: [
      'Water stress once flowering starts',
      'Insecticide on open flowers',
    ],
    watch: ['Psylla', 'Thrips', 'Leaf miner'],
  },
  {
    phase: 'fruit_growth',
    hi: {
      avoid: [
        'थाला सूखने देना, फिर पानी भर देना (फल फटते हैं)',
        'तने के पास पानी रुकना',
      ],
      watch: ['माइट', 'गोंद रोग (gummosis)', 'मिलीबग', 'फल मक्खी'],
    },
    months: { NORTH: [5, 9] },
    avoid: [
      'Letting the basin dry out, then flooding it (splitting)',
      'Water standing at the trunk',
    ],
    watch: ['Mites', 'Gummosis', 'Mealybug', 'Fruit fly'],
  },
  {
    phase: 'harvest',
    hi: {
      avoid: ['पके फल पेड़ पर छोड़े रखना (फांकें सूखी, दानेदार हो जाती हैं)'],
      watch: ['फल मक्खी'],
    },
    months: { NORTH: [10, 11] },
    avoid: ['Leaving ripe fruit on the tree (dry, grainy segments)'],
    watch: ['Fruit fly'],
  },
];

const SOUTH_LIME_PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'year_round_bearing',
    hi: {
      avoid: ['थाले में पानी रुकना या तने को छूना'],
      watch: [
        'हर नई फुटान पर सिल्ला और लीफ माइनर (जून–जुलाई, सितंबर–अक्टूबर, जनवरी–फरवरी)',
        'बारिश में कैंकर',
      ],
    },
    months: { SOUTH: [1, 12] },
    avoid: ['Water standing in the basin or touching the trunk'],
    watch: [
      'Psylla and leaf miner on each new flush (Jun–Jul, Sep–Oct, Jan–Feb)',
      'Canker in the rains',
    ],
  },
];

const north = (kind: Kind): RegionCare =>
  groupCare(
    'NORTH',
    NORTH_ITEMS.filter((i) => !i.kinds || i.kinds.includes(kind)).map(
      ({ kinds: _k, ...item }) => item,
    ),
    kind === 'pomelo' ? POMELO_PHASES : PHASES(kind),
  );
const south = (items: Item[], phases: PhaseSpec<Group>[]): RegionCare =>
  groupCare('SOUTH', items, phases);

const KINDS: CareKind[] = [
  {
    key: 'lime',
    words: [
      'kagzi',
      'kagzi lime',
      'kagzi nimbu',
      'kaghzi',
      'kagji',
      'acid lime',
      'tahiti lime',
      'lime',
      'कागज़ी',
      'कागजी',
    ],
    grownIn: [
      'NORTH_INDIA',
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
    ],
    regions: {
      NORTH_INDIA: north('lime'),
      SOUTH_DECCAN: south(SOUTH_LIME_ITEMS, SOUTH_LIME_PHASES),
    },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
  {
    key: 'lemon',
    words: [
      'baramasi',
      'seedless lemon',
      'galgal',
      'hill lemon',
      'pahadi nimbu',
      'assam lemon',
      'kaji nemu',
      'बारामासी',
      'गलगल',
      'पहाड़ी नींबू',
    ],
    varietyWords: ['eureka'],
    grownIn: [
      'NORTH_INDIA',
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
    regions: { NORTH_INDIA: north('lemon') },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
  {
    key: 'mandarin',
    words: ['kinnow', 'kinnu', 'mandarin', 'murcott', 'किन्नू', 'किन्नो'],
    varietyWords: [
      'nagpur',
      'nagpuri',
      'darjeeling',
      'khasi',
      'coorg',
      'kodai',
      'daisy',
      'नागपुरी',
      'नागपुर',
      'दार्जिलिंग',
      'खासी',
    ],
    grownIn: [
      'NORTH_INDIA',
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'HILLS_COOL',
    ],
    regions: { NORTH_INDIA: north('mandarin') },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
  {
    key: 'sweet_orange',
    words: [
      'mosambi',
      'mausambi',
      'musambi',
      'mosumbi',
      'sweet orange',
      'malta',
      'blood red',
      'blood orange',
      'sathgudi',
      'sathukudi',
      'batavian',
      'sweet lime',
      'मौसंबी',
      'मोसंबी',
      'मुसम्मी',
      'माल्टा',
    ],
    // मौसमी also means "seasonal": only a variety or species saying it counts.
    varietyWords: ['jaffa', 'valencia', 'मौसमी'],
    grownIn: ['NORTH_INDIA', 'WEST_INDIA', 'SOUTH_DECCAN', 'HILLS_COOL'],
    regions: {
      NORTH_INDIA: north('sweet_orange'),
      SOUTH_DECCAN: south(SOUTH_SWEET_ORANGE_ITEMS, []),
    },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
  {
    key: 'pomelo',
    // "batabi lebu" matches through "batabi"; grapefruit (C. paradisi) is a different fruit.
    words: [
      'pomelo',
      'pummelo',
      'shaddock',
      'chakotra',
      'chakotara',
      'chakotha',
      'batabi',
      'चकोतरा',
    ],
    grownIn: ['NORTH_INDIA', 'EAST_INDIA'],
    regions: { NORTH_INDIA: north('pomelo') },
    pendingRegions: [
      'EAST_INDIA',
      'WEST_INDIA',
      'CENTRAL_INDIA',
      'SOUTH_DECCAN',
      'COASTAL_HUMID',
      'HILLS_COOL',
    ],
  },
];

export const CITRUS_CARE: FamilyCare = {
  family: 'citrus',
  sources: [
    'PAU Package of Practices for Cultivation of Fruit Crops (citrus pp.13–34), pau.edu',
    'Shivam et al., "Pummelo: A future fruit for human health and wellness", Indian Horticulture (ICAR), Mar–Apr 2026, epubs.icar.org.in',
    'TNAU Crop Production Guide, Horticulture Crops 2020 (acid lime, sweet orange), agritech.tnau.ac.in',
    'NIPHM AESA based IPM package, Citrus, niphm.gov.in',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  // All of citrus care is in its kinds; a tree of no known kind keeps the season pack.
  grownIn: [],
  regions: {},
  kinds: KINDS,
  // Different plants that share the word "lime": no acid-lime care for them.
  noKindWords: ['kaffir', 'makrut'],
};
