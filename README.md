# Haoyi Studio

A personal interactive study space focused on physics, aerospace and music.

## Features

- De Laval nozzle explorer: quasi-one-dimensional steady, inviscid ideal-gas flow with choking and internal normal shocks.
- Interactive four-string E–A–D–G bass fretboard, scales and intervals.
- An icon-based workspace dashboard leading to separate Physics Lab, Music Lab, Library and Focus Mode menus. Each topic or tool opens on its own page.
- Quick links to live tools, with the two most recently visited topic pages remembered in the browser.
- Library reading paths marked as planned, plus a browser-local focus and break timer.
- Responsive static website; no backend or paid service is required.

## Files

- `index.html`: homepage with the top-level space menu
- `physics.html`, `music.html`, `library.html`, `focus.html`: separate space menus
- `nozzle.html`, `bass.html`, `reading-paths.html`, `timer.html`: topic and tool pages
- `assets/styles.css`: original responsive styling
- `assets/sections.css`: navigation, new sections and timer styling
- `assets/favicon.svg`: icon
- `js/nozzle.mjs`: nozzle solver
- `js/nozzle-ui.mjs`, `js/bass-ui.mjs`: controls and visualizations for their respective pages
- `js/navigation.mjs`: menu interactions
- `js/site.mjs`: shared footer year
- `js/focus.mjs`: focus timer
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

## Maintenance

The repository remains under the owner's GitHub account. Never commit passwords, API keys, or private documents. Cloudflare Pages can redeploy automatically when new commits are pushed to `main`.
