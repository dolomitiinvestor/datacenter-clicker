window.Game = window.Game || {};
Game.data = Game.data || {};

// One-time purchases that apply a permanent multiplier/adder. `effects`
// entries are read generically by core/effects.js:
//   { type: 'mult', target: '<key>', value: 1.5 }  -> multiplies stat by 1.5
//   { type: 'add',  target: '<key>', value: 2 }    -> adds 2 to stat
//
// category: 'compute' | 'buildings' | 'research' | 'regulatory' | 'upgrades'
//           which catalog column it's rendered in (see render.js
//           renderCatalog) - shared with buildings, grouped by this field
//           rather than by data source, so e.g. Train New Model shows up
//           in the Research column next to Publish arXiv Paper.
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
//   software_job_salary (add only) flat $/yr bonus to the Software Job salary
Game.data.upgrades = [
  {
    id: 'mech_keyboard',
    name: 'Mechanical Keyboard',
    icon: '⌨️',
    era: 'era1',
    category: 'upgrades',
    flavor: 'Types clean commits at 3am. Your next performance review notices.',
    cost: { money: 100 },
    effects: [{ type: 'add', target: 'software_job_salary', value: 10000 }], // $100k -> $110k/yr
  },
  {
    id: 'data_broker_deal',
    name: 'Data Broker Contract',
    icon: '🤝',
    era: 'era3',
    category: 'upgrades',
    flavor: 'Turns out your tokens sell for more than you thought.',
    cost: { tokens: 20000 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.5 }],
  },

  // --- Research chain: each tier is a newer frontier model, following the
  // real cadence of major-lab releases (loosely - the calendar in this
  // game starts the same month ChatGPT shipped). Costs scale hard on
  // purpose; each is a much bigger production boost than the last.
  {
    id: 'train_new_model',
    name: 'Train New Model: GPT-4 Class',
    icon: '🧬',
    era: 'era3',
    category: 'research',
    flavor: "Fine-tuned on your own exhaust data. Somehow it's better.",
    cost: { reputation: 30 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.5 }],
  },
  {
    id: 'train_new_model_2',
    name: 'Train New Model: Claude 3 Class',
    icon: '🧬',
    era: 'era3',
    category: 'research',
    flavor: 'Constitutional AI, or your closest approximation of it on a Tuesday deadline.',
    cost: { reputation: 100 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.5 }],
  },
  {
    id: 'train_new_model_3',
    name: 'Train New Model: Gemini Class',
    icon: '🧬',
    era: 'era4',
    category: 'research',
    flavor: 'Multimodal from the ground up. Your infra was not built with this in mind.',
    cost: { reputation: 300 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.75 }],
  },
  {
    id: 'train_new_model_4',
    name: 'Train New Model: Llama Class',
    icon: '🧬',
    era: 'era4',
    category: 'research',
    flavor: 'Open weights. Everyone downloads it, including your competitors.',
    cost: { reputation: 800 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.75 }],
  },
  {
    id: 'train_new_model_5',
    name: 'Train New Model: Frontier Reasoning Class',
    icon: '🧬',
    era: 'era5',
    category: 'research',
    flavor: 'It thinks before it answers. Inference costs 10x, quality goes up, everyone acts surprised.',
    cost: { reputation: 2000 },
    effects: [{ type: 'mult', target: 'produce_all', value: 2 }],
  },
  {
    id: 'research_partnership',
    name: 'University Research Partnership',
    icon: '🎓',
    era: 'era4',
    category: 'research',
    flavor: 'Grad students, but make it corporate-sponsored.',
    cost: { reputation: 20, money: 5000 },
    effects: [{ type: 'mult', target: 'train_ratio', value: 2 }],
  },

  // --- Regulatory / political. incorporate_business and campaign_donation
  // are early gates; the permit_* chain (era5) gates the gigawatt-class
  // land sites in data/buildings.js.
  {
    id: 'incorporate_business',
    name: 'Incorporate a Business',
    icon: '⚖️',
    era: 'era2',
    category: 'regulatory',
    flavor: "An LLC in Delaware. Now you're a real company - landlords, banks, and lawyers will actually talk to you.",
    cost: { money: 500 },
    effects: [], // pure gate flag - checked via requires: [{ type: 'upgrade', id: 'incorporate_business' }] on buildings like Warehouse Lease
  },
  {
    id: 'campaign_donation',
    name: 'Campaign Donations',
    icon: '💰',
    era: 'era3',
    category: 'regulatory',
    flavor: 'Democracy: now with a suggested donation amount.',
    cost: { money: 1500, influence: 5 },
    effects: [{ type: 'mult', target: 'influence_gain', value: 1.5 }],
  },
  {
    id: 'tax_break',
    name: 'Corporate Tax Break',
    icon: '🧾',
    era: 'era4',
    category: 'regulatory',
    flavor: 'Somehow, legally, you now pay less than a small business.',
    cost: { influence: 30 },
    effects: [{ type: 'mult', target: 'cost_all', value: 0.9 }],
  },
  {
    id: 'permit_city_planning',
    name: 'City Planning Approval',
    icon: '🏙️',
    era: 'era5',
    category: 'regulatory',
    flavor: 'A rezoning application, a public comment period, and a lot of donuts at the hearing.',
    cost: { money: 50000, influence: 30 },
    effects: [],
  },
  {
    id: 'permit_state_puc',
    name: 'State PUC Approval',
    icon: '🗳️',
    era: 'era5',
    category: 'regulatory',
    flavor: 'The state Public Utilities Commission signs off on your interconnection request.',
    cost: { money: 500000, influence: 100 },
    effects: [],
  },
  {
    id: 'permit_federal_review',
    name: 'Federal Environmental Review',
    icon: '📋',
    era: 'era5',
    category: 'regulatory',
    flavor: 'An environmental impact statement, several consultants, and eighteen months you don\'t get back.',
    cost: { money: 5000000, influence: 300 },
    effects: [],
  },
  {
    id: 'permit_national_interest',
    name: 'National Interest Energy Waiver',
    icon: '🦅',
    era: 'era5',
    category: 'regulatory',
    flavor: 'A gigawatt of demand gets you a seat at a much bigger table.',
    cost: { money: 50000000, influence: 1000 },
    effects: [],
  },
  {
    id: 'permit_global_accord',
    name: 'Global Compute Accord Waiver',
    icon: '🌐',
    era: 'era5',
    category: 'regulatory',
    flavor: 'Ten gigawatts is a treaty-level number. This is a treaty-level waiver.',
    cost: { money: 500000000, influence: 3000 },
    effects: [],
  },
];

Game.data.upgradesById = {};
Game.data.upgrades.forEach((u) => { Game.data.upgradesById[u.id] = u; });
