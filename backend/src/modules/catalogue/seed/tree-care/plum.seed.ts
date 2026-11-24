import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Plum care, transcribed from the source-checked table approved by the owner
 * on 2026-11-23 with every recommendation (docs/plant-care/plum.md, with a
 * source for every row). Change it only through the add-plant playbook.
 *
 * NORTH_INDIA = PAU; HILLS_COOL = UHF's mid-hill guide (Q3). The urea split is
 * tied to flowering, so it ships only as a conditional (Q2: the derived
 * Feb/Mar rows are held). No growth regulators (Q5), no lime sulphur (Q6): no
 * chemical survives the label check.
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

/** Rule 1 (UHF p.26): where manure and fertiliser go. */
const PLACED =
  'spread in the tree basin, about 30 cm from the trunk, and mixed in lightly. Water after. Wear gloves';
/** Bordeaux paste (PAU p.10, scaled down 1:40), cuts and wounds only. */
const PASTE =
  'Bordeaux paste (dissolve 50 g copper sulphate in 375 ml water; in a second pot, slake 75 g quicklime slowly with a little of another 375 ml of water, then add the rest; mix the two and stir; plastic or clay pot, never iron)';
/** Bordeaux paint (PAU p.10, scaled down 1:20). */
const PAINT =
  'Bordeaux paint (heat about 70 g copper sulphate crystals on an iron tawa until they crumble into a white powder; mix 50 g of the powder well with 100 g hydrated lime dust, then stir in 150 ml boiled linseed oil until smooth; it keeps in a closed pot)';
const PLACED_HI =
  'पेड़ के थाले में, तने से लगभग 30 cm दूर फैलाकर हल्का मिला दें। बाद में पानी दें। दस्ताने पहनें';
const PASTE_HI =
  'Bordeaux paste (50 g copper sulphate को 375 ml पानी में घोलें; दूसरे बर्तन में 75 g quicklime (कली चूना) को अलग से लिए 375 ml पानी में से थोड़ा-थोड़ा डालकर धीरे-धीरे बुझाएं, फिर बाकी पानी डालें; दोनों को मिलाकर चलाएं; प्लास्टिक या मिट्टी का बर्तन लें, लोहे का कभी नहीं)';
const PAINT_HI =
  'Bordeaux paint (लगभग 70 g copper sulphate के दाने लोहे के तवे पर तब तक गरम करें जब तक वे भुरभुरे होकर सफ़ेद पाउडर न बन जाएं; इस पाउडर का 50 g, 100 g hydrated lime के पाउडर में अच्छी तरह मिलाएं, फिर 150 ml उबला हुआ अलसी का तेल (linseed oil) डालकर चिकना होने तक चलाएं; यह बंद बर्तन में रखा रहता है)';

/** PAU p.104: FYM 6 kg, SSP 95 g and MOP 60 g × age, up to 6 years, together. */
const NORTH_MANURE_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 6000 }],
  chemical: [
    { what: 'SSP', grams: 95 },
    { what: 'MOP', grams: 60 },
  ],
  maxAgeYears: 6,
  together: true,
};
/** PAU p.104: urea 60 g × age up to 6 years, half before flowering (Q1). */
const NORTH_HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 30 }],
  maxAgeYears: 6,
};
/** UHF p.47: P and K per year of age up to 7 years (Q4), as SSP and MOP. */
const HILLS_SSP_MOP_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'SSP', grams: 219 },
    { what: 'MOP', grams: 167 },
  ],
  maxAgeYears: 7,
};
/** UHF p.47: N 70 g × age (urea 152 g) up to 7 years, half before flowering. */
const HILLS_HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 76 }],
  maxAgeYears: 7,
};

