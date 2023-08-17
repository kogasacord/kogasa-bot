import fetch from "node-fetch";
import { DownloadResponse } from "./types";

export async function downloadVideo(
    request: string,
    format_id?: string,
) {
    const download = await fetch("http://localhost:3000/download", {
        method: "POST",
        body: JSON.stringify({
            link: request,
            format_id: format_id,
        }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return await download.json() as DownloadResponse;
}