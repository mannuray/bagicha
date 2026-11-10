import { LogType, TaskPriority, TaskType } from '@prisma/client';
import { followUpTemplateFor } from './follow-up-templates';

describe('followUpTemplateFor', () => {
  it('plans a next-day pest response', () => {
    expect(followUpTemplateFor('Aam', LogType.PEST_DIAGNOSIS)).toMatchObject({
      type: TaskType.TREAT,
      priority: TaskPriority.HIGH,
      dueInDays: 1,
      title: 'Plan pest response for Aam',
    });
  });

  it('rechecks a diagnosis after two days', () => {
    expect(followUpTemplateFor('Aam', LogType.DIAGNOSIS)).toMatchObject({
      type: TaskType.INSPECT,
      dueInDays: 2,
    });
  });

  it('rechecks a treatment after three days', () => {
    expect(followUpTemplateFor('Aam', LogType.TREATMENT)?.dueInDays).toBe(3);
  });

  it('creates nothing for ordinary entries', () => {
    expect(followUpTemplateFor('Aam', LogType.WATERING)).toBeNull();
  });
});
