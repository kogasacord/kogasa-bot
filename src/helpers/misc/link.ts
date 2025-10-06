import { GuildMember, User } from "discord.js";

export function checkIfLink(text: string) {
	const urlRegex =
		/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
	const match = text.match(urlRegex);
	if (match) {
		return match.length > 0 ? true : false;
	}
	return false;
}

export async function getAvatarURL(user: User, guild_member: GuildMember): Promise<{ type: "png" | "gif", url: string }> {
	const gif_url = guild_member.displayAvatarURL({ size: 1024, extension: "gif" }) ??
		user.displayAvatarURL({ size: 1024, extension: "gif" });

	const png_url = guild_member.displayAvatarURL({ size: 1024, extension: "png" }) ??
		user.displayAvatarURL({ size: 1024, extension: "png" });

	if (await isValidAvatarURL(gif_url)) {
		return { type: "gif", url: gif_url };
	}
	if (await isValidAvatarURL(png_url)) {
		return { type: "png", url: png_url };
	}
	throw new Error(`Error getting png/gif avatars for user ${user.id} "${user.username}"`);
}

export async function isValidAvatarURL(url: string): Promise<boolean> {
	try {
		const response = await fetch(url, { method: "HEAD" }); // faster, no body download
		const contentType = response.headers.get("content-type");

		// discord returns JSON for invalid avatars, image/* for valid ones
		if (!response.ok) return false;
		if (!contentType) return false;

		return contentType.startsWith("image/");
	} catch {
		return false;
	}
}
