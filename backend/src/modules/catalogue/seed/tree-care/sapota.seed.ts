import {
  ALL_YEAR,
  groupCare,
  type ItemSpec,
  type PhaseSpec,
  type Window,
} from './build';
import type { Dose, FamilyCare, RegionCare } from '../../domain/tree-care';

/**
 * Sapota (chikoo) care, transcribed from the source-checked table approved by
 * the owner on 2026-11-12 (docs/plant-care/sapota.md, with a source for every
 * row). Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * Timing groups: W = West (Gujarat, inland Maharashtra, Rajasthan); K = coastal
 * (Konkan, Goa, coastal Karnataka, Kerala, on Konkan dates); S = South Deccan.
 * W and K share the feeding timing (Maharashtra's schedule, tied to monsoon
 * onset), but pest-peak months exist only for South Gujarat, so the bud borer
 * and moth rows are W only. S feeds once, in September–October (TNAU).
 *
 * Dose: FYM 10 kg and urea 435 g per year of age, up to 5 years (TNAU); P and K
 * are a flat mature-tree amount (NHB-6), so they stay as row text. No pesticide
 * has a sapota label claim, so pest rows are organic or cultural only.
 */
type Group = 'W' | 'K' | 'S';

const MAX_AGE = 5;
/** W/K June: all the FYM + half the urea. */
const JUNE_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [{ what: 'urea', grams: 217 }],
  maxAgeYears: MAX_AGE,
};
/** W/K Sep–Oct: the other half of the urea. */
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 217 }],
  maxAgeYears: MAX_AGE,
};
/** S Sep–Oct, one dose: all the FYM + all the urea. */
const S_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [{ what: 'urea', grams: 435 }],
  maxAgeYears: MAX_AGE,
};

