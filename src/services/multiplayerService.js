(function () {
  const C = window.Cultlings = window.Cultlings || {};
  const MOCK_PUBLISH_KEY = "cultlings-mock-published-v1";
  const MOCK_RESULTS_KEY = "cultlings-mock-results-v1";

  const MOCK_CULTS = [
    {
      id: "mock-moon-mold",
      ownerId: "mock-moon-mold",
      displayName: "Moon-Mold Family",
      shrineLevel: 2,
      buildings: { shrine: 2, huts: 2, ritual: 2, kitchen: 2, training: 1, vault: 0 },
      guards: [
        { name: "Spore", trait: "Mushroom Blessed", color: "#8cd9c3" },
        { name: "Dampkin", trait: "Lazy but Loyal", color: "#bca7ff" }
      ],
      defenseModifiers: ["guardFervor"],
      basePower: 34,
      publishedAtMs: Date.now() - 18 * 60 * 1000,
      isMock: true
    },
    {
      id: "mock-candle-teeth",
      ownerId: "mock-candle-teeth",
      displayName: "Candle Teeth Circle",
      shrineLevel: 4,
      buildings: { shrine: 4, huts: 3, ritual: 3, kitchen: 2, training: 3, vault: 1 },
      guards: [
        { name: "Gnash", trait: "Afraid of Candles", color: "#f09f8d" },
        { name: "Tallow", trait: "Great Chanter", color: "#d7d47a" },
        { name: "Wick", trait: "Secretly a Rat", color: "#91b9e8" }
      ],
      defenseModifiers: ["sturdyWalls", "hexWards"],
      basePower: 67,
      publishedAtMs: Date.now() - 52 * 60 * 1000,
      isMock: true
    },
    {
      id: "mock-soft-skull",
      ownerId: "mock-soft-skull",
      displayName: "The Soft Skull Choir",
      shrineLevel: 3,
      buildings: { shrine: 3, huts: 4, ritual: 2, kitchen: 3, training: 2, vault: 2 },
      guards: [
        { name: "Hum", trait: "Tiny Prophet", color: "#bca7ff" },
        { name: "Murmur", trait: "Great Chanter", color: "#8cd9c3" }
      ],
      defenseModifiers: ["sturdyWalls"],
      basePower: 49,
      publishedAtMs: Date.now() - 2.3 * 60 * 60 * 1000,
      isMock: true
    }
  ];

  const MOCK_INBOX = [
    {
      id: "mock-inbox-1",
      attackerId: "mock-attacker-1",
      attackerName: "Cultling_0442",
      defenderId: "local-player",
      outcome: "defenseWin",
      rewards: { devotion: 8, bones: 3 },
      defenderReward: { devotion: 8, bones: 3 },
      summary: "Your guards chased the raider into a very judgmental shrub.",
      createdAtMs: Date.now() - 42 * 60 * 1000,
      collected: false,
      isMock: true
    },
    {
      id: "mock-inbox-2",
      attackerId: "mock-attacker-2",
      attackerName: "Cultling_7810",
      defenderId: "local-player",
      outcome: "attackerWin",
      rewards: { devotion: 4, bones: 1 },
      defenderReward: { devotion: 4, bones: 1 },
      summary: "The shrine was raided, but the intruder left an apology bone.",
      createdAtMs: Date.now() - 5.5 * 60 * 60 * 1000,
      collected: false,
      isMock: true
    }
  ];

  function readLocalJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeLocalJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function safeName(value) {
    const trimmed = String(value || "").trim().replace(/[<>]/g, "");
    return trimmed.slice(0, 24);
  }

  class MultiplayerService {
    constructor() {
      this.ready = false;
      this.mode = "offline";
      this.profile = null;
      this.listeners = new Set();
      this.initPromise = null;
    }

    subscribe(listener) {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    notify(reason, payload) {
      this.listeners.forEach((listener) => listener(reason, payload));
    }

    getStatus() {
      const firebase = C.FirebaseService.getStatus();
      return {
        ready: this.ready,
        mode: this.mode,
        online: this.mode === "firebase",
        configured: firebase.configured,
        displayName: C.store.state.multiplayer.displayName,
        uid: firebase.uid
      };
    }

    async init() {
      if (this.initPromise) return this.initPromise;
      this.initPromise = this.initialize();
      return this.initPromise;
    }

    async initialize() {
      const status = await C.FirebaseService.init();
      if (status.connected) {
        this.mode = "firebase";
        await this.loadOrCreateProfile();
      } else {
        this.mode = "offline";
        this.profile = {
          uid: "local-player",
          displayName: C.store.state.multiplayer.displayName
        };
      }
      this.ready = true;
      this.notify("ready", this.getStatus());
      return this.getStatus();
    }

    async loadOrCreateProfile() {
      const firebase = C.FirebaseService;
      const { getDoc, setDoc } = firebase.api;
      const ref = firebase.document("players", firebase.user.uid);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const cloudName = safeName(data.displayName);
        if (cloudName) {
          C.store.state.multiplayer.displayName = cloudName;
          C.store.notify("displayName", { displayName: cloudName });
        }
        this.profile = { uid: firebase.user.uid, ...data };
        return this.profile;
      }

      const now = Date.now();
      const profile = {
        displayName: C.store.state.multiplayer.displayName,
        createdAtMs: now,
        updatedAtMs: now
      };
      await setDoc(ref, profile);
      this.profile = { uid: firebase.user.uid, ...profile };
      return this.profile;
    }

    async setDisplayName(value) {
      const displayName = safeName(value);
      if (displayName.length < 3) throw new Error("Display name must be at least 3 characters.");
      C.store.setDisplayName(displayName);
      if (this.mode === "firebase") {
        const { setDoc } = C.FirebaseService.api;
        await setDoc(
          C.FirebaseService.document("players", C.FirebaseService.user.uid),
          { displayName, updatedAtMs: Date.now() },
          { merge: true }
        );
      }
      if (this.profile) this.profile.displayName = displayName;
      this.notify("profile", { displayName });
      return displayName;
    }

    makeCloudSave() {
      return C.store.exportCloudSave();
    }

    async syncSave(options) {
      if (this.mode !== "firebase") {
        C.store.state.multiplayer.lastCloudSyncAt = Date.now();
        C.store.save();
        return { status: "mock", message: "Offline save checked locally." };
      }

      const firebase = C.FirebaseService;
      const { getDoc, setDoc } = firebase.api;
      const ref = firebase.document("players", firebase.user.uid);
      const snapshot = await getDoc(ref);
      const profile = snapshot.exists() ? snapshot.data() : {};
      const cloudSave = profile.cloudSave || null;
      const localUpdatedAt = C.store.state.lastSavedAt || 0;
      const cloudUpdatedAt = cloudSave && cloudSave.updatedAtMs ? cloudSave.updatedAtMs : 0;

      if (cloudSave && cloudUpdatedAt > localUpdatedAt + 1000 && !(options && options.forceUpload)) {
        return {
          status: "conflict",
          cloudUpdatedAt,
          localUpdatedAt,
          cloudSave: cloudSave.data
        };
      }

      const now = Date.now();
      await setDoc(ref, {
        displayName: C.store.state.multiplayer.displayName,
        updatedAtMs: now,
        cloudSave: {
          data: this.makeCloudSave(),
          updatedAtMs: now
        }
      }, { merge: true });
      C.store.state.multiplayer.lastCloudSyncAt = now;
      C.store.save();
      return { status: "uploaded", updatedAtMs: now };
    }

    applyCloudSave(conflict) {
      if (!conflict || !conflict.cloudSave) return false;
      C.store.importCloudSave(conflict.cloudSave, conflict.cloudUpdatedAt);
      return true;
    }

    getSelectedDefenseModifiers() {
      return C.store.state.multiplayer.defenseModifiers || [];
    }

    setDefenseModifier(modifierId, enabled) {
      const modifiers = new Set(this.getSelectedDefenseModifiers());
      if (enabled) modifiers.add(modifierId);
      else modifiers.delete(modifierId);
      C.store.state.multiplayer.defenseModifiers = Array.from(modifiers).slice(0, 3);
      C.store.save();
      this.notify("defense", { modifierId, enabled });
    }

    createCultSnapshot() {
      const state = C.store.state;
      const guards = state.followers
        .filter((follower) => follower.job === "guard")
        .slice(0, 6)
        .map((follower) => ({
          name: follower.name,
          trait: follower.trait,
          color: follower.color
        }));
      const defenseModifiers = this.getSelectedDefenseModifiers();
      const buildingPower = Object.values(state.buildings).reduce((sum, level) => sum + Math.max(0, level), 0) * 2;
      const basePower =
        (state.buildings.shrine * 6) +
        buildingPower +
        (guards.length * 5) +
        (defenseModifiers.length * 4) +
        (state.activeRelics.length * 3);

      return {
        ownerId: this.mode === "firebase" ? C.FirebaseService.user.uid : "local-player",
        displayName: state.multiplayer.displayName,
        layout: {
          theme: "dampHollow",
          shrinePosition: "center",
          hutsPosition: "middle",
          ritualPosition: "south"
        },
        shrineLevel: state.buildings.shrine,
        buildings: { ...state.buildings },
        guards,
        defenseModifiers,
        activeRelics: state.activeRelics.slice(0, 3),
        basePower,
        publishedAtMs: Date.now()
      };
    }

    async publishCult() {
      const snapshot = this.createCultSnapshot();
      if (this.mode === "firebase") {
        const { setDoc } = C.FirebaseService.api;
        await setDoc(
          C.FirebaseService.document("publicCults", C.FirebaseService.user.uid),
          snapshot
        );
      } else {
        writeLocalJson(MOCK_PUBLISH_KEY, snapshot);
      }
      C.store.state.multiplayer.lastPublishedAt = snapshot.publishedAtMs;
      C.store.save();
      this.notify("published", snapshot);
      return snapshot;
    }

    async listCults() {
      if (this.mode !== "firebase") {
        const ownCult = readLocalJson(MOCK_PUBLISH_KEY, null);
        return ownCult ? [ownCult, ...MOCK_CULTS] : [...MOCK_CULTS];
      }

      const firebase = C.FirebaseService;
      const { getDocs, query, orderBy, limit } = firebase.api;
      const queryRef = query(
        firebase.collection("publicCults"),
        orderBy("publishedAtMs", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(queryRef);
      return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
    }

    async recordRaidResult(result) {
      const defender = result.asyncRaid && result.asyncRaid.defender;
      if (!defender) return null;
      const attackerWin = result.outcome === "victory";
      const defenderReward = attackerWin
        ? { devotion: 4, bones: 1 }
        : { devotion: 8, bones: 3 };
      const record = {
        attackerId: this.mode === "firebase" ? C.FirebaseService.user.uid : "local-player",
        attackerName: C.store.state.multiplayer.displayName,
        defenderId: defender.ownerId || defender.id,
        defenderName: defender.displayName,
        outcome: attackerWin ? "attackerWin" : "defenseWin",
        rewards: { ...result.rewards },
        defenderReward,
        summary: attackerWin
          ? `${C.store.state.multiplayer.displayName} broke through ${defender.displayName}'s shrine defense.`
          : `${defender.displayName}'s guards repelled ${C.store.state.multiplayer.displayName}.`,
        createdAtMs: Date.now(),
        collected: false
      };

      if (this.mode === "firebase") {
        const { addDoc } = C.FirebaseService.api;
        const document = await addDoc(C.FirebaseService.collection("raidResults"), record);
        record.id = document.id;
      } else {
        const records = readLocalJson(MOCK_RESULTS_KEY, []);
        record.id = `mock-result-${Date.now()}`;
        records.unshift(record);
        writeLocalJson(MOCK_RESULTS_KEY, records.slice(0, 30));
      }
      this.notify("raidRecorded", record);
      return record;
    }

    async getInbox() {
      if (this.mode !== "firebase") {
        const stored = readLocalJson(MOCK_RESULTS_KEY, []);
        const incoming = stored.filter((result) => result.defenderId === "local-player");
        const sample = readLocalJson(`${MOCK_RESULTS_KEY}-seed`, null);
        if (sample) return [...incoming, ...sample].sort((a, b) => b.createdAtMs - a.createdAtMs);
        const seeded = MOCK_INBOX.map((result) => ({ ...result }));
        writeLocalJson(`${MOCK_RESULTS_KEY}-seed`, seeded);
        return [...incoming, ...seeded].sort((a, b) => b.createdAtMs - a.createdAtMs);
      }

      const firebase = C.FirebaseService;
      const { getDocs, query, where, limit } = firebase.api;
      const queryRef = query(
        firebase.collection("raidResults"),
        where("defenderId", "==", firebase.user.uid),
        limit(20)
      );
      const snapshot = await getDocs(queryRef);
      return snapshot.docs
        .map((document) => ({ id: document.id, ...document.data() }))
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
    }

    async collectInboxReward(result) {
      if (!result || result.collected) return false;

      if (this.mode === "firebase" && !result.isMock) {
        const { updateDoc } = C.FirebaseService.api;
        await updateDoc(
          C.FirebaseService.document("raidResults", result.id),
          { collected: true, collectedAtMs: Date.now() }
        );
      } else {
        const seedKey = `${MOCK_RESULTS_KEY}-seed`;
        const seed = readLocalJson(seedKey, []);
        const seedIndex = seed.findIndex((item) => item.id === result.id);
        if (seedIndex >= 0) {
          seed[seedIndex].collected = true;
          writeLocalJson(seedKey, seed);
        }
        const stored = readLocalJson(MOCK_RESULTS_KEY, []);
        const storedIndex = stored.findIndex((item) => item.id === result.id);
        if (storedIndex >= 0) {
          stored[storedIndex].collected = true;
          writeLocalJson(MOCK_RESULTS_KEY, stored);
        }
      }
      C.store.addResources(result.defenderReward || { devotion: 3, bones: 1 }, "defenderReward");
      this.notify("rewardCollected", { resultId: result.id });
      return true;
    }
  }

  C.MultiplayerService = new MultiplayerService();
})();
