import fetch from "node-fetch";

import settings from "../../../settings.json";

export async function quoteAttachment(
	text: string,
	author: string,
	avatar_url: string,
	attachment_url: string,
	height: number,
	width: number,
	mimetype: string,
	show_boundaries: boolean
) {
	const check = await fetch(`${settings.ytdl_endpoint}/quote/img`, {
		method: "POST",
		body: JSON.stringify({
			text: text,
			author: author,
			avatar_url: avatar_url,
			attachment_url: attachment_url,
			attachment_height: height,
			attachment_width: width,
			mimetype: mimetype,
			use_test_pfp: false,
			show_bounding: show_boundaries,
			pipe_to_file: false,
		}),
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
	return Buffer.from(await check.arrayBuffer());
}
