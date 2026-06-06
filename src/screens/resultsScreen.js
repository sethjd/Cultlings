(function () {
  const C = window.Cultlings = window.Cultlings || {};

  function recruitMarkup(result, victory) {
    if (!result.recruitedFollower) {
      return `<p class="result-note">${victory
        ? "No new follower this time. Something watched from the trees."
        : "The cult leaves a tiny lantern on for you."}</p>`;
    }
    if (!result.follower) {
      return `<p class="result-note">A stray wanted to join, but every hut is already snoring.</p>`;
    }
    return `
      <div class="recruit-card">
        <div class="follower-avatar" style="--follower-color:${result.follower.color}">
          <i class="follower-ear ear-left"></i><i class="follower-ear ear-right"></i>
          <i class="follower-eye eye-left"></i><i class="follower-eye eye-right"></i>
        </div>
        <div>
          <span>A stray joins the cult</span>
          <strong>${result.follower.name}</strong>
          <small>${result.follower.trait} - +${C.DATA.xpRewards.recruit} XP</small>
        </div>
      </div>
    `;
  }

  function relicMarkup(result) {
    if (!result.relicId) return "";
    const relic = C.DATA.relics.find((item) => item.id === result.relicId);
    if (!relic) return "";
    if (result.relicResult && result.relicResult.duplicate) {
      return `
        <div class="result-relic duplicate-relic">
          <span>${relic.symbol}</span>
          <div><small>Duplicate relic</small><strong>${relic.name}</strong><p>Converted into 6 bone shards.</p></div>
        </div>
      `;
    }
    return `
      <div class="result-relic">
        <span>${relic.symbol}</span>
        <div><small>Relic discovered</small><strong>${relic.name}</strong><p>${relic.description}</p></div>
      </div>
    `;
  }

  C.ResultsScreen = {
    render(root, result) {
      const victory = result.outcome === "victory";
      const asyncRaid = Boolean(result.asyncRaid);
      const defenderName = asyncRaid
        ? C.UI.escapeHtml(result.asyncRaid.defender.displayName || "Unknown Cult")
        : "";
      const rewardCards = Object.entries(result.rewards).map(([resource, amount]) => `
        <div class="reward-card reward-${resource}">
          <span class="resource-icon ${resource === "devotion" ? "devotion-icon" : `${resource}-icon`}"></span>
          <strong>+${Math.floor(amount)}</strong>
          <small>${C.DATA.resources[resource].label}</small>
        </div>
      `).join("");

      root.innerHTML = `
        <section class="results-screen screen ${victory ? "is-victory" : "is-defeat"}">
          <div class="result-sigil" aria-hidden="true"><span>${victory ? "&#9790;" : "X"}</span></div>
          <p class="eyebrow">${asyncRaid ? "Asynchronous raid report" : victory ? "Expedition complete" : "Expedition interrupted"}</p>
          <h1>${asyncRaid
            ? victory ? "Cult Raided" : "Defense Held"
            : victory ? "Brute Extinguished" : "Bonked by Candlelight"}</h1>
          <p class="result-summary">
            ${asyncRaid
              ? victory
                ? `${defenderName}'s saved defenses were defeated. The defender will see the result later.`
                : `${defenderName}'s guards held the shrine. The battle report has still been recorded.`
              : victory
              ? "Three rooms cleared. The Wax-Head Brute has reconsidered being on fire."
              : `${result.roomsCleared || 0} room${result.roomsCleared === 1 ? "" : "s"} cleared before a dignified retreat.`}
          </p>

          <div class="reward-grid">${rewardCards}</div>

          ${victory ? `
            <div class="xp-result">
              <span>Godling XP</span>
              <strong>+${result.xp}</strong>
              ${result.ranksGained ? `<small>Rank up! Godling Rank ${C.store.getRank()} reached.</small>` : ""}
            </div>
          ` : ""}

          ${asyncRaid ? `
            <div class="async-report-card">
              <span>${result.asyncRecordError ? "Local report only" : "Raid result recorded"}</span>
              <strong>${defenderName}</strong>
              <small>${result.asyncRecordError
                ? "Firebase was unavailable. Your local rewards are safe."
                : C.MultiplayerService.mode === "firebase"
                  ? "Stored in Firestore for the defender inbox."
                  : "Stored in mock multiplayer history."}</small>
            </div>
          ` : `${relicMarkup(result)}${recruitMarkup(result, victory)}`}

          <button id="return-camp" class="button button-primary button-huge">
            Return to Camp
            <small>${asyncRaid ? "Check the multiplayer inbox" : C.store.getPendingEvent() ? "Something is happening back home" : "Your followers are pretending to work"}</small>
          </button>
        </section>
      `;

      const returnButton = root.querySelector("#return-camp");
      const returnToCamp = () => C.App.show("camp");
      returnButton.addEventListener("click", returnToCamp);
      return () => returnButton.removeEventListener("click", returnToCamp);
    }
  };
})();
