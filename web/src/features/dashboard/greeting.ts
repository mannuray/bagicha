export type Greeting = 'morning' | 'afternoon' | 'evening';

/** Good morning until noon, afternoon until 5 pm, then evening (the hour is India's). */
export function greetingFor(hour: number): Greeting {
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}
