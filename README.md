# Player Guide

The Ireland Lacrosse player guide, as a phone-first web app, starting with ESLC 2026.
Players open a link and enter the **team passcode**. Staff log in with the
**staff password** and can change anything players see, from their own phones.
Each tournament gets its own guide at the same address; staff prepare the next one while
the current one is live, then switch players over.

- **Today**: the day's plan, the next game with a countdown, and alerts.
- **Schedule**: games, practices, ceremonies and meetings, with add-to-calendar.
- **Team**: staff with call and WhatsApp buttons, the roster, the rooming list.
- **Venue & stay**: airport bus, ride options, villas, fields, maps and meals.
- **More**: packing checklist, conduct and tournament rules, the coaches' game plan
  (offence and defence), the anthem, links.

The guide keeps a saved copy on each phone, so it still opens with no signal abroad.

**For coaches and staff:** [docs/coach-guide/Player-Guide-How-it-works.pdf](docs/coach-guide/Player-Guide-How-it-works.pdf)
explains the app in seven pages. When the app changes, update it as described in
[docs/coach-guide](docs/coach-guide/README.md).

## Who can do what

| Login | What it unlocks | Where it's set |
|---|---|---|
| Team passcode | Reading the live tournament's guide | Each tournament has its own. `VIEWER_PASSWORD` is the first one's starting passcode; staff change it in the app (More → Team passcode) |
| Staff password | Reading and editing every tournament | `ADMIN_PASSWORD` in Vercel |

Changing the team passcode signs every player out; they enter the new one once. So does
making a tournament with a different passcode live. Staff stay signed in. Logins last
30 days on each phone.

## Put it live on Vercel

1. **Import the repo.** In Vercel, choose *Add New → Project* and pick
   `masterytv/eslc-player-guide`. Vercel detects Next.js; keep the defaults.
2. **Add a database.** In the project, open *Storage → Create → Neon (Postgres)* and connect it
   to the project. This sets `DATABASE_URL` for you. Neon's free plan is plenty: the guide's
   text and photos come to a few megabytes. The tables are created on first use.
   Keep the app next to the database: this project's Neon database is in US East, so the
   Functions region (*Settings → Functions*) is Washington, D.C. (`iad1`).
3. **Set three environment variables** (*Settings → Environment Variables*):
   - `ADMIN_PASSWORD`: the staff password.
   - `VIEWER_PASSWORD`: the starting team passcode. A few words is easier to share than a
     number and harder to guess, e.g. `green jersey salou`.
   - `SESSION_SECRET`: a random string of at least 32 characters. Generate one with
     `openssl rand -base64 32`.
4. **Deploy**, then open the site and log in with the staff password.
5. **Check the content** (see *Before sharing it* below), then share the link and the team
   passcode in the group chat. Players can add it to their home screen.

To use a custom address such as `guide.irelandlacrosse.ie`, add it under *Settings → Domains*.

Without a database the site still runs and shows the starting content, but saving is
switched off and the edit screens say so.

## Editing from a phone

Log in with the staff password. You'll see an orange **Staff** badge in the header and small
**Edit** buttons next to each section. Tapping one opens that section's editor, or open
*More → Edit the guide* for the full list.

- Tap an item to open it, change the fields, then **Save** at the bottom. Players see the
  change the next time they open a page or come back to the app.
- **Daily notes** open on today's date. Add the next day's plan the night before.
- Leave a time blank while it's not set; players see *TBC*.
- **Pages** (conduct, tournament rules, activities) and the **Game plan** (the coaches'
  offence and defence) use a simple text format: `## Heading` starts a card, `- item`
  makes a bullet, `1. step` a numbered step, `!! text` is a red warning, `> text` is a grey
  note, `**bold**`, and `[label](https://link)`.
- If two staff edit the same section at once, the second person to save is warned
  instead of silently overwriting the first person's changes.
- Photos and maps can be replaced from the phone's camera roll. Large photos are shrunk
  before upload.

## The next tournament

Open *More → Tournaments → Start the next tournament*. Give it a name, dates, where it is
and its time zone, then tick what to copy from an earlier tournament. Staff, the roster, the
packing list, pages, the game plan, the anthem and links are ticked by default. The schedule, daily notes,
venue, travel and rooming start empty. Then:

