window.Game = window.Game || {};

// --- DEV MODE ---
// Temporary playtesting knobs. Intentionally NOT part of Game.state (see
// save.js) so none of them ever get persisted - all reset to their default
// on load.
//
// speedMultiplier speeds up passive production (via tick dt) and manual
// click rewards equally, so testing progression doesn't distort the
// balance between clicking and idling. Stacks multiplicatively on top of
// the player-facing clock-speed slider (state.clockSpeedMultiplier).
//
// costMultiplier scales every building/upgrade purchase price (see
// actions.buildingCost / actions.upgradeCost), so you can make buying
// things cheaper (rapid-test late buildings) or pricier (stress-test the
// early economy) without touching the real cost curve in data/.
//
// costScalingEnabled toggles whether repeated building purchases get more
// expensive at all (def.costScale ^ count). Off = every unit costs the
// same as the first, useful for isolating other balance changes from the
// cost curve while testing.
//
// stateEditorOpen just tracks whether the raw-state JSON editor panel is
// expanded - see index.html #dev-state-editor and main.js.
//
// To remove dev mode later: delete this file, its <script> tag in
// index.html, the #dev-mode-panel and #dev-state-editor blocks in
// index.html, and the `Game.dev.*` references in actions.js and main.js.
Game.dev = {
  speedMultiplier: 1,
  costMultiplier: 1,
  costScalingEnabled: false,
  stateEditorOpen: false,

  setSpeed(mult) {
    this.speedMultiplier = mult;
  },

  setCostMultiplier(mult) {
    this.costMultiplier = mult;
  },

  toggleCostScaling() {
    this.costScalingEnabled = !this.costScalingEnabled;
    return this.costScalingEnabled;
  },
};
