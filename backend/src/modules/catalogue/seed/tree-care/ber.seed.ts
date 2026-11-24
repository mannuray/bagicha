import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Ber (Indian jujube) care, transcribed from the source-checked table approved
 * by the owner on 2026-11-24 with every recommendation
 * (docs/plant-care/ber.md, with a source for every row). Change it only
 * through the add-plant playbook.
 *
 * Owner decisions: no chemical sprays at all (carbendazim held, Q1); Bordeaux
 * paste on cuts only, no spray or drench (Q8); no Apple Ber kind (Q9); no
 * methyl eugenol traps (Q11). NORTH_INDIA = PAU, with PAU's per-year dose.
 * WEST_INDIA = CAZRI, Rajasthan (Q4), its banded feeds held (W5, W7, Q2).
 * SOUTH_DECCAN = TNAU (Q6) and EAST_INDIA = AAU, Assam (Q7, March pruning
 * derived): bearing trees get the flat manure as text, the fertiliser parts
 * are held and young trees get no calendar feed (Q3). TNAU's Jan–Mar
 * potassium nitrate (S3) is held. CENTRAL_INDIA and COASTAL_HUMID are pending:
 * no source found.
 */

const BOTH = ['YOUNG', 'BEARING'] as TreeCareItem['stages'];
const BEARING = ['BEARING'] as TreeCareItem['stages'];
const YOUNG = ['YOUNG'] as TreeCareItem['stages'];
const ALL_YEAR: Anchor = { kind: 'CALENDAR', from: [1, 1], to: [12, 31] };
const cal = (
  from: [number, number],
  to: [number, number],
): Extract<Anchor, { kind: 'CALENDAR' }> => ({
  kind: 'CALENDAR',
  from,
  to,
});

/** NIPHM p.23: trench along the drip line. */
const TRENCH =
  'in a trench 20–30 cm deep and 30 cm wide along the drip line of the tree; cover with soil';
const TRENCH_HI =
  'पेड़ की छतरी के बाहरी घेरे (drip line) पर 20–30 cm गहरी और 30 cm चौड़ी खाई में डालें; मिट्टी से ढकें';
/** PAU p.10–11 Bordeaux paste, scaled down to 1/20. */
const PASTE =
  'Bordeaux paste (dissolve 100 g copper sulphate in 750 ml water; slake 150 g quicklime in another 750 ml; mix and stir; plastic or clay pot, never metal; use the same day)';
const PASTE_HI =
  'Bordeaux paste (100 g copper sulphate 750 ml पानी में घोलें; 150 g कच्चा चूना दूसरे 750 ml पानी में बुझाएं; मिलाकर चलाएं; प्लास्टिक या मिट्टी का बर्तन लें, धातु का कभी नहीं; उसी दिन इस्तेमाल करें)';
const KNO3 =
  'Potassium nitrate 15 g per litre (1.5%) on the leaves. Wear gloves; a fertiliser: no waiting period';
const KNO3_HI =
  'Potassium nitrate 15 g प्रति लीटर (1.5%) पत्तियों पर। दस्ताने पहनें; यह खाद है: तोड़ने से पहले रुकने की ज़रूरत नहीं';

/** PAU p.68: 20 kg FYM per year of age, up to 5 years, all in May–June. */
const MANURE_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 20000 }],
  chemical: [],
  maxAgeYears: 5,
};
/** PAU p.68: 200 g urea per year of age up to 5 years, half in Jul–Aug, half after fruit set. */
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 100 }],
  maxAgeYears: 5,
};

