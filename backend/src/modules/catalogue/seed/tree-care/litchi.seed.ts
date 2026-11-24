import {
  ALL_YEAR,
  groupCare,
  type ItemSpec,
  type PhaseSpec,
  type Window,
} from './build';
import type { Dose, FamilyCare, RegionCare } from '../../domain/tree-care';

/**
 * Litchi care, transcribed from the source-checked table approved by the owner
 * on 2026-11-12 (docs/plant-care/litchi.md, with a source for every row).
 * Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * Timing groups: E = East (Bihar timing from NRC Litchi: harvest mid-May to
 * mid-June, feeding after harvest and at clove-size fruit); N = North (Punjab
 * timing from PAU: harvest in June, manure in December, urea in February and
 * April, one watering against frost). They differ by 3–4 weeks and follow
 * different feeding and watering calendars, so they are separate.
 *
 * Doses: NHB-7's annual increase per year of age, up to 10 years (urea 90 g,
 * SSP 100 g, MOP 83 g, FYM 4 kg), split as the table gives it per group.
 * No pesticide has a litchi label claim, so there are no chemical lines.
 */
type Group = 'E' | 'N';

const MAX_AGE = 10;
const E_MAIN_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 60 },
    { what: 'SSP', grams: 100 },
    { what: 'MOP', grams: 55 },
  ],
  maxAgeYears: MAX_AGE,
};
const E_CLOVE_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 30 },
    { what: 'MOP', grams: 28 },
  ],
  maxAgeYears: MAX_AGE,
};
const FYM_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 4000 }],
  chemical: [],
  maxAgeYears: MAX_AGE,
};
/** PAU's single winter dose: FYM, SSP and MOP all go in together. */
const MANURE_SSP_MOP_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 4000 }],
  chemical: [
    { what: 'SSP', grams: 100 },
    { what: 'MOP', grams: 83 },
  ],
  maxAgeYears: MAX_AGE,
  together: true,
};
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 45 }],
  maxAgeYears: MAX_AGE,
};

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'prune_after_harvest',
    title: 'Prune fruited twigs and mite-curled shoots',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Right after picking, before the new flush: cut off the fruited twig ends and every shoot with brown, velvety, curled leaves. Burn or bury the cuttings',
    why: "New shoots carry next year's flowers. Cutting out mite galls stops the mite spreading",
    hi: {
      title: 'फल लगी टहनियां और माइट से मुड़ी टहनियां काटें',
      organic:
        'तोड़ने के ठीक बाद, नई फुटान से पहले: फल लगी टहनियों के सिरे और भूरी, मखमली, मुड़ी पत्तियों वाली हर टहनी काट दें। कटी टहनियां जला दें या गाड़ दें',
      why: 'नई टहनियों पर अगले साल के फूल आते हैं। माइट की गांठें काटने से माइट नहीं फैलता',
    },
    windows: {
      E: [
        [6, 10],
        [6, 30],
      ],
      N: [
        [6, 25],
        [7, 15],
      ],
    },
  },
  {
    key: 'main_feed',
    title: 'Feed the main fertiliser after harvest',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: '',
    chemical:
      "Two-thirds of the year's urea, all the SSP and two-thirds of the MOP, in a trench 20–30 cm deep along the canopy edge. Only when the soil is moist; wear gloves",
    dose: E_MAIN_DOSE,
    why: 'Feeds the post-harvest flush that will flower',
    hi: {
      title: 'तुड़ाई के बाद मुख्य खाद दें',
      chemical:
        'साल के urea का दो-तिहाई, पूरा SSP और MOP का दो-तिहाई, छतरी के किनारे 20–30 cm गहरी नाली में। मिट्टी नम हो तभी; दस्ताने पहनें',
      why: 'तुड़ाई के बाद की उस नई फुटान को खुराक, जिस पर फूल आएंगे',
    },
    windows: {
      E: [
        [6, 15],
        [7, 15],
      ],
    },
  },
  {
    key: 'manure',
    title: "Spread the year's manure",
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: '',
    chemical: "All the year's FYM along the canopy edge; wear gloves",
    dose: FYM_DOSE,
    why: 'Slow feed for flowering',
    hi: {
      title: 'साल की गोबर की खाद डालें',
      chemical: 'साल की पूरी गोबर की खाद (FYM) छतरी के किनारे; दस्ताने पहनें',
      why: 'फूलों के लिए धीरे-धीरे मिलने वाली खुराक',
    },
    windows: {
      E: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'manure',
    title: "Spread the year's manure",
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: '',
    chemical: "All the year's FYM + all the SSP + all the MOP; wear gloves",
    dose: MANURE_SSP_MOP_DOSE,
    why: "Slow feed for flowering. PAU's single winter dose",
    hi: {
      title: 'साल की गोबर की खाद डालें',
      chemical:
        'साल की पूरी गोबर की खाद (FYM) + पूरा SSP + पूरा MOP; दस्ताने पहनें',
      why: 'फूलों के लिए धीरे-धीरे मिलने वाली खुराक। PAU की सर्दी में एक बार की खुराक',
    },
    windows: {
      N: [
        [12, 1],
        [12, 31],
      ],
    },
  },
  {
    key: 'mite_cut_october',
    title: 'Cut out mite-curled shoots again',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic: 'Cut and burn the new shoots showing velvety, curled leaves',
    why: "October flush is the mite's second peak",
    hi: {
      title: 'माइट से मुड़ी टहनियां फिर से काटें',
      organic: 'मखमली, मुड़ी पत्तियों वाली नई टहनियां काटकर जला दें',
      why: 'अक्टूबर की फुटान में माइट का दूसरा ज़ोर होता है',
    },
    windows: {
      E: [
        [10, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'frost_water',
    title: 'Water once against frost',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      'One good watering of bearing trees; after that, water only if the soil is dry',
    why: 'Moist soil protects against frost',
    hi: {
      title: 'पाले से बचाने के लिए एक बार पानी दें',
      organic:
        'फल देने वाले पेड़ों को एक बार भरपूर पानी दें; उसके बाद मिट्टी सूखी हो तभी पानी दें',
      why: 'नम मिट्टी पाले से बचाती है',
    },
    windows: {
      N: [
        [11, 25],
        [12, 7],
      ],
    },
  },
  {
    key: 'mealybug_band',
    title: 'Band the trunk against mealybug',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'In November, rake the soil around the trunk. By mid-December, tie a 25 cm wide, 400-gauge polythene band 30–50 cm up the trunk and grease or mud-plaster its edge',
    why: 'Stops mealybug nymphs climbing to the flowers',
    hi: {
      title: 'मिलीबग से बचाने के लिए तने पर पट्टी बांधें',
      organic:
        'नवंबर में तने के आसपास की मिट्टी की गुड़ाई करें। दिसंबर के बीच तक तने पर 30–50 cm ऊंचाई पर 25 cm चौड़ी, 400-gauge पॉलीथीन पट्टी बांधें और उसके किनारे पर ग्रीस या मिट्टी का लेप लगाएं',
      why: 'मिलीबग के बच्चे फूलों तक नहीं चढ़ पाते',
    },
    windows: {
      E: [
        [12, 1],
        [12, 20],
      ],
      N: [
        [12, 1],
        [12, 20],
      ],
    },
  },
  {
    key: 'urea_before_flowering',
    title: 'Feed half the urea before flowering',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: '',
    chemical:
      "Half the year's urea along the canopy edge; water in; wear gloves",
    dose: HALF_UREA_DOSE,
    why: 'Feeds flowering',
    hi: {
      title: 'फूल आने से पहले आधा urea डालें',
      chemical: 'साल का आधा urea छतरी के किनारे; पानी दें; दस्ताने पहनें',
      why: 'फूलों के लिए खुराक',
    },
    windows: {
      N: [
        [2, 10],
        [2, 20],
      ],
    },
  },
  {
    key: 'feed_after_set',
    title: 'Feed urea after fruit set',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: '',
    chemical:
      'The last third of the urea + the last third of the MOP, when fruits are clove-size. Water in; wear gloves',
    dose: E_CLOVE_DOSE,
    why: 'Feeds the growing fruit',
    hi: {
      title: 'फल बनने के बाद urea डालें',
      chemical:
        'urea का आखिरी एक-तिहाई + MOP का आखिरी एक-तिहाई, जब फल लौंग जितने हों। पानी दें; दस्ताने पहनें',
      why: 'बढ़ते फलों के लिए खुराक',
    },
    windows: {
      E: [
        [4, 1],
        [4, 15],
      ],
    },
  },
  {
    key: 'feed_after_set',
    title: 'Feed urea after fruit set',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: '',
    chemical: 'The other half of the urea. Water in; wear gloves',
    dose: HALF_UREA_DOSE,
    why: 'Feeds the growing fruit',
    hi: {
      title: 'फल बनने के बाद urea डालें',
      chemical: 'urea का बाकी आधा। पानी दें; दस्ताने पहनें',
      why: 'बढ़ते फलों के लिए खुराक',
    },
    windows: {
      N: [
        [4, 10],
        [4, 20],
      ],
    },
  },
  {
    key: 'water_until_picking',
    title: 'Water twice a week until picking',
    category: 'WATERING',
    stages: ['BEARING'],
    organic: 'Water bearing trees twice a week while the fruit develops',
    why: 'Dry soil followed by heavy water cracks and drops fruit',
    hi: {
      title: 'तोड़ने तक हफ्ते में दो बार पानी दें',
      organic: 'फल बढ़ते समय फल देने वाले पेड़ों को हफ्ते में दो बार पानी दें',
      why: 'सूखी मिट्टी के बाद भारी पानी से फल फटते और झड़ते हैं',
    },
    windows: {
      N: [
        [5, 10],
        [6, 30],
      ],
    },
  },
  {
    key: 'pick_bunches',
    title: 'Pick ripe bunches with a short stalk',
    category: 'GENERAL',
    stages: ['BEARING'],
    organic:
      "Pick only fully red fruit with flattened bumps; litchi doesn't ripen after picking. Cut whole bunches with a short stalk and few leaves; never pull single fruits",
    why: 'Single fruits tear at the stalk and rot',
    hi: {
      title: 'पके गुच्छे छोटे डंठल के साथ तोड़ें',
      organic:
        'सिर्फ पूरे लाल, चपटे उभार वाले फल तोड़ें; लीची तोड़ने के बाद नहीं पकती। पूरे गुच्छे छोटे डंठल और कुछ पत्तों के साथ काटें; अकेले फल कभी न खींचें',
      why: 'अकेले फल डंठल पर फट जाते हैं और सड़ते हैं',
    },
    windows: {
      E: [
        [5, 15],
        [6, 15],
      ],
      N: [
        [6, 8],
        [6, 28],
      ],
    },
  },
];

const BOTH = { E: ALL_YEAR, N: ALL_YEAR };

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'nrcl_dose',
    title: 'NRC Litchi dose for trees over 12 years',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Your tree is over 12 years old',
    organic:
      "Bearing-tree dose from NRC Litchi, the ICAR institute: trees over 12 years, 750 g N and 750 g K₂O a year. This is a flat adult figure, not per year of age. The app's reminders use NHB-7's lower per-year dose",
    why: 'A flat adult dose from the ICAR institute',
    hi: {
      title: '12 साल से पुराने पेड़ों के लिए NRC Litchi की खुराक',
      organic:
        'ICAR संस्थान NRC Litchi की फल देने वाले पेड़ की खुराक: 12 साल से पुराने पेड़ों के लिए साल में 750 g N और 750 g K₂O। यह बड़े पेड़ की तय मात्रा है, उम्र के हर साल के हिसाब से नहीं। ऐप के रिमाइंडर NHB-7 की कम, हर साल वाली खुराक इस्तेमाल करते हैं',
      why: 'ICAR संस्थान की बड़े पेड़ के लिए तय खुराक',
      conditional: 'आपका पेड़ 12 साल से पुराना है',
    },
    windows: BOTH,
  },
  {
    key: 'water_before_flowering',
    title: 'Hold back water before flowering',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'About four months before flowering',
    organic:
      'Hold back water from bearing trees for about four months before flowering. Start watering again once flower bunches show',
    why: 'Water before flowering',
    hi: {
      title: 'फूल आने से पहले पानी रोक दें',
      organic:
        'फूल आने से लगभग चार महीने पहले फल देने वाले पेड़ों का पानी रोक दें। फूलों के गुच्छे दिखते ही फिर से पानी देना शुरू करें',
      why: 'फूल आने से पहले पानी',
      conditional: 'फूल आने से लगभग चार महीने पहले',
    },
    windows: { E: ALL_YEAR },
  },
  {
    key: 'water_fruit_growth',
    title: 'Keep the soil moist as fruit grows',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'From fruit set until 8–10 days before picking',
    organic:
      'Never let the soil dry from fruit set until 8–10 days before picking',
    why: 'Water as fruit grows',
    hi: {
      title: 'फल बढ़ते समय मिट्टी नम रखें',
      organic:
        'फल बनने से लेकर तोड़ने के 8–10 दिन पहले तक मिट्टी को कभी सूखने न दें',
      why: 'फल बढ़ते समय पानी',
      conditional: 'फल बनने से लेकर तोड़ने के 8–10 दिन पहले तक',
    },
    windows: { E: ALL_YEAR },
  },
  {
    key: 'bagging',
    title: 'Bag the fruit bunches',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: '25–30 days after your tree sets fruit',
    organic: 'Tie white or pink non-woven polypropylene bags over the bunches',
    why: 'They guard against nut borer, sunburn and cracking, and improve colour',
    hi: {
      title: 'फलों के गुच्छों पर थैली चढ़ाएं',
      organic:
        'गुच्छों पर सफेद या गुलाबी non-woven polypropylene थैलियां बांधें',
      why: 'ये नट बोरर, धूप की जलन और फटने से बचाती हैं, और रंग अच्छा करती हैं',
      conditional: 'पेड़ पर फल बनने के 25–30 दिन बाद',
    },
    windows: BOTH,
  },
  {
    key: 'mite_flush',
    title: 'Cut out mite-curled shoots on the new flush',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Velvety curled leaves on the new flush (mite)',
    organic:
      'Cut and burn those shoots in Dec–Jan, before the flower buds open',
    why: 'Mite',
    hi: {
      title: 'नई फुटान पर माइट से मुड़ी टहनियां काटें',
      organic:
        'दिसंबर–जनवरी में, फूल की कलियां खुलने से पहले, उन टहनियों को काटकर जला दें',
      why: 'माइट',
      conditional: 'नई फुटान पर मखमली मुड़ी पत्तियां (माइट)',
    },
    windows: {
      N: [
        [12, 1],
        [1, 31],
      ],
    },
  },
  {
    key: 'bark_caterpillar',
    title: 'Treat bark-eating caterpillar holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Silk webs with chewed bark on the trunk',
    organic:
      'Pull off the webs; push a wire into the tunnel, or squirt in kerosene with a syringe; seal the hole with mud',
    why: 'Bark-eating caterpillar',
    hi: {
      title: 'छाल खाने वाली सुंडी के छेदों का इलाज करें',
      organic:
        'जाले हटा दें; सुरंग में तार डालें, या सिरिंज से केरोसिन डालें; छेद मिट्टी से बंद करें',
      why: 'छाल खाने वाली सुंडी',
      conditional: 'तने पर चबाई हुई छाल के साथ रेशमी जाले',
    },
    windows: BOTH,
  },
  {
    key: 'shoot_borer',
    title: 'Clip shoot tips with shoot borer',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Shoot tips wilt in Sep–Oct (shoot borer)',
    organic: 'Clip and destroy them',
    why: 'Shoot borer',
    hi: {
      title: 'टहनी छेदक वाली टहनियों के सिरे काटें',
      organic: 'उन्हें काटकर नष्ट करें',
      why: 'टहनी छेदक',
      conditional: 'सितंबर–अक्टूबर में टहनियों के सिरे मुरझाएं (टहनी छेदक)',
    },
    windows: {
      E: [
        [9, 1],
        [10, 31],
      ],
      N: [
        [9, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'leaf_roller',
    title: 'Pick off rolled leaves',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Leaves rolled with caterpillars inside (leaf roller)',
    organic: 'Pick off the rolled leaves',
    why: 'Leaf roller',
    hi: {
      title: 'मुड़ी हुई पत्तियां तोड़ दें',
      organic: 'मुड़ी हुई पत्तियां तोड़ दें',
      why: 'पत्ती लपेटक',
      conditional: 'पत्तियां मुड़ी हों और अंदर सुंडी हो (पत्ती लपेटक)',
    },
    windows: BOTH,
  },
  {
    key: 'nut_borer',
    title: 'Clear fallen fruit against nut borer',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fruits have pin-holes at the stalk (nut borer)',
    organic:
      'Clear all fallen and dried fruit and dig the basin lightly after harvest',
    why: 'Nut borer',
    hi: {
      title: 'नट बोरर से बचाने के लिए गिरे फल हटाएं',
      organic:
        'तुड़ाई के बाद सभी गिरे और सूखे फल हटा दें और थाले की हल्की गुड़ाई करें',
      why: 'नट बोरर',
      conditional: 'फलों में डंठल के पास पिन जैसे छेद (नट बोरर)',
    },
    windows: { N: ALL_YEAR },
  },
  {
    key: 'leaf_weevil',
    title: 'Shake off leaf-cutting weevils',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Beetles cut leaf edges (leaf-cutting weevil)',
    organic:
      'Shake the branches over an upturned umbrella and drop the beetles into soapy water',
    why: 'Leaf-cutting weevil',
    hi: {
      title: 'पत्ती काटने वाले घुन झाड़ दें',
      organic:
        'डालियों को उल्टे छाते के ऊपर हिलाएं और बीटल साबुन वाले पानी में डाल दें',
      why: 'पत्ती काटने वाला घुन',
      conditional: 'बीटल पत्तियों के किनारे काटते हैं (पत्ती काटने वाला घुन)',
    },
    windows: BOTH,
  },
  {
    key: 'boron',
    title: 'Spray boric acid for misshapen fruit',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Fruits are misshapen (boron)',
    organic:
      'Spray boric acid 1 g per litre (0.1%). Wear gloves; it is a nutrient, so there is no waiting period',
    why: 'Boron shortage',
    hi: {
      title: 'बेडौल फलों के लिए boric acid स्प्रे करें',
      organic:
        'boric acid 1 g प्रति लीटर (0.1%) स्प्रे करें। दस्ताने पहनें; यह पोषक तत्व है, इसलिए तोड़ने से पहले रुकने की ज़रूरत नहीं',
      why: 'boron की कमी',
      conditional: 'फल बेडौल हैं (boron)',
    },
    windows: BOTH,
  },
  {
    key: 'anthracnose',
    title: 'Clean up against anthracnose',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Leaves and twigs have dark sunken spots (anthracnose)',
    organic:
      'Collect and burn diseased leaves, twigs and fruit, and thin crowded branches',
    why: 'Anthracnose',
    hi: {
      title: 'एंथ्रेक्नोज़ से बचाव के लिए सफाई करें',
      organic:
        'रोगी पत्तियां, टहनियां और फल इकट्ठा करके जला दें, और घनी डालियां छांट दें',
      why: 'एंथ्रेक्नोज़',
      conditional: 'पत्तियों और टहनियों पर गहरे, धंसे हुए धब्बे (एंथ्रेक्नोज़)',
    },
    windows: BOTH,
  },
  {
    key: 'water_young',
    title: 'Water the young tree often in the dry months',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Dry months',
    organic:
      'Young trees need frequent watering in the dry months (no interval in the source)',
    why: 'Young roots dry out fast',
    hi: {
      title: 'सूखे महीनों में छोटे पेड़ को बार-बार पानी दें',
      organic:
        'सूखे महीनों में छोटे पेड़ों को बार-बार पानी चाहिए (स्रोत में अंतराल नहीं दिया गया)',
      why: 'छोटी जड़ें जल्दी सूख जाती हैं',
      conditional: 'सूखे महीने',
    },
    windows: { E: ALL_YEAR },
  },
  {
    key: 'planting_site',
    title: "Don't plant where water stands",
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Choosing where to plant',
    organic: "Don't plant where water stands",
    why: 'Litchi wilt follows waterlogging',
    hi: {
      title: 'जहां पानी रुकता हो वहां पौधा न लगाएं',
      organic: 'जहां पानी रुकता हो वहां पौधा न लगाएं',
      why: 'पानी भरने के बाद लीची में उकठा रोग आता है',
      conditional: 'पौधा लगाने की जगह चुनते समय',
    },
    windows: BOTH,
  },
];

/** Hindi for the young-tree feeding lines, shared by the manure and urea rows. */
const FEED_YOUNG_SEP_HI =
  'उम्र के हर साल के हिसाब से खुराक, तने से 30 cm दूर घेरे में, जो पेड़ के साथ बढ़ता जाए। सितंबर में गोबर की खाद (FYM) + SSP + MOP, फरवरी के बीच में आधा urea, बाकी आधा इलाके में लीची की तुड़ाई के बाद; दस्ताने पहनें';
const FEED_YOUNG_DEC_HI =
  'उम्र के हर साल के हिसाब से खुराक, तने से 30 cm दूर घेरे में, जो पेड़ के साथ बढ़ता जाए। दिसंबर में गोबर की खाद (FYM) + SSP + MOP, फरवरी के बीच में आधा urea, बाकी आधा अप्रैल के बीच में; दस्ताने पहनें';

const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young_manure',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: '',
    chemical:
      'Dose per year of age, in a ring 30 cm out from the trunk, growing with the tree. FYM + SSP + MOP in September, half the urea in mid-February, the other half after the local litchi harvest; wear gloves',
    dose: MANURE_SSP_MOP_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      chemical: FEED_YOUNG_SEP_HI,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़त',
    },
    windows: {
      E: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'feed_young_manure',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    // The table's "as bearing rows 3, 8, 9", written out.
    organic: '',
    chemical:
      'Dose per year of age, in a ring 30 cm out from the trunk, growing with the tree. FYM + SSP + MOP in December, half the urea in mid-February, the other half in mid-April; wear gloves',
    dose: MANURE_SSP_MOP_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      chemical: FEED_YOUNG_DEC_HI,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़त',
    },
    windows: {
      N: [
        [12, 1],
        [12, 31],
      ],
    },
  },
  {
    key: 'feed_young_urea',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: '',
    chemical:
      'Dose per year of age, in a ring 30 cm out from the trunk, growing with the tree. FYM + SSP + MOP in September, half the urea in mid-February, the other half after the local litchi harvest; wear gloves',
    dose: HALF_UREA_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      chemical: FEED_YOUNG_SEP_HI,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़त',
    },
    windows: {
      E: [
        [
          [2, 10],
          [2, 20],
        ],
        [
          [6, 15],
          [7, 15],
        ],
      ],
    },
  },
  {
    key: 'feed_young_urea',
    title: 'Feed the young tree',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: '',
    chemical:
      'Dose per year of age, in a ring 30 cm out from the trunk, growing with the tree. FYM + SSP + MOP in December, half the urea in mid-February, the other half in mid-April; wear gloves',
    dose: HALF_UREA_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'छोटे पेड़ को खाद दें',
      chemical: FEED_YOUNG_DEC_HI,
      why: 'मज़बूत ढांचे के लिए लगातार बढ़त',
    },
    windows: {
      N: [
        [
          [2, 10],
          [2, 20],
        ],
        [
          [4, 10],
          [4, 20],
        ],
      ],
    },
  },
  {
    key: 'water_young',
    title: 'Water the young tree',
    category: 'WATERING',
    stages: ['YOUNG'],
    organic:
      'Weekly from September to March, twice a week from April to June; mulch with straw',
    why: 'Young roots dry out fast',
    hi: {
      title: 'छोटे पेड़ को पानी दें',
      organic:
        'सितंबर से मार्च तक हर हफ्ते, अप्रैल से जून तक हफ्ते में दो बार; पुआल की मल्च बिछाएं',
      why: 'छोटी जड़ें जल्दी सूख जाती हैं',
    },
    windows: {
      N: [
        [9, 15],
        [6, 30],
      ],
    },
  },
  {
    key: 'frost_cover',
    title: 'Cover against frost',
    category: 'PROTECTION',
    stages: ['YOUNG'],
    organic:
      'Cover with thatch or sarkanda by the end of November, for the first 4–5 years',
    why: 'Frost on unprotected plants',
    hi: {
      title: 'पाले से बचाने के लिए ढकें',
      organic: 'पहले 4–5 साल, नवंबर के आखिर तक छप्पर या सरकंडे से ढक दें',
      why: 'बिना ढके पौधों पर पाला',
    },
    windows: {
      E: [
        [11, 25],
        [1, 31],
      ],
      N: [
        [11, 25],
        [1, 31],
      ],
    },
  },
  {
    key: 'dhaincha',
    title: 'Sow dhaincha around the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    organic:
      'Sow dhaincha in the basin. It shades the tree by mid-April and can be tied around it for winter frost cover. Root-prune it 3–4 times a year',
    why: 'Shade in summer, frost cover in winter',
    hi: {
      title: 'छोटे पेड़ के आसपास ढैंचा बोएं',
      organic:
        'थाले में ढैंचा बोएं। अप्रैल के बीच तक यह पेड़ को छाया देता है और सर्दी में पाले से बचाने के लिए इसे पेड़ के चारों ओर बांधा जा सकता है। साल में 3–4 बार इसकी जड़ों की छंटाई करें',
      why: 'गर्मी में छाया, सर्दी में पाले से बचाव',
    },
    windows: {
      N: [
        [2, 10],
        [2, 25],
      ],
    },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'harvest',
    avoid: ['Pulling single fruits', 'Picking before fully red'],
    watch: ['Fruit borer', 'Fruit rot'],
    // E: the table's mid-May–mid-Jun, to the day.
    hi: {
      avoid: ['अकेले फल खींचना', 'पूरे लाल होने से पहले तोड़ना'],
      watch: ['फल छेदक', 'फल सड़न'],
    },
    months: {
      E: [
        [5, 15],
        [6, 15],
      ] as Window,
      N: [6, 6],
    },
  },
  {
    phase: 'post_harvest_flush',
    avoid: ['Heavy pruning (light only; heavy is for old trees)'],
    watch: [
      'Mite (peaks Jul–Oct)',
      'Leaf roller in the rains',
      'Shoot borer (Sep–Oct)',
    ],
    hi: {
      avoid: ['भारी छंटाई (सिर्फ हल्की; भारी छंटाई पुराने पेड़ों के लिए है)'],
      watch: [
        'माइट (जुलाई–अक्टूबर में सबसे ज़्यादा)',
        'बारिश में पत्ती लपेटक',
        'टहनी छेदक (सितंबर–अक्टूबर)',
      ],
    },
    months: { E: [6, 9], N: [7, 9] },
  },
  {
    phase: 'pre_flowering',
    avoid: ['Deep digging outside Nov–Feb'],
    watch: ['Mite on the new flush', 'Mealybug nymphs climbing (Dec–Jan)'],
    hi: {
      avoid: ['नवंबर–फरवरी के अलावा गहरी खुदाई'],
      watch: [
        'नई फुटान पर माइट',
        'मिलीबग के बच्चे ऊपर चढ़ते हुए (दिसंबर–जनवरी)',
      ],
    },
    months: { E: [10, 1] },
  },
  {
    phase: 'pre_flowering',
    avoid: ['Deep digging outside Nov–Feb'],
    watch: [
      'Mite on the new flush',
      'Mealybug nymphs climbing (Dec–Jan)',
      'Frost',
    ],
    hi: {
      avoid: ['नवंबर–फरवरी के अलावा गहरी खुदाई'],
      watch: [
        'नई फुटान पर माइट',
        'मिलीबग के बच्चे ऊपर चढ़ते हुए (दिसंबर–जनवरी)',
        'पाला',
      ],
    },
    months: { N: [10, 1] },
  },
  {
    phase: 'flowering',
    avoid: [
      'Spraying in full bloom (bees)',
      'Water stress at flowering, so start watering again once flower bunches show',
    ],
    watch: ['Mite on flower bunches (Feb–Mar)', 'Litchi bug'],
    hi: {
      avoid: [
        'पूरे फूल खिले हों तब स्प्रे (मधुमक्खियां)',
        'फूल आते समय पानी की कमी, इसलिए फूलों के गुच्छे दिखते ही फिर से पानी देना शुरू करें',
      ],
      watch: ['फूलों के गुच्छों पर माइट (फरवरी–मार्च)', 'लीची बग'],
    },
    months: { E: [2, 3] },
  },
  {
    phase: 'flowering',
    avoid: ['Spraying in full bloom (bees)'],
    watch: ['Mite on flower bunches (Feb–Mar)', 'Litchi bug'],
    hi: {
      avoid: ['पूरे फूल खिले हों तब स्प्रे (मधुमक्खियां)'],
      watch: ['फूलों के गुच्छों पर माइट (फरवरी–मार्च)', 'लीची बग'],
    },
    months: { N: [2, 3] },
  },
  {
    phase: 'fruit_development',
    avoid: ['Dry soil then heavy watering (cracking)'],
    watch: ['Fruit borer (Apr–May)', 'Cracking', 'Sunburn (above 40 °C)'],
    hi: {
      avoid: ['सूखी मिट्टी के बाद भारी पानी (फल फटना)'],
      watch: ['फल छेदक (अप्रैल–मई)', 'फल फटना', 'धूप की जलन (40 °C से ऊपर)'],
    },
    months: { E: [3, 5], N: [4, 6] },
  },
  {
    phase: 'establishment',
    stages: ['YOUNG'],
    avoid: ['Waterlogging', 'Hot wind and frost on unprotected plants'],
    watch: ['Termites', 'Wilt'],
    hi: {
      avoid: ['पानी भरना', 'बिना ढके पौधों पर गर्म हवा और पाला'],
      watch: ['दीमक', 'उकठा रोग'],
    },
    months: { E: [1, 12], N: [1, 12] },
  },
];

const regionCare = (group: Group): RegionCare =>
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const LITCHI_CARE: FamilyCare = {
  family: 'litchi',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'ICAR-NRC Litchi web pages (nrclitchi.org.in)',
    'PAU Package of Practices for Fruit Crops',
    'National Horticulture Board litchi pages (nhb.gov.in)',
    'NIPHM/DPPQS AESA-based IPM package for litchi',
  ],
  grownIn: ['EAST_INDIA', 'NORTH_INDIA'],
  regions: {
    EAST_INDIA: regionCare('E'),
    NORTH_INDIA: regionCare('N'),
  },
};
