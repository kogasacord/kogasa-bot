
import events from "events";

export type InviteEmitters = "inviteTimeout";
export type InviteMessages = 
	"SentInvite" | "RevokedInvite" | "DeclinedInvite" | "AcceptedInvite" | "NoInvites"
		| "AlreadySentInvite" | "ViewInvites" | "SenderRecieverCycle" | "NoReciever" | "InvalidIndex";
export type InviteResult<K extends InviteMessages, P = NonNullable<unknown>> = { msg: K, payload: P };

export class InviteManager<T extends {id: string}> {
	// how would you reduce the amount of maps needed?
	private invite_recipients = new Map<string, string[]>();
	private invite_senders = new Map<string, string>();
	private user_map = new Map<string, T>();
	private event_emitter = new events.EventEmitter();

	constructor() {}

	on(event: InviteEmitters, listener: (info: {sender: T, recipient: T}) => void) {
		this.event_emitter.on(event, listener);
	}

	sendInviteTo(from_user: T, to_user: T, expiry_in_ms = 1 * 60 * 1000): InviteResult<"AlreadySentInvite" | "SentInvite" | "SenderRecieverCycle"> {
		// needs multiple people for testing
		const is_cyclical_invite = this.invite_recipients.get(from_user.id)?.find(sender_id => sender_id === to_user.id);
		const is_already_sent = this.invite_senders.has(from_user.id);
		if (is_already_sent) {
			return {msg: "AlreadySentInvite", payload: {}};
		}
		if (is_cyclical_invite) {
			return {msg: "SenderRecieverCycle", payload: {}};
		}

		const recipient_senders = this.invite_recipients.get(to_user.id);
		if (recipient_senders) {
			recipient_senders.push(from_user.id);
		} else {
			this.invite_recipients.set(to_user.id, [from_user.id]);
		}
		this.invite_senders.set(from_user.id, to_user.id);
		this.user_map.set(from_user.id, from_user);
		this.user_map.set(to_user.id, to_user);

		setTimeout(() => {
			const recipient_senders = this.invite_recipients.get(to_user.id);
			const recipient_id = this.invite_senders.get(from_user.id);

			const sender_index = recipient_senders?.findIndex(v => v === recipient_id);
			if (recipient_senders && sender_index && recipient_id) {
				const deleted_sender = recipient_senders.splice(sender_index, 1);
				if (recipient_senders.length <= 0) {
					this.invite_recipients.delete(recipient_id);
				}
				this.invite_senders.delete(deleted_sender[0]);

				const recipient = structuredClone(this.user_map.get(recipient_id))!;
				const sender = structuredClone(this.user_map.get(deleted_sender[0]))!;
				this.event_emitter.emit("inviteTimeout", {sender, recipient});

				this.user_map.delete(recipient_id);
				this.user_map.delete(deleted_sender[0]);
			}
		}, expiry_in_ms);

		return {msg: "SentInvite", payload: {}};
	}
	/**
		* Returns a list of senders who sent the reciever an invite.
		*/
	viewInvitesOfReciever(recipient_id: string): InviteResult<"ViewInvites" | "NoReciever", string[]> {
		const recipient_senders = this.invite_recipients.get(recipient_id);
		if (recipient_senders) {
			return {msg: "ViewInvites", payload: recipient_senders};
		} else {
			return {msg: "NoReciever", payload: []};
		}
	}
	/**
		* Accepts the invite of the sender.
		* It should be invoked by the person accepting the invite.
		*/
	acceptInviteOfSender(recipient_id: string, invite_index: number): InviteResult<"AcceptedInvite" | "NoInvites" | "InvalidIndex", {sender: T, reciever: T} | undefined> {
		const recipient_senders = this.invite_recipients.get(recipient_id)!;
		if (recipient_senders && recipient_senders.length > 0) {
			const sender = structuredClone(this.user_map.get(recipient_senders.at(invite_index)!));
			const reciever = structuredClone(this.user_map.get(recipient_id));
			if (!sender || !reciever) {
				return {msg: "InvalidIndex", payload: undefined};
			}

			for (const recipient_sender of recipient_senders) {
				// is the sender of the original recipient.. recieving any invite?
				const recipients_of_recipient_sender = this.invite_recipients.get(recipient_sender);
				if (recipients_of_recipient_sender?.length 
						&& recipients_of_recipient_sender.length <= 0) {
					// if they don't have any, delete everything in the "invite box"
					this.invite_senders.delete(recipient_sender);
					this.invite_recipients.delete(recipient_sender);
					this.user_map.delete(recipient_sender);
				} else {
					// if they have one, remove their send invite, but not the recievers
					this.invite_senders.delete(recipient_sender);
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
		const recipient_senders = this.invite_recipients.get(recipient_id);
		if (recipient_senders && recipient_senders.length !== 0) {
			const sender = structuredClone(this.user_map.get(recipient_senders.at(invite_index)!));
			const reciever = structuredClone(this.user_map.get(recipient_id)!);
			if (!sender || !reciever) {
				return {msg: "InvalidIndex", payload: undefined};
			}
			recipient_senders.splice(invite_index, 1);

			if (recipient_senders.length <= 0) {
				this.invite_recipients.delete(recipient_id);
			}
			this.invite_senders.delete(sender.id);

			return {msg: "DeclinedInvite", payload: {reciever, sender}};
		}
		return {msg: "NoInvites", payload: undefined};
	}

	revokeInviteFromReciever(sender_id: string, invite_index: number): InviteResult<"RevokedInvite" | "NoInvites" | "InvalidIndex", {reciever: T, sender: T} | undefined> {
		const recipient_id = this.invite_senders.get(sender_id);
		if (!recipient_id) {
			return {msg: "NoInvites", payload: undefined};
		}
		const recipient_senders = this.invite_recipients.get(recipient_id);
		if (recipient_senders && recipient_senders.length !== 0) {
			const sender = structuredClone(this.user_map.get(recipient_senders.at(invite_index)!));
			const reciever = structuredClone(this.user_map.get(recipient_id)!);
			if (!sender || !reciever) {
				return {msg: "InvalidIndex", payload: undefined};
			}
			recipient_senders.splice(invite_index, 1);

			if (recipient_senders.length <= 0) {
				this.invite_recipients.delete(recipient_id);
			}
			this.invite_senders.delete(sender.id);

			return {msg: "RevokedInvite", payload: {reciever, sender}};
		}
		return {msg: "NoInvites", payload: undefined};
	}

	printAllVariables(): string {
		return "recipients: " + JSON.stringify(this.invite_recipients, replacer, 4) + this.invite_recipients.size + "\n" +
		"senders: " + JSON.stringify(this.invite_senders, replacer, 4) + this.invite_senders.size + "\n";
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
