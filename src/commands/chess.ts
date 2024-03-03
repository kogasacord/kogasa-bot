import {Process} from "@helpers/chess/validator.js";
import {ExternalDependencies} from "@helpers/types";
import { Client, Message } from "discord.js";


// const uci = new ChessEngineInterface("./media/engines/alice-engine.exe");
const checker = new Process("./media/engines/chess-sanity-check.exe");

export const name = "chess";
export const aliases = ["chess"];
export const channel = "Guild";
export const cooldown = 25;
export const description = "Do a chess match.";
export async function execute(client: Client, msg: Message<true>, args: string[], ext: ExternalDependencies) {
	const command = args[0];
	const author = msg.author;
	const replied_user = msg.mentions.repliedUser;

	switch (command) {
		case "help":
			msg.reply(
				"- `chess play` - Reply to someone to play against them.\n" +
				"- `chess quit` - Quit out of your current game.\n" +
				"- `chess move [move]` - Moves a piece.\n" +
				"\nMoving is done by this notation: `a2a4`, moves a piece from square a2 to square a4."
			);
			break;
		case "play": {
			if (!replied_user) {
				msg.reply("Reply to someone to invite them.");
				break;
			}
			if (author.id === replied_user.id) {
				msg.reply("You can't play yourself.");
				break;
			}
			if (replied_user.id === client.user?.id) {
				msg.reply("I haven't been taught to play chess yet.");
				break;
			}
			if (replied_user.bot) {
				msg.reply("*They* don't know how to play chess.");
				break;
			}

			const users_in_session = ext.session.getUsersInSession([author.id, replied_user.id]);
			for (const user_in_session of users_in_session) {
				if (user_in_session === author.id) {
					msg.reply("You are already in a session!");
					return;
				}
				if (user_in_session === replied_user.id) {
					msg.reply("The person you're replying to is already in a session!");
					return;
				}
			}

			const inv_res = ext.session.sendInviteTo(
				{ id: author.id, name: author.displayName, channel_id: msg.channel.id },
				{ id: replied_user.id, name: replied_user.displayName, channel_id: msg.channel.id },
				30 * 1000,
			);

			switch (inv_res.msg) {
				case "AlreadySentInvite":
					msg.reply("You already sent an invite!");
					break;
				case "SentInvite":
					msg.reply(`Sent an invite to "${replied_user.displayName}"`);
					break;
				case "SenderRecieverCycle":
					msg.reply(`"${replied_user.displayName}" already invited you.`);
					break;
			}
			break;
		}
		case "revoke": {
			const inv_res = ext.session.revokeInvite(author.id, 0);
			switch (inv_res.msg) {
				case "RevokedInvite":
					msg.reply(`You have revoked an invite to "${inv_res.payload!.reciever.name}".`);
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
			const inv_res = ext.session.acceptInvite(author.id, 0);
			switch (inv_res.msg) {
				case "AcceptedInvite":
					ext.session.createSession({
						players: [inv_res.payload!.sender.id, inv_res.payload!.reciever.id],
						turn_index: 0,
						fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
						channel_id: msg.channel.id,
						moves: [],
					}, 1 * 60 * 1000);
					msg.reply("Accepted the invite.");
					break;
				case "NoInvites":
					msg.reply("No invites has been sent to you.");
					break;
			}
			break;
		}
		case "decline": {
			const inv_res = ext.session.declineInvite(author.id, 0);
			switch (inv_res.msg) {
				case "DeclinedInvite":
					msg.reply("You declined the invite.");
					break;
				case "NoInvites":
					msg.reply("You don't have invites.");
					break;
			}
			break;
		}
		case "move": {
			const sesh = ext.session.getSessionWithUser(author.id);
			if (sesh) {
				const move = args.at(1);
				if (!move) {
					msg.reply("You must make a move! e.g: `e2e4 - movement, e2e4Q - promotion`");
					return;
				}

				const turn_id = sesh.session.players[sesh.session.turn_index];
				if (turn_id === author.id) {
					const future_turn_index = (sesh.session.turn_index + 1) % sesh.session.players.length; // wrapping 0 - 10 (10 exclusive)
					const future_turn_id = sesh.session.players[future_turn_index];

					const player = await client.users.fetch(turn_id);
					const future_player = await client.users.fetch(future_turn_id);

					const move_list = `${sesh.session.moves.length > 0 ? `moves ${sesh.session.moves.join(" ")}` : ""}`;

					const command_res = await checker.sendCommand(`fen ${sesh.session.fen} ${move_list} verifymove ${move}`, /res/g);
					const [move_status, status] = command_res.split("\n");
					console.log(command_res);

					switch (move_status) {
						case "move legal":
							msg.reply(`${player.displayName} moved. It's now ${future_player.displayName}'s turn. `);
							switch (status) {
								case "res white checkmate":
									msg.reply("White has been checkmated.");
									break;
								case "res black checkmate":
									msg.reply("Black has been checkmated.");
									break;
								case "res stalemate":
									msg.reply("Stalemate!");
									break;
								case "res ongoing":
									sesh.session.turn_index = future_turn_index;
									sesh.session.moves.push(move);
									msg.reply(`Ongoing. fen ${sesh.session.fen}, moves ${sesh.session.moves.join(" ")}`);
									break;
							}
							break;
						case "move illegal":
							msg.reply("That's an illegal move.");
							break;
						case "move unknown":
							msg.reply("I don't know what that move is...");
							break;
					}
				}
			} else {
				msg.reply("You're not in a session.");
			}
			break;
		}
		case "quit": {
			const sesh = ext.session.getSessionWithUser(author.id);
			if (sesh) {
				msg.reply(`Destroyed session with "${sesh.session.players[0]}" and "${sesh.session.players[1]}"`);
				ext.session.deleteSession(sesh.hash_id);
			} else {
				msg.reply("You don't have a session.");
			}
			break;
		}
		case "print":
			// print this out properly. Maps don't get JSON.stringified easily.
			msg.reply(ext.session.printAllVariables());
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

