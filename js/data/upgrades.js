window.Game = window.Game || {};
Game.data = Game.data || {};

// One-time purchases that apply a permanent multiplier/adder. `effects`
// entries are read generically by core/effects.js:
//   { type: 'mult', target: '<key>', value: 1.5 }  -> multiplies stat by 1.5
//   { type: 'add',  target: '<key>', value: 2 }    -> adds 2 to stat
//
// Recognized target keys (see engine.js / actions.js for where each is read):
//   click_money        multiplier on the "Freelance Gig" click
//   influence_gain      multiplier on all influence gains (buildings + click)
//   produce_all         multiplier on every building's non-electricity output
//   produce:<buildingId> multiplier on one building's non-electricity output
//   consume_all          multiplier on every building's electricity draw
//   consume:<buildingId>  multiplier on one building's electricity draw
//   cost_all              multiplier on every building's purchase cost
//   cost:<buildingId>      multiplier on one building's purchase cost
//   sell_price              multiplier on the token sell price (Auto-Convert)
//   train_ratio              multiplier on the token->research points ratio (Auto-Convert)
//   land_cap (add only)       flat bonus to land cap
Game.data.upgrades = [
  {
    id: 'mech_keyboard',
    name: 'Mechanical Keyboard',
    icon: '⌨️',
    era: 'era1',
    flavor: 'Clicky switches, questionable productivity gains.',
    cost: { money: 100 },
    effects: [{ type: 'mult', target: 'click_money', value: 2 }],
  },
  {
    id: 'overclock_guide_1',
    name: 'Overclocking Forum Guide',
    icon: '📈',
    era: 'era1',
    flavor: 'A 200-reply thread from 2013 that still slaps.',
    cost: { money: 300 },
    effects: [{ type: 'mult', target: 'produce:gpu_gaming', value: 1.5 }],
  },
  {
    id: 'efficient_psu',
    name: '80+ Gold PSUs',
    icon: '🔋',
    era: 'era2',
    flavor: 'Fewer watts wasted as heat, more watts wasted on GPUs.',
    cost: { money: 500 },
    effects: [{ type: 'mult', target: 'consume_all', value: 0.8 }],
  },
  {
    id: 'bulk_gpu_deal',
    name: 'Bulk GPU Deal',
    icon: '📦',
    era: 'era2',
    flavor: 'You know a guy who knows a guy at a mining warehouse liquidation.',
    cost: { money: 800 },
    effects: [{ type: 'mult', target: 'cost:gpu_rack', value: 0.85 }],
  },
  {
    id: 'campaign_donation',
    name: 'Campaign Donations',
    icon: '💰',
    era: 'era3',
    flavor: 'Democracy: now with a suggested donation amount.',
    cost: { money: 1500, influence: 5 },
    effects: [{ type: 'mult', target: 'influence_gain', value: 1.5 }],
  },
  {
    id: 'data_broker_deal',
    name: 'Data Broker Contract',
    icon: '🤝',
    era: 'era3',
    flavor: 'Turns out your tokens sell for more than you thought.',
    cost: { tokens: 20000 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.5 }],
  },
  {
    id: 'tax_break',
    name: 'Corporate Tax Break',
    icon: '🧾',
    era: 'era4',
    flavor: 'Somehow, legally, you now pay less than a small business.',
    cost: { influence: 30 },
    effects: [{ type: 'mult', target: 'cost_all', value: 0.9 }],
  },
  {
    id: 'research_partnership',
    name: 'University Research Partnership',
    icon: '🎓',
    era: 'era4',
    flavor: 'Grad students, but make it corporate-sponsored.',
    cost: { reputation: 20, money: 5000 },
    effects: [{ type: 'mult', target: 'train_ratio', value: 2 }],
  },
];

Game.data.upgradesById = {};
Game.data.upgrades.forEach((u) => { Game.data.upgradesById[u.id] = u; });
