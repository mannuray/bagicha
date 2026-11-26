import { cert, initializeApp } from 'firebase-admin/app';
import {
  getMessaging,
  type Messaging,
  type MulticastMessage,
  type SendResponse,
} from 'firebase-admin/messaging';
import { InvariantError } from '../../common/errors';
import {
  PushSender,
  REMINDER_CHANNEL_ID,
  type PushMessage,
  type SendOutcome,
} from './push-sender';

/** Error codes meaning the token will never work again: the phone is forgotten. */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/** High priority, so phones that hold back background apps (Xiaomi and others) still show it. */
export function fcmMessage(
  tokens: string[],
  msg: PushMessage,
): MulticastMessage {
  return {
    tokens,
    notification: { title: msg.title, body: msg.body },
    data: { route: msg.route },
    android: {
      priority: 'high',
      notification: { channelId: REMINDER_CHANNEL_ID },
    },
  };
}

export function outcomeOf(response: SendResponse): SendOutcome {
  if (response.success) return 'sent';
  return DEAD_TOKEN_CODES.has(response.error?.code ?? '')
    ? 'invalid-token'
    : 'failed';
}

/** Firebase Cloud Messaging (HTTP v1 through firebase-admin). */
export class FcmPushSender extends PushSender {
  readonly enabled = true;

  constructor(
    private readonly messaging: Pick<Messaging, 'sendEachForMulticast'>,
  ) {
    super();
  }

  async send(tokens: string[], msg: PushMessage): Promise<SendOutcome[]> {
    try {
      const batch = await this.messaging.sendEachForMulticast(
        fcmMessage(tokens, msg),
      );
      return batch.responses.map(outcomeOf);
    } catch {
      // FCM unreachable: nothing was delivered, and no token is to blame.
      return tokens.map(() => 'failed' as const);
    }
  }
}

/** Used when FCM is not configured (local development, tests). */
export class DisabledPushSender extends PushSender {
  readonly enabled = false;

  send(tokens: string[]): Promise<SendOutcome[]> {
    return Promise.resolve(tokens.map(() => 'failed' as const));
  }
}

/**
 * FCM from the base64 service-account JSON, or a disabled sender when it is
 * unset. A value that cannot be read stops the API from starting, naming the
 * variable but never its contents.
 */
export function buildPushSender(
  serviceAccount: string | undefined,
  logger: { warn(msg: string): void },
): PushSender {
  if (!serviceAccount?.trim()) {
    logger.warn('Push sending is off: FCM_SERVICE_ACCOUNT is not set');
    return new DisabledPushSender();
  }
  let credential: ReturnType<typeof cert>;
  try {
    const json = JSON.parse(
      Buffer.from(serviceAccount, 'base64').toString('utf8'),
    ) as Record<string, string>;
    credential = cert(json);
  } catch {
    throw new InvariantError(
      'FCM_SERVICE_ACCOUNT is not a base64-encoded Firebase service-account JSON',
    );
  }
  return new FcmPushSender(
    getMessaging(initializeApp({ credential }, 'bagicha-push')),
  );
}
