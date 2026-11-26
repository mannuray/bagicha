import { composeReminder, type ReminderTask } from './reminder-message';

const task = (over: Partial<ReminderTask>): ReminderTask => ({
  type: 'FEED',
  title: 'Feed the plant',
  plantName: 'Mango',
  priority: 'MEDIUM',
  dueDate: '2026-11-27',
  weather: false,
  tomorrow: false,
  ...over,
});

describe('composeReminder', () => {
  it('returns null when nothing is due', () => {
    expect(composeReminder([], 'en')).toBeNull();
  });

  it('says one task in the singular, with no "+more"', () => {
    expect(
      composeReminder(
        [task({ type: 'WATER', title: 'Water the plant', plantName: 'Tomato' })],
        'en',
      ),
    ).toEqual({ title: '1 garden task today', body: 'Water the plant (Tomato)' });
  });

  it('puts watering first, then high priority, then counts the rest', () => {
    const result = composeReminder(
      [
        task({ type: 'FEED', priority: 'LOW' }),
        task({ type: 'TREAT', priority: 'HIGH', title: 'Spray neem' }),
        task({ type: 'WATER', title: 'Water the plant', plantName: 'Tomato' }),
      ],
      'en',
    );
    expect(result).toEqual({
      title: '3 garden tasks today',
      body: 'Water the plant (Tomato) · Spray neem (Mango) · +1 more',
    });
  });

  it('puts the oldest first among equals', () => {
    const result = composeReminder(
      [
        task({ title: 'Newer', dueDate: '2026-11-27' }),
        task({ title: 'Older', dueDate: '2026-11-22' }),
      ],
      'en',
    );
    expect(result?.body).toBe('Older (Mango) · Newer (Mango)');
  });

  it('leads with tomorrow’s weather and says tonight and tomorrow', () => {
    const result = composeReminder(
      [
        task({ type: 'WATER', title: 'Water the plant', plantName: 'Tomato' }),
        task({
          type: 'INSPECT',
          title: 'Cover against the cold night',
          plantName: 'Papaya',
          weather: true,
          tomorrow: true,
          dueDate: '2026-11-28',
        }),
      ],
      'en',
    );
    expect(result).toEqual({
      title: '2 garden tasks for tonight and tomorrow',
      body: 'Cover against the cold night (Papaya) · Water the plant (Tomato)',
    });
  });

  it('keeps the English frame for Hindi until the Hindi is approved', () => {
    const result = composeReminder(
      [task({ title: 'पौधे को खाद दें', plantName: 'आम' })],
      'hi',
    );
    expect(result).toEqual({
      title: '1 garden task today',
      body: 'पौधे को खाद दें (आम)',
    });
  });
});
