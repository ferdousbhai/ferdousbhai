---
title: Ghost
description: An orchestration layer for all your agent harnesses on Omarchy.
---

# Ghost

An orchestration layer for your agent harnesses on [Omarchy](https://omarchy.org). Ghost runs the agent CLIs you already use (Claude Code, Codex, Grok, OpenCode, pi) with their own sign-ins, tools and limits. Give a ghost a character and a job: tidy a folder, fill in a form on a site you're signed into, check something every morning, or hand a coding task to your other agents. It works your apps, browser and files, keeps going on long tasks, and asks when a decision is yours. Each ghost keeps its notes as plain files in your Documents; Ghost and your files stay on your computer.

## Install {#app}

```sh
omarchy pkg add ghost
```

Then [turn it on for your login](https://github.com/ferdousbhai/ghost/blob/master/docs/getting-started.md).

Omarchy's package repository can take a day to carry a new release. For the latest now, run this as yourself; it installs the same package and turns Ghost on, and `omarchy update` keeps it current afterwards:

```sh
curl -fsSL https://ferdousbhai.com/ghost/install.sh | bash
``` You need at least one agent CLI; OpenCode's free models work without signing in.

## ghost-desktop {#desktop}

Computer use for any MCP agent: see the screen, click, type, switch windows. It never touches a locked screen, and agents take turns. Included in Ghost; on its own it needs [Bun](https://bun.sh):

```sh
bun install -g github:ferdousbhai/ghost-desktop
claude mcp add --scope user desktop -- ghost-desktop
```

[Source and issues](https://github.com/ferdousbhai/ghost-desktop), Apache-2.0.

## Links

- [Source and issues](https://github.com/ferdousbhai/ghost), Apache-2.0
- [Releases](https://github.com/ferdousbhai/ghost/releases)
