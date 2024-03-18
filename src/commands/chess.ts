import fetch from "node-fetch";
import settings from "@root/settings.json" assert { type: "json" };

import {Process} from "@helpers/chess/validator.js";
import {ChannelScope, ExternalDependencies} from "@helpers/types";
import { ChannelType, Client, Message, PermissionsBitField } from "discord.js";
import {InviteK} from "@helpers/session/session";


// const uci = new ChessEngineInterface("./media/engines/alice-engine.exe");
const checker = new Process("./media/engines/chess-sanity-check.exe");
const turn_time = 1 * 60 * 1000;

export const name = "chess";
export const aliases = ["chess"];
export const channel: ChannelScope[] = ["Guild", "Thread"];
export const cooldown = 25;
export const description = "Do a chess match.";
export async function execute(client: Client<true>, msg: Message<true>, args: string[], ext: ExternalDependencies) {
	const command = args[0];
	const selection = Number(args[1]);

	const author = msg.author;
	const replied_user = msg.mentions.repliedUser;
	const guild = await client.guilds.fetch(msg.guildId);
	const member = await guild.members.fetch(msg.author.id);
	const has_thread_perms = member.permissions.has([PermissionsBitField.Flags.CreatePublicThreads, PermissionsBitField.Flags.SendMessagesInThreads]);
	if (!has_thread_perms) {
		msg.reply("I need the `CreatePublicThreads` and `SendMessagesInThreads` permission.");
		return;
	}

	switch (command) {
		case "help":
			msg.reply(
				"- `chess play` - Reply to someone to play against them.\n" +
				"- `chess quit` - Quit out of your current game.\n" +
				"- `chess move [move]` - Moves a piece.\n" +
				"- `chess accept/decline` - Accept or decline an invite.\n" +
				"- `chess revoke` - Revoke an invite.\n" +
				"\nMoving is done by this notation: `a2a4`, moves a piece from square a2 to square a4."
			);
			break;
		case "play": {
			if (msg.channel.type !== ChannelType.GuildText) {
				msg.reply("Playing is only allowed in channels.");
				return;
			}
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
			if (msg.channel.type !== ChannelType.GuildText) {
				msg.reply("Accepting invites is only allowed in channels.");
				return;
			}
			if (isNaN(selection)) {
				const inv_view = ext.session.viewInvitesOfReciever(author.id);
				switch (inv_view.msg) {
					case "ViewInvites": {
						const sender_users: InviteK[] = [];
						for (const sender_id of inv_view.payload) {
							if (sender_id) {
								const user = ext.session.getUser(sender_id);
								if (user) {
									sender_users.push(user);
								}
							}
						}
						const users = sender_users.map((user, i) => `[${i}]: ${user.name}`).join("\n");
						msg.reply(`Invites: \n${users}`);
						break;
					}
					case "NoReciever": 
						msg.reply("No invites has been sent to you.");
						break;
					default:
						break;
				}
				return;
			}

			const inv_res = ext.session.acceptInvite(author.id, selection);
			switch (inv_res.msg) {
				case "AcceptedInvite": {
					const thread = await msg.startThread({
						name: `${inv_res.payload!.sender.name} vs ${inv_res.payload!.reciever.name}`
					});
					const session_time = 10 * 60 * 1000;
					const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
					const move_start_time = new Date();
					const move_end_time = new Date(move_start_time.getTime() + turn_time);
					ext.session.createSession({
						players: [
							{ id: inv_res.payload!.sender.id },
							{ id: inv_res.payload!.reciever.id }
						],
						turn_index: 0,
						fen,
						channel_id: thread.id,
						moves: [],
						move_start_time: move_start_time,
						move_end_time: move_end_time,
					}, session_time);

					let image = undefined;
					try {
						// does an http GET request.
						image = await createChessImage(fen);
					} catch (error) {
						image = await createChessImage(fen);
					}
					const turn_time_left = Math.ceil(move_end_time.getTime() / 1000);
					await thread.send({ 
						content: `Accepted invite, <@${inv_res.payload!.sender.id}>'s turn. Turn time left: <t:${turn_time_left}:R>`, 
						files: [{ attachment: image }] 
					});
					break;
				}
				case "InvalidIndex": 
					msg.reply("Invalid user! Please choose a number, `??chess accept 1`");
					break;
				case "NoInvites":
					msg.reply("No invites has been sent to you.");
					break;
			}
			break;
		}
		case "decline": {
			if (isNaN(selection)) {
				const inv_view = ext.session.viewInvitesOfReciever(author.id);
				switch (inv_view.msg) {
					case "ViewInvites": {
						const sender_users: InviteK[] = [];
						for (const sender_id of inv_view.payload) {
							if (sender_id) {
								const user = ext.session.getUser(sender_id);
								if (user) {
									sender_users.push(user);
								}
							}
						}
						const users = sender_users.map((user, i) => `[${i}]: ${user.name}`).join("\n");
						msg.reply(`Invites: \n${users}`);
						break;
					}
					case "NoReciever": 
						msg.reply("No invites has been sent to you.");
						break;
					default:
						break;
				}
				return;
			}

			const inv_res = ext.session.declineInvite(author.id, selection);
			switch (inv_res.msg) {
				case "DeclinedInvite":
					msg.reply("You declined the invite.");
					break;
				case "NoInvites":
					msg.reply("You don't have invites.");
					break;
				case "InvalidIndex":
					msg.reply("Invalid user! Please choose a number, `??chess decline 1`");
					break;
			}
			break;
		}
		case "clock": {
			const sesh = ext.session.getSessionWithUser(author.id);
			if (sesh?.session.channel_id !== msg.channelId) {
				return;
			}
			const { threads } = await msg.guild.channels.fetchActiveThreads();
			const thread = threads.find((_, key) => key === sesh.session.channel_id);
			if (!thread) {
				// if someone deleted the thread...
				ext.session.deleteSession(sesh.hash_id);
				return;
			}
			const current_turn = sesh.session.players.at(sesh.session.turn_index)!;
			const current_player = await client.users.fetch(current_turn.id);
			const resulting_time = Math.ceil(sesh.session.move_end_time.getTime() / 1000);

			if (sesh.session.move_end_time < new Date()) {
				thread.send(`:boom: "${current_player.displayName}" ran out of time!`);
				ext.session.deleteSession(sesh.hash_id);
			} else {
				thread.send(`The timer hasn't ran out yet! <t:${resulting_time}:R>`);
			}

			break;
		}
		case "move": {
			const sesh = ext.session.getSessionWithUser(author.id);
			if (sesh?.session.channel_id !== msg.channelId) {
				return;
			}

			if (sesh) {
				const move = args.at(1);
				if (!move) {
					msg.reply("You must make a move! e.g: `e2e4 - movement, e2e4Q - promotion`");
					return;
				}
				const { threads } = await msg.guild.channels.fetchActiveThreads();
				const thread = threads.find((_, key) => key === sesh.session.channel_id);
				if (!thread) {
					// if someone deleted the thread...
					ext.session.deleteSession(sesh.hash_id);
					return;
				}

				const current_turn = sesh.session.players.at(sesh.session.turn_index)!;
				if (current_turn.id === author.id) {
					if (sesh.session.move_end_time < new Date()) {
						ext.session.deleteSession(sesh.hash_id);
					}

					const next_turn_index = (sesh.session.turn_index + 1) % sesh.session.players.length; // wrapping 0 - 10 (10 exclusive)
					const next_turn = sesh.session.players.at(next_turn_index)!;

					const player = await client.users.fetch(current_turn.id);
					const next_player = await client.users.fetch(next_turn.id);

					const move_list = `${sesh.session.moves.length > 0 ? `moves ${sesh.session.moves.join(" ")}` : ""}`;

					const command_res = await checker.sendCommand(`fen ${sesh.session.fen} ${move_list} verifymove ${move} movestofen`, /res/g);
					const [move_status, status, _] = command_res.split("\n");


					switch (move_status) {
						case "move legal":
							msg.reply(`${player.displayName} moved.`);
							switch (status) {
								case "res white checkmate":
									thread.send("White has been checkmated.");
									ext.session.deleteSession(sesh.hash_id);
									break;
								case "res black checkmate":
									thread.send("Black has been checkmated.");
									ext.session.deleteSession(sesh.hash_id);
									break;
								case "res stalemate":
									thread.send("Stalemate!");
									ext.session.deleteSession(sesh.hash_id);
									break;
								case "res ongoing": {
									sesh.session.turn_index = next_turn_index;
									sesh.session.moves.push(move);

									const unix_time_left = ext.session.getTimeLeft(sesh.hash_id);

									const command_res = await checker.sendCommand(`fen ${sesh.session.fen} moves ${sesh.session.moves.join(" ")} movestofen`, /res/g);
									const [_, fen] = command_res.split("\n");
									const fen_string = fen.replace("fen ", "");

									let image = undefined;
									try {
										// does an http GET request.
										image = await createChessImage(fen_string);
									} catch (error) {
										image = await createChessImage(fen_string);
									}

									const difference = sesh.session.move_end_time.getTime() - new Date().getTime();
									sesh.session.move_start_time = new Date(sesh.session.move_end_time.getTime() - difference);
									sesh.session.move_end_time = new Date(sesh.session.move_start_time.getTime() + turn_time);

									const resulting_time = Math.ceil(sesh.session.move_end_time.getTime() / 1000);
									await thread.send({ 
										content: `It's now ${next_player.displayName}'s turn.\nSession time left: <t:${unix_time_left}:R>, turn time left: <t:${resulting_time}:R>`,
										files: [{ attachment: image }] 
									});
									break;
								}
							}
							break;
						case "move illegal":
							thread.send("That's an illegal move.");
							break;
						case "move unknown":
							thread.send("I don't know what that move is...");
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
				const player1 = client.users.cache.get(sesh.session.players[0].id) ?? (await client.users.fetch(sesh.session.players[0].id));
				const player2 = client.users.cache.get(sesh.session.players[1].id) ?? (await client.users.fetch(sesh.session.players[1].id));
				msg.reply(`Destroyed session with "${player1.displayName}" and "${player2.displayName}"`);
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

export async function createChessImage(fen: string) {
	const check = await fetch(`${settings.canvas_endpoint}/chess`, {
		method: "POST",
		body: JSON.stringify({ fen }),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	return Buffer.from(await check.arrayBuffer());
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

