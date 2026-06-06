(function () {
  const C = window.Cultlings = window.Cultlings || {};
  const SAVE_KEY = "cultlings-save-v1";

  function makeStarterFollowers() {
    const followers = [];
    for (let i = 0; i < 5; i += 1) {
      followers.push(C.Helpers.createFollower(followers.map((follower) => follower.name)));
    }
    return followers;
  }

  function defaultState() {
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    return {
      version: C.DATA.version,
      resources: { ...C.DATA.starterResources },
      followers: makeStarterFollowers(),
      buildings: {
        shrine: 1,
        huts: 1,
        ritual: 1,
        kitchen: 1,
        training: 0,
        vault: 0
      },
      xp: 0,
      relics: [],
      activeRelics: [],
      ritualBoostUntil: 0,
      ritualMoodUntil: 0,
      raidFatigue: 0,
      raidsCompleted: 0,
      pendingEventId: null,
      lastEventAt: Date.now(),
      multiplayer: {
        displayName: `Cultling_${suffix}`,
        defenseModifiers: ["sturdyWalls"],
        lastCloudSyncAt: 0,
        lastPublishedAt: 0
      },
      tutorialCompleted: false,
      settings: { sound: true, reducedMotion: false },
      lastSavedAt: Date.now(),
      lastTickAt: Date.now()
    };
  }

  function migrateState(saved) {
    const defaults = defaultState();
    const followers = Array.isArray(saved.followers) && saved.followers.length
      ? saved.followers.map((follower) => ({
          ...follower,
          job: follower.job || "worshipper",
          moodValue: Number.isFinite(follower.moodValue) ? follower.moodValue : 70
        }))
      : defaults.followers;

    return {
      ...defaults,
      ...saved,
      version: C.DATA.version,
      resources: { ...defaults.resources, ...(saved.resources || {}) },
      buildings: { ...defaults.buildings, ...(saved.buildings || {}) },
      settings: { ...defaults.settings, ...(saved.settings || {}) },
      multiplayer: { ...defaults.multiplayer, ...(saved.multiplayer || {}) },
      followers,
      relics: Array.isArray(saved.relics) ? saved.relics : [],
      activeRelics: Array.isArray(saved.activeRelics) ? saved.activeRelics : [],
      lastTickAt: Date.now()
    };
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      return saved ? migrateState(saved) : defaultState();
    } catch (error) {
      console.warn("Could not load Cultlings save.", error);
      return defaultState();
    }
  }

  class GameStore {
    constructor() {
      this.state = loadState();
      this.listeners = new Set();
      this.lastUiBroadcast = 0;
      this.lastProductionPopup = Date.now();
      this.productionAccumulator = { devotion: 0, food: 0, wood: 0, bones: 0 };
    }

    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    notify(reason, payload) {
      this.listeners.forEach((listener) => listener(this.state, reason, payload));
    }

    save() {
      this.state.lastSavedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    }

    reset() {
      localStorage.removeItem(SAVE_KEY);
      this.state = defaultState();
      this.save();
      this.notify("reset");
    }

    setDisplayName(displayName) {
      this.state.multiplayer.displayName = displayName;
      this.save();
      this.notify("displayName", { displayName });
    }

    exportCloudSave() {
      return {
        version: this.state.version,
        resources: { ...this.state.resources },
        followers: this.state.followers.map((follower) => ({ ...follower })),
        buildings: { ...this.state.buildings },
        relics: [...this.state.relics],
        activeRelics: [...this.state.activeRelics],
        xp: this.state.xp,
        godlingRank: this.getRank(),
        ritualBoostUntil: this.state.ritualBoostUntil,
        ritualMoodUntil: this.state.ritualMoodUntil,
        raidFatigue: this.state.raidFatigue,
        raidsCompleted: this.state.raidsCompleted
      };
    }

    importCloudSave(cloudSave, cloudUpdatedAt) {
      if (!cloudSave) return false;
      const defaults = defaultState();
      this.state.resources = { ...defaults.resources, ...(cloudSave.resources || {}) };
      this.state.followers = Array.isArray(cloudSave.followers)
        ? cloudSave.followers.map((follower) => ({
            ...follower,
            job: follower.job || "worshipper",
            moodValue: Number.isFinite(follower.moodValue) ? follower.moodValue : 70
          }))
        : this.state.followers;
      this.state.buildings = { ...defaults.buildings, ...(cloudSave.buildings || {}) };
      this.state.relics = Array.isArray(cloudSave.relics) ? [...cloudSave.relics] : [];
      this.state.activeRelics = Array.isArray(cloudSave.activeRelics) ? [...cloudSave.activeRelics] : [];
      this.state.xp = Number.isFinite(cloudSave.xp) ? cloudSave.xp : this.state.xp;
      this.state.ritualBoostUntil = cloudSave.ritualBoostUntil || 0;
      this.state.ritualMoodUntil = cloudSave.ritualMoodUntil || 0;
      this.state.raidFatigue = cloudSave.raidFatigue || 0;
      this.state.raidsCompleted = cloudSave.raidsCompleted || 0;
      this.state.multiplayer.lastCloudSyncAt = cloudUpdatedAt || Date.now();
      this.save();
      this.notify("cloudLoaded", { cloudUpdatedAt });
      return true;
    }

    getRank() {
      let rank = 1;
      C.DATA.ranks.forEach((entry) => {
        if (this.state.xp >= entry.xp) rank = entry.rank;
      });
      return rank;
    }

    getRankProgress() {
      const rank = this.getRank();
      const current = C.DATA.ranks.find((entry) => entry.rank === rank);
      const next = C.DATA.ranks.find((entry) => entry.rank === rank + 1);
      if (!next) return { rank, current: this.state.xp, needed: this.state.xp, percent: 100, next: null };
      const earned = this.state.xp - current.xp;
      const needed = next.xp - current.xp;
      return { rank, current: earned, needed, percent: (earned / needed) * 100, next };
    }

    addXP(amount, source) {
      const oldRank = this.getRank();
      this.state.xp += Math.max(0, Math.round(amount));
      const newRank = this.getRank();
      this.save();
      this.notify("xp", { amount, source, oldRank, newRank });
      return newRank - oldRank;
    }

    isUnlocked(requiredRank) {
      return this.getRank() >= requiredRank;
    }

    getMaxDevotion() {
      return 100 + ((Math.max(1, this.state.buildings.shrine) - 1) * 50);
    }

    getFollowerCapacity() {
      return 6 + ((Math.max(1, this.state.buildings.huts) - 1) * 2);
    }

    getActiveRelicSlotCount() {
      if (this.state.buildings.vault < 1) return 0;
      return 3 + Math.max(0, this.state.buildings.vault - 1);
    }

    hasActiveRelic(relicId) {
      return this.state.activeRelics.includes(relicId);
    }

    getMoodLabel(follower) {
      if (follower.moodValue >= 70) return "Happy";
      if (follower.moodValue >= 40) return "Okay";
      return "Unhappy";
    }

    getMoodMultiplier(follower) {
      const label = this.getMoodLabel(follower);
      if (label === "Happy") return 1.15;
      if (label === "Unhappy") return 0.65;
      return 1;
    }

    getTraitProductionMultiplier(follower, jobKey) {
      let multiplier = 1;
      if (follower.trait === "Great Chanter" && jobKey === "worshipper") multiplier *= 1.3;
      if (follower.trait === "Mushroom Blessed" && jobKey === "forager") multiplier *= 1.35;
      if (follower.trait === "Secretly a Rat" && ["woodcutter", "bonePicker"].includes(jobKey)) multiplier *= 1.15;
      if (follower.trait === "Lazy but Loyal") multiplier *= 0.8;
      return multiplier;
    }

    getProductionRates() {
      const rates = { devotion: 0, food: 0, wood: 0, bones: 0 };
      const shrineMultiplier = 1 + ((Math.max(1, this.state.buildings.shrine) - 1) * 0.08);
      const kitchenMultiplier = 1 + ((Math.max(1, this.state.buildings.kitchen) - 1) * 0.12);
      const relicDevotion = this.hasActiveRelic("moonBell") ? 1.15 : 1;
      const ritualBase = Date.now() < this.state.ritualBoostUntil
        ? 2 + ((Math.max(1, this.state.buildings.ritual) - 1) * 0.1)
        : 1;

      this.state.followers.forEach((follower) => {
        const jobKey = C.DATA.jobs[follower.job] ? follower.job : "worshipper";
        const job = C.DATA.jobs[jobKey];
        let rate = job.rate * this.getMoodMultiplier(follower) * this.getTraitProductionMultiplier(follower, jobKey);

        if (job.resource === "devotion") {
          const candlePenalty = follower.trait === "Afraid of Candles" && ritualBase > 1 ? 0.78 : 1;
          rate *= shrineMultiplier * relicDevotion * ritualBase * candlePenalty;
        }
        if (job.resource === "food") rate *= kitchenMultiplier;
        if (job.resource) rates[job.resource] += rate;
        if (follower.trait === "Tiny Prophet") rates.devotion += 0.025 * this.getMoodMultiplier(follower);
      });
      return rates;
    }

    getDevotionRate() {
      return this.getProductionRates().devotion;
    }

    getFoodUseRate() {
      const kitchenEfficiency = 1 - Math.min(0.45, (Math.max(1, this.state.buildings.kitchen) - 1) * 0.1);
      const hungryRelic = this.hasActiveRelic("hungryIdol") ? 1.15 : 1;
      const followerUse = this.state.followers.reduce(
        (total, follower) => total + (follower.trait === "Always Hungry" ? 1.4 : 1),
        0
      );
      return followerUse * 0.006 * kitchenEfficiency * hungryRelic;
    }

    updateMoods(deltaSeconds) {
      const housed = this.state.followers.length <= this.getFollowerCapacity();
      const foodPerFollower = this.state.resources.food / Math.max(1, this.state.followers.length);
      const feastBonus = Date.now() < this.state.ritualMoodUntil ? 0.018 : 0;
      const fatiguePenalty = this.state.raidFatigue * 0.004;

      this.state.followers.forEach((follower) => {
        let change = feastBonus - fatiguePenalty;
        if (foodPerFollower >= 3) change += 0.004;
        if (foodPerFollower < 1) change -= 0.02;
        if (!housed) change -= 0.018;
        if (follower.trait === "Lazy but Loyal") change += 0.004;
        follower.moodValue = C.Helpers.clamp(follower.moodValue + (change * deltaSeconds), 0, 100);
      });
    }

    tick(now) {
      const deltaSeconds = Math.min(5, Math.max(0, (now - this.state.lastTickAt) / 1000));
      this.state.lastTickAt = now;
      if (!deltaSeconds) return;

      const rates = this.getProductionRates();
      const gains = {};
      Object.entries(rates).forEach(([resource, rate]) => {
        const gain = rate * deltaSeconds;
        gains[resource] = gain;
        this.productionAccumulator[resource] += gain;
        const max = resource === "devotion" ? this.getMaxDevotion() : Number.POSITIVE_INFINITY;
        this.state.resources[resource] = C.Helpers.clamp(this.state.resources[resource] + gain, 0, max);
      });
      this.state.resources.food = Math.max(0, this.state.resources.food - (this.getFoodUseRate() * deltaSeconds));
      this.state.raidFatigue = Math.max(0, this.state.raidFatigue - (deltaSeconds / 110));
      this.updateMoods(deltaSeconds);

      if (!this.state.pendingEventId && now - this.state.lastEventAt > 90000) {
        this.queueCampEvent();
      }
      if (now - this.lastProductionPopup > 5000) {
        this.lastProductionPopup = now;
        this.notify("production", { ...this.productionAccumulator });
        this.productionAccumulator = { devotion: 0, food: 0, wood: 0, bones: 0 };
      }
      if (now - this.lastUiBroadcast > 1000) {
        this.lastUiBroadcast = now;
        this.notify("tick");
      }
      if (now - this.state.lastSavedAt > 10000) this.save();
    }

    canAfford(cost) {
      return Object.entries(cost).every(([resource, amount]) => this.state.resources[resource] >= amount);
    }

    spend(cost) {
      if (!this.canAfford(cost)) return false;
      Object.entries(cost).forEach(([resource, amount]) => {
        this.state.resources[resource] -= amount;
      });
      this.save();
      this.notify("spend");
      return true;
    }

    addResources(rewards, reason) {
      Object.entries(rewards).forEach(([resource, amount]) => {
        if (!(resource in this.state.resources)) return;
        const max = resource === "devotion" ? this.getMaxDevotion() : Number.POSITIVE_INFINITY;
        this.state.resources[resource] = C.Helpers.clamp(this.state.resources[resource] + amount, 0, max);
      });
      this.save();
      this.notify(reason || "rewards", rewards);
    }

    getUpgradeCost(buildingKey) {
      const building = C.DATA.buildings[buildingKey];
      const level = this.state.buildings[buildingKey];
      const effectiveLevel = Math.max(0, level);
      const multiplier = 1 + (effectiveLevel * 0.55);
      return Object.fromEntries(
        Object.entries(building.baseCost).map(([resource, amount]) => [resource, Math.ceil(amount * multiplier)])
      );
    }

    getBuildingEffect(buildingKey) {
      const level = this.state.buildings[buildingKey];
      const displayLevel = Math.max(0, level);
      const effects = {
        shrine: `${this.getMaxDevotion()} devotion cap, +${Math.max(0, displayLevel - 1) * 8}% devotion`,
        huts: `${this.getFollowerCapacity()} follower capacity`,
        ritual: displayLevel < 2 ? "Moon Chant unlocked" : `Moon Chant +${(displayLevel - 1) * 10}%, Hearth Feast unlocked`,
        kitchen: `${Math.max(0, displayLevel - 1) * 10}% less food use, +${Math.max(0, displayLevel - 1) * 12}% foraging`,
        training: displayLevel === 0
          ? "Build to improve raid combat"
          : `+${Math.floor((displayLevel + 1) / 2)} attack, +${Math.floor(displayLevel / 2)} health`,
        vault: displayLevel === 0
          ? "Build to store and activate relics"
          : `${this.getActiveRelicSlotCount()} active relic slots`
      };
      return effects[buildingKey];
    }

    upgradeBuilding(buildingKey) {
      const building = C.DATA.buildings[buildingKey];
      if (!building || !this.isUnlocked(building.requiredRank)) return false;
      const cost = this.getUpgradeCost(buildingKey);
      if (!this.spend(cost)) return false;
      this.state.buildings[buildingKey] += 1;
      this.addXP(C.DATA.xpRewards.building, "Building upgrade");
      this.save();
      this.notify("building", { buildingKey });
      return true;
    }

    performRitual(ritualKey) {
      const ritual = C.DATA.rituals[ritualKey];
      if (!ritual || this.state.buildings.ritual < ritual.requiredCircleLevel) return false;
      if (!this.spend(ritual.cost)) return false;

      if (ritualKey === "moonChant") {
        this.state.ritualBoostUntil = Date.now() + 30000;
      }
      if (ritualKey === "hearthFeast") {
        this.state.ritualMoodUntil = Date.now() + 45000;
        this.state.raidFatigue = 0;
        this.changeAllMoods(12);
      }
      this.addXP(C.DATA.xpRewards.ritual, "Ritual");
      this.save();
      this.notify("ritual", { ritualKey });
      return true;
    }

    performMoonChant() {
      return this.performRitual("moonChant");
    }

    changeAllMoods(amount) {
      this.state.followers.forEach((follower) => {
        follower.moodValue = C.Helpers.clamp(follower.moodValue + amount, 0, 100);
      });
    }

    assignJob(followerId, jobKey) {
      if (!this.isUnlocked(5) || !C.DATA.jobs[jobKey]) return false;
      const follower = this.state.followers.find((item) => item.id === followerId);
      if (!follower) return false;
      follower.job = jobKey;
      this.save();
      this.notify("job", { followerId, jobKey });
      return true;
    }

    getGuardHealthBonus() {
      const guards = this.state.followers.filter((follower) => follower.job === "guard").length;
      return Math.floor(guards / 2);
    }

    getRaidStats() {
      const training = this.state.buildings.training;
      return {
        maxHealth: 5 + Math.floor(training / 2) + this.getGuardHealthBonus() + (this.hasActiveRelic("softSkull") ? 1 : 0),
        damage: 1 + Math.floor((training + 1) / 2) + (this.hasActiveRelic("emberCandle") ? 1 : 0)
      };
    }

    recruitFollower() {
      if (this.state.followers.length >= this.getFollowerCapacity()) return null;
      const follower = C.Helpers.createFollower(this.state.followers.map((item) => item.name));
      this.state.followers.push(follower);
      this.addXP(C.DATA.xpRewards.recruit, "Follower recruited");
      this.save();
      this.notify("follower", follower);
      return follower;
    }

    getRecruitChance() {
      return C.DATA.raid.recruitChance + (this.hasActiveRelic("mushroomHalo") ? 0.15 : 0);
    }

    applyRaidRewardBonuses(rewards) {
      const adjusted = { ...rewards };
      if (this.hasActiveRelic("hungryIdol")) adjusted.food *= 1.25;
      if (this.hasActiveRelic("boneCrown")) adjusted.bones *= 1.3;
      if (this.hasActiveRelic("whisperingTwig")) adjusted.wood *= 1.3;
      Object.keys(adjusted).forEach((key) => {
        adjusted[key] = Math.round(adjusted[key]);
      });
      return adjusted;
    }

    getRaidXP() {
      const base = C.DATA.xpRewards.raidClear;
      return Math.round(base * (this.hasActiveRelic("doomMask") ? 1.25 : 1));
    }

    addRelic(relicId) {
      if (!C.DATA.relics.some((relic) => relic.id === relicId)) return null;
      if (this.state.relics.includes(relicId)) {
        this.addResources({ bones: 6 }, "duplicateRelic");
        return { duplicate: true, bones: 6 };
      }
      this.state.relics.push(relicId);
      if (this.state.buildings.vault >= 1 && this.state.activeRelics.length < this.getActiveRelicSlotCount()) {
        this.state.activeRelics.push(relicId);
      }
      this.save();
      this.notify("relic", { relicId });
      return { duplicate: false };
    }

    toggleRelic(relicId) {
      if (!this.state.relics.includes(relicId) || this.state.buildings.vault < 1) return false;
      const index = this.state.activeRelics.indexOf(relicId);
      if (index >= 0) {
        this.state.activeRelics.splice(index, 1);
      } else {
        if (this.state.activeRelics.length >= this.getActiveRelicSlotCount()) return false;
        this.state.activeRelics.push(relicId);
      }
      this.save();
      this.notify("relicToggle", { relicId });
      return true;
    }

    getRandomRelicId() {
      return C.Helpers.randomItem(C.DATA.relics).id;
    }

    recordRaid(outcome) {
      this.state.raidFatigue = C.Helpers.clamp(this.state.raidFatigue + (outcome === "victory" ? 1 : 0.5), 0, 4);
      if (outcome === "victory") this.state.raidsCompleted += 1;
      if (!this.state.pendingEventId && Math.random() < 0.62) this.queueCampEvent();
      this.save();
    }

    queueCampEvent() {
      const choices = C.DATA.campEvents.filter((event) => event.id !== this.state.pendingEventId);
      this.state.pendingEventId = C.Helpers.randomItem(choices).id;
      this.state.lastEventAt = Date.now();
      this.save();
      this.notify("eventQueued", { eventId: this.state.pendingEventId });
    }

    getPendingEvent() {
      return C.DATA.campEvents.find((event) => event.id === this.state.pendingEventId) || null;
    }

    resolveCampEvent(choiceIndex) {
      const event = this.getPendingEvent();
      const choice = event && event.choices[choiceIndex];
      if (!choice) return { success: false };
      if (choice.condition && !this.canAfford(choice.condition)) return { success: false, reason: "cost" };

      const effects = choice.effects || {};
      if (effects.resources) this.addResources(effects.resources, "event");
      if (effects.mood) this.changeAllMoods(effects.mood);
      if (effects.fatigue) this.state.raidFatigue = C.Helpers.clamp(this.state.raidFatigue + effects.fatigue, 0, 4);
      let follower = null;
      if (effects.follower) follower = this.recruitFollower();
      this.state.pendingEventId = null;
      this.state.lastEventAt = Date.now();
      this.save();
      this.notify("eventResolved", { eventId: event.id, choiceIndex });
      return { success: true, result: choice.result, follower };
    }
  }

  C.store = new GameStore();
})();
