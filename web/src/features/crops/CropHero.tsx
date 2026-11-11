import { useTranslation } from 'react-i18next';
import type { PlantDetail } from '../plants';
import { useAllCycles } from '../plants';
import { useCropCalendar, usePlaces } from './api';
import { CropPhoto } from './CropPhoto';
import { cropStatusLine, openCycle } from './journey-header';
import { stageKey } from './names';

/** The crop page header: photo (or family pebble), name, and "In the bed · day 12 · Terrace bag 3". */
export function CropHero({ plant, now }: { plant: PlantDetail; now: Date }) {
  const { t } = useTranslation();
  const calendar = useCropCalendar();
  const cycles = useAllCycles(plant.id);
  const places = usePlaces();
  const crop = calendar.data?.find((c) => c.id === plant.crop_id);
  const open = openCycle(cycles.data);
  const place = places.data?.find((p) => p.id === open?.place_id)?.name ?? null;
  const status = cropStatusLine(plant.crop_stage ?? null, open?.started_at ?? null, place, now);
  const line = [
    t(stageKey(status.stage, crop?.kind)),
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
