import humanize from "humanize-duration";
import { Client, Message } from "discord.js";
import helpers, { DownloadResponse, InfoResponse } from "@helpers/helpers.js";
import { ChannelScope } from "@helpers/types";

const processing_users: string[] = [];

export const name = "ytdl";
export const cooldown = 30;
export const channel: ChannelScope[] = ["Guild"];
export const description = "Download videos from YouTube. Might be illegal.";
export async function execute(client: Client, msg: Message, args: string[]) {
	const index_of_processing_user = processing_users.findIndex(
		(v) => v === msg.author.id
	);
	const requested_link = args[0];
	const format_id = args[1];

	processing_users.push(msg.author.id);

	// performance hit, use JS type stuff instead.
	const unsafeinfo = helpers.wrapInOption(
		await helpers.getInfo(requested_link)
	);
	const download = await helpers.asyncRun(
		unsafeinfo,
		downloadDispatch(msg, requested_link, format_id),
		disabled(msg, index_of_processing_user)
	);
	const upload = await helpers.asyncRun(
		download,
		uploadDispatch,
		disabled(msg, index_of_processing_user)
	);
	helpers.run(upload, (up) => {
		msg.reply(
			`The video you requested \`${up.name}\` has been served at ${up.view}.` +
				"\n\nDid you know you can choose a quality and format with `??ytdl-f [format-id]`? Try it next time."
		);
		return { content: undefined };
	});

	processing_users.splice(index_of_processing_user, 1);
}

function downloadDispatch(
	msg: Message,
	requested_link: string,
	format_id: string
) {
	return async (info: InfoResponse) => {
		msg.reply(
			`Downloading \`${info.file}\` from \`${
				info.uploader
			}\` with an estimate of \`${humanize(info.duration * 1000)}\``
		);
		return { content: await helpers.downloadVideo(requested_link, format_id) };
	};
}
async function uploadDispatch(dl: DownloadResponse) {
	return {
		content: await helpers.uploadVideo(dl.filename, dl.mimetype),
	};
}
function disabled(msg: Message, index_of_processing_user: number) {
	return () => {
		msg.reply("An internal error has occurred.");
		processing_users.splice(index_of_processing_user, 1);
	};
}

export async function checker(msg: Message, args: string[]): Promise<boolean> {
	const index_of_processing_user = processing_users.findIndex(
		(v) => v === msg.author.id
	);
	const requested_link = args[0];
	const format_id = args[1];

	if (!requested_link) {
		msg.reply(`You did not give me anything, ${msg.author.displayName}!`);
		return false;
	}

	if (format_id !== undefined && Number.isNaN(parseInt(format_id, 10))) {
		msg.reply(
			`\`${format_id}\` isn't a valid input! Check \`??ytdlf [link]\`.`
		);
		return false;
	}

	if (index_of_processing_user !== -1) {
		msg.reply(
			"Your video is already being processed. Please wait for your video to finish."
		);
		return false;
	}

	const checks = await helpers.checkLink(requested_link, format_id);
	if (checks.reasons !== undefined && checks.reasons.length > 0) {
		msg.reply(helpers.formatCheckResults(checks));
		return false;
	}

	const status = await helpers.getStatus();
	if (status && status.hasReachedLimit) {
		msg.reply(
			`Sorry ${msg.author.displayName}! My box is currently full. Please try again later.`
		);
		return false;
	}

	return true;
}

export async function dyn_cooldown(args: string[]): Promise<number> {
	const info = await helpers.getInfo(args[0]);
	// https://www.desmos.com/calculator/cxw8pneayf
	return (info.duration * info.duration) / 3500;
}
