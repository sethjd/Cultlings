(function () {
  const C = window.Cultlings = window.Cultlings || {};
  let rootElement = null;
  let countdownTimer = null;
  let activeTab = "overview";

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
      <article class="follower-card follower-card-expanded" style="--follower-color:${follower.color}; --delay:${index * -0.25}s">
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

        <section class="camp-map camp-map-compact" aria-label="Cult camp">
          <div class="camp-sky" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="purple-smoke smoke-one" aria-hidden="true"></div>
          <div class="purple-smoke smoke-two" aria-hidden="true"></div>
          <div class="landmark shrine-landmark" aria-label="Moon Shrine">
            <span class="shrine-moon"></span><span class="shrine-roof"></span>
            <span class="shrine-door"></span><span class="landmark-label">Moon Shrine</span>
          </div>
          <div class="hut-row" aria-label="Follower huts">
            <div class="hut hut-one"><i></i></div>
            <div class="hut hut-two"><i></i></div>
            <div class="hut hut-three"><i></i></div>
          </div>
          <div class="ritual-landmark" aria-label="Ritual Circle">
            <span class="ritual-rune">&#9790;</span>
            <i class="ritual-candle candle-a"></i>
            <i class="ritual-candle candle-b"></i>
            <i class="ritual-candle candle-c"></i>
          </div>
          <div class="camp-followers" aria-hidden="true">
            ${state.followers.slice(0, 8).map((follower, index) => (
              `<i style="--x:${14 + ((index * 23) % 74)}%;--y:${58 + ((index * 17) % 27)}%;--c:${follower.color};--d:${index * -0.25}s"></i>`
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
              <article class="upgrade-card ${locked ? "is-locked" : ""}">
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

  function tabMarkup() {
    const markup = {
      overview: overviewMarkup,
      followers: followersMarkup,
      buildings: buildingsMarkup,
      rituals: ritualsMarkup,
      relics: relicsMarkup
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
    renderEventModal();
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

  function handleCampClick(event) {
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
        C.UI.toast(`${C.DATA.buildings[buildingKey].name} improved. +${C.DATA.xpRewards.building} XP`, "success");
      } else {
        C.UI.toast("Not enough materials for that upgrade.", "warning");
      }
      return;
    }

    const ritualButton = event.target.closest("[data-ritual]");
    if (ritualButton) {
      const ritualKey = ritualButton.dataset.ritual;
      if (C.store.performRitual(ritualKey)) {
        C.UI.toast(`${C.DATA.rituals[ritualKey].name} complete. +${C.DATA.xpRewards.ritual} XP`, "success");
      } else {
        C.UI.toast("The ritual demands more resources.", "warning");
      }
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
                <strong>Prototype settings</strong>
                <label><input type="checkbox" disabled> Sound arrives later</label>
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
    }
  };
})();
