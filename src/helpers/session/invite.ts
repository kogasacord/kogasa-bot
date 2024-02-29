
export type InviteMessages = 
	"SentInvite" | "RevokedInvite" | "DeclinedInvite" | "AcceptedInvite" | "NoInvites"
		| "AlreadySentInvite" | "ViewInvites" | "NoReciever" | "InvalidIndex";
export type InviteResult<K extends InviteMessages, P = NonNullable<unknown>> = { msg: K, payload: P };

export class InviteManager<T extends {id: string}> {
	private recipients = new Map<string, T[]>();
	private senders = new Map<string, string>();
	constructor() {}

	sendInviteTo(from_user_id: string, to_user_id: string, payload: T): InviteResult<"AlreadySentInvite" | "SentInvite"> {
		if (this.senders.has(from_user_id)) {
			return {msg: "AlreadySentInvite", payload: {}};
		}
		this.senders.set(from_user_id, to_user_id);

		const senders_of_recipient = this.recipients.get(to_user_id);
		if (senders_of_recipient) {
			senders_of_recipient.push(payload);
		} else {
			this.recipients.set(to_user_id, [payload]);
		}
		return {msg: "SentInvite", payload: {}};
	}
	/**
		* Returns a list of senders who sent the reciever an invite.
		*/
	viewInvitesOfReciever(recipient_id: string): InviteResult<"ViewInvites" | "NoReciever", ({id: string} & T)[]> {
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
	acceptInviteOfSender(recipient_id: string, invite_index: number): InviteResult<"AcceptedInvite" | "NoInvites" | "InvalidIndex", {sender: string, reciever: string} | undefined> {
		const senders_of_recipient = this.recipients.get(recipient_id);
		if (senders_of_recipient && senders_of_recipient.length !== 0) {
			const sender = structuredClone(senders_of_recipient.at(invite_index));
			if (!sender) {
				return {msg: "InvalidIndex", payload: undefined};
			}
			const reciever = structuredClone(recipient_id);
			// when someone accepts an invite, it removes everyone that invited the person
			for (const sender_of_recipient of senders_of_recipient) {
				this.senders.delete(sender_of_recipient.id);
			}
			this.recipients.delete(recipient_id);
			return {msg: "AcceptedInvite", payload: {sender: sender.id, reciever}};
		} else {
			return {msg: "NoInvites", payload: undefined};
		}
	}

	/**
		* It should be invoked by the reciever.
		*/
	declineInviteOfSender(recipient_id: string, invite_index: number): InviteResult<"DeclinedInvite" | "NoInvites" | "InvalidIndex"> {
		const senders_of_recipient = this.recipients.get(recipient_id);
		if (senders_of_recipient && senders_of_recipient.length !== 0) {
			const sender = structuredClone(senders_of_recipient.at(invite_index));
			if (!sender) {
				return {msg: "InvalidIndex", payload: {}};
			}
			this.senders.delete(sender.id);
			senders_of_recipient.splice(invite_index, 1);

			if (senders_of_recipient.length <= 0) {
				this.recipients.delete(recipient_id);
			}
			return {msg: "DeclinedInvite", payload: {}};
		}
		return {msg: "NoInvites", payload: {}};
	}

	revokeInviteFromReciever(sender_id: string, invite_index: number): InviteResult<"RevokedInvite" | "NoInvites" | "InvalidIndex", T | undefined> {
		const recipient_id = this.senders.get(sender_id);
		if (!recipient_id) {
			return {msg: "NoInvites", payload: undefined};
		}
		const sender_ids_of_recipient = this.recipients.get(recipient_id);
		if (sender_ids_of_recipient) {
			// dangerous not checking invite_index's value
			const sender = structuredClone(sender_ids_of_recipient.at(invite_index));
			if (!sender) {
				return {msg: "InvalidIndex", payload: undefined};
			}
			this.senders.delete(sender.id);
			sender_ids_of_recipient.splice(invite_index, 1);

			if (sender_ids_of_recipient.length <= 0) {
				this.recipients.delete(recipient_id);
			}
			return {msg: "RevokedInvite", payload: sender};
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
