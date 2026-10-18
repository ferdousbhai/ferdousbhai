---
title: Ghost
description: An orchestration layer for all your agent harnesses on Omarchy.
---

# Ghost

Ghost is an orchestration layer for all your agent harnesses on [Omarchy](https://omarchy.org). It coordinates the agent CLIs you already use (Claude Code, Codex, Grok, OpenCode, pi), keeping each harness's own sign-ins, tools and limits. Give a ghost a character and a job; it uses those harnesses to work your apps, browser and files. Ghost and your files stay on your computer.

Two parts, each usable alone:

- [Ghost](#app): the app.
- [ghost-desktop](#desktop): computer use for any AI agent.

## Install Ghost {#app}

Give your ghost a job: tidy a folder, fill in a form on a site you're signed into, check something every morning, or hand a coding task to your other agents and report back. It keeps going on long tasks and asks when a decision is yours. Each ghost has its own character and keeps its notes as plain files in your Documents.

Ghost is available from Omarchy's package repository; `omarchy update` keeps it current.

```sh
omarchy pkg add ghost
```

Then follow [Getting started](https://github.com/ferdousbhai/ghost/blob/master/docs/getting-started.md) to turn it on for your login.

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

## Links

- [Getting started](https://github.com/ferdousbhai/ghost/blob/master/docs/getting-started.md)
- [Source and issues](https://github.com/ferdousbhai/ghost), Apache-2.0
- [Releases](https://github.com/ferdousbhai/ghost/releases)
