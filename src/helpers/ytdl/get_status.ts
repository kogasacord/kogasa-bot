import fetch from "node-fetch";
import { StatusResult } from "./types";

import {ytdl_endpoint} from "../../../settings.json";

export async function getStatus() {
	const status = await fetch(`${ytdl_endpoint}/status`, {
		method: "GET",
	});
	return (await status.json()) as StatusResult;
}
