import {Process} from "@helpers/chess/validator.js";
import {ExternalDependencies} from "@helpers/types";
import { Client, Message } from "discord.js";
import { InviteManager } from "@helpers/session/invite.js";
import {SessionManager} from "@helpers/session/session.js";

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

// const uci = new ChessEngineInterface("./media/engines/alice-engine.exe");
const _checker = new Process("./media/engines/chess-sanity-check.exe");

const session = new SessionManager(new InviteManager<{ id: string, name: string }>());

export const name = "chess";
export const aliases = ["chess"];
export const channel = "Guild";
export const cooldown = 25;
export const description = "Do a chess match.";
export async function execute(_client: Client, msg: Message<true>, args: string[], _ext: ExternalDependencies) {
	const command = args[0];
	const author = msg.author;
	const replied_user = msg.mentions.repliedUser;

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
				const users_in_session = session.getUsersInSession([author.id, replied_user.id]);
				for (const user_in_session of users_in_session) {
					if (user_in_session === author.id) {
						msg.reply("You are already in a session!");
						break;
					}
					if (user_in_session === replied_user.id) {
						msg.reply("The person you're replying to is already in a session!");
						break;
					}
				}

				const inv_res = session.sendInviteTo(author.id, replied_user.id, { id: author.id, name: replied_user.displayName });
				switch (inv_res.msg) {
					case "AlreadySentInvite":
						msg.reply("You already sent an invite!");
						break;
					case "SentInvite":
						msg.reply("Sent an invite.");
						break;
					default:
						break;
				}
			}
			break;
		case "revoke": {
			const inv_res = session.revokeInvite(author.id, 0);
			switch (inv_res.msg) {
				case "RevokedInvite":
					msg.reply(`You have revoked an invite to "${inv_res.payload!.name}".`);
					break;
				case "NoInvites":
					msg.reply("No invites have been sent to you.");
					break;
				default:
					break;
			}
			break;
		}
		case "accept": {
			const inv_res = session.acceptInvite(author.id, 0);
			switch (inv_res.msg) {
				case "AcceptedInvite":
					session.createSession({ players: [inv_res.payload!.sender, inv_res.payload!.reciever] });
					msg.reply("Accepted the invite.");
					break;
				case "NoInvites":
					msg.reply("No invites has been sent to you.");
					break;
				default:
					break;
			}
			break;
		}
		case "decline": {
			console.log(author.id);
			const inv_res = session.declineInvite(author.id, 0);
			switch (inv_res.msg) {
				case "DeclinedInvite":
					msg.reply("You declined the invite.");
					break;
				case "NoInvites":
					msg.reply("You don't have invites.");
					break;
				default:
					break;
			}
			break;
		}
		case "move": { // after session
			/*
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
			*/
			break;
		}
		case "quit": {
			break;
		}
		case "print":
			// print this out properly. Maps don't get JSON.stringified easily.
			msg.reply(
				"users: " + JSON.stringify(users, map_replacer, 4) + users.size + "\n" +
				"sessions: " + JSON.stringify(sessions, map_replacer, 4) + sessions.size + "\n" +
				session.printAllVariables()
			);
			break;
		default:
			break;
	}

}

export function map_replacer(key: string, value: unknown) {
	if (value instanceof Map) {
		return {
			dataType: "Map",
			value: Array.from(value.entries()),
		};
	} else {
		return value;
	}
}

