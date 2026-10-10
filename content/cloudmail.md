---
title: Cloudmail
description: Email on your own domains, run entirely from your own Cloudflare account, with a Screener for new senders, a native Omarchy app and a CLI any agent can drive.
---

# Cloudmail

Email on your own domains, run entirely from your own [Cloudflare](https://www.cloudflare.com) account: no mail server to maintain, no one in between. Your Gmail and HEY accounts fit in the same app.

![Cloudmail in the Tokyo Night theme: the sidebar, an inbox of four conversations, and an open receipt](/img/cloudmail-inbox.webp)

The app follows your Omarchy theme and is keyboard-first: `j`/`k` move, `e` archives, `r` replies, `c` composes, `/` searches. Remote images and tracking pixels stay blocked until you press `L`.

## The Screener {#screener}

![The Screener: two new senders, each with Yes and No](/img/cloudmail-screener.webp)

A new sender's first email waits in the Screener. Yes, and their mail reaches your Inbox from then on; No, and you never hear from them again. People you write to are let in automatically, and spoofed mail can't ride on an earlier yes.

Addresses like `support@`, where every customer is a new sender, can skip the Screener. One Cloudmail serves several domains, and replies go out from the address the mail was sent to.

## Install

One command adds the signed package repository and its key, then installs Cloudmail; `omarchy update` keeps it current.

```sh
curl -fsSL https://ferdousbhai.com/cloudmail/install.sh | sudo bash
```

Then set it up in your Cloudflare account:

```sh
cloudmail setup you@yourdomain.com
```

It signs you in to Cloudflare, creates everything in your account and turns on sending and receiving for your domain. The API token stays on your computer and in your account. If the domain already receives mail elsewhere, it asks before moving it. Append `:direct` to an address to skip the Screener, or pass `--forward-to` to copy mail to your old inbox during the switch. Add Gmail or HEY with `cloudmail account add gmail` or `cloudmail account add hey`.

## From the terminal

`cloudmail` (or `cmail`) does everything the app does and answers in JSON when piped, so any AI agent can use it as is:

```sh
cloudmail screener
cloudmail inbox --unread
cloudmail reply <thread-id> -m "Sounds good."
cloudmail watch --folder all
```

`cloudmail agent-guide` covers the rest.

## Requirements

- Omarchy, or any Arch Linux desktop, for the app. The CLI runs anywhere Rust does.
- A domain with its DNS on Cloudflare.
- Cloudflare Workers Paid to send to any address. Receiving works on the free plan.

## Links

- [Source and issues](https://github.com/ferdousbhai/cloud-mail)
- [Releases](https://github.com/ferdousbhai/cloud-mail/releases)
- [Privacy policy](https://ferdousbhai.com/cloudmail-privacy)
- [The install script](https://github.com/ferdousbhai/cloud-mail/releases/latest/download/install.sh), to read before running
