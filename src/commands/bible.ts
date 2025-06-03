
import path from "path";
import fs from "fs";
import * as url from "url";
import { Client, Message } from "discord.js";
import { ChannelScope } from "@helpers/types";

// \u001b[{format};{color}m

const RESET = "\u001b[0;0m";
const GREEN = "\u001b[0;32m";
const bible_list = await importBibleCSV();

export const name = "isthisinthebible";
export const cooldown = 5;
export const description = "Reply or type a message to check if any of those words are in the bible. ";
export const extended_description = "`??isthisinthebible [content?]` or reply to a message.\nThis command scans through every word in the bible and your text and compares them.";
export const channel: ChannelScope[] = ["Guild"];
export const aliases = ["biblecheck"];
export async function execute(_client: Client, msg: Message, args: string[]) {
	let res: Words | undefined;
	if (msg.reference?.messageId !== undefined) {
		const replied = await msg.channel.messages.fetch(msg.reference.messageId);
		const replied_words = replied.content.split(" ");
		res = formatMessage(bible_list, replied_words);
	} else if (args.length > 0) {
		res = formatMessage(bible_list, args);
	} else {
		msg.reply("Do `??isthisinthebible [content]` or reply to a message with `??isthisinthebible`.");
		return;
	}

	if (res) {
		if (res.msg.length < 1500) {
			msg.reply(`${res.percentage}% are in the bible.\n${res.msg}`);
		} else {
			msg.reply(`${res.percentage}% are in the bible.`);
		}
	}
}

type Words = {percentage: number, msg: string};

function formatMessage(dictionary: Set<string>, words: string[]): Words {
	let processedMessage = "```ansi\n";
	let words_in_bible = 0;

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const is_available = dictionary.has(word.replace(/[.,/#!$%^&*;:{}=\-_`~()'\\@]/g, ""));

		if (is_available === true) {
			processedMessage += `${GREEN}${word}${RESET} `;
			words_in_bible++;
		} else {
			processedMessage += `${word} `;
		}
	}

	processedMessage += "\n```";

	return {
		percentage: (words_in_bible / words.length) * 100,
		msg: processedMessage,
	};
}

function importBibleCSV(): Promise<Set<string>> {
	const p = url.pathToFileURL(path.join("./media/bible.csv"));
	const r = new Set<string>();

	return new Promise((res, rej) => {
		let last = "";
		fs.createReadStream(p)
			.on("data", function(chunk) {
				let i = 0;
				let lines: string[] = [];

				lines = (last + chunk.toString("utf8")).split("\n");
				for (i = 0; i < lines.length; i++) {
					const line = lines[i];
					const [name] = line.toLowerCase().split(",");
					r.add(name.trim());
				}
				last = lines[i];
			})
			.on("end", function() {
				res(r);
			})
			.on("error", rej);
	});
}
