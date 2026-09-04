# Datacenter Clicker

A CivClicker-style incremental game, GPU/AI-datacenter themed. Plain HTML/CSS/JS,
no build step — open `index.html` or serve the folder with any static file server.

You start out grinding freelance gigs for cash on your laptop, and work your way
up through buying GPUs, managing electricity, leasing land, lobbying politicians
for zoning/influence, and eventually running enterprise data centers.

## Architecture

Everything content-related lives in `js/data/` as plain data — the engine and UI
never hardcode a specific resource/building/upgrade id (aside from a couple of
UI element toggles). To add new mechanics later, mostly just edit these files:

- `js/data/resources.js` — resource definitions (stock / capacity / flow kinds)
- `js/data/eras.js` — progression stages that gate what's visible, with an
  unlock `check(state)` function each
- `js/data/buildings.js` — cost, land use, production/consumption rates
- `js/data/upgrades.js` — one-time purchases with generic mult/add effects

Core systems in `js/core/`:

- `state.js` — the save-able game state + generic resource helpers
- `effects.js` — reads purchased-upgrade effects by target key
- `engine.js` — the per-tick simulation (electricity flow + brownout,
  production, era-unlock checks)
- `actions.js` — click actions, buy building/upgrade, sell/train conversions
- `save.js` — localStorage save/load + export/import as a base64 string

`js/ui/render.js` renders from state/data each frame; `js/main.js` wires up
the tick loop and button bindings.

### Adding a new building/upgrade/era

1. Add an entry to the relevant `js/data/*.js` file with a unique `id`.
2. If it needs a new resource, add that resource to `resources.js` first.
3. If it's gated behind a new stage, add an era to `eras.js` with a `check`.

No other file needs to change — the buildings/upgrades lists, resource bar,
and land/electricity math all read the data generically.
