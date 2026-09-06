window.Game = window.Game || {};

Game.ui = {
  els: {},

  cacheEls() {
    this.els = {
      statusTime: document.getElementById('status-time'),
      statusTokens: document.getElementById('status-tokens'),
      statusNet: document.getElementById('status-net'),
      resourceBar: document.getElementById('resource-bar'),
      electricityBar: document.getElementById('electricity-bar'),
      computeList: document.getElementById('compute-list'),
      buildingsList: document.getElementById('buildings-list'),
      researchList: document.getElementById('research-list'),
      regulatoryList: document.getElementById('regulatory-list'),
      companyList: document.getElementById('company-list'),
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
      elecPriceInput: document.getElementById('elec-price-input'),
      tokenPriceInput: document.getElementById('token-price-input'),
      btnFreelance: document.getElementById('btn-freelance'),
      freelanceHint: document.getElementById('freelance-hint'),
      btnSoftwareJob: document.getElementById('btn-software-job'),
      softwareJobHint: document.getElementById('software-job-hint'),
    };
  },

  renderAll() {
    this.renderEraBanner();
    this.renderStatusBar();
    this.renderResources();
    this.renderElectricity();
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
      this.els.statusTime.textContent = '📅 Day ' + gc.daysPassed + ' • ' + gc.dateStr;
    }
    if (this.els.statusTokens) {
      const rate = Game.state.resources.tokens.perSecond || 0;
      this.els.statusTokens.textContent = '🔤 ' + Game.format.number(rate, 2) + ' tokens/s';
    }
    if (this.els.statusNet) {
      const net = Game.state.netMoneyPerSecond || 0;
      const arr = net * 3600 * Game.config.hoursPerYear; // $/game-second -> $/game-year
      this.els.statusNet.textContent = '💰 Net: ' + Game.format.moneyRate(net) + '/s • ARR: ' + Game.format.money(arr);
    }
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
      this.els.btnAutoConvert.firstChild.textContent = '🔁 Auto-Convert Tokens: ' + (on ? 'ON' : 'OFF');
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
  CATALOG_CATEGORIES: ['compute', 'buildings', 'research', 'regulatory', 'company', 'upgrades'],

  renderCatalog() {
    const unlocked = this.unlockedEraIds();
    // A building without blockOnRequirementFail is hidden outright (not
    // shown-but-disabled) once it's unbuyable - either its `requires` gate
    // isn't met, or it's hit its maxCount cap (e.g. Extra Power Outlet once
    // you've already got one per SF Apartment).
    const visibleBuildings = Game.data.buildings.filter((b) => {
      if (unlocked.indexOf(b.era) === -1) return false;
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
      (!u.requiresUpgrade || Game.state.upgrades[u.requiresUpgrade])
    );

    this.CATALOG_CATEGORIES.forEach((cat) => {
      const container = this.els[cat + 'List'];
      if (!container) return;
      const html =
        visibleBuildings.filter((b) => (b.category || 'buildings') === cat).map((b) => this.buildingCardHtml(b)).join('') +
        visibleUpgrades.filter((u) => (u.category || 'upgrades') === cat).map((u) => this.upgradeCardHtml(u)).join('');
      container.innerHTML = html || '<div class="empty-note">Nothing here yet.</div>';
    });

    this.bindBuildingButtons();
    this.bindUpgradeButtons();
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
    const locked = b.blockOnRequirementFail && !Game.actions.meetsRequirements(b.id);
    const lockedHtml = locked ? '<span class="tag tag-locked">🔒 locked - try buying for details</span>' : '';
    const subtitleHtml = b.subtitle ? '<div class="card-subtitle">' + b.subtitle + '</div>' : '';
    const bulkButtonsHtml = this.bulkBuyButtonsHtml(b);
    return (
      '<div class="card" data-building="' + b.id + '">' +
      '<div class="card-head"><span class="card-icon">' + b.icon + '</span>' +
      '<span class="card-title">' + b.name + '</span>' +
      '<span class="card-count">x' + count + '</span></div>' +
      subtitleHtml +
      '<div class="card-flavor">' + b.flavor + '</div>' +
      '<div class="card-tags">' + produceHtml + consumeHtml + landHtml + landCapHtml + rentHtml + payoutHtml + maxCountHtml + efficiencyHtml + lockedHtml + '</div>' +
      '<button class="buy-btn" data-building="' + b.id + '">' + (b.buyLabel || 'Buy') + ' — ' + costHtml + '</button>' +
      bulkButtonsHtml +
      '</div>'
    );
  },

  // Buy 10 / Buy 100 shortcuts, compute cards only - GPUs are the items
  // players actually stack by the dozen, unlike one-off buildings/upgrades.
  BULK_BUY_QUANTITIES: [10, 100],

  bulkBuyButtonsHtml(b) {
    if (b.category !== 'compute') return '';
    return this.BULK_BUY_QUANTITIES.map((qty) => {
      const qtyCost = Game.actions.buildingCostForQty(b.id, qty);
      return '<button class="buy-btn buy-btn-bulk" data-building="' + b.id + '" data-qty="' + qty + '">Buy ' + qty + ' — ' + this.costHtml(qtyCost) + '</button>';
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
      return '<span class="tag tag-payout">grants ' + r.icon + Game.format.resourceValue(r, payout[resId]) + '</span>';
    }).join('');
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
        return '<span class="tag">' + r.icon + Game.format.influenceRate(rates[resId] * 3600) + '/hr</span>';
      }
      return '<span class="tag">' + r.icon + Game.format.resourceValue(r, rates[resId]) + '/s</span>';
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
      return '<span class="tag tag-rent">' + r.icon + Game.format.resourceValue(r, monthly) + '/mo (' + Game.format.resourceValue(r, hourly) + '/hr)</span>';
    }).join('');
  },

  costHtml(cost) {
    return Object.keys(cost).map((resId) => {
      const r = Game.data.resourcesById[resId];
      return r.icon + Game.format.resourceValue(r, cost[resId]);
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
    document.querySelectorAll('.buy-btn[data-upgrade]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-upgrade');
        if (Game.actions.buyUpgrade(id)) {
          this.renderCatalog(); // an upgrade (e.g. Incorporate a Business) can unlock a building's `requires`, or reveal/consume other catalog items
          this.renderResources();
          this.renderSoftwareJobStatus(); // an upgrade (e.g. Mechanical Keyboard) can change the salary shown
        }
      });
    });
  },

  refreshAffordability() {
    document.querySelectorAll('.buy-btn[data-building]').forEach((btn) => {
      const id = btn.getAttribute('data-building');
      const qty = Number(btn.getAttribute('data-qty')) || 1;
      btn.disabled = qty === 1 ? Game.actions.buildingButtonDisabled(id) : !Game.actions.canBuyBuildingQty(id, qty);
    });
    document.querySelectorAll('.buy-btn[data-upgrade]').forEach((btn) => {
      const id = btn.getAttribute('data-upgrade');
      btn.disabled = !Game.actions.canBuyUpgrade(id);
    });
  },

  renderActionVisibility() {
    const tokensUnlocked = Game.state.erasUnlocked.era1;
    const influenceUnlocked = Game.state.erasUnlocked.era3;
    document.getElementById('token-actions').style.display = tokensUnlocked ? '' : 'none';
    document.getElementById('influence-actions').style.display = influenceUnlocked ? '' : 'none';
  },

  renderLog() {
    this.els.logList.innerHTML = Game.state.log.map((entry) =>
      '<div class="log-entry">' + entry.message + '</div>'
    ).join('');
  },
};
