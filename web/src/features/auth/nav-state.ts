import { z } from 'zod';

/** What other screens hand Login in navigation state, checked. */
const loginStateSchema = z.object({ reason: z.string().optional() });

export type LoginState = z.infer<typeof loginStateSchema>;

/** Login's state ("expired" after a 401); anything malformed counts as none. */
export function loginState(raw: unknown): LoginState {
  const parsed = loginStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}
