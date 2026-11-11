import { useTranslation } from 'react-i18next';
import { cropStageKey, type PlantDetail } from '../plants';
import { CropPhoto } from './CropPhoto';
import { cropStatusLine } from './journey-header';
import { useCropContext } from './useCropContext';

/** The crop page header: photo (or family pebble), name, and "In the bed · day 12 · Terrace bag 3". */
export function CropHero({ plant, now }: { plant: PlantDetail; now: Date }) {
  const { t } = useTranslation();
  const { crop, open, place } = useCropContext(plant);
  const status = cropStatusLine(plant.crop_stage ?? null, open?.started_at ?? null, place?.name ?? null, now);
  const line = [
    t(cropStageKey(status.stage, crop?.kind)),
    status.day === null ? null : t('crops.journey.day', { day: status.day }),
    status.place,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <header className="relative mb-4 h-[220px] w-full overflow-hidden rounded-b-[32px] bg-primary-gradient">
      {crop && <CropPhoto cropId={crop.id} family={crop.family} name={crop.name} className="absolute inset-0 h-full w-full opacity-90" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <div className="absolute bottom-5 left-4 right-4">
        <h1 className="font-headline text-3xl font-bold leading-none text-on-primary">{plant.name}</h1>
        <p className="mt-1.5 font-label text-sm font-semibold text-on-primary/90">{line}</p>
      </div>
    </header>
  );
}
