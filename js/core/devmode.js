window.Game = window.Game || {};

// --- DEV MODE ---
// Temporary playtesting speed multiplier. Intentionally NOT part of
// Game.state (see save.js) so it never gets persisted and always resets
// to 1x on load. Speeds up passive production (via tick dt) and manual
// click rewards equally, so testing progression doesn't distort the
// balance between clicking and idling.
//
// To remove dev mode later: delete this file, its <script> tag in
// index.html, the #dev-mode-panel block in index.html, the
// `* Game.dev.speedMultiplier` factors in actions.js, and the
// `* Game.dev.speedMultiplier` in main.js's loop().
Game.dev = {
  speedMultiplier: 1,

  setSpeed(mult) {
    this.speedMultiplier = mult;
  },
};
