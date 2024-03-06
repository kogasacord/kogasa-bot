// wrapper for the entire helper folder.

import { checkLink } from "./ytdl/check_link.js";
import { downloadVideo } from "./ytdl/download.js";
import { formatCheckResults } from "./ytdl/format_check.js";
import { getFormats } from "./ytdl/get_formats.js";
import { getStatus } from "./ytdl/get_status.js";
import { getInfo } from "./ytdl/info.js";
import { uploadVideo } from "./ytdl/upload.js";

import { quoteDefault } from "./quote/default.js";

import { importDirectories, postProcessAliases } from "./misc/import.js";
import { completePartialMessage } from "./misc/fetch.js";
import { checkIfLink } from "./misc/link.js";
import { run, asyncRun, wrapInOption } from "./misc/monad.js";
import { pingURL } from "./misc/ping.js";
import {
	pickRandom,
	getRandomInt,
	grabAllRandomWebsites,
	gachaSpecificWebsite,
} from "./misc/random.js";
import { formatArray } from "./misc/smartjoin.js";
import { Queue } from "./misc/queue.js";

import {
	CommandModule as Command,
	ExternalDependencies as Ext,
	Cooldown as Cool,
	JSONObject as JSONO,
	Tier as Ti,
	Website as Webs,
} from "./types.js";
import {
	DownloadResponse as DR,
	UploadResponse as UR,
	InfoResponse as IR,
	FormatResponse as FR,
	CheckResult as CR,
	StatusResult as SR,
} from "./ytdl/types.js";

const mod = {
	checkLink,
	downloadVideo,
	formatCheckResults,
	getFormats,
	getStatus,
	getInfo,
	uploadVideo,

	quoteDefault,

	importDirectories,
	postProcessAliases,
	checkIfLink,
	run,
	asyncRun,
	wrapInOption,

	pingURL,
	getRandomInt,
	grabAllRandomWebsites,
	formatArray,
	gachaSpecificWebsite,

	completePartialMessage,
	pickRandom,
	Queue,
};

export type CommandModule = Command;
export type ExternalDependencies = Ext;
export type Cooldown = Cool;
export type JSONObject = JSONO;
export type Tier = Ti;
export type Website = Webs;

export type DownloadResponse = DR;
export type UploadResponse = UR;
export type InfoResponse = IR;
export type FormatResponse = FR;
export type CheckResult = CR;
export type StatusResult = SR;

export default mod;
