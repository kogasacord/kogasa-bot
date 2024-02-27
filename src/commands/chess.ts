import {Process} from "@helpers/chess/validator.js";
import {ExternalDependencies} from "@helpers/types";
import { Client, Message } from "discord.js";

interface Session {
	channel_id: string, 
	fen: string, 
	moves: string[], 
	turn: number, 
}
interface User {
	id: number,
	name: string,
	channel_id: string,
	channel_name: string,
}

const users = new Map<number, { opponent: number, session_id: number }>();
const sessions = new Map<number, Session>();

// key: the recipient, value: the senders
const recipients = new Map<number, User[]>();
// key: the sender, value: the recipient
const senders = new Map<number, number>();

// const uci = new ChessEngineInterface("./media/engines/alice-engine.exe");
const _checker = new Process("./media/engines/chess-sanity-check.exe");

export const name = "chess";
export const aliases = ["chess"];
export const channel = "Guild";
export const cooldown = 25;
export const description = "Do a chess match.";
export async function execute(_client: Client, msg: Message<true>, args: string[], _ext: ExternalDependencies) {
	const command = args[0];
	const author = Number(msg.author.id);
	const replied_user = msg.mentions.repliedUser ? Number(msg.mentions.repliedUser) : undefined;

	switch (command) {
		case "help":
			msg.reply(
				"- `chess play @user` - Play against someone.\n" +
				"- `chess play bot` - Play against the bot.\n" +
				"- `chess quit` - Quit out of your current game.\n" +
				"- `chess move [move]` - Moves a piece.\n" +
				"\nMoving is done by this notation: `a2a4`, moves a piece from square a2 to square a4."
			);
			break;
		case "play":
			if (replied_user) {
				/*
				const session: Session = {
					channel_id: msg.channelId,
					fen: "startpos",
					moves: [],
					turn: author,
				};
				const hash = rehash(author, replied_user);
				if (!users.get(author)) {
					users.set(author, {opponent: replied_user, session_id: hash});
				} else {
					msg.reply("You're already in the game!");
					return;
				}
				if (!users.get(replied_user)) {
					users.set(replied_user, {opponent: author, session_id: hash});
				} else {
					msg.reply("The user you replied to is already in a game!");
					return;
				}
				sessions.set(hash, session);

				setTimeout(() => {
					if (!sessions.delete(hash)) {
						users.delete(author);
						users.delete(replied_user);
						msg.channel.send("Session timed out.");
					}
				}, 30 * 60 * 1000);
				*/
				if (senders.has(author)) {
					msg.reply("You have already sent a request! `??chess revoke` to revoke all match requests.");
				} else {
					senders.set(author, replied_user);
					const senders_of_recipient = recipients.get(replied_user);
					const author_payload = {
						id: author,
						name: msg.author.displayName,
						channel_id: msg.channelId,
						channel_name: msg.channel.name
					};
					if (senders_of_recipient) {
						senders_of_recipient.push(author_payload);
					} else {
						recipients.set(replied_user, [author_payload]);
					}
					recipients.set(replied_user, []);
					msg.reply("Pending request to opponent.");
				}
			}
			break;
		case "revoke": {
			const recipient = senders.get(author);
			if (recipient) {
				const senders = recipients.get(recipient);
				if (senders) {
					const sender = senders.findIndex(c => c.id === author);
					if (sender !== -1) {
						senders.splice(sender);
						msg.reply("Revoked match requests.");
					} else {
						msg.reply("No match requests found.");
					}
				}
			}
			break;
		}
		case "accept": {
			const item = Number(args[1]);
			const senders = recipients.get(author);
			if (senders && senders.length !== 0) {
				if (isNaN(item)) {
					let payload = "People who sent you a request:";
					payload += senders.map(c => `- ${c.name}\n`).join("");
					msg.reply(payload);
				} else {
					msg.reply("Accepted???? i havent coded this in beforjejsfnslk");
				}
			} else {
				msg.reply("You have no incoming requests.");
			}
			break;
		}
		case "move": {
			// sessions 
			const user = users.get(author);
			if (user?.session_id) {
				const session = sessions.get(user.session_id);
				if (session) {
					if (session.turn === author) {
						const _str_moves = session.moves.length <= 0 
							? "" 
							: `moves ${session.moves.join(" ")}`;
						session.turn = user.opponent;
						msg.reply("Made a move, it's your opponent's turn.");
					}
				} else {
					msg.reply("You're not in a session.");
				}
			} else {
				msg.reply("You're not in a session.");
			}
			break;
		}
		case "quit": {
			const user = users.get(author);
			if (user) {
				users.delete(user.opponent);
				users.delete(author);
				msg.reply("Quit out of the session.");
			} else {
				msg.reply("You don't have a current session.");
			}
			break;
		}
		case "print":
			msg.reply(JSON.stringify(sessions, undefined, 4));
			break;
		default:
			break;
	}

	// print this out properly. Maps don't get JSON.stringified easily.
	msg.reply(
		"users: " + JSON.stringify(users, undefined, 4) + users.size + "\n" +
		"sessions: " + JSON.stringify(sessions, undefined, 4) + sessions.size + "\n" +
		"recipients: " + JSON.stringify(recipients, undefined, 4) + recipients.size + "\n" +
		"senders: " + JSON.stringify(senders, undefined, 4) + senders.size + "\n"
	);
}

function rehash(...ids: number[]): number {
	let hash = 0;
	for (const id of ids) {
		hash ^= id;
	}
	return hash;
}
