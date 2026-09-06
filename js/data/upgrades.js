window.Game = window.Game || {};
Game.data = Game.data || {};

// One-time purchases that apply a permanent multiplier/adder. `effects`
// entries are read generically by core/effects.js:
//   { type: 'mult', target: '<key>', value: 1.5 }  -> multiplies stat by 1.5
//   { type: 'add',  target: '<key>', value: 2 }    -> adds 2 to stat
//
// category: 'compute' | 'buildings' | 'research' | 'regulatory' | 'company' |
//           'quantum' | 'configurations' | 'upgrades'
//           which catalog column it's rendered in (see render.js
//           renderCatalog) - shared with buildings, grouped by this field
//           rather than by data source, so e.g. Train New Model shows up
//           in the Research column next to Publish arXiv Paper.
// requiresUpgrade: optional upgradeId that must already be owned before this
//           one is buyable or even shown - see actions.canBuyUpgrade and
//           render.js renderCatalog's visibleUpgrades filter. Used to force
//           the Train New Model chain to be bought strictly in order.
// requires: optional array of gates, same shape as a building's `requires`
//           ({type:'upgrade'|'building', id, count?}) - see
//           actions.meetsRequirementsList. Used for headcount gates, e.g.
//           Develop Quantum Computer requiring 100 AI Research Engineers.
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
    flavor: "Turns out your tokens sell for more than you thought - once there's an actual legal entity to sign the contract.",
    cost: { tokens: 20000 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.5 }],
    requiresUpgrade: 'incorporate_business',
  },
  {
    id: 'buy_ai_domain',
    name: "Buy the .ai Domain",
    icon: '🌐',
    era: 'era1',
    category: 'upgrades',
    flavor: "Anguilla's national budget thanks you personally.",
    cost: { money: 150 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.05 }],
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
  {
    id: 'develop_humanoid_robots',
    name: 'Develop Humanoid Robots',
    icon: '🤖',
    era: 'era5',
    category: 'research',
    flavor: "Five campuses' worth of robotics departments, mechanical engineers, and grad students who all had the same idea at once.",
    cost: { money: 100000000000 }, // $100B
    effects: [{ type: 'mult', target: 'produce_all', value: 2 }],
    requiresUpgrade: 'buy_stanford', // last link in the university chain - owning it implies all five are already bought
  },
  {
    id: 'develop_quantum_computer',
    name: 'Develop Quantum Computer',
    icon: '🌀',
    era: 'era5',
    category: 'research',
    flavor: "A hundred engineers, a decade of dead ends, and one afternoon where the error rate finally drops. Unlocks the Quantum tab - see Quantum.",
    cost: { money: 500000000000 }, // $500B
    effects: [], // pure gate flag - unlocks quantum_annealer/logical_qubit_array in data/buildings.js
    requires: [{ type: 'building', id: 'ai_research_engineer', count: 100 }], // needs the headcount, not just the cash
  },

  // --- Regulatory / political. incorporate_business is the first legal
  // gate - it unlocks Data Broker Contract and Campaign Donations below,
  // since neither makes sense for a sole proprietor; the permit_* chain
  // (era5) gates the gigawatt-class land sites in data/buildings.js.
  {
    id: 'incorporate_business',
    name: 'Incorporate a Business',
    icon: '⚖️',
    era: 'era2',
    category: 'regulatory',
    flavor: "An LLC in Delaware. Now you're a real company - landlords, banks, and lawyers will actually talk to you.",
    cost: { money: 500 },
    effects: [], // pure gate flag - checked via requiresUpgrade on data_broker_deal/campaign_donation above/below
  },
  {
    id: 'campaign_donation',
    name: 'Campaign Donations',
    icon: '💰',
    era: 'era3',
    category: 'regulatory',
    flavor: "Democracy: now with a suggested donation amount, and a corporate entity willing to write the check.",
    cost: { money: 1500, influence: 5 },
    effects: [{ type: 'mult', target: 'influence_gain', value: 1.5 }],
    requiresUpgrade: 'incorporate_business',
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
    id: 'patent_troll_insurance',
    name: 'Patent Troll Insurance',
    icon: '🛡️',
    era: 'era4',
    category: 'regulatory',
    flavor: "You're not being sued this quarter. That's the whole product.",
    cost: { money: 250000, influence: 20 },
    effects: [{ type: 'mult', target: 'cost_all', value: 0.95 }],
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
    id: 'emotional_support_succulent',
    name: 'Emotional Support Succulent',
    icon: '🪴',
    era: 'era1',
    category: 'company',
    flavor: 'Provides no calculable benefit. You keep it anyway.',
    cost: { money: 25 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.01 }],
  },
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
    id: 'aeron_chair',
    name: 'Aeron Chair',
    icon: '🪑',
    era: 'era2',
    category: 'company',
    flavor: 'Ergonomically perfect for eight more hours of gig-clicking than your back was ready for.',
    cost: { money: 1200 },
    effects: [{ type: 'mult', target: 'click_money', value: 1.1 }],
  },
  {
    id: 'rebrand_ai_company',
    name: "Rebrand as an \"AI Company\"",
    icon: '✨',
    era: 'era2',
    category: 'company',
    flavor: 'Nothing about the product changed. Everything about the pitch deck did.',
    cost: { money: 500 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.1 }],
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
    requiresUpgrade: 'hire_employee_intern', // nothing for an ops manager to manage without employee #1
  },
  {
    id: 'office_dog',
    name: 'Office Dog',
    icon: '🐕',
    era: 'era3',
    category: 'company',
    flavor: 'Karl has no equity, exceptional morale impact, and strong opinions about the thermostat.',
    cost: { money: 2000 },
    effects: [{ type: 'mult', target: 'influence_gain', value: 1.1 }],
    requiresUpgrade: 'hire_employee_intern', // someone has to walk him
  },
  {
    id: 'ping_pong_table',
    name: 'Ping Pong Table',
    icon: '🏓',
    era: 'era3',
    category: 'company',
    flavor: 'A Silicon Valley cliche, purchased unironically, that somehow does help morale.',
    cost: { money: 3000 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.05 }],
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
    requiresUpgrade: 'hire_employee_intern', // can't hand out equity with no headcount to hand it to
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
    requiresUpgrade: 'marketing_plan', // nothing to sell against without a brand first
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
    requiresUpgrade: 'employee_stock_options', // you don't get a CFO before the cap table exists
  },
  {
    id: 'create_autonomous_vehicles',
    name: 'Create Autonomous Vehicles',
    icon: '🚦',
    era: 'era5',
    category: 'company',
    flavor: "A new division, a new org chart, and a whole new way to turn cash into more cash while you sleep. Unlocks the autonomous truck & taxi fleet - see Buildings.",
    cost: { money: 10000000000 }, // $10B
    effects: [], // pure gate flag - checked via requires: [{ type: 'upgrade', id: 'create_autonomous_vehicles' }] on the fleet building in data/buildings.js
  },

  // --- Buy the entire company. Real market caps, snapshotted August 2026 -
  // obviously these move every trading day in reality, this is a one-time
  // game-balance snapshot, not a live feed. Bought strictly in ascending
  // order of price (requiresUpgrade), same pattern as the university chain.
  {
    id: 'buy_meta',
    name: 'Buy Meta Platforms',
    icon: '📱',
    era: 'era5',
    category: 'company',
    flavor: "The Like button, the metaverse, and Llama all report to you now. Zuck keeps an office, out of respect.",
    cost: { money: 1460000000000 }, // ~$1.46T, Aug 2026
    effects: [{ type: 'mult', target: 'sell_price', value: 1.15 }],
  },
  {
    id: 'buy_broadcom',
    name: 'Buy Broadcom',
    icon: '🔗',
    era: 'era5',
    category: 'company',
    flavor: "Custom AI silicon, networking chips, and the enterprise software empire nobody outside IT has heard of.",
    cost: { money: 1760000000000 }, // ~$1.76T, Aug 2026
    effects: [{ type: 'mult', target: 'cost_all', value: 0.95 }],
    requiresUpgrade: 'buy_meta',
  },
  {
    id: 'buy_tsmc',
    name: 'Buy TSMC',
    icon: '🏭',
    era: 'era5',
    category: 'company',
    flavor: "Every GPU on this entire spreadsheet came out of one of their fabs. Now the fabs are yours.",
    cost: { money: 1930000000000 }, // ~$1.93T, Aug 2026
    effects: [{ type: 'mult', target: 'cost_all', value: 0.9 }],
    requiresUpgrade: 'buy_broadcom',
  },
  {
    id: 'buy_amazon',
    name: 'Buy Amazon',
    icon: '📦',
    era: 'era5',
    category: 'company',
    flavor: "AWS's entire fleet of datacenters, plus a logistics network that could ship your GPUs overnight.",
    cost: { money: 3000000000000 }, // ~$3.0T, Aug 2026
    effects: [{ type: 'mult', target: 'consume_all', value: 0.9 }],
    requiresUpgrade: 'buy_tsmc',
  },
  {
    id: 'buy_microsoft',
    name: 'Buy Microsoft',
    icon: '🪟',
    era: 'era5',
    category: 'company',
    flavor: "Azure, Windows, and the world's most valuable OpenAI stake, all under one roof. Your roof, now.",
    cost: { money: 3700000000000 }, // ~$3.7T, Aug 2026
    effects: [{ type: 'mult', target: 'produce_all', value: 1.2 }],
    requiresUpgrade: 'buy_amazon',
  },
  {
    id: 'buy_apple',
    name: 'Buy Apple',
    icon: '🍏',
    era: 'era5',
    category: 'company',
    flavor: "Every phone on Earth just became a distribution channel for whatever you decide to ship next.",
    cost: { money: 4400000000000 }, // ~$4.4T, Aug 2026
    effects: [{ type: 'mult', target: 'sell_price', value: 1.3 }],
    requiresUpgrade: 'buy_microsoft',
  },
  {
    id: 'buy_alphabet',
    name: 'Buy Alphabet',
    icon: '🔍',
    era: 'era5',
    category: 'company',
    flavor: "Search, YouTube, and DeepMind's entire research org. The antitrust lawyers already have a group chat about this.",
    cost: { money: 4530000000000 }, // ~$4.53T, Aug 2026
    effects: [{ type: 'mult', target: 'train_ratio', value: 1.5 }],
    requiresUpgrade: 'buy_apple',
  },
  {
    id: 'buy_nvidia',
    name: 'Buy Nvidia',
    icon: '🟩',
    era: 'era5',
    category: 'company',
    flavor: "The most valuable company on the planet, and every GPU on this screen was theirs before you bought the whole thing.",
    cost: { money: 5310000000000 }, // ~$5.31T, Aug 2026 - the world's largest company
    effects: [
      { type: 'mult', target: 'produce_all', value: 1.5 },
      { type: 'mult', target: 'cost_all', value: 0.75 },
    ],
    requiresUpgrade: 'buy_alphabet',
  },

  // --- Configurations: small, cheap-ish tuning upgrades - more tokens per
  // GPU, more $ per token sold, or less power per GPU (high-density
  // cooling). Deliberately modest multipliers (1.05-1.15, or 0.85-0.95 for
  // the cost/consume-reducing ones) - these are meant to stack many small
  // wins, not to be a shortcut past the compute/power/water economy. Each
  // is gated on headcount (AI Research Engineers or Business people),
  // reusing the same `requires` mechanism as Develop Quantum Computer.
  {
    id: 'batch_inference_tuning',
    name: 'Batch Inference Tuning',
    icon: '⚙️',
    era: 'era3',
    category: 'configurations',
    flavor: 'Bigger batches, better GPU utilization, the same silicon doing noticeably more work.',
    cost: { money: 40000 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.05 }],
    requires: [{ type: 'building', id: 'ai_research_engineer', count: 3 }],
  },
  {
    id: 'kv_cache_optimization',
    name: 'KV-Cache Optimization',
    icon: '🗃️',
    era: 'era4',
    category: 'configurations',
    flavor: 'Stops recomputing what the model already figured out three tokens ago.',
    cost: { money: 150000 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.08 }],
    requires: [{ type: 'building', id: 'ai_research_engineer', count: 10 }],
  },
  {
    id: 'speculative_decoding',
    name: 'Speculative Decoding',
    icon: '🔮',
    era: 'era4',
    category: 'configurations',
    flavor: 'A small model guesses ahead, a big model checks its work. Somehow this is faster than just asking the big model.',
    cost: { money: 600000 },
    effects: [{ type: 'mult', target: 'produce_all', value: 1.1 }],
    requires: [{ type: 'building', id: 'ai_research_engineer', count: 20 }],
  },
  {
    id: 'enterprise_pricing_tiers',
    name: 'Enterprise Pricing Tiers',
    icon: '📊',
    era: 'era3',
    category: 'configurations',
    flavor: 'The API price didn\'t change. The invoice line items just got more creative.',
    cost: { money: 40000 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.08 }],
    requires: [{ type: 'building', id: 'business_person', count: 3 }],
  },
  {
    id: 'usage_based_pricing',
    name: 'Usage-Based Pricing Model',
    icon: '💳',
    era: 'era4',
    category: 'configurations',
    flavor: 'Nobody can predict their bill anymore. Revenue per token goes up anyway.',
    cost: { money: 300000 },
    effects: [{ type: 'mult', target: 'sell_price', value: 1.1 }],
    requires: [{ type: 'building', id: 'business_person', count: 10 }],
  },
  {
    id: 'high_density_cooling',
    name: 'High-Density Rack Cooling',
    icon: '❄️',
    era: 'era4',
    category: 'configurations',
    flavor: 'Rear-door heat exchangers on every rack. The room is quieter and the power bill is smaller.',
    cost: { money: 500000 },
    effects: [{ type: 'mult', target: 'consume_all', value: 0.93 }],
    requires: [{ type: 'building', id: 'ai_research_engineer', count: 15 }],
  },
  {
    id: 'liquid_immersion_cooling',
    name: 'Liquid Immersion Cooling',
    icon: '🧊',
    era: 'era5',
    category: 'configurations',
    flavor: 'Every board, fully submerged in dielectric fluid. Looks insane in photos, cuts the power bill for real.',
    cost: { money: 5000000 },
    effects: [{ type: 'mult', target: 'consume_all', value: 0.9 }],
    requires: [{ type: 'building', id: 'ai_research_engineer', count: 30 }],
  },
];

Game.data.upgradesById = {};
Game.data.upgrades.forEach((u) => { Game.data.upgradesById[u.id] = u; });