const SEP_OCT: Window = [
  [9, 1],
  [10, 31],
];
const DEC_JAN: Window = [
  [12, 1],
  [1, 31],
];

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'monsoon_feed',
    title: 'Feed at the start of the monsoon',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "All the year's FYM, spread under the canopy and mixed into the top 30 cm",
    chemical:
      "Half the year's urea in the same place; for a bearing tree also SSP 1560 g + MOP 415 g; water in; wear gloves",
    dose: JUNE_DOSE,
    why: 'The tree grows and fruits non-stop and needs a lot of food; most feeder roots are in the top 30 cm',
    hi: {
      title: 'मानसून शुरू होते ही खाद दें',
      organic:
        'साल भर की सारी गोबर की खाद, पेड़ के फैलाव के नीचे बिखेरकर ऊपर की 30 cm मिट्टी में मिलाएं',
      chemical:
        'साल भर के urea का आधा उसी जगह; फल देने वाले पेड़ को SSP 1560 g + MOP 415 g भी; पानी दें; दस्ताने पहनें',
      why: 'पेड़ लगातार बढ़ता और फल देता है, इसलिए इसे बहुत खुराक चाहिए; खुराक लेने वाली ज़्यादातर जड़ें ऊपर की 30 cm मिट्टी में होती हैं',
    },
    windows: {
      W: [
        [6, 15],
        [7, 15],
      ],
      K: [
        [6, 1],
        [7, 15],
      ],
    },
  },
  {
    key: 'post_monsoon_feed',
    title: 'Feed after the monsoon',
    category: 'FEEDING',
    stages: ['BEARING'],
    // The table's organic cell is "S only"; the app always shows an organic line.
    organic: "None now: all the year's FYM went in with the monsoon feed",
    chemical:
      'The other half of the urea; for a bearing tree also SSP 1560 g + MOP 415 g. Water in; wear gloves',
    dose: HALF_UREA_DOSE,
    why: 'Last feed before the dry months',
    hi: {
      title: 'मानसून के बाद खाद दें',
      organic:
        'अभी कुछ नहीं: साल भर की सारी गोबर की खाद मानसून वाली खुराक के साथ डल चुकी है',
      chemical:
        'urea का बाकी आधा; फल देने वाले पेड़ को SSP 1560 g + MOP 415 g भी। पानी दें; दस्ताने पहनें',
      why: 'सूखे महीनों से पहले आखिरी खुराक',
    },
    windows: { W: SEP_OCT, K: SEP_OCT },
  },
  {
    key: 'post_monsoon_feed',
    title: 'Feed after the monsoon',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "The whole year's FYM, in a band from 45 cm off the trunk out to the drip line, mixed into the soil",
    chemical:
      "The whole year's urea, same band; for a bearing tree also SSP 3125 g + MOP 833 g. Water in; wear gloves",
    dose: S_DOSE,
    why: 'Last feed before the dry months',
    hi: {
      title: 'मानसून के बाद खाद दें',
      organic:
        'साल भर की पूरी गोबर की खाद, तने से 45 cm दूर से पेड़ के फैलाव के बाहरी किनारे तक पट्टी में, मिट्टी में मिलाकर',
      chemical:
        'साल भर का पूरा urea, उसी पट्टी में; फल देने वाले पेड़ को SSP 3125 g + MOP 833 g भी। पानी दें; दस्ताने पहनें',
      why: 'सूखे महीनों से पहले आखिरी खुराक',
    },
    windows: { S: SEP_OCT },
  },
  {
    key: 'pick_bored_buds',
    title: 'Pick off bored buds and webbed shoots',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Pick and destroy webbed clusters and bored buds (milky tip, droppings on top), caterpillars inside',
    why: 'Bud borer and chiku moth peak in April–June and can kill 20–30% of buds',
    hi: {
      title: 'छेद वाली कलियां और जाले वाली टहनियां तोड़ें',
      organic:
        'जाले वाले गुच्छे और छेद वाली कलियां (सिरा दूधिया, ऊपर बीट) तोड़कर नष्ट करें, अंदर सुंडियां होती हैं',
      why: 'कली छेदक और चीकू मॉथ अप्रैल–जून में सबसे ज़्यादा होते हैं और 20–30% कलियां खत्म कर सकते हैं',
    },
    windows: {
      W: [
        [3, 1],
        [6, 30],
      ],
    },
  },
  {
    key: 'clear_webbed_leaves',
    title: 'Clear webbed leaves on the new flush',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Pull off and destroy fresh webbed leaf clusters with caterpillars, and dried old webs',
    why: "Chiku moth's second peak is on the winter flush and fruit",
    hi: {
      title: 'नई फुटान से जाले वाले पत्ते हटाएं',
      organic:
        'सुंडियों वाले ताज़े जाले वाले पत्तों के गुच्छे और पुराने सूखे जाले खींचकर नष्ट करें',
      why: 'चीकू मॉथ का दूसरा ज़ोर सर्दी की फुटान और फलों पर होता है',
    },
    windows: {
      W: [
        [11, 1],
        [12, 31],
      ],
    },
  },
  {
    key: 'fruit_fly_trap',
    title: 'Hang a fruit fly trap, bag fallen fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      "One methyl eugenol trap per tree, 5–6 ft up. Pick up fallen fruit, tie it in a polythene bag for 4–5 days, then discard. Don't dump it on soil",
    why: 'Maggots rot the ripe fruit; the fly peaks March–July (April–June in South Gujarat)',
    hi: {
      title: 'फल मक्खी ट्रैप लटकाएं, गिरे फल थैली में बंद करें',
      organic:
        'हर पेड़ पर एक methyl eugenol ट्रैप, 5–6 ft ऊंचाई पर। गिरे फल उठाएं, पॉलीथीन की थैली में 4–5 दिन बांधकर रखें, फिर फेंक दें। उन्हें मिट्टी पर न फेंकें',
      why: 'इसके कीड़े पके फल सड़ा देते हैं; मक्खी मार्च–जुलाई में सबसे ज़्यादा होती है (दक्षिण गुजरात में अप्रैल–जून)',
    },
    windows: {
      W: [
        [4, 1],
        [6, 30],
      ],
      K: [
        [3, 1],
        [7, 31],
      ],
      S: [
        [3, 1],
        [7, 31],
      ],
    },
  },
  {
    key: 'thin_branches',
    title: 'Thin crowded and crossing branches',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut out crowded, crossing and low branches, water shoots and any rootstock sprouts',
    why: 'Flowers and fruit form on branches that get the most light and air',
    hi: {
      title: 'भीड़ वाली और आपस में टकराती डालियां छांटें',
      organic:
        'भीड़ वाली, आपस में टकराती और नीचे की डालियां, सीधी ऊपर भागती टहनियां (water shoots) और rootstock से निकले फुटाव काट दें',
      why: 'फूल और फल उन्हीं डालियों पर आते हैं जिन्हें सबसे ज़्यादा धूप और हवा मिलती है',
    },
    windows: { W: DEC_JAN, K: DEC_JAN, S: DEC_JAN },
  },
];

