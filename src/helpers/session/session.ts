
import {map_replacer} from "@root/src/commands/chess.js";
import {InviteEmitters, InviteManager} from "./invite.js";
import events from "events";

type SessionEmitters = "sessionTimeout";
export type SessionMessages = "AlreadyInSession" | "CreatedSession";
export type SessionResult<K extends SessionMessages, P = NonNullable<unknown>> = { msg: K, payload: P };

export interface Session {
	channel_id: string, 
	fen: string, 
	moves: string[], 
	turn_index: number,
	players: string[]
}
export interface Invite {
	id: string,
	name: string,
	channel_id: string,
}

/**
	* Manages the lifecycle of a session.
	*/
export class SessionManager<T extends { players: string[] }, K extends { id: string }> {
	private sessions = new Map<string, T>();
	private users_in_session = new Map<string, string>; // user: session
	private event_emitter = new events.EventEmitter();
	
	constructor(private invites = new InviteManager<K>()) {}
	
	on(event: SessionEmitters, listener: (session_info: T) => void) {
		this.event_emitter.on(event, listener);
	}
	on_invite(event: InviteEmitters, listener: (info: {sender: K, recipient: K}) => void) {
		// very annoying.
		this.invites.on(event, listener);
	}

	/**
		* For checking if a user is in session.
		*/
	getUsersInSession(players: string[]): string[] {
		return players.filter(player => this.users_in_session.has(player));
	}
	/**
		* For getting the session with the user so you can modify it.
		*/
	getSessionWithUser(player: string): { hash_id: string, session: T } | undefined {
		const session_id = this.users_in_session.get(player);
		if (!session_id) {
			return undefined;
		}
		return { hash_id: session_id, session: this.sessions.get(session_id)! };
	}

	/**
		* Creates a session.
		* - IDs should be numerical due to hash method.
		* - This assumes you already checked if the users in session.
		*/
	createSession(session_info: T, ms_expiry = 30 * 60 * 1000): SessionResult<"AlreadyInSession" | "CreatedSession", { hash: string, session_info: T }> {
		const {players} = session_info;
		// check for NaN values.
		// to create a unique hash.
		const hash = rehash(...players.map(c => Number(c))).toString();
		this.sessions.set(hash.toString(), session_info);
		for (const player of session_info.players) {
			this.users_in_session.set(player, hash);
		}
		setTimeout(() => {
			const sesh = structuredClone(session_info);
			if (this.sessions.delete(hash)) {
				for (const player of sesh.players) {
					this.users_in_session.delete(player);
				}
				this.event_emitter.emit("sessionTimeout", sesh);
			}
		}, ms_expiry);

		return {msg: "CreatedSession", payload: {hash, session_info}};
	}

	deleteSession(session_id: string) {
		const session = structuredClone(this.sessions.get(session_id));
		if (session && this.sessions.delete(session_id)) {
				for (const player of session.players) {
					this.users_in_session.delete(player);
				}
				this.event_emitter.emit("sessionTimeout", session);
		}
	}
	
	// INVITES
	sendInviteTo(from_user: K, to_user: K, ms_expiry = 1 * 60 * 1000) {
		return this.invites.sendInviteTo(from_user, to_user, ms_expiry);
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
	printAllVariables() {
		const invite_vars = this.invites.printAllVariables();
		return invite_vars + "\n"
			+ "sessions: " + JSON.stringify(this.sessions, map_replacer, 4) + "\n"
			+ "users_in_sessions" + JSON.stringify(this.users_in_session, map_replacer, 4) + "\n";
	}
}

function rehash(...ids: number[]): number {
	let hash = 0;
	for (const id of ids) {
		hash ^= id;
	}
	return hash;
}
