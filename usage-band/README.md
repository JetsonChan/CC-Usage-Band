# usage-band

A Claude Code mod that puts a one-line band above the prompt with what you need to keep an eye on while you work:

- **5h / 7d** — how much of your 5-hour and 7-day rate-limit windows is used, and when each resets
- **Context** — tokens in the context window out of its size
- **Cache hit** — how much of the last turn's input the prompt cache served

Each metric has its own color and turns red when it needs attention: a limit or the context past 80%, or a cache hit rate under 50%. The limit bars carry a slow shine that sweeps left to right, in step across bars.

## How it looks

**Terminal**

```
5h ■■■■■■■■ 78% · 1h18m  7d ■■■■■■■■ 48% · 5d3h  󰌨 398K/1M  󰓾 100%
```

The line fits itself to the terminal width: on a narrow terminal it drops the bars first, then the countdowns.

**Desktop app (Code tab)**

A single centered row drawn as SVG: limit bars with the figure and reset time beside them, the context window as a 2×10 dot matrix (each dot is 5% of the window), and the cache hit rate. Hairlines separate the groups. It follows the app's light and dark mode.

## Install

```
/plugin marketplace add JetsonChan/CC-Usage-Band
/plugin install usage-band@cc-usage-band
```

Or for one session from a local checkout:

```bash
claude --plugin-dir /path/to/usage-band
```

## Settings

| Option  | Values                              | Default | What it does |
| ------- | ----------------------------------- | ------- | ------------ |
| `icons` | `auto`, `nerd`, `unicode`, `ascii`  | `auto`  | Terminal icon set. `auto` uses Nerd Font icons in Ghostty (it ships them) and plain Unicode elsewhere. Pick `nerd` if your terminal font is a Nerd Font, `ascii` for the most basic terminals. |

Change it from the config menu (`/config` in a terminal session).

Run `/usage-band-preview` to see the band in every terminal style side by side, including how a 256-color terminal shows the colors.

## Notes

- The 5h / 7d figures come from your subscription's rate-limit headers, so they appear after the first response of a session and only on a subscription.
- The cache hit rate is the last turn's cache reads over all its input (uncached + cache reads + cache writes), summed over the turn's requests.
- The desktop text uses Inter when it is installed and falls back to SF Pro / the system UI font.

## What it can reach

Mods run with the same access as Claude Code itself; they are not sandboxed. This one only:

- reads the session's usage figures (`$.session.usage`, `session.measure`, `turn.complete`)
- reads the `TERM_PROGRAM` environment variable to pick terminal icons
- registers the `/usage-band-preview` command and draws the band

It reads no files, runs no processes and makes no network requests.

## Development

```bash
claude plugin validate .
claude plugin test .
```

## License

[MIT](./LICENSE)
