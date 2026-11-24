import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Apple care for the hills, transcribed from the source-checked table approved
 * by the owner on 2026-11-23 with every recommendation (docs/plant-care/apple.md,
 * with a source for every row). Change it only through the add-plant playbook.
 *
 * Owner decisions: one calendar for all of HILLS_COOL (north-west Himalaya
 * months); NIPHM's per-year dose capped at 10 years, for young and bearing
 * trees; no Chaubattia paste, no Bordeaux spray or drench (paste on cuts only),
 * lime sulphur only on the bare tree before flowers open, no phosmet, no growth
 * regulators. The scab spray calendar stays out of reminders: scab is a sign.
 * The five plains regions (HRMN-99 only) are pending: no ICAR, SAU or state
 * package gives low-chill apple care there.
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

/** NIPHM p.23: placement of manure and fertiliser (rule 2.1). */
const BASIN =
  'spread in the tree basin from 30 cm away from the trunk out to the drip line and mixed into the soil';
/** PAU p.10 recipe at home-garden scale (rule 2.3): paste on cuts only. */
const PASTE =
  'Bordeaux paste (dissolve 100 g copper sulphate in 750 ml water; slake 150 g quicklime in 750 ml water; mix the two and brush the paste on. Use a plastic or clay pot, never iron)';
const LIME_SULPHUR =
  'Lime sulphur 22% SC, 20 ml per litre, sprayed on the bare tree before flowers open (label: "2% pre-blossom"). Wear gloves; only on the bare tree before flowers open, months before picking (no waiting days apply)';
const BASIN_HI =
  'पेड़ के थाले में तने से 30 cm दूर से लेकर छतरी के किनारे (drip line) तक फैलाकर मिट्टी में मिला दें';
const PASTE_HI =
  'Bordeaux paste (100 g copper sulphate को 750 ml पानी में घोलें; 150 g quicklime (कली चूना) को 750 ml पानी में बुझाएं; दोनों को मिलाकर paste ब्रश से लगाएं। प्लास्टिक या मिट्टी का बर्तन लें, लोहे का कभी नहीं)';
const LIME_SULPHUR_HI =
  'Lime sulphur 22% SC, 20 ml प्रति लीटर, फूल खिलने से पहले बिना पत्तों वाले पेड़ पर स्प्रे करें (label: "2% pre-blossom")। दस्ताने पहनें; सिर्फ़ फूल खिलने से पहले बिना पत्तों वाले पेड़ पर, तोड़ने से महीनों पहले (इंतज़ार के दिन लागू नहीं)';

/** NIPHM: 10 kg FYM, 35 g P₂O₅ (219 g SSP) and 70 g K₂O (117 g MOP) × age, to 10 years. */
const WINTER_DOSE: Dose = {
  organic: [{ what: 'FYM', grams: 10000 }],
  chemical: [
    { what: 'SSP', grams: 219 },
    { what: 'MOP', grams: 117 },
  ],
  maxAgeYears: 10,
  together: true,
};
/** NIPHM: 70 g N × age in two halves; 35 g N = 76 g urea, to 10 years. */
const HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 76 }],
  maxAgeYears: 10,
};
const UREA = `Urea ${BASIN}, and watered in. Wear gloves`;
const UREA_HI = `Urea ${BASIN_HI}, और पानी दें। दस्ताने पहनें`;

