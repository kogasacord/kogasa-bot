
import {InviteManager} from "./invite";
import events from "events";

interface Session {
	channel_id: string, 
	fen: string, 
	moves: string[], 
	turn: number, 
}

type SessionEmitters = "sessionTimeout";
export type SessionMessages = "AlreadyInSession" | "CreatedSession";
export type SessionResult<K extends SessionMessages, P = NonNullable<unknown>> = { msg: K, payload: P };

export class SessionManager<T> {
	private users = new Map<string, {opponent: string, session_id: string}>();
	private sessions = new Map<string, T>();
	private event_emitter = new events.EventEmitter();
	
	constructor(private invites = new InviteManager()) {}
	
	on(event: SessionEmitters, listener: (author_id: string, recipient_id: string) => void) {
		this.event_emitter.addListener(event, listener);
	}

	/**
		* Creates a session.
		* IDs should be numerical due to hash method.
		*/
	createSession(session_info: T, author_id: string, recipient_id: string, ms_expiry = 30 * 60 * 1000): SessionResult<"AlreadyInSession" | "CreatedSession"> {
		// check for NaN values.
		// to create a unique hash.
		const hash = rehash(Number(author_id), Number(recipient_id)).toString();
		if (!this.users.get(author_id)) {
			this.users.set(author_id, {opponent: recipient_id, session_id: hash});
		} else {
			return {msg: "AlreadyInSession", payload: {}};
		}
		if (!this.users.get(recipient_id)) {
			this.users.set(recipient_id, {opponent: author_id, session_id: hash});
		} else {
			return {msg: "AlreadyInSession", payload: {}};
		}
		this.sessions.set(hash.toString(), session_info);

		setTimeout(() => {
			if (!this.sessions.delete(hash)) {
				this.users.delete(author_id);
				this.users.delete(recipient_id);
				// TODO: put out a custom event that emits this every time this happens.
				// do it for invites too, to track expiring invites.
				this.event_emitter.emit("sessionTimeout", author_id, recipient_id);
			}
		}, ms_expiry);

		return {msg: "CreatedSession", payload: {}};
	}
	
	// INVITES
	sendInviteTo(from_user_id: string, to_user_id: string) {
		return this.invites.sendInviteTo(from_user_id, to_user_id, { id: from_user_id });
	}
	acceptInvite(recipient_id: string, invite_index: number) {
		return this.invites.acceptInviteOfSender(recipient_id, invite_index);
	}
	declineInvite(recipient_id: string, invite_index: number) {
		return this.invites.declineInviteOfSender(recipient_id, invite_index);
	}
	revokeInvite(sender_id: string, invite_index: number) {
		return this.invites.revokeInviteFromReciever(sender_id, invite_index);
	}
	viewInvitesOfReciever(recipient_id: string) {
		return this.invites.viewInvitesOfReciever(recipient_id);
	}
}


function rehash(...ids: number[]): number {
	let hash = 0;
	for (const id of ids) {
		hash ^= id;
	}
	return hash;
}