const ureaBloom = (
  amount: string,
  dose: Dose,
  amountHi: string,
): TreeCareItem => ({
  key: 'urea_bloom',
  title: 'Give half the urea before flowers open',
  category: 'FEEDING',
  stages: BOTH,
  when: ALL_YEAR,
  conditional: 'Flower buds swelling, before they open',
  organic: '',
  chemical: `Urea ${amount}, in the basin. Give the second half a month later, once fruit has set (SKUAST: 3 weeks after fruit set). Wear gloves`,
  dose,
  why: 'Feeds flowering and the spring flush',
  hi: {
    title: 'फूल खिलने से पहले आधा urea दें',
    conditional: 'फूल की कलियां फूल रही हों, खिलने से पहले',
    chemical: `Urea ${amountHi}, थाले में। बाकी आधा एक महीने बाद, फल लगने पर दें (SKUAST: फल लगने के 3 हफ़्ते बाद)। दस्ताने पहनें`,
    why: 'फूल आने और वसंत की नई बढ़वार को खुराक मिलती है',
  },
});

const aphids = (extra: string, extraHi: string): TreeCareItem => ({
  key: 'aphids',
  title: 'Wash aphids off curled shoots',
  category: 'PROTECTION',
  stages: BOTH,
  when: ALL_YEAR,
  conditional:
    'Leaves curled tightly on a limb, sticky honeydew, or pale green waxy aphids under the leaves',
  organic: `Hose the shoots and the undersides of leaves with a strong jet of water. Snip off and destroy tightly curled tips${extra}`,
  why: 'Aphids curl the leaves and stunt new shoots',
  hi: {
    title: 'मुड़ी टहनियों से माहू धो दें',
    conditional:
      'किसी डाली पर पत्ते कसकर मुड़े हुए, चिपचिपा मीठा रस (honeydew), या पत्तों के नीचे हल्के हरे, मोम जैसे माहू',
    organic: `टहनियों और पत्तों के नीचे की तरफ़ तेज़ धार से पानी मारें। कसकर मुड़े सिरे काटकर नष्ट करें${extraHi}`,
    why: 'माहू पत्ते मोड़ देते हैं और नई टहनियों की बढ़वार रोक देते हैं',
  },
});

const zinc = (spray: string, sprayHi: string): TreeCareItem => ({
  key: 'zinc',
  title: 'Spray zinc on small, rosetted leaves',
  category: 'FEEDING',
  stages: BOTH,
  when: ALL_YEAR,
  conditional:
    'Small, narrow leaves in rosettes at the shoot tips, yellow between the veins',
  organic: `${spray}. Spray when the symptoms show. It is a nutrient, so there is no waiting period. Wear gloves`,
  why: 'Zinc runs short on light soils in summer',
  hi: {
    title: 'छोटे, गुच्छेदार पत्तों पर zinc स्प्रे करें',
    conditional:
      'टहनियों के सिरों पर छोटे, पतले पत्ते गुच्छों में, नसों के बीच पीले',
    organic: `${sprayHi}। लक्षण दिखें तब स्प्रे करें। यह पोषक तत्व है, इसलिए इंतज़ार की कोई अवधि नहीं। दस्ताने पहनें`,
    why: 'गर्मी में हल्की मिट्टी में zinc की कमी हो जाती है',
  },
});

