---
title: iCloud for Omarchy
description: Apple Notes, Photos and Find My as native Omarchy apps on one iCloud sign-in.
---

# iCloud for Omarchy

Apple Notes, Photos and Find My as native [Omarchy](https://omarchy.org) apps, each with a CLI (`icloud-notes --help` and so on). Sign in once, on Apple's own page, and all three use it, as do the calendar, mail, contacts and tasks apps [below](#more).

## Install

Adds the signed package repository and its key, then installs all three apps; `omarchy update` keeps them current. Each app also installs alone, below.

{install:icloud}

Find My asks for your Apple password now and then, as icloud.com does. Store it in the keyring once (or pipe it in, e.g. from `bw get password "Apple ID"`) and it signs itself back in:

```sh
icloud-session set-password
```

## Notes {#notes}

![iCloud Notes in the Tokyo Night theme: folders, a note list, and a note with a checklist](/img/icloud-notes.webp)

Your notes as Markdown files in `~/Documents/icloud-notes`, in the same folders as Apple Notes, synced both ways even while the app is closed. When both sides change the same lines, you pick a version. Sync is a Rust port of Adam Coddington's [icloud-md](https://github.com/coddingtonbear/icloud-md).

```sh
curl -fsSL https://ferdousbhai.com/icloud-notes/install.sh | sudo bash
```

## Photos {#photos}

![iCloud Photos: albums on the left and the library grouped by month](/img/icloud-photos.webp)

Browse by album and month, download originals with their Live Photos, upload photos and videos. Deleting moves to Recently Deleted, with Undo. Copy a photo to paste anywhere, or make it your wallpaper.

```sh
curl -fsSL https://ferdousbhai.com/icloud-photos/install.sh | sudo bash
```

## Find My {#findmy}

![Find My: devices with battery and last seen on the left, and their positions on an OpenStreetMap map](/img/icloud-findmy.webp)

Your devices on a map with battery, last-seen time and a trail. Play Sound and Lost Mode are in the menu.

```sh
curl -fsSL https://ferdousbhai.com/icloud-findmy/install.sh | sudo bash
```

## Calendar, Mail, Contacts and Reminders {#more}

These live in apps of their own, because they show your other accounts in the same window, and all of them use the same iCloud sign in: Cloud Calendar, [Cloudmail](/cloudmail), Cloud Contacts and Cloud Tasks. Install them from [Omarchy apps](/omarchy).

## Requirements

- Omarchy, or any Arch Linux desktop.
- An Apple ID with Advanced Data Protection off and Access iCloud Data on the Web on.

## Links

- [Source and issues](https://github.com/ferdousbhai/icloud-for-omarchy)
- [Releases](https://github.com/ferdousbhai/icloud-for-omarchy/releases)
- The install scripts, to read before running: [all three apps](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install.sh), [Notes](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-notes.sh), [Photos](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-photos.sh), [Find My](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-findmy.sh)
