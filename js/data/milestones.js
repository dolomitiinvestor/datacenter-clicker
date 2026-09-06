window.Game = window.Game || {};
Game.data = Game.data || {};

// One-time flavor popups triggered by a condition on state, independent of
// any specific purchase - see engine.checkMilestones. Each fires at most
// once (state.seenAlerts, the same store used for blocked-purchase popups).
Game.data.milestones = [
  {
    id: 'roommate_laptops',
    title: 'Your Roommate',
    message: 'Your roommate is starting to complain about the laptops...',
    check: (s) => (s.buildings.laptop || 0) + (s.buildings.macbook_m5 || 0) >= 50,
  },
  {
    id: 'gpu_farm_100',
    title: 'Building Inspector',
    message: 'The building inspector wants to know why your studio apartment now draws more power than the rest of the block combined.',
    check: (s) => Game.data.buildings.filter((b) => b.category === 'compute').reduce((sum, b) => sum + (s.buildings[b.id] || 0), 0) >= 100,
  },
  {
    id: 'first_brownout',
    title: 'Brownout',
    message: 'The lights flicker across three buildings. Somewhere, a grad student\'s experiment just failed.',
    check: (s) => s.resources.electricity.generated > 0 && s.resources.electricity.throttle < 0.999,
  },
  {
    id: 'first_billion_earned',
    title: 'Forbes Calls',
    message: 'A reporter leaves three voicemails asking for comment. You let all three ring out.',
    check: (s) => s.stats.totalMoneyEarned >= 1000000000,
  },
  {
    id: 'diesel_fleet',
    title: 'A Concerned Neighbor',
    message: 'Someone files a noise complaint. Then an air quality complaint. Then a very confused Yelp review.',
    check: (s) => (s.buildings.diesel_generator || 0) >= 10,
  },
  {
    id: 'first_gas_turbine',
    title: 'New Neighbors',
    message: 'A homeowners\' association three miles away starts a group chat about you. It is not friendly.',
    check: (s) => (s.buildings.gas_turbine_small || 0) + (s.buildings.gas_turbine_medium || 0) + (s.buildings.gas_turbine_large_ccgt || 0) >= 1,
  },
  {
    id: 'first_land_site',
    title: 'Property Tax Reassessment',
    message: 'The county assessor\'s office gives your parcel its own zip code.',
    check: (s) => (s.buildings.site_50mw || 0) >= 1,
  },
  {
    id: 'all_universities',
    title: 'U.S. News & World Report',
    message: 'They quietly stop describing any of these schools as "independent" in the methodology footnotes.',
    check: (s) => ['buy_georgia_tech', 'buy_uc_berkeley', 'buy_carnegie_mellon', 'buy_mit', 'buy_stanford'].every((id) => !!s.upgrades[id]),
  },
  {
    id: 'quit_day_job',
    title: "Two Weeks' Notice",
    message: 'You could quit the day job any time now. You don\'t. Old habits.',
    check: (s) => s.softwareJobEnabled && s.stats.totalMoneyEarned >= 10000000,
  },
  {
    id: 'jensen_calls',
    title: 'A Familiar Voice',
    message: 'Jensen Huang starts dialing your personal number directly. He skips the small talk and asks about next quarter\'s order.',
    check: (s) => Game.data.buildings
      .filter((b) => b.category === 'compute' && b.id !== 'laptop' && b.id !== 'macbook_m5')
      .reduce((sum, b) => sum + (s.buildings[b.id] || 0), 0) >= 500,
  },
  {
    id: 'tsmc_christmas_card',
    title: 'Season\'s Greetings',
    message: 'TSMC sends a christmas card. It is addressed to you personally, and it is signed by more people than work at your first office.',
    check: (s) => !!s.upgrades.buy_tsmc,
  },
  {
    id: 'president_speech',
    title: 'A Prime-Time Address',
    message: 'The President gives a national address on "the dangers of artificial intelligence." Nobody says your name. Everybody knows.',
    check: (s) => !!s.upgrades.develop_humanoid_robots,
  },
  {
    id: 'nation_states_crack_phone',
    title: 'Unknown Callers',
    message: 'Three separate nation-states are now trying to crack your phone. One of them is, embarrassingly, an ally.',
    check: (s) => !!s.upgrades.develop_quantum_computer,
  },
];
