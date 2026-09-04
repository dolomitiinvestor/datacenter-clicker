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
// requires:      optional { buildingId, count } prerequisite beyond the era gate
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
    // 100 gigaflops/hour and 20,000 tokens/hour, expressed as the
    // per-second rates the engine expects (rate * dtSeconds each tick).
    produces: { compute: 100 / 3600, tokens: 20000 / 3600 },
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
  },
  {
    id: 'gpu_gaming',
    name: 'Used Gaming GPU',
    icon: '🎮',
    era: 'era1',
    flavor: 'A secondhand RTX card, duct-taped into a mining rig on your desk.',
    baseCost: { money: 15 },
    costScale: 1.15,
    land: 0,
    produces: { compute: 0.1 },
    consumes: { electricity: 0.05 },
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
  },
  {
    id: 'gpu_rack',
    name: 'Mining GPU Rack',
    icon: '🖥️',
    era: 'era2',
    flavor: 'Eight GPUs, one janky shelf, zero fire code compliance.',
    baseCost: { money: 300 },
    costScale: 1.16,
    land: 1,
    produces: { compute: 0.6 },
    consumes: { electricity: 0.3 },
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
    flavor: 'He knows a guy on the zoning board.',
    baseCost: { money: 500 },
    costScale: 1.2,
    land: 1,
    produces: { influence: 0.05 },
    consumes: {},
  },
  {
    id: 'diesel_generator',
    name: 'Diesel Generator',
    icon: '⛽',
    era: 'era3',
    flavor: 'Loud, dirty, and reliably running at 3am.',
    baseCost: { money: 700 },
    costScale: 1.18,
    land: 1,
    produces: { electricity: 6 },
    consumes: {},
  },
  {
    id: 'warehouse_lease',
    name: 'Warehouse Lease',
    icon: '🏭',
    era: 'era3',
    flavor: 'Five acres of concrete and possibility.',
    baseCost: { money: 1200, influence: 5 },
    costScale: 1.2,
    land: 0,
    produces: {},
    consumes: {},
    providesLandCap: 5,
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
    produces: { compute: 4 },
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
