import fetch from "node-fetch";
export async function uploadVideo(filename, mimetype) {
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
    });
    return await upload.json();
}
