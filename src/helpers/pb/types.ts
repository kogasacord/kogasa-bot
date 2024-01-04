export interface PocketbaseResult<T> {
	collectionId: string;
	collectionName: string;
	created: string;
	id: string;
	updated: string;
	expand: { [collectionName: string]: T };
}

/**
	* @param user_id: discord id
	* @param love: how much love there was `??love`
	* @param names: separated by "," | e.g: "komainu, alice, margatroid"
	*/
export interface UsersParameters {
	user_id: string;
	love: number;
	names: string;
}

export interface MessageParameters {
	content: string;
	role: string;
}

export interface ServerSettingsParameters {
	serverid?: string;
	prefix?: string;
	nsfw?: boolean;
	self_quote?: boolean;
	channel_ids?: string[];
}

export interface ChannelIDsParameters {
	channel_id: string;
	command_scope: string;
}

export interface CommandScopesParameters {
	quote?: boolean;
	sauce?: boolean;
	img?: boolean;
	google?: boolean;
	doctor?: boolean;
	ytdl?: boolean;
	ping?: boolean;
	ytdlf?: boolean;
	dyn?: boolean;
}

export interface PBMessages<T = NonNullable<unknown>>
	extends PocketbaseResult<T>,
		MessageParameters {}
export interface PBUsers<T = NonNullable<unknown>>
	extends PocketbaseResult<T>,
		UsersParameters {}
export interface ServerSettings<T = NonNullable<unknown>>
	extends PocketbaseResult<T>,
		ServerSettingsParameters {}
export interface CommandSettings<T = NonNullable<unknown>>
	extends PocketbaseResult<T>,
		CommandScopesParameters {}
export interface ChannelIDsSettings<T = NonNullable<unknown>>
	extends PocketbaseResult<T>,
		ChannelIDsParameters {}
