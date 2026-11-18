# Metadata Template Builder

Free tools for sports and event photographers who caption in Photo Mechanic.

Everything is in **`website/`**, one Netlify site with three pages:
- **Metadata builder** (`index.html`): Getty, AP, Imagn, Icon and ZUMA style captions, code replacements, keywords, an XMP template and an ingest file name.
- **Booking form** (`booking.html`): clients request a shoot. You get an email with a link that builds the template.
- **Job board** (`board.html`): booking requests show up here by themselves, and your jobs sync across your devices. The page is public, but its data is locked with your own passcode.
- **Learn** (`learn.html`): why metadata matters, a before-and-after search demo, and a Photo Mechanic guide.

Also:
- **Batch export:** tick games, or a whole season's home games, and get every template, the code files (per game and one for the season) and the ingest names in one .zip.
- **Crew:** add photographers to a job, and each gets their own template and ingest name.
- **Drafts:** new bookings arrive on the board with a draft template, ready for you to check.
- **Smaller schools:** paste an official athletics roster page link (Sidearm, PrestoSports and similar), and the builder reads the roster.

## Try it
- **Public demo (free, GitHub Pages):** https://ashecrtv.github.io/Metadata-Template-Builder/. Search any real game and make real templates. The booking form and job board use sample data there.
- **Smaller schools:** D2 and D3 football are in the search, and **Find roster page** reads a school's official roster site (Sidearm and PrestoSports layouts) on the Netlify version.
- **Optional Claude API key:** paste your own key to have Claude read messy emails and flyers. It's prepaid credit from console.anthropic.com, about 1–2¢ a read, and the key is stored only in your browser.

## Run your own copy
1. Fork this repo.
2. In Netlify, choose Add new project → Import from Git, pick your fork and set the base directory to `website`.
3. Under Project configuration → Environment variables, add `BOARD_KEY` and set it to a passcode of your choice. Enter it on the job board to unlock it.
4. Under Forms, turn on email notifications for the `booking` form.
5. Set `GOOGLE_KEY` in `website/booking.html` to your own Google Places key, restricted to your domain. Or leave it empty to use the free OpenStreetMap search.
6. To get updates later, click **Sync fork** on GitHub. Netlify redeploys your copy by itself.

No keys or client data live in this repo. Bookings and jobs stay in your own Netlify account.

Made by [Asher Greene Photo](https://ashergreenephoto.com).

## License
Code: [MIT](LICENSE). The photos in `website/photos/` are © Asher Greene and are not covered by the license; please don't reuse them.
