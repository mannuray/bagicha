/** The Android notification channel reminders go to; the app creates it with this id. */
export const REMINDER_CHANNEL_ID = 'garden-reminders';

/** What a reminder push carries. */
export interface PushMessage {
  title: string;
  body: string;
  /** The app screen a tap opens. */
  route: '/tasks';
}

export type SendOutcome = 'sent' | 'invalid-token' | 'failed';

/** Sends pushes to phones. A port, so the run is tested without Firebase. */
export abstract class PushSender {
  /** False when no push service is configured: the run then sends nothing. */
  abstract readonly enabled: boolean;
  /** One outcome per token, in the same order. */
  abstract send(tokens: string[], msg: PushMessage): Promise<SendOutcome[]>;
}
