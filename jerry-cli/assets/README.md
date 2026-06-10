# Jerry CLI assets

Versioned default assets loaded by [a3t](https://github.com/mieweb/a3t). Contributors can copy files locally and iterate without rebuilding the CLI.

## Layout

```
assets/
  prompts/
    ask.txt      # `jerry ask` system prompt
    report.txt   # `jerry report` generation prompt
    recheck.txt  # post-draft report review prompt
```

## Template variables

| Variable | Used in | Replaced with |
|----------|---------|---------------|
| `{{modelId}}` | all prompts | OpenAI model ID from config |
| `{{activityContext}}` | `report.txt`, `recheck.txt` | ActivityWatch data block for the report window |

## Override workflow

Shipped defaults live in this directory. To customize a prompt locally:

```bash
mkdir -p ~/.config/jerry/assets/prompts
cp jerry-cli/assets/prompts/report.txt ~/.config/jerry/assets/prompts/report.txt
# edit ~/.config/jerry/assets/prompts/report.txt
deno task jerry report "yesterday"   # uses override on the next run; no rebuild
```

Resolution order: **local override → shipped default**. Delete an override file to revert to the shipped version on the next command.

Custom override directory (optional), in `~/.config/jerry/cli.json`:

```json
{
  "a3t": {
    "overridePath": "~/path/to/my/assets"
  }
}
```

See [`src/config.ts`](../src/config.ts) for defaults.
