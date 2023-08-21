import { Client, Message } from "discord.js";
import { ExternalDependencies } from "../helpers/types";

export const name = "set";
export const cooldown = 30;
export const description = "Settings for server owners or moderators to set."
export async function execute(
    client: Client, 
    msg:    Message, 
    args:   string[], 
    ext:    ExternalDependencies
) {
    
}