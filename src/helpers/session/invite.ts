
import events from "events";

export type InviteEmitters = "inviteTimeout";
export type InviteMessages = 
	"SentInvite" | "RevokedInvite" | "DeclinedInvite" | "AcceptedInvite" | "NoInvites"
		| "AlreadySentInvite" | "ViewInvites" | "SenderRecieverCycle" | "NoReciever" | "InvalidIndex";
export type InviteResult<K extends InviteMessages, P = NonNullable<unknown>> = { msg: K, payload: P };

export class InviteManager<T extends {id: string}> {
	// how would you reduce the amount of maps needed?
	private recipients = new Map<string, string[]>();
	private senders = new Map<string, string>();
	private users = new Map<string, T>();
	private event_emitter = new events.EventEmitter();

	constructor() {}

	on(event: InviteEmitters, listener: (info: {sender: T, recipient: T}) => void) {
		this.event_emitter.on(event, listener);
	}

	sendInviteTo(from_user: T, to_user: T, ms_expiry = 1 * 60 * 1000): InviteResult<"AlreadySentInvite" | "SentInvite" | "SenderRecieverCycle"> {
		// needs multiple people for testing
		const is_cyclical = this.recipients.get(from_user.id)?.find(sender_id => sender_id === to_user.id);
		const already_sent = this.senders.has(from_user.id);
		if (already_sent) {
			return {msg: "AlreadySentInvite", payload: {}};
		}
		if (is_cyclical) {
			return {msg: "SenderRecieverCycle", payload: {}};
		}

		const senders_of_recipient = this.recipients.get(to_user.id);
		if (senders_of_recipient) {
			senders_of_recipient.push(from_user.id);
		} else {
			this.recipients.set(to_user.id, [from_user.id]);
		}
		this.senders.set(from_user.id, to_user.id);
		this.users.set(from_user.id, from_user);
		this.users.set(to_user.id, to_user);

		setTimeout(() => {
			const senders_of_recipient = this.recipients.get(to_user.id);
			const recipient_id = this.senders.get(from_user.id);

			const index_of_sender = senders_of_recipient?.findIndex(v => v === recipient_id);
			if (senders_of_recipient && index_of_sender && recipient_id) {
				const deleted_sender = senders_of_recipient.splice(index_of_sender, 1);
				if (senders_of_recipient.length <= 0) {
					this.recipients.delete(recipient_id);
				}
				this.senders.delete(deleted_sender[0]);

				const recipient = structuredClone(this.users.get(recipient_id))!;
				const sender = structuredClone(this.users.get(deleted_sender[0]))!;
				this.event_emitter.emit("inviteTimeout", {sender, recipient});

				this.users.delete(recipient_id);
				this.users.delete(deleted_sender[0]);
			}
		}, ms_expiry);

		return {msg: "SentInvite", payload: {}};
	}
	/**
		* Returns a list of senders who sent the reciever an invite.
		*/
	viewInvitesOfReciever(recipient_id: string): InviteResult<"ViewInvites" | "NoReciever", string[]> {
		const senders_of_recipient = this.recipients.get(recipient_id);
		if (senders_of_recipient) {
			return {msg: "ViewInvites", payload: senders_of_recipient};
		} else {
			return {msg: "NoReciever", payload: []};
		}
	}
	/**
		* Accepts the invite of the sender.
		* It should be invoked by the person accepting the invite.
		*/
	acceptInviteOfSender(recipient_id: string, invite_index: number): InviteResult<"AcceptedInvite" | "NoInvites" | "InvalidIndex", {sender: T, reciever: T} | undefined> {
		const senders_of_recipient = this.recipients.get(recipient_id)!;
		if (senders_of_recipient && senders_of_recipient.length > 0) {
			const sender = structuredClone(this.users.get(senders_of_recipient.at(invite_index)!));
			const reciever = structuredClone(this.users.get(recipient_id));
			if (!sender || !reciever) {
				return {msg: "InvalidIndex", payload: undefined};
			}

			for (const sender_of_recipient of senders_of_recipient) {
				// is the sender of the original recipient.. recieving any invite?
				const recipients_of_sender_of_recipient = this.recipients.get(sender_of_recipient);
				if (recipients_of_sender_of_recipient?.length 
						&& recipients_of_sender_of_recipient.length <= 0) {
					// if they don't have any, delete everything in the "invite box"
					this.senders.delete(sender_of_recipient);
					this.recipients.delete(sender_of_recipient);
					this.users.delete(sender_of_recipient);
				} else {
					// if they have one, remove their send invite, but not the recievers
					this.senders.delete(sender_of_recipient);
				}
			}

			return {msg: "AcceptedInvite", payload: {sender, reciever}};
		} else {
			return {msg: "NoInvites", payload: undefined};
		}
	}

	/**
		* It should be invoked by the reciever.
		*
		* Deletes all invites the recipient recieved.
		*/
	declineInviteOfSender(recipient_id: string, invite_index: number): InviteResult<"DeclinedInvite" | "NoInvites" | "InvalidIndex", {sender: T, reciever: T} | undefined> {
		const senders_of_recipient = this.recipients.get(recipient_id);
		if (senders_of_recipient && senders_of_recipient.length !== 0) {
			const sender = structuredClone(this.users.get(senders_of_recipient.at(invite_index)!));
			const reciever = structuredClone(this.users.get(recipient_id)!);
			if (!sender || !reciever) {
				return {msg: "InvalidIndex", payload: undefined};
			}
			senders_of_recipient.splice(invite_index, 1);

			if (senders_of_recipient.length <= 0) {
				this.recipients.delete(recipient_id);
			}
			this.senders.delete(sender.id);

			return {msg: "DeclinedInvite", payload: {reciever, sender}};
		}
		return {msg: "NoInvites", payload: undefined};
	}

	revokeInviteFromReciever(sender_id: string, invite_index: number): InviteResult<"RevokedInvite" | "NoInvites" | "InvalidIndex", {reciever: T, sender: T} | undefined> {
		const recipient_id = this.senders.get(sender_id);
		if (!recipient_id) {
			return {msg: "NoInvites", payload: undefined};
		}
		const senders_of_recipient = this.recipients.get(recipient_id);
		if (senders_of_recipient && senders_of_recipient.length !== 0) {
			const sender = structuredClone(this.users.get(senders_of_recipient.at(invite_index)!));
			const reciever = structuredClone(this.users.get(recipient_id)!);
			if (!sender || !reciever) {
				return {msg: "InvalidIndex", payload: undefined};
			}
			senders_of_recipient.splice(invite_index, 1);

			if (senders_of_recipient.length <= 0) {
				this.recipients.delete(recipient_id);
			}
			this.senders.delete(sender.id);

			return {msg: "RevokedInvite", payload: {reciever, sender}};
		}
		return {msg: "NoInvites", payload: undefined};
	}

	printAllVariables(): string {
		return "recipients: " + JSON.stringify(this.recipients, replacer, 4) + this.recipients.size + "\n" +
		"senders: " + JSON.stringify(this.senders, replacer, 4) + this.senders.size + "\n";
	}
	declineAllInvites() {}
}

function replacer(key: string, value: unknown) {
	if (value instanceof Map) {
		return {
			dataType: "Map",
			value: Array.from(value.entries()),
		};
	} else {
		return value;
	}
}
