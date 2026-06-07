(function () {
  const C = window.Cultlings = window.Cultlings || {};

  C.UI = {
    asset(path) {
      return `assets/svg/${path}`;
    },

    followerAsset(index) {
      const variants = ["round", "long", "wide", "pointy", "tuft"];
      return C.UI.asset(`characters/follower-${variants[Math.abs(Number(index) || 0) % variants.length]}.svg`);
    },

    buildingAsset(buildingKey) {
      const files = {
        shrine: "shrine",
        huts: "hut",
        ritual: "ritual-circle",
        kitchen: "kitchen",
        training: "training-pit",
        vault: "relic-vault"
      };
      return C.UI.asset(`buildings/${files[buildingKey] || "hut"}.svg`);
    },

    cosmeticAsset(cosmeticId) {
      const files = {
        maskBareMoon: "mask-bare-moon",
        maskWaxSmile: "mask-wax-smile",
        maskBoneVisor: "mask-bone-visor",
        maskMushroom: "mask-mushroom",
        maskStarVeil: "mask-star-veil",
        hatSoftCap: "hat-soft-cap",
        hatCandle: "hat-candle",
        hatMushroom: "hat-mushroom",
        hatBoneBow: "hat-bone-bow",
        hatTwigCrown: "hat-twig-crown",
        bannerLittleMoon: "banner-little-moon",
        bannerCandleTeeth: "banner-candle-teeth",
        bannerSoftSkull: "banner-soft-skull",
        sigilCrookedMoon: "sigil-crooked-moon",
        sigilTeeth: "sigil-teeth",
        sigilMushroomRing: "sigil-mushroom-ring"
      };
      return files[cosmeticId] ? C.UI.asset(`cosmetics/${files[cosmeticId]}.svg`) : "";
    },

    enemyAsset(enemyId) {
      const files = {
        candleGoblin: "candle-goblin",
        boneBeetle: "bone-beetle",
        hexWisp: "hex-wisp",
        sporeImp: "spore-imp",
        bogSkull: "bog-skull",
        graveCandle: "grave-candle",
        bellWraith: "bell-wraith",
        rootGrasper: "root-grasper",
        tinyHeretic: "tiny-heretic",
        waxBrute: "wax-head-brute",
        wetProphet: "big-wet-prophet",
        hollowbell: "saint-hollowbell"
      };
      return files[enemyId] ? C.UI.asset(`enemies/${files[enemyId]}.svg`) : "";
    },

    applyPreferences() {
      if (!C.store) return;
      const settings = C.store.state.settings;
      document.documentElement.classList.toggle("reduced-motion", Boolean(settings.reducedMotion));
      document.documentElement.classList.toggle("large-text", Boolean(settings.largeText));
      document.documentElement.classList.toggle("high-contrast", Boolean(settings.highContrast));
    },

    escapeHtml(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    formatNumber(value) {
      if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
      return Math.floor(value).toString();
    },

    updateResourceBar() {
      const resources = C.store.state.resources;
      document.getElementById("resource-devotion").textContent =
        `${C.UI.formatNumber(resources.devotion)}/${C.store.getMaxDevotion()}`;
      document.getElementById("resource-food").textContent = C.UI.formatNumber(resources.food);
      document.getElementById("resource-wood").textContent = C.UI.formatNumber(resources.wood);
      document.getElementById("resource-bones").textContent = C.UI.formatNumber(resources.bones);
    },

    setResourceBarVisible(visible) {
      document.getElementById("resource-bar").classList.toggle("is-hidden", !visible);
    },

    toast(message, tone) {
      const layer = document.getElementById("toast-layer");
      const toast = document.createElement("div");
      toast.className = `toast ${tone ? `toast-${tone}` : ""}`;
      toast.textContent = message;
      layer.appendChild(toast);
      window.setTimeout(() => toast.remove(), 2300);
    },

    rewardPopup(message) {
      const layer = document.getElementById("toast-layer");
      const popup = document.createElement("div");
      popup.className = "reward-popup";
      popup.textContent = message;
      layer.appendChild(popup);
      window.setTimeout(() => popup.remove(), 1800);
    },

    costMarkup(cost) {
      const labels = { devotion: "D", food: "F", wood: "W", bones: "B", mood: "Mood" };
      return Object.entries(cost)
        .map(([resource, amount]) => `<span class="mini-cost mini-${resource}">
          ${resource === "mood" ? "" : `<i class="resource-icon ${resource === "devotion" ? "devotion-icon" : resource === "bones" ? "bones-icon" : `${resource}-icon`}"></i>`}
          ${labels[resource]} ${amount}
        </span>`)
        .join("");
    }
  };
})();
