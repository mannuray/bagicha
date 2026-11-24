import type {
  Anchor,
  Dose,
  FamilyCare,
  PhaseWindow,
  RegionCare,
  TreeCareItem,
} from '../../domain/tree-care';

/**
 * Peach care, transcribed from the source-checked table approved by the owner
 * on 2026-11-23 with every recommendation (docs/plant-care/peach.md, with a
 * source for every row). Change it only through the add-plant playbook.
 *
 * NORTH_INDIA = PAU (SKUAST subtropical as backing): its doses are banded by
 * age, so they are row text with no `dose` (Q1). HILLS_COOL = UHF, SKUAST and
 * HP-SS: only the four month-based rows are dated; the bloom-tied urea split
 * and hand thinning stay on the plant page (Q2). The hills dose is UHF's
 * per-year rule, up to 7 years (Q3). No dormant Bordeaux spray (Q4), no
 * oxydemeton-methyl (Q5), no growth regulators (Q6); Bordeaux paint stays as
 * the optional second coat (Q7). No chemical spray survives the label check.
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

/** Rule 2.1 (UHF p.26): basin placement for manure and fertiliser. */
const BASIN =
  'Spread it in the tree basin, about 30 cm from the trunk, mix it in lightly and water after';
/** Rule 2.3: Bordeaux paste (PAU p.10, scaled down 1:40). */
const PASTE =
  'Bordeaux paste (dissolve 50 g copper sulphate in 375 ml water; in a second pot, slake 75 g quicklime slowly with a little of another 375 ml of water, then add the rest; mix the two and stir; plastic or clay pot, never iron)';
/** Rule 2.3: Bordeaux paint (PAU p.10, scaled down 1:20); lasts about a year. */
const PAINT =
  'Bordeaux paint (heat about 70 g copper sulphate crystals on an iron tawa until they crumble into a white powder and weigh out 50 g; mix it well with 100 g hydrated lime dust, then stir in 150 ml boiled linseed oil until smooth; it keeps in a closed pot)';
const BASIN_HI =
  'इसे पेड़ के थाले में, तने से लगभग 30 cm दूर फैलाएं, हल्का मिला दें और बाद में पानी दें';
const PASTE_HI =
  'Bordeaux paste (50 g copper sulphate को 375 ml पानी में घोलें; दूसरे बर्तन में 75 g quicklime (कली चूना) को अलग से लिए 375 ml पानी में से थोड़ा-थोड़ा डालकर धीरे-धीरे बुझाएं, फिर बाकी पानी डालें; दोनों को मिलाकर चलाएं; प्लास्टिक या मिट्टी का बर्तन लें, लोहे का कभी नहीं)';
const PAINT_HI =
  'Bordeaux paint (लगभग 70 g copper sulphate के दाने लोहे के तवे पर तब तक गरम करें जब तक वे भुरभुरे होकर सफ़ेद पाउडर न बन जाएं, फिर 50 g तौल लें; इसे 100 g hydrated lime के पाउडर में अच्छी तरह मिलाएं, फिर 150 ml उबला हुआ अलसी का तेल (linseed oil) डालकर चिकना होने तक चलाएं; यह बंद बर्तन में रखा रहता है)';
const HALF_UREA_BANDS_HI =
  '90–180 g (1–2 साल), 270–500 g (3–4), 500 g (5+), थाले में फैलाकर पानी दें। दस्ताने पहनें';
/** PAU p.83: half the year's urea, by age band (Q1: text, no `dose`). */
const HALF_UREA_BANDS =
  '90–180 g (1–2 years), 270–500 g (3–4), 500 g (5+), spread in the basin and watered in. Wear gloves';

/** UHF p.35: SSP 219 g + MOP 167 g per year of age, up to 7 years (Q3). */
const HILLS_PK_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'SSP', grams: 219 },
    { what: 'MOP', grams: 167 },
  ],
  maxAgeYears: 7,
};
/** UHF p.35: half of 152 g urea per year of age, up to 7 years (Q3). */
const HILLS_HALF_UREA_DOSE: Dose = {
  organic: [],
  chemical: [{ what: 'urea', grams: 76 }],
  maxAgeYears: 7,
};

const APHIDS_HI = {
  title: 'कलियों और टहनियों से माहू धो दें',
  conditional:
    'टहनियों के सिरों पर पत्ते मुड़ना और पीले पड़ना, या कलियों, टहनियों या छाल पर हरे या काले माहू के झुंड',
  organic:
    'टहनियों और पत्तों के नीचे की तरफ़ तेज़ धार से पानी मारें। कसकर मुड़े सिरे काटकर नष्ट करें',
  why: 'माहू कलियों और नई टहनियों का रस चूसते हैं और पत्ते मोड़ देते हैं',
};
/** C1: shared by both regions; North adds PAU's active months. */
const APHIDS: TreeCareItem = {
  key: 'aphids',
  title: 'Wash aphids off buds and shoots',
  category: 'PROTECTION',
  stages: BEARING,
  when: ALL_YEAR,
  conditional:
    'Leaves curling and yellowing at the shoot tips, or clusters of green or black aphids on buds, shoots or bark',
  organic:
    'Hose the shoots and the undersides of leaves with a strong jet of water. Snip off and destroy tightly curled tips',
  why: 'Aphids suck sap from buds and new shoots and curl the leaves',
  hi: APHIDS_HI,
};

