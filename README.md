# kogasa-bot 🏖️

A Discord bot dedicated to spurring activity without being intrusive.

It has a basic file structure to make commands easy to add.

Status: Experimental and unstable, comnands and code structure may disappear or change dramatically when made available for testing.

Prefix: `??`

## Commands
- `help [command name]`: Finally, a help command!
- `doctor`: Diagnosis. I need to make this more comprehensive soon.
- `bible`: Check if any of the words in a replied message are in the bible.
- `dice`: DnD-styled rolls.
- `buffer`: Find deleted or edited messages.
- `calc`: A recursive descent parsing calculator.
- `confess`: Share your secrets in servers without anyone knowing.
- `img [search query]`: Gets google searches and images.
- `quote`: Reply to someone to quote their message on a dramatic picture. Requires [canvas-go](https://github.com/kogasacord/canvas-go).
- `remindme`: Reminds you something in a specified time.
- `randomweb`: Sends you a random website with gacha elements snuck in.

Instructions to use these are in the `help` command.

## Running
1. Put a `config.json` on the root of the folder.

The structure of it is like this:

```json
{
	"token": "[token of the bot here]",
	"clientID": "[application id of the bot here]",
	"test_token": "[token of the *test* bot here]"
}
```

2. Download and extract [canvas](https://github.com/kogasacord/canvas-http-api), follow the instructions in that README to run it.
3. Run `npm install`, `npm run poststart-windows` or `npm run poststart-linux` in that order.

## Contributing

1. Make sure to use prettier after you make changes to the code. Run it by calling `npm run format`.