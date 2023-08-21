import Pocketbase from "pocketbase";

export interface ServerSettingsResult {
    collectionId: string,
    collectionName: string,
    created: string,
    id: string,
    updated: string,
    expand: {}
}

export interface ServerSettingsParameters {
    serverid?: string,
    prefix?: string,
    nsfw?: boolean,
    self_quote?: boolean,
}

export interface ServerSettings extends ServerSettingsResult, ServerSettingsParameters { };