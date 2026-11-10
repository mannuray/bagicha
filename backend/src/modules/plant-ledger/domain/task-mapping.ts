import {
  DiagnosisIssueType,
  DiagnosisSeverity,
  TaskCategory,
  TaskPriority,
  TaskType,
} from '@prisma/client';

/** Seasonal / overlay template category ("watering", "pruning", …) → task type. */
export function taskTypeFromCategory(category: string): TaskType {
  switch (category.toLowerCase()) {
    case 'watering':
      return TaskType.WATER;
    case 'pruning':
      return TaskType.PRUNE;
    case 'feeding':
      return TaskType.FEED;
    case 'harvest':
      return TaskType.HARVEST;
    case 'treatment':
      return TaskType.TREAT;
    case 'observation':
      return TaskType.OBSERVE;
    default:
      return TaskType.INSPECT;
  }
}

export function taskCategoryFromCategory(category: string): TaskCategory {
  switch (category.toLowerCase()) {
    case 'watering':
      return TaskCategory.WATERING;
    case 'pruning':
      return TaskCategory.PRUNING;
    case 'feeding':
      return TaskCategory.FEEDING;
    case 'harvest':
      return TaskCategory.HARVEST;
    case 'treatment':
      return TaskCategory.TREATMENT;
    case 'observation':
      return TaskCategory.OBSERVATION;
    default:
      return TaskCategory.INSPECTION;
  }
}

export function taskPriorityFrom(priority: string): TaskPriority {
  switch (priority.toLowerCase()) {
    case 'low':
      return TaskPriority.LOW;
    case 'high':
      return TaskPriority.HIGH;
    default:
      return TaskPriority.MEDIUM;
  }
}

/** Diagnosed issue → the task type that addresses it. */
export function taskTypeFromIssue(issue: DiagnosisIssueType): TaskType {
  switch (issue) {
    case DiagnosisIssueType.PEST:
    case DiagnosisIssueType.DISEASE:
      return TaskType.TREAT;
    case DiagnosisIssueType.WATER_STRESS:
      return TaskType.WATER;
    default:
      return TaskType.INSPECT;
  }
}

export function taskCategoryFromIssue(issue: DiagnosisIssueType): TaskCategory {
  switch (issue) {
    case DiagnosisIssueType.PEST:
    case DiagnosisIssueType.DISEASE:
      return TaskCategory.TREATMENT;
    case DiagnosisIssueType.WATER_STRESS:
      return TaskCategory.WATERING;
    default:
      return TaskCategory.INSPECTION;
  }
}

/** Only the first diagnosis action inherits the severity; the rest are MEDIUM. */
export function taskPriorityFromSeverity(
  severity: DiagnosisSeverity,
  index: number,
): TaskPriority {
  if (index === 0) {
    switch (severity) {
      case DiagnosisSeverity.HIGH:
        return TaskPriority.HIGH;
      case DiagnosisSeverity.MEDIUM:
        return TaskPriority.MEDIUM;
      default:
        return TaskPriority.LOW;
    }
  }
  return TaskPriority.MEDIUM;
}
