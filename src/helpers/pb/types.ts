export interface PocketbaseResult<T> {
    collectionId: string,
    collectionName: string,
    created: string,
    id: string,
    updated: string,
    expand: { [collectionName: string]: T }
}

export interface ServerSettingsParameters {
    serverid?: string,
    prefix?: string,
    nsfw?: boolean,
    self_quote?: boolean,
    channel_ids?: string[]
}

export interface ChannelIDsParameters {
    channel_id: string,
    command_scope: string,
}

export interface CommandScopesParameters {
    quote?:  boolean,
    sauce?:  boolean,
    img?:    boolean,
    google?: boolean,
    doctor?: boolean,
    ytdl?:   boolean,
    ping?:   boolean,
    ytdlf?:  boolean,
    dyn?:    boolean,
}

export interface ServerSettings<T = {}> extends PocketbaseResult<T>, ServerSettingsParameters { };
export interface CommandSettings<T = {}> extends PocketbaseResult<T>, CommandScopesParameters { };
export interface ChannelIDsSettings<T = {}> extends PocketbaseResult<T>, ChannelIDsParameters { };