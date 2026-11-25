export enum AuditAction {
  AUTH_SIGNED_IN = 'AUTH_SIGNED_IN',
  AUTH_SIGNED_OUT = 'AUTH_SIGNED_OUT',
  SUBSCRIPTION_CHANGED = 'SUBSCRIPTION_CHANGED',
  COMMUNITY_REPORT_FILED = 'COMMUNITY_REPORT_FILED',
  ACCOUNT_DELETION_REQUESTED = 'ACCOUNT_DELETION_REQUESTED',
  ACCOUNT_DELETION_CANCELLED = 'ACCOUNT_DELETION_CANCELLED',
}

export interface AuditEventInput {
  actorUserId: string | null;
  action: AuditAction;
  targetType: string;
  targetId: string;
  snapshot: Record<string, unknown>;
}
