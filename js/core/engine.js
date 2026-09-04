window.Game = window.Game || {};

Game.engine = {
  // Advances the simulation by dtSeconds. Called by the tick loop in main.js.
  tick(dtSeconds) {
    this._runTime(dtSeconds);
    this._runElectricity(dtSeconds);
    this._runElectricityBilling(dtSeconds);
    this._runProduction(dtSeconds);
    this._runComputeConversion();
    this.checkEras();
  },

  // The in-game clock. Runs in hours so it can double as the basis for
  // time-based costs (electricity billing, and anything added later).
  // It advances by whatever dtSeconds the caller passes in, so it speeds
  // up along with dev mode's speed multiplier.
  _runTime(dtSeconds) {
    Game.state.time.hours += dtSeconds / 3600;
  },

  // Electricity is a flow, not a stockpile: every tick we recompute total
  // generation vs total draw. If draw exceeds generation, every
  // electricity-consuming building is throttled proportionally (brownout)
  // instead of the game halting outright.
  _runElectricity() {
    let generated = Game.config.baseFreeElectricity;
    let consumed = 0;

    Game.data.buildings.forEach((b) => {
      const count = Game.state.buildings[b.id] || 0;
      if (!count) return;
      if (b.produces && b.produces.electricity) {
        generated += b.produces.electricity * count * Game.effects.getMult('produce:' + b.id) * Game.effects.getMult('produce_all');
      }
      if (b.consumes && b.consumes.electricity) {
        consumed += b.consumes.electricity * count * Game.effects.getMult('consume:' + b.id) * Game.effects.getMult('consume_all');
      }
    });

    const throttle = consumed > 0 ? Math.min(1, generated / consumed) : 1;
    const elec = Game.state.resources.electricity;
    elec.generated = generated;
    elec.consumed = Math.min(generated, consumed);
    elec.throttle = throttle;
  },

  // Actually-drawn kW is billed like a real utility bill: kWh = kW * hours.
  // Unused generation capacity is free - you only pay for what you draw.
  _runElectricityBilling(dtSeconds) {
    const elec = Game.state.resources.electricity;
    const hours = dtSeconds / 3600;
    const cost = elec.consumed * hours * Game.config.electricityPricePerKwh;
    elec.billPerHour = elec.consumed * Game.config.electricityPricePerKwh;
    if (cost <= 0) return;
    Game.state_helpers.add('money', -cost);
    Game.state.stats.totalElectricityCost += cost;
  },

  _runProduction(dtSeconds) {
    const throttle = Game.state.resources.electricity.throttle;
    const rates = {}; // resourceId -> current FLOPS/$/etc per second, for display

    Game.data.buildings.forEach((b) => {
      const count = Game.state.buildings[b.id] || 0;
      if (!count || !b.produces) return;

      const needsElectricity = !!(b.consumes && b.consumes.electricity);
      const rateMult = Game.effects.getMult('produce:' + b.id) * Game.effects.getMult('produce_all');

      for (const resId in b.produces) {
        if (resId === 'electricity') continue; // handled in _runElectricity
        let rate = b.produces[resId] * count * rateMult;
        if (needsElectricity) rate *= throttle;
        rates[resId] = (rates[resId] || 0) + rate;

        const amount = rate * dtSeconds;
        Game.state_helpers.add(resId, amount);

        if (resId === 'money') Game.state.stats.totalMoneyEarned += amount;
        if (resId === 'compute') Game.state.stats.totalComputeMade += amount;
      }
    });

    for (const resId in rates) {
      const res = Game.state.resources[resId];
      if (res) res.perSecond = rates[resId];
    }
  },

  // While auto-convert is on, compute is drained every tick instead of
  // piling up, split between cash and reputation by trainAllocationPct
  // (0 = all sold, 100 = all trained, anything between splits both ways).
  _runComputeConversion() {
    const compute = Game.state.resources.compute;
    if (compute.amount <= 0 || !Game.state.autoConvertEnabled) return;

    const trainFrac = Game.state.trainAllocationPct / 100;
    const sellFrac = 1 - trainFrac;

    const sellAmount = compute.amount * sellFrac;
    const trainAmount = compute.amount * trainFrac;

    if (sellAmount > 0) {
      const price = 0.5 * Game.effects.getMult('sell_price');
      const earned = sellAmount * price;
      Game.state_helpers.add('money', earned);
      Game.state.stats.totalMoneyEarned += earned;
    }
    if (trainAmount > 0) {
      const ratio = 0.1 * Game.effects.getMult('train_ratio');
      Game.state_helpers.add('reputation', trainAmount * ratio);
    }

    compute.amount -= sellAmount + trainAmount;
  },

  checkEras() {
    Game.data.eras.forEach((era) => {
      if (Game.state.erasUnlocked[era.id]) return;
      if (era.check(Game.state)) {
        Game.state.erasUnlocked[era.id] = true;
        Game.state_helpers.logEvent('New era: ' + era.name + ' — ' + era.flavor);
      }
    });
  },
};
