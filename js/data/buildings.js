window.Game = window.Game || {};
Game.data = Game.data || {};

// Each building is pure data. The engine/actions code never special-cases
// a building id (aside from era/unlock display) - it just reads these
// fields. To add a new building: append an entry, pick an era, done.
//
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
Game.data.buildings = [
  {
    id: 'laptop',
    name: 'Used Laptop',
    icon: '💻',
    era: 'era1',
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
    flavor: 'You called an electrician. Your landlord did not approve.',
    baseCost: { money: 120 },
    costScale: 1.2,
    land: 0,
    produces: { electricity: 1.5 },
    consumes: {},
    maxCount: { buildingId: 'sf_apartment', per: 1 }, // one extra circuit per apartment - there's only so many walls
  },
  {
    id: 'gpu_rack',
    name: 'Mining GPU Rack',
    icon: '🖥️',
    era: 'era2',
    flavor: 'Eight used enterprise GPUs on a steel shelf. Still cheaper than buying new.',
    baseCost: { money: 9000 }, // ~$1,100/GPU used, 8 GPUs, plus rack/PSU/networking overhead
    costScale: 1.16,
    land: 1,
    produces: { tokens: 300 }, // 8 GPUs running real inference workloads, not a laptop chip
    consumes: { electricity: 2.8 }, // 8 x ~350W, realistic for enterprise-class cards under load
  },
  {
    id: 'land_plot',
    name: 'Lease Land Plot',
    icon: '📜',
    era: 'era2',
    flavor: 'A dusty acre behind the self-storage place.',
    baseCost: { money: 100 },
    costScale: 1.25,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 1,
  },
  {
    id: 'lobbyist',
    name: 'Hire Lobbyist',
    icon: '🏛️',
    era: 'era3',
    flavor: 'He knows a guy on the zoning board. $100k/yr, paid monthly, whether you win or lose.',
    baseCost: { money: 1000 }, // retainer to sign them
    costScale: 1.2,
    land: 1,
    produces: { influence: 0.05 },
    consumes: {},
    rentPerMonth: { money: 100000 / 12 }, // $100k/yr salary, billed monthly (12 * hoursPerMonth == hoursPerYear, so this bills out to exactly $100k/yr)
  },
  {
    id: 'diesel_generator',
    name: 'Diesel Generator',
    icon: '⛽',
    era: 'era3',
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
    id: 'warehouse_lease',
    name: 'Warehouse Lease',
    icon: '🏭',
    era: 'era3',
    flavor: 'Five acres of concrete and possibility. Landlords don\'t lease to an individual - you need an LLC and someone who can talk to the zoning board.',
    baseCost: { money: 50000, influence: 20 },
    costScale: 1.2,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 5,
    rentPerMonth: { money: 5000 }, // industrial lease payment
    requires: [
      { type: 'upgrade', id: 'incorporate_business' },
      { type: 'building', id: 'lobbyist', count: 1 },
    ],
  },
  {
    id: 'publish_arxiv',
    name: 'Publish arXiv Paper',
    icon: '📄',
    era: 'era3',
    flavor: 'Nobody reads it, but it counts. Spends Research Points, builds Reputation.',
    baseCost: { reputation: 10 },
    costScale: 1.3, // each paper needs more novel research than the last
    land: 0,
    produces: {},
    consumes: {},
    payout: { fame: 5 },
  },
  {
    id: 'raise_vc',
    name: 'Raise VC Money',
    icon: '🤑',
    era: 'era3',
    flavor: 'A partner nods slowly. A wire transfer follows. Spends Research Points, raises Cash.',
    baseCost: { reputation: 50 },
    costScale: 1.4, // each round needs more traction than the last
    land: 0,
    produces: {},
    consumes: {},
    payout: { money: 50000 },
  },
  {
    id: 'enterprise_cluster',
    name: 'Enterprise GPU Cluster',
    icon: '🧊',
    era: 'era4',
    flavor: 'Liquid-cooled, rack-mounted, and terrifyingly expensive.',
    baseCost: { money: 6000 },
    costScale: 1.17,
    land: 2,
    produces: { tokens: 800 }, // 4 gigaflops/s worth of inference, at 200 tokens/gigaflop
    consumes: { electricity: 2 },
  },
  {
    id: 'solar_farm',
    name: 'Solar Farm',
    icon: '☀️',
    era: 'era4',
    flavor: 'Rows of panels where cornfields used to be.',
    baseCost: { money: 5000 },
    costScale: 1.2,
    land: 3,
    produces: { electricity: 15 },
    consumes: {},
  },
  {
    id: 'policy_office',
    name: 'Regulatory Affairs Office',
    icon: '🏢',
    era: 'era4',
    flavor: 'A whole floor dedicated to filling out permits.',
    baseCost: { money: 4000, influence: 10 },
    costScale: 1.22,
    land: 1,
    produces: { influence: 0.3 },
    consumes: {},
  },
];

Game.data.buildingsById = {};
Game.data.buildings.forEach((b) => { Game.data.buildingsById[b.id] = b; });
