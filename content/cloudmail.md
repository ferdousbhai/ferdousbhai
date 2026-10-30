---
title: Cloudmail
description: Email for people and organizations on their own domains, run from their own Cloudflare account, plus Gmail, iCloud Mail and HEY.
---

# Cloudmail

Email on your own domains, run from your own [Cloudflare](https://www.cloudflare.com) account: no mail server to maintain, no one in between. Gmail, iCloud Mail and HEY sit in the same app, which also works with those accounts alone, without a domain or Cloudflare account. Native Omarchy app, plus a CLI any agent can drive.

![Cloudmail in the Tokyo Night theme: the sidebar, an inbox of four conversations, and an open receipt](/img/cloudmail-inbox.webp)

Follows your Omarchy theme. Keyboard-first: `j`/`k` move, `e` archives, `r` replies, `c` composes, `/` searches. Remote images and tracking pixels stay blocked until you press `L`.

## The Screener {#screener}

![The Screener: two new senders, each with Yes and No](/img/cloudmail-screener.webp)

A new sender's first email waits in the Screener. Yes lets their mail into your Inbox from then on; No means you never hear from them again. People you write to are let in automatically, and spoofed mail can't ride on an earlier yes.

Gmail and iCloud Mail get the same Screener, with decisions stored in the accounts themselves (Gmail filters, iCloud Mail rules), so a sender you refused stays out of your phone's Inbox too. HEY keeps its own.

Addresses like `support@` can skip the Screener. One Cloudmail serves several domains, and replies go out from the address the mail was sent to.

## Share it {#share}

A partner or colleague can have mail for their domains on your Cloudmail, with no Cloudflare account of their own, and sees only their own mail. Invite them from the People window or:

```sh
cloudmail user invite sam --mailbox sam@theirdomain.com
```

## Install

Adds the signed package repository and its key, then installs Cloudmail; `omarchy update` keeps it current.

{install:cloudmail}

```sh
cloudmail setup you@yourdomain.com
```

`setup` signs you in to Cloudflare, creates everything in your account and turns on sending and receiving. The API token stays on your computer and in your account. If the domain already receives mail elsewhere, it asks before moving it; `--forward-to` copies mail to your old inbox during the switch, and an address ending in `:direct` skips the Screener.

Instead of `setup`: `cloudmail connect '<invite link>'` to join someone's Cloudmail, or `cloudmail account add gmail|icloud|hey` for those accounts.

## From the terminal

`cloudmail` (or `cmail`) does everything the app does and answers in JSON when piped. `cloudmail agent-guide` covers it all.

```sh
cloudmail screener
cloudmail inbox --unread
cloudmail reply <thread-id> -m "Sounds good."
```

## Requirements

- The app: Omarchy or any Arch Linux desktop. The CLI runs anywhere Rust does.
- Your own domains: DNS on Cloudflare, and Workers Paid to send to any address (receiving is free). Not needed for Gmail, iCloud Mail or HEY alone, or when invited.

## Links

- [Source and issues](https://github.com/ferdousbhai/cloud-mail)
- [Releases](https://github.com/ferdousbhai/cloud-mail/releases)
- [Privacy policy](https://ferdousbhai.com/cloudmail-privacy)
- [The install script](https://github.com/ferdousbhai/cloud-mail/releases/latest/download/install.sh), to read before running
