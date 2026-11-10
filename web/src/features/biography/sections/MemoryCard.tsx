import { useTranslation } from 'react-i18next';
import { Icon } from '../../../ui';
import type { PlantDetail } from '../../plants';
import { memoryFor } from '../memory';

/** "11 years ago this month…": in the app only. Push reminders: see TODO(push-memory) in ../memory.ts. */
export function MemoryCard({ plant, now }: { plant: PlantDetail; now: Date }) {
  const { t } = useTranslation();
  const memory = memoryFor(plant, now);
  if (!memory) return null;
  return (
    <aside className="flex items-center gap-3 rounded-xl bg-secondary-container/25 px-4 py-3">
      <Icon name="cake" filled className="text-secondary" />
      <p className="font-body text-sm text-on-secondary-fixed-variant">
        {t(`biography.memory.${memory.kind}`, { count: memory.years, name: plant.name })}
      </p>
    </aside>
  );
}
