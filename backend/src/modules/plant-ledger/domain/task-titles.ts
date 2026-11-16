import type { Lang } from '../../../common/http/lang';
import type { Catalogue, CropInfo } from '../../catalogue';
import { titleName } from './crop-calendar';

/** Which crop reminder sentence a task is, so it can be written in any language. */
export type CropTitleKey =
  | 'seeds'
  | 'seeds.material'
  | 'sow.plant'
  | 'sow.nursery'
  | 'sow.bed'
  | 'sprout.nursery'
  | 'sprout.plant'
  | 'sprout.sown'
  | 'transplant'
  | 'thin'
  | 'ready.bloom'
  | 'ready.pick'
  | 'succession'
  | 'care';

/** Saved in a crop task's metadata as `title`. */
export interface CropTitleRef {
  key: CropTitleKey;
  crop: string;
  /** The care step, for `care`. */
  step?: string;
}

type Template = Record<Lang, string>;

/** {name}: the crop; {material}: what to plant ("seed potatoes"). */
const TEMPLATES: Record<Exclude<CropTitleKey, 'care'>, Template> = {
  seeds: { en: 'Get {name} seeds', hi: '{name} के बीज ले आएं' },
  'seeds.material': {
    en: 'Get {material} for {name}',
    hi: '{name} के लिए {material} ले आएं',
  },
  'sow.plant': { en: 'Plant {name}', hi: '{name} लगाएं' },
  'sow.nursery': {
    en: 'Sow {name} in a nursery tray',
    hi: '{name} के बीज नर्सरी ट्रे में बोएं',
  },
  'sow.bed': {
    en: 'Sow {name} in the bed',
    hi: '{name} के बीज क्यारी में बोएं',
  },
  'sprout.nursery': {
    en: 'Check the {name} seedlings have come up',
    hi: 'देखें कि {name} की पौध निकल आई है',
  },
  'sprout.plant': {
    en: 'Check the planted {name} for shoots',
    hi: 'देखें कि लगाए गए {name} में अंकुर आए हैं',
  },
  'sprout.sown': {
    en: 'Check the sown {name} for sprouts',
    hi: 'देखें कि बोए गए {name} के अंकुर निकले हैं',
  },
  transplant: {
    en: 'Transplant the {name} seedlings to the bed',
    hi: '{name} की पौध क्यारी में लगाएं',
  },
  thin: { en: 'Thin the {name} seedlings', hi: '{name} की पौध छाँटें' },
  'ready.bloom': {
    en: 'The {name} should start blooming soon',
    hi: '{name} में जल्द फूल आने लगेंगे',
  },
  'ready.pick': {
    en: 'The {name} should be ready to pick soon',
    hi: '{name} की तुड़ाई जल्द शुरू होगी',
  },
  succession: {
    en: 'Sow another row of {name}',
    hi: '{name} की एक और कतार बोएं',
  },
};

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '');

/** The crop's name as it sits inside a sentence: "tomato" or "टमाटर". */
const nameIn = (crop: CropInfo, lang: Lang) =>
  lang === 'hi' && crop.hi?.name ? crop.hi.name : titleName(crop);

/** A crop reminder's title in this language; null when the crop or step is unknown. */
export function cropTitle(
  ref: CropTitleRef,
  catalogue: Catalogue,
  lang: Lang,
): string | null {
  const crop = catalogue.crop(ref.crop);
  if (!crop) return null;
  const name = nameIn(crop, lang);
  if (ref.key === 'care') {
    const step = ref.step ? catalogue.careStep(ref.step) : null;
    if (!step) return null;
    const template =
      lang === 'hi' && step.hi?.title ? step.hi.title : step.title;
    return fill(template, { name });
  }
  const method = catalogue.method(crop.method);
  const material =
    lang === 'hi' && method.hi?.material_title
      ? method.hi.material_title
      : (method.material ?? '');
  return fillCropTitle(ref.key, name, material, lang);
}

/** A crop sentence (not a care step) with the crop's name and material filled in. */
export function fillCropTitle(
  key: Exclude<CropTitleKey, 'care'>,
  name: string,
  material: string,
  lang: Lang = 'en',
): string {
  return fill(TEMPLATES[key][lang], { name, material });
}

/** A perennial flower care reminder's Hindi title, from its source key ("rose:prune:2026-10"). */
export function flowerCareTitle(
  sourceKey: string,
  catalogue: Catalogue,
): string | null {
  const m = /^([a-z_]+):([a-z_]+):\d{4}-(\d{2})$/.exec(sourceKey);
  if (!m) return null;
  const flower = catalogue.perennialFlower(m[1]);
  const month = Number(m[3]);
  const item = flower
    ? Object.values(flower.care)
        .flat()
        .find((c) => c.key === m[2] && c.month === month)
    : undefined;
  return item?.hi?.title ?? null;
}

const DEFAULTS: Record<string, Template> = {
  WATER: { en: 'Water the plant', hi: 'पौधे को पानी दें' },
  INSPECT: { en: 'Inspect the plant', hi: 'पौधे की जांच करें' },
  OBSERVE: { en: 'Observe the plant', hi: 'पौधे पर नज़र रखें' },
  PRUNE: { en: 'Prune the plant', hi: 'पौधे की छँटाई करें' },
  FEED: { en: 'Feed the plant', hi: 'पौधे को खाद दें' },
  HARVEST: { en: 'Prepare for harvest', hi: 'तुड़ाई की तैयारी करें' },
  TREAT: { en: 'Apply treatment', hi: 'दवा डालें' },
};

/** The title of a task saved without one, by its type. */
export function defaultTitle(type: string, lang: Lang): string {
  return (DEFAULTS[type] ?? { en: 'Plant task', hi: 'पौधे का काम' })[lang];
}
