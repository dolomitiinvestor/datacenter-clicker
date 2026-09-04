window.Game = window.Game || {};

// --- DEV MODE ---
// Temporary playtesting knobs. Intentionally NOT part of Game.state (see
// save.js) so neither ever gets persisted - both always reset to 1x on
// load.
//
// speedMultiplier speeds up passive production (via tick dt) and manual
// click rewards equally, so testing progression doesn't distort the
// balance between clicking and idling.
//
// costMultiplier scales every building/upgrade purchase price (see
// actions.buildingCost / actions.upgradeCost), so you can make buying
// things cheaper (rapid-test late buildings) or pricier (stress-test the
// early economy) without touching the real cost curve in data/.
//
// To remove dev mode later: delete this file, its <script> tag in
// index.html, the #dev-mode-panel block in index.html, the
// `* Game.dev.speedMultiplier` / `* Game.dev.costMultiplier` factors in
// actions.js and main.js.
Game.dev = {
  speedMultiplier: 1,
  costMultiplier: 1,

  setSpeed(mult) {
    this.speedMultiplier = mult;
  },

  setCostMultiplier(mult) {
    this.costMultiplier = mult;
  },
};