/** "Only if you see it": plant page only, in every region with care. */
const SIGNS: TreeCareItem[] = [
  {
    key: 'fruit_fly',
    title: 'Bury fruit with fruit-fly maggots',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Fruit with tiny holes and soft brown patches, maggots inside, fruit dropping',
    organic:
      'Pick up fallen and infested fruit every few days and bury it in a pit under a thick layer of soil. Pick fruit when full size but still firm, not left to ripen soft on the tree. Turn the soil under the tree in summer to expose the pupae. Umran is tolerant',
    why: 'Fruit-fly maggots spoil the fruit and the next generation pupates in the soil',
    hi: {
      title: 'फल मक्खी की सुंडी वाले फल गाड़ दें',
      conditional: 'फल में छोटे छेद और नरम भूरे धब्बे, अंदर सुंडियां, फल गिरना',
      organic:
        'गिरे और कीड़े लगे फल हर कुछ दिन में उठाएं और गड्ढे में मिट्टी की मोटी परत के नीचे गाड़ दें। फल पूरे बड़े पर अभी सख़्त हों तभी तोड़ें, पेड़ पर नरम पकने के लिए न छोड़ें। गर्मी में पेड़ के नीचे की मिट्टी पलटें ताकि प्यूपा बाहर आ जाएं। Umran पर इसका असर कम होता है',
      why: 'फल मक्खी की सुंडियां फल खराब करती हैं और अगली पीढ़ी मिट्टी में प्यूपा बनती है',
    },
  },
  {
    key: 'powdery_mildew',
    title: 'Pick off leaves and fruit white with mildew',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'White powder on young leaves, flowers and small fruit; fruit turns brown, corky or cracked and drops',
    organic:
      'Pick off and destroy the white-coated leaves, shoots and fruit, and rake up what has fallen. When planting again, choose a resistant variety: Sanaur-2 in Punjab, or Safeda Selected or Dhaka. Umran and Wallaiti are susceptible',
    why: 'Mildew on flowers and young fruit makes them drop or crack',
    hi: {
      title: 'फफूंद से सफ़ेद हुई पत्तियां और फल तोड़ दें',
      conditional:
        'नई पत्तियों, फूलों और छोटे फलों पर सफ़ेद पाउडर; फल भूरे, खुरदरे या फटे होकर गिरते हैं',
      organic:
        'सफ़ेद परत वाली पत्तियां, टहनियां और फल तोड़कर नष्ट करें, और गिरे हुए बटोर लें। दोबारा लगाते समय रोग सहने वाली किस्म चुनें: पंजाब में Sanaur-2, या Safeda Selected या Dhaka। Umran और Wallaiti पर यह रोग जल्दी लगता है',
      why: 'फूलों और छोटे फलों पर फफूंद से वे गिर जाते हैं या फट जाते हैं',
    },
  },
  {
    key: 'fruit_leaf_spots',
    title: 'Remove fruit and leaves with dark spots',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Small black sunken spots on fruit (worst Feb–Mar), or brown spots spreading over leaves that dry and fall',
    organic:
      "Pick off and destroy spotted fruit and leaves; rake up fallen ones. Don't plant in a low spot that floods. Don't wait for the tree to wilt before watering",
    why: 'Spots spread from fallen leaves and fruit',
    hi: {
      title: 'काले धब्बों वाले फल और पत्तियां हटा दें',
      conditional:
        'फल पर छोटे काले धंसे धब्बे (फ़रवरी–मार्च में सबसे ज़्यादा), या पत्तियों पर फैलते भूरे धब्बे जिनसे पत्तियां सूखकर गिरती हैं',
      organic:
        'धब्बे वाले फल और पत्तियां तोड़कर नष्ट करें; गिरे हुए बटोर लें। ऐसी नीची जगह पर न लगाएं जहां पानी भरता हो। पेड़ के मुरझाने तक पानी देने का इंतज़ार न करें',
      why: 'धब्बे गिरी पत्तियों और फलों से फैलते हैं',
    },
  },
  {
    key: 'suckers',
    title: 'Rub out shoots from below the graft',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Shoots from the trunk below the bud union or from the roots',
    organic:
      'Remove them as soon as they appear. Keep the trunk clear to 75 cm (40–50 cm in Assam)',
    why: 'Shoots from the rootstock take over and bear poor fruit',
    hi: {
      title: 'कलम के जोड़ के नीचे की टहनियां हटा दें',
      conditional: 'तने पर कलम के जोड़ के नीचे से या जड़ों से निकलती टहनियां',
      organic: 'दिखते ही हटा दें। तने को 75 cm तक साफ़ रखें (असम में 40–50 cm)',
      why: 'नीचे वाले पौधे (rootstock) की टहनियां हावी हो जाती हैं और घटिया फल देती हैं',
    },
  },
  {
    key: 'lac_insect',
    title: 'Scrape lac insect off the twigs',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Hard, reddish, crusty coating on twigs',
    organic:
      'Cut out the dried, infested twigs and scrape the crust off the rest',
    why: 'Lac insect sucks sap and dries the twigs',
    hi: {
      title: 'टहनियों से लाख का कीड़ा खुरच दें',
      conditional: 'टहनियों पर सख़्त, लाल-सी, पपड़ी जैसी परत',
      organic: 'सूखी, कीड़े लगी टहनियां काट दें और बाकी पर से पपड़ी खुरच दें',
      why: 'लाख का कीड़ा रस चूसता है और टहनियां सुखा देता है',
    },
  },
  {
    key: 'caterpillars',
    title: 'Pick off leaves with caterpillars and eggs',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Leaves and young fruit scraped or eaten; clusters of hairy caterpillars or egg masses',
    organic:
      'Pluck the leaves with egg masses and young caterpillars while they are still in groups, and destroy them',
    why: 'Caught in groups, they are removed before they spread over the tree',
    hi: {
      title: 'सुंडी और अंडों वाली पत्तियां तोड़ दें',
      conditional:
        'पत्तियां और छोटे फल खुरचे या खाए हुए; बालों वाली सुंडियों के झुंड या अंडों के गुच्छे',
      organic:
        'अंडों के गुच्छों और छोटी सुंडियों वाली पत्तियां तब तोड़ें जब सुंडियां झुंड में ही हों, और नष्ट कर दें',
      why: 'झुंड में पकड़ने से वे पूरे पेड़ पर फैलने से पहले ही हट जाती हैं',
    },
  },
  {
    key: 'bark_caterpillar',
    title: 'Clear bark-eating caterpillar from the trunk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Webbing of chewed wood and droppings on the bark, with holes, often at branch joints',
    organic:
      'Clear the webbing. Mix 100 ml kerosene and 10 g soap in 900 ml water and squirt it into each hole. Wear gloves',
    why: 'The caterpillar tunnels into the trunk and weakens branches',
    hi: {
      title: 'तने से छाल खाने वाली सुंडी हटाएं',
      conditional:
        'छाल पर चबाई लकड़ी और बीट का जाला, साथ में छेद, अक्सर डालियों के जोड़ पर',
      organic:
        'जाला साफ़ करें। 900 ml पानी में 100 ml मिट्टी का तेल और 10 g साबुन मिलाएं और हर छेद में पिचकारी से डालें। दस्ताने पहनें',
      why: 'सुंडी तने में सुरंग बनाती है और डालियों को कमज़ोर करती है',
    },
  },
  {
    key: 'dieback',
    title: 'Cut out dying twigs and paste the cuts',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Twigs dying back from the tip; dead, broken or crossing branches',
    organic: `Cut about 8 cm below the dead part, into healthy wood. Paste the cut with cow dung or ${PASTE}. Burn the cut twigs. Wear gloves`,
    why: 'Dead wood lets disease into the healthy branches',
    hi: {
      title: 'सूखती टहनियां काटें और कट पर लेप लगाएं',
      conditional:
        'टहनियां सिरे से नीचे की ओर सूख रही हैं; सूखी, टूटी या आपस में फंसी डालियां',
      organic: `सूखे हिस्से से करीब 8 cm नीचे, स्वस्थ लकड़ी में काटें। कट पर गोबर या ${PASTE_HI} लगाएं। कटी टहनियां जला दें। दस्ताने पहनें`,
      why: 'सूखी लकड़ी से रोग स्वस्थ डालियों में पहुंचता है',
    },
  },
  {
    key: 'fruit_borer',
    title: 'Destroy fruit bored by caterpillars',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional: 'Fruit with a hole and droppings, or a stone eaten out',
    organic:
      'Collect and destroy bored fruit, including fallen ones. Remove wild ber bushes near the tree. Pick fruit as soon as it is mature',
    why: 'The borer breeds in fallen fruit and wild ber',
    hi: {
      title: 'सुंडी के छेद वाले फल नष्ट करें',
      conditional: 'फल में छेद और बीट, या गुठली खाई हुई',
      organic:
        'छेद वाले फल, गिरे हुए भी, इकट्ठा करके नष्ट करें। पेड़ के पास की जंगली बेर की झाड़ियां हटा दें। फल तैयार होते ही तोड़ लें',
      why: 'फल छेदक गिरे फलों और जंगली बेर में पलता है',
    },
  },
  {
    key: 'train_young',
    title: 'Train the young tree to 4–5 main branches',
    category: 'PRUNING',
    stages: YOUNG,
    when: ALL_YEAR,
    conditional: 'A newly planted tree',
    organic:
      'Head the main stem back at 75 cm after planting. Keep 4–5 well-spaced side branches, and remove low branches that would touch the ground',
    why: 'A strong open frame carries heavy crops',
    hi: {
      title: 'छोटे पेड़ को 4–5 मुख्य डालियों पर तैयार करें',
      conditional: 'नया लगाया पेड़',
      organic:
        'लगाने के बाद मुख्य तना 75 cm पर काट दें। अच्छी दूरी वाली 4–5 बगल की डालियां रखें, और नीचे की वे डालियां हटा दें जो ज़मीन छुएंगी',
      why: 'मज़बूत खुला ढांचा भारी फसल संभाल लेता है',
    },
  },
];

