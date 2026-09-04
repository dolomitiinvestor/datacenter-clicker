window.Game = window.Game || {};
Game.data = Game.data || {};

// kind: 'stock'    -> accumulates over time, no inherent cap (money, tokens, ...)
//       'capacity' -> has a cap + a used amount (land)
//       'flow'      -> recomputed fresh every tick, not carried over (electricity)
//
// unlockEra: resource is hidden from the UI until this era is unlocked.
// format: 'currency' -> always rendered as $0,000.00 (see format.money),
//         never compacted to K/M/B. showRate: true -> the resource bar
//         also shows its current production rate (see engine _runProduction
//         and state.resources.<id>.perSecond). secondaryUnit: { label,
//         factor } -> a capacity resource also shows amount*factor in a
//         second unit alongside the primary one (see land: acres + sqft).
// Adding a brand new resource later = add an entry here + reference it from
// buildings/upgrades/actions. Nothing else needs to know about it.
Game.data.resources = [
  { id: 'money', name: 'Cash', icon: '💵', symbol: '$', kind: 'stock', decimals: 2, format: 'currency', unlockEra: null },
  { id: 'electricity', name: 'Electricity', icon: '⚡', symbol: 'kW', kind: 'flow', decimals: 2, unlockEra: null },
  { id: 'tokens', name: 'Tokens', icon: '🔤', symbol: 'tokens', kind: 'stock', decimals: 0, showRate: true, unlockEra: 'era1' },
  { id: 'land', name: 'Land', icon: '🗺️', symbol: 'acres', kind: 'capacity', decimals: 0, secondaryUnit: { label: 'sqft', factor: 43560 }, unlockEra: 'era2' },
  { id: 'influence', name: 'Influence', icon: '🏛️', symbol: 'pts', kind: 'stock', decimals: 0, unlockEra: 'era3' },
  { id: 'reputation', name: 'Research Points', icon: '⭐', symbol: 'RP', kind: 'stock', decimals: 0, unlockEra: 'era3' },
];

Game.data.resourcesById = {};
Game.data.resources.forEach((r) => { Game.data.resourcesById[r.id] = r; });
