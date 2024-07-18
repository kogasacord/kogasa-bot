# kogasa

A comfortable Discord bot for convenience features.

Prefix: `??`

## Features

Parenthesis are optional, square brackets are required.

- `help [command name]`: Finally, a help command!
- `doctor`: Check if your servers are working.
- `buffer ("delete" | "edit")`: Find deleted or edited messages.
- `calc`: Calculator.
- `confess`: Share your secrets.. secretly.
- `img [search query]`: Gets google searches and images.
- `quote`: Reply to someone to quote them saying a fire line of text. Includes attachments. Requires [canvas-http-api](https://github.com/DoormatIka/canvas-http-api).
- `remindme`: Reminds you something in a specified time.
- `randomweb`: Sends you a random website with gacha elements snuck in.
- `sauce`: Reply to an image to find the source of the image relating to anime.

A basic file structure for easy additions to the bot.

## Running

### Base Kogasa

1. Put a `config.json` on the root of the folder.

The structure of it is like this:

```json
{
	"token": "[token of the bot here]",
	"clientID": "[application id of the bot here]",
	"test_token": "[token of the *test* bot here]",
	"saucenao_token": "[saucenao token here]"
}
```
2. Download and extract [canvas](https://github.com/kogasacord/canvas-http-api).
3. Run `npm install` and `ts-node --esm index.ts`.

4. Run `npm install`, `npm run build`, and `npm run prestart` in that order.

## Contributing

1. Make sure to use prettier after you make changes to the code. Run it by calling `npm run format`.

## Misc

Why is there SO MUCH HTTP servers??

- It seemed cool to implement but it got out of hand quickly.

## Incoming

- Adding unit tests with Chai to make the program a bit safe.
