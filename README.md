# Haoyi Studio

A personal interactive study space focused on physics, aerospace and music.

## Features

- Conformal Mapping Lab (`conformal.html`): linked generating-circle and Joukowski-airfoil planes, four geometry presets, draggable circle center, chord-relative incidence, manual circulation or automatic Kutta condition, continuous mapped streamlines/equipotentials and linked point probes with velocity, map scale and Cp. Uses b and U∞ as unit scales, CCW-positive circulation, and CL = -2Γ/(U∞c). The circle is constrained to pass through +b with -b inside/on the solid; analytic cancellation and removable limits keep Kutta trailing-edge velocities finite. Arbitrary circulation retains the physical ideal-flow trailing-edge singularity. No viscous separation or stall prediction.

- Potential Flow Lab (`potential-flow.html`): freely place, drag, duplicate, enable/disable and tune up to 16 sources, sinks, vortices, ideal doublets and finite source/sink pairs. Includes uniform flow, streamlines, equipotentials, velocity directions, advected particles, scalar backgrounds, point probes and circular flux/circulation measurements. Finite pairs support fixed dipole moment while changing separation. Uses the supplied course convention: positive circulation is counterclockwise, and doublet orientation points from sink to source. No network dependencies or backend.
- De Laval nozzle explorer: configurable back-pressure ratio, inlet/exit/throat area ratios, throat position, nozzle length, reservoir total pressure/temperature, heat-capacity ratio and gas constant; responsive geometry, moving tracers, live cross-section probe, normalized static-pressure and selected-property axial plots. Predicts choking, normal-shock position, exit conditions and dimensional mass flow.
- Interactive four-string E1–A1–D2–G2 bass fretboard with three modes: single-note names and frequencies (default), accurately spelled two-note intervals, and 17 chord types with degree-labelled tones across the fretboard. Optional louder synthesized bass audio has a 0–100% volume control and simultaneous chord playback; off by default, with no samples required.
- An icon-based workspace dashboard leading to separate Physics Lab, Music Lab, Library and Focus Mode menus. Each topic or tool opens on its own page.
- Quick links to live tools, with the two most recently visited topic pages remembered in the browser.
- Library reading paths marked as planned; focus timer supports 15/25/50 minute sessions, local daily statistics and study tasks.
- Library “数字” reference: 13 dimensionless numbers with Chinese explanations, native MathML formulas, symbols, worked examples, engineering applications and primary-source references. Search by Chinese/Italian/English name or symbol, filter by topic, and link directly to entries (e.g. `numbers.html#reynolds`).
- Library “公式”: 12 cards grouped by color and text labels into operator rules, integral/transport theorems, balance equations and closure models. Nabla rules are organized by gradient, divergence, curl, directional derivative and Laplacian, with expandable product identities and explicit tensor conventions. Includes Gauss, Stokes and Reynolds transport, step-by-step derivations, physical meanings and conditions. Deep links use `formulas.html#momentum` etc. Formulas use self-contained native MathML.
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
- `js/bass-theory.mjs`, `js/bass-audio.mjs`, `assets/bass.css`: spelled absolute-pitch interval analysis, optional Web Audio bass synthesis and fretboard layout
- `js/bass-chords.mjs`: triad, suspended, sixth, seventh and ninth formulas, correctly spelled chord tones and octave projection
- `js/navigation.mjs`: menu interactions
- `js/site.mjs`: shared footer year
- `js/focus.mjs`: persistent focus timer and task list
- `js/metronome.mjs`: Web Audio-based practice metronome
- `js/dashboard.mjs`: homepage focus summaries
- `numbers.html`, `assets/numbers.css`, `js/numbers-data.mjs`, `js/numbers-ui.mjs`: dimensionless-number catalog and linked details
- `formulas.html`, `assets/formulas.css`, `js/formulas-*.mjs`, `js/formula-math.mjs`: balance-equation reference and derivations
- `tests/nozzle.test.mjs`: basic numerical checks

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/ in a browser.

Run numerical checks with Node.js:

```sh
node tests/nozzle.test.mjs
node tests/potential-flow.test.mjs
node tests/potential-flow-ui.test.mjs
node tests/site.test.mjs
node tests/bass-theory.test.mjs
node tests/bass-chords.test.mjs
node tests/bass-audio.test.mjs
node tests/bass-ui.test.mjs
```

## Publish with Cloudflare Pages

Connect this repository (`HaoyiMeng/Web`) to Cloudflare Pages:

- Production branch: `main`
- Framework preset: `None`
- Build command: *(leave empty)*
- Build output directory: `.` (repository root)

Once `*.pages.dev` is working, add `haoyistudio.com` as a **Custom domain** in the Cloudflare Pages project.

## Physical-model limitations

