window.Game = window.Game || {};

// Reads purchased-upgrade effects generically by target key. Nothing in
// here knows what any specific upgrade does - see data/upgrades.js for
// the list of recognized keys.
Game.effects = {
  getMult(target) {
    let m = 1;
    for (const upId in Game.state.upgrades) {
      const up = Game.data.upgradesById[upId];
      if (!up) continue;
      (up.effects || []).forEach((eff) => {
        if (eff.type === 'mult' && eff.target === target) m *= eff.value;
      });
    }
    return m;
  },

  getAdd(target) {
    let a = 0;
    for (const upId in Game.state.upgrades) {
      const up = Game.data.upgradesById[upId];
      if (!up) continue;
      (up.effects || []).forEach((eff) => {
        if (eff.type === 'add' && eff.target === target) a += eff.value;
      });
    }
    return a;
  },
};
