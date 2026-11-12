/** True when a write lost a race on a unique index (Prisma P2002). */
export function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === 'P2002';
}
