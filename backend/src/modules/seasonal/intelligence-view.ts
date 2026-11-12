import { pickFields } from '../../common/http/pick-fields';

/** What a gardener sees of a season pack: the guidance, never versions, templates or the basis. */
const PACK_FIELDS = [
  'id',
  'species_family',
  'lifecycle_stage',
  'season_window',
  'current_phase',
  'upcoming_phase',
  'confidence',
  'do_now',
  'avoid_now',
  'watch_for',
] as const;
/** What a gardener sees of their personalized overlay: its advice, never ids of its owner or plant. */
const OVERLAY_FIELDS = [
  'id',
  'adjusted_phase',
  'priority_actions',
  'reasoning_summary',
  'expires_at',
] as const;

export const toPackView = <
  T extends { [K in (typeof PACK_FIELDS)[number]]?: unknown },
>(
  pack: T,
) => pickFields(pack, PACK_FIELDS as unknown as readonly (keyof T)[]);
export const toOverlayView = <
  T extends { [K in (typeof OVERLAY_FIELDS)[number]]?: unknown },
>(
  overlay: T,
) => pickFields(overlay, OVERLAY_FIELDS as unknown as readonly (keyof T)[]);
