window.Game = window.Game || {};

// Number formatting helpers, kept separate so the display style can change
// later (e.g. scientific notation for very late game) without touching
// anything that calls it.
Game.format = {
  number(n, decimals) {
    if (decimals === undefined) decimals = 1;
    if (n === undefined || n === null || isNaN(n)) return '0';
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    if (abs < 1000) {
      const fixed = abs.toFixed(decimals);
      return sign + this._trimZeros(fixed);
    }
    const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    let value = abs;
    let unitIndex = -1;
    while (value >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }
    return sign + this._trimZeros(value.toFixed(2)) + units[unitIndex];
  },

  _trimZeros(str) {
    if (str.indexOf('.') === -1) return str;
    return str.replace(/0+$/, '').replace(/\.$/, '');
  },

  rate(n, decimals) {
    const v = this.number(n, decimals);
    return (n >= 0 ? '+' : '') + v;
  },

  // Full currency format, no compaction: $0,000.00 - always 2 decimals,
  // comma thousands separators, for every money amount in the UI.
  money(n) {
    if (n === undefined || n === null || isNaN(n)) n = 0;
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  // Same as money() but with 4 decimals instead of 2 - a per-second $ rate
  // is often a few tenths of a cent, which money()'s 2 decimals would just
  // round down to $0.00. Only for rate displays (e.g. net $/s); anything
  // that's an actual balance should still use money().
  moneyRate(n) {
    if (n === undefined || n === null || isNaN(n)) n = 0;
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    return sign + '$' + abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  },

  // Picks money vs compact-number formatting based on the resource's own
  // data definition (see data/resources.js `format` field), so callers
  // don't need to special-case resource ids themselves.
  resourceValue(resourceDef, amount) {
    if (resourceDef.format === 'currency') return this.money(amount);
    return this.number(amount, resourceDef.decimals);
  },

  // Turns elapsed in-game hours into a day count + calendar date/time,
  // anchored at Game.config.startDate. Displayed in the status bar and
  // usable as the basis for any future time-based cost/event.
  gameClock(hoursElapsed) {
    const daysPassed = Math.floor(hoursElapsed / 24);
    const date = new Date(Game.config.startDate + hoursElapsed * 3600 * 1000);
    const dateStr = date.toLocaleString('en-US', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    return { daysPassed, dateStr };
  },
};
