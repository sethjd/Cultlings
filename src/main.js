(function () {
  const C = window.Cultlings = window.Cultlings || {};
  const root = document.getElementById("screen-root");

  const screens = {
    title: C.TitleScreen,
    camp: C.CampScreen,
    raid: C.RaidScreen,
    results: C.ResultsScreen
  };

  C.App = {
    currentScreen: null,
    currentCleanup: null,
    lastRaidResult: null,

    show(screenName, payload) {
      if (!screens[screenName]) return;
      if (this.currentCleanup) this.currentCleanup();
      this.currentScreen = screenName;
      root.innerHTML = "";
      C.UI.setResourceBarVisible(screenName !== "title" && screenName !== "raid");
      this.currentCleanup = screens[screenName].render(root, payload) || null;
      C.UI.updateResourceBar();
      window.scrollTo(0, 0);
    },

    async finishRaid(result) {
      result.rewards = C.store.applyRaidRewardBonuses(result.rewards);
      C.store.addResources(result.rewards, "raidRewards");
      if (result.outcome === "victory") {
        result.xp = result.asyncRaid ? Math.ceil(C.store.getRaidXP() * 0.65) : C.store.getRaidXP();
        result.ranksGained = C.store.addXP(result.xp, "Raid cleared");
      } else {
        result.xp = 0;
        result.ranksGained = 0;
      }
      if (!result.asyncRaid && result.recruitedFollower) {
        const follower = C.store.recruitFollower();
        result.follower = follower;
      }
      if (!result.asyncRaid && result.outcome === "victory" && C.store.isUnlocked(3) && Math.random() < C.DATA.raid.relicChance) {
        result.relicId = C.store.getRandomRelicId();
        result.relicResult = C.store.addRelic(result.relicId);
      }
      C.store.recordRaid(result);
      if (result.asyncRaid) {
        try {
          result.asyncRecord = await C.MultiplayerService.recordRaidResult(result);
        } catch (error) {
          console.warn("Async raid result could not be uploaded.", error);
          result.asyncRecordError = true;
        }
      }
      this.lastRaidResult = result;
      this.show("results", result);
    }
  };

  C.store.subscribe((state, reason, payload) => {
    C.UI.updateResourceBar();
    if ((reason === "audioSettings" || reason === "reset") && C.Audio) C.Audio.refresh();
    if (C.App.currentScreen === "camp") {
      if (reason === "production" && payload) {
        const parts = Object.entries(payload)
          .filter((entry) => entry[1] >= 0.04)
          .map(([resource, amount]) => `+${amount.toFixed(1)} ${C.DATA.resources[resource].short}`);
        if (parts.length) {
          C.UI.rewardPopup(parts.join("  "));
          C.CampScreen.showProduction(payload);
        }
      }
      C.CampScreen.refresh(reason);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (C.Audio) {
      C.Audio.unlock();
      if (event.target.closest("button")) C.Audio.play("tap");
    }
  }, { passive: true });
  document.addEventListener("keydown", () => C.Audio && C.Audio.unlock(), { once: true });

  window.setInterval(() => C.store.tick(Date.now()), 250);
  window.addEventListener("beforeunload", () => C.store.save());

  C.MultiplayerService.subscribe(() => {
    if (C.App.currentScreen === "camp") C.CampScreen.refresh("multiplayer");
  });
  C.MultiplayerService.init().catch((error) => {
    console.warn("Multiplayer initialization failed; using Offline Mode.", error);
  });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.warn("Service worker registration failed.", error);
      });
    });
  }

  C.App.show("title");
})();
