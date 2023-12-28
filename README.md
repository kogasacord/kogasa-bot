# kogasa

A comfortable Discord bot for convenience features.

Prefix: `??`

## Features

- `quote`: Reply to someone to quote them saying a fire line of text. Includes attachments. Requires [canvas-http-api](https://github.com/DoormatIka/canvas-http-api).
- `ytdl [link] [format_id]`: Download videos from YouTube. Requires [ytdlp-drive](https://github.com/DoormatIka/ytdlp-drive-https-api).
- `ytdlf`: Get the quality and format of your video. Can be used with `ytdl` with a `format_id`.
- `google [search_query]` and `img [search_query]`: Gets google searches and images.
- `randomweb`: Sends you a random website with gacha elements snuck in.
- `sauce`: Reply to an image to find the source of the image relating to anime.
- `help`: Finally, a help command!
- `set [command_name/"all"] [channel_id/"all"] [true/false]`: Settings.
- `doctor`: Check if your servers are working.

**Other features**:

- `??quoter` - Quotes but includes replies.

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

2. Download [pocketbase](https://pocketbase.io/docs/) and download the [migration folder](https://github.com/kogasacord/kogasa-pb-base).
   Extract the pocketbase.zip and put the migration folder inside of the pocketbase folder.
3. Run `pocketbase serve` inside the pocketbase folder.
4. Run `npm install`.
5. Run `npx tsc` and go to the `/build` folder and run `node index.js` there.

### Fully Featured Kogasa

This assumes you have done Base Kogasa.

1. Download and extract [ytdlp-drive](https://github.com/kogasacord/ytdlp-drive-https-api).
2. Put a `config.json` with this structure:

```json
{
	"clientID": "clientID of google drive",
	"clientSecret": "clientSecret of google drive",
	"redirectURI": "https://developers.google.com/oauthplayground",
	"token": "token of google drive"
}
```

3. Run `npm install` and `ts-node --esm index.ts`.
4. Download and extract [canvas](https://github.com/kogasacord/canvas-http-api).
5. Run `npm install` and `ts-node --esm index.ts`.

## Contributing

1. Make sure to use prettier after you make changes to the code. Run it by calling `npm run format`.

## Misc

Why is there SO MUCH HTTP servers??
- It seemed cool to implement but it got out of hand quickly.

## Incoming
- Adding unit tests with Chai to make the program a bit safe.
