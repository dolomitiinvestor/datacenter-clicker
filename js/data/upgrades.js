window.Game = window.Game || {};
Game.data = Game.data || {};

// One-time purchases that apply a permanent multiplier/adder. `effects`
// entries are read generically by core/effects.js:
//   { type: 'mult', target: '<key>', value: 1.5 }  -> multiplies stat by 1.5
//   { type: 'add',  target: '<key>', value: 2 }    -> adds 2 to stat
//
// category: 'compute' | 'buildings' | 'research' | 'regulatory' | 'company' | 'upgrades'
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
    era: 'era4', // a midgame stepping stone toward outright buying a school (below) - its old 20k RP price was laughably cheap next to same-era Train New Model tiers costing 1M+ RP
    category: 'research',
    flavor: "Grad students, but make it corporate-sponsored - a partnership, not a hostile takeover. That comes later.",
    cost: { reputation: 1500000, money: 250000 },
    effects: [{ type: 'mult', target: 'train_ratio', value: 2 }],
  },

  // --- Buy the whole university. A partnership rents grad students; this
  // buys the endowment, the faculty, and the naming rights outright. Bought
  // strictly in order (requiresUpgrade) - you don't get offered Stanford
  // until you've already closed on Georgia Tech, Berkeley, and CMU.
  {
    id: 'buy_georgia_tech',
    name: 'Buy Georgia Tech',
    icon: '🎓',
    era: 'era5',
    category: 'research',
    flavor: 'The whole College of Computing, plus a very confused Yellow Jacket mascot, now reports to you.',
    cost: { money: 5000000000 },
    effects: [{ type: 'mult', target: 'train_ratio', value: 1.15 }],
  },
  {
    id: 'buy_uc_berkeley',
    name: 'Buy UC Berkeley',
    icon: '🎓',
    era: 'era5',
    category: 'research',
    flavor: 'The state legislature is furious. The AI lab is now a wholly-owned subsidiary.',
    cost: { money: 10000000000 },
    effects: [{ type: 'mult', target: 'train_ratio', value: 1.2 }],
    requiresUpgrade: 'buy_georgia_tech',
  },
  {
    id: 'buy_carnegie_mellon',
    name: 'Buy Carnegie Mellon University',
    icon: '🎓',
    era: 'era5',
    category: 'research',
    flavor: 'The robotics department alone was worth the sticker price. The rest of the campus came free with it.',
    cost: { money: 20000000000 },
    effects: [{ type: 'mult', target: 'train_ratio', value: 1.25 }],
    requiresUpgrade: 'buy_uc_berkeley',
  },
  {
    id: 'buy_mit',
    name: 'Buy MIT',
    icon: '🎓',
    era: 'era5',
    category: 'research',
    flavor: "CSAIL's entire org chart now has your logo on its slide deck.",
    cost: { money: 50000000000 },
    effects: [{ type: 'mult', target: 'train_ratio', value: 1.3 }],
    requiresUpgrade: 'buy_carnegie_mellon',
  },
  {
    id: 'buy_stanford',
    name: 'Buy Stanford',
    icon: '🎓',
    era: 'era5',
    category: 'research',
    flavor: "You didn't just hire the founders. You bought the building they dropped out of.",
    cost: { money: 100000000000 },
    effects: [{ type: 'mult', target: 'train_ratio', value: 1.4 }],
    requiresUpgrade: 'buy_mit',
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
    era: 'era5', // moved much later - this is "an army of lobbyists rewrites the tax code," not a first-year LLC perk
    category: 'regulatory',
    flavor: "You didn't find a loophole. You paid to have one written.",
    cost: { influence: 1000, money: 10000000 },
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

  // --- Company building: the org chart, not the org's servers. Each is a
  // one-time hire/policy/perk with a permanent, generically modest effect -
  // no single one is a game-changer, they're meant to stack.
  {
    id: 'hire_employee_intern',
    name: 'Hire Employee #1: The Intern',
    icon: '🧑‍💻',
    era: 'era2',
    category: 'company',
    flavor: "Someone to babysit the laptops so you don't have to tab back every 20 minutes.",
    cost: { money: 3000 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.05 }],
  },
  {
    id: 'free_snacks',
    name: 'Free Snacks & Kombucha',
    icon: '🍪',
    era: 'era2',
    category: 'company',
    flavor: 'Morale is up. So, mysteriously, is gig throughput.',
    cost: { money: 2000 },
    effects: [{ type: 'mult', target: 'click_money', value: 1.2 }],
  },
  {
    id: 'company_handbook',
    name: 'Write a Company Handbook',
    icon: '📘',
    era: 'era3',
    category: 'company',
    flavor: 'Forty pages on PTO policy nobody reads, but now HR exists and raises need a paper trail.',
    cost: { money: 5000 },
    effects: [{ type: 'add', target: 'software_job_salary', value: 5000 }],
  },
  {
    id: 'hire_ops_manager',
    name: 'Hire an Ops Manager',
    icon: '📋',
    era: 'era3',
    category: 'company',
    flavor: 'Negotiates every vendor contract you sign from now on. Ruthlessly.',
    cost: { money: 15000 },
    effects: [{ type: 'mult', target: 'cost_all', value: 0.95 }],
  },
  {
    id: 'marketing_plan',
    name: 'Marketing Plan: Content Blitz',
    icon: '📣',
    era: 'era3',
    category: 'company',
    flavor: 'A blog post, a Twitter thread, and a suspiciously well-timed Hacker News post drive real demand for your tokens.',
    cost: { money: 20000 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.25 }],
  },
  {
    id: 'employee_stock_options',
    name: 'Employee Stock Options',
    icon: '📈',
    era: 'era4',
    category: 'company',
    flavor: 'Pay people in paper instead of cash. They believe in the mission. Mostly.',
    cost: { money: 50000 },
    effects: [{ type: 'mult', target: 'cost_all', value: 0.9 }],
  },
  {
    id: 'hire_sales_team',
    name: 'Hire a Sales Team',
    icon: '🤝',
    era: 'era4',
    category: 'company',
    flavor: 'Quota-carrying reps who can sell tokens to a company that already makes its own.',
    cost: { money: 100000, influence: 10 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.5 }],
  },
  {
    id: 'hire_cfo',
    name: 'Hire a CFO',
    icon: '💼',
    era: 'era5',
    category: 'company',
    flavor: 'Restructures every contract in the building. The lawyers bill more, everything else costs less.',
    cost: { money: 2000000, influence: 50 },
    effects: [{ type: 'mult', target: 'cost_all', value: 0.85 }],
  },
];

Game.data.upgradesById = {};
Game.data.upgrades.forEach((u) => { Game.data.upgradesById[u.id] = u; });
