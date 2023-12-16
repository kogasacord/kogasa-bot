// im gonna make a better version i promise.

export function separateCommands(message_content: string, prefix: string) {
  // maybe i should write something better for this (O~O)
  const split_message = message_content.split(" ");
  const args = split_message.slice(1);
  const alias_command_name = split_message[0].replace(prefix, "");
  return { args, alias_command_name };
}
