---
title: Ghost
description: An orchestration layer for all your agent harnesses on Omarchy.
---

# Ghost

Ghost is an orchestration layer for all your agent harnesses on [Omarchy](https://omarchy.org). It coordinates the agent CLIs you already use (Claude Code, Codex, Grok, OpenCode, pi), keeping each harness's own sign-ins, tools and limits. Give a ghost a character and a job; it uses those harnesses to work your apps, browser and files. Ghost and your files stay on your computer.

Three parts, each usable alone:

- [Ghost](#app): the app.
- [ghost-desktop](#desktop): computer use for any AI agent.
- [Ghost for Chrome](#chrome): an AI agent in your Chrome.

[Summon Ghost](#summon), a separate project, puts it all in a web app (coming soon).

## Install Ghost {#app}

Give your ghost a job: tidy a folder, fill in a form on a site you're signed into, check something every morning, or hand a coding task to your other agents and report back. It keeps going on long tasks and asks when a decision is yours. Each ghost has its own character and keeps its notes as plain files in your Documents.

Ghost is available directly from Omarchy's package repository; `omarchy update` keeps it current.

```sh
omarchy pkg add ghost
```

Start the daemon and enable the desktop plugin in your login:

```sh
systemctl --user enable --now ghostd.service
mkdir -p ~/.config/omarchy/plugins
ln -sfnT /usr/share/ghost/plugin ~/.config/omarchy/plugins/ferdousbhai.ghost
omarchy-shell shell rescanPlugins
omarchy plugin enable ferdousbhai.ghost
```

If you installed from the old `[ghost]` repository, run the installer once to remove it. The installer now uses Omarchy's package repository and performs the setup above. Run it as yourself; it asks for sudo when needed.

```sh
curl -fsSL https://ferdousbhai.com/ghost/install.sh | bash
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

## Summon Ghost {#summon}

Ghost as a web app: a managed Arch desktop with a ghost running it, no machine of your own needed. Coming soon at [summonghost.com](https://summonghost.com).

## Links

- [Getting started](https://github.com/ferdousbhai/ghost/blob/master/docs/getting-started.md)
- [Source and issues](https://github.com/ferdousbhai/ghost), Apache-2.0
- [Releases](https://github.com/ferdousbhai/ghost/releases)
- [The install script](https://github.com/ferdousbhai/ghost/releases/latest/download/install.sh), to read before running
