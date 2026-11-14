---
title: iCloud for Omarchy
description: Keep your iCloud on Omarchy: Mail, Calendar, Contacts, Reminders, Notes, Photos and Find My as native apps, and iCloud Drive as a folder, on one iCloud sign in.
---

# iCloud for Omarchy

Moving from a Mac to [Omarchy](https://omarchy.org)? Your iCloud account comes with you. Mail, Calendar, Contacts, Reminders, Notes, Photos and Find My are native apps here, each with a CLI, and iCloud Drive is a folder in your home. All of it syncs straight to iCloud, so your iPhone and the Mac you left stay in step.

## Install

One command installs all of them, then opens Apple's own sign in page once. Every app uses that one sign in.

{install:icloud}

Each app adds its own signed package repository, so `omarchy update` keeps it current with the rest of your system. The command is safe to run again, and you can [read the script](https://ferdousbhai.com/icloud/install.sh) first. To install only some, name them, from `icloud` (Notes, Reminders, Contacts, Photos, Find My and iCloud Drive), `cloudmail`, `cloud-calendar` and `recall`:

```sh
curl -fsSL https://ferdousbhai.com/icloud/install.sh | sudo bash -s -- icloud cloud-calendar
```

It asks one question: whether to add [Recall](/recall), which lets these apps search by meaning.

## What replaces what {#mac}

- Mail: [Cloudmail](/cloudmail)
- Calendar: [Cloud Calendar](/omarchy#cloud-calendar)
- Contacts: [Contacts](#contacts)
- Reminders: [Reminders](#reminders)
- Notes: [Notes](#notes)
- Photos: [Photos](#photos)
- Find My: [Find My](#findmy)
- iCloud Drive: [the `~/iCloud Drive` folder](#drive)
- AirDrop: [Omdrop](https://github.com/brentkearney/omdrop-plugin), a separate project with its own install

The mail and calendar apps show your Google accounts in the same window, and Cloudmail adds mail on your own domains. Messages, Passwords and Safari sync have no replacement here yet.

## Requirements

- Omarchy, or any Arch Linux desktop.
- An Apple ID with Advanced Data Protection off and Access iCloud Data on the Web on.

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

## iCloud Drive {#drive}

Not an app: a folder, `~/iCloud Drive`, kept in step with iCloud Drive both ways, like Dropbox. Open, save, rename and move files there with anything. When a file changed on both sides, both versions are kept. A file removed on one side goes to the other side's trash, so nothing is lost for good.

It stays off until you turn it on, because the first sync downloads your whole Drive:

```sh
icloud-drive start
```

`icloud-drive status` says what it is doing. App folders such as Pages and Shortcuts, Pages, Numbers and Keynote documents, and folders other people shared with you are left out for now.

```sh
curl -fsSL https://ferdousbhai.com/icloud-drive/install.sh | sudo bash
```

## Reminders {#reminders}

Your iCloud Reminders lists, with due dates, notes and flags. Reminders that come due notify you while the app is closed.

```sh
curl -fsSL https://ferdousbhai.com/icloud-reminders/install.sh | sudo bash
```

## Contacts {#contacts}

Your iCloud address book: search, add, edit and delete contacts, and export them as vCards.

```sh
curl -fsSL https://ferdousbhai.com/icloud-contacts/install.sh | sudo bash
```

## Mail and Calendar {#more}

These live in apps of their own, because mail and invitations arrive at your other accounts too, and both use the same iCloud sign in: [Cloudmail](/cloudmail) and [Cloud Calendar](/omarchy#cloud-calendar). Each also installs alone, from its entry there.

## Links

- [Source and issues](https://github.com/ferdousbhai/icloud-for-omarchy)
- [Releases](https://github.com/ferdousbhai/icloud-for-omarchy/releases)
- The install scripts, to read before running: [everything](https://ferdousbhai.com/icloud/install.sh), [Notes, Reminders, Contacts, Photos, Find My and iCloud Drive](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install.sh), [Notes](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-notes.sh), [Photos](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-photos.sh), [Find My](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-findmy.sh), [iCloud Drive](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-drive.sh), [Reminders](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-reminders.sh), [Contacts](https://github.com/ferdousbhai/icloud-for-omarchy/releases/latest/download/install-contacts.sh)
