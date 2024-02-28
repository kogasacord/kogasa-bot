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

// const uci = new ChessEngineInterface("./media/engines/alice-engine.exe");
const _checker = new Process("./media/engines/chess-sanity-check.exe");

type InviteMessages = 
	"SentInvite" | "RevokedInvite" | "DeclinedInvite" | "AcceptedInvite" | "NoInvites"
		| "AlreadySentInvite" | "ViewInvites" | "NoReciever" | "InvalidID";
type InviteResult<K = NonNullable<unknown>> = { msg: InviteMessages, payload: K };

class Invites<T extends { id: string }> {
	private recipients = new Map<string, T[]>();
	private senders = new Map<string, string>();
	constructor() {}

	sendInviteTo(from_user_id: string, to_user_id: string, payload: T): InviteResult {
		if (this.senders.has(from_user_id)) {
			return { msg: "AlreadySentInvite", payload: {} };
		}
		this.senders.set(from_user_id, to_user_id);

		const senders_of_recipient = this.recipients.get(to_user_id);
		if (senders_of_recipient) {
			senders_of_recipient.push(payload);
		} else {
			this.recipients.set(to_user_id, [payload]);
		}
		return { msg: "SentInvite", payload: {} };
	}
	/**
		* Returns a list of senders who sent the reciever an invite.
		*/
	viewInvitesOfReciever(recipient_id: string): InviteResult<({ id: string } & T)[]> {
		const senders_of_recipient = this.recipients.get(recipient_id);
		if (senders_of_recipient) {
			return { msg: "ViewInvites", payload: senders_of_recipient };
		} else {
			return { msg: "NoReciever", payload: [] };
		}
	}
	/**
		* Accepts the invite of the sender.
		*
		* It should be invoked by the person accepting the invite.
		*/
	acceptInviteOfSender(sender_id: string, invite_index: number): InviteResult<{ sender: string, reciever: string } | undefined> {
		const recipient_id = this.senders.get(sender_id);
		if (!recipient_id) {
			return { msg: "InvalidID", payload: undefined };
		}

		const senders_of_recipient = this.recipients.get(recipient_id);
		if (senders_of_recipient && senders_of_recipient.length !== 0) {
			// dangerous not checking invite_index's value
			const sender = structuredClone(senders_of_recipient[invite_index].id);
			const reciever = structuredClone(recipient_id);
			// when someone accepts an invite, it removes everyone that invited the person
			for (const sender_of_recipient of senders_of_recipient) {
				this.senders.delete(sender_of_recipient.id);
			}
			this.recipients.delete(recipient_id);
			return { msg: "AcceptedInvite", payload: { sender, reciever } };
		} else {
			return { msg: "NoInvites", payload: undefined };
		}
	}

	revokeInviteFromReciever(sender_id: string): InviteResult<T | undefined> {
		const recipient_id = this.senders.get(sender_id);
		if (recipient_id) {
			const sender_ids_of_recipient = this.recipients.get(recipient_id);
			if (sender_ids_of_recipient) {
				const recipient_sender_index = sender_ids_of_recipient.findIndex(v => v.id === sender_id);
				const recipient_sender = sender_ids_of_recipient.find(c => c.id === sender_id);
				if (recipient_sender_index !== -1 && recipient_sender) {
					this.senders.delete(sender_id);
					sender_ids_of_recipient.splice(recipient_sender_index, 1);
					if (sender_ids_of_recipient.length <= 0) {
						this.recipients.delete(recipient_id);
					}
					return {msg: "RevokedInvite", payload: recipient_sender};
				}
			}
		}

		return {msg: "NoInvites", payload: undefined};
	}

	/**
		* It should be invoked by the reciever.
		* Person 1: ??chess play - replying to Person 2
		* Person 2: ??chess decline (Person 2 is where sender_id is)
		*/
	declineInviteOfSender(sender_id: string, invite_index: number): InviteResult {
		const recipient_id = this.senders.get(sender_id);
		if (!recipient_id) {
			return {msg: "InvalidID", payload: {}};
		}

		const senders_of_recipient = this.recipients.get(recipient_id);
		if (senders_of_recipient && senders_of_recipient.length !== 0) {
			// dangerous not checking invite_index's value
			this.senders.delete(sender_id);
			senders_of_recipient.splice(invite_index, 1);
			return {msg: "DeclinedInvite", payload: {}};
		}
		return {msg: "NoInvites", payload: {}};
	}

	printAllVariables(): string {
		return "recipients: " + JSON.stringify(this.recipients, replacer, 4) + this.recipients.size + "\n" +
		"senders: " + JSON.stringify(this.senders, replacer, 4) + this.senders.size + "\n";
	}
	declineAllInvites() {}
}

const invites = new Invites<{ id: string, name: string }>();

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
				/*
				it should also remove the invites from recipients and senders

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
				const inv_res = invites.sendInviteTo(author.id, replied_user.id, { id: author.id, name: author.displayName });
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
			const inv_res = invites.revokeInviteFromReciever(author.id);
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
			const inv_res = invites.acceptInviteOfSender(author.id, 0);
			switch (inv_res.msg) {
				case "InvalidID":
					msg.reply("If you see this, something terrible has happened.");
					break;
				case "AcceptedInvite":
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
			const inv_res = invites.declineInviteOfSender(author.id, 0);
			switch (inv_res.msg) {
				case "InvalidID":
					msg.reply("If you see this, something terrible has happened.");
					break;
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
			/*
			const user = users.get(author);
			if (user) {
				users.delete(user.opponent);
				users.delete(author);
				msg.reply("Quit out of the session.");
			} else {
				msg.reply("You don't have a current session.");
			}
			*/
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
		"users: " + JSON.stringify(users, replacer, 4) + users.size + "\n" +
		"sessions: " + JSON.stringify(sessions, replacer, 4) + sessions.size + "\n" +
		invites.printAllVariables()
	);
}

function replacer(key: string, value: any) {
	if (value instanceof Map) {
		return {
			dataType: "Map",
			value: Array.from(value.entries()),
		};
	} else {
		return value;
	}
}

function rehash(...ids: number[]): number {
	let hash = 0;
	for (const id of ids) {
		hash ^= id;
	}
	return hash;
}