/** "Only if you see it" in both regions (C4, C5, C6, C9). */
const SIGNS_BOTH: TreeCareItem[] = [
  {
    key: 'gummosis',
    title: 'Scrape gummy cankers and cover with paste',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Amber gum oozing from bark, branches or fruit; sunken cankers',
    organic: `Scrape the weeping canker back to clean wood with a clean knife. Cover it with ${PASTE}. Do this at the end of the dormant season and again before the rains, and on any new lesions. Burn the scrapings. Wear gloves`,
    why: 'Gum oozes from cankers that weaken the bark and let disease in',
    hi: {
      title: 'गोंद वाले कैंकर खुरचें और पेस्ट लगाएं',
      conditional:
        'छाल, डालियों या फल से पीला-भूरा गोंद निकलना; धंसे हुए कैंकर',
      organic: `रिसते कैंकर को साफ़ चाकू से खुरचकर साफ़ लकड़ी तक ले जाएं। उस पर ${PASTE_HI} लगाएं। यह पत्तों के बिना वाले मौसम के आख़िर में और बारिश से पहले फिर करें, और हर नए घाव पर भी। खुरचन जला दें। दस्ताने पहनें`,
      why: 'गोंद उन कैंकर से निकलता है जो छाल को कमज़ोर करते हैं और बीमारी को अंदर आने देते हैं',
    },
  },
  {
    key: 'flat_headed_borer',
    title: 'Clear borer holes and shade the trunk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Gum globules and small holes on the trunk or main branches; bark loose or split',
    organic:
      "Clear each hole with a flexible wire. Push in a cotton wick soaked in petrol and seal the hole with wet mud. Cover the sun-facing trunk and main branches with dry grass or gunny from March to October. Train the tree so direct sun doesn't fall on the trunk",
    why: 'Borer grubs tunnel under the bark of sun-scorched trunks and branches',
    hi: {
      title: 'बोरर के छेद साफ़ करें और तने को छाया दें',
      conditional:
        'तने या मुख्य डालियों पर गोंद की बूंदें और छोटे छेद; छाल ढीली या फटी',
      organic:
        'हर छेद को लचीले तार से साफ़ करें। पेट्रोल में भीगी रुई की बत्ती अंदर डालें और छेद को गीली मिट्टी से बंद करें। मार्च से अक्टूबर तक धूप वाली तरफ़ के तने और मुख्य डालियों को सूखी घास या टाट से ढकें। पेड़ को ऐसे साधें कि तने पर सीधी धूप न पड़े',
      why: 'बोरर की सुंडियां धूप से झुलसे तनों और डालियों की छाल के नीचे सुरंग बनाती हैं',
    },
  },
  {
    key: 'beetles',
    title: 'Shake off leaf-eating beetles at dusk',
    category: 'PROTECTION',
    stages: BOTH,
    when: ALL_YEAR,
    conditional:
      'Leaves eaten at night after the first monsoon rains; fruit scraped at the tip',
    organic:
      'At dusk, spread a sheet under young trees and shake them. Drop the beetles into water with a little kerosene. Pick grubs out of the basin soil when you dig',
    why: 'Beetles strip the leaves at night once the monsoon breaks',
    hi: {
      title: 'शाम को पत्ते खाने वाले बीटल झाड़कर गिराएं',
      conditional:
        'मानसून की पहली बारिश के बाद रात में पत्ते खाए हुए; फल सिरे पर खुरचे हुए',
      organic:
        'शाम को छोटे पेड़ों के नीचे चादर बिछाकर उन्हें हिलाएं। बीटल को थोड़े मिट्टी के तेल (kerosene) वाले पानी में डाल दें। थाले की मिट्टी खोदते समय उसमें से सुंडियां चुनकर निकालें',
      why: 'मानसून आते ही बीटल रात में पत्ते साफ़ कर देते हैं',
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
    why: 'The disease carries over on fallen leaves',
    hi: {
      title: 'शॉट-होल धब्बों वाले पत्ते हटाएं',
      conditional: 'पत्तों पर भूरे धब्बे जो झड़कर छेद छोड़ देते हैं',
      organic: 'गिरे पत्ते इकट्ठा करके नष्ट करें',
      why: 'यह बीमारी गिरे पत्तों पर बची रहती है',
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
      organic: `Well-rotted FYM by age: 10–15 kg (1–2 years), 20–25 kg (3–4), 30 kg (5+). ${BASIN}`,
      chemical:
        'SSP and MOP by age, in the same basin: SSP 190–380 g and MOP 150–300 g (1–2 years), SSP 570–760 g and MOP 450–830 g (3–4), SSP 760 g and MOP 830 g (5+). Wear gloves',
      why: 'Manure and slow nutrients go in while the tree is bare, ready for spring',
      hi: {
        title: 'साल की खाद, SSP और पोटाश डालें',
        organic: `अच्छी सड़ी गोबर की खाद (FYM) उम्र के हिसाब से: 10–15 kg (1–2 साल), 20–25 kg (3–4), 30 kg (5+)। ${BASIN_HI}`,
        chemical:
          'उम्र के हिसाब से SSP और MOP, उसी थाले में: SSP 190–380 g और MOP 150–300 g (1–2 साल), SSP 570–760 g और MOP 450–830 g (3–4), SSP 760 g और MOP 830 g (5+)। दस्ताने पहनें',
        why: 'खाद और धीमे पोषक तत्व तब डाले जाते हैं जब पेड़ बिना पत्तों का हो, ताकि वसंत तक तैयार रहें',
      },
    },
    {
      key: 'prune_jan',
      title: 'Prune and train the bare tree in January',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([1, 1], [1, 31]),
      organic: `Young: at planting, cut back to about 90 cm and cut side shoots to 1–2 buds. At the first January pruning, keep 4–5 well-spaced branches around the stem, the lowest 45 cm up, and remove the rest. Next year keep 3–4 more on the central stem, then cut the top back to an outward-growing side branch. Bearing: thin out about 40% of last year's shoots; shorten long, hanging and badly placed branches. Paste every cut thicker than 5 cm with ${PASTE}. A week or two later, paint over it with ${PAINT}. Wear gloves`,
      why: 'Fruit comes only on one-year-old shoots; pruning makes new ones and bigger fruit',
      hi: {
        title: 'जनवरी में बिना पत्तों के पेड़ को छांटें और आकार दें',
        organic: `छोटा पेड़: लगाते समय लगभग 90 cm पर काट दें और बगल की टहनियों को 1–2 कलियों तक छोटा करें। जनवरी की पहली छंटाई में तने के चारों ओर 4–5 अच्छी दूरी वाली डालियां रखें, सबसे नीचे वाली 45 cm ऊपर, और बाकी हटा दें। अगले साल बीच के तने पर 3–4 और रखें, फिर ऊपरी हिस्से को बाहर की ओर बढ़ती किसी बगल की डाली तक काट दें। फल देने वाला पेड़: पिछले साल की लगभग 40% टहनियां छांटकर निकालें; लंबी, लटकती और गलत जगह की डालियां छोटी करें। 5 cm से मोटे हर कट पर ${PASTE_HI} लगाएं। एक-दो हफ़्ते बाद उसके ऊपर ${PAINT_HI} पोतें। दस्ताने पहनें`,
        why: 'फल सिर्फ़ एक साल पुरानी टहनियों पर आता है; छंटाई से नई टहनियां और बड़े फल मिलते हैं',
      },
    },
    {
      key: 'urea_jan',
      title: "Give half the year's urea after pruning",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([1, 1], [1, 31]),
      organic: '',
      chemical: `Half the year's urea: ${HALF_UREA_BANDS}`,
      why: 'Feeds the spring flush and the flowers',
      hi: {
        title: 'छंटाई के बाद साल का आधा urea दें',
        chemical: `साल का आधा urea: ${HALF_UREA_BANDS_HI}`,
        why: 'वसंत की नई बढ़वार और फूलों को खुराक मिलती है',
      },
    },
    {
      key: 'urea_mar',
      title: 'Give the other half of the urea after fruit set',
      category: 'FEEDING',
      stages: BOTH,
      when: cal([3, 1], [3, 31]),
      organic:
        'After this feed, mulch the basin with 10 cm of paddy straw to hold moisture and keep weeds down',
      chemical: `The other half of the urea: ${HALF_UREA_BANDS}`,
      why: 'Feeds the young fruit',
      hi: {
        title: 'फल लगने के बाद urea का बाकी आधा दें',
        organic:
          'यह खाद देने के बाद थाले में 10 cm धान की पुआल का मल्च बिछाएं, ताकि नमी बनी रहे और खरपतवार न उगें',
        chemical: `urea का बाकी आधा: ${HALF_UREA_BANDS_HI}`,
        why: 'छोटे फलों को खुराक मिलती है',
      },
    },
    {
      key: 'thin_fruit',
      title: "Thin the fruit to a hand's width apart",
      category: 'PRUNING',
      stages: BEARING,
      when: cal([3, 8], [3, 31]),
      organic:
        'Shake each fruiting branch gently first: weak fruit drops by itself. Then pick off fruit from the base of the branch to the tip, leaving one every 10–15 cm. Finish before the stone inside hardens. Partap: weeks 2–3 of March. Shan-i-Punjab: weeks 3–4',
      why: 'An unthinned tree gives small, poor fruit and weakens',
      hi: {
        title: 'फल छांटें, एक हथेली की दूरी पर एक रखें',
        organic:
          'पहले फल वाली हर डाली को धीरे से हिलाएं: कमज़ोर फल अपने आप गिर जाते हैं। फिर डाली के निचले हिस्से से सिरे तक फल तोड़ें, हर 10–15 cm पर एक छोड़ें। अंदर की गुठली सख़्त होने से पहले यह काम पूरा करें। Partap: मार्च का दूसरा–तीसरा हफ़्ता। Shan-i-Punjab: तीसरा–चौथा हफ़्ता',
        why: 'जिस पेड़ के फल नहीं छांटे जाते, उस पर छोटे, ख़राब फल आते हैं और पेड़ कमज़ोर होता है',
      },
    },
    {
      key: 'water_fruit',
      title: 'Water often while the fruit fills, until picking',
      category: 'WATERING',
      stages: BEARING,
      when: cal([3, 1], [5, 7]),
      organic:
        'Water weekly for the first 3–4 weeks after fruit set. From the second week of April until picking, water every 3–4 days. Never let the tree go dry in the last 25–30 days before the fruit ripens. Most critical: end March to 3rd week April (Partap, Florda Prince); mid April to 1st week May (Shan-i-Punjab)',
      why: 'The fruit puts on most of its weight in the last month',
      hi: {
        title: 'फल भरते समय तोड़ने तक बार-बार पानी दें',
        organic:
          'फल लगने के बाद पहले 3–4 हफ़्ते हर हफ़्ते पानी दें। अप्रैल के दूसरे हफ़्ते से तोड़ने तक हर 3–4 दिन में पानी दें। फल पकने से पहले के आख़िरी 25–30 दिन पेड़ को कभी सूखने न दें। सबसे ज़रूरी समय: मार्च के आख़िर से अप्रैल का तीसरा हफ़्ता (Partap, Florda Prince); अप्रैल के बीच से मई का पहला हफ़्ता (Shan-i-Punjab)',
        why: 'फल का ज़्यादातर वज़न आख़िरी महीने में बढ़ता है',
      },
    },
    {
      key: 'fruit_fly_may',
      title: 'Hang a fruit fly trap; bury fallen fruit',
      category: 'PROTECTION',
      stages: BEARING,
      when: cal([5, 1], [5, 7]),
      organic:
        "Hang a PAU fruit fly trap (a methyl eugenol lure in a trap, not sprayed on the tree) in the first week of May; recharge it after 30 days if needed. Pick fruit as it ripens; don't leave ripe fruit on the tree. Pick up fallen fruit every few days and bury it at least 60 cm deep. After the last picking, dig the basin shallowly to expose pupae",
      why: 'Fruit flies sting fruit near maturity from early May; the maggots rot it',
      hi: {
        title: 'फल मक्खी का ट्रैप टांगें; गिरे फल दबा दें',
        organic:
          'मई के पहले हफ़्ते में PAU का फल मक्खी ट्रैप टांगें (ट्रैप में methyl eugenol का lure, पेड़ पर स्प्रे नहीं); ज़रूरत हो तो 30 दिन बाद फिर भरें। फल पकते ही तोड़ें; पके फल पेड़ पर न छोड़ें। हर कुछ दिन में गिरे फल उठाकर कम से कम 60 cm गहरा दबा दें। आख़िरी तुड़ाई के बाद थाले को हल्का खोदें ताकि प्यूपा बाहर आ जाएं',
        why: 'मई की शुरुआत से फल मक्खियां पकने के क़रीब फलों में डंक मारती हैं; उनके कीड़े फल सड़ा देते हैं',
      },
    },
    {
      key: 'harvest',
      title: 'Pick peaches as the green turns yellow',
      category: 'GENERAL',
      stages: BEARING,
      when: cal([4, 15], [5, 15]),
      organic:
        'Pick when the ground colour turns from green to yellow and the fruit gives slightly between cupped hands. White-fleshed kinds turn straw-coloured with a pink blush. Fruit ripens over 3–4 pickings. Cool picked fruit in shade',
      why: 'Peaches ripen unevenly; ripe fruit left on the tree draws fruit fly',
      hi: {
        title: 'हरा रंग पीला होने लगे तब आड़ू तोड़ें',
        organic:
          'जब फल का निचला रंग हरे से पीला हो जाए और दोनों हथेलियों के बीच लेने पर फल थोड़ा दबे, तब तोड़ें। सफ़ेद गूदे वाली किस्में गुलाबी झलक के साथ पुआल जैसे रंग की हो जाती हैं। फल 3–4 बार की तुड़ाई में पकता है। तोड़े फल छाया में ठंडे करें',
        why: 'आड़ू एक साथ नहीं पकते; पेड़ पर छूटे पके फल फल मक्खी को बुलाते हैं',
      },
    },
    {
      ...APHIDS,
      organic: `${APHIDS.organic}. Leaf curl aphid is active March–May, black aphid on bark April–June`,
      hi: {
        ...APHIDS_HI,
        organic: `${APHIDS_HI.organic}। पत्ता मोड़ने वाला माहू मार्च–मई में और छाल पर काला माहू अप्रैल–जून में सक्रिय रहता है`,
      },
    },
    {
      key: 'iron_chlorosis',
      title: 'Spray iron sulphate on yellowing new leaves',
      category: 'FEEDING',
      stages: BOTH,
      when: ALL_YEAR,
      conditional:
        'New leaves at the shoot tips yellow between the veins, or nearly white',
      organic:
        'Spray ferrous sulphate 3 g per litre of water on the new flush: in the spring flush (April), the summer flush (June) and the late flush (August–September). It is a nutrient, so there is no waiting period. Wear gloves',
      why: 'Iron runs short on light, high-pH soils from the second half of March',
      hi: {
        title: 'पीले होते नए पत्तों पर iron sulphate स्प्रे करें',
        conditional:
          'टहनियों के सिरों पर नए पत्ते नसों के बीच पीले, या लगभग सफ़ेद',
        organic:
          'नई बढ़वार पर ferrous sulphate 3 g प्रति लीटर पानी स्प्रे करें: वसंत की बढ़वार (अप्रैल), गर्मी की बढ़वार (जून) और देर की बढ़वार (अगस्त–सितंबर) में। यह पोषक तत्व है, इसलिए इंतज़ार की कोई अवधि नहीं। दस्ताने पहनें',
        why: 'हल्की, ज़्यादा pH वाली मिट्टी में मार्च के दूसरे आधे से iron की कमी होने लगती है',
      },
    },
    ...SIGNS_BOTH,
    {
      key: 'crown_gall',
      title: 'Remove a tree with crown gall',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional:
        'Lumps or tumours at the base of the trunk, on roots or at the graft',
      organic:
        'Dig out and destroy the affected tree. Avoid injuring the roots and crown when digging. Buy plants from a reliable nursery',
      why: 'Crown gall gets in through wounds and has no cure',
      hi: {
        title: 'क्राउन गॉल वाला पेड़ हटा दें',
        conditional: 'तने के निचले हिस्से, जड़ों या ग्राफ्ट पर गांठें या उभार',
        organic:
          'प्रभावित पेड़ खोदकर नष्ट करें। खुदाई करते समय जड़ों और तने के निचले हिस्से (crown) को चोट न पहुंचाएं। पौधे भरोसेमंद नर्सरी से ही ख़रीदें',
        why: 'क्राउन गॉल घावों से अंदर जाता है और इसका कोई इलाज नहीं है',
      },
    },
  ],
  phases: [
    phase(
      [12, 1],
      [1, 31],
      'dormant',
      [
        'Injuring roots or the crown while digging (crown gall gets in through wounds)',
      ],
      ['Tumours at the crown or graft'],
      {
        avoid: [
          'जड़ों या तने के निचले हिस्से को खुदाई में चोट पहुंचाना (क्राउन गॉल घावों से अंदर जाता है)',
        ],
        watch: ['तने के निचले हिस्से या ग्राफ्ट पर गांठें'],
      },
    ),
    phase(
      [3, 1],
      [5, 31],
      'fruit_growth',
      ['Letting the soil dry, worst in the last 25–30 days before picking'],
      [
        'Curled leaves from aphids (Mar–May)',
        'Black aphids on bark (Apr–Jun)',
        'Flat-headed borer adults from mid-March',
        'Fruit fly from early May',
      ],
      {
        avoid: [
          'मिट्टी सूखने देना, सबसे बुरा तोड़ने से पहले के आख़िरी 25–30 दिनों में',
        ],
        watch: [
          'माहू से मुड़े पत्ते (मार्च–मई)',
          'छाल पर काले माहू (अप्रैल–जून)',
          'मार्च के बीच से flat-headed borer के वयस्क कीट',
          'मई की शुरुआत से फल मक्खी',
        ],
      },
    ),
    phase(
      [7, 1],
      [9, 30],
      'monsoon',
      ['Water standing in the basin (peach dislikes wet, heavy soil)'],
      [
        'Leaf-eating beetles at night once the monsoon breaks',
        'Yellow new leaves (iron)',
      ],
      {
        avoid: [
          'थाले में पानी खड़ा रहना (आड़ू को गीली, भारी मिट्टी पसंद नहीं)',
        ],
        watch: [
          'मानसून आते ही रात में पत्ते खाने वाले बीटल',
          'पीले नए पत्ते (iron)',
        ],
      },
    ),
  ],
};

const HILLS_COOL: RegionCare = {
  items: [
    {
      key: 'manure_dec',
      title: "Spread the year's manure, SSP and potash",
      category: 'FEEDING',
      stages: BOTH,
      when: cal([12, 1], [12, 31]),
      organic: `Well-rotted FYM: 10 kg at 1 year, 5 kg more each year, 40 kg from 7 years. ${BASIN}`,
      chemical: 'SSP and MOP in the same basin. Wear gloves',
      dose: HILLS_PK_DOSE,
      why: 'Manure and slow nutrients go in while the tree is bare',
      hi: {
        title: 'साल की खाद, SSP और पोटाश डालें',
        organic: `अच्छी सड़ी गोबर की खाद (FYM): 1 साल पर 10 kg, हर साल 5 kg ज़्यादा, 7 साल से 40 kg। ${BASIN_HI}`,
        chemical: 'उसी थाले में SSP और MOP। दस्ताने पहनें',
        why: 'खाद और धीमे पोषक तत्व तब डाले जाते हैं जब पेड़ बिना पत्तों का हो',
      },
    },
    {
      key: 'prune_jan',
      title: 'Prune and train the bare tree in January',
      category: 'PRUNING',
      stages: BOTH,
      when: cal([1, 1], [1, 31]),
      organic: `Young (open centre): at planting, cut back to 40–60 cm. First winter: keep 3–4 wide-angled, well-spaced branches, remove the central stem, and shorten the kept branches by a quarter to a half. Second winter: keep 2–3 side branches on each, 30–40 cm apart. Bearing: thin out 40–50% of last year's shoots and shorten the rest; aim for 30–40 cm of new growth a year. Remove dead, diseased and broken branches. Paste every cut thicker than your thumb with ${PASTE}. Wear gloves`,
      why: "Fruit comes only on last season's shoots; a branch that has fruited never fruits again",
      hi: {
        title: 'जनवरी में बिना पत्तों के पेड़ को छांटें और आकार दें',
        organic: `छोटा पेड़ (open centre): लगाते समय 40–60 cm पर काट दें। पहली सर्दी: 3–4 चौड़े कोण वाली, अच्छी दूरी की डालियां रखें, बीच का तना हटा दें, और रखी डालियों को एक-चौथाई से आधा तक छोटा करें। दूसरी सर्दी: हर डाली पर 2–3 बगल की डालियां रखें, 30–40 cm दूर। फल देने वाला पेड़: पिछले साल की 40–50% टहनियां छांटकर निकालें और बाकी छोटी करें; साल में 30–40 cm नई बढ़वार का लक्ष्य रखें। सूखी, बीमार और टूटी डालियां हटा दें। अंगूठे से मोटे हर कट पर ${PASTE_HI} लगाएं। दस्ताने पहनें`,
        why: 'फल सिर्फ़ पिछले मौसम की टहनियों पर आता है; जिस डाली पर एक बार फल आ गया, उस पर फिर कभी नहीं आता',
      },
    },
    {
      key: 'water_apr_jun',
      title: 'Water every 8–10 days while fruit grows',
      category: 'WATERING',
      stages: BOTH,
      when: cal([4, 1], [6, 30]),
      organic:
        'Water the basin every 8–10 days from April to June. Mulch the basin with 10 cm of dry grass to hold moisture. Never let water stand: peach roots die if flooded in warm weather',
      why: 'Dry soil in the hot months drops fruit and shrinks it',
      hi: {
        title: 'फल बढ़ते समय हर 8–10 दिन में पानी दें',
        organic:
          'अप्रैल से जून तक हर 8–10 दिन में थाले में पानी दें। नमी बनाए रखने के लिए थाले में 10 cm सूखी घास का मल्च बिछाएं। पानी कभी खड़ा न रहने दें: गर्मी में पानी भरने से आड़ू की जड़ें मर जाती हैं',
        why: 'गर्म महीनों में सूखी मिट्टी से फल गिरते हैं और छोटे रह जाते हैं',
      },
    },
    {
      key: 'fruit_fly_trap',
      title: 'Hang a fruit fly trap; bury fallen fruit',
      category: 'PROTECTION',
      stages: BEARING,
      when: cal([4, 1], [8, 31]),
      organic:
        "Hang a methyl eugenol trap in the tree from April; refresh the lure as the pack says. Pick fruit as soon as it is ripe; don't delay the harvest. Collect fallen and stung fruit every week and bury it in a deep pit",
      why: 'Fruit fly is a major pest of peach; late varieties suffer most',
      hi: {
        title: 'फल मक्खी का ट्रैप टांगें; गिरे फल दबा दें',
        organic:
          'अप्रैल से पेड़ में methyl eugenol ट्रैप टांगें; पैकेट पर लिखे अनुसार lure बदलें। फल पकते ही तोड़ें; तुड़ाई में देर न करें। हर हफ़्ते गिरे और डंक लगे फल इकट्ठा करके गहरे गड्ढे में दबा दें',
        why: 'फल मक्खी आड़ू का बड़ा कीट है; देर वाली किस्मों को सबसे ज़्यादा नुकसान होता है',
      },
    },
    APHIDS,
    {
      key: 'leaf_curl',
      title: 'Pick off leaves puckered by leaf curl',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional:
        'Young leaves thick, puckered and curled, turning pink or red-bronze',
      organic:
        'Pick off and destroy curled leaves as they appear. Rake up and destroy fallen leaves in autumn',
      why: 'Leaf curl fungus carries over on the tree and fallen leaves',
      hi: {
        title: 'लीफ कर्ल से सिकुड़े पत्ते तोड़ दें',
        conditional:
          'नए पत्ते मोटे, सिकुड़े और मुड़े हुए, गुलाबी या लाल-कांसे रंग के होते हुए',
        organic:
          'मुड़े पत्ते दिखते ही तोड़कर नष्ट करें। पतझड़ में गिरे पत्ते बटोरकर नष्ट करें',
        why: 'लीफ कर्ल की फफूंद पेड़ पर और गिरे पत्तों पर बची रहती है',
      },
    },
    ...SIGNS_BOTH,
    {
      key: 'scale',
      title: 'Cut out branches crusted with scale',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional:
        'Grey scaly crusts on bark, or grey spots ringed with red on fruit',
      organic: 'Cut out and destroy branches thick with scale',
      why: 'Scale insects suck sap from the bark and weaken branches',
      hi: {
        title: 'स्केल से ढकी डालियां काट दें',
        conditional: 'छाल पर सलेटी पपड़ी, या फल पर लाल घेरे वाले सलेटी धब्बे',
        organic: 'ज़्यादा स्केल वाली डालियां काटकर नष्ट करें',
        why: 'स्केल कीट छाल का रस चूसते हैं और डालियों को कमज़ोर करते हैं',
      },
    },
    {
      key: 'fruit_fly_hills',
      title: 'Bury stung fruit; pick on time',
      category: 'PROTECTION',
      stages: BEARING,
      when: ALL_YEAR,
      conditional:
        'Fruit with small puncture marks that ooze brown juice, or fallen soft fruit',
      organic:
        'Pick ripe fruit without delay. Collect fallen and stung fruit weekly and bury it in a deep pit. Keep the fruit fly trap up',
      why: 'Maggots in stung fruit become the next round of flies',
      hi: {
        title: 'डंक लगे फल दबाएं; समय पर तोड़ें',
        conditional:
          'फल पर छोटे छेद के निशान जिनसे भूरा रस निकले, या गिरे हुए नरम फल',
        organic:
          'पके फल बिना देर तोड़ें। हर हफ़्ते गिरे और डंक लगे फल इकट्ठा करके गहरे गड्ढे में दबा दें। फल मक्खी का ट्रैप लगा रहने दें',
        why: 'डंक लगे फलों के कीड़े ही मक्खियों की अगली पीढ़ी बनते हैं',
      },
    },
    {
      key: 'collar_rot',
      title: 'Open up and paint a rotting trunk base',
      category: 'PROTECTION',
      stages: BOTH,
      when: ALL_YEAR,
      conditional: 'Bark rotting at the base of the trunk, with bronzed leaves',
      organic: `In November–December, scrape the soil away from the collar and expose the rotted part to the sun. Scrape off the dead bark and cover the wound with ${PAINT}. Don't let water pool at the trunk. Wear gloves`,
      why: 'Collar rot girdles the trunk where water stands',
      hi: {
        title: 'सड़ते तने के निचले हिस्से को खोलें और पेंट करें',
        conditional:
          'तने के निचले हिस्से पर छाल सड़ रही हो, और पत्ते कांसे रंग के',
        organic: `नवंबर–दिसंबर में तने के निचले हिस्से (collar) से मिट्टी हटाकर सड़े हिस्से को धूप लगने दें। मरी छाल खुरचकर घाव पर ${PAINT_HI} लगाएं। तने के पास पानी जमा न होने दें। दस्ताने पहनें`,
        why: 'जहां पानी खड़ा रहता है, वहां कॉलर रॉट तने को चारों ओर से खा जाता है',
      },
    },
    {
      key: 'urea_bloom',
      title: 'Give half the urea as buds swell',
      category: 'FEEDING',
      stages: BEARING,
      when: ALL_YEAR,
      conditional: 'Flower buds swelling, about 2–3 weeks before they open',
      organic: '',
      chemical:
        'Urea in the basin. Give the second half 3 weeks to a month after fruit set. Wear gloves',
      dose: HILLS_HALF_UREA_DOSE,
      why: 'Feeds the flowers and the setting fruit; bloom shifts by weeks with altitude',
      hi: {
        title: 'कलियां फूलने लगें तो आधा urea दें',
        conditional: 'फूल की कलियां फूल रही हों, खिलने से लगभग 2–3 हफ़्ते पहले',
        chemical:
          'थाले में urea। बाकी आधा फल लगने के 3 हफ़्ते से एक महीने बाद दें। दस्ताने पहनें',
        why: 'फूलों और लगते फलों को खुराक मिलती है; ऊंचाई के हिसाब से फूल आने का समय हफ़्तों आगे-पीछे होता है',
      },
    },
    {
      key: 'thin_hills',
      title: 'Thin crowded young fruit',
      category: 'PRUNING',
      stages: BEARING,
      when: ALL_YEAR,
      conditional: 'Fruit set very heavily, in clusters',
      organic:
        'Shake the branches first. Then thin from the top of each branch down, leaving fruit 5–7.5 cm apart (about 30–40 leaves per fruit). Finish before the stone hardens',
      why: 'Crowded fruit stays small and weakens the tree',
      hi: {
        title: 'भीड़ वाले छोटे फल छांटें',
        conditional: 'फल बहुत ज़्यादा, गुच्छों में लगे हों',
        organic:
          'पहले डालियां हिलाएं। फिर हर डाली के ऊपर से नीचे तक फल छांटें, फलों के बीच 5–7.5 cm दूरी छोड़ें (हर फल पर लगभग 30–40 पत्ते)। गुठली सख़्त होने से पहले काम पूरा करें',
        why: 'भीड़ वाले फल छोटे रहते हैं और पेड़ को कमज़ोर करते हैं',
      },
    },
  ],
  phases: [
    phase(
      [12, 1],
      [2, 29],
      'dormant',
      ['Planting or pruning in hard frost', 'Waterlogged basins'],
      ['Gum oozing from bark', 'Scale on bark'],
      {
        avoid: [
          'कड़े पाले में पौधा लगाना या छंटाई करना',
          'थाले में पानी भरा रहना',
        ],
        watch: ['छाल से गोंद निकलना', 'छाल पर स्केल'],
      },
    ),
    phase(
      [4, 1],
      [6, 30],
      'fruit_growth',
      ['Letting the soil dry', 'Standing water'],
      [
        'Curled, puckered red leaves (leaf curl)',
        'Aphids at pink bud',
        'Fruit fly from April',
      ],
      {
        avoid: ['मिट्टी सूखने देना', 'पानी खड़ा रहना'],
        watch: [
          'मुड़े, सिकुड़े लाल पत्ते (लीफ कर्ल)',
          'गुलाबी कली पर माहू',
          'अप्रैल से फल मक्खी',
        ],
      },
    ),
    phase(
      [7, 1],
      [8, 31],
      'monsoon',
      ['Water pooling at the collar'],
      [
        'Bark rotting at the collar',
        'Gum from cankers',
        'Leaf-eating beetles after the first rains',
      ],
      {
        avoid: ['तने के निचले हिस्से पर पानी जमा होना'],
        watch: [
          'तने के निचले हिस्से पर सड़ती छाल',
          'कैंकर से गोंद',
          'पहली बारिश के बाद पत्ते खाने वाले बीटल',
        ],
      },
    ),
  ],
};

export const PEACH_CARE: FamilyCare = {
  family: 'peach',
  sources: [
    'PAU Package of Practices for Cultivation of Fruits, peach pp.77–87, Bordeaux paste and paint p.10',
    'Dr YS Parmar UHF / HPHDP, Cultivation practices for stone fruits & walnut, peach pp.27–36, diseases pp.62–66, pests pp.68–69',
    'Dept of Horticulture HP with Dr YSPUHF, Spray Schedule 2022 (Peach, Plum, Apricot & Almond)',
    'SKUAST-Jammu Package of Practices for Fruit Crops (2020), peach pp.102–107',
    'Dr YSPUHF Package of Practices for Subtropical Fruit Crops of HP (2022), plum p.109 (cut paste size)',
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
  ],
  grownIn: ['NORTH_INDIA', 'HILLS_COOL'],
  regions: { NORTH_INDIA, HILLS_COOL },
};
