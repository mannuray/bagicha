import { RegionCluster } from '@prisma/client';
import { z } from 'zod';
import type { CatalogueSeed } from './types';

const text = z.string().trim().min(1);
const month = z
  .object({ season: text, headline: text, points: z.array(text).min(1) })
  .strict();

export const seasonGuideSeedSchema = z
  .object({
    region: z.enum(RegionCluster),
    months: z.array(month).length(12),
    status: z.enum(['DRAFT', 'APPROVED', 'RETIRED']),
    notes: z.string().nullable(),
  })
  .strict();

/** Each region once, and every region with an approved guide: the home screen needs one everywhere. */
export function seasonGuideIssues(seed: CatalogueSeed): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (const g of seed.seasonGuide) {
    if (seen.has(g.region))
      issues.push(`season guide: ${g.region} listed twice`);
    seen.add(g.region);
  }
  const approved = new Set(
    seed.seasonGuide
      .filter((g) => g.status === 'APPROVED')
      .map((g) => g.region),
  );
  for (const region of Object.values(RegionCluster))
    if (!approved.has(region))
      issues.push(`season guide: no approved guide for ${region}`);
  return issues;
}
