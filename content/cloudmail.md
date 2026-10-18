---
title: Cloudmail
description: Email on your own domains, run entirely from your own Cloudflare account, with a Screener for new senders, a native Omarchy app and a CLI any agent can drive. Gmail, iCloud Mail and HEY fit in too.
---

# Cloudmail

Email on your own domains, run entirely from your own [Cloudflare](https://www.cloudflare.com) account: no mail server to maintain, no one in between. Your Gmail, iCloud Mail and HEY accounts fit in the same app, or use Cloudmail for them alone, with no domain or Cloudflare account.

![Cloudmail in the Tokyo Night theme: the sidebar, an inbox of four conversations, and an open receipt](/img/cloudmail-inbox.webp)

The app follows your Omarchy theme and is keyboard-first: `j`/`k` move, `e` archives, `r` replies, `c` composes, `/` searches. Remote images and tracking pixels stay blocked until you press `L`.

## The Screener {#screener}

![The Screener: two new senders, each with Yes and No](/img/cloudmail-screener.webp)

A new sender's first email waits in the Screener. Yes, and their mail reaches your Inbox from then on; No, and you never hear from them again. People you write to are let in automatically, and spoofed mail can't ride on an earlier yes.

Gmail and iCloud Mail get the same Screener. Its decisions are kept in the accounts themselves, as Gmail filters and iCloud Mail rules, so every computer sees them, and a sender you said no to stays out of the Inbox on your phone too. HEY keeps its own Screener.

Addresses like `support@`, where every customer is a new sender, can skip the Screener. One Cloudmail serves several domains, and replies go out from the address the mail was sent to.

## Share it {#share}

Someone close to you, like a partner or a colleague, can have the same for their domains on your Cloudmail, without a Cloudflare account of their own. Invite them from the app's People window or the terminal:

```sh
cloudmail user invite sam --mailbox sam@theirdomain.com
```

They install Cloudmail and connect once with the one-time link, and see only their own mail.

## Install

One command adds the signed package repository and its key, then installs Cloudmail; `omarchy update` keeps it current.

```sh
curl -fsSL https://ferdousbhai.com/cloudmail/install.sh | sudo bash
```

Then set it up in your Cloudflare account:

```sh
cloudmail setup you@yourdomain.com
```

It signs you in to Cloudflare, creates everything in your account and turns on sending and receiving for your domain. The API token stays on your computer and in your account. If the domain already receives mail elsewhere, it asks before moving it. Append `:direct` to an address to skip the Screener, or pass `--forward-to` to copy mail to your old inbox during the switch.

Invited to someone's Cloudmail? Skip `setup` and run `cloudmail connect '<invite link>'` instead. For Gmail, iCloud Mail or HEY, with or without a domain of your own: `cloudmail account add gmail`, `icloud` or `hey`.

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
- For your own domains: a domain with its DNS on Cloudflare, and Cloudflare Workers Paid to send to any address (receiving works on the free plan). Not needed for Gmail, iCloud Mail and HEY alone, or when someone invites you.

## Links

- [Source and issues](https://github.com/ferdousbhai/cloud-mail)
- [Releases](https://github.com/ferdousbhai/cloud-mail/releases)
- [Privacy policy](https://ferdousbhai.com/cloudmail-privacy)
- [The install script](https://github.com/ferdousbhai/cloud-mail/releases/latest/download/install.sh), to read before running
