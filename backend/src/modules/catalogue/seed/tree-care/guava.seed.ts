import { ALL_YEAR, groupCare, type ItemSpec, type PhaseSpec } from './build';
import type { Dose, FamilyCare, RegionCare } from '../../domain/tree-care';

/**
 * Guava care, transcribed from the source-checked table approved by the owner
 * on 2026-11-12 (docs/plant-care/guava.md, with a source for every row).
 * Change it only through the add-plant playbook: source check, then the
 * owner's yes.
 *
 * Timing groups: A = North (PAU's fixed dates that skip the rainy-season crop
 * for a winter crop); S = South Deccan (TNAU's two crops, feeding in March and
 * October). They follow different crop calendars, so they are separate.
 * East, Central, West and Coastal are pending: Central and West follow the
 * grower's bahar, East's crop choice and the coast's dates are unsourced.
 */
type Group = 'A' | 'S';

/** NHB-6: per year of age, up to 5 years; bearing trees in two doses. FYM is row text. */
const BEARING_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 110 },
    { what: 'SSP', grams: 155 },
    { what: 'MOP', grams: 40 },
  ],
  maxAgeYears: 5,
};
/** NHB-6: young trees in three doses (July, September, February). */
const YOUNG_DOSE: Dose = {
  organic: [],
  chemical: [
    { what: 'urea', grams: 72 },
    { what: 'SSP', grams: 104 },
    { what: 'MOP', grams: 28 },
  ],
  maxAgeYears: 5,
};

