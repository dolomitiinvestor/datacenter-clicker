window.Game = window.Game || {};

Game.actions = {
  // --- manual click actions ---

  freelanceGig() {
    const amount = 1 * Game.effects.getMult('click_money') * Game.dev.speedMultiplier;
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

  // Auto-sell/auto-train are toggles, not one-shot actions: while active the
  // engine continuously converts compute into money/reputation every tick
  // (see engine._runComputeConversion) instead of the player having to
  // click to dump an accumulated pile.
  toggleAutoSell() {
    Game.state.autoSell = !Game.state.autoSell;
    return Game.state.autoSell;
  },

  toggleAutoTrain() {
    Game.state.autoTrain = !Game.state.autoTrain;
    return Game.state.autoTrain;
  },

  // --- buying ---

  buildingCost(buildingId) {
    const def = Game.data.buildingsById[buildingId];
    const count = Game.state.buildings[buildingId] || 0;
    const scale = Math.pow(def.costScale, count);
    const costMult = Game.effects.getMult('cost_all') * Game.effects.getMult('cost:' + buildingId);
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

  canBuyUpgrade(upgradeId) {
    if (Game.state.upgrades[upgradeId]) return false;
    const def = Game.data.upgradesById[upgradeId];
    return Game.state_helpers.canAfford(def.cost);
  },

  buyUpgrade(upgradeId) {
    if (!this.canBuyUpgrade(upgradeId)) return false;
    const def = Game.data.upgradesById[upgradeId];
    Game.state_helpers.spend(def.cost);
    Game.state.upgrades[upgradeId] = true;
    Game.state_helpers.recalcLandCap();
    Game.state_helpers.logEvent('Unlocked upgrade: ' + def.name);
    return true;
  },
};
