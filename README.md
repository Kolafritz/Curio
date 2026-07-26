# Curio — a cabinet of curiosities

A personal, installable feed app: vertical card-by-card scrolling like a social
app, but every card is real content on topics you chose — pulled live from
Wikipedia, Wikiquote, Wikipedia's On This Day feed, and Semantic Scholar's
research index. Nothing is pre-written into the app; it's fetched fresh each
time you scroll.

## Deploying it (pick one, all free)

Service workers (needed for offline + installability) only run on a real
HTTPS origin or `localhost` — not from a sandbox preview or a `file://` path.
Deploy the whole `curio/` folder as-is (it's plain static files, no
build step) to any of:

- **Netlify Drop** — go to https://app.netlify.com/drop and drag the folder in. Done in ~10 seconds.
- **Vercel** — `npx vercel` from inside the folder, or drag-and-drop on vercel.com.
- **GitHub Pages** — push the folder to a repo, then enable Pages on the `main` branch in repo settings.

Once it's live, open the URL on your phone and use "Add to Home Screen"
(Safari/iOS) or the install prompt (Chrome/Android) to install it.

## How it's built

- `index.html` — app shell
- `css/styles.css` — the whole visual design (see "Design" below)
- `js/topics.js` — the 17 topics: id, label, ink color, glyph, and the
  Wikipedia search terms that seed each one
- `js/curated.js` — hand-verified fallback content (a handful of checked
  Stoic quotes, German/Korean vocab cards) used when a live fetch fails
- `js/sources.js` — fetches and normalizes cards from each API
- `js/feed.js` — renders cards, the flip mechanic, infinite scroll, save/share
- `js/app.js` — topic picker drawer, persisted preferences, service worker
  registration, install prompt
- `service-worker.js` — offline caching (see strategy comments at the top)
- `manifest.json` — installability metadata

## Design concept

Curio is built around a cabinet of curiosities — a personal collection of
specimens from wide-ranging interests. Each topic is a labeled "drawer" with
its own ink color and glyph; cards behave like index cards that flip to
reveal the fuller note on the back; the colored tab on the left edge of each
card echoes old library catalog tabs and doubles as the topic picker.

## Content sources, per topic

- **Most topics** (history, philosophy, fitness, tennis, beer, honey, etc.):
  Wikipedia search + summary API, rotating through a seed list of ~10-15
  search terms per topic so you're not always shown the same handful of
  articles.
- **Stoicism**: live Wikiquote fetch from Marcus Aurelius / Seneca / Epictetus'
  quote pages, with a small verified fallback list if that fetch fails.
- **History Fun Facts**: Wikipedia's "On This Day" feed — genuinely changes
  by date.
- **Psychology, Marketing, Fitness**: mostly Wikipedia concept explainers,
  with roughly a third of cards pulled from Semantic Scholar's paper search
  (real abstracts, authors, year) for the "current research" angle.
- **German / Korean**: a small curated vocab/concept set (see `curated.js`).
  This is the one place worth expanding by hand over time — free APIs for
  clean vocabulary content are much messier than Wikipedia's.

## "Today's Edition"

Once per calendar day, the app generates a fixed front-page batch (one card
per active topic) and caches it — reopening the app later that same day shows
the same edition rather than reshuffling. Below it, infinite scroll continues
live as normal. Changing your topic selection takes effect in the infinite
section immediately; the edition itself stays frozen until the next day.

## Known limitations, honestly

- **No background push.** This is a static site with no backend, so there's
  no way to notify you "today's edition is ready" while the app is closed.
  Opening the app is what triggers the fetch.
- **Some topics lean more "explainer" than "advice."** Free public APIs are
  great for history/concepts but don't really have "how to fix your tennis
  serve" or "how to budget" content — those cards are closer to technique
  and concept explainers than personal coaching. Worth knowing going in.
- **Semantic Scholar has a light rate limit** on unauthenticated use. If it's
  briefly unavailable the app just falls back to a Wikipedia card instead —
  you shouldn't notice, but it's why not every "research" topic card is
  literally a paper.

## Extending it

To add a topic, add an entry to the `TOPICS` array in `js/topics.js` with an
`ink` color, a `glyph`, a `kind` (`wiki`, `stoic-quote`, `onthisday`,
`mixed-research`, or a curated `vocab-*` kind you wire up in `sources.js`),
and a `seeds` list of good search terms. No other file needs to change.
