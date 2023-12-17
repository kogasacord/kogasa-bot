export function checkIfLink(text: string) {
	const urlRegex =
		/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
	const match = text.match(urlRegex);
	if (match) {
		return match.length > 0 ? true : false;
	}
	return false;
}
