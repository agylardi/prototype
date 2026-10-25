# Interactive odontogram — Three.js prototype

A 3D teeth chart whose per-tooth condition is driven by backend data. Each tooth
has three authored variants — healthy, unhealthy, very unhealthy — plus an
empty-gum node shown when the tooth is missing. The scene reacts to cursor
movement on desktop and to device tilt on mobile.

No build step, no bundler, no framework. Plain ES modules with an import map,
so it can be dropped on GitHub Pages, S3, or any static host as-is.

---

## Run it

```bash
# any static server works
npx serve .              # or: python3 -m http.server

# or the included dev server, which also mocks a writable chart API
npm start                # → http://localhost:5173
```

```bash
npm test                 # numbering, node-name parsing, payload normalising
```

Then open the live-backend variant to exercise polling and writes:

```
http://localhost:5173/?source=http&url=/api/chart&poll=2000
```

**There is no model in the repository yet.** Until `public/models/odontogram.glb`
exists, the app generates a stand-in arch in code using the same node names the
real export should use. Everything downstream — indexing, state switching,
crossfades, picking, the chart UI — runs against it exactly as it will against
the real asset.

---

## Integrating the real model

Drop the export at `public/models/odontogram.glb`. Name one node — mesh or
group — per tooth per state:

```
tooth_11_healthy
tooth_11_unhealthy
tooth_11_very_unhealthy
gum_11_empty
```

Separators are flexible, case is ignored, Blender's `.001` suffixes are
stripped, and FDI (11–48) or Universal (1–32) numbering is detected
automatically. `Tooth11.Severe`, `T_11_state3` and `very_unhealthy_tooth_11`
all resolve. Names that will not parse can be pinned in
`public/models/tooth-map.json` — see the example file next to it.

Load with `?debug=1` and the console prints a coverage report:

```js
{ teethFound: 32, numbering: 'fdi', withEmptyGum: 32, incomplete: [], unmatchedNodes: [...] }
```

`incomplete` lists any tooth missing a variant; `unmatchedNodes` lists geometry
the parser ignored (gums, tongue, and anything else that is not a tooth state —
those stay permanently visible, which is usually what you want).

The app never moves the model's geometry. It only toggles visibility, so the
three variants of a tooth must occupy the same place in the file.

Full export checklist: [`public/models/README.md`](public/models/README.md).

---

## Backend contract

`GET` returns a chart; anything not listed is treated as healthy. All of these
parse, in either numbering scheme:

```jsonc
{ "teeth": { "1": "healthy", "3": "unhealthy", "4": "missing" } }
{ "teeth": [ { "id": 1, "state": "healthy" } ] }
[ { "tooth": 11, "status": "decayed" } ]
```

State strings run through an alias table, so `decayed`, `caries`, `severe`,
`extracted`, `state3` and friends all land on the four canonical values
(`healthy`, `unhealthy`, `very-unhealthy`, `missing`). Add project-specific
wording to `STATE_ALIASES` in `src/toothStates.js` — that is the only place it
needs to go.

Writes are optimistic: the scene updates immediately, then `PATCH`es
`{ teeth: { "3": "unhealthy" } }`. If the endpoint rejects it — as a static host
will — the status pill downgrades to read-only and the session keeps working
locally.

Three sources are wired up:

| Source | Behaviour |
| --- | --- |
| `http` (default) | Fetch once; poll if `poll` is set |
| `ws` | Push updates, with capped exponential-backoff reconnect |
| `mock` | Built-in demo chart, no network |

Switch at runtime with `?source=ws&url=wss://…`, or set the defaults in
`src/config.js`.

---

## Interaction

**Desktop.** Cursor position drives a camera rig, a counter-rotating look-at
point, and the key and fill lights. Because the look-at point moves against the
camera, the result reads as a slight orbit rather than a slide — the difference
between "alive" and "sliding photo".

**Mobile.** `deviceorientation` drives the same rig. The first few readings
become the neutral pose, so it works whether the phone is held flat or upright,
and screen rotation is compensated so landscape does not invert the axes. iOS
13+ requires a gesture before it will emit events at all, so a "Use device tilt"
button appears only on devices that need it.

**Idle.** After a few seconds without input the scene drifts on two
incommensurate sine frequencies, which avoids an obvious loop.

