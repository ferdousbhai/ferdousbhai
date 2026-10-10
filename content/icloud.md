---
title: iCloud for Omarchy
description: Apple Notes, Photos and Find My as native Omarchy apps on one iCloud sign-in.
---

# iCloud for Omarchy

Apple Notes, Photos and Find My as native [Omarchy](https://omarchy.org) apps. Sign in once, on Apple's own page, and all three use it.

Find My asks for your Apple password now and then, as icloud.com does. Store it in the keyring once and it signs itself back in:

```sh
icloud-session set-password
```

Or pipe it from a password manager: `bw get password "Apple ID" | icloud-session set-password`.

## Install

One command adds the signed package repository and its key, then installs all three apps; `omarchy update` keeps them current.

```sh
curl -fsSL https://ferdousbhai.com/icloud/install.sh | sudo bash
```

Each app also installs alone (below) and has a CLI: `icloud-notes --help`, `icloud-photos --help`, `icloud-findmy --help`.

## Notes {#notes}

![iCloud Notes in the Tokyo Night theme: folders, a note list, and a note with a checklist](/img/icloud-notes.webp)

Your notes are Markdown files in `~/Documents/icloud-notes`, in the same folders as Apple Notes, synced both ways with iCloud even while the app is closed. When both sides change the same lines, you see both versions and pick one.

```sh
curl -fsSL https://ferdousbhai.com/icloud-notes/install.sh | sudo bash
```

Sync uses a Rust port of Adam Coddington's [icloud-md](https://github.com/coddingtonbear/icloud-md).

## Photos {#photos}

![iCloud Photos: albums on the left and the library grouped by month](/img/icloud-photos.webp)

Browse by album and month, download originals with their Live Photos, and upload photos and videos. Deleting moves a photo to Recently Deleted.

```sh
curl -fsSL https://ferdousbhai.com/icloud-photos/install.sh | sudo bash
```

## Find My {#findmy}

![Find My: devices with battery and last seen on the left, and their positions on an OpenStreetMap map](/img/icloud-findmy.webp)

Your devices on a map, with battery, last-seen time and a trail of where each has been. Play Sound and Lost Mode are in the menu.

```sh
curl -fsSL https://ferdousbhai.com/icloud-findmy/install.sh | sudo bash
```

## Requirements

- Omarchy, or any Arch Linux desktop.
- An Apple ID with Advanced Data Protection off and Access iCloud Data on the Web on.

## Links

- [Source and issues](https://github.com/ferdousbhai/icloud-for-omarchy)
- [Releases](https://github.com/ferdousbhai/icloud-for-omarchy/releases)
- The install scripts, to read before running: [all three apps](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install.sh), [Notes](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-notes.sh), [Photos](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-photos.sh), [Find My](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-findmy.sh)
