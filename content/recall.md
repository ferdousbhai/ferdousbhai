---
title: Recall for Omarchy
description: Search your files by meaning, locally. A native Omarchy app with a CLI and bundled skill so agents can search too.
---

# Recall for Omarchy

Find files by what’s in them. Describe a scene in a photo, find a passage in a document, jump to a matching interval in a recording, or search source code by what it does.

Recall comes with a native Omarchy search panel, a CLI, and a bundled skill so coding agents can use the same local search engine. Everything runs on your computer with EmbeddingGemma 2. Your files, OCR text and search index stay local.

## Install

```bash
curl -fsSL https://ferdousbhai.com/recall/install.sh | bash
```

For Omarchy on x86_64 and aarch64. The installer downloads a checksum-verified release, installs dependencies through Omarchy, and sets up the desktop integration and agent skill. Model files and OCR assets download once; initial indexing takes time.

An Omarchy package repository submission is in progress. Use the installer above until the package reaches your configured channel.

## On your desktop

Press `Super+Ctrl+Shift+F`, or click the magnifying glass in the bar. Search for “a screenshot showing a payment error” or “notes about portfolio risk.” Use `code:` to search selected source repositories.

Arrow keys select a result. Enter opens it at its matching page, line or media interval; Ctrl+Enter reveals it in the file manager. Settings chooses folders and exclusions, and Pause stops background indexing.

## For agents, too

The CLI returns structured JSON without opening a window. Agents can search documents, images, audio/video and code, then read the matching indexed passage.

```bash
omarchy-recall search "payment error" --kind screenshot --limit 5
omarchy-recall search "retry with exponential backoff" --code
omarchy-recall text 123 --code
omarchy-recall status
```

The skill is bundled with the CLI. Print it or install it for your coding agents:

```bash
omarchy-recall skill
omarchy-recall skill install
```

It installs to the shared agents skill directory and links Claude Code when available. Search covers only the folders you select. Audio results identify matching intervals; they do not provide word-level transcripts. Initial binaries use CPU inference.

## Open source

[Source and releases](https://github.com/ferdousbhai/omarchy-recall). Based on [Recall by pdstn12](https://github.com/pdstn12/Recall), inspired by [DigUp by Abdur Rahim](https://github.com/ARahim3/DigUp). MIT licensed.
