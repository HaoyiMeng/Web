# Haoyi Studio

A personal interactive study space focused on physics, aerospace and music.

## Features

- De Laval nozzle explorer: quasi-one-dimensional steady, inviscid ideal-gas flow with choking and internal normal shocks.
- Interactive four-string E–A–D–G bass fretboard, scales and intervals.
- An icon-based workspace dashboard leading to separate Physics Lab, Music Lab, Library and Focus Mode menus. Each topic or tool opens on its own page.
- Quick links to live tools, with the two most recently visited topic pages remembered in the browser.
- Library reading paths marked as planned; focus timer supports 15/25/50 minute sessions, local daily statistics and study tasks.
- Library “数字” reference: 13 dimensionless numbers with Chinese explanations, native MathML formulas, symbols, worked examples, engineering applications and primary-source references. Search by Chinese/Italian/English name or symbol, filter by topic, and link directly to entries (e.g. `numbers.html#reynolds`).
- Browser-based metronome with tempo, time signature, subdivisions, and Tap Tempo; synthesized audio with Web Audio API.
- Homepage daily focus summary from browser-local data.
- Responsive static website; no backend or paid service is required.

## Files

- `index.html`: homepage with the top-level space menu
- `physics.html`, `music.html`, `library.html`, `focus.html`: separate space menus
- `nozzle.html`, `bass.html`, `reading-paths.html`, `timer.html`, `metronome.html`: topic and tool pages
- `assets/styles.css`: original responsive styling
- `assets/sections.css`: navigation, new sections and timer styling
- `assets/favicon.svg`: icon
- `js/nozzle.mjs`: nozzle solver
- `js/nozzle-ui.mjs`, `js/bass-ui.mjs`: controls and visualizations for their respective pages
- `js/navigation.mjs`: menu interactions
- `js/site.mjs`: shared footer year
- `js/focus.mjs`: persistent focus timer and task list
- `js/metronome.mjs`: Web Audio-based practice metronome
- `js/dashboard.mjs`: homepage focus summaries
- `numbers.html`, `assets/numbers.css`, `js/numbers-data.mjs`, `js/numbers-ui.mjs`: dimensionless-number catalog and linked details
- `tests/nozzle.test.mjs`: basic numerical checks

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/ in a browser.

Run numerical checks with Node.js:

```sh
node tests/nozzle.test.mjs
```

## Publish with Cloudflare Pages

Connect this repository (`HaoyiMeng/Web`) to Cloudflare Pages:

- Production branch: `main`
- Framework preset: `None`
- Build command: *(leave empty)*
- Build output directory: `.` (repository root)

Once `*.pages.dev` is working, add `haoyistudio.com` as a **Custom domain** in the Cloudflare Pages project.

## Physical-model limitations

The nozzle model assumes a steady, quasi-one-dimensional, inviscid, adiabatic ideal gas with `gamma = 1.4`. The geometry uses illustrative area ratios, not a real nozzle design. A normal shock in the diverging section is modeled using conservation relations and stagnation pressure loss. External exhaust-plume effects, viscosity, boundary-layer separation, real-gas effects and transient flow are excluded.

This is a learning model, not an engineering design or safety-critical tool. Verify the equations against independent textbook or reference results before using it for teaching.

## Browser data and limitations

Focus history and tasks, as well as metronome preferences, are saved in the browser's localStorage. They are **not synced across devices**, and clearing browser/site data may delete them. Completed focus sessions are counted once; partial sessions are not. Web Audio typically cannot stay active on iOS when the page is backgrounded or locked. No account, recording or microphone permission is needed.

## Maintenance

The repository remains under the owner's GitHub account. Never commit passwords, API keys, or private documents. Cloudflare Pages can redeploy automatically when new commits are pushed to `main`.
