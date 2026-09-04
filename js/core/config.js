// Global tunables. Change these to re-pace the whole game.
window.Game = window.Game || {};

Game.config = {
  tickMs: 200,           // engine tick interval (ms)
  autosaveMs: 15000,      // autosave interval (ms)
  baseFreeElectricity: 2, // kW available for free before any generator is built
  baseLandCap: 4,         // acres of land available before any more is leased
  electricityPricePerKwh: 0.01, // $ per kWh actually drawn - your utility bill
  saveKey: 'datacenter-clicker-save-v1',

  // The in-game clock: base pace is 1 real second = 1 in-game hour
  // (3600 in-game seconds), before the player's clock-speed slider or
  // dev mode's speed multiplier are applied. This is what state.time.hours
  // ticks on, so it's the linear basis for time-based costs (electricity
  // billing) and the calendar display.
  baseGameSecondsPerRealSecond: 3600,
  startDate: Date.UTC(2022, 10, 30), // November 30, 2022, 00:00 UTC - in-game "day zero"

  freelanceHourlyRate: 15,    // $ earned per Freelance (DoorDash) click
  freelanceMaxClicksPerDay: 12, // shift cap per rolling in-game 24h day (see state.time.hours)

  tokensPricePerMillion: 5, // $ earned per 1,000,000 tokens sold (see actions.sellTokens)
};