const ALL = { W: ALL_YEAR, K: ALL_YEAR, S: ALL_YEAR };

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'bud_borer_seen',
    title: 'Pick off bored buds and webbed shoots',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional:
      'Webbed leaves, or buds with a hole, a milky tip and droppings (bud borer, chiku moth)',
    // The table's "do row 3", written out with row 3's own words.
    organic:
      'Pick and destroy webbed clusters and bored buds (milky tip, droppings on top), caterpillars inside',
    why: 'Bud borer and chiku moth',
    hi: {
      title: 'छेद वाली कलियां और जाले वाली टहनियां तोड़ें',
      conditional:
        'जाले वाले पत्ते, या कलियों में छेद, दूधिया सिरा और बीट (कली छेदक, चीकू मॉथ)',
      organic:
        'जाले वाले गुच्छे और छेद वाली कलियां (सिरा दूधिया, ऊपर बीट) तोड़कर नष्ट करें, अंदर सुंडियां होती हैं',
      why: 'कली छेदक और चीकू मॉथ',
    },
    windows: { K: ALL_YEAR, S: ALL_YEAR },
  },
  {
    key: 'sooty_mould',
    title: 'Spray starch against sooty mould',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Leaves and fruit get a black coating',
    organic:
      'Boil 1 kg maida or starch in 5 L water, cool, dilute with 20 L water and spray. Not in cloudy weather',
    why: 'Sooty mould, which grows on honeydew from mealybugs and scales',
    hi: {
      title: 'काली फफूंद के लिए स्टार्च स्प्रे करें',
      conditional: 'पत्तों और फलों पर काली परत जम जाती है',
      organic:
        '1 kg मैदा या स्टार्च 5 L पानी में उबालें, ठंडा करें, 20 L पानी मिलाकर पतला करें और स्प्रे करें। बादल वाले मौसम में नहीं',
      why: 'काली फफूंद (sooty mould), जो मिलीबग और स्केल कीटों के चिपचिपे रस पर उगती है',
    },
    windows: ALL,
  },
  {
    key: 'mealybug_scale',
    title: 'Cut off twigs with mealybugs or scales',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'White mealybug colonies under leaves or at fruit stalks, or green scales',
    organic: 'Cut off and destroy the infested twigs',
    why: 'Mealybugs and scales',
    hi: {
      title: 'मिलीबग या स्केल कीट वाली टहनियां काटें',
      conditional:
        'पत्तों के नीचे या फल की डंठल पर सफेद मिलीबग के झुंड, या हरे स्केल कीट',
      organic: 'कीट लगी टहनियां काटकर नष्ट करें',
      why: 'मिलीबग और स्केल कीट',
    },
    windows: ALL,
  },
  {
    key: 'fasciation',
    title: 'Cut off flat, twisted shoots',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Branches turn flat, ridged and twisted at the tip',
    organic: 'Cut off and destroy those shoots',
    why: 'Fasciation',
    hi: {
      title: 'चपटी, मुड़ी हुई टहनियां काटें',
      conditional: 'डालियां सिरे पर चपटी, धारीदार और मुड़ी हुई हो जाती हैं',
      organic: 'ऐसी टहनियां काटकर नष्ट करें',
      why: 'फैसिएशन (टहनियों का चपटा होना)',
    },
    windows: ALL,
  },
  {
    key: 'nutrient_spray',
    title: 'Spray zinc and boron for deficiency signs',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Young leaves show deficiency signs at flowering',
    organic:
      'Spray zinc sulphate 5 g + boric acid 1 g per litre. Wear gloves; it is a nutrient spray, so there is no waiting period',
    why: 'Zinc and boron shortage',
    hi: {
      title: 'कमी के लक्षण दिखें तो zinc और boron स्प्रे करें',
      conditional: 'फूल आने के समय नए पत्तों पर कमी के लक्षण दिखें',
      organic:
        'zinc sulphate 5 g + boric acid 1 g प्रति लीटर स्प्रे करें। दस्ताने पहनें; यह पोषक स्प्रे है, इसलिए कोई इंतज़ार नहीं',
      why: 'zinc और boron की कमी',
    },
    windows: ALL,
  },
  {
    key: 'water_young',
    title: 'Water the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'The soil around a young tree is drying',
    organic:
      'Every 6–7 days in summer, every 8–10 days in winter. Widen the basin as the canopy grows; mulch',
    why: 'Young roots dry out fast',
    hi: {
      title: 'छोटे पेड़ को पानी दें',
      conditional: 'छोटे पेड़ के आसपास की मिट्टी सूख रही है',
      organic:
        'गर्मी में हर 6–7 दिन, सर्दी में हर 8–10 दिन। पेड़ फैलने के साथ थाला बड़ा करें; मल्च बिछाएं',
      why: 'छोटी जड़ें जल्दी सूख जाती हैं',
    },
    windows: ALL,
  },
  {
    key: 'picking',
    title: 'Pick fruit when the scurf turns dull',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional:
      'Brown scurf turning dull yellowish-brown, no green under a scratch',
    organic:
      'Pick when the brown scurf turns dull yellowish-brown, a scratch shows no green, and there is little latex at the stalk. Wash off latex, dry in shade',
    why: 'Fruit picked too early stays poor; picked late, it softens fast',
    hi: {
      title: 'छिलके की भूरी परत फीकी पड़े तो फल तोड़ें',
      conditional:
        'भूरी परत फीकी पीली-भूरी हो रही है, खुरचने पर हरा नहीं दिखता',
      organic:
        'जब भूरी परत फीकी पीली-भूरी हो जाए, खुरचने पर हरा न दिखे और डंठल पर दूध कम निकले तब तोड़ें। दूध धो दें, छांव में सुखाएं',
      why: 'जल्दी तोड़ा फल घटिया ही रहता है; देर से तोड़ें तो जल्दी नरम हो जाता है',
    },
    windows: ALL,
  },
  {
    key: 'heat',
    title: 'Flowers drop above 43°C',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Temperatures above 43°C',
    organic: 'Above 43°C flowers drop',
    why: 'Heat',
    hi: {
      title: '43°C से ऊपर फूल झड़ते हैं',
      conditional: 'तापमान 43°C से ऊपर',
      organic: '43°C से ऊपर फूल झड़ जाते हैं',
      why: 'गर्मी',
    },
    windows: ALL,
  },
  {
    key: 'new_graft',
    title: 'Shade and stake a newly planted graft',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'A newly planted graft',
    organic:
      'Shade it from the sun with grass or a plastic sheet, and keep it staked',
    why: 'Shades the new graft from heat',
    hi: {
      title: 'नई लगी कलम को छाया और सहारा दें',
      conditional: 'नई लगाई गई कलम',
      organic:
        'घास या प्लास्टिक शीट से धूप से छाया करें, और डंडी से बांधकर रखें',
      why: 'नई कलम को गर्मी से छाया मिलती है',
    },
    windows: ALL,
  },
];

