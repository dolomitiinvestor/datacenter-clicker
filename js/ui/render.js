window.Game = window.Game || {};

Game.ui = {
  els: {},

  cacheEls() {
    this.els = {
      statusTime: document.getElementById('status-time'),
      statusTokens: document.getElementById('status-tokens'),
      statusNet: document.getElementById('status-net'),
      statusGdp: document.getElementById('status-gdp'),
      statusUsElec: document.getElementById('status-us-elec'),
      resourceBar: document.getElementById('resource-bar'),
      electricityBar: document.getElementById('electricity-bar'),
      waterBar: document.getElementById('water-bar'),
      computeList: document.getElementById('compute-list'),
      buildingsList: document.getElementById('buildings-list'),
      powerList: document.getElementById('power-list'),
      researchList: document.getElementById('research-list'),
      regulatoryList: document.getElementById('regulatory-list'),
      companyList: document.getElementById('company-list'),
      quantumList: document.getElementById('quantum-list'),
      configurationsList: document.getElementById('configurations-list'),
      upgradesList: document.getElementById('upgrades-list'),
      btnToggleHidden: document.getElementById('btn-toggle-hidden'),
      logList: document.getElementById('log-list'),
      eraBanner: document.getElementById('era-banner'),
      modelBanner: document.getElementById('model-banner'),
      btnAutoConvert: document.getElementById('btn-auto-convert'),
      allocSlider: document.getElementById('alloc-slider'),
      allocSellPct: document.getElementById('alloc-sell-pct'),
      allocTrainPct: document.getElementById('alloc-train-pct'),
      clockSpeedSlider: document.getElementById('clock-speed-slider'),
      clockSpeedLabel: document.getElementById('clock-speed-label'),
      elecPriceInput: document.getElementById('elec-price-input'),
      tokenPriceInput: document.getElementById('token-price-input'),
      btnFreelance: document.getElementById('btn-freelance'),
      freelanceHint: document.getElementById('freelance-hint'),
      btnSoftwareJob: document.getElementById('btn-software-job'),
      softwareJobHint: document.getElementById('software-job-hint'),
    };
  },

  // Session-only (not persisted) - whether hidden/minimized cards are
  // currently shown, dimmed, alongside the normal catalog. See
  // actions.hideTile/unhideTile and state.hiddenTiles for the persisted
  // per-tile flag this toggles the visibility of.
  showHidden: false,

  renderAll() {
    this.renderEraBanner();
    this.renderModelBanner();
    this.renderStatusBar();
    this.renderResources();
    this.renderElectricity();
    this.renderWater();
    this.renderCatalog();
    this.renderLog();
    this.renderActionVisibility();
    this.renderTokenControls();
    this.renderClockSpeedLabel();
    if (this.els.clockSpeedSlider) this.els.clockSpeedSlider.value = Game.state.clockSpeedMultiplier;
    if (this.els.elecPriceInput) this.els.elecPriceInput.value = Game.state.electricityPricePerKwh;
    if (this.els.tokenPriceInput) this.els.tokenPriceInput.value = Game.state.tokensPricePerMillion;
    this.renderFreelanceStatus();
    this.renderSoftwareJobStatus();
  },

  // Cheap per-frame refresh: numbers + afford-state only, no DOM rebuild.
  renderFrame() {
    this.renderStatusBar();
    this.renderResources();
    this.renderElectricity();
    this.renderWater();
    this.refreshAffordability();
    this.renderFreelanceStatus();
  },

  // Generic popup alert - call from anywhere (Game.ui.showAlert('Title',
  // 'message')) to interrupt the player with something they need to see,
  // not just a blocked purchase. Dismissed via #alert-ok-btn in main.js.
  showAlert(title, message) {
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    document.getElementById('alert-overlay').hidden = false;
  },

  hideAlert() {
    document.getElementById('alert-overlay').hidden = true;
  },

  renderStatusBar() {
    if (this.els.statusTime) {
      const gc = Game.format.gameClock(Game.state.time.hours);
      this.els.statusTime.textContent = 'Day ' + gc.daysPassed + ' • ' + gc.dateStr;
    }
    if (this.els.statusTokens) {
      const rate = Game.state.resources.tokens.perSecond || 0;
      this.els.statusTokens.textContent = Game.format.number(rate, 2) + ' tokens/s';
    }
    let arr = 0;
    if (this.els.statusNet) {
      const net = Game.state.netMoneyPerSecond || 0;
      arr = net * 3600 * Game.config.hoursPerYear; // $/game-second -> $/game-year
      this.els.statusNet.textContent = 'Net: ' + Game.format.moneyRateCompact(net) + '/s • ARR: ' + Game.format.moneyCompact(arr);
    }
    if (this.els.statusGdp) {
      const pct = (arr / Game.config.usGdpAnnual) * 100;
      this.els.statusGdp.textContent = Game.format.number(pct, 4) + '% of US GDP';
    }
    if (this.els.statusUsElec) {
      const elec = Game.state.resources.electricity;
      const annualKwh = elec.consumed * Game.config.hoursPerYear;
      const pct = (annualKwh / Game.config.usElectricityAnnualKwh) * 100;
      this.els.statusUsElec.textContent = Game.format.number(pct, 4) + '% of US electricity';
    }
  },

  renderWater() {
    if (!this.els.waterBar) return;
    const water = Game.state.resources.water;
    if (!Game.state.erasUnlocked[Game.data.resourcesById.water.unlockEra]) {
      this.els.waterBar.innerHTML = '';
      return;
    }
    const pct = water.generated > 0 ? Math.min(100, (water.consumed / water.generated) * 100) : 0;
    const shortage = water.throttle < 0.999;
    this.els.waterBar.innerHTML =
      '<div class="bar-track"><div class="bar-fill' + (shortage ? ' brownout' : '') + '" style="width:' + pct + '%"></div></div>' +
      '<div class="bar-label">' + Game.format.number(water.consumed, 1) + ' / ' + Game.format.number(water.generated, 1) + ' gal/s' +
      (shortage ? ' — WATER SHORTAGE (' + Math.round(water.throttle * 100) + '% output)' : '') + '</div>';
  },

  // Synced on full renders only (see renderTokenControls comment) -
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

  renderSoftwareJobStatus() {
    const on = Game.state.softwareJobEnabled;
    const salary = Game.actions.softwareJobSalary();
    const hourly = salary / Game.config.hoursPerYear;
    if (this.els.btnSoftwareJob) this.els.btnSoftwareJob.classList.toggle('active', on);
    if (this.els.softwareJobHint) {
      this.els.softwareJobHint.textContent = '$' + Game.format.number(salary, 0) + '/yr (' + Game.format.money(hourly) + '/hr) • ' + (on ? 'ON' : 'OFF');
    }
  },

  // trainAllocationPct/autoConvertEnabled sync to the DOM - called on full
  // renders (load, import, toggle) but not every tick, so it never fights
  // the player while they're dragging the slider.
  renderTokenControls() {
    if (this.els.btnAutoConvert) {
      const on = Game.state.autoConvertEnabled;
      this.els.btnAutoConvert.classList.toggle('active', on);
      this.els.btnAutoConvert.firstChild.textContent = 'Auto-Convert Tokens: ' + (on ? 'ON' : 'OFF');
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

  renderModelBanner() {
    if (!this.els.modelBanner) return;
    const model = Game.actions.currentModelName();
    this.els.modelBanner.innerHTML = model ? '<span class="model-name">' + model + '</span>' : '';
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
        if (r.id === 'electricity') {
          const u = Game.format.powerUnit(res.generated);
          valueHtml = Game.format.number(res.consumed / u.div, 1) + ' / ' + Game.format.number(res.generated / u.div, 1);
          symbolHtml = '<span class="res-symbol">' + u.unit + '</span>';
        } else {
          valueHtml = Game.format.number(res.consumed, 1) + ' / ' + Game.format.number(res.generated, 1);
        }
      } else {
        valueHtml = Game.format.resourceValue(r, res.amount);
        if (r.format === 'currency') symbolHtml = ''; // $ already embedded in the value
        if (r.showRate) {
          valueHtml += ' <span class="rate-suffix">(+' + Game.format.number(res.perSecond || 0, 2) + '/s)</span>';
        }
      }
      return (
        '<div class="resource-chip" title="' + r.name + '">' +
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
    const u = Game.format.powerUnit(elec.generated);
    this.els.electricityBar.innerHTML =
      '<div class="bar-track"><div class="bar-fill' + (brownout ? ' brownout' : '') + '" style="width:' + pct + '%"></div></div>' +
      '<div class="bar-label">' + Game.format.number(elec.consumed / u.div, 1) + ' / ' + Game.format.number(elec.generated / u.div, 1) + ' ' + u.unit +
      ' • ' + Game.format.money(elec.billPerHour || 0) + '/hr @ ' + Game.format.money(Game.state.electricityPricePerKwh) + '/kWh' +
      (brownout ? ' — BROWNOUT (' + Math.round(elec.throttle * 100) + '% output)' : '') + '</div>';
  },

  unlockedEraIds() {
    return Object.keys(Game.state.erasUnlocked).filter((id) => Game.state.erasUnlocked[id]);
  },

  // Buildings and upgrades are two different data sources but share one
  // set of catalog columns (compute/buildings/research/regulatory/
  // upgrades), grouped by each item's own `category` field - e.g. Train
  // New Model (an upgrade) renders in the same Research column as Publish
  // arXiv Paper (a building).
  CATALOG_CATEGORIES: ['compute', 'buildings', 'power', 'research', 'regulatory', 'company', 'quantum', 'configurations', 'upgrades'],

  renderCatalog() {
    const unlocked = this.unlockedEraIds();
    // A building without blockOnRequirementFail is hidden outright (not
    // shown-but-disabled) once it's unbuyable - either its `requires` gate
    // isn't met, or it's hit its maxCount cap (e.g. Extra Power Outlet once
    // you've already got one per SF Apartment).
    const visibleBuildings = Game.data.buildings.filter((b) => {
      if (unlocked.indexOf(b.era) === -1) return false;
      if (Game.state.hiddenTiles[b.id] && !this.showHidden) return false;
      if (!Game.actions.meetsHardRequirements(b.id)) return false;
      if (b.blockOnRequirementFail) return true;
      if (!Game.actions.meetsRequirements(b.id)) return false;
      if (b.maxOwned !== undefined && (Game.state.buildings[b.id] || 0) >= b.maxOwned) return false;
      if (b.maxCount) {
        const limit = (Game.state.buildings[b.maxCount.buildingId] || 0) * (b.maxCount.per || 1);
        if ((Game.state.buildings[b.id] || 0) >= limit) return false;
      }
      return true;
    });
    const visibleUpgrades = Game.data.upgrades.filter((u) =>
      unlocked.indexOf(u.era) !== -1 &&
      !Game.state.upgrades[u.id] &&
      (!Game.state.hiddenTiles[u.id] || this.showHidden) &&
      (!u.requiresUpgrade || Game.state.upgrades[u.requiresUpgrade]) &&
      Game.actions.meetsRequirementsList(u.requires)
    );

    const hiddenCount = Object.keys(Game.state.hiddenTiles).length;
    if (this.els.btnToggleHidden) {
      this.els.btnToggleHidden.textContent = (this.showHidden ? 'Hide minimized' : 'Show minimized') + ' (' + hiddenCount + ')';
      this.els.btnToggleHidden.hidden = hiddenCount === 0;
    }

    this.CATALOG_CATEGORIES.forEach((cat) => {
      const container = this.els[cat + 'List'];
      if (!container) return;
      const html =
        visibleBuildings.filter((b) => (b.category || 'buildings') === cat).map((b) => this.buildingCardHtml(b)).join('') +
        visibleUpgrades.filter((u) => (u.category || 'upgrades') === cat).map((u) => this.upgradeCardHtml(u)).join('');
      container.innerHTML = html || '<div class="empty-note">Nothing here yet.</div>';
    });

    this.bindBuildingButtons();
    this.bindSellButtons();
    this.bindUpgradeButtons();
    this.bindHideButtons();
  },

  buildingCardHtml(b) {
    const count = Game.state.buildings[b.id] || 0;
    const cost = Game.actions.buildingCost(b.id);
    const costHtml = this.costHtml(cost);
    const produceHtml = this.rateSummaryHtml(b.produces);
    const consumeHtml = this.rateSummaryHtml(b.consumes);
    const landHtml = b.land ? '<span class="tag tag-land">' + b.land + ' acre' + (b.land === 1 ? '' : 's') + '</span>' : '';
    const landCapHtml = b.providesLandCap ? '<span class="tag tag-land">+' + this.acresAndSqft(b.providesLandCap) + ' cap</span>' : '';
    const rentHtml = this.rentSummaryHtml(b.rentPerMonth);
    const payoutHtml = this.payoutSummaryHtml(b.payout);
    const maxCountHtml = this.maxCountSummaryHtml(b.maxCount);
    const efficiencyHtml = this.tokenEfficiencyHtml(b, cost);
    const powerEfficiencyHtml = this.powerEfficiencyHtml(b);
    const locked = b.blockOnRequirementFail && !Game.actions.meetsRequirements(b.id);
    const lockedHtml = locked ? '<span class="tag tag-locked">locked - try buying for details</span>' : '';
    const subtitleHtml = b.subtitle ? '<div class="card-subtitle">' + b.subtitle + '</div>' : '';
    const bulkButtonsHtml = this.bulkBuyButtonsHtml(b);
    const hidden = !!Game.state.hiddenTiles[b.id];
    const hideBtnHtml = this.hideButtonHtml(b.id, hidden);
    const sellBtnHtml = this.sellButtonHtml(b, count);
    return (
      '<div class="card' + (hidden ? ' card-hidden' : '') + '" data-building="' + b.id + '">' +
      '<div class="card-head">' +
      '<span class="card-title">' + b.name + '</span>' +
      '<span class="card-count">x' + count + '</span>' + hideBtnHtml + '</div>' +
      subtitleHtml +
      '<div class="card-flavor">' + b.flavor + '</div>' +
      '<div class="card-tags">' + produceHtml + consumeHtml + landHtml + landCapHtml + rentHtml + payoutHtml + maxCountHtml + efficiencyHtml + powerEfficiencyHtml + lockedHtml + '</div>' +
      '<button class="buy-btn" data-building="' + b.id + '">' + (b.buyLabel || 'Buy') + ' — ' + costHtml + '</button>' +
      bulkButtonsHtml +
      sellBtnHtml +
      '</div>'
    );
  },

  // Shown only once you own at least one - lets you back out of a
  // purchase (e.g. one whose upkeep just dragged net ARR negative) for a
  // partial refund. See actions.sellBuilding.
  sellButtonHtml(b, count) {
    if (count <= 0) return '';
    const refundHtml = this.costHtml(Game.actions.sellRefund(b.id));
    return '<button class="sell-btn" data-sell="' + b.id + '">Sell 1 — refund ' + refundHtml + '</button>';
  },

  // Small "minimize"/"restore" toggle in a card's header - see
  // actions.hideTile/unhideTile. Purely a display preference.
  hideButtonHtml(id, hidden) {
    return hidden
      ? '<button class="card-hide-btn" data-unhide="' + id + '" title="Restore this card">↺</button>'
      : '<button class="card-hide-btn" data-hide="' + id + '" title="Minimize - I\'m not using this anymore">×</button>';
  },

  bindHideButtons() {
    document.querySelectorAll('[data-hide]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Game.actions.hideTile(btn.getAttribute('data-hide'));
        this.renderCatalog();
      });
    });
    document.querySelectorAll('[data-unhide]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        Game.actions.unhideTile(btn.getAttribute('data-unhide'));
        this.renderCatalog();
      });
    });
  },

  // Buy 10/100/1000/10,000/100,000 shortcuts, compute cards only - GPUs are
  // the items players actually stack by the thousands late-game. Everything
  // past 10 stays hidden until actually affordable so they don't clutter
  // every card with options nobody can use yet - kept live (re-checked
  // every frame in refreshAffordability, not just on catalog rebuilds) so
  // they pop in/out as cash crosses the threshold. Buy 10 always shows,
  // just disabled.
  BULK_BUY_QUANTITIES: [10, 100, 1000, 10000, 100000],

  bulkBuyButtonsHtml(b) {
    if (b.category !== 'compute') return '';
    return this.BULK_BUY_QUANTITIES.map((qty) => {
      const qtyCost = Game.actions.buildingCostForQty(b.id, qty);
      const hiddenAttr = (qty > 10 && !Game.actions.canBuyBuildingQty(b.id, qty)) ? ' hidden' : '';
      return '<button class="buy-btn buy-btn-bulk" data-building="' + b.id + '" data-qty="' + qty + '"' + hiddenAttr + '>Buy ' + qty + ' — ' + this.costHtml(qtyCost) + '</button>';
    }).join('');
  },

  // Tokens/s per $ spent (at the current, cost-scaled price) and
  // tokens/kWh consumed - shown on every token-generating item so
  // efficiency is directly comparable across GPU classes.
  tokenEfficiencyHtml(b, cost) {
    if (!b.produces || !b.produces.tokens) return '';
    let html = '';
    if (cost.money > 0) {
      const perDollar = b.produces.tokens / cost.money;
      html += '<span class="tag tag-efficiency">' + Game.format.number(perDollar, 4) + ' tok/s per $</span>';
    }
    if (b.consumes && b.consumes.electricity) {
      const perKwh = (b.produces.tokens * 3600) / b.consumes.electricity;
      html += '<span class="tag tag-efficiency">' + Game.format.number(perKwh, 0) + ' tok/kWh</span>';
    }
    return html;
  },

  // $/MWh of ongoing operating cost (fuel + O&M, i.e. rentPerMonth) per MW
  // of capacity - shown on every power-generation card so a gas turbine's
  // fuel bill is directly comparable to solar's near-zero opex or a
  // reactor's fuel+O&M, independent of the separate per-kWh utility bill
  // (electricityPricePerKwh) you pay on whatever you actually draw.
  powerEfficiencyHtml(b) {
    if (b.category !== 'power' || !b.produces || !b.produces.electricity) return '';
    const mw = b.produces.electricity / 1000;
    if (mw <= 0) return '';
    const hourlyCost = (b.rentPerMonth && b.rentPerMonth.money) ? b.rentPerMonth.money / Game.config.hoursPerMonth : 0;
    const perMwh = hourlyCost / mw;
    return '<span class="tag tag-efficiency">' + Game.format.money(perMwh) + '/MWh</span>';
  },

  // Small acreages (e.g. a 200 sqft apartment's land cap) are unreadable as
  // raw decimal acres, so always pair the acre figure with its sqft
  // equivalent - same idea as the land resource's own secondaryUnit display.
  acresAndSqft(acres) {
    return Game.format.number(acres, 4) + ' acres (' + Game.format.number(acres * 43560, 0) + ' sqft)';
  },

  maxCountSummaryHtml(maxCount) {
    if (!maxCount) return '';
    const b = Game.data.buildingsById[maxCount.buildingId];
    const label = maxCount.per === 1 ? '1 per ' + b.name : maxCount.per + ' per ' + b.name;
    return '<span class="tag tag-rent">max ' + label + '</span>';
  },

  // payout is a one-time grant on purchase, not an ongoing rate - shown
  // with a "grants" prefix so it doesn't read like a /s production tag.
  payoutSummaryHtml(payout) {
    if (!payout) return '';
    return Object.keys(payout).map((resId) => {
      const r = Game.data.resourcesById[resId];
      if (!r) return '';
      return '<span class="tag tag-payout">grants ' + this.amountWithUnit(r, payout[resId]) + '</span>';
    }).join('');
  },

  // A resource amount with its unit label attached - money's $ is already
  // embedded by format.resourceValue(), everything else gets its plain-text
  // symbol appended (e.g. "25K RP", "150 acres", "20K tokens").
  amountWithUnit(r, amount) {
    const val = Game.format.resourceValue(r, amount);
    return r.format === 'currency' ? val : val + ' ' + r.symbol;
  },

  rateSummaryHtml(rates) {
    if (!rates) return '';
    return Object.keys(rates).map((resId) => {
      const r = Game.data.resourcesById[resId];
      if (!r) return '';
      // Government/influence points are tiny per-second, so they're shown
      // per-hour instead - always fixed to one decimal (see
      // format.influenceRate) so the display never jumps precision.
      if (resId === 'influence') {
        return '<span class="tag">' + Game.format.influenceRate(rates[resId] * 3600) + ' ' + r.symbol + '/hr</span>';
      }
      return '<span class="tag">' + this.amountWithUnit(r, rates[resId]) + '/s</span>';
    }).join('');
  },

  // rentPerMonth is stored as a natural monthly figure - shown alongside
  // the hourly rate it's actually billed at (config.hoursPerMonth).
  rentSummaryHtml(rentPerMonth) {
    if (!rentPerMonth) return '';
    return Object.keys(rentPerMonth).map((resId) => {
      const r = Game.data.resourcesById[resId];
      if (!r) return '';
      const monthly = rentPerMonth[resId];
      const hourly = monthly / Game.config.hoursPerMonth;
      return '<span class="tag tag-rent">' + this.amountWithUnit(r, monthly) + '/mo (' + this.amountWithUnit(r, hourly) + '/hr)</span>';
    }).join('');
  },

  costHtml(cost) {
    return Object.keys(cost).map((resId) => {
      const r = Game.data.resourcesById[resId];
      return this.amountWithUnit(r, cost[resId]);
    }).join(' ');
  },

  bindBuildingButtons() {
    document.querySelectorAll('.buy-btn[data-building]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-building');
        const qty = Number(btn.getAttribute('data-qty')) || 1;
        const def = Game.data.buildingsById[id];
        if (qty === 1 && def.blockOnRequirementFail && !Game.actions.meetsRequirements(id)) {
          if (!Game.state.seenAlerts[id]) {
            Game.state.seenAlerts[id] = true;
            this.showAlert(def.name + ' — Blocked', def.blockedMessage || 'Not available yet.');
          }
          return;
        }
        const bought = qty === 1 ? Game.actions.buyBuilding(id) : Game.actions.buyBuildingQty(id, qty);
        if (bought) {
          this.renderCatalog();
          this.renderResources();
        }
      });
    });
  },

  bindSellButtons() {
    document.querySelectorAll('[data-sell]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-sell');
        if (Game.actions.sellBuilding(id)) {
          this.renderCatalog();
          this.renderResources();
        }
      });
    });
  },

  upgradeCardHtml(u) {
    const costHtml = this.costHtml(Game.actions.upgradeCost(u.id));
    const hidden = !!Game.state.hiddenTiles[u.id];
    const hideBtnHtml = this.hideButtonHtml(u.id, hidden);
    const profitHtml = u.annualProfit
      ? '<div class="card-tags"><span class="tag tag-payout">grants ' + Game.format.moneyCompact(u.annualProfit) + '/yr ARR</span></div>'
      : '';
    return (
      '<div class="card' + (hidden ? ' card-hidden' : '') + '" data-upgrade="' + u.id + '">' +
      '<div class="card-head">' +
      '<span class="card-title">' + u.name + '</span>' + hideBtnHtml + '</div>' +
      '<div class="card-flavor">' + u.flavor + '</div>' +
      profitHtml +
      '<button class="buy-btn" data-upgrade="' + u.id + '">Buy — ' + costHtml + '</button>' +
      '</div>'
    );
  },

  bindUpgradeButtons() {
    document.querySelectorAll('.buy-btn[data-upgrade]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-upgrade');
        if (Game.actions.buyUpgrade(id)) {
          this.renderCatalog(); // an upgrade (e.g. Incorporate a Business) can unlock a building's `requires`, or reveal/consume other catalog items
          this.renderResources();
          this.renderSoftwareJobStatus(); // an upgrade (e.g. Mechanical Keyboard) can change the salary shown
          this.renderModelBanner(); // a Train New Model tier changes the header's current-model display
        }
      });
    });
  },

  refreshAffordability() {
    document.querySelectorAll('.buy-btn[data-building]').forEach((btn) => {
      const id = btn.getAttribute('data-building');
      const qty = Number(btn.getAttribute('data-qty')) || 1;
      const canBuy = qty === 1 ? !Game.actions.buildingButtonDisabled(id) : Game.actions.canBuyBuildingQty(id, qty);
      btn.disabled = !canBuy;
      if (qty > 10) btn.hidden = !canBuy; // Buy 100/1000: hide (not just disable) once unaffordable
    });
    document.querySelectorAll('.buy-btn[data-upgrade]').forEach((btn) => {
      const id = btn.getAttribute('data-upgrade');
      btn.disabled = !Game.actions.canBuyUpgrade(id);
    });
  },

  renderActionVisibility() {
    const tokensUnlocked = Game.state.erasUnlocked.era1;
    document.getElementById('token-actions').style.display = tokensUnlocked ? '' : 'none';
  },

  renderLog() {
    this.els.logList.innerHTML = Game.state.log.map((entry) =>
      '<div class="log-entry">' + entry.message + '</div>'
    ).join('');
  },
};
