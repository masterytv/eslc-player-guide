# Coaches' guide

**[Player-Guide-How-it-works.pdf](Player-Guide-How-it-works.pdf)** is the guide we give coaches and
staff. It covers what the app does, how to get in, how to make changes, how to start a new tournament,
and who to contact. It's seven A4 pages, with screenshots of the app.

Update it whenever the app changes in a way coaches would notice: a new screen, a renamed button, or a
different way of doing something.

## Updating it

| File | What it is |
|---|---|
| `guide.html` | The text and layout. Each `<section class="page">` is one A4 page. |
| `shots/` | The phone screenshots the pages use. |
| `screenshots.mjs` | Retakes every screenshot from the current app. |
| `render.mjs` | Turns `guide.html` into the PDF. |

1. **If screens changed**, retake the screenshots:
   ```sh
   npm run build
   npm run guide:screenshots
   ```
   This starts the app on its own, on port 3410, with example passwords and an empty content folder. It
   never connects to a database. The pictures show the starting content, plus a made-up "Example Cup
   2027" used for the new-tournament steps. To add a screenshot, add a step to `screenshots.mjs` and an
   `<img src="shots/….png">` to `guide.html`.
2. **Edit the wording** in `guide.html`. Keep it short and use the button names exactly as the app shows
   them.
3. **Rebuild the PDF**:
   ```sh
   npm run guide:pdf
   ```
   Open `Player-Guide-How-it-works.pdf` and check that each page is still one page: nothing should run
   into the footer, and there should still be seven pages unless you added one. If a page overflows,
   shorten its text or shrink a screenshot.
4. Commit the PDF together with the files that changed.

Never put the staff password or the team passcode in the guide.