/** "Only if you see it": plant page only, in both regions. */
const SIGNS: TreeCareItem[] = [
  {
    key: 'gummosis',
    title: 'Scrape gummy cankers and cover with paste',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Amber gum oozing from bark or branches; sunken cankers',
    organic: `Scrape the weeping canker back to clean wood. Cover it with ${PASTE} at the end of the dormant season and again before the rains. Burn the scrapings. Wear gloves`,
    why: 'Gummosis cankers spread and weaken the branch',
    hi: {
      title: 'गोंद वाले कैंकर खुरचें और पेस्ट लगाएं',
      conditional: 'छाल या डालियों से पीला-भूरा गोंद निकलना; धंसे हुए कैंकर',
      organic: `रिसते कैंकर को खुरचकर साफ़ लकड़ी तक ले जाएं। पत्तों के बिना वाले मौसम के आख़िर में और बारिश से पहले फिर, उस पर ${PASTE_HI} लगाएं। खुरचन जला दें। दस्ताने पहनें`,
      why: 'गोंद वाले कैंकर फैलते हैं और डाली को कमज़ोर करते हैं',
    },
  },
  {
    key: 'beetles',
    title: 'Shake off leaf-eating beetles at dusk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Leaves eaten at night after the first monsoon rains',
    organic:
      'At dusk, spread a sheet under young trees, shake them, and drop the beetles into water with a little kerosene',
    why: 'Beetles can strip young trees in a few nights',
    hi: {
      title: 'शाम को पत्ते खाने वाले बीटल झाड़कर गिराएं',
      conditional: 'मानसून की पहली बारिश के बाद रात में पत्ते खाए हुए',
      organic:
        'शाम को छोटे पेड़ों के नीचे चादर बिछाएं, उन्हें हिलाएं, और बीटल को थोड़े मिट्टी के तेल (kerosene) वाले पानी में डाल दें',
      why: 'बीटल कुछ ही रातों में छोटे पेड़ों के पत्ते साफ़ कर सकते हैं',
    },
  },
  {
    key: 'scale',
    title: 'Cut out stems crusted with scale',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Grey scaly crusts on stems and twigs',
    organic: 'Cut out and destroy infested stems',
    why: 'Scale sucks sap and dries out twigs',
    hi: {
      title: 'स्केल से ढकी टहनियां काट दें',
      conditional: 'तनों और टहनियों पर सलेटी पपड़ी',
      organic: 'स्केल वाली टहनियां काटकर नष्ट करें',
      why: 'स्केल रस चूसता है और टहनियां सुखा देता है',
    },
  },
  {
    key: 'borers',
    title: 'Clear borer holes and cut out bored wood',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Gum or reddish-orange frass and small holes on the trunk, at branch crotches or at the graft',
    organic:
      'Clear each hole with a flexible wire, push in a cotton wick soaked in petrol and seal it with wet mud. Cut out and destroy badly bored branches. Collect and destroy fallen fruit. Cover the sun-facing trunk with dry grass or gunny from March to October',
    why: 'Borers tunnel into the trunk and branches and weaken the tree',
    hi: {
      title: 'बोरर के छेद साफ़ करें, खोखली लकड़ी काटें',
      conditional:
        'तने पर, डालियों के जोड़ पर या ग्राफ्ट पर गोंद या लाल-नारंगी बुरादा और छोटे छेद',
      organic:
        'हर छेद को लचीले तार से साफ़ करें, पेट्रोल में भीगी रुई की बत्ती अंदर डालें और गीली मिट्टी से बंद करें। बहुत ज़्यादा खोखली डालियां काटकर नष्ट करें। गिरे फल इकट्ठा करके नष्ट करें। मार्च से अक्टूबर तक धूप वाली तरफ़ के तने को सूखी घास या टाट से ढकें',
      why: 'बोरर तने और डालियों में सुरंग बनाकर पेड़ को कमज़ोर करते हैं',
    },
  },
  {
    key: 'shot_hole',
    title: 'Clear away leaves with shot-hole spots',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Brown spots on leaves that drop out, leaving holes',
    organic: 'Collect and destroy fallen leaves',
    why: 'The spots spread from fallen leaves',
    hi: {
      title: 'शॉट-होल धब्बों वाले पत्ते हटाएं',
      conditional: 'पत्तों पर भूरे धब्बे जो झड़कर छेद छोड़ देते हैं',
      organic: 'गिरे पत्ते इकट्ठा करके नष्ट करें',
      why: 'धब्बे गिरे पत्तों से फैलते हैं',
    },
  },
  {
    key: 'suckers',
    title: 'Cut out suckers from the base',
    category: 'PRUNING',
    stages: BOTH,
    when: ALL_YEAR,
    conditional: 'Shoots coming up from the base of the trunk',
    organic: 'Cut them out as they appear',
    why: 'Suckers take food from the fruiting branches',
    hi: {
      title: 'जड़ के पास से निकलने वाले सकर काटें',
      conditional: 'तने के निचले हिस्से से निकलती टहनियां',
      organic: 'जैसे ही निकलें, काट दें',
      why: 'सकर फल वाली डालियों का खाना ले लेते हैं',
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
      title: "Spread the year's manure, SSP and potash",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [12, 31]),
      organic: `Well-rotted FYM, 6 kg × age up to 6 years (36 kg), ${PLACED}`,
      chemical:
        'SSP 95 g + MOP 60 g × age, up to 6 years (570 g + 360 g), in the same basin. Wear gloves',
      dose: NORTH_MANURE_DOSE,
      why: 'Manure and slow nutrients go in while the tree is bare, ready for spring',
      hi: {
        title: 'साल की खाद, SSP और पोटाश डालें',
        organic: `अच्छी सड़ी गोबर की खाद (FYM), 6 kg × उम्र, 6 साल तक (36 kg), ${PLACED_HI}`,
        chemical:
          'SSP 95 g + MOP 60 g × उम्र, 6 साल तक (570 g + 360 g), उसी थाले में। दस्ताने पहनें',
        why: 'खाद और धीमे पोषक तत्व तब डाले जाते हैं जब पेड़ बिना पत्तों का हो, ताकि वसंत तक तैयार रहें',
      },
    },
    {
      key: 'prune_jan',
      title: 'Prune and train the bare tree in January',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([1, 1], [1, 31]),
      organic: `Young (modified leader, 3 years): at planting (first half of January), cut back the soft top and cut any side branches to short stubs. At the first winter rest, keep 4–5 branches around the stem, 15–20 cm apart, the lowest about 45 cm up, and remove the rest. In the third year, keep wide-angled, well-spaced branches; when the frame is built, cut the top back to an outward-growing side branch. Bearing: a light prune; remove thin, crowding, crossing, dry and diseased twigs to let sun into the centre. Cut out water shoots and suckers. Every 4–5 years of fruiting, shorten long branches by half. Paste cuts thicker than 4–5 cm with ${PASTE} or ${PAINT}. Wear gloves`,
      why: 'Opens the tree to sun for colour and renews fruiting wood',
      hi: {
        title: 'जनवरी में बिना पत्तों के पेड़ को छांटें और आकार दें',
        organic: `छोटा पेड़ (modified leader, 3 साल): लगाते समय (जनवरी के पहले आधे में) नरम ऊपरी हिस्सा काट दें और बगल की डालियों को छोटे ठूंठ तक काटें। पहले सर्दी के आराम में तने के चारों ओर 4–5 डालियां रखें, 15–20 cm की दूरी पर, सबसे नीचे वाली लगभग 45 cm ऊपर, और बाकी हटा दें। तीसरे साल चौड़े कोण वाली, अच्छी दूरी की डालियां रखें; ढांचा बन जाए तो ऊपरी हिस्सा बाहर की ओर बढ़ती बगल की डाली तक काट दें। फल देने वाला पेड़: हल्की छंटाई; पतली, भीड़ वाली, एक-दूसरे को काटती, सूखी और बीमार टहनियां हटाएं ताकि बीच में धूप पहुंचे। सीधी बढ़ती पानी वाली टहनियां (water shoots) और सकर काट दें। फल देने के हर 4–5 साल बाद लंबी डालियां आधी करें। 4–5 cm से मोटे कट पर ${PASTE_HI} या ${PAINT_HI} लगाएं। दस्ताने पहनें`,
        why: 'पेड़ में धूप पहुंचने से फल पर रंग आता है और फल वाली लकड़ी नई होती रहती है',
      },
    },
    {
      key: 'water_summer',
      title: 'Water every 4–5 days through the summer',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        "Water every 4–5 days from April to June. Fruit grows fastest in April, so don't let the soil dry then. Young trees up to 3–4 years need the same",
      why: 'A plum short of water drops fruit and fails to crop',
      hi: {
        title: 'पूरी गर्मी हर 4–5 दिन में पानी दें',
        organic:
          'अप्रैल से जून तक हर 4–5 दिन में पानी दें। अप्रैल में फल सबसे तेज़ बढ़ता है, इसलिए तब मिट्टी सूखने न दें। 3–4 साल तक के छोटे पेड़ों को भी इतना ही पानी चाहिए',
        why: 'पानी की कमी में आलूबुखारा फल गिरा देता है और फसल नहीं देता',
      },
    },
    {
      key: 'fruit_fly_apr',
      title: 'Hang a fruit fly trap; bury fallen fruit',
      category: 'PROTECTION',
      stages: BEARING,
      when: cal([4, 8], [4, 14]),
      organic:
        'Hang a PAU fruit fly trap (a methyl eugenol lure in a trap, not sprayed on the tree) in the second week of April; recharge it after 30 days if needed. Pick up fallen fruit every few days and bury it at least 60 cm deep. After the last picking, dig the basin shallowly to expose pupae',
      why: 'Fruit flies are active on plum from the first week of April to mid-May',
      hi: {
        title: 'फल मक्खी का ट्रैप टांगें; गिरे फल दबा दें',
        organic:
          'अप्रैल के दूसरे हफ़्ते में PAU का फल मक्खी ट्रैप टांगें (ट्रैप में methyl eugenol का lure, पेड़ पर स्प्रे नहीं); ज़रूरत हो तो 30 दिन बाद फिर भरें। हर कुछ दिन में गिरे फल उठाकर कम से कम 60 cm गहरा दबा दें। आख़िरी तुड़ाई के बाद थाले को हल्का खोदें ताकि प्यूपा बाहर आ जाएं',
        why: 'अप्रैल के पहले हफ़्ते से मई के बीच तक आलूबुखारे पर फल मक्खियां सक्रिय रहती हैं',
      },
    },
    {
      key: 'harvest',
      title: 'Pick plums ripe but firm, with the stalk on',
      category: 'GENERAL',
      stages: BEARING,
      when: cal([5, 1], [5, 21]),
      organic:
        "Pick when the fruit has full size and the skin turns from green to its colour (crimson for Satluj Purple, dark purple for Kala Amritsari). Pick by the stalk, ripe but still firm, in the cool of the morning. Fruit ripens unevenly: pick over 2–3 rounds. Don't leave ripe fruit on the tree",
      why: 'Ripe fruit left on the tree draws fruit fly and spoils',
      hi: {
        title: 'आलूबुखारे पके पर सख़्त, डंठल समेत तोड़ें',
        organic:
          'जब फल पूरे आकार का हो जाए और छिलका हरे से अपने रंग में बदल जाए (Satluj Purple के लिए गहरा लाल, Kala Amritsari के लिए गहरा बैंगनी), तब तोड़ें। डंठल से पकड़कर तोड़ें, पके पर अभी सख़्त, सुबह की ठंडक में। फल एक साथ नहीं पकते: 2–3 बार में तोड़ें। पके फल पेड़ पर न छोड़ें',
        why: 'पेड़ पर छूटे पके फल फल मक्खी को बुलाते हैं और ख़राब हो जाते हैं',
      },
    },
    ureaBloom(
      '30 g × age, up to 6 years (180 g)',
      NORTH_HALF_UREA_DOSE,
      '30 g × उम्र, 6 साल तक (180 g)',
    ),
    aphids(
      '. Leaf curl aphid is active March–May',
      '। पत्ता मोड़ने वाला माहू मार्च–मई में सक्रिय रहता है',
    ),
    zinc(
      'Zinc sulphate 6 g + unslaked lime 3 g per litre of water',
      'Zinc sulphate 6 g + unslaked lime (कली चूना) 3 g प्रति लीटर पानी',
    ),
    {
      key: 'fruit_size_kno3',
      title: 'Spray potassium nitrate after bloom for size',
      category: 'FEEDING',
      stages: BEARING,
      when: ALL_YEAR,
      conditional: 'Two weeks after full bloom, on Satluj Purple',
      organic:
        'Spray potassium nitrate 10 g per litre (1%), then again 10 days later. Water first: the tree must not be dry. It is a fertiliser, so there is no waiting period. Wear gloves',
      why: 'Optional: PAU gives it for bigger Satluj Purple fruit',
      hi: {
        title: 'बड़े फल के लिए फूल के बाद potassium nitrate स्प्रे करें',
        conditional: 'पूरे फूल आने के दो हफ़्ते बाद, Satluj Purple पर',
        organic:
          'potassium nitrate 10 g प्रति लीटर (1%) स्प्रे करें, फिर 10 दिन बाद दोबारा। पहले पानी दें: पेड़ सूखा नहीं होना चाहिए। यह खाद है, इसलिए इंतज़ार की कोई अवधि नहीं। दस्ताने पहनें',
        why: 'ज़रूरी नहीं: PAU इसे Satluj Purple के बड़े फल के लिए बताता है',
      },
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [12, 1],
      [1, 31],
      'dormant',
      ['Frequent watering (water only in a long dry spell)'],
      ['Gum oozing from bark', 'Scale on twigs'],
      {
        avoid: ['बार-बार पानी देना (सिर्फ़ लंबे सूखे में पानी दें)'],
        watch: ['छाल से गोंद निकलना', 'टहनियों पर स्केल'],
      },
    ),
    phase(
      [3, 1],
      [5, 31],
      'fruit_growth',
      ['Letting the soil dry, above all in April'],
      ['Curled leaves from aphids', 'Fruit fly from the first week of April'],
      {
        avoid: ['मिट्टी सूखने देना, ख़ासकर अप्रैल में'],
        watch: ['माहू से मुड़े पत्ते', 'अप्रैल के पहले हफ़्ते से फल मक्खी'],
      },
    ),
    phase(
      [7, 1],
      [9, 30],
      'monsoon',
      [
        'Water standing in the basin',
        'Strong wind (plum orchards need a windbreak)',
      ],
      [
        'Leaf-eating beetles at night once the monsoon breaks',
        'Small, narrow, rosetted leaves at the tips (zinc)',
      ],
      {
        avoid: [
          'थाले में पानी खड़ा रहना',
          'तेज़ हवा (आलूबुखारे के बाग़ को हवा रोकने वाली बाड़ चाहिए)',
        ],
        watch: [
          'मानसून आते ही रात में पत्ते खाने वाले बीटल',
          'सिरों पर छोटे, पतले, गुच्छेदार पत्ते (zinc)',
        ],
      },
    ),
  ],
};

