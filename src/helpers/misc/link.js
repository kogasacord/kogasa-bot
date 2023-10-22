export function checkIfLink(text) {
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const match = text.match(urlRegex);
    if (match) {
        return match.length > 0 ? true : false;
    }
    return false;
}
