# Put the Metadata Template Builder online

This folder is the whole website. There are three files, and nothing needs to be installed or built:

- `index.html`: the app (a copy of "Metadata Template Builder.html")
- `og-image.png`: the preview card that shows when someone texts or posts the link
- `apple-touch-icon.png`: the icon when someone adds it to their phone's home screen

## Easiest: Netlify Drop (about 2 minutes, free)
1. Go to **app.netlify.com/drop** and sign in (or create a free account).
2. Drag this whole **website** folder onto the page. It's live right away at a link like `random-name.netlify.app`.
3. In **Site configuration → Change site name**, rename it, e.g. `ashe-metadata.netlify.app`.
4. Optional: in **Domain management**, add your own address, e.g. `metadata.ashergreenephoto.com`.

To update later, open the site in Netlify → **Deploys** and drag the folder in again.

## After it's live
- In `index.html`, find `og:image` and change `og-image.png` to the full address, e.g. `https://ashe-metadata.netlify.app/og-image.png`, then upload again. Without this, some apps won't show the preview card.
- Check it on your phone: search a game, download a template, try the email reader.
- Link it from ashergreenephoto.com. Your current site builder (Format) can add an external link in the menu.

## Whenever you change the app
Copy the new "Metadata Template Builder.html" into this folder as `index.html` (replace the old one), then upload again.

## Good to know
- Everything runs in the visitor's browser. Nothing is stored on a server, and settings stay on each person's own device.
- Game schedules and rosters come from ESPN's public data. If ESPN changes it, search may stop working until the app is updated.

## Booking form (booking.html)

Clients fill in **booking.html** to request a shoot. On Netlify:
1. After you upload the folder, open your site in Netlify → **Forms** → turn on form detection, then upload the folder once more.
2. Under **Forms → Form notifications**, add an email notification so each request lands in your inbox.
3. Each request includes a **builder_link**. Open it and the builder fills in the client, shoot type, name, date, venue, city, state and keywords.

Known venues (city and state fill in automatically) are in the `VENUES` list near the bottom of booking.html. Add your regular spots there.

## Final items before publishing

1. **Google Places for the venue search.** The current search (OpenStreetMap, free, no key) finds stadiums, hotels, parks and chains like Topgolf, but can miss small or new venues. Google Places Autocomplete is more complete. It needs a Google Cloud account, an API key and a card on file; the free monthly credit covers a small booking form. Until then, add regular spots to the `VENUES` list in booking.html.
2. **Save repeat clients across devices.** Right now the form remembers a client only in the browser they used. To remember them on any device, store their details online:
   - **Recommended:** Netlify Blobs plus one Netlify Function (built into Netlify, nothing extra to sign up for).
   - **If you want a client list you can browse:** Google Sheets plus Apps Script, so each booking becomes a row.
   - Look clients up by **email, not name**, and email them a 6-digit code before filling the form, so nobody can pull up someone else's phone number.
   - Ask Claude to build it when the site is on Netlify (about an hour, mostly connecting your account).
3. **Bookings inbox (final item).** Using the same Netlify Blobs storage as repeat clients, booking requests land on the board automatically as "Requested" jobs, so you never paste a link. Later option: email you the finished XMP automatically.

## Job board (board.html) — private

Your three pages: **booking.html** (clients), **index.html** (metadata builder), **board.html** (just you).
- The board isn't linked from the site and tells search engines not to list it, but anyone with the address could open it. **Before publishing, put it behind a password** (Netlify → Site configuration → Access control → password protection, or Netlify Identity).
- Jobs are saved in the browser you use. Use **Back up** now and then until the online inbox is set up.

## Tried and ruled out: file name from the template

Tested 2026-11-17: Photo Mechanic loads the template's Extended Description, but the ingest rename reads it as empty, because it renames files before applying the template. So the file name can't come from the template. Keep pasting it from **Copy file name** into Ingest → Rename.

## Final testing after publishing (connect Netlify)
- **Database:** repeat clients across devices and the bookings inbox both need online storage. Connect the site to Netlify, set up Netlify Blobs plus a small function, then test: a booking from a phone shows up on the job board, and a returning client is recognized on a different device.
- **Booking form email:** turn on Netlify form detection and an email notification, then send a test booking.
- **Roster page links:** test "Get roster" with a real team roster page (it needs the Netlify function).
- **Job board password:** confirm the board asks for a password.

## Job board = its own private site (done 2026-11-18)
- The board lives in the **board-site** folder and is published to a separate Netlify project (ashergreenephoto-internal-board) that stays **Private**: only you, signed in to Netlify, can open it.
- To update it: drag the **board-site** folder onto that project's Deploys page. The public site is updated by dragging the **website** folder onto the ashergreenephoto project.
- Owner access → Job board on the public site links to the private board.
