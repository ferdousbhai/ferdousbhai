---
title: Lastbook
description: An offline survival library for Omarchy. Manuals, videos, encyclopedias and a world map, all on your computer, for you and for your AI agents.
---

# Lastbook

Survival, first aid, health, water, food, power and repair: manuals and PDFs, videos with transcripts, offline encyclopedias, short guides for urgent needs and a map of the world, in one native Omarchy window. After setup it needs no internet. The AI agents on your computer can search it and cite its pages.

## Install

{install:lastbook}

For Omarchy on x86_64 and aarch64 (Apple silicon through Asahi). Adds Lastbook's signed package repository and installs it. It offers Recall for meaning-based search; without Recall, search matches words. Updates arrive with `omarchy update`.

Open Lastbook from the application menu. First-run setup downloads the library you choose (Small, Medium or All) and makes the map.

## In the window

Search, Guides, Library, Videos, Map and Saved. Guides point to real pages with page numbers, and say what they don't cover. The map shows the whole world to city level, with street detail and help points (hospitals, pharmacies, shelters, drinking water) for the regions you pick. Setup cuts the map from OpenStreetMap on your own computer, so nothing is hosted and your location is never detected.

## For agents

The same library answers in JSON without opening a window:

```sh
lastbook search "treat a burn" --limit 5
lastbook read med-443ae5cfaa6ecc68 --pages 37,38
lastbook place "Denpasar" --nearby hospital
lastbook guides
lastbook status
lastbook skill install
```

`lastbook skill install` (the installer runs it) teaches the AI agents on the computer to search the library, read the pages and cite them by title, publisher and page number. Lastbook has no AI of its own.

## Open source

[Source and releases](https://github.com/ferdousbhai/lastbook-for-omarchy), MIT. A hard fork of [Lastbook](https://github.com/Immortal-Protocols/lastbook); the window follows [Strata](https://github.com/lgse/strata). Map data © OpenStreetMap contributors via Protomaps, place names from GeoNames, encyclopedias from Kiwix.
