import { checkLink } from "./ytdl/check_link.js"
import { downloadVideo } from "./ytdl/download.js"
import { formatCheckResults } from "./ytdl/format_check.js"
import { getFormats } from "./ytdl/get_formats.js"
import { getStatus } from "./ytdl/get_status.js"
import { getInfo } from "./ytdl/info.js"
import { uploadVideo } from "./ytdl/upload.js"

import { commandChannelAccess } from "./settings/command_scope.js"
import { prefixChange } from "./settings/prefix.js"

import { quoteAttachment } from "./quote/attachment.js"
import { quoteDefault } from "./quote/default.js"

import { findThroughCollection } from "./pb/pb.js"

import { importDirectories, postprocessAliases } from "./misc/import.js"
import { checkIfLink } from "./misc/link.js"
import { run, asyncRun, wrapInOption } from "./misc/monad.js"
import { pingURL } from "./misc/ping.js"
import { getRandomInt, grabAllRandomWebsites } from "./misc/random.js"
import { formatArray } from "./misc/smartjoin.js"

import { CommandModule as Command, ExternalDependencies as Ext, Cooldown as Cool, JSONObject as JSONO, Tier as Ti, Websites as Webs } from "./types.js"
import { 
	PocketbaseResult as PBR, 
	UsersParameters as UP, 
	MessageParameters as MP, 
	ServerSettingsParameters as SSP, 
	ChannelIDsSettings as CID, 
	CommandScopesParameters as CSP, 
	PBMessages as PBM, 
	PBUsers as PBU, 
	ServerSettings as SS, 
	CommandSettings as CS, 
	ChannelIDsParameters as CIDP 
} from "./pb/types.js";
import {
	DownloadResponse as DR,
	UploadResponse as UR,
	InfoResponse as IR,
	FormatResponse as FR,
	CheckResult as CR,
	StatusResult as SR,
} from "./ytdl/types.js"

const mod = {
	checkLink,
	downloadVideo,
	formatCheckResults,
	getFormats,
	getStatus,
	getInfo,
	uploadVideo,
	
	commandChannelAccess,
	prefixChange,

	quoteAttachment,
	quoteDefault,

	findThroughCollection,
	importDirectories,
	postprocessAliases,
	checkIfLink,
	run, asyncRun,
	wrapInOption,

	pingURL,
	getRandomInt,
	grabAllRandomWebsites,
	formatArray,

};

export type CommandModule = Command
export type ExternalDependencies = Ext
export type Cooldown = Cool
export type JSONObject = JSONO
export type Tier = Ti
export type Websites = Webs

export type PocketbaseResult<T> = PBR<T>
export type UsersParameters = UP
export type MessageParameters = MP 
export type ServerSettingsParameters = SSP 
export type ChannelIDsSettings = CID 
export type CommandScopesParameters = CSP 
export type ChannelIDsParameters = CIDP
export type PBMessages<T = {}> = PBM<T>
export type PBUsers<T = {}> = PBU<T>
export type ServerSettings<T = {}> = SS<T>
export type CommandSettings<T = {}> = CS<T>

export type DownloadResponse = DR
export type UploadResponse = UR
export type InfoResponse = IR
export type FormatResponse = FR
export type CheckResult = CR
export type StatusResult = SR

export default mod;
