window.Game = window.Game || {};

Game.state = null;

Game.stateFactory = {
  fresh() {
    const resources = {};
    Game.data.resources.forEach((r) => {
      if (r.kind === 'capacity') {
        resources[r.id] = { used: 0, cap: Game.config.baseLandCap };
      } else if (r.kind === 'flow') {
        resources[r.id] = { generated: 0, consumed: 0, throttle: 1 };
      } else {
        resources[r.id] = { amount: 0, perSecond: 0 };
      }
    });

    const buildings = {};
    Game.data.buildings.forEach((b) => { buildings[b.id] = 0; });

    return {
      resources,
      buildings,
      upgrades: {}, // upgradeId -> true once purchased
      erasUnlocked: { era1: true },
      time: { hours: 0 }, // elapsed in-game hours, ticks with dt (incl. dev speed) - the basis for time-based costs like electricity billing
      autoConvertEnabled: false, // compute -> money/reputation continuous conversion, split by trainAllocationPct
      trainAllocationPct: 50,    // 0 = all compute sold for cash, 100 = all compute trained into reputation
      log: [],
      stats: {
        totalMoneyEarned: 0,
        totalComputeMade: 0,
        totalClicks: 0,
        totalElectricityCost: 0,
        startedAt: Date.now(),
      },
    };
  },
};

// --- generic resource helpers, used by both engine and actions ---

Game.state_helpers = {
  add(resourceId, amount) {
    const res = Game.state.resources[resourceId];
    if (!res || !amount) return;
    res.amount += amount;
  },

  // Returns the current land cap (base + upgrades + buildings that grant it).
  recalcLandCap() {
    let cap = Game.config.baseLandCap;
    cap += Game.effects.getAdd('land_cap');
    Game.data.buildings.forEach((b) => {
      if (b.providesLandCap) {
        cap += b.providesLandCap * (Game.state.buildings[b.id] || 0);
      }
    });
    Game.state.resources.land.cap = cap;
  },

  landAvailable() {
    const land = Game.state.resources.land;
    return land.cap - land.used;
  },

  // cost: { resourceId: amount, ... } -> can the player currently afford it?
  canAfford(cost) {
    for (const resId in cost) {
      const res = Game.state.resources[resId];
      const have = res.amount !== undefined ? res.amount : 0;
      if (have < cost[resId]) return false;
    }
    return true;
  },

  spend(cost) {
    for (const resId in cost) {
      Game.state.resources[resId].amount -= cost[resId];
    }
  },

  logEvent(message) {
    Game.state.log.unshift({ message, at: Date.now() });
    if (Game.state.log.length > 50) Game.state.log.length = 50;
  },
};
