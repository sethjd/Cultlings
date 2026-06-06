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

    finishRaid(result) {
      result.rewards = C.store.applyRaidRewardBonuses(result.rewards);
      C.store.addResources(result.rewards, "raidRewards");
      if (result.outcome === "victory") {
        result.xp = C.store.getRaidXP();
        result.ranksGained = C.store.addXP(result.xp, "Raid cleared");
      } else {
        result.xp = 0;
        result.ranksGained = 0;
      }
      if (result.recruitedFollower) {
        const follower = C.store.recruitFollower();
        result.follower = follower;
      }
      if (result.outcome === "victory" && C.store.isUnlocked(3) && Math.random() < C.DATA.raid.relicChance) {
        result.relicId = C.store.getRandomRelicId();
        result.relicResult = C.store.addRelic(result.relicId);
      }
      C.store.recordRaid(result.outcome);
      this.lastRaidResult = result;
      this.show("results", result);
    }
  };

  C.store.subscribe((state, reason, payload) => {
    C.UI.updateResourceBar();
    if (C.App.currentScreen === "camp") {
      if (reason === "production" && payload) {
        const parts = Object.entries(payload)
          .filter((entry) => entry[1] >= 0.04)
          .map(([resource, amount]) => `+${amount.toFixed(1)} ${C.DATA.resources[resource].short}`);
        if (parts.length) C.UI.rewardPopup(parts.join("  "));
      }
      C.CampScreen.refresh(reason);
    }
  });

  window.setInterval(() => C.store.tick(Date.now()), 250);
  window.addEventListener("beforeunload", () => C.store.save());

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.warn("Service worker registration failed.", error);
      });
    });
  }

  C.App.show("title");
})();
