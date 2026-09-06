// Global tunables. Change these to re-pace the whole game.
window.Game = window.Game || {};

Game.config = {
  tickMs: 200,           // engine tick interval (ms)
  autosaveMs: 15000,      // autosave interval (ms)
  baseFreeElectricity: 0, // kW available for free before any generator is built - nothing until you rent a place with power (see the SF Apartment building)
  baseLandCap: 0,         // acres of land available before any more is leased - nothing until you rent the SF Apartment (see its providesLandCap)
  electricityPricePerKwhDefault: 0.10, // $ per kWh actually drawn, seeded into state.electricityPricePerKwh on a fresh game - editable live from the status bar, not a fixed constant
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

  tokensPricePerMillion: 8, // $ earned per 1,000,000 tokens sold via Auto-Convert (see engine._runTokenConversion) - raised from 5 alongside the power/water rebalance below, so the extra infrastructure spend isn't a pure nerf
  tokensToResearchRatio: 0.0001, // research points earned per token trained via Auto-Convert (10,000 tokens = 1 RP)

  hoursPerMonth: 730, // 24 * 365/12, average - divides any monthly cost (rent, etc.) into an hourly billing rate
  hoursPerYear: 8760,  // 24 * 365 - divides an annual salary into an hourly rate (see the Software Job toggle)

  softwareJobAnnualSalary: 100000, // $/yr earned continuously while the Software Job toggle is on
  softwareJobRaisePct: 0.03, // annual raise, compounding once per in-game Jan 1 (see actions.softwareJobSalary / format.yearsSinceStart)

  // Real-world reference constants for the top-bar "% of US GDP" / "% of US
  // electricity" stats (see render.js renderStatusBar). Point-in-time
  // approximations (~2025-2026), not a live feed - same idea as the
  // snapshotted tech-company market caps in data/upgrades.js.
  usGdpAnnual: 29000000000000, // ~$29T nominal US GDP/yr
  usElectricityAnnualKwh: 4050000000000, // ~4,050 TWh/yr total US electricity consumption (EIA)
};
