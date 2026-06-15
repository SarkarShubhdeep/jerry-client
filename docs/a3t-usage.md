# a3t prompt overrides (jerry-cli adapter)

jerry-cli is a **reference adapter** for [@sarkarshubhdeep/jerry-lib](https://jsr.io/@sarkarshubhdeep/jerry-lib). Prompt loading and override resolution are owned by jerry-lib, not this repo.

## Canonical documentation

All prompt override guides live in the jerry-lib repo:

- [docs/a3t-prompts.md](https://github.com/SarkarShubhdeep/jerry-lib/blob/main/docs/a3t-prompts.md) — asset layout, override workflow, template variables
- [docs/host-integration.md](https://github.com/SarkarShubhdeep/jerry-lib/blob/main/docs/host-integration.md) — full host integration walkthrough
- [JSR package](https://jsr.io/@sarkarshubhdeep/jerry-lib) — install and API reference

## jerry-cli quick test

```bash
mkdir -p ~/.config/jerry/assets/prompts
curl -o ~/.config/jerry/assets/prompts/report.txt \
  https://raw.githubusercontent.com/SarkarShubhdeep/jerry-lib/main/assets/prompts/report.txt
# edit ~/.config/jerry/assets/prompts/report.txt
cd jerry-cli && deno task jerry report yesterday
```

See [jerry-cli/README.md](../jerry-cli/README.md) for CLI commands.
