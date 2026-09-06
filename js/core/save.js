window.Game = window.Game || {};

Game.save = {
  save() {
    try {
      localStorage.setItem(Game.config.saveKey, JSON.stringify(Game.state));
    } catch (e) {
      console.error('Save failed', e);
    }
  },

  load() {
    let loaded = null;
    try {
      const raw = localStorage.getItem(Game.config.saveKey);
      if (raw) loaded = JSON.parse(raw);
    } catch (e) {
      console.error('Save data corrupt, starting fresh', e);
    }

    const fresh = Game.stateFactory.fresh();
    if (!loaded) {
      Game.state = fresh;
      return;
    }

    // Merge onto a fresh state so new resources/buildings/upgrades/eras
    // added after this save was made show up with sane defaults instead
    // of crashing the UI.
    Game.state = fresh;
    Object.assign(Game.state.buildings, loaded.buildings || {});
    Object.assign(Game.state.upgrades, loaded.upgrades || {});
    Object.assign(Game.state.erasUnlocked, loaded.erasUnlocked || {});
    Object.assign(Game.state.stats, loaded.stats || {});
    Object.assign(Game.state.time, loaded.time || {});
    if (typeof loaded.clockSpeedMultiplier === 'number') Game.state.clockSpeedMultiplier = loaded.clockSpeedMultiplier;
    if (typeof loaded.electricityPricePerKwh === 'number') Game.state.electricityPricePerKwh = loaded.electricityPricePerKwh;
    if (typeof loaded.tokensPricePerMillion === 'number') Game.state.tokensPricePerMillion = loaded.tokensPricePerMillion;
    Object.assign(Game.state.freelance, loaded.freelance || {});
    Game.state.softwareJobEnabled = !!loaded.softwareJobEnabled;
    Object.assign(Game.state.seenAlerts, loaded.seenAlerts || {});
    Object.assign(Game.state.hiddenTiles, loaded.hiddenTiles || {});
    Game.state.autoConvertEnabled = !!loaded.autoConvertEnabled;
    if (typeof loaded.trainAllocationPct === 'number') Game.state.trainAllocationPct = loaded.trainAllocationPct;
    Game.state.log = loaded.log || [];

    if (loaded.resources) {
      for (const resId in loaded.resources) {
        if (!Game.state.resources[resId]) continue;
        Object.assign(Game.state.resources[resId], loaded.resources[resId]);
      }
    }

    Game.state_helpers.recalcLandCap();
  },

  exportString() {
    return btoa(unescape(encodeURIComponent(JSON.stringify(Game.state))));
  },

  importString(str) {
    try {
      const json = decodeURIComponent(escape(atob(str.trim())));
      const loaded = JSON.parse(json);
      localStorage.setItem(Game.config.saveKey, JSON.stringify(loaded));
      this.load();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  hardReset() {
    localStorage.removeItem(Game.config.saveKey);
    Game.state = Game.stateFactory.fresh();
  },
};
