export const name = "ping";
export const cooldown = 5;
export const description = "Test command.";
export async function execute(client, msg, args) {
    msg.reply(`Pong.`);
}
