import { Client, Message } from "discord.js";
import { ChatBuffer, ChatBufferMessage } from "../types.js";
import { Queue } from "../misc/queue.js";
import { PartialMessage } from "discord.js";

import helpers from "../helpers.js";

export function makeMessageBuffer(msg: Message): ChatBufferMessage {
  const attachments = msg.attachments.map((v) => v.url);
  return {
    id: msg.id,
    display_name: msg.author.displayName,
    content: msg.content,
    attachments: attachments,
    is_deleted: false,
    edits: [] as string[],
    replied: undefined,
  };
}

export async function pushMessageToBuffer(
  client: Client,
  msg: Message,
  chat_buffer: ChatBuffer
) {
  const chat_buffer_channel = setChatbuffer(chat_buffer, msg.channelId);
  const replied = await findReplied(client, msg);

  chat_buffer_channel.push({
    ...makeMessageBuffer(msg),
    replied: replied ? makeMessageBuffer(replied) : undefined,
  });
}

export function setChatbuffer(
  chat_buffer: ChatBuffer,
  channel_id: string
): Queue<ChatBufferMessage> {
  const chat_buffer_channel = chat_buffer.get(channel_id);
  if (!chat_buffer_channel) {
    chat_buffer.set(channel_id, new Queue(20));
    return chat_buffer.get(channel_id)!;
  }
  return chat_buffer_channel;
}

export async function findReplied(
  client: Client,
  msg: Message<boolean> | PartialMessage
) {
  return msg.reference && msg.reference.messageId
    ? await helpers.completePartialMessage(
        client,
        msg.reference.channelId,
        msg.reference.messageId
      )
    : null;
}

export function findChatBufferMessagewithRealMessage(
  buffer_queue: Queue<ChatBufferMessage>,
  new_msg: Message<boolean> | PartialMessage
): ChatBufferMessage | undefined {
  const chat_buffer_message = buffer_queue
    .get_internal()
    .find((buffer_message) => buffer_message.id === new_msg.id);
  return chat_buffer_message;
}

export function findRepliedBufferMessagewithRealMessage(
  buffer_queue: Queue<ChatBufferMessage>,
  replied_message_id: string
) {
  const replied_buffer_message = buffer_queue
    .get_internal()
    .find((buffer_message) => {
      if (buffer_message.replied) {
        return buffer_message.replied.id === replied_message_id;
      }
      return false;
    });
  return replied_buffer_message;
}
