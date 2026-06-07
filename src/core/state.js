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

  function localDateKey(date) {
    const value = date || new Date();
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function starterCosmetics() {
    return ["maskBareMoon", "shrineDampStone", "hatSoftCap", "bannerLittleMoon", "sigilCrookedMoon"];
  }

  function starterDiscoveries(followers) {
    const followerIds = C.RETENTION.collections.followers
      .filter((entry) => followers.some((follower) => follower.trait === entry.match))
      .map((entry) => entry.id);
    return {
      followers: followerIds,
      relics: [],
      enemies: [],
      cosmetics: starterCosmetics()
    };
  }

  function defaultState() {
    const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const followers = makeStarterFollowers();
    return {
      version: C.DATA.version,
      resources: { ...C.DATA.starterResources },
      followers,
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
      ritualCooldowns: {},
      nextRaidDamageBonus: 0,
      raidFatigue: 0,
      raidsCompleted: 0,
      cosmeticTokens: 0,
      dailyRewards: {
        lastClaimDate: "",
        streak: 0,
        cycleDay: 0,
        totalClaims: 0
      },
      quests: {
        dailyDate: "",
        dailyIds: [],
        dailyProgress: {},
        dailyClaimed: [],
        permanentClaimed: []
      },
      cosmetics: {
        unlocked: starterCosmetics(),
        equipped: {
          masks: "maskBareMoon",
          shrines: "shrineDampStone",
          hats: "hatSoftCap",
          banners: "bannerLittleMoon",
          sigils: "sigilCrookedMoon"
        }
      },
      profile: {
        titleId: "candleWhisperer",
        stats: {
          followersRecruited: 0,
          enemiesDefeated: 0,
          asyncWins: 0,
          asyncLosses: 0,
          ritualsPerformed: 0,
          buildingsUpgraded: 0,
          devotionCollected: 0,
          followersFed: 0,
          relicFinds: 0
        }
      },
      discoveries: starterDiscoveries(followers),
      pendingEventId: null,
      lastEventAt: Date.now(),
      multiplayer: {
        displayName: `Cultling_${suffix}`,
        defenseModifiers: ["sturdyWalls"],
        lastCloudSyncAt: 0,
        lastPublishedAt: 0
      },
      tutorialCompleted: false,
      settings: { sound: true, volume: 0.55, reducedMotion: false },
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

    const migrated = {
      ...defaults,
      ...saved,
      version: C.DATA.version,
      resources: { ...defaults.resources, ...(saved.resources || {}) },
      buildings: { ...defaults.buildings, ...(saved.buildings || {}) },
      settings: { ...defaults.settings, ...(saved.settings || {}) },
      multiplayer: { ...defaults.multiplayer, ...(saved.multiplayer || {}) },
      dailyRewards: { ...defaults.dailyRewards, ...(saved.dailyRewards || {}) },
      quests: {
        ...defaults.quests,
        ...(saved.quests || {}),
        dailyIds: Array.isArray(saved.quests && saved.quests.dailyIds) ? saved.quests.dailyIds : [],
        dailyProgress: { ...defaults.quests.dailyProgress, ...((saved.quests && saved.quests.dailyProgress) || {}) },
        dailyClaimed: Array.isArray(saved.quests && saved.quests.dailyClaimed) ? saved.quests.dailyClaimed : [],
        permanentClaimed: Array.isArray(saved.quests && saved.quests.permanentClaimed) ? saved.quests.permanentClaimed : []
      },
      cosmetics: {
        ...defaults.cosmetics,
        ...(saved.cosmetics || {}),
        unlocked: Array.from(new Set([
          ...starterCosmetics(),
          ...(Array.isArray(saved.cosmetics && saved.cosmetics.unlocked) ? saved.cosmetics.unlocked : [])
        ])),
        equipped: {
          ...defaults.cosmetics.equipped,
          ...((saved.cosmetics && saved.cosmetics.equipped) || {})
        }
      },
      profile: {
        ...defaults.profile,
        ...(saved.profile || {}),
        stats: {
          ...defaults.profile.stats,
          ...((saved.profile && saved.profile.stats) || {}),
          followersRecruited: Number.isFinite(saved.profile && saved.profile.stats && saved.profile.stats.followersRecruited)
            ? saved.profile.stats.followersRecruited
            : Math.max(0, followers.length - 5)
        }
      },
      discoveries: {
        followers: Array.from(new Set([
          ...starterDiscoveries(followers).followers,
          ...(Array.isArray(saved.discoveries && saved.discoveries.followers) ? saved.discoveries.followers : [])
        ])),
        relics: Array.from(new Set([
          ...(Array.isArray(saved.relics) ? saved.relics : []),
          ...(Array.isArray(saved.discoveries && saved.discoveries.relics) ? saved.discoveries.relics : [])
        ])),
        enemies: Array.isArray(saved.discoveries && saved.discoveries.enemies) ? saved.discoveries.enemies : [],
        cosmetics: Array.from(new Set([
          ...starterCosmetics(),
          ...(Array.isArray(saved.cosmetics && saved.cosmetics.unlocked) ? saved.cosmetics.unlocked : []),
          ...(Array.isArray(saved.discoveries && saved.discoveries.cosmetics) ? saved.discoveries.cosmetics : [])
        ]))
      },
      ritualCooldowns: { ...defaults.ritualCooldowns, ...(saved.ritualCooldowns || {}) },
      followers,
      relics: Array.isArray(saved.relics) ? saved.relics : [],
      activeRelics: Array.isArray(saved.activeRelics) ? saved.activeRelics : [],
      lastTickAt: Date.now()
    };
    migrated.profile.stats.relicFinds = Math.max(
      migrated.profile.stats.relicFinds || 0,
      migrated.relics.length
    );
    migrated.raidsCompleted = Number.isFinite(saved.raidsCompleted) ? saved.raidsCompleted : 0;
    return migrated;
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
      this.ensureDailyQuests();
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

    setSoundEnabled(enabled) {
      this.state.settings.sound = Boolean(enabled);
      this.save();
      this.notify("audioSettings", { sound: this.state.settings.sound });
    }

    setVolume(volume) {
      this.state.settings.volume = C.Helpers.clamp(Number(volume) || 0, 0, 1);
      this.save();
      this.notify("audioSettings", { volume: this.state.settings.volume });
    }

    getLocalDateKey(date) {
      return localDateKey(date);
    }

    getDaysBetween(firstKey, secondKey) {
      if (!firstKey || !secondKey) return Number.POSITIVE_INFINITY;
      const first = firstKey.split("-").map(Number);
      const second = secondKey.split("-").map(Number);
      const firstDate = new Date(first[0], first[1] - 1, first[2], 12);
      const secondDate = new Date(second[0], second[1] - 1, second[2], 12);
      return Math.round((secondDate - firstDate) / 86400000);
    }

    ensureDailyQuests(date) {
      const dateKey = localDateKey(date);
      if (this.state.quests.dailyDate === dateKey && this.state.quests.dailyIds.length) return false;
      const definitions = C.RETENTION.quests.daily;
      let hash = 0;
      for (let index = 0; index < dateKey.length; index += 1) {
        hash = ((hash * 31) + dateKey.charCodeAt(index)) >>> 0;
      }
      const offset = hash % definitions.length;
      this.state.quests.dailyDate = dateKey;
      this.state.quests.dailyIds = Array.from({ length: Math.min(4, definitions.length) }, (_, index) => (
        definitions[(offset + (index * 2)) % definitions.length].id
      ));
      this.state.quests.dailyProgress = {};
      this.state.quests.dailyClaimed = [];
      this.save();
      return true;
    }

    getDailyQuests(date) {
      this.ensureDailyQuests(date);
      return this.state.quests.dailyIds
        .map((id) => C.RETENTION.quests.daily.find((quest) => quest.id === id))
        .filter(Boolean);
    }

    getMetricValue(metric) {
      const values = {
        rank: this.getRank(),
        followerCount: this.state.followers.length,
        shrineLevel: this.state.buildings.shrine,
        asyncWins: this.state.profile.stats.asyncWins,
        relicFinds: this.state.profile.stats.relicFinds,
        relicCount: this.state.relics.length,
        raidClearTotal: this.state.raidsCompleted
      };
      return Number.isFinite(values[metric]) ? values[metric] : 0;
    }

    recordMetric(metric, amount) {
      const increment = Math.max(0, Number(amount) || 0);
      if (!increment) return;
      this.ensureDailyQuests();
      const statMap = {
        followerRecruit: "followersRecruited",
        enemyDefeat: "enemiesDefeated",
        ritual: "ritualsPerformed",
        buildingUpgrade: "buildingsUpgraded",
        devotionCollected: "devotionCollected",
        feedFollowers: "followersFed"
      };
      if (statMap[metric]) this.state.profile.stats[statMap[metric]] += increment;
      this.getDailyQuests().forEach((quest) => {
        if (quest.metric !== metric) return;
        this.state.quests.dailyProgress[quest.id] =
          (this.state.quests.dailyProgress[quest.id] || 0) + increment;
      });
    }

    getQuestProgress(quest, scope) {
      if (scope === "permanent") return this.getMetricValue(quest.metric);
      return this.state.quests.dailyProgress[quest.id] || 0;
    }

    isQuestClaimed(questId, scope) {
      const list = scope === "permanent"
        ? this.state.quests.permanentClaimed
        : this.state.quests.dailyClaimed;
      return list.includes(questId);
    }

    applyRetentionReward(reward, reason) {
      const result = { resources: {}, xp: 0, tokens: 0, relicId: null };
      if (reward.resources) {
        result.resources = { ...reward.resources };
        this.addResources(reward.resources, reason || "retentionReward");
      }
      if (reward.xp) {
        result.xp = reward.xp;
        this.addXP(reward.xp, reason || "Retention reward");
      }
      if (reward.tokens) {
        result.tokens = reward.tokens;
        this.state.cosmeticTokens += reward.tokens;
      }
      if (reward.relicChance && Math.random() < reward.relicChance) {
        result.relicId = this.getRandomRelicId();
        this.addRelic(result.relicId);
      }
      this.save();
      this.notify(reason || "retentionReward", result);
      return result;
    }

    claimQuest(questId, scope) {
      this.ensureDailyQuests();
      const definitions = scope === "permanent"
        ? C.RETENTION.quests.permanent
        : this.getDailyQuests();
      const quest = definitions.find((entry) => entry.id === questId);
      if (!quest || this.isQuestClaimed(questId, scope)) return null;
      if (this.getQuestProgress(quest, scope) < quest.target) return null;
      const claimList = scope === "permanent"
        ? this.state.quests.permanentClaimed
        : this.state.quests.dailyClaimed;
      claimList.push(questId);
      const result = this.applyRetentionReward(quest.reward, "questReward");
      this.save();
      this.notify("questClaimed", { questId, scope, result });
      return result;
    }

    getDailyRewardStatus(date) {
      const today = localDateKey(date);
      const daily = this.state.dailyRewards;
      const claimedToday = daily.lastClaimDate === today;
      const gap = this.getDaysBetween(daily.lastClaimDate, today);
      const nextStreak = claimedToday
        ? daily.streak
        : gap === 1
          ? daily.streak + 1
          : 1;
      const nextDay = ((Math.max(1, nextStreak) - 1) % 7) + 1;
      return {
        today,
        claimedToday,
        streak: daily.streak,
        nextStreak,
        nextDay,
        reward: C.RETENTION.dailyRewards[nextDay - 1]
      };
    }

    claimDailyReward(date) {
      const status = this.getDailyRewardStatus(date);
      if (status.claimedToday) return null;
      this.state.dailyRewards.lastClaimDate = status.today;
      this.state.dailyRewards.streak = status.nextStreak;
      this.state.dailyRewards.cycleDay = status.nextDay;
      this.state.dailyRewards.totalClaims += 1;
      const result = this.applyRetentionReward(status.reward.reward, "dailyReward");
      this.save();
      this.notify("dailyClaimed", { day: status.nextDay, reward: status.reward, result });
      return { day: status.nextDay, reward: status.reward, result };
    }

    getCosmetic(cosmeticId) {
      return C.RETENTION.cosmetics.find((item) => item.id === cosmeticId) || null;
    }

    isCosmeticUnlocked(cosmeticId) {
      return this.state.cosmetics.unlocked.includes(cosmeticId);
    }

    unlockCosmetic(cosmeticId) {
      const cosmetic = this.getCosmetic(cosmeticId);
      if (!cosmetic || this.isCosmeticUnlocked(cosmeticId)) return false;
      if (this.state.cosmeticTokens < cosmetic.cost) return false;
      this.state.cosmeticTokens -= cosmetic.cost;
      this.state.cosmetics.unlocked.push(cosmeticId);
      this.discover("cosmetics", cosmeticId);
      this.save();
      this.notify("cosmeticUnlocked", { cosmeticId });
      return true;
    }

    equipCosmetic(cosmeticId) {
      const cosmetic = this.getCosmetic(cosmeticId);
      if (!cosmetic || !this.isCosmeticUnlocked(cosmeticId)) return false;
      this.state.cosmetics.equipped[cosmetic.category] = cosmeticId;
      this.save();
      this.notify("cosmeticEquipped", { cosmeticId, category: cosmetic.category });
      return true;
    }

    getEquippedCosmetic(category) {
      return this.getCosmetic(this.state.cosmetics.equipped[category]);
    }

    discover(category, entryId) {
      const list = this.state.discoveries[category];
      if (!Array.isArray(list) || list.includes(entryId)) return false;
      list.push(entryId);
      this.save();
      this.notify("discovery", { category, entryId });
      return true;
    }

    discoverFollowerTrait(traitName) {
      const entry = C.RETENTION.collections.followers.find((item) => item.match === traitName);
      if (entry) this.discover("followers", entry.id);
    }

    discoverEnemyByName(enemyName) {
      const entry = C.RETENTION.collections.enemies.find((item) => (
        item.match === enemyName || (item.id === "cultGuard" && ![
          "Candle Goblin", "Bone Beetle", "Hex Wisp", "The Wax-Head Brute"
        ].includes(enemyName))
      ));
      if (entry) this.discover("enemies", entry.id);
    }

    getUnlockedTitles() {
      return C.RETENTION.titles.filter((title) => this.getMetricValue(title.metric) >= title.target);
    }

    selectTitle(titleId) {
      if (!this.getUnlockedTitles().some((title) => title.id === titleId)) return false;
      this.state.profile.titleId = titleId;
      this.save();
      this.notify("title", { titleId });
      return true;
    }

    getSelectedTitle() {
      return this.getUnlockedTitles().find((title) => title.id === this.state.profile.titleId) ||
        C.RETENTION.titles[0];
    }

    feedFollowers() {
      const foodCost = Math.max(4, Math.ceil(this.state.followers.length * 0.8));
      if (this.state.resources.food < foodCost) return false;
      this.state.resources.food -= foodCost;
      this.changeAllMoods(8);
      this.recordMetric("feedFollowers", 1);
      this.save();
      this.notify("followersFed", { foodCost });
      return { foodCost };
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
        ritualCooldowns: { ...this.state.ritualCooldowns },
        nextRaidDamageBonus: this.state.nextRaidDamageBonus,
        raidFatigue: this.state.raidFatigue,
        raidsCompleted: this.state.raidsCompleted,
        cosmeticTokens: this.state.cosmeticTokens,
        dailyRewards: { ...this.state.dailyRewards },
        quests: {
          ...this.state.quests,
          dailyIds: [...this.state.quests.dailyIds],
          dailyProgress: { ...this.state.quests.dailyProgress },
          dailyClaimed: [...this.state.quests.dailyClaimed],
          permanentClaimed: [...this.state.quests.permanentClaimed]
        },
        cosmetics: {
          unlocked: [...this.state.cosmetics.unlocked],
          equipped: { ...this.state.cosmetics.equipped }
        },
        profile: {
          ...this.state.profile,
          stats: { ...this.state.profile.stats }
        },
        discoveries: {
          followers: [...this.state.discoveries.followers],
          relics: [...this.state.discoveries.relics],
          enemies: [...this.state.discoveries.enemies],
          cosmetics: [...this.state.discoveries.cosmetics]
        }
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
      this.state.ritualCooldowns = { ...defaults.ritualCooldowns, ...(cloudSave.ritualCooldowns || {}) };
      this.state.nextRaidDamageBonus = cloudSave.nextRaidDamageBonus || 0;
      this.state.raidFatigue = cloudSave.raidFatigue || 0;
      this.state.raidsCompleted = cloudSave.raidsCompleted || 0;
      this.state.cosmeticTokens = Number.isFinite(cloudSave.cosmeticTokens) ? cloudSave.cosmeticTokens : this.state.cosmeticTokens;
      if (cloudSave.dailyRewards) {
        this.state.dailyRewards = { ...defaults.dailyRewards, ...cloudSave.dailyRewards };
      }
      if (cloudSave.quests) {
        this.state.quests = {
          ...defaults.quests,
          ...cloudSave.quests,
          dailyIds: Array.isArray(cloudSave.quests.dailyIds) ? cloudSave.quests.dailyIds : [],
          dailyProgress: { ...(cloudSave.quests.dailyProgress || {}) },
          dailyClaimed: Array.isArray(cloudSave.quests.dailyClaimed) ? cloudSave.quests.dailyClaimed : [],
          permanentClaimed: Array.isArray(cloudSave.quests.permanentClaimed) ? cloudSave.quests.permanentClaimed : []
        };
      }
      if (cloudSave.cosmetics) {
        this.state.cosmetics = {
          unlocked: Array.from(new Set([
            ...starterCosmetics(),
            ...(Array.isArray(cloudSave.cosmetics.unlocked) ? cloudSave.cosmetics.unlocked : [])
          ])),
          equipped: { ...defaults.cosmetics.equipped, ...(cloudSave.cosmetics.equipped || {}) }
        };
      }
      if (cloudSave.profile) {
        this.state.profile = {
          ...defaults.profile,
          ...cloudSave.profile,
          stats: { ...defaults.profile.stats, ...(cloudSave.profile.stats || {}) }
        };
      }
      if (cloudSave.discoveries) {
        this.state.discoveries = {
          followers: Array.from(new Set([
            ...starterDiscoveries(this.state.followers).followers,
            ...(Array.isArray(cloudSave.discoveries.followers) ? cloudSave.discoveries.followers : [])
          ])),
          relics: Array.from(new Set([
            ...this.state.relics,
            ...(Array.isArray(cloudSave.discoveries.relics) ? cloudSave.discoveries.relics : [])
          ])),
          enemies: Array.isArray(cloudSave.discoveries.enemies) ? cloudSave.discoveries.enemies : [],
          cosmetics: Array.from(new Set([
            ...starterCosmetics(),
            ...(Array.isArray(cloudSave.cosmetics && cloudSave.cosmetics.unlocked) ? cloudSave.cosmetics.unlocked : []),
            ...(Array.isArray(cloudSave.discoveries.cosmetics) ? cloudSave.discoveries.cosmetics : [])
          ]))
        };
      } else {
        this.state.discoveries.followers = Array.from(new Set([
          ...this.state.discoveries.followers,
          ...starterDiscoveries(this.state.followers).followers
        ]));
        this.state.discoveries.relics = Array.from(new Set([
          ...this.state.discoveries.relics,
          ...this.state.relics
        ]));
      }
      this.ensureDailyQuests();
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
        const before = this.state.resources[resource];
        this.state.resources[resource] = C.Helpers.clamp(before + gain, 0, max);
        if (resource === "devotion") {
          this.recordMetric("devotionCollected", this.state.resources[resource] - before);
        }
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
        const before = this.state.resources[resource];
        this.state.resources[resource] = C.Helpers.clamp(before + amount, 0, max);
        if (resource === "devotion" && amount > 0) {
          this.recordMetric("devotionCollected", this.state.resources[resource] - before);
        }
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
      this.recordMetric("buildingUpgrade", 1);
      this.addXP(C.DATA.xpRewards.building, "Building upgrade");
      this.save();
      this.notify("building", { buildingKey });
      return true;
    }

    performRitual(ritualKey) {
      const ritual = C.DATA.rituals[ritualKey];
      if (!ritual || this.state.buildings.ritual < ritual.requiredCircleLevel) return false;
      const cooldownUntil = this.state.ritualCooldowns[ritualKey] || 0;
      if (cooldownUntil > Date.now()) return false;
      if (ritualKey === "tinyTeeth" && this.state.nextRaidDamageBonus > 0) return false;
      const resourceCost = Object.fromEntries(
        Object.entries(ritual.cost).filter(([resource]) => resource !== "mood")
      );
      const moodCost = ritual.cost.mood || 0;
      if (moodCost && this.state.followers.some((follower) => follower.moodValue < moodCost)) return false;
      if (Object.keys(resourceCost).length && !this.spend(resourceCost)) return false;
      if (moodCost) this.changeAllMoods(-moodCost);

      if (ritualKey === "moonChant") {
        this.state.ritualBoostUntil = Date.now() + 30000;
      }
      if (ritualKey === "hearthFeast") {
        this.state.ritualMoodUntil = Date.now() + 45000;
        this.state.raidFatigue = 0;
        this.changeAllMoods(12);
      }
      if (ritualKey === "soupOfShadows") {
        this.addResources({ food: 16 }, "ritualReward");
        this.changeAllMoods(6);
      }
      if (ritualKey === "candleTax") {
        this.addResources({ devotion: 28, wood: 7 }, "ritualReward");
      }
      if (ritualKey === "tinyTeeth") {
        this.state.nextRaidDamageBonus = 1;
      }
      if (ritual.cooldownSeconds) {
        this.state.ritualCooldowns[ritualKey] = Date.now() + (ritual.cooldownSeconds * 1000);
      }
      this.recordMetric("ritual", 1);
      this.addXP(C.DATA.xpRewards.ritual, "Ritual");
      this.save();
      this.notify("ritual", { ritualKey });
      return true;
    }

    performMoonChant() {
      return this.performRitual("moonChant");
    }

    getRitualStatus(ritualKey) {
      const cooldownUntil = this.state.ritualCooldowns[ritualKey] || 0;
      const cooldownRemaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      const activeRemaining = ritualKey === "moonChant"
        ? Math.max(0, Math.ceil((this.state.ritualBoostUntil - Date.now()) / 1000))
        : 0;
      return {
        cooldownRemaining,
        activeRemaining,
        prepared: ritualKey === "tinyTeeth" && this.state.nextRaidDamageBonus > 0,
        blocked: cooldownRemaining > 0 || activeRemaining > 0 ||
          (ritualKey === "tinyTeeth" && this.state.nextRaidDamageBonus > 0)
      };
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
        damage: 1 + Math.floor((training + 1) / 2) + (this.hasActiveRelic("emberCandle") ? 1 : 0) +
          (this.state.nextRaidDamageBonus || 0)
      };
    }

    beginRaidStats() {
      const stats = this.getRaidStats();
      if (this.state.nextRaidDamageBonus > 0) {
        this.state.nextRaidDamageBonus = 0;
        this.save();
        this.notify("raidBlessingUsed");
      }
      return stats;
    }

    recruitFollower() {
      if (this.state.followers.length >= this.getFollowerCapacity()) return null;
      const follower = C.Helpers.createFollower(this.state.followers.map((item) => item.name));
      this.state.followers.push(follower);
      this.recordMetric("followerRecruit", 1);
      this.discoverFollowerTrait(follower.trait);
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
      this.state.profile.stats.relicFinds += 1;
      this.discover("relics", relicId);
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

    recordRaid(result) {
      const outcome = typeof result === "string" ? result : result.outcome;
      const isAsync = Boolean(result && typeof result === "object" && result.asyncRaid);
      this.state.raidFatigue = C.Helpers.clamp(this.state.raidFatigue + (outcome === "victory" ? 1 : 0.5), 0, 4);
      if (outcome === "victory") {
        this.state.raidsCompleted += 1;
        this.recordMetric("raidClear", 1);
      }
      if (result && result.stats && result.stats.enemiesDefeated) {
        this.recordMetric("enemyDefeat", result.stats.enemiesDefeated);
      }
      if (isAsync) {
        if (outcome === "victory") this.state.profile.stats.asyncWins += 1;
        else this.state.profile.stats.asyncLosses += 1;
      }
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
