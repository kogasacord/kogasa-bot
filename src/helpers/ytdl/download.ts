import fetch from "node-fetch";
import { DownloadResponse } from "./types";

export async function downloadVideo(request: string) {
    const download = await fetch("http://localhost:3000/download", {
        method: "POST",
        body: JSON.stringify({
            link: request,
            best: 1,
        }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return await download.json() as DownloadResponse;
}