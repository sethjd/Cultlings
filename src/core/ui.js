(function () {
  const C = window.Cultlings = window.Cultlings || {};

  C.UI = {
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
      const labels = { devotion: "D", food: "F", wood: "W", bones: "B" };
      return Object.entries(cost)
        .map(([resource, amount]) => `<span class="mini-cost mini-${resource}">${labels[resource]} ${amount}</span>`)
        .join("");
    }
  };
})();