1. The new tournament is a draft: only staff see it. An orange bar on every page says which
   tournament you're working on, and what players see.
2. Fill it in through the usual editors. The live guide doesn't change.
3. When it's ready, open *Tournaments* and tap **Make live**. Players see it the next time
   they open the app. If its team passcode is different, they're asked for the new one.

Past tournaments stay under *Tournaments*. Tap **Work on this one** to look back at or reuse
one; players keep seeing the live one. Each tournament keeps its own time zone, so countdowns,
"Today" and calendar files are in local time wherever it is.

## Before sharing it

The content was copied from the Google Doc. Some of it is still empty or was carried over
from the EBLC Prague guide, so check these first:

- **Staff phone numbers** are not stored in this repository. Add them under
  *Team → Staff → Edit*, with the country code (e.g. `+1 315 …`), so Call and WhatsApp work
  from Spain.
- **Roster, rooming list and meals** are empty in the doc.
- **Flight sheet links**: the doc's links sat inside a drawing and couldn't be copied. Add them
  under *Venue → Getting there → Edit*.
- **Conduct**: "Coach Melissa" (lights out) isn't on the staff list, and *Getting around*
  mentions chartered buses and trains while the venue notes say everyone walks.
- **Packing**: medications are to be "reviewed with Allyson" (the listed trainer is Amanda),
  protein bars mention Prague, and box floor shoes may not be needed outdoors.
- **Event dates** are set to 31 Oct – 9 Nov; the doc's cover said "9 October".

## Working on the code

```bash
npm install
cp .env.example .env.local   # optional locally: see below
npm run dev
```

Locally, without `DATABASE_URL`, content is saved as JSON in `./.data`. Without passwords
set, nobody can log in, so put at least `ADMIN_PASSWORD` and `VIEWER_PASSWORD` in
`.env.local`. A development session secret is used automatically.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run test:unit` | Unit tests. Set `TEST_DATABASE_URL` to also test Postgres storage |
| `npm run test:e2e` | Builds and runs the app, then drives it in a phone-sized browser. Set `E2E_DATABASE_URL` to run against Postgres |

### How it fits together

- **Next.js 16** (App Router). Every page is rendered on request from the latest content.
- **Database connections** are handed to Vercel with `attachDatabasePool`, so idle ones are
  closed before a function sleeps, and a query that finds its connection already closed is
  retried once (`src/lib/store.ts`).
- **Content** lives in one Postgres table, one row of JSON per section per tournament,
  keyed `<tournament>/<section>` (`world-sixes-2027/schedule`). The first tournament,
  `eslc-2026`, keeps the plain keys (`schedule`) it had before tournaments existed. The live
  tournament is the `_app/live` row. Each section has a schema in `src/lib/schema.ts` and an
  editor definition in `src/lib/sections.ts`. To add a field, add it to both. The first
  tournament's never-saved sections read from `src/lib/seed.ts`; later tournaments start from
  a copy of an earlier one (`src/lib/tournaments.ts`).
- **Saving** checks a version number per section, which is how clashing edits are caught.
- **Photos** uploaded by staff are stored in the same database and served from `/img/…`.
- **Logins** are signed cookies (`src/lib/auth.ts`). `src/proxy.ts` turns away anyone without
  one and keeps players out of `/admin`. A player's cookie holds a fingerprint of the passcode
  they used, and the server checks it against the live tournament's passcode. Which tournament
  a staff member is working on is a second cookie.
- **Caching**: the guide's content is cached on the server (`unstable_cache` in
  `src/lib/content.ts`) and cleared on every save, so ordinary page loads don't touch the
  database and don't wake a sleeping Neon database. Preview deployments share the production
  database, so they skip the cache and always read it directly.
- **Offline and weak signal**: `public/sw.js` keeps the last copy of each page and photo on the
  phone. Pages open straight from that copy while a fresh one downloads, then
  `src/components/Freshness.tsx` swaps in the latest content in place. The header says
  *Saved copy* until it has. Reopening the app after a few minutes checks for changes too.
- Dates and times are local to each tournament, in the time zone set under *Event & alert*.
