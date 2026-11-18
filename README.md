# Metadata Template Builder

Free tools for sports and event photographers who caption in Photo Mechanic.

- **`website/`**: the public site. It has the metadata builder (Getty, AP, Imagn, Icon and ZUMA style captions, code replacements, keywords, an XMP template and an ingest file name) and a client booking form (Netlify Forms).
- **`board-site/`**: a private job board. Booking requests show up on it by themselves, and your jobs sync across your devices (Netlify Functions and Blobs). Deploy it as its own Netlify site with team login turned on.

## Run your own copy
1. Fork this repo.
2. In Netlify, create a site from the fork with base directory `website`. Turn on form notifications for the `booking` form.
3. Create a second site from the same fork with base directory `board-site`. Under Site configuration → Access control, turn on team login.
4. On the board site, add two environment variables: `NETLIFY_TOKEN` (a personal access token from your Netlify user settings) and `BOOKING_FORM_ID` (from Forms → booking on the public site).
5. Change the venue key in `website/booking.html` (`GOOGLE_KEY`) to your own Google Places key, restricted to your domain, or leave it empty to use free OpenStreetMap search.

No keys or client data live in this repo. Bookings and jobs stay in your own Netlify account.

Made by [Asher Greene Photo](https://ashergreenephoto.com).