/** C4: only in regions with no dated water row (SOUTH_DECCAN, EAST_INDIA). */
const EVEN_WATER: TreeCareItem = {
  key: 'even_water',
  title: 'Water every 2–3 weeks while fruit sets',
  category: 'WATERING',
  stages: BEARING,
  when: ALL_YEAR,
  conditional: 'Fruit is setting',
  organic:
    'Water the basin every 2–3 weeks from flowering until the fruit colours; never let it dry hard. Stop about 15 days before the fruit ripens. Mulch the basin with straw',
  why: 'Even water holds the young fruit and sizes it up',
  hi: {
    title: 'फल लगते समय हर 2–3 हफ़्ते पानी दें',
    conditional: 'फल लग रहे हैं',
    organic:
      'फूल आने से फल का रंग बदलने तक हर 2–3 हफ़्ते थाले में पानी दें; मिट्टी कभी सूखकर सख़्त न होने दें। फल पकने से करीब 15 दिन पहले बंद कर दें। थाले में पुआल की मल्च बिछाएं',
    why: 'बराबर पानी से छोटे फल टिके रहते हैं और बड़े होते हैं',
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
      key: 'prune_may',
      title: 'Prune the tree hard after the harvest',
      category: 'PRUNING',
      stages: BEARING,
      when: cal([5, 16], [5, 31]),
      organic: `While the tree is bare and resting, cut each of last season's shoots back to 8 buds. Cut off low branches that spread on the ground, and thin, dry, broken and diseased branches. Brush ${PASTE} on every cut thicker than a finger. Wear gloves`,
      why: "Ber fruits only on the current season's shoots; hard pruning gives more and better fruit",
      hi: {
        title: 'तुड़ाई के बाद पेड़ की ज़ोरदार छंटाई करें',
        organic: `जब पेड़ पर पत्ते न हों और वह आराम में हो, पिछले सीज़न की हर टहनी को 8 कलियों तक काट दें। ज़मीन पर फैलने वाली नीची डालियां काटें, और पतली, सूखी, टूटी और रोगी डालियां भी छांटें। उंगली से मोटे हर कट पर ${PASTE_HI} लगाएं। दस्ताने पहनें`,
        why: 'बेर में फल सिर्फ़ इसी सीज़न की टहनियों पर आते हैं; ज़ोरदार छंटाई से ज़्यादा और बेहतर फल मिलते हैं',
      },
    },
    {
      key: 'manure_may',
      title: "Dig in the year's manure under the tree",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([5, 1], [6, 30]),
      organic: `Well-rotted FYM ${TRENCH}. Turn the soil under the canopy as you dig; it exposes fruit-fly pupae to the sun and birds`,
      dose: MANURE_DOSE,
      why: "The whole year's manure, given while the tree rests",
      hi: {
        title: 'पेड़ के नीचे साल की गोबर की खाद मिलाएं',
        organic: `अच्छी सड़ी गोबर की खाद ${TRENCH_HI}। खुदाई करते हुए छतरी के नीचे की मिट्टी पलट दें; इससे फल मक्खी के प्यूपा धूप और चिड़ियों के सामने आ जाते हैं`,
        why: 'पूरे साल की गोबर की खाद, जब पेड़ आराम में हो',
      },
    },
    {
      key: 'urea_rains',
      title: "Give half the year's urea in the rains",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([7, 1], [8, 31]),
      organic: '',
      chemical: `Urea ${TRENCH}. Wear gloves`,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the new shoots that will carry flowers',
      hi: {
        title: 'बारिश में साल का आधा urea दें',
        chemical: `Urea ${TRENCH_HI}। दस्ताने पहनें`,
        why: 'उन नई टहनियों को खुराक मिलती है जिन पर फूल आएंगे',
      },
    },
    {
      key: 'urea_fruit_set',
      title: 'Give the rest of the urea, then mulch',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([10, 1], [10, 31]),
      organic:
        'After the urea, spread a thick layer of paddy straw under the canopy (PAU: 5 t per acre)',
      chemical: `Urea ${TRENCH}. Wear gloves`,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the setting fruit; the mulch keeps weeds down and the soil moist',
      hi: {
        title: 'बाकी urea दें, फिर मल्च बिछाएं',
        organic:
          'urea के बाद छतरी के नीचे धान की पुआल की मोटी परत बिछाएं (PAU: 5 t प्रति एकड़)',
        chemical: `Urea ${TRENCH_HI}। दस्ताने पहनें`,
        why: 'लगते हुए फलों को खुराक मिलती है; मल्च खरपतवार रोकती है और मिट्टी नम रखती है',
      },
    },
    {
      key: 'water_fruit',
      title: 'Water every 3–4 weeks while fruit grows',
      category: 'WATERING',
      stages: BEARING,
      when: cal([10, 1], [2, 29]),
      organic:
        "Water the basin every 3–4 weeks, more often in a dry spell. Don't let the soil dry out hard while fruit is on the tree",
      why: 'Bigger, better fruit and less fruit drop',
      hi: {
        title: 'फल बढ़ते समय हर 3–4 हफ़्ते पानी दें',
        organic:
          'हर 3–4 हफ़्ते थाले में पानी दें, सूखे दिनों में और जल्दी। पेड़ पर फल हों तो मिट्टी सूखकर सख़्त न होने दें',
        why: 'बड़े, बेहतर फल और कम फल गिरते हैं',
      },
    },
    {
      key: 'stop_water',
      title: 'Stop watering as the fruit starts to ripen',
      category: 'WATERING',
      stages: BEARING,
      when: cal([3, 16], [3, 31]),
      organic: 'Give no more water once the fruit starts to colour',
      why: 'Watering now delays ripening and spoils fruit on low branches',
      hi: {
        title: 'फल पकने लगें तो पानी देना बंद करें',
        organic: 'फल का रंग बदलना शुरू होते ही और पानी न दें',
        why: 'अब पानी देने से फल देर से पकते हैं और नीची डालियों के फल खराब होते हैं',
      },
    },
    {
      key: 'kno3_nov',
      title: 'Spray potassium nitrate for bigger fruit',
      category: 'FEEDING',
      stages: BEARING,
      when: cal([11, 10], [11, 20]),
      organic: '',
      chemical: KNO3,
      why: 'Bigger fruit and a larger crop',
      hi: {
        title: 'बड़े फल के लिए potassium nitrate स्प्रे करें',
        chemical: KNO3_HI,
        why: 'बड़े फल और ज़्यादा फसल',
      },
    },
    {
      key: 'kno3_jan',
      title: 'Spray potassium nitrate a second time',
      category: 'FEEDING',
      stages: BEARING,
      when: cal([1, 10], [1, 20]),
      organic: '',
      chemical: KNO3,
      why: 'Bigger fruit and a larger crop',
      hi: {
        title: 'potassium nitrate दूसरी बार स्प्रे करें',
        chemical: KNO3_HI,
        why: 'बड़े फल और ज़्यादा फसल',
      },
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [5, 1],
      [6, 30],
      'summer_rest',
      [],
      ['Fruit-fly pupae in the soil (rake it)'],
      { avoid: [], watch: ['मिट्टी में फल मक्खी के प्यूपा (मिट्टी पलटें)'] },
    ),
    phase(
      [7, 1],
      [9, 30],
      'new_growth',
      ['Tall or hungry crops under the tree (only gram, moong or mash)'],
      ['Leaf-eating caterpillars and lac insect on new shoots'],
      {
        avoid: [
          'पेड़ के नीचे लंबी या ज़्यादा खुराक खाने वाली फसलें (सिर्फ़ चना, मूंग या माश)',
        ],
        watch: ['नई टहनियों पर पत्ती खाने वाली सुंडियां और लाख का कीड़ा'],
      },
    ),
    phase(
      [10, 1],
      [2, 29],
      'fruit_growth',
      ['Letting the soil dry out'],
      [
        'White powder on young leaves and fruit (Umran and Wallaiti are susceptible)',
        'Fruit-fly maggots',
      ],
      {
        avoid: ['मिट्टी को सूखने देना'],
        watch: [
          'नई पत्तियों और फलों पर सफ़ेद पाउडर (Umran और Wallaiti पर जल्दी लगता है)',
          'फल मक्खी की सुंडियां',
        ],
      },
    ),
    phase(
      [3, 1],
      [4, 30],
      'harvest',
      ['Watering after mid-March', 'Leaving fruit to over-ripen on the tree'],
      [
        'Black spots on fruit, worst in Feb–Mar',
        'Pick fruit firm to escape fruit fly',
      ],
      {
        avoid: [
          'मार्च के बीच के बाद पानी देना',
          'फलों को पेड़ पर ज़्यादा पकने देना',
        ],
        watch: [
          'फलों पर काले धब्बे, फ़रवरी–मार्च में सबसे ज़्यादा',
          'फल मक्खी से बचाने के लिए फल सख़्त ही तोड़ें',
        ],
      },
    ),
  ],
};

