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
];