**Chart panel.** Selection is two-way — pick in the scene, the chart highlights,
and vice versa. Under 860px the panel collapses to its header so the scene has
the screen to itself.

**Picking.** Tap or click a tooth to select it; the chart highlights in sync,
and vice versa. A pointer that travelled more than 8px between down and up was a
drag, not a pick. Hover raycasts are throttled to 25 Hz and only test currently
visible meshes.

Everything above is disabled under `prefers-reduced-motion`, including the
state crossfades.

---

## Configuration

`src/config.js` holds every tunable. Each can be overridden per session with a
query parameter, which makes review and QA quick:

| Parameter | Example | Effect |
| --- | --- | --- |
| `model` | `?model=./public/models/v2.glb` | Load a different export |
| `source` `url` `poll` | `?source=http&url=/api/chart&poll=2000` | Chart source |
| `numbering` | `?numbering=universal` | Force the id scheme instead of sniffing |
| `orbit` | `?orbit=1` | Swap parallax for orbit controls (asset review) |
| `fade` | `?fade=0` | Disable state crossfades |
| `debug` | `?debug=1` | Coverage report + unmatched-node table |

`window.odontogram` exposes `{ scene, model, chart, parallax, report() }` for
console-driven testing:

```js
odontogram.model.setState(26, 'very-unhealthy');
odontogram.chart.setTooth(15, 'missing');
odontogram.report();
```

---

## Architecture

```
src/
  main.js                    wiring only — nothing else knows about the DOM shell
  config.js                  tunables + query-string overrides
  SceneManager.js            renderer, camera rig, lights, frame loop
  OdontogramModel.js         node indexing, state switching, crossfade, highlight
  ChartService.js            backend adapter: http / ws / mock, payload normalising
  ParallaxController.js      pointer + gyroscope → smoothed deflection
  Picker.js                  raycast selection
  numbering.js               FDI ↔ Universal, anatomical names
  toothStates.js             canonical states, alias table, node-name parsing
  ui/ChartStrip.js           the 2D chart panel
  placeholder/               stand-in geometry — delete once the model lands
```

Three boundaries are worth knowing about, because they are where changes land:

- **`toothStates.js`** absorbs naming differences between the model, the API and
  the app. New vocabulary goes in the alias table, not into conditionals
  scattered across the scene code.
- **`ChartService.js`** is the only module that talks to the network. Replacing
  it with a Redux store, a GraphQL subscription or a React context is a
  one-file change — it just needs to emit `change` with a `Map<fdi, state>`.
- **`OdontogramModel.js`** never touches transforms, only visibility and
  material opacity, so re-exported assets cannot break the layout.

Materials are cloned once per tooth-state group rather than per mesh, so a
32-tooth arch fades and highlights independently without a clone per triangle
soup. Only visible meshes enter the raycast set.

---

## Notes and limits

- `deviceorientation` needs a secure context. GitHub Pages is HTTPS, so tilt
  works on the hosted demo; plain `http://` on a LAN address will not.
- Three is pulled from a CDN via the import map for zero-setup hosting. For
  production, vendor it (`npm i three`, copy `build/` and the addons used, then
  point the import map at the local copies) so the app has no third-party
  runtime dependency.
- The stand-in arch is deliberately simple geometry — it exists to prove the
  pipeline, not to look like teeth. It costs ~600 meshes; the real export will
  be far cheaper. Delete `src/placeholder/` once the model is in.
- Draco is wired up but optional; the decoder path is in `config.js`.

## Verified

Checked in headless Chromium (software WebGL) at 1280x800, 1024x640, 768x1024,
390x844 and 360x640: no page errors, no horizontal overflow, ~190 draw calls and
~38k triangles on the stand-in arch. Scene picking resolves teeth across the
arch and stays in sync with the chart; `?source=mock`, `?orbit=1`, `?fade=0`,
`?debug=1` and a deliberately broken endpoint all load cleanly, and the endpoint
failure degrades to demo data rather than an empty scene. Under
`prefers-reduced-motion` the camera rig stays at the origin.

Node-side unit coverage for the parts that are pure logic — FDI/Universal
conversion, node-name parsing, payload normalisation across every supported
shape — lives in the test snippets referenced in the commit history rather than
a runner, since the project has no build step or dependencies.
```
