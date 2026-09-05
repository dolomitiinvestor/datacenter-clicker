window.Game = window.Game || {};
Game.data = Game.data || {};

// Eras gate which buildings/upgrades/actions are visible, same idea as
// CivClicker's ages. `check(state)` runs every tick; once it returns true
// the era stays unlocked forever (see engine.checkEras). To add a new
// stage: append an entry here, then tag buildings/upgrades/actions with
// its id in their own data files.
Game.data.eras = [
  {
    id: 'era1',
    name: 'Bedroom Hustler',
    flavor: 'Late nights, ramen, and a browser tab full of freelance gigs.',
    check: () => true,
  },
  {
    id: 'era2',
    name: 'Garage Farm',
    flavor: 'The rigs spilled out of the bedroom and into the garage.',
    check: (s) => (s.buildings.laptop || 0) + (s.buildings.macbook_m5 || 0) >= 3 || s.stats.totalMoneyEarned >= 150,
  },
  {
    id: 'era3',
    name: 'Warehouse Operation',
    flavor: 'Zoning laws exist for a reason, and you are about to learn why.',
    check: (s) => (s.buildings.gpu_rack || 0) >= 3 || s.stats.totalTokensMade >= 40000,
  },
  {
    id: 'era4',
    name: 'Data Center',
    flavor: 'Concrete, chain-link fences, and a very large power bill.',
    check: (s) => s.resources.influence.amount >= 25 || s.resources.reputation.amount >= 15,
  },
  {
    id: 'era5',
    name: 'Hyperscale Campus',
    flavor: 'You stopped renting servers and started buying zip codes.',
    check: (s) => (s.buildings.h100_80gb || 0) >= 1 || s.stats.totalMoneyEarned >= 1000000,
  },
];

Game.data.erasById = {};
Game.data.eras.forEach((e) => { Game.data.erasById[e.id] = e; });
