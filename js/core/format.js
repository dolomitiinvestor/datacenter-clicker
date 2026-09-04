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
};
