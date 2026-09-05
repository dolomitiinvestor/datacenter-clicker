window.Game = window.Game || {};
Game.data = Game.data || {};

// Each building is pure data. The engine/actions code never special-cases
// a building id (aside from era/unlock display) - it just reads these
// fields. To add a new building: append an entry, pick an era, done.
//
// category:      'compute' | 'buildings' | 'research' | 'regulatory' | 'upgrades'
//                which catalog column it's rendered in (see render.js
//                renderCatalog) - buildings and upgrades share the same
//                five columns, grouped by this field, not by data source.
// baseCost:      { resourceId: amount, ... } cost of the 1st unit
// costScale:     cost multiplier per unit already owned (compounding)
// land:          acres of land consumed per unit owned (permanent, freed on sell if that's added later)
// produces:      { resourceId: amountPerSecond, ... }
// consumes:      { resourceId: amountPerSecond, ... }
// providesLandCap: flat increase to land cap (in acres) per unit owned (optional)
// rentPerMonth:  { resourceId: amount, ... } recurring monthly cost per unit
//                owned, billed hourly (amount / config.hoursPerMonth) every
//                tick regardless of production - see engine._runUpkeep.
// payout:        { resourceId: amount, ... } granted once, immediately,
//                each time a unit is bought (on top of any produces) - see
//                actions.buyBuilding. Lets a "building" double as a
//                repeatable milestone purchase (Publish arXiv Paper, Raise
//                VC Money) with the same cost-scaling/afford-check plumbing
//                as everything else, instead of a one-shot resource dump.
// requires:      optional array of gates beyond the era check, every one of
//                which must hold - see actions.meetsRequirements:
//                  { type: 'upgrade', id: '<upgradeId>' }       - upgrade must be purchased
//                  { type: 'building', id: '<buildingId>', count } - must own at least `count` (default 1)
// maxCount:      { buildingId: '<id>', per } - caps how many of this
//                building you can own at (per * count of buildingId owned),
//                e.g. one Extra Power Outlet per SF Apartment.
// blockOnRequirementFail: true - the building stays VISIBLE (not hidden)
//                even while `requires` isn't met, and its Buy button stays
//                clickable; clicking it shows `blockedMessage` as a one-time
//                popup (Game.ui.showAlert, tracked in state.seenAlerts)
//                instead of silently doing nothing or buying anything - see
//                render.js bindBuildingButtons. Use for gates the player
//                should discover by trying, not by the item just not being
//                there (e.g. a land site blocked pending a permit).
// blockedMessage: flavor text shown by the popup above.
Game.data.buildings = [
  {
    id: 'laptop',
    name: 'Used Laptop',
    icon: '💻',
    era: 'era1',
    category: 'compute',
    flavor: 'A $200 Craigslist find, running inference jobs between browser tabs.',
    baseCost: { money: 200 },
    costScale: 1.15,
    land: 0,
    // 20,000 tokens/hour, expressed as the per-second rate the engine
    // expects (rate * dtSeconds each tick).
    produces: { tokens: 20000 / 3600 },
    consumes: { electricity: 0.07 },
  },
  {
    id: 'macbook_m5',
    name: 'MacBook M5',
    icon: '🍎',
    era: 'era1',
    category: 'compute',
    flavor: "Cupertino's finest, quietly out-computing your entire GPU rack while sipping watts.",
    baseCost: { money: 1400 },
    costScale: 1.15,
    land: 0,
    // Double the Used Laptop's 20,000 tokens/hour, same power draw.
    produces: { tokens: 40000 / 3600 },
    consumes: { electricity: 0.07 },
  },
  {
    id: 'sf_apartment',
    name: 'Rent SF Apartment',
    icon: '🏠',
    era: 'era1',
    category: 'buildings',
    flavor: '200 square feet of Bay Area living space, with a 15kW panel that\'s begging to be maxed out.',
    baseCost: { money: 2000 }, // deposit to move in
    costScale: 1.15,
    land: 0,
    produces: { electricity: 15 }, // the unit's electrical panel capacity - 15kW max draw
    consumes: {},
    rentPerMonth: { money: 2000 }, // ongoing rent, billed hourly
    sqft: 200,
    providesLandCap: 200 / 43560, // your land cap is literally the sqft you're renting, until you lease real land
  },
  {
    id: 'extra_outlet',
    name: 'Extra Power Outlet',
    icon: '🔌',
    era: 'era2',
    category: 'buildings',
    flavor: 'You called an electrician. Your landlord did not approve.',
    baseCost: { money: 120 },
    costScale: 1.2,
    land: 0,
    produces: { electricity: 1.5 },
    consumes: {},
    maxCount: { buildingId: 'sf_apartment', per: 1 }, // one extra circuit per apartment - there's only so many walls
    requires: [{ type: 'building', id: 'sf_apartment', count: 1 }], // nowhere to run the circuit without an apartment - hidden until you have one
  },
  {
    id: 'empty_warehouse',
    name: 'Empty Warehouse',
    icon: '📦',
    era: 'era2',
    category: 'buildings',
    flavor: 'A bare concrete shell with a roll-up door. No power hookup, but the rent is cheap and nobody asks questions.',
    baseCost: { money: 15000 },
    costScale: 1.2,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 2,
    rentPerMonth: { money: 800 },
  },
  {
    id: 'abandoned_factory_10mw',
    name: '10MW Abandoned Factory',
    icon: '🏚️',
    era: 'era3',
    category: 'buildings',
    flavor: 'Shuttered since the last recession, but the old industrial service drop is still live. Cheaper than a fresh lease - nobody\'s fighting you for it.',
    baseCost: { money: 30000 },
    costScale: 1.25,
    land: 0,
    produces: { electricity: 10000 }, // 10MW - the old grid connection, still on the books
    consumes: {},
    providesLandCap: 3,
    rentPerMonth: { money: 1200 }, // property tax and a security guard
  },

  // --- Named GPU classes. Real TDP and street-price tiers; per-card token
  // throughput is a game-balance approximation (actual LLM inference speed
  // varies hugely by model size/batching), scaled consistently across
  // classes so later cards are meaningfully better per watt and per dollar.
  // No land cost - GPUs live inside whatever real estate you've already
  // leased, they don't need their own acreage.
  {
    id: 'rtx_4090',
    name: 'GeForce RTX 4090',
    icon: '🎮',
    era: 'era2',
    category: 'compute',
    flavor: 'Consumer flagship, 450W TDP. Not built for a rack, but it works.',
    baseCost: { money: 1800 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 90 },
    consumes: { electricity: 0.45 },
  },
  {
    id: 'a100_80gb',
    name: 'NVIDIA A100 80GB',
    icon: '🟩',
    era: 'era3',
    category: 'compute',
    flavor: 'The card that started the arms race. 400W, and every cloud provider wants more of them.',
    baseCost: { money: 10000 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 140 },
    consumes: { electricity: 0.4 },
  },
  {
    id: 'h100_80gb',
    name: 'NVIDIA H100 80GB',
    icon: '🟩',
    era: 'era3',
    category: 'compute',
    flavor: 'Hopper architecture, 700W. The card every lab is rationing.',
    baseCost: { money: 30000 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 300 },
    consumes: { electricity: 0.7 },
  },
  {
    id: 'h100_80gb_rack',
    name: 'H100 Rack (x8)',
    icon: '🗄️',
    era: 'era3',
    category: 'compute',
    flavor: 'Eight H100s, one chassis, one very serious power connector. A 5% bulk discount for buying by the rack.',
    baseCost: { money: 8 * 30000 * 0.95 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 8 * 300 },
    consumes: { electricity: 8 * 0.7 },
  },
  {
    id: 'h100_80gb_cluster',
    name: 'H100 Cluster (x64)',
    icon: '🧱',
    era: 'era4',
    category: 'compute',
    flavor: 'Eight racks, networked, cooled, and insured. A 10% bulk discount over buying racks one at a time.',
    baseCost: { money: 64 * 30000 * 0.9 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 64 * 300 },
    consumes: { electricity: 64 * 0.7 },
  },
  {
    id: 'h200',
    name: 'NVIDIA H200',
    icon: '🟦',
    era: 'era4',
    category: 'compute',
    flavor: 'Same 700W envelope as the H100, but HBM3e memory bandwidth means real throughput gains.',
    baseCost: { money: 35000 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 380 },
    consumes: { electricity: 0.7 },
  },
  {
    id: 'h200_rack',
    name: 'H200 Rack (x8)',
    icon: '🗄️',
    era: 'era4',
    category: 'compute',
    flavor: 'Eight H200s in one chassis. 5% bulk discount.',
    baseCost: { money: 8 * 35000 * 0.95 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 8 * 380 },
    consumes: { electricity: 8 * 0.7 },
  },
  {
    id: 'h200_cluster',
    name: 'H200 Cluster (x64)',
    icon: '🧱',
    era: 'era4',
    category: 'compute',
    flavor: 'A full pod of H200 racks. 10% bulk discount.',
    baseCost: { money: 64 * 35000 * 0.9 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 64 * 380 },
    consumes: { electricity: 64 * 0.7 },
  },
  {
    id: 'b200',
    name: 'NVIDIA B200',
    icon: '🟪',
    era: 'era5',
    category: 'compute',
    flavor: 'Blackwell. 1000W, roughly 2x an H100 for inference, and priced like it.',
    baseCost: { money: 60000 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 750 },
    consumes: { electricity: 1.0 },
  },
  {
    id: 'b200_rack',
    name: 'B200 Rack (x8)',
    icon: '🗄️',
    era: 'era5',
    category: 'compute',
    flavor: 'Eight B200s. The rack PDU alone needs its own permit. 5% bulk discount.',
    baseCost: { money: 8 * 60000 * 0.95 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 8 * 750 },
    consumes: { electricity: 8 * 1.0 },
  },
  {
    id: 'b200_cluster',
    name: 'B200 Cluster (x64)',
    icon: '🧱',
    era: 'era5',
    category: 'compute',
    flavor: 'This is what the 50MW site was for. 10% bulk discount.',
    baseCost: { money: 64 * 60000 * 0.9 },
    costScale: 1.15,
    land: 0,
    produces: { tokens: 64 * 750 },
    consumes: { electricity: 64 * 1.0 },
  },
  {
    id: 'diesel_generator',
    name: 'Diesel Generator',
    icon: '⛽',
    era: 'era3',
    category: 'buildings',
    flavor: 'Loud, dirty, and reliably running at 3am. Drinks diesel the whole time.',
    baseCost: { money: 4000 }, // realistic for a quality ~5kW diesel unit
    costScale: 1.18,
    land: 1,
    produces: { electricity: 5 },
    consumes: {},
    // Fuel cost, not metered against actual load (that'd need per-building
    // electricity accounting) - flat monthly diesel bill for keeping it
    // fueled and running, ballparked from ~0.45 L/kWh at 5kW continuous.
    rentPerMonth: { money: 1500 },
  },
  {
    id: 'lobbyist',
    name: 'Hire Lobbyist',
    icon: '🏛️',
    era: 'era3',
    category: 'regulatory',
    flavor: 'He knows a guy on the zoning board. $100k/yr, paid monthly, whether you win or lose.',
    baseCost: { money: 1000 }, // retainer to sign them
    costScale: 1.2,
    land: 0,
    produces: { influence: 0.05 },
    consumes: {},
    rentPerMonth: { money: 100000 / 12 }, // $100k/yr salary, billed monthly (12 * hoursPerMonth == hoursPerYear, so this bills out to exactly $100k/yr)
  },
  {
    id: 'policy_office',
    name: 'Regulatory Affairs Office',
    icon: '🏢',
    era: 'era4',
    category: 'regulatory',
    flavor: 'A whole floor dedicated to filling out permits.',
    baseCost: { money: 4000, influence: 10 },
    costScale: 1.22,
    land: 0,
    produces: { influence: 0.3 },
    consumes: {},
  },

  // --- Research spending. Both scale hard with costScale - these are meant
  // to be occasional, meaningful events, not a repeatable farm.
  {
    id: 'publish_arxiv',
    name: 'Publish arXiv Paper',
    icon: '📄',
    era: 'era3',
    category: 'research',
    flavor: 'Nobody reads it, but it counts. Spends Research Points, builds Reputation.',
    baseCost: { reputation: 25000 }, // 1000x - research points were badly miscaled at the old price
    costScale: 1.35, // each paper needs more novel research than the last
    land: 0,
    produces: {},
    consumes: {},
    payout: { fame: 50 },
  },
  {
    id: 'raise_vc',
    name: 'Raise VC Money',
    icon: '🤑',
    era: 'era3',
    category: 'research',
    flavor: 'A partner nods slowly. A wire transfer follows. Spends Research Points, raises Cash - this is a funding round, not a tip jar.',
    baseCost: { reputation: 150000 }, // 1000x - research points were badly miscaled at the old price
    costScale: 1.5, // each round needs more traction than the last
    land: 0,
    produces: {},
    consumes: {},
    payout: { money: 10000000 },
  },

  // --- Gigawatt-class land sites. None of these come with a grid
  // connection (that ends at Warehouse Lease's 10MW) - producing 0
  // electricity here is deliberate, you self-generate (see the power
  // plants below). Each is gated behind an escalating chain of political
  // upgrades (data/upgrades.js) and, until met, stays visible with a
  // one-time blocked-purchase popup instead of hiding outright.
  {
    id: 'site_50mw',
    name: '50MW Land Site',
    icon: '🏞️',
    era: 'era5',
    category: 'buildings',
    flavor: 'A hundred acres of nothing, zoned for industrial power draw. On paper.',
    baseCost: { money: 5000000 },
    costScale: 1.5,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 100,
    requires: [{ type: 'upgrade', id: 'permit_city_planning' }],
    blockOnRequirementFail: true,
    blockedMessage: 'A local city planning council hearing runs three hours long and ends in a unanimous "not like this." You\'ll need City Planning Approval before anyone leases you this parcel.',
  },
  {
    id: 'site_100mw',
    name: '100MW Land Site',
    icon: '🏞️',
    era: 'era5',
    category: 'buildings',
    flavor: 'Two hundred acres. The city council can no longer approve this alone.',
    baseCost: { money: 15000000 },
    costScale: 1.5,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 200,
    requires: [
      { type: 'upgrade', id: 'permit_city_planning' },
      { type: 'upgrade', id: 'permit_state_puc' },
    ],
    blockOnRequirementFail: true,
    blockedMessage: 'The state Public Utilities Commission flags your interconnection request for review. You\'ll need State PUC Approval first.',
  },
  {
    id: 'site_500mw',
    name: '500MW Land Site',
    icon: '🏞️',
    era: 'era5',
    category: 'buildings',
    flavor: 'Eight hundred acres. This shows up on satellite photos.',
    baseCost: { money: 80000000 },
    costScale: 1.5,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 800,
    requires: [
      { type: 'upgrade', id: 'permit_city_planning' },
      { type: 'upgrade', id: 'permit_state_puc' },
      { type: 'upgrade', id: 'permit_federal_review' },
    ],
    blockOnRequirementFail: true,
    blockedMessage: 'A site this size triggers a mandatory federal environmental impact review. Come back with a Federal Environmental Review in hand.',
  },
  {
    id: 'site_1gw',
    name: '1GW Land Site',
    icon: '🏞️',
    era: 'era5',
    category: 'buildings',
    flavor: 'Fifteen hundred acres. You are now a line item in the regional grid operator\'s planning docs.',
    baseCost: { money: 200000000 },
    costScale: 1.5,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 1500,
    requires: [
      { type: 'upgrade', id: 'permit_city_planning' },
      { type: 'upgrade', id: 'permit_state_puc' },
      { type: 'upgrade', id: 'permit_federal_review' },
      { type: 'upgrade', id: 'permit_national_interest' },
    ],
    blockOnRequirementFail: true,
    blockedMessage: 'A full gigawatt of demand gets you a polite call from Washington. You\'ll need a National Interest Energy Waiver.',
  },
  {
    id: 'site_10gw',
    name: '10GW Land Site',
    icon: '🏞️',
    era: 'era5',
    category: 'buildings',
    flavor: 'Ten thousand acres. At this scale you are, functionally, a small country\'s power grid.',
    baseCost: { money: 2500000000 },
    costScale: 1.5,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 10000,
    requires: [
      { type: 'upgrade', id: 'permit_city_planning' },
      { type: 'upgrade', id: 'permit_state_puc' },
      { type: 'upgrade', id: 'permit_federal_review' },
      { type: 'upgrade', id: 'permit_national_interest' },
      { type: 'upgrade', id: 'permit_global_accord' },
    ],
    blockOnRequirementFail: true,
    blockedMessage: 'Ten gigawatts is a treaty-level ask. Nothing happens here without a Global Compute Accord Waiver.',
  },

  // --- Self-generation. Required above 10MW (Warehouse Lease's grid
  // hookup is the ceiling for free-riding on the utility) - these are how
  // you actually power a gigawatt-class site. Gas turbine costs scale
  // linearly at ~$2,500/kW installed; fuel bill scales the same way as the
  // original 50MW unit ($50/kW/month).
  {
    id: 'gas_turbine_small',
    name: 'Small Gas Turbine (Reciprocating)',
    icon: '🔥',
    era: 'era5',
    category: 'buildings',
    flavor: 'A single reciprocating engine genset. 1MW, diesel-generator-sized but built to run on gas around the clock.',
    baseCost: { money: 1000 * 2500 }, // $2,500/kW x 1,000kW
    costScale: 1.25,
    land: 1,
    produces: { electricity: 1000 }, // 1MW
    consumes: {},
    rentPerMonth: { money: 1000 * 50 }, // natural gas fuel
  },
  {
    id: 'gas_turbine_medium',
    name: 'Medium Gas Turbine (Simple-Cycle)',
    icon: '🔥',
    era: 'era5',
    category: 'buildings',
    flavor: 'A single industrial gas turbine, simple-cycle. Fast to build, hungry to feed.',
    baseCost: { money: 50000 * 2500 }, // $2,500/kW x 50,000kW
    costScale: 1.3,
    land: 5,
    produces: { electricity: 50000 }, // 50MW
    consumes: {},
    rentPerMonth: { money: 50000 * 50 }, // natural gas fuel, running flat-out
  },
  {
    id: 'gas_turbine_large_ccgt',
    name: 'Large Gas Turbine (CCGT)',
    icon: '🔥',
    era: 'era5',
    category: 'buildings',
    flavor: 'Combined-cycle: a gas turbine plus a steam turbine catching its waste heat. Half a gigawatt, and meaningfully more fuel-efficient per MWh than simple-cycle.',
    baseCost: { money: 500000 * 2500 }, // $2,500/kW x 500,000kW
    costScale: 1.35,
    land: 30,
    produces: { electricity: 500000 }, // 500MW
    consumes: {},
    rentPerMonth: { money: 500000 * 50 }, // natural gas fuel
  },
  {
    id: 'utility_solar_farm',
    name: 'Utility-Scale Solar Farm',
    icon: '🌞',
    era: 'era5',
    category: 'buildings',
    flavor: 'Twenty megawatts of panels on land that used to grow something else.',
    baseCost: { money: 20000000 }, // ~$1/W installed, utility-scale
    costScale: 1.3,
    land: 20,
    produces: { electricity: 20000 }, // 20MW
    consumes: {},
    rentPerMonth: { money: 80000 }, // O&M, no fuel
  },
  {
    id: 'smr_reactor',
    name: 'Small Modular Reactor',
    icon: '☢️',
    era: 'era5',
    category: 'buildings',
    flavor: 'Three hundred megawatts, baseload, and a stack of federal paperwork thicker than the containment wall.',
    baseCost: { money: 1000000000 },
    costScale: 1.4,
    land: 10,
    produces: { electricity: 300000 }, // 300MW
    consumes: {},
    rentPerMonth: { money: 500000 }, // nuclear fuel + O&M - cheap per MWh, expensive in absolute terms at this scale
    requires: [{ type: 'upgrade', id: 'permit_federal_review' }],
  },
];

Game.data.buildingsById = {};
Game.data.buildings.forEach((b) => { Game.data.buildingsById[b.id] = b; });