The potential-flow lab assumes two-dimensional incompressible inviscid flow, irrotational away from ideal singularities. Strength Q and circulation Gamma have units m²/s; dipole moment mu has units m³/s. The source/sink pair separation is d = 2 ell with mu = Q d. The ideal doublet potential is -mu cos(theta-alpha)/(2 pi r). Scalar evaluation uses r0 = 1 m and atan2 branches; curves follow continuous local branches across artificial cuts, while probe values and heatmaps use principal branches. A 0.12 m display exclusion radius hides singular neighborhoods without regularizing the analytic solution. The cylinder preset combines opposed uniform flow/doublet directions and a concentric vortex, provides signed Gamma/(4 pi a U) controls, masks the solid interior and marks analytical stagnation points and separatrices for subcritical, critical and supercritical circulation. Free combinations only display a cylinder if they satisfy the exact no-penetration geometry. Full adaptive RK4 curve tracing replaces proximity-truncated streamlines and cellwise potential segments; density filters complete curves without breaking them. Curve seed spacing is a drawing choice, not a calibrated velocity measurement. Velocity arrows show direction only; particles use actual velocity with adaptive RK4 steps. Circular measurements use 512 midpoint quadrature samples and are suppressed when a path crosses a singularity's exclusion neighborhood. Display colors scale to the current view. Scenes are kept in memory only and reset on reload.

The nozzle model assumes a steady, quasi-one-dimensional, inviscid, adiabatic ideal gas with configurable constant `gamma` (default 1.4) and specific gas constant `R` (default 287.05 J/(kg·K)). Geometry is an illustrative smooth area distribution; drawn radius is proportional to the square root of local area. Flow is recalculated at every parameter change. Normal-shock conservation and stagnation pressure loss are included. Displayed particles are slowed illustrative path tracers, not time-accurate fluid simulation. External exhaust-plume shocks/expansions, wall friction, boundary-layer separation, variable gas properties, real-gas effects and transient flow are excluded.

This is a learning model, not an engineering design or safety-critical tool. Verify the equations against independent textbook or reference results before using it for teaching.

## Browser data and limitations

The bass fretboard opens in **single-note mode**: each click replaces the current note and shows its sounding name, octave and frequency (A4=440 Hz). Switch modes with the labelled radio controls; changing modes clears selection and stops ringing or queued audio. Changing the default sharp/flat spelling also clears the current selection in all three modes, so no selected note retains an old spelling. Click a blank area within the fretboard scroll region (including fret cells, string labels and fret numbers), or press Escape while focused inside it, to clear selection and stop playback. Clicking note buttons or using controls outside this region does not trigger blank-area cancellation. Arrow keys move between strings and frets, Home/End move to the ends of a string, and Enter/Space select a note.

In **interval mode**, the third click starts a new pair; clicking the same position twice gives a unison. Each selected note has its own enharmonic spelling selector. Letter/octave positions determine interval number, while the signed semitone span in written ascending order determines quality; click order determines sounding direction. This also handles crossed spellings and same-pitch diminished seconds. Scales highlight pitch classes independently of the interval. Example buttons demonstrate C–D♯ / C–E♭, augmented thirds and diminished thirds. Theory reference: [Open Music Theory — Intervals](https://viva.pressbooks.pub/openmusictheory/chapter/intervals/).

In **chord mode**, click any note as the root, select a chord type and optionally change the root spelling. All matching positions across octaves show their chord roles (1, 3, ♭3, 5, ♭7, 9, etc.), with correct enharmonic spelling such as C♯–E♯–G♯. The 17 types include major/minor/diminished/augmented triads, sus2/sus4, major/minor sixths, dominant/major/minor/half-diminished/diminished/minor-major sevenths, and dominant/major/minor ninths. “一起弹奏和弦” plays each formula tone once, stacked upwards from the selected root, at the same start time. The board is a map of all available chord-tone locations, rather than a single playable bass fingering.

Bass sound starts only after enabling its switch. The volume slider defaults to 80%; richer harmonics and a stronger pluck improve low-note audibility, with conservative polyphonic mixing and compression for headroom. Volume 0 immediately silences the output. It is synthesized, not a sampled instrument. Muting cancels both ringing notes and queued playback; leaving the page or hiding the tab stops active notes. Unsupported audio or browser restrictions leave all visual exploration available.

Focus history and tasks, as well as metronome preferences, are saved in the browser's localStorage. They are **not synced across devices**, and clearing browser/site data may delete them. Completed focus sessions are counted once; partial sessions are not. Web Audio typically cannot stay active on iOS when the page is backgrounded or locked. No account, recording or microphone permission is needed.

## Maintenance

The repository remains under the owner's GitHub account. Never commit passwords, API keys, or private documents. Cloudflare Pages can redeploy automatically when new commits are pushed to `main`.

