
import {map_replacer} from "@root/src/commands/chess.js";
import {InviteManager} from "./invite.js";
import events from "events";

/*
interface Session {
	channel_id: string, 
	fen: string, 
	moves: string[], 
	turn: number, 
}
*/

type SessionEmitters = "sessionTimeout";
export type SessionMessages = "AlreadyInSession" | "CreatedSession";
export type SessionResult<K extends SessionMessages, P = NonNullable<unknown>> = { msg: K, payload: P };


/**
	* Manages the lifecycle of a session.
	*/
export class SessionManager<T extends { players: string[] }, K extends { id: string }> {
	private sessions = new Map<string, T>();
	private users_in_session = new Map<string, string>;
	private event_emitter = new events.EventEmitter();
	
	constructor(private invites = new InviteManager<K>()) {}
	
	on(event: SessionEmitters, listener: (session_info: T) => void) {
		this.event_emitter.addListener(event, listener);
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
	getSessionWithUser(player: string): T | undefined {
		const user_in_session = this.users_in_session.get(player);
		if (!user_in_session) {
			return undefined;
		}
		return this.sessions.get(user_in_session)!;
	}

	/**
		* Creates a session.
		* - IDs should be numerical due to hash method.
		* - This assumes you already checked if the users in session.
		*/
	createSession(session_info: T, ms_expiry = 30 * 60 * 1000): SessionResult<"AlreadyInSession" | "CreatedSession"> {
		const {players} = session_info;
		// check for NaN values.
		// to create a unique hash.
		const hash = rehash(...players.map(c => Number(c))).toString();
		this.sessions.set(hash.toString(), session_info);
		setTimeout(() => {
			const sesh = structuredClone(session_info);
			if (this.sessions.delete(hash)) {
				// TODO: put out a custom event that emits this every time this happens.
				// do it for invites too, to track expiring invites.
				this.event_emitter.emit("sessionTimeout", sesh);
			}
		}, ms_expiry);

		return {msg: "CreatedSession", payload: {}};
	}

	deleteSession(session_id: string): boolean {
		return this.sessions.delete(session_id);
	}
	
	// INVITES
	sendInviteTo(from_user_id: string, to_user_id: string, payload: K) {
		return this.invites.sendInviteTo(from_user_id, to_user_id, payload);
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
