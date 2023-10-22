import fs from "fs";
import readline from "readline";
/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 *
 * From Mozilla.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function grabAllRandomWebsites(path) {
    return new Promise((res, rej) => {
        const sites = [];
        const readInterface = readline.createInterface({
            input: fs.createReadStream(path),
        });
        readInterface.on('line', (input) => {
            sites.push(JSON.parse(input));
        });
        readInterface.on('close', () => { res(sites); });
    });
}
