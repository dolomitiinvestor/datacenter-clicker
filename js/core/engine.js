window.Game = window.Game || {};

Game.engine = {
  // Advances the simulation by dtSeconds. Called by the tick loop in main.js.
  tick(dtSeconds) {
    this._runElectricity(dtSeconds);
    this._runProduction(dtSeconds);
    this.checkEras();
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

  _runProduction(dtSeconds) {
    const throttle = Game.state.resources.electricity.throttle;

    Game.data.buildings.forEach((b) => {
      const count = Game.state.buildings[b.id] || 0;
      if (!count || !b.produces) return;

      const needsElectricity = !!(b.consumes && b.consumes.electricity);
      const rateMult = Game.effects.getMult('produce:' + b.id) * Game.effects.getMult('produce_all');

      for (const resId in b.produces) {
        if (resId === 'electricity') continue; // handled in _runElectricity
        let amount = b.produces[resId] * count * dtSeconds * rateMult;
        if (needsElectricity) amount *= throttle;
        Game.state_helpers.add(resId, amount);

        if (resId === 'money') Game.state.stats.totalMoneyEarned += amount;
        if (resId === 'compute') Game.state.stats.totalComputeMade += amount;
      }
    });
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
