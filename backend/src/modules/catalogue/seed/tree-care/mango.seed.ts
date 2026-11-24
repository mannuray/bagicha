import { ALL_YEAR, groupCare, type ItemSpec, type PhaseSpec } from './build';
import type { Dose, FamilyCare, RegionCare } from '../../domain/tree-care';

/**
 * Mango care, transcribed from the source-checked table approved on 2026-11-12
 * (docs/plant-care/mango.md, with a source for every row). Change it only
 * through the add-plant playbook: source check, then the owner's yes.
 *
 * Timing groups: A = North + East (same flowering Feb–Mar, harvest Jun–Aug);
 * CENTRAL; WEST (as Central but no frost — Gujarat frost unverified); SOUTH =
 * South Deccan; COAST = Coastal humid (from Konkan and coastal AP/TN sources;
 * Kerala's earlier season unverified).
 */
type Group = 'A' | 'CENTRAL' | 'WEST' | 'SOUTH' | 'COAST';

/** NHB-7: per year of age, up to 10 years; FYM once a year, NPK in two halves. */
const MAIN_FEED_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 5000 }],
  chemical: [
    { what: 'urea', grams: 110 },
    { what: 'SSP', grams: 155 },
    { what: 'MOP', grams: 85 },
  ],
  maxAgeYears: 10,
};
const SECOND_FEED_DOSE: Dose = { ...MAIN_FEED_DOSE, organic: [] };

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'prune_after_harvest',
    title: 'Prune dead and crossing branches',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut dead, diseased and inward branches; seal big cuts with Bordeaux paste (1 kg copper sulphate + 1 kg lime in 10 L water)',
    why: 'Light into the canopy: less disease, better flowering',
    hi: {
      title: 'सूखी और आपस में फंसी डालियां काटें',
      organic:
        'सूखी, रोगी और अंदर की ओर बढ़ती डालियां काटें; बड़े कटों पर Bordeaux पेस्ट (1 kg copper sulphate + 1 kg चूना, 10 L पानी में) लगाएं',
      why: 'छतरी में रोशनी: रोग कम, फूल अच्छे',
    },
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
      CENTRAL: [
        [6, 15],
        [7, 31],
      ],
      WEST: [
        [6, 15],
        [7, 31],
      ],
      SOUTH: [
        [6, 1],
        [7, 15],
      ],
      COAST: [
        [5, 20],
        [6, 20],
      ],
    },
  },
  {
    key: 'main_feed',
    title: 'Main feed after harvest',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      "All the year's FYM in a ring under the canopy edge, mixed into the soil",
    chemical:
      "Half the year's urea + SSP + MOP in the same ring, then water in; wear gloves",
    dose: MAIN_FEED_DOSE,
    why: 'Recovery after fruiting; builds next season’s shoots',
    hi: {
      title: 'तुड़ाई के बाद मुख्य खाद दें',
      organic:
        'साल की पूरी गोबर की खाद (FYM) छतरी के किनारे के नीचे घेरे में डालें, मिट्टी में मिला दें',
      chemical:
        'साल का आधा urea + SSP + MOP उसी घेरे में डालें, फिर पानी दें; दस्ताने पहनें',
      why: 'फल देने के बाद पेड़ संभलता है; अगले सीज़न की टहनियां बनती हैं',
    },
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
      CENTRAL: [
        [6, 20],
        [7, 31],
      ],
      WEST: [
        [6, 20],
        [7, 31],
      ],
      SOUTH: [
        [6, 15],
        [7, 31],
      ],
      COAST: [
        [5, 20],
        [6, 30],
      ],
    },
  },
  {
    key: 'second_feed',
    title: 'Second feed',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: "None now: all the year's FYM went in with the main feed",
    chemical:
      'Other half of urea + SSP + MOP in the ring; water in if there is no rain; wear gloves',
    dose: SECOND_FEED_DOSE,
    why: 'Last feed before the dry spell that brings flowers',
    hi: {
      title: 'दूसरी खाद दें',
      organic:
        'अभी कुछ नहीं: साल की पूरी गोबर की खाद मुख्य खाद के साथ जा चुकी है',
      chemical:
        'बाकी आधा urea + SSP + MOP घेरे में डालें; बारिश न हो तो पानी दें; दस्ताने पहनें',
      why: 'फूल लाने वाले सूखे समय से पहले की आखिरी खाद',
    },
    windows: {
      A: [
        [9, 15],
        [10, 15],
      ],
      CENTRAL: [
        [9, 1],
        [9, 30],
      ],
      WEST: [
        [9, 1],
        [9, 30],
      ],
      SOUTH: [
        [9, 1],
        [9, 30],
      ],
      COAST: [
        [8, 15],
        [9, 30],
      ],
    },
  },
  {
    key: 'hold_water',
    title: 'Hold back water before flowering',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      "Don't water bearing trees now (young trees still need water); in coastal areas the rains usually cover this",
    why: 'A dry spell makes the tree flower; water now gives leaves, not flowers',
    hi: {
      title: 'फूल आने से पहले पानी रोक दें',
      organic:
        'फल देने वाले पेड़ों को अभी पानी न दें (छोटे पेड़ों को अब भी पानी चाहिए); तटीय इलाकों में आमतौर पर बारिश से यह हो जाता है',
      why: 'सूखा समय पेड़ में फूल लाता है; अभी पानी देने से पत्ते आते हैं, फूल नहीं',
    },
    windows: {
      A: [
        [10, 15],
        [1, 15],
      ],
      CENTRAL: [
        [10, 1],
        [12, 15],
      ],
      WEST: [
        [10, 1],
        [12, 15],
      ],
      SOUTH: [
        [10, 1],
        [11, 30],
      ],
      COAST: [
        [9, 15],
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
      'Dig the soil around the trunk; by mid-December tie a 20–25 cm wide polythene band (400 gauge) 30–50 cm up, with grease or mud on its lower edge; wipe it through Jan–Feb',
    chemical:
      'If young bugs still climb: spirotetramat + imidacloprid 11.01% SC 0.75 ml per litre; wear gloves; not within 15 days of picking',
    why: 'Stops mealybugs reaching the flowers in Jan–Feb',
    hi: {
      title: 'मिलीबग से बचाने के लिए तने पर पट्टी बांधें',
      organic:
        'तने के आसपास मिट्टी खोदें; दिसंबर के बीच तक 30–50 cm ऊंचाई पर 20–25 cm चौड़ी पॉलीथीन पट्टी (400 gauge) बांधें, उसके निचले किनारे पर ग्रीस या मिट्टी लगाएं; जनवरी–फरवरी में इसे पोंछते रहें',
      chemical:
        'अगर छोटे कीड़े फिर भी चढ़ें: spirotetramat + imidacloprid 11.01% SC 0.75 ml प्रति लीटर; दस्ताने पहनें; तोड़ने से 15 दिन पहले तक नहीं',
      why: 'जनवरी–फरवरी में मिलीबग फूलों तक नहीं पहुंच पाते',
    },
    windows: {
      A: [
        [11, 15],
        [12, 15],
      ],
    },
  },
  {
    key: 'hopper_spray',
    title: 'Spray for hoppers as flowers appear',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Azadirachtin 3000 ppm, 2 ml per litre (or 1500 ppm, 4 ml) when flower stalks appear',
    chemical:
      'Imidacloprid 17.8 SL 0.3 ml per litre; wear gloves; not within 45 days of picking',
    why: 'Hoppers suck the new flower stalks. Never spray in full bloom (bees)',
    hi: {
      title: 'फूल निकलते ही हॉपर के लिए स्प्रे करें',
      organic:
        'फूलों की डंडियां निकलने पर Azadirachtin 3000 ppm, 2 ml प्रति लीटर (या 1500 ppm, 4 ml)',
      chemical:
        'Imidacloprid 17.8 SL 0.3 ml प्रति लीटर; दस्ताने पहनें; तोड़ने से 45 दिन पहले तक नहीं',
      why: 'हॉपर नई फूल डंडियों का रस चूसते हैं। पूरे फूल खिले हों तब कभी स्प्रे न करें (मधुमक्खियां)',
    },
    windows: {
      A: [
        [2, 10],
        [3, 10],
      ],
      CENTRAL: [
        [1, 10],
        [2, 10],
      ],
      WEST: [
        [1, 10],
        [2, 10],
      ],
      SOUTH: [
        [12, 15],
        [1, 31],
      ],
      COAST: [
        [11, 20],
        [12, 31],
      ],
    },
  },
  {
    key: 'mildew_spray',
    title: 'Spray against powdery mildew',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Wettable sulphur 2–3 g per litre when flower stalks are 3–4 inches long; repeat after 15–20 days',
    chemical:
      'Hexaconazole 5 EC 1 ml per litre; wear gloves; not within 30 days of picking',
    why: 'White powder on the flowers makes them drop',
    hi: {
      title: 'पाउडरी मिल्ड्यू के लिए स्प्रे करें',
      organic:
        'फूल डंडियां 3–4 inch लंबी होने पर Wettable sulphur 2–3 g प्रति लीटर; 15–20 दिन बाद दोहराएं',
      chemical:
        'Hexaconazole 5 EC 1 ml प्रति लीटर; दस्ताने पहनें; तोड़ने से 30 दिन पहले तक नहीं',
      why: 'फूलों पर सफेद पाउडर से वे झड़ जाते हैं',
    },
    windows: {
      A: [
        [2, 10],
        [3, 10],
      ],
      CENTRAL: [
        [1, 10],
        [2, 10],
      ],
      WEST: [
        [1, 10],
        [2, 10],
      ],
      SOUTH: [
        [12, 15],
        [1, 31],
      ],
      COAST: [
        [11, 20],
        [12, 31],
      ],
    },
  },
  {
    key: 'water_after_set',
    title: 'Water every 10–15 days after fruit set',
    category: 'WATERING',
    stages: ['BEARING'],
    organic: 'Water deeply from pea-size fruit until harvest',
    why: 'Steady water stops fruit drop and grows bigger fruit',
    hi: {
      title: 'फल बनने के बाद हर 10–15 दिन पानी दें',
      organic: 'मटर जितने फल से लेकर तुड़ाई तक गहरा पानी दें',
      why: 'लगातार पानी से फल नहीं झड़ते और बड़े होते हैं',
    },
    windows: {
      A: [
        [3, 20],
        [4, 10],
      ],
      CENTRAL: [
        [2, 20],
        [3, 15],
      ],
      WEST: [
        [2, 20],
        [3, 15],
      ],
      SOUTH: [
        [2, 1],
        [2, 28],
      ],
      COAST: [
        [1, 10],
        [1, 31],
      ],
    },
  },
  {
    key: 'fruit_fly_trap',
    title: 'Hang a fruit fly trap, pick fallen fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      '1 methyl eugenol trap per tree at mid-canopy, lure changed every 2–3 weeks; bury fallen fruit',
    why: 'Fruit fly maggots spoil ripe fruit; the trap catches the males',
    hi: {
      title: 'फल मक्खी ट्रैप टांगें, गिरे फल उठाएं',
      organic:
        'हर पेड़ पर छतरी के बीच में 1 methyl eugenol ट्रैप, lure हर 2–3 हफ्ते में बदलें; गिरे फल गाड़ दें',
      why: 'फल मक्खी के कीड़े पके फल खराब करते हैं; ट्रैप नर मक्खियों को पकड़ता है',
    },
    windows: {
      A: [
        [5, 1],
        [8, 15],
      ],
      CENTRAL: [
        [4, 1],
        [6, 15],
      ],
      WEST: [
        [4, 1],
        [6, 15],
      ],
      SOUTH: [
        [3, 15],
        [7, 15],
      ],
      COAST: [
        [2, 15],
        [5, 15],
      ],
    },
  },
  {
    key: 'copper_spray',
    title: 'Spray copper after the monsoon flush',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Copper oxychloride 50 WG 2.4 g per litre on the new leaves (allowed in organic growing)',
    why: 'Stops anthracnose spots on new leaves and flowers',
    hi: {
      title: 'बारिश की नई पत्तियों के बाद कॉपर स्प्रे करें',
      organic:
        'नई पत्तियों पर Copper oxychloride 50 WG 2.4 g प्रति लीटर (जैविक खेती में मान्य)',
      why: 'नई पत्तियों और फूलों पर एंथ्रेक्नोज़ के धब्बे रोकता है',
    },
    windows: {
      SOUTH: [
        [10, 1],
        [10, 31],
      ],
      COAST: [
        [10, 15],
        [11, 15],
      ],
    },
  },
  {
    key: 'pick_with_stalk',
    title: 'Pick fruit with a stalk',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      'Pick with a 10–20 cm stalk; keep fruit stalk-down for a while so the sap drains',
    why: 'Sap burns the skin and spoils the fruit',
    hi: {
      title: 'फल डंठल के साथ तोड़ें',
      organic:
        '10–20 cm डंठल के साथ तोड़ें; फल को कुछ देर डंठल नीचे करके रखें ताकि रस निकल जाए',
      why: 'रस छिलके को जलाकर फल खराब कर देता है',
    },
    windows: {
      A: [
        [6, 10],
        [8, 15],
      ],
      CENTRAL: [
        [5, 1],
        [6, 30],
      ],
      WEST: [
        [5, 1],
        [6, 30],
      ],
      SOUTH: [
        [4, 1],
        [7, 15],
      ],
      COAST: [
        [3, 15],
        [5, 31],
      ],
    },
  },
];

/** Only if you see it: on the plant page, never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'hopper_repeat',
    title: 'Repeat the hopper spray',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'More than 5 hoppers per flower stalk at pea-size fruit',
    organic: 'Repeat the azadirachtin spray',
    chemical:
      'Imidacloprid 17.8 SL 0.3 ml per litre; wear gloves; not within 45 days of picking',
    why: 'A second wave of hoppers can still drop young fruit',
    // Pea-size fruit: the fruit-development months of the approved phase table.
    hi: {
      title: 'हॉपर का स्प्रे दोहराएं',
      organic: 'Azadirachtin स्प्रे दोहराएं',
      chemical:
        'Imidacloprid 17.8 SL 0.3 ml प्रति लीटर; दस्ताने पहनें; तोड़ने से 45 दिन पहले तक नहीं',
      why: 'हॉपर की दूसरी लहर अब भी छोटे फल गिरा सकती है',
      conditional: 'मटर जितने फल के समय हर फूल डंडी पर 5 से ज़्यादा हॉपर',
    },
    windows: {
      A: [
        [4, 1],
        [5, 31],
      ],
      CENTRAL: [
        [3, 1],
        [4, 30],
      ],
      WEST: [
        [3, 1],
        [4, 30],
      ],
      SOUTH: [
        [2, 1],
        [3, 31],
      ],
      COAST: [
        [1, 1],
        [2, 28],
      ],
    },
  },
  {
    key: 'stem_borer',
    title: 'Treat stem borer holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Holes with sawdust on the trunk or branches',
    organic:
      'Hook out the grub with wire, plug the hole with cotton soaked in a little kerosene, seal with mud; cut and burn badly bored branches',
    why: 'Borers hollow the trunk and can kill branches',
    hi: {
      title: 'तना छेदक के छेदों का इलाज करें',
      organic:
        'तार से सुंडी निकालें, थोड़े केरोसिन में भीगी रुई से छेद बंद करें, मिट्टी से सील करें; बहुत छिदी डालियां काटकर जला दें',
      why: 'छेदक तने को खोखला कर देते हैं और डालियां सुखा सकते हैं',
      conditional: 'तने या डालियों पर बुरादे के साथ छेद',
    },
    windows: {
      A: ALL_YEAR,
      CENTRAL: ALL_YEAR,
      WEST: ALL_YEAR,
      SOUTH: ALL_YEAR,
      COAST: ALL_YEAR,
    },
  },
  {
    key: 'malformation',
    title: 'Cut off malformed flower bunches',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Flower bunches that are bunched up and malformed',
    organic: 'Cut them off with 15–20 cm of healthy wood and burn them',
    why: 'Malformed bunches never fruit and spread the problem',
    // Flowering months of the approved phase table.
    hi: {
      title: 'बिगड़े हुए फूलों के गुच्छे काट दें',
      organic: 'उन्हें 15–20 cm स्वस्थ लकड़ी के साथ काटें और जला दें',
      why: 'बिगड़े गुच्छों पर कभी फल नहीं आता और रोग फैलता है',
      conditional: 'फूलों के गुच्छे जो सिकुड़कर गुच्छा बन गए हों और बिगड़े हों',
    },
    windows: {
      A: [
        [2, 1],
        [3, 31],
      ],
      CENTRAL: [
        [1, 1],
        [2, 28],
      ],
      WEST: [
        [1, 1],
        [2, 28],
      ],
      SOUTH: [
        [12, 1],
        [1, 31],
      ],
      COAST: [
        [11, 1],
        [12, 31],
      ],
    },
  },
  {
    key: 'blossom_blight',
    title: 'Spray against blossom blight',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Humid, cloudy weather while the tree is flowering',
    organic: 'No verified organic spray for this; use the alternative below',
    chemical:
      'Azoxystrobin 23 SC 1 ml per litre; wear gloves; not within 5 days of picking',
    why: 'Blight blackens flowers in damp weather',
    hi: {
      title: 'फूल झुलसा (ब्लॉसम ब्लाइट) के लिए स्प्रे करें',
      organic:
        'इसके लिए कोई जांचा हुआ जैविक स्प्रे नहीं है; नीचे दिया विकल्प इस्तेमाल करें',
      chemical:
        'Azoxystrobin 23 SC 1 ml प्रति लीटर; दस्ताने पहनें; तोड़ने से 5 दिन पहले तक नहीं',
      why: 'नम मौसम में झुलसा फूलों को काला कर देता है',
      conditional: 'पेड़ पर फूल आते समय उमस और बादल वाला मौसम',
    },
    windows: {
      // Coastal flowering (Nov–Dec), per the approved phase table.
      COAST: [
        [11, 1],
        [12, 31],
      ],
    },
  },
];

const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: "The year's FYM in a ring 30 cm from the trunk",
    chemical: 'Urea + SSP + MOP in the same ring, then water in; wear gloves',
    dose: MAIN_FEED_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      organic: 'साल की गोबर की खाद (FYM) तने से 30 cm दूर घेरे में डालें',
      chemical:
        'Urea + SSP + MOP उसी घेरे में डालें, फिर पानी दें; दस्ताने पहनें',
      why: 'मज़बूत ढांचे के लिए लगातार बढ़त',
    },
    windows: {
      A: [
        [7, 1],
        [7, 31],
      ],
      CENTRAL: [
        [6, 20],
        [7, 20],
      ],
      WEST: [
        [6, 20],
        [7, 20],
      ],
      SOUTH: [
        [6, 15],
        [7, 15],
      ],
      COAST: [
        [5, 20],
        [6, 30],
      ],
    },
  },
  {
    key: 'feed_young_second',
    title: 'Second feed for the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: "None now: all the year's FYM went in with the first feed",
    chemical: 'Urea + SSP + MOP in the ring, then water in; wear gloves',
    dose: SECOND_FEED_DOSE,
    why: 'Keeps growth steady into the cool months',
    hi: {
      title: 'छोटे पेड़ को दूसरी खाद दें',
      organic:
        'अभी कुछ नहीं: साल की पूरी गोबर की खाद पहली खाद के साथ जा चुकी है',
      chemical: 'Urea + SSP + MOP घेरे में डालें, फिर पानी दें; दस्ताने पहनें',
      why: 'ठंडे महीनों तक बढ़त लगातार बनी रहती है',
    },
    windows: {
      A: [
        [9, 15],
        [10, 15],
      ],
      CENTRAL: [
        [9, 1],
        [9, 30],
      ],
      WEST: [
        [9, 1],
        [9, 30],
      ],
      SOUTH: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'water_young',
    title: 'Water the young tree through the dry months',
    category: 'WATERING',
    stages: ['YOUNG'],
    organic:
      'First year every 2–3 days, years 2–3 every 4–5 days; mulch the basin',
    why: 'Young roots dry out fast',
    hi: {
      title: 'सूखे महीनों में छोटे पेड़ को पानी दें',
      organic:
        'पहले साल हर 2–3 दिन, दूसरे–तीसरे साल हर 4–5 दिन; थाले में मल्च बिछाएं',
      why: 'छोटी जड़ें जल्दी सूख जाती हैं',
    },
    windows: {
      A: [
        [10, 15],
        [6, 20],
      ],
      CENTRAL: [
        [10, 1],
        [6, 15],
      ],
      WEST: [
        [10, 1],
        [6, 15],
      ],
      SOUTH: [
        [10, 1],
        [5, 31],
      ],
      COAST: [
        [12, 1],
        [5, 15],
      ],
    },
  },
  {
    key: 'frost_cover',
    title: 'Cover the young tree on cold nights',
    category: 'PROTECTION',
    stages: ['YOUNG'],
    organic: 'Thatch or wrap it with straw or jute',
    why: 'Frost kills young mango shoots',
    hi: {
      title: 'ठंडी रातों में छोटे पेड़ को ढकें',
      organic: 'छप्पर डालें या पुआल या जूट से लपेट दें',
      why: 'पाला आम की नई टहनियों को मार देता है',
    },
    windows: {
      A: [
        [12, 15],
        [1, 31],
      ],
      CENTRAL: [
        [12, 20],
        [1, 20],
      ],
    },
  },
  {
    key: 'remove_flowers',
    title: 'Pick off all flowers on the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    organic: 'Remove every flower bunch for the first 3–4 years',
    why: 'Fruiting too early stunts the tree',
    hi: {
      title: 'छोटे पेड़ के सारे फूल तोड़ दें',
      organic: 'पहले 3–4 साल हर फूल का गुच्छा हटा दें',
      why: 'बहुत जल्दी फल देने से पेड़ की बढ़त रुक जाती है',
    },
    windows: {
      A: [
        [2, 10],
        [3, 20],
      ],
      CENTRAL: [
        [1, 10],
        [2, 20],
      ],
      WEST: [
        [1, 10],
        [2, 20],
      ],
      SOUTH: [
        [12, 15],
        [2, 10],
      ],
      COAST: [
        [11, 20],
        [1, 10],
      ],
    },
  },
  {
    key: 'shape_young',
    title: 'Shape the young tree to 3–4 main branches',
    category: 'PRUNING',
    stages: ['YOUNG'],
    organic:
      'Clear the trunk to about 75 cm; keep 3–4 branches facing different ways, 20–25 cm apart; remove crossing shoots while pencil-thick',
    why: 'A low, open frame is easy to care for and harvest',
    hi: {
      title: 'छोटे पेड़ को 3–4 मुख्य डालियों का आकार दें',
      organic:
        'लगभग 75 cm तक तना साफ रखें; अलग-अलग दिशा में 3–4 डालियां रखें, 20–25 cm की दूरी पर; आपस में फंसती टहनियां पेंसिल जितनी मोटी रहते ही हटा दें',
      why: 'नीचा, खुला ढांचा देखभाल और तुड़ाई में आसान होता है',
    },
    windows: {
      A: [
        [7, 15],
        [8, 31],
      ],
      CENTRAL: [
        [6, 15],
        [7, 31],
      ],
      WEST: [
        [6, 15],
        [7, 31],
      ],
      SOUTH: [
        [6, 1],
        [7, 15],
      ],
      COAST: [
        [5, 20],
        [6, 20],
      ],
    },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'post_harvest_recovery',
    avoid: ['Heavy pruning after September'],
    watch: ['Leaf spots in the rain', 'Stem borer'],
    hi: {
      avoid: ['सितंबर के बाद भारी छंटाई'],
      watch: ['बारिश में पत्तों पर धब्बे', 'तना छेदक'],
    },
    months: {
      A: [7, 9],
      CENTRAL: [6, 8],
      WEST: [6, 8],
      SOUTH: [6, 8],
      COAST: [6, 8],
    },
  },
  {
    phase: 'pre_flowering',
    avoid: ['Heavy watering', 'Extra nitrogen beyond the schedule'],
    watch: ['Mealybug', 'Shoot gall'],
    hi: {
      avoid: ['ज़्यादा पानी', 'शेड्यूल से ज़्यादा नाइट्रोजन'],
      watch: ['मिलीबग', 'शूट गॉल'],
    },
    months: { A: [10, 1] },
  },
  {
    phase: 'pre_flowering',
    avoid: ['Heavy watering', 'Extra nitrogen beyond the schedule'],
    watch: [],
    hi: { avoid: ['ज़्यादा पानी', 'शेड्यूल से ज़्यादा नाइट्रोजन'], watch: [] },
    months: {
      CENTRAL: [10, 12],
      WEST: [10, 12],
      SOUTH: [10, 11],
      COAST: [9, 10],
    },
  },
  {
    phase: 'flowering',
    avoid: ['Insecticide in full bloom (bees)', 'Heavy watering'],
    watch: ['Hoppers', 'Powdery mildew', 'Malformed flowers'],
    hi: {
      avoid: ['पूरे फूल खिले हों तब कीटनाशक (मधुमक्खियां)', 'ज़्यादा पानी'],
      watch: ['हॉपर', 'पाउडरी मिल्ड्यू', 'बिगड़े हुए फूल'],
    },
    months: {
      A: [2, 3],
      CENTRAL: [1, 2],
      WEST: [1, 2],
      SOUTH: [12, 1],
      COAST: [11, 12],
    },
  },
  {
    phase: 'fruit_development',
    avoid: ['Letting the soil dry out'],
    watch: ['Fruit drop', 'Fruit fly'],
    hi: { avoid: ['मिट्टी को सूखने देना'], watch: ['फल झड़ना', 'फल मक्खी'] },
    months: {
      A: [4, 5],
      CENTRAL: [3, 4],
      WEST: [3, 4],
      SOUTH: [2, 3],
      COAST: [1, 2],
    },
  },
  {
    phase: 'harvest',
    avoid: ['Leaving ripe fruit on the tree'],
    watch: ['Fruit fly', 'Stem-end rot'],
    hi: {
      avoid: ['पके फल पेड़ पर छोड़ देना'],
      watch: ['फल मक्खी', 'डंठल की तरफ से सड़न'],
    },
    months: {
      A: [6, 6],
      CENTRAL: [5, 5],
      WEST: [5, 5],
      SOUTH: [4, 5],
      COAST: [3, 5],
    },
  },
];

const regionCare = (group: Group): RegionCare =>
  // Young trees have no phase table in the approved content: they read as 'growing'.
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const MANGO_CARE: FamilyCare = {
  family: 'mango',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'DPPQS IPM Package of Practices for Mango (2022, CISH-reviewed)',
    'NHM IPM schedule for mango (agritech.tnau.ac.in)',
    'National Horticulture Board mango pages (nhb.gov.in)',
    'PAU Package of Practices for Fruits',
    'TNAU Agritech mango',
    'KAU mango',
  ],
  grownIn: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
  ],
  regions: {
    NORTH_INDIA: regionCare('A'),
    // Same flowering (Feb–Mar) and harvest (Jun–Aug) in the eastern plains.
    EAST_INDIA: { sameAs: 'NORTH_INDIA' },
    CENTRAL_INDIA: regionCare('CENTRAL'),
    WEST_INDIA: regionCare('WEST'),
    SOUTH_DECCAN: regionCare('SOUTH'),
    COASTAL_HUMID: regionCare('COAST'),
  },
};