const BEARING: ItemSpec<Group>[] = [
  {
    key: 'tip_cut',
    title: 'Cut shoot tips to skip the rainy-season crop',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut 20–30 cm off the tip of every shoot, which takes off the rainy-season flowers. At the same time, remove dead, diseased and crossing branches and suckers from the base. Seal cuts thicker than a thumb with Bordeaux paste (1 kg copper sulphate + 1 kg lime in 10 L water); wear gloves',
    why: 'The tree then flowers in Aug–Sep for a winter crop: better fruit and far fewer fruit flies',
    hi: {
      title: 'बरसात की फसल छोड़ने के लिए टहनियों के सिरे काटें',
      organic:
        'हर टहनी का 20–30 cm सिरा काट दें, इससे बरसात के फूल हट जाते हैं। साथ ही सूखी, रोगी और आपस में टकराती डालियां और नीचे से निकले फुटाव हटा दें। अंगूठे से मोटे कट पर Bordeaux पेस्ट (1 kg copper sulphate + 1 kg चूना 10 L पानी में) लगाएं; दस्ताने पहनें',
      why: 'तब पेड़ अगस्त–सितंबर में फूलता है और सर्दी की फसल देता है: फल अच्छे और फल मक्खी बहुत कम',
    },
    windows: {
      A: [
        [4, 20],
        [4, 30],
      ],
    },
  },
  {
    key: 'hold_water',
    title: 'Hold back water to skip the rainy-season crop',
    category: 'WATERING',
    stages: ['BEARING'],
    organic:
      "Don't water bearing trees in April–May. Young trees still need water",
    why: 'A dry spell drops the rainy-season flowers',
    hi: {
      title: 'बरसात की फसल छोड़ने के लिए पानी रोकें',
      organic:
        'फल देने वाले पेड़ों को अप्रैल–मई में पानी न दें। छोटे पेड़ों को अभी भी पानी चाहिए',
      why: 'सूखा पड़ने से बरसात के फूल झड़ जाते हैं',
    },
    windows: {
      A: [
        [4, 1],
        [5, 31],
      ],
    },
  },
  // Owner-approved exception to the label-claim rule: guava has no copper
  // claim in the MUP, but this home-made Bordeaux spray is a traditional PAU
  // practice (PAU p.44) given when there is no fruit on the tree.
  {
    key: 'bordeaux_spray',
    title: 'Spray Bordeaux mixture after pruning',
    category: 'PROTECTION',
    stages: ['BEARING'],
    organic:
      'Home-made Bordeaux mixture 2:2:250: 8 g copper sulphate and 8 g lime per litre. Dissolve them separately, then mix. Wear gloves. There is no fruit on the tree now, so no waiting period applies',
    why: 'Protects fresh cuts and new shoots from fruit rot and dieback',
    hi: {
      title: 'छंटाई के बाद Bordeaux मिश्रण स्प्रे करें',
      organic:
        'घर पर बना Bordeaux मिश्रण 2:2:250: प्रति लीटर 8 g copper sulphate और 8 g चूना। दोनों को अलग-अलग घोलें, फिर मिलाएं। दस्ताने पहनें। अभी पेड़ पर फल नहीं है, इसलिए कोई इंतज़ार ज़रूरी नहीं',
      why: 'ताज़े कटों और नई टहनियों को फल सड़न और टहनी सूखने (dieback) से बचाता है',
    },
    windows: {
      A: [
        [5, 1],
        [5, 10],
      ],
    },
  },
  {
    key: 'feed_manure',
    title: 'Feed manure and half the fertiliser',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic:
      'FYM for a bearing tree, 30–40 kg, in a ring under the canopy edge, forked in lightly, then mulch the basin with paddy straw',
    chemical:
      "Half the year's urea + SSP + MOP in the same ring; water in; wear gloves",
    dose: BEARING_DOSE,
    why: 'Feeds the new shoots that carry the next crop',
    hi: {
      title: 'गोबर की खाद और आधी रासायनिक खाद दें',
      organic:
        'फल देने वाले पेड़ को 30–40 kg गोबर की खाद, पेड़ के फैलाव के किनारे के नीचे घेरे में डालकर हल्की गुड़ाई से मिलाएं, फिर थाले में धान की पराली का मल्च बिछाएं',
      chemical:
        'साल भर के urea + SSP + MOP का आधा हिस्सा उसी घेरे में; पानी दें; दस्ताने पहनें',
      why: 'अगली फसल देने वाली नई टहनियों को खुराक मिलती है',
    },
    windows: {
      A: [
        [5, 15],
        [6, 30],
      ],
    },
  },
  {
    key: 'feed_manure',
    title: 'Feed manure and half the fertiliser',
    category: 'FEEDING',
    stages: ['BEARING'],
    // The table's "the same way" refers to the A text: ring under the canopy edge.
    organic:
      'Half of the 30–40 kg FYM in a ring under the canopy edge, forked in lightly, then mulch the basin with paddy straw',
    chemical:
      "Half the year's urea + SSP + MOP in the same ring; water in; wear gloves",
    dose: BEARING_DOSE,
    why: 'Feeds the new shoots that carry the next crop',
    hi: {
      title: 'गोबर की खाद और आधी रासायनिक खाद दें',
      organic:
        '30–40 kg गोबर की खाद का आधा हिस्सा पेड़ के फैलाव के किनारे के नीचे घेरे में डालकर हल्की गुड़ाई से मिलाएं, फिर थाले में धान की पराली का मल्च बिछाएं',
      chemical:
        'साल भर के urea + SSP + MOP का आधा हिस्सा उसी घेरे में; पानी दें; दस्ताने पहनें',
      why: 'अगली फसल देने वाली नई टहनियों को खुराक मिलती है',
    },
    windows: {
      S: [
        [3, 1],
        [3, 31],
      ],
    },
  },
  {
    key: 'feed_second',
    title: 'Feed the second half of the fertiliser',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: 'Dig the rotted straw mulch into the basin',
    chemical:
      'Other half of urea + SSP + MOP; water in if there is no rain; wear gloves',
    dose: BEARING_DOSE,
    why: 'Last feed of the year',
    hi: {
      title: 'बाकी आधी रासायनिक खाद दें',
      organic: 'सड़ी हुई पराली के मल्च को खोदकर थाले में मिला दें',
      chemical:
        'urea + SSP + MOP का बाकी आधा हिस्सा; बारिश न हो तो पानी दें; दस्ताने पहनें',
      why: 'साल की आखिरी खुराक',
    },
    windows: {
      A: [
        [9, 15],
        [10, 15],
      ],
    },
  },
  {
    key: 'feed_second',
    title: 'Feed the second half of the fertiliser',
    category: 'FEEDING',
    stages: ['BEARING'],
    organic: 'The other half of the FYM',
    chemical:
      'Other half of urea + SSP + MOP; water in if there is no rain; wear gloves',
    dose: BEARING_DOSE,
    why: 'Last feed of the year',
    hi: {
      title: 'बाकी आधी रासायनिक खाद दें',
      organic: 'गोबर की खाद का बाकी आधा हिस्सा',
      chemical:
        'urea + SSP + MOP का बाकी आधा हिस्सा; बारिश न हो तो पानी दें; दस्ताने पहनें',
      why: 'साल की आखिरी खुराक',
    },
    windows: {
      S: [
        [10, 1],
        [10, 31],
      ],
    },
  },
  {
    key: 'prune_tips',
    title: 'Prune shoot tips for new fruiting shoots',
    category: 'PRUNING',
    stages: ['BEARING'],
    organic:
      'Cut back the tips of shoots that have fruited. Remove dead, diseased and crossing branches and suckers. Bordeaux paste on big cuts; wear gloves',
    why: 'Guava flowers on new shoots; pruning brings more side shoots',
    hi: {
      title: 'नई फल वाली टहनियों के लिए सिरे छांटें',
      organic:
        'जिन टहनियों पर फल आ चुके हैं उनके सिरे काट दें। सूखी, रोगी और आपस में टकराती डालियां और फुटाव हटा दें। बड़े कट पर Bordeaux पेस्ट; दस्ताने पहनें',
      why: 'अमरूद नई टहनियों पर फूलता है; छंटाई से बगल की टहनियां ज़्यादा निकलती हैं',
    },
    windows: {
      S: [
        [
          [2, 1],
          [3, 31],
        ],
        [
          [9, 1],
          [10, 31],
        ],
      ],
    },
  },
  {
    key: 'nutrient_spray',
    title: 'Spray urea and zinc on the new flush',
    category: 'FEEDING',
    stages: ['BEARING'],
    // The table's organic cell is empty; the app always shows an organic line.
    organic: 'No organic option for this; use the alternative below',
    chemical:
      'Urea 10 g + zinc sulphate 5 g per litre (1% + 0.5%). This is a fertiliser, so no waiting period. Wear gloves',
    why: 'Raises yield',
    hi: {
      title: 'नई फुटान पर urea और zinc स्प्रे करें',
      organic: 'इसका कोई जैविक तरीका नहीं; नीचे दिया दूसरा तरीका अपनाएं',
      chemical:
        'Urea 10 g + zinc sulphate 5 g प्रति लीटर (1% + 0.5%)। यह खाद है, इसलिए कोई इंतज़ार नहीं। दस्ताने पहनें',
      why: 'पैदावार बढ़ाता है',
    },
    windows: {
      S: [
        [
          [3, 1],
          [3, 31],
        ],
        [
          [10, 1],
          [10, 31],
        ],
      ],
    },
  },
];

