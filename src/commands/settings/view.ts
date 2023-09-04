// view every scoped command

import { ExternalDependencies } from "../../helpers/types.js";
import { Client, Message } from "discord.js";

export const name = "viewset";
export const cooldown = 5;
export const description = "Settings for server owners or moderators to set."
export const noscope = true;
export async function execute(
    client: Client,
    msg: Message,
    args: string[],
    ext: ExternalDependencies
) {
    
}