/** "Only if you see it": plant page only. */
const SIGNS: TreeCareItem[] = [
  {
    key: 'scab',
    title: 'Treat scab spots on leaves and fruit',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Olive-green, velvety spots on leaves (often underneath) that turn brown-black; dark, corky, cracked spots on fruit',
    organic:
      'Pick off spotted leaves and fruit and destroy them. Thin crowded branches so the tree dries fast after rain. In autumn, spray urea and rake up the leaves',
    chemical:
      'Kresoxim-methyl 44.3% SC, 0.5 ml per litre. Wear gloves; never within 7 days of picking',
    why: 'Scab spreads in wet weather from spores that winter in fallen leaves',
    hi: {
      title: 'पत्तों और फलों पर स्कैब के धब्बों का इलाज करें',
      conditional:
        'पत्तों पर (अक्सर नीचे की तरफ़) जैतूनी-हरे, मखमली धब्बे जो भूरे-काले हो जाते हैं; फल पर गहरे, कॉर्क जैसे, फटे धब्बे',
      organic:
        'धब्बे वाले पत्ते और फल तोड़कर नष्ट करें। भीड़ वाली डालियां छांटें ताकि बारिश के बाद पेड़ जल्दी सूखे। पतझड़ में urea स्प्रे करें और पत्ते बटोर लें',
      chemical:
        'Kresoxim-methyl 44.3% SC, 0.5 ml प्रति लीटर। दस्ताने पहनें; तोड़ने से 7 दिन पहले तक नहीं',
      why: 'स्कैब गीले मौसम में उन बीजाणुओं से फैलता है जो गिरे पत्तों में सर्दी बिताते हैं',
    },
  },
  {
    key: 'powdery_mildew',
    title: 'Cut out shoots white with mildew',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'White, mealy coating on new shoots, leaves and flower clusters; leaves narrow and curl',
    organic:
      'In winter, cut off shoots that were mildewed, 15–20 cm (6–8 in.) below the infection. At pink bud, snip off mildewed blossoms and leaves in the early morning without shaking the twig. Burn or bury what you cut',
    chemical: `Bupirimate 26.7% EC, 1.5 ml per litre. Wear gloves; never within 15 days of picking. Or: ${LIME_SULPHUR}`,
    why: 'Mildew winters in infected buds and spreads to new shoots and flowers',
    hi: {
      title: 'मिल्ड्यू से सफ़ेद टहनियां काट दें',
      conditional:
        'नई टहनियों, पत्तों और फूलों के गुच्छों पर सफ़ेद, आटे जैसी परत; पत्ते पतले होकर मुड़ जाते हैं',
      organic:
        'सर्दी में मिल्ड्यू वाली टहनियां संक्रमण से 15–20 cm (6–8 in.) नीचे से काटें। गुलाबी कली के समय सुबह-सुबह टहनी को हिलाए बिना मिल्ड्यू वाले फूल और पत्ते काट दें। जो काटें उसे जला दें या दबा दें',
      chemical: `Bupirimate 26.7% EC, 1.5 ml प्रति लीटर। दस्ताने पहनें; तोड़ने से 15 दिन पहले तक नहीं। या: ${LIME_SULPHUR_HI}`,
      why: 'मिल्ड्यू संक्रमित कलियों में सर्दी बिताता है और नई टहनियों और फूलों पर फैलता है',
    },
  },
  {
    key: 'premature_leaf_fall',
    title: 'Clear leaves hit by early leaf fall',
    category: 'PROTECTION',
    stages: BEARING,
    when: ALL_YEAR,
    conditional:
      'Dark-brown blotches 5–10 mm on older leaves in summer; the leaves yellow and drop weeks early',
    organic:
      'Collect fallen leaves and fruit and destroy them in a closed compost pit or by burning. Prune for air. In autumn, spray urea and rake up the leaves',
    chemical:
      'Dodine 40% SC, 0.75 ml per litre. Wear gloves; never within 21 days of picking',
    why: 'Leaf-fall fungi spend the winter in fallen leaves',
    hi: {
      title: 'जल्दी पत्ते गिरने की बीमारी वाले पत्ते हटाएं',
      conditional:
        'गर्मी में पुराने पत्तों पर 5–10 mm के गहरे भूरे धब्बे; पत्ते पीले होकर हफ़्तों पहले गिर जाते हैं',
      organic:
        'गिरे पत्ते और फल इकट्ठा करके बंद कम्पोस्ट गड्ढे में या जलाकर नष्ट करें। हवा के लिए छंटाई करें। पतझड़ में urea स्प्रे करें और पत्ते बटोर लें',
      chemical:
        'Dodine 40% SC, 0.75 ml प्रति लीटर। दस्ताने पहनें; तोड़ने से 21 दिन पहले तक नहीं',
      why: 'पत्ते गिराने वाली फफूंद गिरे पत्तों में सर्दी बिताती है',
    },
  },
  {
    key: 'canker',
    title: 'Scrape out canker and paste the wound',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Sunken, cracked or papery bark on branches or trunk, often starting at a cut; twigs above it dry up',
    organic: `In winter, scrape the canker back to healthy wood with a sharp knife. Wipe the wound with spirit, then brush on ${PASTE}. Cut out dead twigs and mummified fruit and burn them. Water in hot dry spells, and avoid knocking the bark. Wear gloves`,
    why: 'Canker enters through cuts and wounds and kills the branch above it',
    hi: {
      title: 'कैंकर खुरचें और घाव पर पेस्ट लगाएं',
      conditional:
        'डालियों या तने पर धंसी, फटी या काग़ज़ जैसी छाल, अक्सर किसी कट से शुरू; उसके ऊपर की टहनियां सूख जाती हैं',
      organic: `सर्दी में तेज़ चाकू से कैंकर को खुरचकर स्वस्थ लकड़ी तक ले जाएं। घाव को spirit से पोंछें, फिर ${PASTE_HI} ब्रश से लगाएं। सूखी टहनियां और सूखकर चिपके फल काटकर जला दें। गर्म सूखे दिनों में पानी दें, और छाल पर चोट न लगने दें। दस्ताने पहनें`,
      why: 'कैंकर कट और घावों से घुसता है और उसके ऊपर की डाली को मार देता है',
    },
  },
  {
    key: 'woolly_aphid',
    title: 'Clear woolly aphid from bark and cuts',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'White, cottony tufts on bark, cracks, cuts and suckers; knotty swellings on twigs or roots',
    organic: `Cut off suckers and water shoots at the base. Brush ${PASTE} over cracks, wounds and cut ends. Leave twigs with black, swollen aphid "mummies" on the tree: a tiny wasp (Aphelinus mali) is inside and kills the aphids. Plant buckwheat or flowers of the carrot or sunflower family nearby to feed the wasp. Wear gloves`,
    why: 'Woolly aphid sucks sap from bark and roots and leaves knotty galls',
    hi: {
      title: 'छाल और कटों से वूली एफिड साफ़ करें',
      conditional:
        'छाल, दरारों, कटों और सकर पर सफ़ेद, रुई जैसे गुच्छे; टहनियों या जड़ों पर गांठदार सूजन',
      organic: `सकर और पानी वाली टहनियां (water shoots) जड़ से काट दें। दरारों, घावों और कटे सिरों पर ${PASTE_HI} ब्रश से लगाएं। जिन टहनियों पर काले, फूले माहू की "ममी" हों, उन्हें पेड़ पर रहने दें: उनके अंदर एक छोटी ततैया (Aphelinus mali) है जो माहू को मारती है। ततैया के खाने के लिए पास में कुट्टू (buckwheat) या गाजर या सूरजमुखी परिवार के फूल लगाएं। दस्ताने पहनें`,
      why: 'वूली एफिड छाल और जड़ों का रस चूसता है और गांठें छोड़ देता है',
    },
  },
  {
    key: 'san_jose_scale',
    title: 'Treat San Jose scale while the tree is bare',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Grey, ash-like crust of tiny round scales on bark; red-ringed spots on fruit',
    organic:
      'Cut out and burn badly crusted twigs. Plant buckwheat, carrot-family or sunflower-family plants for the ladybirds and tiny wasps that eat scale',
    chemical: LIME_SULPHUR,
    why: 'Scale sucks sap from the bark and weakens and kills twigs',
    hi: {
      title: 'पत्ते झड़े पेड़ पर San Jose scale का इलाज करें',
      conditional:
        'छाल पर छोटे गोल स्केल की राख जैसी सलेटी पपड़ी; फल पर लाल घेरे वाले धब्बे',
      organic:
        'बहुत पपड़ी वाली टहनियां काटकर जला दें। स्केल खाने वाले लेडीबर्ड और छोटी ततैयों के लिए कुट्टू (buckwheat), गाजर परिवार या सूरजमुखी परिवार के पौधे लगाएं',
      chemical: LIME_SULPHUR_HI,
      why: 'स्केल छाल का रस चूसता है और टहनियों को कमज़ोर करके मार देता है',
    },
  },
  {
    key: 'root_borer',
    title: 'Dig out root borer grubs from the basin',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Tree weak and leaning, leaves small and pale; thick roots chewed or cut through',
    organic:
      "In December–January, dig open the basin of the affected tree, pick out the large cream-white grubs and destroy them. In September, collect and kill the shiny chestnut-red beetles at dusk. Don't plant apple in dry, sandy soil",
    why: 'The grubs eat the roots; the beetles lay eggs in the soil in summer',
    hi: {
      title: 'थाले से रूट बोरर की सुंडियां खोदकर निकालें',
      conditional:
        'पेड़ कमज़ोर और झुका हुआ, पत्ते छोटे और फीके; मोटी जड़ें कुतरी या कटी हुई',
      organic:
        'दिसंबर–जनवरी में प्रभावित पेड़ का थाला खोदें, बड़ी क्रीम-सफ़ेद सुंडियां चुनकर नष्ट करें। सितंबर में शाम को चमकदार भूरे-लाल बीटल इकट्ठा करके मार दें। सूखी, रेतीली मिट्टी में सेब न लगाएं',
      why: 'सुंडियां जड़ें खाती हैं; बीटल गर्मी में मिट्टी में अंडे देते हैं',
    },
  },
  {
    key: 'mites',
    title: 'Water regularly to keep mites down',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Leaves speckled, then bronzed or yellow, with fine webbing underneath; tiny red eggs on spurs',
    organic:
      "Keep watering through dry spells; mites thrive in dry air. Collect fallen leaves and prunings. Spare the ladybirds and predatory mites; don't spray broad-spectrum insecticides",
    chemical:
      'Pyridaben 20% WP, 0.5 g per litre. Wear gloves; never within 5 days of picking',
    why: 'Mites build up in dry weather and bronze the leaves',
    hi: {
      title: 'माइट कम रखने के लिए नियमित पानी दें',
      conditional:
        'पत्तों पर बारीक चित्तियां, फिर पत्ते कांसे या पीले रंग के, नीचे बारीक जाला; स्पर पर छोटे लाल अंडे',
      organic:
        'सूखे दिनों में पानी देते रहें; सूखी हवा में माइट बढ़ते हैं। गिरे पत्ते और कटी टहनियां इकट्ठा करें। लेडीबर्ड और शिकारी माइट को बचाएं; हर तरह के कीट मारने वाली (broad-spectrum) दवा स्प्रे न करें',
      chemical:
        'Pyridaben 20% WP, 0.5 g प्रति लीटर। दस्ताने पहनें; तोड़ने से 5 दिन पहले तक नहीं',
      why: 'सूखे मौसम में माइट बढ़ते हैं और पत्तों को कांसे जैसा कर देते हैं',
    },
  },
  {
    key: 'collar_rot',
    title: 'Clean collar rot and paste the wound',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Bark at the base of the trunk or near the graft soft, dark and spongy; leaves turn purple-red in late summer',
    organic: `Scrape the rotten bark back to healthy wood and brush on ${PASTE}. Keep water from standing at the trunk. Put sand around the stem, 30 cm out and 10 cm deep. Clear weeds and long grass from the basin. When buying, choose a plant grafted well above the soil. Wear gloves`,
    why: 'Collar rot thrives in wet soil at the trunk and can kill the tree',
    hi: {
      title: 'कॉलर रॉट साफ़ करें और घाव पर पेस्ट लगाएं',
      conditional:
        'तने के निचले हिस्से या ग्राफ्ट के पास छाल नरम, गहरी और स्पंज जैसी; गर्मी के आख़िर में पत्ते बैंगनी-लाल',
      organic: `सड़ी छाल खुरचकर स्वस्थ लकड़ी तक ले जाएं और ${PASTE_HI} ब्रश से लगाएं। तने के पास पानी खड़ा न रहने दें। तने के चारों ओर 30 cm तक और 10 cm गहरी रेत डालें। थाले से खरपतवार और लंबी घास साफ़ करें। ख़रीदते समय ऐसा पौधा लें जिसका ग्राफ्ट मिट्टी से काफ़ी ऊपर हो। दस्ताने पहनें`,
      why: 'कॉलर रॉट तने के पास गीली मिट्टी में पनपता है और पेड़ को मार सकता है',
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

const HILLS_COOL: RegionCare = {
  items: [
    {
      key: 'leaves_autumn',
      title: 'Spray urea on old leaves, then rake them up',
      category: 'PROTECTION',
      stages: BOTH,
      when: cal([10, 1], [11, 30]),
      organic:
        'Once the leaves are down, rake up every fallen leaf and fallen fruit. Bury them, burn them or put them in a closed compost pit',
      chemical:
        'Just before the leaves fall, spray them with urea 50 g per litre (5%). Wear gloves; urea is a fertiliser, so there are no waiting days',
      why: 'Scab and leaf-fall fungi spend the winter in fallen leaves; urea rots them faster',
      hi: {
        title: 'पुराने पत्तों पर urea स्प्रे करें, फिर बटोर लें',
        organic:
          'पत्ते गिर जाएं तो हर गिरा पत्ता और गिरा फल बटोर लें। उन्हें दबा दें, जला दें या बंद कम्पोस्ट गड्ढे में डाल दें',
        chemical:
          'पत्ते गिरने से ठीक पहले उन पर urea 50 g प्रति लीटर (5%) स्प्रे करें। दस्ताने पहनें; urea खाद है, इसलिए इंतज़ार के दिन नहीं',
        why: 'स्कैब और पत्ते गिराने वाली फफूंद गिरे पत्तों में सर्दी बिताती हैं; urea से पत्ते जल्दी सड़ते हैं',
      },
    },
    {
      key: 'feed_winter',
      title: 'Spread manure, phosphate and potash in winter',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [1, 31]),
      organic: `Well-rotted FYM, ${BASIN}. Water the basin afterwards`,
      chemical: `SSP and MOP in the same basin with the FYM. Wear gloves`,
      dose: WINTER_DOSE,
      why: 'The tree takes up phosphate and potash slowly; a winter feed is ready for spring',
      hi: {
        title: 'सर्दी में खाद, फॉस्फेट और पोटाश डालें',
        organic: `अच्छी सड़ी गोबर की खाद (FYM), ${BASIN_HI}। बाद में थाले में पानी दें`,
        chemical: 'FYM के साथ उसी थाले में SSP और MOP। दस्ताने पहनें',
        why: 'पेड़ फॉस्फेट और पोटाश धीरे लेता है; सर्दी में दी खाद वसंत तक तैयार रहती है',
      },
    },
    {
      key: 'prune_winter',
      title: 'Prune and shape the tree while it is bare',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([12, 1], [1, 31]),
      organic: `Young tree: head the plant at about 90 cm after planting. Over the next years keep 3–4 well-spaced main branches around the trunk (modified leader). Cut back weak and narrow-angled branches. Bearing tree: prune lightly to moderately. Cut out dead, diseased, crowded and crossing wood, and branches growing straight up (cut them back to a strong side branch). Cut close, leaving no stubs. Cut out shoots white with mildew. Brush ${PASTE} on large cuts. Wear gloves`,
      why: 'Light reaches the fruit spurs, and clean, covered cuts keep canker out',
      hi: {
        title: 'पत्ते झड़े हों तब पेड़ को छांटें और आकार दें',
        organic: `छोटा पेड़: लगाने के बाद पौधे को लगभग 90 cm पर काट दें। अगले सालों में तने के चारों ओर 3–4 अच्छी दूरी वाली मुख्य डालियां रखें (modified leader)। कमज़ोर और संकरे कोण वाली डालियां काट दें। फल देने वाला पेड़: हल्की से मध्यम छंटाई करें। सूखी, बीमार, भीड़ वाली और एक-दूसरे को काटती लकड़ी, और सीधी ऊपर बढ़ती डालियां हटाएं (उन्हें किसी मज़बूत बगल की डाली तक काटें)। पास से काटें, ठूंठ न छोड़ें। मिल्ड्यू से सफ़ेद टहनियां काट दें। बड़े कटों पर ${PASTE_HI} ब्रश से लगाएं। दस्ताने पहनें`,
        why: 'फल वाले स्पर तक रोशनी पहुंचती है, और साफ़, ढके कट कैंकर को अंदर नहीं आने देते',
      },
    },
    {
      key: 'nitrogen_spring',
      title: "Give half the year's nitrogen before buds open",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([2, 1], [3, 31]),
      organic: '',
      chemical: UREA,
      dose: HALF_UREA_DOSE,
      why: 'Feeds the new leaves and flowers',
      hi: {
        title: 'कलियां खुलने से पहले साल का आधा नाइट्रोजन दें',
        chemical: UREA_HI,
        why: 'नए पत्तों और फूलों को खुराक मिलती है',
      },
    },
    {
      key: 'summer_water',
      title: 'Water every 7–10 days through the dry summer',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        'Water the basin every 7–10 days from flowering, and weekly once fruit has set. In July and August, keep watering the same way whenever the rains fail. Mulch the basin with dry grass about 10 cm thick',
      why: 'Dry soil now means poor fruit set, heavy June drop and small fruit',
      hi: {
        title: 'सूखी गर्मी में हर 7–10 दिन में पानी दें',
        organic:
          'फूल आने से हर 7–10 दिन में थाले में पानी दें, और फल लगने के बाद हर हफ़्ते। जुलाई और अगस्त में जब भी बारिश न हो, ऐसे ही पानी देते रहें। थाले में लगभग 10 cm मोटा सूखी घास का मल्च बिछाएं',
        why: 'अभी मिट्टी सूखी रही तो फल कम लगेंगे, जून में ज़्यादा गिरेंगे और छोटे रहेंगे',
      },
    },
    {
      key: 'nitrogen_fruitset',
      title: 'Give the other half of the nitrogen after fruit set',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([5, 15], [6, 15]),
      organic: '',
      chemical: UREA,
      dose: HALF_UREA_DOSE,
      why: "Feeds the young fruit and next year's buds",
      hi: {
        title: 'फल लगने के बाद नाइट्रोजन का बाकी आधा दें',
        chemical: UREA_HI,
        why: 'छोटे फलों और अगले साल की कलियों को खुराक मिलती है',
      },
    },
    {
      key: 'thin_fruit',
      title: 'Thin the fruit to one per cluster',
      category: 'PRUNING',
      stages: BEARING,
      when: cal([5, 21], [6, 30]),
      organic:
        'Pick off extra fruitlets by hand, leaving one fruit per cluster about 10 cm apart, or one fruit for every 30–40 leaves',
      why: 'Fewer, bigger fruit, and a crop next year too (heavy crops cause alternate bearing)',
      hi: {
        title: 'हर गुच्छे में एक फल छोड़कर बाकी छांटें',
        organic:
          'फालतू छोटे फल हाथ से तोड़ दें, हर गुच्छे में लगभग 10 cm दूर एक फल छोड़ें, या हर 30–40 पत्तों पर एक फल',
        why: 'कम पर बड़े फल, और अगले साल भी फसल (ज़्यादा फसल से एक साल छोड़कर फल आते हैं)',
      },
    },
    {
      key: 'harvest',
      title: 'Pick apples when the seeds turn brown',
      category: 'GENERAL',
      stages: BEARING,
      when: cal([8, 1], [10, 31]),
      organic:
        'Pick when the fruit has its full size and colour, the seeds inside have turned brown, and the fruit comes off the spur easily. Keep the stalk on. Royal Delicious ripens about 120 days after full bloom and Golden Delicious about 148. Ambri is a late variety. Water in the fortnight before picking for better colour. Pick in the cool morning',
      why: 'Picked too early it lacks taste; too late it drops and keeps badly',
      hi: {
        title: 'बीज भूरे हो जाएं तब सेब तोड़ें',
        organic:
          'जब फल पूरे आकार और रंग का हो, अंदर के बीज भूरे हो गए हों, और फल स्पर से आसानी से उतर जाए, तब तोड़ें। डंठल लगा रहने दें। Royal Delicious पूरे फूल के लगभग 120 दिन बाद पकता है और Golden Delicious लगभग 148 दिन बाद। Ambri देर से पकने वाली किस्म है। अच्छे रंग के लिए तोड़ने से पहले के पखवाड़े में पानी दें। सुबह की ठंडक में तोड़ें',
        why: 'जल्दी तोड़ा तो स्वाद नहीं आता; देर से तोड़ा तो गिर जाता है और ज़्यादा दिन नहीं टिकता',
      },
    },
    ...SIGNS,
  ],
  phases: [
    phase(
      [3, 15],
      [4, 30],
      'bud_break_bloom',
      ['Spraying anything while flowers are open (bees)'],
      [
        'White, mealy shoots and flower clusters (mildew)',
        'Olive-green velvety spots on new leaves (scab)',
      ],
      {
        avoid: ['फूल खुले हों तब कुछ भी स्प्रे करना (मधुमक्खियां)'],
        watch: [
          'सफ़ेद, आटे जैसी टहनियां और फूलों के गुच्छे (मिल्ड्यू)',
          'नए पत्तों पर जैतूनी-हरे मखमली धब्बे (स्कैब)',
        ],
      },
    ),
    phase(
      [5, 1],
      [6, 30],
      'fruit_set',
      ['Letting the basin dry out (June drop)'],
      [
        'Scab on fruitlets',
        'Bronzed leaves (mites)',
        'White wool on bark and cuts (woolly aphid)',
      ],
      {
        avoid: ['थाले को सूखने देना (जून में फल गिरना)'],
        watch: [
          'छोटे फलों पर स्कैब',
          'कांसे जैसे पत्ते (माइट)',
          'छाल और कटों पर सफ़ेद रुई (वूली एफिड)',
        ],
      },
    ),
    phase(
      [7, 1],
      [7, 31],
      'fruit_growth',
      ['Water standing around the trunk (collar rot)'],
      [
        'Dark-brown blotches on older leaves and early leaf drop',
        'Chestnut-red beetles at dusk, laying eggs in the soil (root borer)',
      ],
      {
        avoid: ['तने के आसपास पानी खड़ा रहना (कॉलर रॉट)'],
        watch: [
          'पुराने पत्तों पर गहरे भूरे धब्बे और पत्तों का जल्दी गिरना',
          'शाम को मिट्टी में अंडे देते भूरे-लाल बीटल (रूट बोरर)',
        ],
      },
    ),
    phase(
      [8, 1],
      [10, 31],
      'harvest',
      ['Picking before the seeds turn brown', 'Leaving ripe fruit to drop'],
      [
        'Fruit dropping before picking',
        'Dark-brown leaf blotches and early leaf drop',
        'Root-borer beetles at dusk',
      ],
      {
        avoid: ['बीज भूरे होने से पहले तोड़ना', 'पके फल को गिरने देना'],
        watch: [
          'तोड़ने से पहले फल गिरना',
          'पत्तों पर गहरे भूरे धब्बे और पत्तों का जल्दी गिरना',
          'शाम को रूट बोरर के बीटल',
        ],
      },
    ),
    phase(
      [11, 1],
      [2, 29],
      'dormant',
      ['Leaving fallen leaves under the tree'],
      [
        'Grey, ash-like crust on bark (scale)',
        'Sunken or papery bark patches (canker)',
        'White woolly tufts at cuts and cracks (woolly aphid)',
      ],
      {
        avoid: ['पेड़ के नीचे गिरे पत्ते छोड़ देना'],
        watch: [
          'छाल पर राख जैसी सलेटी पपड़ी (स्केल)',
          'छाल पर धंसे या काग़ज़ जैसे धब्बे (कैंकर)',
          'कटों और दरारों पर सफ़ेद रुई जैसे गुच्छे (वूली एफिड)',
        ],
      },
    ),
  ],
};

export const APPLE_CARE: FamilyCare = {
  family: 'apple',
  sources: [
    'NIPHM/DPPQS AESA-based IPM package, Apple (2014)',
    'ICAR-CITH Srinagar, Scientific Apple Cultivation, Technical Bulletin 01/2015',
    'DPPQS IPM Package of Practices for Apple (Sept 2022)',
    'SKUAST-Jammu Package of Practices for Sub-tropical and Temperate Fruits, apple pp.68–82',
    'SKUAST POP High Density Apple',
    'National Horticulture Board apple sheets app002–app008',
    'PAU Package of Practices for Cultivation of Fruits (Bordeaux paste recipe, p.10)',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: [
    'HILLS_COOL',
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
  ],
  pendingRegions: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
  ],
  regions: { HILLS_COOL },
};
