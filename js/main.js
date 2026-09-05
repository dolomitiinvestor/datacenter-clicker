window.Game = window.Game || {};

(function () {
  let lastTick = Date.now();

  function loop() {
    const now = Date.now();
    const realDt = (now - lastTick) / 1000;
    lastTick = now;

    // Real seconds -> in-game seconds: base pace (1 real sec = 1 game hour)
    // times the player's clock-speed slider, times the DEV MODE speed
    // multiplier on top for testing.
    const gameDt = realDt * Game.config.baseGameSecondsPerRealSecond * Game.state.clockSpeedMultiplier * Game.dev.speedMultiplier;

    const erasBefore = Object.keys(Game.state.erasUnlocked).length;
    const moneyBefore = Game.state.resources.money.amount;
    Game.engine.tick(gameDt);
    const erasAfter = Object.keys(Game.state.erasUnlocked).length;

    // Net $/game-second from continuous flows only: clicks (Freelance,
    // Schmooze) and one-off building payouts (Publish arXiv, Raise VC)
    // happen outside engine.tick, so this delta only ever reflects rent,
    // electricity billing, salaries, and token auto-convert.
    if (gameDt > 0) {
      Game.state.netMoneyPerSecond = (Game.state.resources.money.amount - moneyBefore) / gameDt;
    }

    if (erasAfter !== erasBefore) {
      Game.ui.renderAll();
    } else {
      Game.ui.renderFrame();
    }
  }

  function bindStaticButtons() {
    document.getElementById('alert-ok-btn').addEventListener('click', () => {
      Game.ui.hideAlert();
    });

    document.getElementById('btn-freelance').addEventListener('click', () => {
      const earned = Game.actions.freelanceGig();
      if (earned === null) {
        flashMessage("You're out of DoorDash shifts for today — come back tomorrow.");
      }
      Game.ui.renderResources();
      Game.ui.renderFreelanceStatus();
    });

    document.getElementById('btn-schmooze').addEventListener('click', () => {
      Game.actions.schmoozePolitician();
      Game.ui.renderResources();
    });

    document.getElementById('btn-software-job').addEventListener('click', () => {
      Game.actions.toggleSoftwareJob();
      Game.ui.renderSoftwareJobStatus();
    });

    document.getElementById('btn-auto-convert').addEventListener('click', () => {
      Game.actions.toggleAutoConvert();
      Game.ui.renderTokenControls();
    });

    document.getElementById('alloc-slider').addEventListener('input', (e) => {
      Game.actions.setTrainAllocation(Number(e.target.value));
      Game.ui.renderAllocLabels();
    });

    document.getElementById('clock-speed-slider').addEventListener('input', (e) => {
      Game.state.clockSpeedMultiplier = Number(e.target.value);
      Game.ui.renderClockSpeedLabel();
    });

    document.getElementById('elec-price-input').addEventListener('input', (e) => {
      const val = Number(e.target.value);
      Game.state.electricityPricePerKwh = isNaN(val) ? 0 : Math.max(0, val);
      Game.ui.renderElectricity();
    });

    document.getElementById('btn-save').addEventListener('click', () => {
      Game.save.save();
      flashMessage('Saved.');
    });

    document.getElementById('btn-export').addEventListener('click', () => {
      const str = Game.save.exportString();
      const box = document.getElementById('io-textarea');
      box.value = str;
      box.select();
      flashMessage('Save exported below — copy it somewhere safe.');
    });

    document.getElementById('btn-import').addEventListener('click', () => {
      const box = document.getElementById('io-textarea');
      if (!box.value.trim()) return;
      if (Game.save.importString(box.value)) {
        Game.ui.renderAll();
        flashMessage('Save imported.');
      } else {
        flashMessage('Import failed — check the save string.');
      }
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      if (!confirm('Reset all progress? This cannot be undone.')) return;
      Game.save.hardReset();
      Game.ui.renderAll();
      flashMessage('Progress reset.');
    });

    bindDevPanel(); // DEV MODE
  }

  // DEV MODE — remove this function and its call site to drop dev mode.
  function bindDevPanel() {
    const speedButtons = document.querySelectorAll('#dev-mode-panel button[data-speed]');
    speedButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        Game.dev.setSpeed(Number(btn.getAttribute('data-speed')));
        speedButtons.forEach((b) => b.classList.toggle('active', b === btn));
      });
    });

    const costButtons = document.querySelectorAll('#dev-mode-panel button[data-cost]');
    costButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        Game.dev.setCostMultiplier(Number(btn.getAttribute('data-cost')));
        costButtons.forEach((b) => b.classList.toggle('active', b === btn));
        // costs are baked into the building/upgrade card markup, so a full
        // rebuild is needed to show the new prices immediately.
        Game.ui.renderBuildings();
        Game.ui.renderUpgrades();
      });
    });

    document.getElementById('btn-cost-scaling').addEventListener('click', (e) => {
      const on = Game.dev.toggleCostScaling();
      e.currentTarget.classList.toggle('active', on);
      e.currentTarget.textContent = 'Cost Scaling: ' + (on ? 'ON' : 'OFF');
      Game.ui.renderBuildings();
    });

    bindDevStateEditor();
  }

  // DEV MODE — remove this function, its call site, and the
  // #dev-state-editor block in index.html to drop the raw-state editor.
  function bindDevStateEditor() {
    const panel = document.getElementById('dev-state-editor');
    const textarea = document.getElementById('dev-state-textarea');

    function refresh() {
      textarea.value = JSON.stringify(Game.state, null, 2);
    }

    document.getElementById('btn-edit-state').addEventListener('click', () => {
      Game.dev.stateEditorOpen = !Game.dev.stateEditorOpen;
      panel.hidden = !Game.dev.stateEditorOpen;
      if (Game.dev.stateEditorOpen) refresh();
    });

    document.getElementById('btn-state-refresh').addEventListener('click', refresh);

    document.getElementById('btn-state-apply').addEventListener('click', () => {
      let parsed;
      try {
        parsed = JSON.parse(textarea.value);
      } catch (e) {
        flashMessage('Invalid JSON: ' + e.message);
        return;
      }
      Game.state = parsed;
      Game.state_helpers.recalcLandCap();
      Game.ui.renderAll();
      flashMessage('State applied.');
    });
  }

  let flashTimer = null;
  function flashMessage(msg) {
    const el = document.getElementById('flash-message');
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove('visible'), 3000);
  }

  function init() {
    Game.save.load();
    Game.state_helpers.recalcLandCap();
    Game.ui.cacheEls();
    Game.ui.renderAll();
    bindStaticButtons();

    setInterval(loop, Game.config.tickMs);
    setInterval(() => Game.save.save(), Game.config.autosaveMs);
    window.addEventListener('beforeunload', () => Game.save.save());
  }

  document.addEventListener('DOMContentLoaded', init);
})();
