(function () {
  const C = window.Cultlings = window.Cultlings || {};

  C.TitleScreen = {
    render(root) {
      root.innerHTML = `
        <section class="title-screen screen">
          <div class="title-stars" aria-hidden="true"></div>
          <div class="title-moon" aria-hidden="true"></div>
          <div class="godling title-godling" aria-hidden="true">
            <span class="godling-horn horn-left"></span>
            <span class="godling-horn horn-right"></span>
            <span class="godling-face">
              <i class="eye eye-left"></i>
              <i class="eye eye-right"></i>
              <i class="tiny-mouth"></i>
            </span>
            <span class="godling-body"></span>
          </div>
          <div class="title-copy">
            <p class="eyebrow">A very small dark age</p>
            <h1>Cultlings</h1>
            <p class="title-tagline">Your divinity failed. Your tiny followers did not get the memo.</p>
          </div>
          <button id="start-game" class="button button-primary button-huge">
            <span>Start Game</span>
            <small>Rebuild something questionable</small>
          </button>
          <p class="title-footnote">Best enjoyed with snacks and poor judgment.</p>
        </section>
      `;

      const startButton = root.querySelector("#start-game");
      const start = () => C.App.show("camp");
      startButton.addEventListener("click", start);

      return () => startButton.removeEventListener("click", start);
    }
  };
})();
