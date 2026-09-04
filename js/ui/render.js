window.Game = window.Game || {};

Game.ui = {
  els: {},

  cacheEls() {
    this.els = {
      statusTime: document.getElementById('status-time'),
      statusFlops: document.getElementById('status-flops'),
      resourceBar: document.getElementById('resource-bar'),
      electricityBar: document.getElementById('electricity-bar'),
      buildingsList: document.getElementById('buildings-list'),
      upgradesList: document.getElementById('upgrades-list'),
      logList: document.getElementById('log-list'),
      eraBanner: document.getElementById('era-banner'),
      btnAutoConvert: document.getElementById('btn-auto-convert'),
      allocSlider: document.getElementById('alloc-slider'),
      allocSellPct: document.getElementById('alloc-sell-pct'),
      allocTrainPct: document.getElementById('alloc-train-pct'),
      btnSchmooze: document.getElementById('btn-schmooze'),
      clockSpeedSlider: document.getElementById('clock-speed-slider'),
      clockSpeedLabel: document.getElementById('clock-speed-label'),
      btnFreelance: document.getElementById('btn-freelance'),
      freelanceHint: document.getElementById('freelance-hint'),
      btnSellTokens: document.getElementById('btn-sell-tokens'),
    };
  },

  renderAll() {
    this.renderEraBanner();
    this.renderStatusBar();
    this.renderResources();
    this.renderElectricity();
    this.renderBuildings();
    this.renderUpgrades();
    this.renderLog();
    this.renderActionVisibility();
    this.renderComputeControls();
    this.renderClockSpeedLabel();
    if (this.els.clockSpeedSlider) this.els.clockSpeedSlider.value = Game.state.clockSpeedMultiplier;
    this.renderFreelanceStatus();
  },

  // Cheap per-frame refresh: numbers + afford-state only, no DOM rebuild.
  renderFrame() {
    this.renderStatusBar();
    this.renderResources();
    this.renderElectricity();
    this.refreshAffordability();
    this.renderFreelanceStatus();
  },

  renderStatusBar() {
    if (this.els.statusTime) {
      const gc = Game.format.gameClock(Game.state.time.hours);
      this.els.statusTime.textContent = '📅 Day ' + gc.daysPassed + ' • ' + gc.dateStr;
    }
    if (this.els.statusFlops) {
      const rate = Game.state.resources.compute.perSecond || 0;
      this.els.statusFlops.textContent = '🧠 ' + Game.format.number(rate, 2) + ' FLOPS/s';
    }
  },

  // Synced on full renders only (see renderComputeControls comment) -
  // dragging the slider updates the label directly via main.js's 'input'
  // listener without going through here.
  renderClockSpeedLabel() {
    if (this.els.clockSpeedLabel) this.els.clockSpeedLabel.textContent = Game.state.clockSpeedMultiplier + 'x';
  },

  renderFreelanceStatus() {
    const remaining = Game.actions.freelanceShiftsRemaining();
    if (this.els.freelanceHint) {
      this.els.freelanceHint.textContent = '$' + Game.config.freelanceHourlyRate + '/click • ' + remaining + '/' + Game.config.freelanceMaxClicksPerDay + ' shifts left today';
    }
    if (this.els.btnFreelance) this.els.btnFreelance.disabled = remaining <= 0;
  },

  // trainAllocationPct/autoConvertEnabled sync to the DOM - called on full
  // renders (load, import, toggle) but not every tick, so it never fights
  // the player while they're dragging the slider.
  renderComputeControls() {
    if (this.els.btnAutoConvert) {
      const on = Game.state.autoConvertEnabled;
      this.els.btnAutoConvert.classList.toggle('active', on);
      this.els.btnAutoConvert.firstChild.textContent = '🔁 Auto-Convert Compute: ' + (on ? 'ON' : 'OFF');
    }
    this.renderAllocLabels();
    if (this.els.allocSlider) this.els.allocSlider.value = Game.state.trainAllocationPct;
  },

  renderAllocLabels() {
    const trainPct = Game.state.trainAllocationPct;
    if (this.els.allocSellPct) this.els.allocSellPct.textContent = String(100 - trainPct);
    if (this.els.allocTrainPct) this.els.allocTrainPct.textContent = String(trainPct);
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
      let symbolHtml = '<span class="res-symbol">' + r.symbol + '</span>';
      if (r.kind === 'capacity') {
        valueHtml = Game.format.number(res.used, 0) + ' / ' + Game.format.number(res.cap, 0);
        if (r.secondaryUnit) {
          const f = r.secondaryUnit.factor;
          valueHtml += ' <span class="rate-suffix">(' + Game.format.number(res.used * f, 0) + ' / ' + Game.format.number(res.cap * f, 0) + ' ' + r.secondaryUnit.label + ')</span>';
        }
      } else if (r.kind === 'flow') {
        valueHtml = Game.format.number(res.consumed, 1) + ' / ' + Game.format.number(res.generated, 1);
      } else {
        valueHtml = Game.format.resourceValue(r, res.amount);
        if (r.format === 'currency') symbolHtml = ''; // $ already embedded in the value
        if (r.showRate) {
          valueHtml += ' <span class="rate-suffix">(+' + Game.format.number(res.perSecond || 0, 2) + '/s)</span>';
        }
      }
      return (
        '<div class="resource-chip" title="' + r.name + '">' +
        '<span class="res-icon">' + r.icon + '</span>' +
        '<span class="res-value">' + valueHtml + '</span>' +
        symbolHtml +
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
      ' • ' + Game.format.money(elec.billPerHour || 0) + '/hr @ ' + Game.format.money(Game.config.electricityPricePerKwh) + '/kWh' +
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
    const landHtml = b.land ? '<span class="tag tag-land">' + b.land + ' acre' + (b.land === 1 ? '' : 's') + '</span>' : '';
    const landCapHtml = b.providesLandCap ? '<span class="tag tag-land">+' + b.providesLandCap + ' acre' + (b.providesLandCap === 1 ? '' : 's') + ' cap</span>' : '';
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
      return '<span class="tag">' + r.icon + Game.format.resourceValue(r, rates[resId]) + '/s</span>';
    }).join('');
  },

  costHtml(cost) {
    return Object.keys(cost).map((resId) => {
      const r = Game.data.resourcesById[resId];
      return r.icon + Game.format.resourceValue(r, cost[resId]);
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
    const costHtml = this.costHtml(Game.actions.upgradeCost(u.id));
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
    if (this.els.btnSellTokens) this.els.btnSellTokens.disabled = Game.state.resources.tokens.amount <= 0;
  },

  renderActionVisibility() {
    const computeUnlocked = Game.state.erasUnlocked.era1;
    const influenceUnlocked = Game.state.erasUnlocked.era3;
    document.getElementById('compute-actions').style.display = computeUnlocked ? '' : 'none';
    document.getElementById('token-actions').style.display = computeUnlocked ? '' : 'none';
    document.getElementById('influence-actions').style.display = influenceUnlocked ? '' : 'none';
  },

  renderLog() {
    this.els.logList.innerHTML = Game.state.log.map((entry) =>
      '<div class="log-entry">' + entry.message + '</div>'
    ).join('');
  },
};
