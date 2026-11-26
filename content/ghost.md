---
title: Ghost
description: Your own persona on Omarchy, answered by a model on your machine.
---

# Ghost

Your own persona on [Omarchy](https://omarchy.org), answered by a model on your machine. Give your ghost a character and talk to it in its window, in the terminal, or from your phone. It works with your notes, mail, calendar, photos and files through the apps that already hold them, runs commands for you, and hands coding work to the coding agent you already use. It keeps its notes as plain files in your Documents, keeps going on long tasks, and asks when a decision is yours. Every turn runs on a local model, so none of it leaves your computer.

## Install {#app}

```sh
omarchy pkg add ghost
```

Then [turn it on for your login](https://github.com/ferdousbhai/ghost/blob/master/docs/getting-started.md).

Omarchy's package repository can take a day to carry a new release. For the latest now, run this as yourself; it installs the same package and turns Ghost on, and `omarchy update` keeps it current afterwards:

```sh
curl -fsSL https://ferdousbhai.com/ghost/install.sh | bash
```

Ghost needs a model on your machine: a GGUF file and `llama-server`. The getting started guide covers both.

## Links

- [Source and issues](https://github.com/ferdousbhai/ghost), Apache-2.0
- [Releases](https://github.com/ferdousbhai/ghost/releases)
