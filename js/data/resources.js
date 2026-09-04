window.Game = window.Game || {};
Game.data = Game.data || {};

// kind: 'stock'    -> accumulates over time, no inherent cap (money, compute, ...)
//       'capacity' -> has a cap + a used amount (land)
//       'flow'      -> recomputed fresh every tick, not carried over (electricity)
//
// unlockEra: resource is hidden from the UI until this era is unlocked.
// Adding a brand new resource later = add an entry here + reference it from
// buildings/upgrades/actions. Nothing else needs to know about it.
Game.data.resources = [
  { id: 'money', name: 'Cash', icon: '💵', symbol: '$', kind: 'stock', decimals: 2, unlockEra: null },
  { id: 'electricity', name: 'Electricity', icon: '⚡', symbol: 'kW', kind: 'flow', decimals: 2, unlockEra: null },
  { id: 'compute', name: 'Compute', icon: '🧠', symbol: 'FLOPS', kind: 'stock', decimals: 1, unlockEra: 'era1' },
  { id: 'land', name: 'Land', icon: '🗺️', symbol: 'plots', kind: 'capacity', decimals: 0, unlockEra: 'era2' },
  { id: 'influence', name: 'Influence', icon: '🏛️', symbol: 'pts', kind: 'stock', decimals: 0, unlockEra: 'era3' },
  { id: 'reputation', name: 'Reputation', icon: '⭐', symbol: 'pts', kind: 'stock', decimals: 0, unlockEra: 'era3' },
];

Game.data.resourcesById = {};
Game.data.resources.forEach((r) => { Game.data.resourcesById[r.id] = r; });
