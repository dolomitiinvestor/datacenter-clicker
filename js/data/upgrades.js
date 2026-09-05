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
// requiresUpgrade: optional upgradeId that must already be owned before this
//           one is buyable or even shown - see actions.canBuyUpgrade and
//           render.js renderCatalog's visibleUpgrades filter. Used to force
//           the Train New Model chain to be bought strictly in order.
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

  // --- Research chain: each tier is a real (or near-future) frontier model
  // release, in roughly chronological order, starting from the actual
  // pre-ChatGPT era (GPT-1/BERT/GPT-2/GPT-3) through to purely speculative
  // future tiers. Each tier requires the previous one to already be owned
  // (requiresUpgrade - see canBuyUpgrade/renderCatalog), so the chain can
  // only be bought in order. Cost is base * COST_GROWTH^index - Research
  // Points were massively miscaled at the old flat prices, so this whole
  // chain runs ~1000x higher than the original 5-tier version.
  ...(function () {
    const CHAIN = [
      { name: 'GPT-1 (117M Parameters)', era: 'era3' },
      { name: 'BERT (340M Parameters)', era: 'era3' },
      { name: 'GPT-2 (1.5B Parameters)', era: 'era3' },
      { name: 'GPT-3 (175B Parameters)', era: 'era3' },
      { name: 'ChatGPT', era: 'era3' },
      { name: 'LLaMA', era: 'era3' },
      { name: 'GPT-4', era: 'era3' },
      { name: 'Claude 1', era: 'era3' },
      { name: 'Claude 2', era: 'era3' },
      { name: 'Mistral 7B', era: 'era3' },
      { name: 'Gemini 1.0', era: 'era4' },
      { name: 'Claude 3 Opus', era: 'era4' },
      { name: 'GPT-4o', era: 'era4' },
      { name: 'Claude 3.5 Sonnet', era: 'era4' },
      { name: 'DeepSeek V3', era: 'era4' },
      { name: 'Claude Code', era: 'era4' },
      { name: 'GPT-4.5', era: 'era4' },
      { name: 'Claude Opus 4', era: 'era4' },
      { name: 'GPT-5', era: 'era4' },
      { name: 'GPT-5.1', era: 'era4' },
      { name: 'Claude Opus 4.5', era: 'era5' },
      { name: 'Claude Mythos', era: 'era5' },
      { name: 'GPT-5.5', era: 'era5' },
      { name: 'Claude Opus 4.8', era: 'era5' },
      { name: 'Claude Opus 5', era: 'era5' },
      { name: 'Claude Fable', era: 'era5' },
      { name: 'GPT-6 Astra', era: 'era5' },
      { name: 'Claude Kingdom', era: 'era5' },
      { name: 'GPT-7', era: 'era5' },
      { name: 'Claude Poseidon', era: 'era5' },
      { name: 'GPT-8.2', era: 'era5' },
      { name: 'Claude Renaissance', era: 'era5' },
      { name: 'GPT-9', era: 'era5' },
      { name: 'Claude OpenSky', era: 'era5' },
      { name: 'GPT-10', era: 'era5' },
      { name: 'Claude Space', era: 'era5' },
      { name: 'GPT-11', era: 'era5' },
      { name: 'Claude Milky Way', era: 'era5' },
      { name: 'GPT-12', era: 'era5' },
      { name: 'Claude Big Bang', era: 'era5' },
      { name: 'GPT-13', era: 'era5' },
      { name: 'Claude Hades', era: 'era5' },
    ];
    const BASE_COST = 30000; // 30 RP * 1000
    const COST_GROWTH = 1.45;
    const PRODUCE_MULT = 1.12; // per-tier produce_all multiplier - compounds hugely over 42 tiers

    return CHAIN.map((m, i) => ({
      id: 'train_new_model_' + (i + 1),
      name: 'Train New Model: ' + m.name,
      icon: '🧬',
      era: m.era,
      category: 'research',
      flavor: 'Frontier model release #' + (i + 1) + '. Somehow the infra bill is always the surprise.',
      cost: { reputation: Math.round(BASE_COST * Math.pow(COST_GROWTH, i)) },
      effects: [{ type: 'mult', target: 'produce_all', value: PRODUCE_MULT }],
      requiresUpgrade: i > 0 ? 'train_new_model_' + i : null,
    }));
  })(),
  {
    id: 'research_partnership',
    name: 'University Research Partnership',
    icon: '🎓',
    era: 'era4',
    category: 'research',
    flavor: 'Grad students, but make it corporate-sponsored.',
    cost: { reputation: 20000, money: 5000 }, // reputation leg raised 1000x along with the rest of the research-points economy
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