const YOUNG_TEXT =
  'FYM and urea per year of age, in a band 45 cm from the trunk out to the drip line';
/** The Sep–Oct feed is urea only: the year's FYM went in with the June feed. */
const YOUNG_UREA_TEXT =
  'Urea per year of age, in a band 45 cm from the trunk out to the drip line';
const YOUNG_TEXT_HI =
  'उम्र के हर साल के हिसाब से गोबर की खाद और urea, तने से 45 cm दूर से पेड़ के फैलाव के बाहरी किनारे तक पट्टी में';
const YOUNG_UREA_TEXT_HI =
  'उम्र के हर साल के हिसाब से urea, तने से 45 cm दूर से पेड़ के फैलाव के बाहरी किनारे तक पट्टी में';

const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young_monsoon',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: JUNE_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      organic: YOUNG_TEXT_HI,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़वार',
    },
    windows: {
      W: [
        [6, 15],
        [7, 15],
      ],
      K: [
        [6, 1],
        [7, 15],
      ],
    },
  },
  {
    key: 'feed_young_post_monsoon',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: '',
    chemical: `${YOUNG_UREA_TEXT}; wear gloves`,
    dose: HALF_UREA_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      chemical: `${YOUNG_UREA_TEXT_HI}; दस्ताने पहनें`,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़वार',
    },
    windows: { W: SEP_OCT, K: SEP_OCT },
  },
  {
    key: 'feed_young_post_monsoon',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: YOUNG_TEXT,
    dose: S_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      organic: YOUNG_TEXT_HI,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़वार',
    },
    windows: { S: SEP_OCT },
  },
  {
    key: 'shape_young',
    title: 'Shape the young tree, remove sprouts',
    category: 'PRUNING',
    stages: ['YOUNG'],
    organic:
      'Remove sprouts from below the graft joint, water shoots, crossing and low branches; thin overcrowding',
    why: 'Thins overcrowding',
    hi: {
      title: 'छोटे पेड़ को आकार दें, फुटाव हटाएं',
      organic:
        'कलम के जोड़ के नीचे से निकले फुटाव, सीधी ऊपर भागती टहनियां, आपस में टकराती और नीचे की डालियां हटाएं; भीड़ कम करें',
      why: 'भीड़ कम होती है',
    },
    windows: { W: DEC_JAN, K: DEC_JAN, S: DEC_JAN },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'peak_flowering_and_summer_fruit',
    avoid: ['Letting the soil dry out (above 43°C flowers drop)'],
    watch: ['Bud borer', 'Chiku moth on buds', 'Fruit fly (peak Apr–Jun)'],
    hi: {
      avoid: ['मिट्टी सूखने देना (43°C से ऊपर फूल झड़ते हैं)'],
      watch: [
        'कली छेदक',
        'कलियों पर चीकू मॉथ',
        'फल मक्खी (अप्रैल–जून में सबसे ज़्यादा)',
      ],
    },
    months: { W: [3, 6] },
  },
  {
    phase: 'monsoon_growth',
    avoid: ['Waterlogging'],
    watch: ['Leaf miner (rainy season)', 'Leaf spot'],
    hi: {
      avoid: ['पानी भरना'],
      watch: ['लीफ माइनर (बरसात में)', 'पत्तों पर धब्बे'],
    },
    months: { W: [7, 10] },
  },
  {
    phase: 'winter_flush_and_picking',
    avoid: ['Leaving ripe fruit to soften on the tree'],
    watch: ['Chiku moth on the new flush (Nov–Dec)', 'Mealybug', 'Sooty mould'],
    hi: {
      avoid: ['पके फल को पेड़ पर नरम होने देना'],
      watch: ['नई फुटान पर चीकू मॉथ (नवंबर–दिसंबर)', 'मिलीबग', 'काली फफूंद'],
    },
    months: { W: [11, 2] },
  },
  {
    phase: 'year_round_bearing',
    avoid: ['Picking unripe fruit (green under a scratch, much latex)'],
    watch: [
      'Leaf webber',
      'Bud worm',
      'Fruit fly (peak Mar–Jul)',
      'Mealybug',
      'Sooty mould',
    ],
    hi: {
      avoid: ['कच्चे फल तोड़ना (खुरचने पर हरा, बहुत दूध)'],
      watch: [
        'पत्ता जाला कीट',
        'कली की सुंडी',
        'फल मक्खी (मार्च–जुलाई में सबसे ज़्यादा)',
        'मिलीबग',
        'काली फफूंद',
      ],
    },
    months: { K: [1, 12], S: [1, 12] },
  },
];

const regionCare = (group: Group): RegionCare =>
  // Young trees have no phase table in the approved content: they read as 'growing'.
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const SAPOTA_CARE: FamilyCare = {
  family: 'sapota',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'TNAU Agritech sapota',
    'National Horticulture Board sapota pages (nhb.gov.in)',
    'NIPHM/DPPQS AESA-based IPM package for sapota',
    'Navsari Agricultural University sapota pest fact sheets (2022)',
    'Dr BSKKV Dapoli research recommendations (2022)',
  ],
  grownIn: ['WEST_INDIA', 'SOUTH_DECCAN', 'COASTAL_HUMID'],
  regions: {
    WEST_INDIA: regionCare('W'),
    COASTAL_HUMID: regionCare('K'),
    SOUTH_DECCAN: regionCare('S'),
  },
};
