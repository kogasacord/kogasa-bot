import { Message, Client } from "discord.js"
import { PartialMessage } from "discord.js"
import { ChatBuffer } from "../helpers/types.js"
import {
  setChatbuffer,
  findReplied,
  findChatBufferMessagewithRealMessage,
  findRepliedBufferMessagewithRealMessage,
} from "../helpers/buffer/buffer.js"

export async function messageDelete(
  client: Client,
  partial_new_msg: Message<boolean> | PartialMessage,
  chat_buffer: ChatBuffer
) {
  const chat_buffer_queue = setChatbuffer(
    chat_buffer,
    partial_new_msg.channelId
  )
  const replied_message = await findReplied(client, partial_new_msg)
  const replied_message_id = replied_message ? replied_message.id : ""
  const chat_buffer_message = findChatBufferMessagewithRealMessage(
    chat_buffer_queue,
    partial_new_msg
  )
  const replied_buffer_message = findRepliedBufferMessagewithRealMessage(
    chat_buffer_queue,
    replied_message_id
  )

  if (chat_buffer_message) {
    chat_buffer_message.is_deleted = true
  }
  if (replied_buffer_message) {
    replied_buffer_message.is_deleted = true
  }
}
