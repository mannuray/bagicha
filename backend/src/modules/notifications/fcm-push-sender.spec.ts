import type { BatchResponse, SendResponse } from 'firebase-admin/messaging';
import { InvariantError } from '../../common/errors';
import {
  buildPushSender,
  fcmMessage,
  FcmPushSender,
  outcomeOf,
} from './fcm-push-sender';
import { REMINDER_CHANNEL_ID } from './push-sender';

const msg = {
  title: '2 garden tasks today',
  body: 'Water (Tomato)',
  route: '/tasks' as const,
};

const failure = (code: string): SendResponse => ({
  success: false,
  error: { code, message: code } as SendResponse['error'],
});
const success: SendResponse = { success: true, messageId: 'm1' };

describe('fcmMessage', () => {
  it('is a high-priority notification on the reminders channel that opens the tasks screen', () => {
    expect(fcmMessage(['t1', 't2'], msg)).toEqual({
      tokens: ['t1', 't2'],
      notification: { title: msg.title, body: msg.body },
      data: { route: '/tasks' },
      android: {
        priority: 'high',
        notification: { channelId: REMINDER_CHANNEL_ID },
      },
    });
    expect(REMINDER_CHANNEL_ID).toBe('garden-reminders');
  });
});

describe('outcomeOf', () => {
  it.each([
    ['messaging/registration-token-not-registered', 'invalid-token'],
    ['messaging/invalid-registration-token', 'invalid-token'],
    // Also sent for a malformed message: a payload bug must not wipe every phone.
    ['messaging/invalid-argument', 'failed'],
    ['messaging/internal-error', 'failed'],
    ['messaging/server-unavailable', 'failed'],
  ])('%s → %s', (code, outcome) => {
    expect(outcomeOf(failure(code))).toBe(outcome);
  });

  it('a delivered message is sent', () => {
    expect(outcomeOf(success)).toBe('sent');
  });
});

describe('FcmPushSender', () => {
  it('returns one outcome per token, in order', async () => {
    const response: BatchResponse = {
      responses: [
        success,
        failure('messaging/registration-token-not-registered'),
      ],
      successCount: 1,
      failureCount: 1,
    };
    const messaging = {
      sendEachForMulticast: jest.fn(() => Promise.resolve(response)),
    };
    const sender = new FcmPushSender(messaging);
    await expect(sender.send(['t1', 't2'], msg)).resolves.toEqual([
      'sent',
      'invalid-token',
    ]);
    expect(sender.enabled).toBe(true);
  });

  it('counts every token as failed when FCM itself is unreachable', async () => {
    const messaging = {
      sendEachForMulticast: jest.fn(() =>
        Promise.reject(new Error('ECONNRESET')),
      ),
    };
    await expect(
      new FcmPushSender(messaging).send(['t1', 't2'], msg),
    ).resolves.toEqual(['failed', 'failed']);
  });
});

describe('buildPushSender', () => {
  const logger = { warn: jest.fn() };

  it('is off, with one warning, without a service account', () => {
    const sender = buildPushSender(undefined, logger);
    expect(sender.enabled).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      'Push sending is off: FCM_SERVICE_ACCOUNT is not set',
    );
  });

  it('refuses to start on a service account it cannot read, without echoing it', () => {
    const secret = Buffer.from('{"private_key": "abc"').toString('base64');
    let thrown: unknown;
    try {
      buildPushSender(secret, logger);
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(InvariantError);
    expect(String((thrown as Error).message)).toContain('FCM_SERVICE_ACCOUNT');
    expect(JSON.stringify(thrown)).not.toContain('abc');
  });
});
