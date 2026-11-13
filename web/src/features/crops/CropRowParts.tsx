import { useCropCalendar } from './api';
import { CropPhoto } from './CropPhoto';
import { hindiName } from './names';

/** The crop's photo (or family icon) in a list pebble. */
export function CropPebble({ cropId, name, className }: { cropId: string; name: string; className?: string }) {
  const crop = useCropCalendar().data?.find((c) => c.id === cropId);
  return <CropPhoto cropId={cropId} family={crop?.family ?? ''} name={name} className={className} iconClassName="text-2xl" />;
}

/** The crop's Hindi name, for beside its name in a list. */
export function CropHindiName({ cropId }: { cropId: string }) {
  const crop = useCropCalendar().data?.find((c) => c.id === cropId);
  const hindi = crop ? hindiName(crop) : null;
  return hindi ? <>{hindi}</> : null;
}
