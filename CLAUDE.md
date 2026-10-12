# Working on the Player Guide with Claude

Two people change this app with Claude Code: Tom, who owns the repo, and Liz Mosher, the
team manager. Liz isn't a developer. Either of them may be the person in your session.

## Before changing anything: one person at a time

Only one person works on the code at a time, so nobody's work gets overwritten.

- At the start of every session, before editing, list the open pull requests on
  masterytv/eslc-player-guide. If one is open that this session didn't open, stop. Tell the
  person in plain words what it is and when it was opened, with its link, and that they
  should check with the other person before starting. Start only once they say it's fine.
- Start from the latest `main`.
- Keep each change small: one change, one pull request, merged or closed before the session
  ends.

## Talking with the person

- Use plain words and short answers. Say "change", "preview" and "live" rather than branch,
  commit or deploy, unless they ask for the details.
- Before a change that's more than a small fix, say in a sentence or two what you'll do and
  check that's what they want.
- If something goes wrong, say what happened and what you'll do about it. Never leave the app
  half-changed.

## Content is changed in the app, not in the code

What the guide says lives in the database. Staff change it in the app: sign in with the staff
password, then **Edit the guide**. That covers the schedule, daily notes, staff, roster, rooms,
game plan, travel, villas, venue, maps and photos, meals, packing, pages, anthem, links, the
alert banner and the team passcode.

`src/lib/seed.ts` holds only the starting content for the first tournament. Once a section has
been saved in the app, editing the seed changes nothing players see. So when someone asks to
change content, tell them where to change it in the app, unless they need something the
editor can't do.

## Making a change

1. Make the change. Run `npm run lint`, `npm run typecheck` and `npm run test:unit`, plus
   `npm run test:e2e` if you can. Add or update a test when behaviour changes.
2. Push and open a draft pull request. In plain words, tell the person what changed and what
   to look at. Give them the Vercel preview link from the Vercel bot's comment once it's ready.
3. Warn them that the preview uses the **live** content: anything saved in the preview's
   editor changes the real guide for everyone.
4. Wait for the checks to pass. Fix any that fail.
5. Merge only when the person clearly says so, for example "merge it". Use a squash merge.
   Tell them it'll be live in a minute or two, and remind them to tell the other person
   they're done.

If a change alters what staff see or do, update the coaches' guide in `docs/coach-guide` too
(see its README).

## Never

- Change Vercel settings, environment variables or passwords, or read their values.
- Delete or reset the guide's content, or run a database change that removes data.
- Force-push to `main` or merge without the person's say-so.
- Put phone numbers, passwords or other private details in the repo.

How the app is built and tested is in `README.md`.
