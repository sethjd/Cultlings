(function () {
  const C = window.Cultlings = window.Cultlings || {};
  let rootElement = null;
  let countdownTimer = null;
  let activeTab = "overview";
  let multiplayerCults = [];
  let multiplayerInbox = [];
  let multiplayerLoaded = false;
  let multiplayerLoading = false;
  let multiplayerError = "";

  function affordableUpgradeCount() {
    return Object.entries(C.DATA.buildings).filter(([key, building]) => (
      C.store.isUnlocked(building.requiredRank) &&
      C.store.canAfford(C.store.getUpgradeCost(key))
    )).length;
  }

  function moodClass(follower) {
    return C.store.getMoodLabel(follower).toLowerCase();
  }

  function jobOptions(follower) {
    return Object.entries(C.DATA.jobs).map(([key, job]) => (
      `<option value="${key}" ${follower.job === key ? "selected" : ""}>${job.name}</option>`
    )).join("");
  }

  function followerMarkup(follower, index) {
    const jobsUnlocked = C.store.isUnlocked(5);
    const mood = C.store.getMoodLabel(follower);
    return `
      <article class="follower-card follower-card-expanded" data-follower-detail="${follower.id}"
        role="button" tabindex="0" style="--follower-color:${follower.color}; --delay:${index * -0.25}s">
        <div class="follower-avatar" aria-hidden="true">
          <i class="follower-ear ear-left"></i>
          <i class="follower-ear ear-right"></i>
          <i class="follower-eye eye-left"></i>
          <i class="follower-eye eye-right"></i>
        </div>
        <div class="follower-copy">
          <div class="follower-name-row">
            <strong>${follower.name}</strong>
            <span class="mood-badge mood-${moodClass(follower)}">${mood}</span>
          </div>
          <span>${follower.trait}</span>
          <small>${C.DATA.traits.find((trait) => trait.name === follower.trait).detail}</small>
          <label class="job-select-label">
            <span>Job</span>
            <select data-follower-job="${follower.id}" ${jobsUnlocked ? "" : "disabled"}>
              ${jobOptions(follower)}
            </select>
          </label>
        </div>
      </article>
    `;
  }

  function overviewMarkup() {
    const state = C.store.state;
    const rank = C.store.getRankProgress();
    const rates = C.store.getProductionRates();
    const lowFood = state.resources.food < Math.max(5, state.followers.length);
    const unhappy = state.followers.filter((follower) => C.store.getMoodLabel(follower) === "Unhappy").length;

    return `
      <section class="camp-tab-panel" data-panel="overview">
        <article class="rank-card">
          <div class="rank-orb"><strong>${rank.rank}</strong><span>Rank</span></div>
          <div class="rank-copy">
            <div><strong>Godling Rank ${rank.rank}</strong><span>${state.xp} total XP</span></div>
            <div class="xp-track"><i style="width:${C.Helpers.clamp(rank.percent, 0, 100)}%"></i></div>
            <small>${rank.next ? `${rank.current}/${rank.needed} XP to Rank ${rank.next.rank}: ${rank.next.unlock}` : "Maximum prototype rank reached"}</small>
          </div>
        </article>

        ${lowFood ? `<div class="camp-warning">The pantry echoes. Hungry followers work slowly and become unhappy.</div>` : ""}
        ${unhappy ? `<div class="camp-warning">${unhappy} follower${unhappy === 1 ? " is" : "s are"} unhappy. Food, housing, and rest will help.</div>` : ""}

        <section class="camp-map camp-map-compact ${Date.now() < state.ritualBoostUntil ? "ritual-is-active" : ""}" aria-label="Cult camp">
          <div class="camp-sky" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="purple-smoke smoke-one" aria-hidden="true"></div>
          <div class="purple-smoke smoke-two" aria-hidden="true"></div>
          <button class="landmark shrine-landmark camp-map-button" data-building-detail="shrine" aria-label="Open Moon Shrine">
            <span class="shrine-moon"></span><span class="shrine-roof"></span>
            <span class="shrine-door"></span><span class="landmark-label">Moon Shrine</span>
          </button>
          <button class="hut-row camp-map-button" data-building-detail="huts" aria-label="Open Follower Huts">
            <div class="hut hut-one"><i></i></div>
            <div class="hut hut-two"><i></i></div>
            <div class="hut hut-three"><i></i></div>
          </button>
          <button class="ritual-landmark camp-map-button" data-building-detail="ritual" aria-label="Open Ritual Circle">
            <span class="ritual-rune">&#9790;</span>
            <i class="ritual-candle candle-a"></i>
            <i class="ritual-candle candle-b"></i>
            <i class="ritual-candle candle-c"></i>
          </button>
          <div class="camp-followers">
            ${state.followers.slice(0, 8).map((follower, index) => (
              `<button class="camp-follower-dot" data-follower-detail="${follower.id}"
                aria-label="Open ${C.UI.escapeHtml(follower.name)}"
                style="--x:${14 + ((index * 23) % 74)}%;--y:${58 + ((index * 17) % 27)}%;--c:${follower.color};--d:${index * -0.25}s"></button>`
            )).join("")}
          </div>
        </section>

        <div class="production-grid">
          <article><span>Devotion</span><strong>+${rates.devotion.toFixed(2)}/s</strong></article>
          <article><span>Food</span><strong>+${rates.food.toFixed(2)}/s</strong></article>
          <article><span>Cursed Wood</span><strong>+${rates.wood.toFixed(2)}/s</strong></article>
          <article><span>Bone Shards</span><strong>+${rates.bones.toFixed(2)}/s</strong></article>
        </div>

        <div class="camp-stat-strip camp-stat-strip-wide">
          <div><span>Followers</span><strong>${state.followers.length}/${C.store.getFollowerCapacity()}</strong></div>
          <div><span>Food use</span><strong>-${C.store.getFoodUseRate().toFixed(2)}/s</strong></div>
          <div><span>Raid fatigue</span><strong>${state.raidFatigue.toFixed(1)}/4</strong></div>
        </div>
      </section>
    `;
  }

  function followersMarkup() {
    const unlocked = C.store.isUnlocked(5);
    return `
      <section class="camp-tab-panel" data-panel="followers">
        <div class="tab-intro">
          <div>
            <p class="eyebrow">Mostly willing</p>
            <h2>Followers</h2>
          </div>
          <strong>${C.store.state.followers.length}/${C.store.getFollowerCapacity()}</strong>
        </div>
        ${unlocked
          ? `<p class="tab-help">Assign jobs to balance camp production. Traits and mood change each follower's output.</p>`
          : `<div class="unlock-banner">Follower jobs unlock at Godling Rank 5. Until then, everyone worships.</div>`}
        <div class="follower-list follower-grid">${C.store.state.followers.map(followerMarkup).join("")}</div>
      </section>
    `;
  }

  function buildingsMarkup() {
    const rank = C.store.getRank();
    return `
      <section class="camp-tab-panel" data-panel="buildings">
        <div class="tab-intro">
          <div><p class="eyebrow">Make it wobblier</p><h2>Buildings</h2></div>
          <strong>Rank ${rank}</strong>
        </div>
        <p class="tab-help">Upgrades award ${C.DATA.xpRewards.building} XP and immediately improve the camp or future raids.</p>
        <div class="building-list">
          ${Object.entries(C.DATA.buildings).map(([key, building]) => {
            const level = C.store.state.buildings[key];
            const locked = rank < building.requiredRank;
            const cost = C.store.getUpgradeCost(key);
            const affordable = C.store.canAfford(cost);
            return `
              <article class="upgrade-card ${locked ? "is-locked" : ""} ${affordable && !locked ? "is-affordable" : ""}"
                data-building-detail="${key}" role="button" tabindex="0">
                <div class="building-copy">
                  <span class="upgrade-level">${level ? `Level ${level}` : "Not built"}</span>
                  <h3>${building.name}</h3>
                  <p>${building.description}</p>
                  <strong class="effect-text">${C.store.getBuildingEffect(key)}</strong>
                </div>
                ${locked
                  ? `<div class="rank-lock">Rank ${building.requiredRank}</div>`
                  : `<button class="button button-small ${affordable ? "" : "button-muted"}" data-upgrade="${key}">
                      ${level ? "Upgrade" : "Build"}
                      <span class="cost-row">${C.UI.costMarkup(cost)}</span>
                    </button>`}
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function ritualMarkup(ritualKey, ritual) {
    const circleLevel = C.store.state.buildings.ritual;
    const locked = circleLevel < ritual.requiredCircleLevel;
    const active = ritualKey === "moonChant" && Date.now() < C.store.state.ritualBoostUntil;
    const remaining = active ? Math.ceil((C.store.state.ritualBoostUntil - Date.now()) / 1000) : 0;
    return `
      <article class="ritual-card ${locked ? "is-locked" : ""}">
        <span class="ritual-glyph" aria-hidden="true">&#9790;</span>
        <div>
          <h3>${ritual.name}</h3>
          <p>${ritual.description}</p>
          ${locked
            ? `<strong class="effect-text">Requires Ritual Circle level ${ritual.requiredCircleLevel}</strong>`
            : `<button class="button button-secondary" data-ritual="${ritualKey}" ${active ? "disabled" : ""}>
                ${active ? `Active: ${remaining}s` : "Perform Ritual"}
                <span class="cost-row">${C.UI.costMarkup(ritual.cost)}</span>
              </button>`}
        </div>
      </article>
    `;
  }

  function ritualsMarkup() {
    return `
      <section class="camp-tab-panel" data-panel="rituals">
        <div class="tab-intro">
          <div><p class="eyebrow">Make the moon notice</p><h2>Rituals</h2></div>
          <strong>Circle ${C.store.state.buildings.ritual}</strong>
        </div>
        <p class="tab-help">Rituals award ${C.DATA.xpRewards.ritual} XP and can restore the camp between raids.</p>
        <div class="ritual-list">
          ${Object.entries(C.DATA.rituals).map(([key, ritual]) => ritualMarkup(key, ritual)).join("")}
        </div>
      </section>
    `;
  }

  function relicsMarkup() {
    const rankUnlocked = C.store.isUnlocked(3);
    const vaultBuilt = C.store.state.buildings.vault >= 1;
    const owned = C.store.state.relics;
    const active = C.store.state.activeRelics;
    return `
      <section class="camp-tab-panel" data-panel="relics">
        <div class="tab-intro">
          <div><p class="eyebrow">Questionable treasures</p><h2>Relics</h2></div>
          <strong>${active.length}/${C.store.getActiveRelicSlotCount()} active</strong>
        </div>
        ${!rankUnlocked
          ? `<div class="unlock-banner">Relics and the Relic Vault unlock at Godling Rank 3.</div>`
          : !vaultBuilt
            ? `<div class="unlock-banner">Build the Relic Vault to activate relics found after raids.</div>`
            : `<p class="tab-help">Tap an owned relic to equip or store it. Duplicate finds become 6 bone shards.</p>`}
        <div class="relic-grid">
          ${C.DATA.relics.map((relic) => {
            const isOwned = owned.includes(relic.id);
            const isActive = active.includes(relic.id);
            return `
              <button class="relic-card ${isOwned ? "is-owned" : ""} ${isActive ? "is-active" : ""}"
                data-relic="${relic.id}" ${isOwned && vaultBuilt ? "" : "disabled"}>
                <span class="relic-symbol">${relic.symbol}</span>
                <strong>${isOwned ? relic.name : "Unknown Relic"}</strong>
                <small>${isOwned ? relic.description : "Defeat the Wax-Head Brute to discover it."}</small>
                ${isActive ? `<i>Active</i>` : ""}
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function relativeTime(timestamp) {
    if (!timestamp) return "Unknown";
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function multiplayerCultMarkup(cult) {
    const ownId = C.MultiplayerService.mode === "firebase"
      ? C.FirebaseService.getStatus().uid
      : "local-player";
    const isOwn = cult.ownerId === ownId;
    return `
      <article class="public-cult-card">
        <div class="cult-power"><strong>${cult.basePower || 0}</strong><span>Power</span></div>
        <div class="public-cult-copy">
          <strong>${C.UI.escapeHtml(cult.displayName || "Unnamed Cult")}</strong>
          <span>Shrine ${cult.shrineLevel || 1} - ${cult.guards ? cult.guards.length : 0} guards</span>
          <small>Updated ${relativeTime(cult.publishedAtMs)}</small>
        </div>
        <button class="button button-small ${isOwn ? "button-muted" : ""}"
          data-raid-cult="${C.UI.escapeHtml(cult.id || cult.ownerId)}" ${isOwn ? "disabled" : ""}>
          ${isOwn ? "Your Cult" : "Raid"}
        </button>
      </article>
    `;
  }

  function inboxMarkup(result) {
    const won = result.outcome === "defenseWin";
    const reward = result.defenderReward || { devotion: 3, bones: 1 };
    return `
      <article class="inbox-card ${won ? "defense-won" : "defense-lost"}">
        <div class="inbox-mark">${won ? "W" : "R"}</div>
        <div>
          <strong>Your cult was raided!</strong>
          <span>${C.UI.escapeHtml(result.attackerName || "A mysterious cult")} - ${won ? "defense held" : "shrine breached"}</span>
          <p>${C.UI.escapeHtml(result.summary || "The details are sticky and unclear.")}</p>
          <small>${relativeTime(result.createdAtMs)}</small>
        </div>
        <button class="button button-small ${result.collected ? "button-muted" : ""}"
          data-collect-result="${C.UI.escapeHtml(result.id)}" ${result.collected ? "disabled" : ""}>
          ${result.collected ? "Collected" : `Collect D${reward.devotion || 0} B${reward.bones || 0}`}
        </button>
      </article>
    `;
  }

  function multiplayerMarkup() {
    const status = C.MultiplayerService.getStatus();
    const state = C.store.state;
    const online = status.online;
    const statusLabel = !status.ready && status.configured
      ? "Connecting"
      : online
        ? "Firebase Online"
        : "Offline Mode";
    const statusCopy = online
      ? "Anonymous auth connected. Publishing, cloud saves, and raid results use Firestore."
      : "Single-player remains fully available. Multiplayer uses local mock cults and inbox data.";
    const modifiers = state.multiplayer.defenseModifiers || [];

    return `
      <section class="camp-tab-panel" data-panel="multiplayer">
        <div class="tab-intro">
          <div><p class="eyebrow">Asynchronous trouble</p><h2>Multiplayer</h2></div>
          <span class="network-status ${online ? "is-online" : "is-offline"}">${statusLabel}</span>
        </div>
        <p class="tab-help">${statusCopy}</p>

        <article class="multiplayer-panel profile-panel">
          <div class="multiplayer-heading">
            <div><strong>Player Profile</strong><span>${online ? `Anonymous ID ${C.UI.escapeHtml((status.uid || "").slice(0, 8))}` : "Stored on this device"}</span></div>
          </div>
          <label class="profile-name-field">
            <span>Display name</span>
            <input id="multiplayer-name" maxlength="24" value="${C.UI.escapeHtml(state.multiplayer.displayName)}">
          </label>
          <div class="multiplayer-action-row">
            <button class="button button-secondary" id="save-display-name">Save Name</button>
            <button class="button button-secondary" id="sync-cloud-save">Sync Save</button>
          </div>
          <small class="sync-note">${state.multiplayer.lastCloudSyncAt ? `Last sync ${relativeTime(state.multiplayer.lastCloudSyncAt)}` : "Cloud sync is manual and never silently replaces a newer local save."}</small>
        </article>

        <article class="multiplayer-panel">
          <div class="multiplayer-heading">
            <div><strong>Publish Cult</strong><span>Only a small raidable snapshot is shared</span></div>
            <span class="power-preview">${C.MultiplayerService.createCultSnapshot().basePower} power</span>
          </div>
          <div class="defense-options">
            <label><input type="checkbox" data-defense-modifier="sturdyWalls" ${modifiers.includes("sturdyWalls") ? "checked" : ""}> Reinforced Shrine</label>
            <label><input type="checkbox" data-defense-modifier="hexWards" ${modifiers.includes("hexWards") ? "checked" : ""}> Hex Wards</label>
            <label><input type="checkbox" data-defense-modifier="guardFervor" ${modifiers.includes("guardFervor") ? "checked" : ""}> Guard Fervor</label>
          </div>
          <p class="privacy-note">Publishes your name, building levels, guard followers, selected modifiers, active relic IDs, power, and timestamp. Resources and full follower data stay private.</p>
          <button class="button button-primary multiplayer-wide-button" id="publish-cult">Publish Cult</button>
        </article>

        <article class="multiplayer-panel">
          <div class="multiplayer-heading">
            <div><strong>Find Cults</strong><span>20 most recent public bases</span></div>
            <button class="text-button" id="refresh-multiplayer">Refresh</button>
          </div>
          ${multiplayerLoading
            ? `<div class="multiplayer-empty">Listening for distant chanting...</div>`
            : multiplayerError
              ? `<div class="camp-warning">${C.UI.escapeHtml(multiplayerError)}</div>`
              : `<div class="public-cult-list">${multiplayerCults.length
                  ? multiplayerCults.map(multiplayerCultMarkup).join("")
                  : `<div class="multiplayer-empty">No published cults found yet.</div>`}</div>`}
        </article>

        <article class="multiplayer-panel">
          <div class="multiplayer-heading">
            <div><strong>Raid Inbox</strong><span>Defender reports and rewards</span></div>
            <span class="inbox-count">${multiplayerInbox.filter((result) => !result.collected).length} new</span>
          </div>
          <div class="inbox-list">${multiplayerInbox.length
            ? multiplayerInbox.map(inboxMarkup).join("")
            : `<div class="multiplayer-empty">No one has raided your cult. Yet.</div>`}</div>
        </article>
      </section>
    `;
  }

  function tabMarkup() {
    const markup = {
      overview: overviewMarkup,
      followers: followersMarkup,
      buildings: buildingsMarkup,
      rituals: ritualsMarkup,
      relics: relicsMarkup,
      multiplayer: multiplayerMarkup
    };
    return markup[activeTab]();
  }

  function renderActiveTab() {
    if (!rootElement || !rootElement.isConnected) return;
    const content = rootElement.querySelector("#camp-tab-content");
    if (content) content.innerHTML = tabMarkup();
    rootElement.querySelectorAll("[data-tab]").forEach((button) => {
      const selected = button.dataset.tab === activeTab;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
    });
    const buildingTab = rootElement.querySelector('[data-tab="buildings"]');
    if (buildingTab) {
      const count = affordableUpgradeCount();
      buildingTab.dataset.badge = count ? String(count) : "";
      buildingTab.classList.toggle("has-badge", count > 0);
    }
    renderEventModal();
    if (activeTab === "multiplayer" && !multiplayerLoaded && !multiplayerLoading) {
      loadMultiplayerData();
    }
  }

  async function loadMultiplayerData(force) {
    if (multiplayerLoading) return;
    if (multiplayerLoaded && !force) return;
    multiplayerLoading = true;
    multiplayerError = "";
    if (activeTab === "multiplayer" && rootElement) {
      const content = rootElement.querySelector("#camp-tab-content");
      if (content) content.innerHTML = multiplayerMarkup();
    }
    try {
      await C.MultiplayerService.init();
      [multiplayerCults, multiplayerInbox] = await Promise.all([
        C.MultiplayerService.listCults(),
        C.MultiplayerService.getInbox()
      ]);
      multiplayerLoaded = true;
    } catch (error) {
      multiplayerError = error && error.message ? error.message : "Multiplayer data could not be loaded.";
    } finally {
      multiplayerLoading = false;
      if (activeTab === "multiplayer" && rootElement && rootElement.isConnected) {
        const content = rootElement.querySelector("#camp-tab-content");
        if (content) content.innerHTML = multiplayerMarkup();
      }
    }
  }

  function updateRitualCountdown() {
    if (!rootElement || !rootElement.isConnected || activeTab !== "rituals") return;
    const button = rootElement.querySelector('[data-ritual="moonChant"]');
    if (!button) return;
    const remaining = Math.max(0, C.store.state.ritualBoostUntil - Date.now());
    if (remaining > 0) {
      button.disabled = true;
      button.firstChild.textContent = `Active: ${Math.ceil(remaining / 1000)}s `;
    } else if (button.disabled) {
      renderActiveTab();
    }
  }

  function renderEventModal() {
    if (!rootElement || !rootElement.isConnected) return;
    const oldModal = rootElement.querySelector("#camp-event-modal");
    const event = C.store.getPendingEvent();
    if (oldModal && event && oldModal.dataset.eventId === event.id) return;
    if (oldModal) oldModal.remove();
    if (!event) return;

    const modal = document.createElement("div");
    modal.id = "camp-event-modal";
    modal.className = "event-backdrop";
    modal.dataset.eventId = event.id;
    modal.innerHTML = `
      <section class="event-card" role="dialog" aria-modal="true" aria-labelledby="event-title">
        <span class="event-mark" aria-hidden="true">!</span>
        <p class="eyebrow">Something happened</p>
        <h2 id="event-title">${event.title}</h2>
        <p>${event.text}</p>
        <div class="event-choices">
          ${event.choices.map((choice, index) => `
            <button class="button ${index === 0 ? "button-primary" : "button-secondary"}" data-event-choice="${index}">
              ${choice.label}
              <small>${choice.result}</small>
            </button>
          `).join("")}
        </div>
      </section>
    `;
    rootElement.appendChild(modal);
  }

  function closeDetailModal() {
    if (!rootElement) return;
    const modal = rootElement.querySelector("#camp-detail-modal");
    if (modal) modal.remove();
  }

  function renderFollowerDetail(followerId) {
    const follower = C.store.state.followers.find((item) => item.id === followerId);
    if (!follower || !rootElement) return;
    closeDetailModal();
    const mood = C.store.getMoodLabel(follower);
    const job = C.DATA.jobs[follower.job] || C.DATA.jobs.worshipper;
    const trait = C.DATA.traits.find((item) => item.name === follower.trait);
    const modal = document.createElement("div");
    modal.id = "camp-detail-modal";
    modal.className = "detail-backdrop";
    modal.innerHTML = `
      <section class="camp-detail-card" role="dialog" aria-modal="true" aria-labelledby="follower-detail-title">
        <button class="detail-close" data-close-detail aria-label="Close detail">&times;</button>
        <div class="detail-follower-heading">
          <div class="follower-avatar" style="--follower-color:${follower.color}" aria-hidden="true">
            <i class="follower-ear ear-left"></i><i class="follower-ear ear-right"></i>
            <i class="follower-eye eye-left"></i><i class="follower-eye eye-right"></i>
          </div>
          <div><p class="eyebrow">${mood} cultling</p><h2 id="follower-detail-title">${C.UI.escapeHtml(follower.name)}</h2></div>
        </div>
        <div class="detail-stat-grid">
          <div><span>Job</span><strong>${job.name}</strong></div>
          <div><span>Mood</span><strong>${mood}</strong></div>
          <div><span>Output</span><strong>${Math.round(C.store.getMoodMultiplier(follower) * C.store.getTraitProductionMultiplier(follower, follower.job) * 100)}%</strong></div>
        </div>
        <article class="detail-trait"><span>${C.UI.escapeHtml(follower.trait)}</span><p>${C.UI.escapeHtml(trait ? trait.detail : "")}</p></article>
        <button class="button button-secondary" data-tab-jump="followers">Manage Job</button>
      </section>
    `;
    rootElement.appendChild(modal);
  }

  function renderBuildingDetail(buildingKey) {
    const building = C.DATA.buildings[buildingKey];
    if (!building || !rootElement) return;
    closeDetailModal();
    const level = C.store.state.buildings[buildingKey];
    const locked = !C.store.isUnlocked(building.requiredRank);
    const cost = C.store.getUpgradeCost(buildingKey);
    const affordable = C.store.canAfford(cost);
    const modal = document.createElement("div");
    modal.id = "camp-detail-modal";
    modal.className = "detail-backdrop";
    modal.innerHTML = `
      <section class="camp-detail-card building-detail-card" role="dialog" aria-modal="true" aria-labelledby="building-detail-title">
        <button class="detail-close" data-close-detail aria-label="Close detail">&times;</button>
        <p class="eyebrow">${level ? `Level ${level}` : "Not built"}</p>
        <h2 id="building-detail-title">${building.name}</h2>
        <p>${building.description}</p>
        <strong class="detail-effect">${C.store.getBuildingEffect(buildingKey)}</strong>
        ${locked
          ? `<div class="unlock-banner">Unlocks at Godling Rank ${building.requiredRank}.</div>`
          : `<button class="button button-primary ${affordable ? "" : "button-muted"}" data-upgrade="${buildingKey}">
              ${level ? "Upgrade" : "Build"} ${building.name}
              <span class="cost-row">${C.UI.costMarkup(cost)}</span>
            </button>`}
      </section>
    `;
    rootElement.appendChild(modal);
  }

  async function handleCampClick(event) {
    if (event.target.closest("[data-close-detail]") || (
      event.target.id === "camp-detail-modal"
    )) {
      closeDetailModal();
      return;
    }

    const tabJump = event.target.closest("[data-tab-jump]");
    if (tabJump) {
      activeTab = tabJump.dataset.tabJump;
      closeDetailModal();
      renderActiveTab();
      return;
    }

    const tabButton = event.target.closest("[data-tab]");
    if (tabButton) {
      activeTab = tabButton.dataset.tab;
      renderActiveTab();
      return;
    }

    const upgradeButton = event.target.closest("[data-upgrade]");
    if (upgradeButton) {
      const buildingKey = upgradeButton.dataset.upgrade;
      if (C.store.upgradeBuilding(buildingKey)) {
        C.Audio.play("collect");
        C.UI.toast(`${C.DATA.buildings[buildingKey].name} improved. +${C.DATA.xpRewards.building} XP`, "success");
      } else {
        C.UI.toast("Not enough materials for that upgrade.", "warning");
      }
      closeDetailModal();
      return;
    }

    const ritualButton = event.target.closest("[data-ritual]");
    if (ritualButton) {
      const ritualKey = ritualButton.dataset.ritual;
      if (C.store.performRitual(ritualKey)) {
        C.Audio.play("ritual");
        C.UI.toast(`${C.DATA.rituals[ritualKey].name} complete. +${C.DATA.xpRewards.ritual} XP`, "success");
      } else {
        C.UI.toast("The ritual demands more resources.", "warning");
      }
      return;
    }

    const followerDetail = event.target.closest("[data-follower-detail]");
    if (followerDetail && !event.target.closest("select")) {
      renderFollowerDetail(followerDetail.dataset.followerDetail);
      return;
    }

    const buildingDetail = event.target.closest("[data-building-detail]");
    if (buildingDetail) {
      renderBuildingDetail(buildingDetail.dataset.buildingDetail);
      return;
    }

    const relicButton = event.target.closest("[data-relic]");
    if (relicButton) {
      const relicId = relicButton.dataset.relic;
      const wasActive = C.store.hasActiveRelic(relicId);
      if (C.store.toggleRelic(relicId)) {
        C.UI.toast(wasActive ? "Relic stored." : "Relic activated.", "success");
      } else {
        C.UI.toast("Every active relic slot is already humming.", "warning");
      }
      return;
    }

    const eventChoice = event.target.closest("[data-event-choice]");
    if (eventChoice) {
      const outcome = C.store.resolveCampEvent(Number(eventChoice.dataset.eventChoice));
      if (!outcome.success) {
        C.UI.toast("The cult cannot afford that choice.", "warning");
      } else {
        C.UI.toast(outcome.result, "success");
        renderEventModal();
      }
      return;
    }

    if (event.target.closest("#save-display-name")) {
      const input = rootElement.querySelector("#multiplayer-name");
      try {
        const name = await C.MultiplayerService.setDisplayName(input.value);
        C.UI.toast(`Known henceforth as ${name}.`, "success");
      } catch (error) {
        C.UI.toast(error.message || "That name displeases the moon.", "warning");
      }
      return;
    }

    if (event.target.closest("#sync-cloud-save")) {
      try {
        const result = await C.MultiplayerService.syncSave();
        if (result.status === "conflict") {
          const cloudDate = new Date(result.cloudUpdatedAt).toLocaleString();
          const loadCloud = window.confirm(
            `The cloud save is newer (${cloudDate}). Load it and replace local progression? Cancel keeps local progress unchanged.`
          );
          if (loadCloud) {
            C.MultiplayerService.applyCloudSave(result);
            C.UI.toast("Newer cloud save loaded.", "success");
          } else {
            C.UI.toast("Local save kept. Nothing was overwritten.", "warning");
          }
        } else {
          C.UI.toast(result.status === "mock" ? "Offline save is healthy." : "Save synced to Firebase.", "success");
        }
      } catch (error) {
        C.UI.toast("Sync failed. Local save is still safe.", "warning");
      }
      renderActiveTab();
      return;
    }

    if (event.target.closest("#publish-cult")) {
      try {
        const snapshot = await C.MultiplayerService.publishCult();
        C.UI.toast(`Cult published at power ${snapshot.basePower}.`, "success");
        multiplayerLoaded = false;
        await loadMultiplayerData(true);
      } catch (error) {
        C.UI.toast("Publish failed. Local play is unaffected.", "warning");
      }
      return;
    }

    if (event.target.closest("#refresh-multiplayer")) {
      multiplayerLoaded = false;
      await loadMultiplayerData(true);
      return;
    }

    const raidCultButton = event.target.closest("[data-raid-cult]");
    if (raidCultButton) {
      const cult = multiplayerCults.find((item) => (item.id || item.ownerId) === raidCultButton.dataset.raidCult);
      if (cult) C.App.show("raid", { mode: "async", defender: cult });
      return;
    }

    const collectButton = event.target.closest("[data-collect-result]");
    if (collectButton) {
      const result = multiplayerInbox.find((item) => item.id === collectButton.dataset.collectResult);
      collectButton.disabled = true;
      try {
        if (await C.MultiplayerService.collectInboxReward(result)) {
          result.collected = true;
          C.UI.toast("Defender reward collected.", "success");
          renderActiveTab();
        }
      } catch (error) {
        collectButton.disabled = false;
        C.UI.toast("Reward collection failed. Try again later.", "warning");
      }
      return;
    }

    if (event.target.closest("#start-raid")) {
      C.App.show("raid");
      return;
    }

    if (event.target.closest("#reset-save")) {
      if (window.confirm("Reset the cult and erase this local save?")) {
        C.store.reset();
        activeTab = "overview";
        renderActiveTab();
        C.UI.toast("A fresh and equally dubious beginning.", "success");
      }
    }
  }

  function handleCampChange(event) {
    if (event.target.id === "sound-toggle") {
      C.Audio.setEnabled(event.target.checked);
      return;
    }
    if (event.target.id === "sound-volume") {
      C.Audio.setVolume(Number(event.target.value) / 100);
      return;
    }
    const modifier = event.target.closest("[data-defense-modifier]");
    if (modifier) {
      C.MultiplayerService.setDefenseModifier(modifier.dataset.defenseModifier, modifier.checked);
      renderActiveTab();
      return;
    }
    const select = event.target.closest("[data-follower-job]");
    if (!select) return;
    if (C.store.assignJob(select.dataset.followerJob, select.value)) {
      C.UI.toast(`Assigned as ${C.DATA.jobs[select.value].name}.`, "success");
    }
  }

  C.CampScreen = {
    render(root) {
      rootElement = root;
      root.innerHTML = `
        <section class="camp-screen screen">
          <header class="camp-heading">
            <div><p class="eyebrow">The Damp Hollow</p><h1>Your Little Cult</h1></div>
            <details class="settings-menu">
              <summary aria-label="Open settings">Settings</summary>
              <div class="settings-panel">
                <strong>Sound settings</strong>
                <label><input id="sound-toggle" type="checkbox" ${C.store.state.settings.sound ? "checked" : ""}> Sound effects</label>
                <label class="volume-setting"><span>Volume</span><input id="sound-volume" type="range" min="0" max="100" value="${Math.round(C.store.state.settings.volume * 100)}"></label>
                <button id="reset-save" class="text-button">Reset local save</button>
              </div>
            </details>
          </header>

          <nav class="camp-tabs" role="tablist" aria-label="Camp sections">
            <button data-tab="overview" role="tab">Overview</button>
            <button data-tab="followers" role="tab">Followers</button>
            <button data-tab="buildings" role="tab">Buildings</button>
            <button data-tab="rituals" role="tab">Rituals</button>
            <button data-tab="relics" role="tab">Relics</button>
            <button data-tab="multiplayer" role="tab">Multiplayer</button>
          </nav>

          <div id="camp-tab-content"></div>

          <div class="camp-bottom-bar">
            <div>
              <span>Next expedition</span>
              <strong>${C.store.isUnlocked(4) ? "Candlewood + Cursed Ruins" : "Candlewood Descent"}</strong>
            </div>
            <button id="start-raid" class="button button-primary">Start Raid</button>
          </div>
        </section>
      `;

      root.addEventListener("click", handleCampClick);
      root.addEventListener("change", handleCampChange);
      countdownTimer = window.setInterval(updateRitualCountdown, 500);
      renderActiveTab();

      return () => {
        root.removeEventListener("click", handleCampClick);
        root.removeEventListener("change", handleCampChange);
        window.clearInterval(countdownTimer);
        countdownTimer = null;
        rootElement = null;
      };
    },

    refresh(reason) {
      if (reason === "tick") {
        renderEventModal();
        return;
      }
      if (reason === "production") {
        if (activeTab === "overview" && !rootElement.querySelector("#camp-event-modal")) {
          const content = rootElement && rootElement.querySelector("#camp-tab-content");
          if (content) content.innerHTML = overviewMarkup();
        }
        renderEventModal();
        return;
      }
      renderActiveTab();
    },

    showProduction(payload) {
      if (!rootElement || activeTab !== "overview") return;
      const map = rootElement.querySelector(".camp-map");
      if (!map) return;
      Object.entries(payload)
        .filter((entry) => entry[1] >= 0.04)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .forEach(([resource, amount], index) => {
          const gain = document.createElement("span");
          gain.className = `camp-gain-particle gain-${resource}`;
          gain.style.setProperty("--gain-x", `${32 + (index * 30)}%`);
          gain.textContent = `+${amount.toFixed(1)} ${C.DATA.resources[resource].short}`;
          gain.addEventListener("animationend", () => gain.remove(), { once: true });
          map.appendChild(gain);
        });
    }
  };
})();
