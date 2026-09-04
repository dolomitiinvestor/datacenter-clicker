window.Game = window.Game || {};
Game.data = Game.data || {};

// Each building is pure data. The engine/actions code never special-cases
// a building id (aside from era/unlock display) - it just reads these
// fields. To add a new building: append an entry, pick an era, done.
//
// baseCost:      { resourceId: amount, ... } cost of the 1st unit
// costScale:     cost multiplier per unit already owned (compounding)
// land:          land plots consumed per unit owned (permanent, freed on sell if that's added later)
// produces:      { resourceId: amountPerSecond, ... }
// consumes:      { resourceId: amountPerSecond, ... }
// providesLandCap: flat increase to land cap per unit owned (optional)
// requires:      optional { buildingId, count } prerequisite beyond the era gate
Game.data.buildings = [
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
    flavor: 'A dusty half-acre behind the self-storage place.',
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
    flavor: '40,000 square feet of concrete and possibility.',
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
