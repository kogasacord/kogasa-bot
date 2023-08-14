import fetch from "node-fetch";
import { UploadResponse } from "./types";

export async function uploadVideo(filename: string, mimetype: string) {
    const upload = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: JSON.stringify({
            filename: filename,
            mimetype: mimetype,
        }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    })
    return await upload.json() as UploadResponse;
}