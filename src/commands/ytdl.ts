import humanize from "humanize-duration";
import { Client, Message } from "discord.js";
import { formatCheckResults } from "../helpers/ytdl/format_check.js";
import { checkLink } from "../helpers/ytdl/check_link.js";
import { getStatus } from "../helpers/ytdl/get_status.js";
import { getInfo } from "../helpers/ytdl/info.js";
import { downloadVideo } from "../helpers/ytdl/download.js";
import { uploadVideo } from "../helpers/ytdl/upload.js";

const processing_users: string[] = [];

export const name = "ytdl";
export const cooldown = 30;
export async function execute(client: Client, msg: Message, args: string[]) {
    const index_of_processing_user = processing_users.findIndex(v => v === msg.author.id);
    const requested_link = args[0];
    const format_id = args[1];

    if (!requested_link) {
        msg.reply(`You did not give me anything, ${msg.author.displayName}!`);
        return;
    }

    if (format_id !== undefined && Number.isNaN(parseInt(format_id, 10))) {
        msg.reply(`\`${format_id}\` isn't a valid input! Check \`??ytdlf [link]\`.`)
        return;
    }

    if (index_of_processing_user === -1) {
        processing_users.push(msg.author.id);
    } else {
        msg.reply("Your video is already being processed. Please wait for your video to finish.");
        return;
    }

    const checks = await checkLink(requested_link, format_id);
    if (checks.reasons !== undefined && checks.reasons.length > 0) {
        msg.reply(formatCheckResults(checks));
        return;
    }

    const status = await getStatus();
    if (status && status.hasReachedLimit) {
        msg.reply(`Sorry ${msg.author.displayName}! My box is currently full. Please try again later.`);
        return;
    }
    
    const info = await getInfo(requested_link);
    if (info.size_mbytes === undefined) {
        msg.reply(`An internal error has occured with getting info.`);
        console.groupCollapsed(info);
        return;
    }
    msg.reply(`Downloading \`${info.file}\` from \`${info.uploader}\` with an estimate of \`${humanize(info.duration * 1000)}\``)
    
    const dl = await downloadVideo(requested_link, format_id);
    if (dl.filename === undefined) {
        msg.reply(`An internal error has occured with downloading.`);
        console.log(dl);
        return; // its an error
    }

    const up = await uploadVideo(dl.filename, dl.mimetype);
    if (up.content === undefined) {
        msg.reply(`An internal error has occured with uploading.`);
        console.log(up);
        return;
    }
    msg.reply(`The video you requested \`${up.name}\` has been served at ${up.view}.` + 
        `\n\nDid you know you can choose a quality and format with \`??ytdl-f [format-id]\`? Try it next time.`);
    
    processing_users.splice(index_of_processing_user, 1);
}

export async function dyn_cooldown(args: string[]): Promise<number> {
    if (!args[0]) {
        return 0;
    }
    
    const checks = await checkLink(args[0], args[1]);
    if (checks.reasons !== undefined && checks.reasons.length > 0) {
        return 0;
    }
    const status = await getStatus();
    if (status && status.hasReachedLimit) {
        return 0;
    }
    const info = await getInfo(args[0]);
    // https://www.desmos.com/calculator/cxw8pneayf
    return (info.duration * info.duration) / 3500;
}