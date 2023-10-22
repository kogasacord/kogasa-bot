import fetch from "node-fetch";
export async function getStatus() {
    const status = await fetch("http://localhost:3000/status", {
        method: "GET",
    });
    return await status.json();
}
