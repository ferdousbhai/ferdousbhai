---
title: Omarchy apps
description: Every Omarchy app I make, each with its one line install: Ghost, iCloud, Cloudmail, Recall and more.
---

# Omarchy apps

One command installs everything for someone coming from a Mac. It shows a checklist, with the apps that keep iCloud working already marked, then signs you in to iCloud once for all of them.

```sh
curl -fsSL https://ferdousbhai.com/omarchy/install.sh | sudo bash
```

Each app adds its own signed package repository, so `omarchy update` keeps it current with the rest of your system. Run the command again to add more later. You can [read the script](https://ferdousbhai.com/omarchy/install.sh) before running it.

## Coming from a Mac {#mac}

Your iCloud account keeps working on Omarchy. What you used on the Mac, and what replaces it here:

{mac-apps}

The mail, calendar, contacts and reminders apps show your Google accounts in the same window, and Cloudmail adds mail on your own domains. You need an Apple ID with Advanced Data Protection off and Access iCloud Data on the Web on.

## Every app, one at a time

Each one also installs alone. Ghost comes from Omarchy's own repository.

{omarchy-apps}
