import { LogType, TaskCategory, TaskPriority, TaskType } from '@prisma/client';

export interface FollowUpTemplate {
  type: TaskType;
  category: TaskCategory;
  priority: TaskPriority;
  title: string;
  reason: string;
  dueInDays: number;
}

/** The follow-up task a journal entry of this type should create, if any. */
export function followUpTemplateFor(
  treeName: string,
  logType: LogType,
): FollowUpTemplate | null {
  switch (logType) {
    case LogType.DIAGNOSIS:
      return {
        type: TaskType.INSPECT,
        category: TaskCategory.INSPECTION,
        priority: TaskPriority.HIGH,
        title: `Recheck diagnosis on ${treeName}`,
        reason: 'A diagnosis was recorded and needs a follow-up inspection.',
        dueInDays: 2,
      };
    case LogType.PEST_DIAGNOSIS:
      return {
        type: TaskType.TREAT,
        category: TaskCategory.TREATMENT,
        priority: TaskPriority.HIGH,
        title: `Plan pest response for ${treeName}`,
        reason: 'A pest diagnosis was logged and needs treatment follow-up.',
        dueInDays: 1,
      };
    case LogType.TREATMENT:
      return {
        type: TaskType.INSPECT,
        category: TaskCategory.INSPECTION,
        priority: TaskPriority.MEDIUM,
        title: `Recheck treatment outcome on ${treeName}`,
        reason:
          'Treatment was applied and the plant should be checked for recovery.',
        dueInDays: 3,
      };
    default:
      return null;
  }
}
