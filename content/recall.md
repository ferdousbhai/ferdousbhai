---
title: Recall
description: Search your files by meaning, locally. A native Omarchy app with a CLI and bundled skill so agents can search too.
---

# Recall

Find files by what's in them: a scene in a photo, a passage in a document, an interval in a recording, source code by what it does. A native Omarchy search panel, a CLI and a bundled agent skill share one local engine (EmbeddingGemma 2). Files, OCR text and the index stay on your computer, and only the folders you choose are indexed.

## Install

```bash
curl -fsSL https://ferdousbhai.com/recall/install.sh | bash
```

For Omarchy on x86_64 and aarch64. Downloads a checksum-verified release, installs dependencies through Omarchy, and sets up the desktop integration and agent skill. The model downloads once; first indexing takes a while. An Omarchy package is in review; until it ships, use the installer.

## On your desktop

`Super+Ctrl+Shift+F`, or the magnifying glass in the bar. Try "a screenshot showing a payment error"; prefix `code:` to search selected repositories. Enter opens a result at its page, line or interval; Ctrl+Enter reveals it in the file manager. Settings picks folders and exclusions; Pause stops background indexing.

## For agents

The CLI answers in JSON without opening a window:

```bash
recall search "payment error" --kind screenshot --limit 5
recall search "retry with exponential backoff" --code
recall text 123 --code
recall doctor
recall skill install
```

`recall skill install` puts the skill in the shared agents directory and links it for Claude Code.

## Details

- Native Rust CLI and coordinator with a QML panel; no Python or GTK at runtime.
- OCR uses Omarchy's Tesseract (English by default; add language packs through Omarchy, list them with `recall ocr`).
- Audio results are matching intervals, not word-level transcripts.
- Vulkan GPU indexing with CPU fallback; Apple Silicon uses Asahi's Honeykrisp driver, which the installer adds. Short queries run on CPU to skip GPU startup.

## Open source

[Source and releases](https://github.com/ferdousbhai/recall-for-omarchy), MIT. Based on [Recall by pdstn12](https://github.com/pdstn12/Recall), inspired by [DigUp by Abdur Rahim](https://github.com/ARahim3/DigUp).
