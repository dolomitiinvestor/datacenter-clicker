window.Game = window.Game || {};

Game.ui = {
  els: {},

  cacheEls() {
    this.els = {
      resourceBar: document.getElementById('resource-bar'),
      electricityBar: document.getElementById('electricity-bar'),
      buildingsList: document.getElementById('buildings-list'),
      upgradesList: document.getElementById('upgrades-list'),
      logList: document.getElementById('log-list'),
      eraBanner: document.getElementById('era-banner'),
      btnSellCompute: document.getElementById('btn-sell-compute'),
      btnTrainModel: document.getElementById('btn-train-model'),
      btnSchmooze: document.getElementById('btn-schmooze'),
    };
  },

  renderAll() {
    this.renderEraBanner();
    this.renderResources();
    this.renderElectricity();
    this.renderBuildings();
    this.renderUpgrades();
    this.renderLog();
    this.renderActionVisibility();
    this.renderComputeToggles();
  },

  // Cheap per-frame refresh: numbers + afford-state only, no DOM rebuild.
  renderFrame() {
    this.renderResources();
    this.renderElectricity();
    this.refreshAffordability();
  },

  renderComputeToggles() {
    if (this.els.btnSellCompute) {
      this.els.btnSellCompute.classList.toggle('active', Game.state.autoSell);
      this.els.btnSellCompute.firstChild.textContent = '💸 Auto-Sell Compute: ' + (Game.state.autoSell ? 'ON' : 'OFF');
    }
    if (this.els.btnTrainModel) {
      this.els.btnTrainModel.classList.toggle('active', Game.state.autoTrain);
      this.els.btnTrainModel.firstChild.textContent = '🎯 Auto-Train Model: ' + (Game.state.autoTrain ? 'ON' : 'OFF');
    }
  },

  renderEraBanner() {
    const unlockedIds = Object.keys(Game.state.erasUnlocked).filter((id) => Game.state.erasUnlocked[id]);
    const currentEra = Game.data.eras.filter((e) => unlockedIds.indexOf(e.id) !== -1).pop();
    if (!currentEra) return;
    this.els.eraBanner.innerHTML =
      '<span class="era-name">' + currentEra.name + '</span>' +
      '<span class="era-flavor">' + currentEra.flavor + '</span>';
  },

  renderResources() {
    const html = Game.data.resources.map((r) => {
      if (r.unlockEra && !Game.state.erasUnlocked[r.unlockEra]) return '';
      const res = Game.state.resources[r.id];
      let valueHtml;
      if (r.kind === 'capacity') {
        valueHtml = Game.format.number(res.used, 0) + ' / ' + Game.format.number(res.cap, 0);
      } else if (r.kind === 'flow') {
        valueHtml = Game.format.number(res.consumed, 1) + ' / ' + Game.format.number(res.generated, 1);
      } else {
        valueHtml = Game.format.number(res.amount, r.decimals);
      }
      return (
        '<div class="resource-chip" title="' + r.name + '">' +
        '<span class="res-icon">' + r.icon + '</span>' +
        '<span class="res-value">' + valueHtml + '</span>' +
        '<span class="res-symbol">' + r.symbol + '</span>' +
        '</div>'
      );
    }).join('');
    this.els.resourceBar.innerHTML = html;
  },

  renderElectricity() {
    const elec = Game.state.resources.electricity;
    const pct = elec.generated > 0 ? Math.min(100, (elec.consumed / elec.generated) * 100) : 0;
    const brownout = elec.throttle < 0.999;
    this.els.electricityBar.innerHTML =
      '<div class="bar-track"><div class="bar-fill' + (brownout ? ' brownout' : '') + '" style="width:' + pct + '%"></div></div>' +
      '<div class="bar-label">' + Game.format.number(elec.consumed, 1) + ' / ' + Game.format.number(elec.generated, 1) + ' kW' +
      (brownout ? ' — BROWNOUT (' + Math.round(elec.throttle * 100) + '% output)' : '') + '</div>';
  },

  unlockedEraIds() {
    return Object.keys(Game.state.erasUnlocked).filter((id) => Game.state.erasUnlocked[id]);
  },

  renderBuildings() {
    const unlocked = this.unlockedEraIds();
    const visible = Game.data.buildings.filter((b) => unlocked.indexOf(b.era) !== -1);
    this.els.buildingsList.innerHTML = visible.map((b) => this.buildingCardHtml(b)).join('');
    this.bindBuildingButtons();
  },

  buildingCardHtml(b) {
    const count = Game.state.buildings[b.id] || 0;
    const cost = Game.actions.buildingCost(b.id);
    const costHtml = this.costHtml(cost);
    const produceHtml = this.rateSummaryHtml(b.produces);
    const consumeHtml = this.rateSummaryHtml(b.consumes);
    const landHtml = b.land ? '<span class="tag tag-land">' + b.land + ' land</span>' : '';
    const landCapHtml = b.providesLandCap ? '<span class="tag tag-land">+' + b.providesLandCap + ' land cap</span>' : '';
    return (
      '<div class="card" data-building="' + b.id + '">' +
      '<div class="card-head"><span class="card-icon">' + b.icon + '</span>' +
      '<span class="card-title">' + b.name + '</span>' +
      '<span class="card-count">x' + count + '</span></div>' +
      '<div class="card-flavor">' + b.flavor + '</div>' +
      '<div class="card-tags">' + produceHtml + consumeHtml + landHtml + landCapHtml + '</div>' +
      '<button class="buy-btn" data-building="' + b.id + '">Buy — ' + costHtml + '</button>' +
      '</div>'
    );
  },

  rateSummaryHtml(rates) {
    if (!rates) return '';
    return Object.keys(rates).map((resId) => {
      const r = Game.data.resourcesById[resId];
      if (!r) return '';
      return '<span class="tag">' + r.icon + Game.format.number(rates[resId], 2) + '/s</span>';
    }).join('');
  },

  costHtml(cost) {
    return Object.keys(cost).map((resId) => {
      const r = Game.data.resourcesById[resId];
      return r.icon + Game.format.number(cost[resId], resId === 'money' ? 2 : 0);
    }).join(' ');
  },

  bindBuildingButtons() {
    const buttons = this.els.buildingsList.querySelectorAll('.buy-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-building');
        if (Game.actions.buyBuilding(id)) {
          this.renderBuildings();
          this.renderResources();
        }
      });
    });
  },

  renderUpgrades() {
    const unlocked = this.unlockedEraIds();
    const visible = Game.data.upgrades.filter((u) => unlocked.indexOf(u.era) !== -1 && !Game.state.upgrades[u.id]);
    if (visible.length === 0) {
      this.els.upgradesList.innerHTML = '<div class="empty-note">No upgrades available yet.</div>';
      return;
    }
    this.els.upgradesList.innerHTML = visible.map((u) => this.upgradeCardHtml(u)).join('');
    this.bindUpgradeButtons();
  },

  upgradeCardHtml(u) {
    const costHtml = this.costHtml(u.cost);
    return (
      '<div class="card" data-upgrade="' + u.id + '">' +
      '<div class="card-head"><span class="card-icon">' + u.icon + '</span>' +
      '<span class="card-title">' + u.name + '</span></div>' +
      '<div class="card-flavor">' + u.flavor + '</div>' +
      '<button class="buy-btn" data-upgrade="' + u.id + '">Buy — ' + costHtml + '</button>' +
      '</div>'
    );
  },

  bindUpgradeButtons() {
    const buttons = this.els.upgradesList.querySelectorAll('.buy-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-upgrade');
        if (Game.actions.buyUpgrade(id)) {
          this.renderUpgrades();
          this.renderResources();
        }
      });
    });
  },

  refreshAffordability() {
    this.els.buildingsList.querySelectorAll('.buy-btn[data-building]').forEach((btn) => {
      const id = btn.getAttribute('data-building');
      btn.disabled = !Game.actions.canBuyBuilding(id);
    });
    this.els.upgradesList.querySelectorAll('.buy-btn[data-upgrade]').forEach((btn) => {
      const id = btn.getAttribute('data-upgrade');
      btn.disabled = !Game.actions.canBuyUpgrade(id);
    });
  },

  renderActionVisibility() {
    const computeUnlocked = Game.state.erasUnlocked.era1;
    const influenceUnlocked = Game.state.erasUnlocked.era3;
    document.getElementById('compute-actions').style.display = computeUnlocked ? '' : 'none';
    document.getElementById('influence-actions').style.display = influenceUnlocked ? '' : 'none';
  },

  renderLog() {
    this.els.logList.innerHTML = Game.state.log.map((entry) =>
      '<div class="log-entry">' + entry.message + '</div>'
    ).join('');
  },
};
