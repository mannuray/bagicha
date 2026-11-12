import { pickFields } from '../../common/http/pick-fields';

/** A chat message as its two participants see it (with each side's display name in the inbox). */
const MESSAGE_FIELDS = [
  'id',
  'sender_id',
  'receiver_id',
  'content',
  'shared_resource_id',
  'created_at',
] as const;

type MessageLike = { [K in (typeof MESSAGE_FIELDS)[number]]?: unknown } & {
  sender?: { id: string; name: string | null };
  receiver?: { id: string; name: string | null };
};

export function toMessageView<T extends MessageLike>(message: T) {
  return {
    ...pickFields(message, MESSAGE_FIELDS as unknown as readonly (keyof T)[]),
    ...(message.sender
      ? { sender: { id: message.sender.id, name: message.sender.name } }
      : {}),
    ...(message.receiver
      ? { receiver: { id: message.receiver.id, name: message.receiver.name } }
      : {}),
  };
}
