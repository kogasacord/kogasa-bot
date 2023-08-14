import fetch from "node-fetch";

export default async function startup() {
    await enableAutoDelete();
}

// scripts to run on startup
export async function enableAutoDelete() {
    await fetch("http://localhost:3000/enableAutoDeletion", {
        method: "POST",
        body: JSON.stringify({
            minutes: 15,
        }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    console.log(`Enabled autoDelete for googledrive.`);
}