const HILLS_COOL: RegionCare = {
  items: [
    {
      key: 'manure_winter',
      title: "Spread the year's manure, SSP and potash",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [1, 31]),
      organic: `Well-rotted FYM: 10 kg at 1 year, 5 kg more each year, 40 kg from 7 years, ${PLACED}`,
      chemical:
        'SSP 219 g + MOP 167 g × age, up to 7 years (1.53 kg + 1.17 kg), in the same basin. Wear gloves',
      dose: HILLS_SSP_MOP_DOSE,
      why: 'Manure and slow nutrients go in while the tree is bare',
      hi: {
        title: 'साल की खाद, SSP और पोटाश डालें',
        organic: `अच्छी सड़ी गोबर की खाद (FYM): 1 साल पर 10 kg, हर साल 5 kg ज़्यादा, 7 साल से 40 kg, ${PLACED_HI}`,
        chemical:
          'SSP 219 g + MOP 167 g × उम्र, 7 साल तक (1.53 kg + 1.17 kg), उसी थाले में। दस्ताने पहनें',
        why: 'खाद और धीमे पोषक तत्व तब डाले जाते हैं जब पेड़ बिना पत्तों का हो',
      },
    },
    {
      key: 'prune_winter',
      title: 'Prune and train the tree while it is bare',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([12, 1], [2, 29]),
      organic: `Young (open centre): at planting, cut back to 40–60 cm. First winter: keep 3–5 well-spaced, wide-angled branches, remove the central stem, and shorten the kept branches by a quarter. Second winter: keep 2–3 side branches on each, 30–40 cm apart. Bearing: thin out about 30% of shoots and shorten the rest by a third to a half, for 25–50 cm of new growth a year; for Santa Rosa, head back by half and thin 25–30%. Remove dead, diseased and broken wood, and water shoots from the base. Paste every cut thicker than your thumb with ${PASTE}. Wear gloves`,
      why: 'Spurs bear for only 5–6 years; yearly pruning renews them',
      hi: {
        title: 'पत्ते झड़े हों तब पेड़ को छांटें और आकार दें',
        organic: `छोटा पेड़ (open centre): लगाते समय 40–60 cm पर काट दें। पहली सर्दी: 3–5 अच्छी दूरी की, चौड़े कोण वाली डालियां रखें, बीच का तना हटा दें, और रखी डालियों को एक-चौथाई छोटा करें। दूसरी सर्दी: हर डाली पर 2–3 बगल की डालियां रखें, 30–40 cm दूर। फल देने वाला पेड़: लगभग 30% टहनियां छांटकर निकालें और बाकी को एक-तिहाई से आधा छोटा करें, ताकि साल में 25–50 cm नई बढ़वार हो; Santa Rosa के लिए आधा काटें और 25–30% छांटें। सूखी, बीमार और टूटी लकड़ी, और नीचे से निकली पानी वाली टहनियां (water shoots) हटा दें। अंगूठे से मोटे हर कट पर ${PASTE_HI} लगाएं। दस्ताने पहनें`,
        why: 'स्पर सिर्फ़ 5–6 साल फल देते हैं; हर साल की छंटाई से नए बनते रहते हैं',
      },
    },
    {
      key: 'water_apr_jun',
      title: 'Water weekly once fruit has set',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        "After fruit set, water once a week from April to June; 6–8 waterings a season suit Santa Rosa. Don't water at full bloom, and stop when the fruit starts to colour: both cause drop. Mulch the basin with dry grass",
      why: 'Fruit size and quality depend on water while it grows',
      hi: {
        title: 'फल लगने के बाद हर हफ़्ते पानी दें',
        organic:
          'फल लगने के बाद अप्रैल से जून तक हफ़्ते में एक बार पानी दें; Santa Rosa के लिए एक मौसम में 6–8 बार पानी ठीक है। पूरे फूल के समय पानी न दें, और फल रंग पकड़ने लगें तो पानी बंद करें: दोनों से फल गिरते हैं। थाले में सूखी घास का मल्च बिछाएं',
        why: 'फल का आकार और गुण बढ़ते समय मिले पानी पर निर्भर है',
      },
    },
    ureaBloom(
      '76 g × age, up to 7 years (532 g)',
      HILLS_HALF_UREA_DOSE,
      '76 g × उम्र, 7 साल तक (532 g)',
    ),
    aphids('', ''),
    zinc('Zinc sulphate 4 g per litre', 'Zinc sulphate 4 g प्रति लीटर'),
    {
      key: 'boron',
      title: 'Spray boric acid for corky, cracked fruit',
      category: 'FEEDING',
      stages: BEARING,
      when: ALL_YEAR,
      conditional:
        'Misshapen fruit with corky spots that crack; dark, boat-shaped leaves; dying shoot tips',
      organic:
        'Boric acid 1 g per litre of water in June. It is a nutrient, so there is no waiting period. Wear gloves',
      why: 'Boron shortage cracks the fruit and kills shoot tips',
      hi: {
        title: 'कॉर्क जैसे, फटे फलों के लिए boric acid स्प्रे करें',
        conditional:
          'बेढंगे फल जिन पर कॉर्क जैसे धब्बे हों और जो फट जाएं; गहरे रंग के, नाव जैसे पत्ते; सूखते टहनी के सिरे',
        organic:
          'जून में boric acid 1 g प्रति लीटर पानी। यह पोषक तत्व है, इसलिए इंतज़ार की कोई अवधि नहीं। दस्ताने पहनें',
        why: 'Boron की कमी से फल फटते हैं और टहनियों के सिरे मर जाते हैं',
      },
    },
    {
      key: 'fruit_fly_hills',
      title: 'Hang a fruit fly trap as fruit colours',
      category: 'PROTECTION',
      stages: BEARING,
      when: ALL_YEAR,
      conditional:
        'Fruit colouring, or fruit with puncture marks oozing brown juice',
      organic:
        'Hang a methyl eugenol trap. Pick ripe fruit without delay. Collect fallen and stung fruit and bury it in a deep pit',
      why: 'Fruit fly maggots rot the ripening fruit',
      hi: {
        title: 'फल रंग पकड़ें तो फल मक्खी का ट्रैप टांगें',
        conditional:
          'फल रंग पकड़ रहे हों, या फल पर छेद के निशान जिनसे भूरा रस निकले',
        organic:
          'methyl eugenol ट्रैप टांगें। पके फल बिना देर तोड़ें। गिरे और डंक लगे फल इकट्ठा करके गहरे गड्ढे में दबा दें',
        why: 'फल मक्खी के कीड़े पकते फलों को सड़ा देते हैं',
      },
    },
    {
      key: 'collar_rot',
      title: 'Open up and paint a rotting trunk base',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional: 'Bark rotting at the base of the trunk',
      organic: `In November–December, scrape the soil away from the collar and expose the rotted part to the sun. Scrape off the dead bark and cover the wound with ${PAINT}. Don't let water pool at the trunk. Wear gloves`,
      why: 'Collar rot girdles the trunk and can kill the tree',
      hi: {
        title: 'सड़ते तने के निचले हिस्से को खोलें और पेंट करें',
        conditional: 'तने के निचले हिस्से पर छाल सड़ रही हो',
        organic: `नवंबर–दिसंबर में तने के निचले हिस्से (collar) से मिट्टी हटाकर सड़े हिस्से को धूप लगने दें। मरी छाल खुरचकर घाव पर ${PAINT_HI} लगाएं। तने के पास पानी जमा न होने दें। दस्ताने पहनें`,
        why: 'कॉलर रॉट तने को चारों ओर से खा जाता है और पेड़ को मार सकता है',
      },
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [12, 1],
      [2, 29],
      'dormant',
      ['Waterlogged basins'],
      ['Gum oozing from bark', 'Scale on stems'],
      {
        avoid: ['थाले में पानी भरा रहना'],
        watch: ['छाल से गोंद निकलना', 'तनों पर स्केल'],
      },
    ),
    phase(
      [4, 1],
      [6, 30],
      'fruit_growth',
      ['Watering at full bloom', 'Letting the soil dry while fruit grows'],
      ['Curled leaves with aphids', 'Fruit fly as fruit colours'],
      {
        avoid: ['पूरे फूल के समय पानी देना', 'फल बढ़ते समय मिट्टी सूखने देना'],
        watch: ['माहू के साथ मुड़े पत्ते', 'फल रंग पकड़ें तब फल मक्खी'],
      },
    ),
    phase(
      [7, 1],
      [8, 31],
      'monsoon',
      ['Water pooling at the collar'],
      ['Gum from cankers', 'Bark rotting at the collar'],
      {
        avoid: ['तने के निचले हिस्से पर पानी जमा होना'],
        watch: ['कैंकर से गोंद', 'तने के निचले हिस्से पर सड़ती छाल'],
      },
    ),
  ],
};

export const PLUM_CARE: FamilyCare = {
  family: 'plum',
  sources: [
    'PAU Package of Practices for Cultivation of Fruits, plum pp.101–107, peach plant protection pp.85–87, Bordeaux p.10',
    'Dr YS Parmar UHF / HPHDP, Cultivation practices for stone fruits & walnut, plum pp.37–48, diseases pp.62–66, pests pp.68–69',
    'Dept of Horticulture HP with Dr YSPUHF, Spray Schedule 2022 (Peach, Plum, Apricot & Almond)',
    'Dr YSPUHF COHF Neri, Package of Practices for Subtropical Fruit Crops of HP (2022), plum pp.106–116',
    'SKUAST-Jammu, Package of Practices for Fruit Crops (2020), plum pp.108–111',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: ['NORTH_INDIA', 'HILLS_COOL'],
  regions: { NORTH_INDIA, HILLS_COOL },
};
