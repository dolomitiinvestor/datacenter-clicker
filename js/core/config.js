// Global tunables. Change these to re-pace the whole game.
window.Game = window.Game || {};

Game.config = {
  tickMs: 200,           // engine tick interval (ms)
  autosaveMs: 15000,      // autosave interval (ms)
  baseFreeElectricity: 2, // kW available for free before any generator is built
  baseLandCap: 4,         // land plots available before any land is leased
  saveKey: 'datacenter-clicker-save-v1',
};
