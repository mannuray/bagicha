import type { TaskPriority, TaskType } from '@prisma/client';
import type { Lang } from '../../../common/http/lang';

/** A due task as a reminder shows it; title and plant name already in the reader's language. */
export interface ReminderTask {
  type: TaskType;
  title: string;
  plantName: string;
  priority: TaskPriority;
  /** IST date the task is due, YYYY-MM-DD. */
  dueDate: string;
  weather: boolean;
  /** Due tomorrow: only tomorrow's weather tasks, in the evening reminder. */
  tomorrow: boolean;
}

/**
 * The Hindi frame below is a draft awaiting the owner's review. Until it is
 * approved, Hindi readers get the English frame around their Hindi task names.
 */
export const REMINDER_HINDI_APPROVED = false;

interface Frame {
  today: (n: number) => string;
  tonight: (n: number) => string;
  more: (k: number) => string;
}

const FRAMES: Record<Lang, Frame> = {
  en: {
    today: (n) => `${n} garden ${n === 1 ? 'task' : 'tasks'} today`,
    tonight: (n) =>
      `${n} garden ${n === 1 ? 'task' : 'tasks'} for tonight and tomorrow`,
    more: (k) => `+${k} more`,
  },
  hi: {
    today: (n) => `आज बगीचे ${n === 1 ? 'का' : 'के'} ${n} काम`,
    tonight: (n) => `आज रात और कल बगीचे ${n === 1 ? 'का' : 'के'} ${n} काम`,
    more: (k) => `+${k} और`,
  },
};

/** Items named in the body; the rest are counted. */
const SHOWN = 2;
const PRIORITY_RANK: Record<TaskPriority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

/**
 * One notification for a slot: how many tasks, and the first two by what
 * matters most tonight or today. Null when nothing is due, so nothing is sent.
 */
export function composeReminder(
  tasks: ReminderTask[],
  lang: Lang,
): { title: string; body: string } | null {
  if (tasks.length === 0) return null;
  const frame = FRAMES[lang === 'hi' && REMINDER_HINDI_APPROVED ? 'hi' : 'en'];
  const forTonight = tasks.some((t) => t.tomorrow);

  const ordered = [...tasks].sort(
    (a, b) =>
      // Tomorrow's weather is what tonight's visit is for.
      (forTonight ? Number(b.weather) - Number(a.weather) : 0) ||
      Number(b.type === 'WATER') - Number(a.type === 'WATER') ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      a.dueDate.localeCompare(b.dueDate),
  );
  const items = ordered
    .slice(0, SHOWN)
    .map((t) => `${t.title} (${t.plantName})`);
  const rest = tasks.length - SHOWN;
  if (rest > 0) items.push(frame.more(rest));

  return {
    title: (forTonight ? frame.tonight : frame.today)(tasks.length),
    body: items.join(' · '),
  };
}
