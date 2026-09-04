window.Game = window.Game || {};

Game.actions = {
  // --- manual click actions ---

  // Current day index for the freelance shift cap, and how many of
  // today's shifts are left. Read-only - freelanceGig() below is the only
  // thing that advances clicksToday.
  freelanceShiftsRemaining() {
    const day = Math.floor(Game.state.time.hours / 24);
    const used = day === Game.state.freelance.day ? Game.state.freelance.clicksToday : 0;
    return Game.config.freelanceMaxClicksPerDay - used;
  },

  // One DoorDash shift = one click = $15 (config.freelanceHourlyRate),
  // capped at config.freelanceMaxClicksPerDay per rolling in-game day.
  // Returns the amount earned, or null if today's shifts are used up.
  freelanceGig() {
    const day = Math.floor(Game.state.time.hours / 24);
    if (day !== Game.state.freelance.day) {
      Game.state.freelance.day = day;
      Game.state.freelance.clicksToday = 0;
    }
    if (Game.state.freelance.clicksToday >= Game.config.freelanceMaxClicksPerDay) return null;
    Game.state.freelance.clicksToday++;

    const amount = Game.config.freelanceHourlyRate * Game.effects.getMult('click_money') * Game.dev.speedMultiplier;
    Game.state_helpers.add('money', amount);
    Game.state.stats.totalMoneyEarned += amount;
    Game.state.stats.totalClicks++;
    return amount;
  },

  schmoozePolitician() {
    const amount = 1 * Game.effects.getMult('influence_gain') * Game.dev.speedMultiplier;
    Game.state_helpers.add('influence', amount);
    return amount;
  },

  // Steady day job toggle: while on, the engine pays out
  // config.softwareJobAnnualSalary continuously (see engine._runSoftwareJob)
  // instead of requiring clicks.
  toggleSoftwareJob() {
    Game.state.softwareJobEnabled = !Game.state.softwareJobEnabled;
    return Game.state.softwareJobEnabled;
  },

  // Auto-convert is a toggle, not a one-shot action: while active the
  // engine continuously converts tokens into money/research points every
  // tick (see engine._runTokenConversion), split by trainAllocationPct,
  // instead of the player having to click to dump an accumulated pile.
  toggleAutoConvert() {
    Game.state.autoConvertEnabled = !Game.state.autoConvertEnabled;
    return Game.state.autoConvertEnabled;
  },

  // pct: 0 = all tokens sold for cash, 100 = all tokens trained into
  // research points, anything between splits continuously both ways.
  setTrainAllocation(pct) {
    Game.state.trainAllocationPct = Math.max(0, Math.min(100, pct));
  },

  // --- buying ---

  buildingCost(buildingId) {
    const def = Game.data.buildingsById[buildingId];
    const count = Game.state.buildings[buildingId] || 0;
    const scale = Game.dev.costScalingEnabled ? Math.pow(def.costScale, count) : 1;
    const costMult = Game.effects.getMult('cost_all') * Game.effects.getMult('cost:' + buildingId) * Game.dev.costMultiplier;
    const cost = {};
    for (const resId in def.baseCost) {
      cost[resId] = def.baseCost[resId] * scale * costMult;
    }
    return cost;
  },

  canBuyBuilding(buildingId) {
    const def = Game.data.buildingsById[buildingId];
    const cost = this.buildingCost(buildingId);
    if (!Game.state_helpers.canAfford(cost)) return false;
    if (def.land && Game.state_helpers.landAvailable() < def.land) return false;
    return true;
  },

  buyBuilding(buildingId) {
    if (!this.canBuyBuilding(buildingId)) return false;
    const def = Game.data.buildingsById[buildingId];
    const cost = this.buildingCost(buildingId);
    Game.state_helpers.spend(cost);
    Game.state.resources.land.used += def.land || 0;
    Game.state.buildings[buildingId] = (Game.state.buildings[buildingId] || 0) + 1;
    Game.state_helpers.recalcLandCap();
    return true;
  },

  upgradeCost(upgradeId) {
    const def = Game.data.upgradesById[upgradeId];
    const cost = {};
    for (const resId in def.cost) {
      cost[resId] = def.cost[resId] * Game.dev.costMultiplier;
    }
    return cost;
  },

  canBuyUpgrade(upgradeId) {
    if (Game.state.upgrades[upgradeId]) return false;
    return Game.state_helpers.canAfford(this.upgradeCost(upgradeId));
  },

  buyUpgrade(upgradeId) {
    if (!this.canBuyUpgrade(upgradeId)) return false;
    const def = Game.data.upgradesById[upgradeId];
    Game.state_helpers.spend(this.upgradeCost(upgradeId));
    Game.state.upgrades[upgradeId] = true;
    Game.state_helpers.recalcLandCap();
    Game.state_helpers.logEvent('Unlocked upgrade: ' + def.name);
    return true;
  },
};
