# kogasa

A comfortable Discord bot for convenience features.

Prefix: `??`

## Features
- `quote`: Reply to someone to quote them saying a fire line of text. Includes attachments. Requires [canvas-http-api](https://github.com/DoormatIka/canvas-http-api) and [sharp-utils](https://github.com/DoormatIka/sharp-utils).
- `ytdl [link] [format_id]`: Download videos from YouTube. Requires [ytdlp-drive](https://github.com/DoormatIka/ytdlp-drive-https-api).
- `ytdlf`: Get the quality and format of your video. Can be used with `ytdl` with a `format_id`.
- `google [search_query]` and `img [search_query]`: Gets google searches and images.

**Other features**:

A basic file structure for easy additions to the bot.




Why is there SO MUCH HTTP servers??
- It seemed cool to implement but it got out of hand quickly. It also has the perk of getting faster results than only one process handling everything.