---
title: Cloudmail privacy policy
description: Cloudmail runs on your computer and in your own Cloudflare account. Its developer never receives your mail, contacts or sign-in credentials.
---

# Cloudmail privacy policy

Cloudmail is software you run yourself: a command-line tool and desktop app on your computer, and a mail service deployed to your own Cloudflare account. Last updated 18 October 2026.

## The short version

Cloudmail's developer runs no servers that receive, store or process your email. Your mail, contacts and sign-in credentials stay on your computer and in the accounts you connect (Cloudflare, and optionally Google, iCloud or HEY). Nothing is sold, shared, or used for advertising or to train AI models.

## Your own mail service

`cloudmail setup` deploys a Worker, a D1 database and an R2 bucket to your Cloudflare account. Mail to your domains is received and stored there; mail you send goes out through Cloudflare Email Service from that account. Cloudflare processes this data under your agreement with it. The API token that lets the app reach your Worker is kept in a file on your computer and as a secret in your Worker.

## Someone else's Cloudmail {#shared}

If someone invites you to their Cloudmail, your mail is received and stored in their Cloudflare account, and you sign in with a token kept in your computer's keyring. The app and the API show each person only their own mail, but as the owner of that Cloudflare account, the person who invited you can read what is stored there. Ask them to remove you, and your mail with you, when you leave.

## Gmail, if you connect it {#google}

`cloudmail account add gmail` opens a Google sign-in in your browser, where you grant Cloudmail access to your Gmail. The sign-in token is stored on your computer, and Cloudmail talks to Google directly from there.

Cloudmail uses this access only to do what you ask of it in the app or the command line: list, read and search your mail, show attachments, send and reply, archive, label and mark mail read or unread, and keep your Screener's decisions. It keeps those as Gmail filters it creates, marked by its own hidden labels, and never reads or changes your other filters or settings. Your Gmail data is never sent to the developer or any third party, is not stored anywhere except your own computer (and your own Cloudflare account, only if you forward mail there yourself), and is not used for advertising or to train AI models. No person reads it.

Cloudmail's use and transfer of information received from Google APIs to any other app will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

To disconnect, run `cloudmail account remove gmail` and remove Cloudmail's access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## iCloud Mail, if you connect it

Cloudmail reaches iCloud Mail through the iCloud sign-in that icloud-session keeps on your computer; Cloudmail never sees your Apple password. It uses that access only to do what you ask, as with Gmail, and keeps your Screener's decisions as iCloud Mail rules it creates, named "Cloudmail Screener", without touching your other rules. iCloud data stays between your computer and Apple. To disconnect, run `cloudmail account remove icloud`.

## HEY, if you connect it

Cloudmail drives HEY's own command-line tool, signed in to your HEY account on your computer, only to do what you ask. HEY data stays between your computer and HEY. To disconnect, run `cloudmail account remove hey`.

## Contact

Questions about this policy: [ferdousbd@gmail.com](mailto:ferdousbd@gmail.com), or open an issue at [github.com/ferdousbhai/cloud-mail](https://github.com/ferdousbhai/cloud-mail/issues).
