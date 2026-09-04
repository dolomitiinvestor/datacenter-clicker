window.Game = window.Game || {};

(function () {
  let lastTick = Date.now();

  function loop() {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    const erasBefore = Object.keys(Game.state.erasUnlocked).length;
    Game.engine.tick(dt * Game.dev.speedMultiplier); // DEV MODE speed multiplier
    const erasAfter = Object.keys(Game.state.erasUnlocked).length;

    if (erasAfter !== erasBefore) {
      Game.ui.renderAll();
    } else {
      Game.ui.renderFrame();
    }
  }

  function bindStaticButtons() {
    document.getElementById('btn-freelance').addEventListener('click', () => {
      Game.actions.freelanceGig();
      Game.ui.renderResources();
    });

    document.getElementById('btn-schmooze').addEventListener('click', () => {
      Game.actions.schmoozePolitician();
      Game.ui.renderResources();
    });

    document.getElementById('btn-auto-convert').addEventListener('click', () => {
      Game.actions.toggleAutoConvert();
      Game.ui.renderComputeControls();
    });

    document.getElementById('alloc-slider').addEventListener('input', (e) => {
      Game.actions.setTrainAllocation(Number(e.target.value));
      Game.ui.renderAllocLabels();
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
