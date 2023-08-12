import fetch from "node-fetch";
import { Client, Message } from "discord.js";

export const name = "ytdl";
export const cooldown = 30;
export async function execute(client: Client, msg: Message, args: string[]) {
    msg.reply(`My developer is working on a better cooldown system. I'm sorry but this feature is temporarily closed!`);
    /*
    if (!args[0]) {
        msg.reply(`You did not give me anything, ${msg.author.displayName}!`);
        return;
    }

    const checks = await checkLink(args[0]);
    if (checks.reasons !== undefined && checks.reasons.length > 0) {
        msg.reply(formatCheckResults(checks));
        return;
    }

    const status = await getStatus();
    if (status && status.hasReachedLimit) {
        msg.reply(`Sorry ${msg.author.displayName}! My box is currently full. Please try again later.`);
        return;
    }
    
    const info = await getInfo(args[0]);
    if (info.size_mbytes === undefined) {
        msg.reply(`An internal error has occured with getting info.`);
        return;
    }
    msg.reply(`Downloading \`${info.file}\` from \`${info.uploader}\` with an estimate of \`${humanize(info.duration * 1000)}\``)
    
    const dl = await downloadVideo(args[0]);
    if (dl.filename === undefined) {
        msg.reply(`An internal error has occured with downloading.`);
        return; // its an error
    }

    const up = await uploadVideo(dl.filename, dl.mimetype);
    if (up.content === undefined) {
        msg.reply(`An internal error has occured with uploading.`);
        return;
    }
    msg.reply(`The video you requested \`${up.name}\` has been served at ${up.view}`);
    */
}

type DownloadResponse = {
    filename: string,
    name: string,
    mimetype: string,
}
type UploadResponse = {
    name: string,
    view: string,
    content: string,
    id: string,
}
type InfoResponse = {
    file: string,
    size_mbytes: number,
    size_mbits: number,
    speed_mbits: number,
    uploader: string,
    duration: number,
    download_length_seconds: number,
}
type CheckResult = { 
    reasons?: ("NO_LINK" | "NO_PATH_NAME" | "NOT_YOUTUBE" | "NOT_VIDEO" | "TOO_LONG")[]
};
type StatusResult = {
    hasReachedLimit: boolean,
    folderSize: number,
    limit?: string,
    usage?: string,
    usageInDrive?: string,
    usageInDriveTrash?: string,
}

function formatCheckResults(check: CheckResult): string {
    let str = "It might have failed because of: \n";
    for (const checks of check.reasons!) {
        switch (checks) {
            case "NOT_VIDEO":
                str += "The link not being a video.\n";
                break;
            case "NOT_YOUTUBE":
                str += "The link not pointing to YouTube.\n";
                break;
            case "NO_LINK":
                str += "An invalid link.\n";
                break;
            case "NO_PATH_NAME":
                str += "You pointing me to the homepage.\n";
                break;
            case "TOO_LONG":
                str += "The video being too long (below 2 hours is allowed).\n"
                break;
            default:
                break;
        }
    }
    return str;
}


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

async function checkLink(link: string) {
    const check = await fetch("http://localhost:3000/checklink", {
        method: "POST",
        body: JSON.stringify({ link: link }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return await check.json() as CheckResult;
}

async function getStatus() {
    const status = await fetch("http://localhost:3000/status", {
        method: "GET",
    })
    return await status.json() as StatusResult;
}

async function getInfo(request: string) {
    const info = await fetch("http://localhost:3000/info", {
        method: "POST",
        body: JSON.stringify({
            link: request
        }),
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    });
    return await info.json() as InfoResponse;
}

async function downloadVideo(request: string) {
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

async function uploadVideo(filename: string, mimetype: string) {
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