const WEST_INDIA: RegionCare = {
  items: [
    {
      key: 'prune_may',
      title: 'Prune the tree hard after the harvest',
      category: 'PRUNING',
      stages: BEARING,
      when: cal([5, 1], [5, 31]),
      organic: `While the tree is bare, cut the main branches back to the level of their 4th to 6th side shoots. Cut every side shoot off close to where it starts. Every year, cut out unwanted, diseased, dry and crossing branches at their base. Brush ${PASTE} on cuts thicker than a finger. Wear gloves`,
      why: 'Flowers and fruit come only on new shoots',
      hi: {
        title: 'तुड़ाई के बाद पेड़ की ज़ोरदार छंटाई करें',
        organic: `जब पेड़ पर पत्ते न हों, मुख्य डालियों को उनकी चौथी से छठी बगल की टहनी तक काट दें। हर बगल की टहनी को उसके निकलने की जगह के पास से काट दें। हर साल फालतू, रोगी, सूखी और आपस में फंसी डालियां उनके निकलने की जगह से काटें। उंगली से मोटे कट पर ${PASTE_HI} लगाएं। दस्ताने पहनें`,
        why: 'फूल और फल सिर्फ़ नई टहनियों पर आते हैं',
      },
    },
    {
      key: 'turn_soil',
      title: 'Turn the soil under the tree for fruit fly',
      category: 'PROTECTION',
      stages: BOTH,
      when: cal([5, 1], [6, 30]),
      organic:
        'Dig over the soil under the canopy so the fruit-fly pupae hiding there are exposed to sun and birds',
      why: "Fewer flies reach next season's fruit",
      hi: {
        title: 'फल मक्खी के लिए पेड़ के नीचे मिट्टी पलटें',
        organic:
          'छतरी के नीचे की मिट्टी खोदकर पलट दें ताकि उसमें छिपे फल मक्खी के प्यूपा धूप और चिड़ियों के सामने आ जाएं',
        why: 'अगले सीज़न के फलों तक कम मक्खियां पहुंचती हैं',
      },
    },
    {
      key: 'first_water',
      title: "Water if the rains haven't come by mid-June",
      category: 'WATERING',
      stages: BOTH,
      when: cal([6, 15], [6, 30]),
      organic:
        'If no rain has fallen by 15 June, start watering so new growth begins on time. Stop once the monsoon is steady',
      why: 'The tree wakes from its summer rest with the first water',
      hi: {
        title: 'जून के बीच तक बारिश न हो तो पानी दें',
        organic:
          '15 जून तक बारिश न हो तो पानी देना शुरू करें ताकि नई बढ़त समय पर शुरू हो। मानसून जम जाए तो बंद कर दें',
        why: 'पहले पानी से पेड़ गर्मी के आराम से जागता है',
      },
    },
    {
      key: 'water_flowering',
      title: 'Water lightly while the tree flowers',
      category: 'WATERING',
      stages: BEARING,
      when: cal([9, 1], [10, 15]),
      organic:
        'Give light waterings; flowers open from September and fruit has set by mid-October',
      why: 'Holds the flowers and young fruit without forcing leaf growth',
      hi: {
        title: 'फूल आते समय हल्का पानी दें',
        organic:
          'हल्का पानी दें; फूल सितंबर से खिलते हैं और अक्टूबर के बीच तक फल लग जाते हैं',
        why: 'पत्तियों की बढ़त बढ़ाए बिना फूल और छोटे फल टिके रहते हैं',
      },
    },
    {
      key: 'water_fruit',
      title: 'Water every 15 days while fruit grows',
      category: 'WATERING',
      stages: BEARING,
      when: cal([10, 16], [2, 29]),
      organic:
        'Water every 15 days. Stop 15 days before your fruit ripens: Gola from mid-December, mid-season kinds from early January, Umran from late January',
      why: 'Fruit sizes up; stopping early makes it sweeter',
      hi: {
        title: 'फल बढ़ते समय हर 15 दिन पानी दें',
        organic:
          'हर 15 दिन पानी दें। आपके फल पकने से 15 दिन पहले बंद कर दें: Gola में दिसंबर के बीच से, मध्य-सीज़न किस्मों में जनवरी की शुरुआत से, Umran में जनवरी के आखिर से',
        why: 'फल बड़ा होता है; जल्दी बंद करने से मीठा होता है',
      },
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [1, 1],
      [3, 31],
      'harvest',
      ['Watering in the last 15 days before your fruit ripens'],
      ['Fruit-fly maggots in ripening fruit'],
      {
        avoid: ['आपके फल पकने से पहले के आखिरी 15 दिनों में पानी देना'],
        watch: ['पकते फलों में फल मक्खी की सुंडियां'],
      },
    ),
    phase(
      [4, 1],
      [6, 14],
      'summer_rest',
      ['Watering the bare tree'],
      ['Fruit-fly pupae in the soil'],
      {
        avoid: ['बिना पत्तों वाले पेड़ को पानी देना'],
        watch: ['मिट्टी में फल मक्खी के प्यूपा'],
      },
    ),
    phase(
      [6, 15],
      [8, 31],
      'new_growth',
      [],
      ['Chafer beetles holing new leaves (Jun–Jul)'],
      {
        avoid: [],
        watch: ['नई पत्तियों में छेद करने वाले चेफर बीटल (जून–जुलाई)'],
      },
    ),
    phase(
      [9, 1],
      [10, 15],
      'flowering',
      ['Heavy watering'],
      ['White powder on leaves, twigs and flowers (Oct–Nov)'],
      {
        avoid: ['ज़्यादा पानी'],
        watch: ['पत्तियों, टहनियों और फूलों पर सफ़ेद पाउडर (अक्टूबर–नवंबर)'],
      },
    ),
    phase(
      [10, 16],
      [12, 31],
      'fruit_growth',
      ['Letting the soil dry out'],
      [
        'White powder on leaves and fruit',
        'Brown leaf spots from November',
        'Frost on young trees in cold nights',
      ],
      {
        avoid: ['मिट्टी को सूखने देना'],
        watch: [
          'पत्तियों और फलों पर सफ़ेद पाउडर',
          'नवंबर से पत्तियों पर भूरे धब्बे',
          'ठंडी रातों में छोटे पेड़ों पर पाला',
        ],
      },
    ),
  ],
};

