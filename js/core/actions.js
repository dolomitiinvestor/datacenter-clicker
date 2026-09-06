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
  // softwareJobSalary() continuously (see engine._runSoftwareJob) instead
  // of requiring clicks.
  toggleSoftwareJob() {
    Game.state.softwareJobEnabled = !Game.state.softwareJobEnabled;
    return Game.state.softwareJobEnabled;
  },

  // Base salary plus any flat upgrades (e.g. Mechanical Keyboard's +$10k),
  // compounded by a 3% raise every in-game Jan 1 since start.
  softwareJobSalary() {
    const base = Game.config.softwareJobAnnualSalary + Game.effects.getAdd('software_job_salary');
    const years = Game.format.yearsSinceStart(Game.state.time.hours);
    return base * Math.pow(1 + Game.config.softwareJobRaisePct, years);
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
    return this.buildingCostForQty(buildingId, 1);
  },

  // Total cost to buy `qty` more of a building at once (see the Buy
  // 10/100 buttons on compute cards in render.js). When dev mode's cost
  // scaling is off (the normal-play default), a building's price is flat
  // regardless of count owned, so this is just unitCost * qty. When cost
  // scaling is on, each additional unit within the batch is priced at the
  // next step of the compounding curve - a geometric series sum, not a
  // flat multiply.
  buildingCostForQty(buildingId, qty) {
    const def = Game.data.buildingsById[buildingId];
    const count = Game.state.buildings[buildingId] || 0;
    const costMult = Game.effects.getMult('cost_all') * Game.effects.getMult('cost:' + buildingId) * Game.dev.costMultiplier;
    const cost = {};
    for (const resId in def.baseCost) {
      let scaledUnits;
      if (Game.dev.costScalingEnabled && def.costScale !== 1) {
        const g = def.costScale;
        scaledUnits = Math.pow(g, count) * (Math.pow(g, qty) - 1) / (g - 1);
      } else {
        scaledUnits = qty;
      }
      cost[resId] = def.baseCost[resId] * scaledUnits * costMult;
    }
    return cost;
  },

  // Generic gate checker, shared by buildings and upgrades: a `requires`
  // array is a list of { type: 'upgrade'|'building', id, count? } entries,
  // every one of which must hold. Used directly for an upgrade's own
  // `requires` (e.g. "own 100 AI Research Engineers"), and wrapped by
  // meetsRequirements/meetsHardRequirements below for buildings.
  meetsRequirementsList(list) {
    if (!list) return true;
    return list.every((req) => {
      if (req.type === 'upgrade') return !!Game.state.upgrades[req.id];
      if (req.type === 'building') return (Game.state.buildings[req.id] || 0) >= (req.count || 1);
      return true;
    });
  },

  // Checks a building's `requires` array (upgrade purchased / other building
  // owned in sufficient count), beyond the era gate. True if there's nothing
  // to check. `list` defaults to def.requires but can be overridden (see
  // meetsHardRequirements) to check a different gate array against the
  // same upgrade/building-ownership logic.
  meetsRequirements(buildingId, list) {
    const def = Game.data.buildingsById[buildingId];
    return this.meetsRequirementsList(list || def.requires);
  },

  // hardRequires is a second, independent gate from `requires`: unlike
  // `requires` (which a blockOnRequirementFail building can fail while
  // staying visible-but-locked, see render.js), failing hardRequires
  // always hides the card outright - no popup, it just isn't offered yet.
  // Used for the land-site chain (data/buildings.js) so a bigger site
  // isn't even shown until you've actually built the smaller one, on top
  // of - not instead of - the political permit gate.
  meetsHardRequirements(buildingId) {
    const def = Game.data.buildingsById[buildingId];
    if (!def.hardRequires) return true;
    return this.meetsRequirements(buildingId, def.hardRequires);
  },

  canBuyBuilding(buildingId) {
    return this.canBuyBuildingQty(buildingId, 1);
  },

  canBuyBuildingQty(buildingId, qty) {
    const def = Game.data.buildingsById[buildingId];
    if (!this.meetsHardRequirements(buildingId)) return false;
    if (!this.meetsRequirements(buildingId)) return false;
    const owned = Game.state.buildings[buildingId] || 0;
    if (def.maxOwned !== undefined && owned + qty > def.maxOwned) return false;
    if (def.maxCount) {
      const limit = (Game.state.buildings[def.maxCount.buildingId] || 0) * (def.maxCount.per || 1);
      if (owned + qty > limit) return false;
    }
    const cost = this.buildingCostForQty(buildingId, qty);
    if (!Game.state_helpers.canAfford(cost)) return false;
    if (def.land && Game.state_helpers.landAvailable() < def.land * qty) return false;
    return true;
  },

  // What the Buy button's `disabled` state should be. Normally identical
  // to !canBuyBuilding, except a blockOnRequirementFail building stays
  // enabled while its requirements aren't met, so clicking it can still
  // fire the one-time blocked-purchase popup (see render.js) instead of
  // the button just doing nothing.
  buildingButtonDisabled(buildingId) {
    const def = Game.data.buildingsById[buildingId];
    if (def.blockOnRequirementFail && !this.meetsRequirements(buildingId)) return false;
    return !this.canBuyBuilding(buildingId);
  },

  buyBuilding(buildingId) {
    return this.buyBuildingQty(buildingId, 1);
  },

  buyBuildingQty(buildingId, qty) {
    if (!this.canBuyBuildingQty(buildingId, qty)) return false;
    const def = Game.data.buildingsById[buildingId];
    const cost = this.buildingCostForQty(buildingId, qty);
    Game.state_helpers.spend(cost);
    Game.state.resources.land.used += (def.land || 0) * qty;
    Game.state.buildings[buildingId] = (Game.state.buildings[buildingId] || 0) + qty;
    Game.state_helpers.recalcLandCap();
    if (def.payout) {
      for (const resId in def.payout) Game.state_helpers.add(resId, def.payout[resId] * qty);
    }
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
    const def = Game.data.upgradesById[upgradeId];
    if (Game.state.upgrades[upgradeId]) return false;
    if (def.requiresUpgrade && !Game.state.upgrades[def.requiresUpgrade]) return false;
    if (!this.meetsRequirementsList(def.requires)) return false;
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

  // --- minimizing tiles ---
  // Lets the player collapse a card they no longer care about out of the
  // main catalog view (see render.js's "Show hidden" toggle to bring them
  // back). Purely a display preference - has no effect on ownership,
  // production, or affordability.
  hideTile(id) {
    Game.state.hiddenTiles[id] = true;
  },

  unhideTile(id) {
    delete Game.state.hiddenTiles[id];
  },
};
