window.Game = window.Game || {};

(function () {
  let lastTick = Date.now();

  function loop() {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;

    const erasBefore = Object.keys(Game.state.erasUnlocked).length;
    Game.engine.tick(dt);
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

    document.getElementById('btn-sell-compute').addEventListener('click', () => {
      Game.actions.sellCompute();
      Game.ui.renderResources();
    });

    document.getElementById('btn-train-model').addEventListener('click', () => {
      Game.actions.trainModel();
      Game.ui.renderResources();
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