const BOTH = { A: ALL_YEAR, S: ALL_YEAR };

/** Plant page only: never reminders. */
const CONDITIONAL: ItemSpec<Group>[] = [
  {
    key: 'fym_by_age',
    title: 'FYM for the year, by age',
    category: 'GENERAL',
    stages: ['YOUNG', 'BEARING'],
    conditional: "When you work out the year's manure",
    organic:
      '5–8 kg, then 10, 15–25, 25–30 and 40–50 kg as the tree grows; 30–40 kg for a bearing tree',
    why: 'FYM is given by age band, not per year of age',
    hi: {
      title: 'उम्र के हिसाब से साल भर की गोबर की खाद',
      conditional: 'जब साल भर की खाद का हिसाब लगाएं',
      organic:
        '5–8 kg, फिर पेड़ बढ़ने के साथ 10, 15–25, 25–30 और 40–50 kg; फल देने वाले पेड़ को 30–40 kg',
      why: 'गोबर की खाद उम्र के दायरे के हिसाब से दी जाती है, उम्र के हर साल के हिसाब से नहीं',
    },
    windows: BOTH,
  },
  {
    key: 'water_young',
    title: 'Water the young tree in the dry months',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Dry months, with no rain',
    organic:
      'In year 1 every 2–3 days, in years 2–3 every 4–5 days, in the dry months. No watering in the monsoon unless there is a long dry spell. Mulch with dry leaves or straw',
    why: 'Young roots dry out fast',
    hi: {
      title: 'सूखे महीनों में छोटे पेड़ को पानी दें',
      conditional: 'सूखे महीने, बारिश नहीं',
      organic:
        'सूखे महीनों में पहले साल हर 2–3 दिन, दूसरे-तीसरे साल हर 4–5 दिन। मानसून में पानी न दें, जब तक लंबा सूखा न पड़े। सूखे पत्तों या पुआल का मल्च बिछाएं',
      why: 'छोटी जड़ें जल्दी सूख जाती हैं',
    },
    windows: BOTH,
  },
  {
    key: 'rainy_crop_kept',
    title: 'Bag fruit and trap fruit fly on the rainy crop',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'You kept the rainy-season crop (no tip cut in April)',
    organic:
      'Cover mature-green fruit with white non-woven bags at the end of June to mid-July; hang a fruit fly trap in the first week of July; pick at colour break',
    why: 'The rainy-season crop gets far more fruit flies',
    hi: {
      title: 'बरसात की फसल पर फल ढकें, फल मक्खी ट्रैप लगाएं',
      conditional: 'आपने बरसात की फसल रखी (अप्रैल में सिरे नहीं काटे)',
      organic:
        'जून के आखिर से मध्य जुलाई तक पूरे बढ़े हरे फलों को सफेद non-woven थैलियों से ढकें; जुलाई के पहले हफ्ते में फल मक्खी ट्रैप लटकाएं; रंग बदलना शुरू होते ही तोड़ें',
      why: 'बरसात की फसल पर फल मक्खी बहुत ज़्यादा लगती है',
    },
    // End of June to mid-July, first week of July: whole months Jun–Jul.
    // The table gives no window; its steps run from late June to picking.
    windows: { A: ALL_YEAR },
  },
  {
    key: 'picking',
    title: 'Pick fruit as it turns greenish-yellow',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Skin turning from dark green to greenish-yellow',
    organic:
      "Pick when the skin turns from dark green to greenish-yellow; don't leave ripe fruit on the tree. Pick up fallen fruit every day and bury it at least 60 cm deep",
    why: "Don't leave ripe fruit on the tree",
    hi: {
      title: 'हरा-पीला होते ही फल तोड़ें',
      conditional: 'छिलका गहरे हरे से हरा-पीला हो रहा है',
      organic:
        'जब छिलका गहरे हरे से हरा-पीला हो जाए तब तोड़ें; पके फल पेड़ पर न छोड़ें। गिरे फल रोज़ उठाएं और कम से कम 60 cm गहरा गाड़ दें',
      why: 'पके फल पेड़ पर न छोड़ें',
    },
    windows: BOTH,
  },
  {
    key: 'fruit_fly',
    title: 'Bury fallen and stung fruit',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Fallen or fruit-fly-stung fruit under the tree',
    organic:
      'Collect fallen and stung fruit daily and bury it 60 cm deep. Lightly dig the basin after harvest to expose the pupae',
    why: 'Fruit fly',
    hi: {
      title: 'गिरे और डंक लगे फल गाड़ दें',
      conditional: 'पेड़ के नीचे गिरे या फल मक्खी के डंक लगे फल',
      organic:
        'गिरे और डंक लगे फल रोज़ इकट्ठा करके 60 cm गहरा गाड़ दें। तुड़ाई के बाद थाले की हल्की खुदाई करें ताकि मिट्टी में छिपे प्यूपा ऊपर आ जाएं',
      why: 'फल मक्खी',
    },
    windows: BOTH,
  },
  {
    key: 'fruit_rot',
    title: 'Clean up against fruit rot',
    category: 'PROTECTION',
    stages: ['BEARING'],
    conditional: 'Brown, sunken spots with pink ooze on fruit in the rains',
    organic:
      "Don't let water stand in the basin; bury rotten and dried-up fruit; cut out dead twigs",
    why: 'Fruit rot',
    hi: {
      title: 'फल सड़न से बचाव के लिए सफ़ाई करें',
      conditional: 'बरसात में फलों पर भूरे, धंसे धब्बे जिनसे गुलाबी रस निकले',
      organic:
        'थाले में पानी न रुकने दें; सड़े और सूखे फल गाड़ दें; सूखी टहनियां काट दें',
      why: 'फल सड़न',
    },
    windows: BOTH,
  },
  {
    key: 'wilt',
    title: 'Remove a wilting tree',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'Leaves yellow and branches dry on one side, then the whole tree wilts',
    organic:
      'Uproot and burn the tree with its roots, keep basins drained, and replant with a plant on Sardar or Portugal rootstock',
    why: 'Wilt',
    hi: {
      title: 'मुरझाते पेड़ को हटा दें',
      conditional:
        'एक तरफ़ पत्ते पीले और डालियां सूखी, फिर पूरा पेड़ मुरझा जाता है',
      organic:
        'पेड़ को जड़ समेत उखाड़कर जला दें, थालों से पानी निकलता रखें, और Sardar या Portugal rootstock वाला पौधा दोबारा लगाएं',
      why: 'उकठा (wilt)',
    },
    windows: BOTH,
  },
  {
    key: 'zinc',
    title: 'Spray zinc for small yellow leaves',
    category: 'GENERAL',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'Leaves small and yellow between the veins, with twigs dying back',
    organic:
      'Spray zinc sulphate 10 g + unslaked lime 5 g per litre, 2–3 times a fortnight apart in Jun–Sep. Wear gloves; it is a fertiliser, so there is no waiting period',
    why: 'Zinc shortage',
    hi: {
      title: 'छोटे पीले पत्तों के लिए zinc स्प्रे करें',
      conditional: 'पत्ते छोटे और नसों के बीच पीले, टहनियां ऊपर से सूखती हुई',
      organic:
        'zinc sulphate 10 g + बिना बुझा चूना 5 g प्रति लीटर स्प्रे करें, जून–सितंबर में 15-15 दिन के अंतर पर 2–3 बार। दस्ताने पहनें; यह खाद है, इसलिए कोई इंतज़ार नहीं',
      why: 'zinc की कमी',
    },
    windows: {
      A: [
        [6, 1],
        [9, 30],
      ],
      S: [
        [6, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'bark_caterpillar',
    title: 'Treat bark-eating caterpillar holes',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional: 'Silk webs with chewed wood on the trunk',
    organic:
      'Pull off the webs; push a wire into the hole; plug it with cotton soaked in kerosene; seal it with mud',
    why: 'Bark-eating caterpillar',
    hi: {
      title: 'छाल खाने वाली सुंडी के छेदों का इलाज करें',
      conditional: 'तने पर रेशमी जाले और चबाई हुई लकड़ी',
      organic:
        'जाले हटा दें; छेद में तार डालें; केरोसिन में भीगी रूई से छेद बंद करें; ऊपर से मिट्टी लगा दें',
      why: 'छाल खाने वाली सुंडी',
    },
    windows: BOTH,
  },
  {
    key: 'mealybug_band',
    title: 'Band the trunk against mealybug',
    category: 'PROTECTION',
    stages: ['YOUNG', 'BEARING'],
    conditional:
      'The tree is near mango trees and mealybugs climb the trunk in winter',
    organic: 'Tie a 25 cm wide, 400-gauge polythene band around the trunk',
    why: 'Stops mealybugs climbing the trunk',
    hi: {
      title: 'मिलीबग से बचाव के लिए तने पर पट्टी बांधें',
      conditional:
        'पेड़ आम के पेड़ों के पास है और सर्दी में मिलीबग तने पर चढ़ते हैं',
      organic: 'तने पर 25 cm चौड़ी, 400-gauge पॉलीथीन की पट्टी बांधें',
      why: 'मिलीबग को तने पर चढ़ने से रोकती है',
    },
    windows: BOTH,
  },
  {
    key: 'boron',
    title: 'Spray borax for cracked fruit',
    category: 'GENERAL',
    stages: ['BEARING'],
    conditional: 'Fruit is cracked or misshapen',
    organic:
      'Spray borax 3 g per litre at flowering and again at fruit set. Wear gloves; it is a fertiliser, so there is no waiting period',
    why: 'Boron shortage',
    hi: {
      title: 'फटे फलों के लिए borax स्प्रे करें',
      conditional: 'फल फट रहे हैं या टेढ़े-मेढ़े हैं',
      organic:
        'फूल आने पर और फिर फल बनने पर borax 3 g प्रति लीटर स्प्रे करें। दस्ताने पहनें; यह खाद है, इसलिए कोई इंतज़ार नहीं',
      why: 'boron की कमी',
    },
    windows: { S: ALL_YEAR },
  },
  {
    key: 'shaping',
    title: 'Shape the young tree',
    category: 'GENERAL',
    stages: ['YOUNG'],
    conditional: 'Your young tree needs shaping (no month in the sources)',
    organic:
      'Clear the first 60–90 cm of trunk; keep 4–5 main branches 20–25 cm apart; head the tree back at 1.5–1.8 m to open the centre',
    why: 'Opens the centre of the tree',
    hi: {
      title: 'छोटे पेड़ को आकार दें',
      conditional:
        'आपके छोटे पेड़ को आकार देना है (स्रोतों में कोई महीना नहीं)',
      organic:
        'तने का पहला 60–90 cm साफ़ रखें; 20–25 cm की दूरी पर 4–5 मुख्य डालियां रखें; बीच का हिस्सा खोलने के लिए पेड़ को 1.5–1.8 m पर ऊपर से काटें',
      why: 'पेड़ का बीच का हिस्सा खुलता है',
    },
    windows: BOTH,
  },
];

/** NHB-6's one national schedule for the first years: same dates in A and S. */
const YOUNG: ItemSpec<Group>[] = [
  {
    key: 'feed_young_first',
    title: 'Feed manure and a third of the fertiliser',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: '',
    chemical:
      'FYM in June by age: 5–8 kg, then 10, 15–25 and 25–30 kg as the tree grows, plus a third of the urea + SSP + MOP in July, in a ring 30 cm from the trunk; wear gloves',
    dose: YOUNG_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'गोबर की खाद और एक-तिहाई रासायनिक खाद दें',
      chemical:
        'जून में उम्र के हिसाब से गोबर की खाद: 5–8 kg, फिर पेड़ बढ़ने के साथ 10, 15–25 और 25–30 kg, और जुलाई में urea + SSP + MOP का एक-तिहाई, तने से 30 cm दूर घेरे में; दस्ताने पहनें',
      why: 'मज़बूत ढांचे के लिए लगातार बढ़वार',
    },
    windows: {
      A: [
        [6, 15],
        [7, 31],
      ],
      S: [
        [6, 15],
        [7, 31],
      ],
    },
  },
  {
    key: 'feed_young_second',
    title: 'Feed a third of the fertiliser',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: '',
    chemical: 'Second third of urea + SSP + MOP; water in; wear gloves',
    dose: YOUNG_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'एक-तिहाई रासायनिक खाद दें',
      chemical:
        'urea + SSP + MOP का दूसरा तिहाई हिस्सा; पानी दें; दस्ताने पहनें',
      why: 'मज़बूत ढांचे के लिए लगातार बढ़वार',
    },
    windows: {
      A: [
        [9, 1],
        [9, 30],
      ],
      S: [
        [9, 1],
        [9, 30],
      ],
    },
  },
  {
    key: 'feed_young_third',
    title: 'Feed the last third of the fertiliser',
    category: 'FEEDING',
    stages: ['YOUNG'],
    organic: '',
    chemical: 'Last third of urea + SSP + MOP; water in; wear gloves',
    dose: YOUNG_DOSE,
    why: 'Steady growth for a strong frame',
    hi: {
      title: 'आखिरी एक-तिहाई रासायनिक खाद दें',
      chemical:
        'urea + SSP + MOP का आखिरी तिहाई हिस्सा; पानी दें; दस्ताने पहनें',
      why: 'मज़बूत ढांचे के लिए लगातार बढ़वार',
    },
    windows: {
      A: [
        [2, 1],
        [2, 28],
      ],
      S: [
        [2, 1],
        [2, 28],
      ],
    },
  },
];

const PHASES: PhaseSpec<Group>[] = [
  {
    phase: 'post_harvest_and_regulation',
    avoid: ['Watering bearing trees in Apr–May'],
    watch: ['Rainy-season flowers dropping (intended)'],
    hi: {
      avoid: ['अप्रैल–मई में फल देने वाले पेड़ों को पानी देना'],
      watch: ['बरसात के फूल झड़ना (यही चाहिए)'],
    },
    months: { A: [3, 5] },
  },
  {
    phase: 'vegetative_flush',
    avoid: ['Water standing in the basin'],
    watch: ['Wilt', 'Fruit fly on leftover fruit'],
    hi: {
      avoid: ['थाले में पानी रुकना'],
      watch: ['उकठा (wilt)', 'बचे हुए फलों पर फल मक्खी'],
    },
    months: { A: [6, 7] },
  },
  {
    phase: 'flowering',
    avoid: ['Heavy watering at peak flowering (flower drop)'],
    watch: ['Anthracnose dieback (worst in Aug–Sep)'],
    hi: {
      avoid: ['फूल आने के ज़ोर पर भारी पानी देना (फूल झड़ते हैं)'],
      watch: ['एन्थ्रेक्नोज़ से टहनियां सूखना (अगस्त–सितंबर में सबसे ज़्यादा)'],
    },
    months: { A: [8, 9] },
  },
  {
    phase: 'fruit_development',
    avoid: ['Letting the soil dry out (water monthly in winter)'],
    watch: ['Fruit rot', 'Mango mealybug on the winter crop'],
    hi: {
      avoid: ['मिट्टी सूखने देना (सर्दी में हर महीने पानी दें)'],
      watch: ['फल सड़न', 'सर्दी की फसल पर आम का मिलीबग'],
    },
    months: { A: [10, 12] },
  },
  // S has two pruning flushes and two fruiting spells a year.
  {
    phase: 'pruning_and_flush',
    avoid: ['Fertiliser during flowering'],
    watch: ['Tea mosquito bug', 'Mealybug'],
    hi: {
      avoid: ['फूल आने के समय रासायनिक खाद'],
      watch: ['टी मॉस्किटो बग', 'मिलीबग'],
    },
    months: { S: [2, 3] },
  },
  {
    phase: 'pruning_and_flush',
    avoid: ['Fertiliser during flowering'],
    watch: ['Tea mosquito bug', 'Mealybug'],
    hi: {
      avoid: ['फूल आने के समय रासायनिक खाद'],
      watch: ['टी मॉस्किटो बग', 'मिलीबग'],
    },
    months: { S: [9, 10] },
  },
  {
    phase: 'fruiting_and_harvest',
    avoid: ['Leaving ripe fruit on the tree'],
    watch: ['Fruit fly', 'Fruit rot in rain'],
    hi: {
      avoid: ['पके फल पेड़ पर छोड़ना'],
      watch: ['फल मक्खी', 'बरसात में फल सड़न'],
    },
    months: { S: [4, 8] },
  },
  {
    phase: 'fruiting_and_harvest',
    avoid: ['Leaving ripe fruit on the tree'],
    watch: ['Fruit fly', 'Fruit rot in rain'],
    hi: {
      avoid: ['पके फल पेड़ पर छोड़ना'],
      watch: ['फल मक्खी', 'बरसात में फल सड़न'],
    },
    months: { S: [11, 1] },
  },
  {
    phase: 'establishment',
    stages: ['YOUNG'],
    avoid: ['Waterlogging', 'Damaging roots'],
    watch: ['Wilt', 'Mealybug on young plants'],
    hi: {
      avoid: ['पानी भरना', 'जड़ों को नुकसान पहुंचाना'],
      watch: ['उकठा (wilt)', 'छोटे पौधों पर मिलीबग'],
    },
    months: { A: [1, 12], S: [1, 12] },
  },
];

const regionCare = (group: Group): RegionCare =>
  groupCare(group, [...BEARING, ...CONDITIONAL, ...YOUNG], PHASES);

export const GUAVA_CARE: FamilyCare = {
  family: 'guava',
  sources: [
    'CIB&RC Major Uses of Pesticides (30.09.2026), ppqs.gov.in',
    'PAU Package of Practices for Fruit Crops',
    'National Horticulture Board guava pages (nhb.gov.in)',
    'NIPHM/DPPQS AESA-based IPM package for guava',
    'NHM IPM schedule for guava pests (2012)',
    'TNAU Agritech guava',
    'KAU Package of Practices (2016)',
  ],
  grownIn: [
    'NORTH_INDIA',
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
  ],
  pendingRegions: [
    'EAST_INDIA',
    'CENTRAL_INDIA',
    'WEST_INDIA',
    'COASTAL_HUMID',
  ],
  regions: {
    NORTH_INDIA: regionCare('A'),
    SOUTH_DECCAN: regionCare('S'),
  },
};
