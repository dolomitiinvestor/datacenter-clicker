window.Game = window.Game || {};

Game.actions = {
  // --- manual click actions ---

  freelanceGig() {
    const amount = 1 * Game.effects.getMult('click_money');
    Game.state_helpers.add('money', amount);
    Game.state.stats.totalMoneyEarned += amount;
    Game.state.stats.totalClicks++;
    return amount;
  },

  schmoozePolitician() {
    const amount = 1 * Game.effects.getMult('influence_gain');
    Game.state_helpers.add('influence', amount);
    return amount;
  },

  sellCompute() {
    const stock = Game.state.resources.compute.amount;
    if (stock <= 0) return 0;
    const price = 0.5 * Game.effects.getMult('sell_price');
    const earned = stock * price;
    Game.state.resources.compute.amount = 0;
    Game.state_helpers.add('money', earned);
    Game.state.stats.totalMoneyEarned += earned;
    return earned;
  },

  trainModel() {
    const stock = Game.state.resources.compute.amount;
    if (stock <= 0) return 0;
    const ratio = 0.1 * Game.effects.getMult('train_ratio');
    const gained = stock * ratio;
    Game.state.resources.compute.amount = 0;
    Game.state_helpers.add('reputation', gained);
    return gained;
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
