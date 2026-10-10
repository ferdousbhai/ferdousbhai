---
title: Ghost
description: Personal AI agents that live on your Omarchy computer and work your apps, browser and files for you.
---

# Ghost

A ghost is a personal AI agent on your [Omarchy](https://omarchy.org) computer. It works your apps, browser and files as you would, through the agent CLIs you already use (Claude Code, Codex, Grok, OpenCode, pi) on their own sign-ins and limits. The ghost and your files stay on your computer.

Three parts, each usable alone:

- [Ghost](#app): the app.
- [ghost-desktop](#desktop): computer use for any AI agent.
- [Ghost for Chrome](#chrome): an AI agent in your Chrome.

[Summon Ghost](#summon), a separate project, puts it all in a web app (coming soon).

## Install Ghost {#app}

Give your ghost a job: tidy a folder, fill in a form on a site you're signed into, check something every morning, or hand a coding task to your other agents and report back. It keeps going on long tasks and asks when a decision is yours. Each ghost has its own character and keeps its notes as plain files in your Documents.

One command adds the signed package repository and its key, then installs Ghost; `omarchy update` keeps it current. Run it as yourself; it asks for sudo when needed.

```sh
curl -fsSL https://ferdousbhai.com/ghost/install.sh | bash
```

Then start the daemon and enable the desktop plugin:

```sh
systemctl --user enable --now ghostd.service
ln -sfn /usr/share/ghost/plugin ~/.config/omarchy/plugins/ferdousbhai.ghost
omarchy-shell shell rescanPlugins
omarchy plugin enable ferdousbhai.ghost
```

Open Ghost from the app launcher, or from the terminal: `ghost new <name>` makes a ghost and `ghost use <name>` selects it. Sign in through each agent's own CLI. `ghost harnesses` lists the available agents; `ghost switch codex` moves the current conversation to another agent, history intact.

For a Super + Ctrl + G shortcut, copy `ghost.lua` or `ghost.conf` from `/usr/share/doc/ghost/shell-contrib/hyprland/` into your Hyprland config; Ghost never edits it.

## From the terminal

`ghost` does everything the app does:

```sh
ghost say "What should I focus on today?"
ghost sessions
ghost show -s cli-abc
```

## Requirements

- Omarchy.
- An agent CLI. OpenCode's free models need no sign-in; other agents use the subscriptions or API keys set in their own CLIs.

## ghost-desktop {#desktop}

Computer use for any AI agent. Ghosts use it to see your screen, click, type and switch windows; Claude Code, Codex and other agents can too. It never touches a locked screen, and agents take turns at the computer.

```sh
bun install -g github:ferdousbhai/ghost-desktop
claude mcp add --scope user desktop -- ghost-desktop
```

Included in Ghost. Standalone, it needs [Bun](https://bun.sh) and Omarchy. [Source and issues](https://github.com/ferdousbhai/ghost-desktop), Apache-2.0.

## Ghost for Chrome {#chrome}

An AI agent in your Chrome. It works in its own tabs, reading and filling in pages behind your logins while your tabs stay yours. Chat with it in the side panel on a free model through your OpenRouter account, or let your ghost drive it.

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/ghost/hiikecmfleghkggknndabdkmlmnohpbm). [Source and issues](https://github.com/ferdousbhai/ghost-chromium-extension), Apache-2.0.

## Summon Ghost {#summon}

Ghost as a web app: a managed Arch desktop with a ghost running it, no machine of your own needed. Coming soon at [summonghost.com](https://summonghost.com).

## Links

- [Getting started](https://github.com/ferdousbhai/ghost/blob/master/docs/getting-started.md)
- [Source and issues](https://github.com/ferdousbhai/ghost), Apache-2.0
- [Releases](https://github.com/ferdousbhai/ghost/releases)
- [The install script](https://github.com/ferdousbhai/ghost/releases/latest/download/install.sh), to read before running