const SOUTH_DECCAN: RegionCare = {
  items: [
    {
      key: 'prune_feb',
      title: "Prune out last season's tired shoots",
      category: 'PRUNING',
      stages: BEARING,
      when: cal([2, 1], [3, 31]),
      organic: `Cut off the unproductive upper part of last season's main shoots and their side shoots. Remove weak, crossing, diseased and broken branches. Brush ${PASTE} on cuts thicker than a finger. Wear gloves`,
      why: 'Pushes strong new growth at the most fruitful buds',
      hi: {
        title: 'पिछले सीज़न की थकी टहनियां छांट दें',
        organic: `पिछले सीज़न की मुख्य टहनियों और उनकी बगल की टहनियों का ऊपरी, बिना फल वाला हिस्सा काट दें। कमज़ोर, आपस में फंसी, रोगी और टूटी डालियां हटा दें। उंगली से मोटे कट पर ${PASTE_HI} लगाएं। दस्ताने पहनें`,
        why: 'सबसे ज़्यादा फल देने वाली कलियों से मज़बूत नई बढ़त निकलती है',
      },
    },
    {
      key: 'manure_after_prune',
      title: 'Dig in manure right after pruning',
      category: 'FEEDING',
      stages: BEARING,
      when: cal([2, 1], [3, 31]),
      organic: `Well-rotted FYM, 50 kg per tree, ${TRENCH}`,
      why: 'The tree feeds the new shoots that will flower in June',
      hi: {
        title: 'छंटाई के तुरंत बाद गोबर की खाद मिलाएं',
        organic: `अच्छी सड़ी गोबर की खाद, 50 kg प्रति पेड़, ${TRENCH_HI}`,
        why: 'पेड़ उन नई टहनियों को खुराक देता है जिन पर जून में फूल आएंगे',
      },
    },
    ...SIGNS,
    EVEN_WATER,
  ],
  phases: [
    phase(
      [6, 1],
      [7, 31],
      'flowering',
      ['Letting the soil dry out at fruit set'],
      ['White powder on flowers and newly set fruit'],
      {
        avoid: ['फल लगते समय मिट्टी को सूखने देना'],
        watch: ['फूलों और नए लगे फलों पर सफ़ेद पाउडर'],
      },
    ),
    phase(
      [10, 1],
      [11, 30],
      'harvest',
      ['Leaving ripe fruit on the tree'],
      ['Fruit-fly maggots', 'Black leaf spot'],
      {
        avoid: ['पके फल पेड़ पर छोड़ना'],
        watch: ['फल मक्खी की सुंडियां', 'पत्तियों पर काले धब्बे'],
      },
    ),
  ],
};

