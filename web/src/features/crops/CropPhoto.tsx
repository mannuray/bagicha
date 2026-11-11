import { Icon, cx } from '../../ui';

/** Bundled crop photos (best-effort: any crop without one gets the family pebble). */
const PHOTOS = import.meta.glob<string>('../../assets/crops/*.jpg', { eager: true, import: 'default' });

const FAMILY_ICON: Record<string, string> = {
  SOLANACEAE: 'nutrition',
  CUCURBITACEAE: 'local_florist',
  AMARANTHACEAE: 'grass',
  ASTERACEAE: 'grass',
  APIACEAE: 'grass',
  BRASSICACEAE: 'spa',
  FABACEAE: 'grain',
  MALVACEAE: 'local_florist',
  AMARYLLIDACEAE: 'compost',
  ZINGIBERACEAE: 'compost',
};

export function CropPhoto({ cropId, family, name, className }: { cropId: string; family: string; name: string; className?: string }) {
  const src = PHOTOS[`../../assets/crops/${cropId}.jpg`];
  if (src) return <img src={src} alt={name} className={cx('object-cover', className)} />;
  return (
    <div role="img" aria-label={name} className={cx('flex items-center justify-center bg-secondary-container/60 text-on-secondary-container', className)}>
      <Icon name={FAMILY_ICON[family] ?? 'eco'} filled className="text-4xl" />
    </div>
  );
}