const EAST_INDIA: RegionCare = {
  items: [
    {
      key: 'prune_march',
      title: 'Head back the branches after harvest',
      category: 'PRUNING',
      stages: BEARING,
      when: cal([3, 1], [3, 31]),
      organic: `Once the last fruit is picked, cut the branches back to 30 cm above the graft union. Brush ${PASTE} on every cut. Wear gloves`,
      why: 'Hard heading-back gives vigorous new fruiting shoots',
      hi: {
        title: 'तुड़ाई के बाद डालियां छोटी काट दें',
        organic: `आखिरी फल तोड़ने के बाद डालियों को कलम के जोड़ से 30 cm ऊपर तक काट दें। हर कट पर ${PASTE_HI} लगाएं। दस्ताने पहनें`,
        why: 'ज़ोरदार कटाई से तेज़ बढ़ने वाली नई फल वाली टहनियां निकलती हैं',
      },
    },
    {
      key: 'manure_march',
      title: 'Dig in manure and borax after pruning',
      category: 'FEEDING',
      stages: BEARING,
      when: cal([3, 1], [3, 31]),
      organic: `Well-rotted FYM 10 kg + borax 25 g per tree, ${TRENCH}. Wear gloves for the borax`,
      why: 'Feeds the new shoots; borax prevents boron shortage',
      hi: {
        title: 'छंटाई के बाद गोबर की खाद और borax मिलाएं',
        organic: `अच्छी सड़ी गोबर की खाद 10 kg + borax 25 g प्रति पेड़, ${TRENCH_HI}। borax के लिए दस्ताने पहनें`,
        why: 'नई टहनियों को खुराक मिलती है; borax से boron की कमी नहीं होती',
      },
    },
    ...SIGNS,
    EVEN_WATER,
  ],
  phases: [
    phase(
      [1, 1],
      [2, 29],
      'harvest',
      ['Leaving yellow fruit on the tree; pick it in 4–5 rounds'],
      ['Fruit-fly maggots', 'White powder', 'Leaf spots'],
      {
        avoid: ['पीले फल पेड़ पर छोड़ना; 4–5 बार में तोड़ें'],
        watch: ['फल मक्खी की सुंडियां', 'सफ़ेद पाउडर', 'पत्तियों पर धब्बे'],
      },
    ),
  ],
};

export const BER_CARE: FamilyCare = {
  family: 'ber',
  sources: [
    'PAU Package of Practices for Cultivation of Fruits (2021), ber pp.65–71; Bordeaux paste pp.10–11',
    'TNAU Crop Production Guide, Horticulture Crops 2020, ber pp.40–41; season table p.343',
    'ICAR-CAZRI Jodhpur, Commercial ber cultivation and management (Hindi leaflet, 2014)',
    'AAU Package of Practices for Horticultural Crops of Assam (2021), ber pp.43–44',
    'NIPHM/DPPQS AESA-based IPM package, Ber',
    'National Horticulture Board model project report, Ber',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: [
    'NORTH_INDIA',
    'WEST_INDIA',
    'CENTRAL_INDIA',
    'SOUTH_DECCAN',
    'EAST_INDIA',
    'COASTAL_HUMID',
  ],
  pendingRegions: ['CENTRAL_INDIA', 'COASTAL_HUMID'],
  regions: { NORTH_INDIA, WEST_INDIA, SOUTH_DECCAN, EAST_INDIA },
};
