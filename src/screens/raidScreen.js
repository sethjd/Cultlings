(function () {
  const C = window.Cultlings = window.Cultlings || {};

  const layouts = {
    clearing: [
      { x: 72, y: 180, radius: 27 },
      { x: 292, y: 220, radius: 31 },
      { x: 182, y: 310, radius: 24 }
    ],
    roots: [
      { x: 62, y: 235, radius: 24 },
      { x: 298, y: 235, radius: 24 },
      { x: 180, y: 165, radius: 27 }
    ],
    marsh: [
      { x: 75, y: 190, radius: 25 },
      { x: 285, y: 190, radius: 25 },
      { x: 180, y: 335, radius: 30 }
    ],
    puddles: [
      { x: 62, y: 295, radius: 22 },
      { x: 298, y: 295, radius: 22 },
      { x: 180, y: 195, radius: 25 }
    ],
    crypt: [
      { x: 65, y: 235, radius: 25 },
      { x: 295, y: 235, radius: 25 },
      { x: 180, y: 145, radius: 28 },
      { x: 180, y: 365, radius: 24 }
    ],
    bells: [
      { x: 68, y: 180, radius: 23 },
      { x: 292, y: 180, radius: 23 },
      { x: 110, y: 335, radius: 22 },
      { x: 250, y: 335, radius: 22 }
    ],
    altar: [
      { x: 62, y: 175, radius: 23 },
      { x: 298, y: 175, radius: 23 }
    ]
  };

  const enemyConstructors = {
    candleGoblin: C.CandleGoblin,
    boneBeetle: C.BoneBeetle,
    hexWisp: C.HexWisp,
    sporeImp: C.SporeImp,
    bogSkull: C.BogSkull,
    graveCandle: C.GraveCandle,
    bellWraith: C.BellWraith,
    rootGrasper: C.RootGrasper,
    tinyHeretic: C.TinyHeretic,
    waxBrute: C.WaxHeadBrute,
    wetProphet: C.BigWetProphet,
    hollowbell: C.SaintHollowbell
  };

  const roomPositions = [
    [58, 105], [180, 112], [302, 105], [92, 245],
    [268, 245], [180, 330], [65, 390], [295, 390]
  ];

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function shuffled(items) {
    return items
      .map((item) => ({ item, order: Math.random() }))
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.item);
  }

  function resolveObstacle(actor, obstacle) {
    const dx = actor.x - obstacle.x;
    const dy = actor.y - obstacle.y;
    const minDistance = actor.radius + obstacle.radius;
    const currentDistance = Math.max(0.01, Math.hypot(dx, dy));
    if (currentDistance >= minDistance) return;
    actor.x = obstacle.x + (dx / currentDistance) * minDistance;
    actor.y = obstacle.y + (dy / currentDistance) * minDistance;
  }

  function drawRoom(ctx, time, biome, layoutKey, obstacles, decoration) {
    const width = C.DATA.raid.worldWidth;
    const height = C.DATA.raid.worldHeight;
    const theme = biome.theme;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.top);
    gradient.addColorStop(1, theme.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `${theme.mist}24`;
    for (let index = 0; index < 18; index += 1) {
      const x = (index * 73) % width;
      const y = 66 + ((index * 119) % (height - 80));
      ctx.beginPath();
      ctx.arc(x, y, 2 + (index % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    if (biome.id === "moldmoon") {
      ctx.fillStyle = "rgba(108, 165, 134, .16)";
      for (let index = 0; index < 5; index += 1) {
        ctx.beginPath();
        ctx.ellipse(42 + (index * 70), 150 + ((index % 2) * 170), 34, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(176, 111, 193, .34)";
      for (let index = 0; index < 8; index += 1) {
        ctx.fillRect(25 + ((index * 47) % 320), 95 + ((index * 83) % 350), 4, 12);
        ctx.beginPath();
        ctx.arc(27 + ((index * 47) % 320), 94 + ((index * 83) % 350), 8, Math.PI, Math.PI * 2);
        ctx.fill();
      }
    } else if (biome.id === "bellbone") {
      ctx.strokeStyle = "rgba(218, 208, 171, .18)";
      ctx.lineWidth = 3;
      for (let index = 0; index < 4; index += 1) {
        const x = 50 + (index * 88);
        ctx.beginPath();
        ctx.moveTo(x, 52);
        ctx.lineTo(x, 92);
        ctx.arc(x, 107, 15, Math.PI, 0);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(126, 117, 153, .28)";
      ctx.fillRect(18, 80, 42, 10);
      ctx.fillRect(300, 80, 42, 10);
      ctx.fillRect(128, 438, 104, 9);
    } else {
      ctx.strokeStyle = "rgba(151, 113, 85, .25)";
      ctx.lineWidth = 7;
      for (let index = 0; index < 5; index += 1) {
        ctx.beginPath();
        ctx.moveTo(index * 88, 520);
        ctx.quadraticCurveTo(45 + (index * 65), 390, 20 + (index * 76), 310);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = `${theme.accent}35`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, 270, 90 + Math.sin(time * 0.001) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(120, 270);
    ctx.lineTo(240, 270);
    ctx.moveTo(180, 210);
    ctx.lineTo(180, 330);
    ctx.stroke();

    obstacles.forEach((obstacle, index) => {
      ctx.fillStyle = biome.id === "moldmoon" ? "#324a43" : biome.id === "bellbone" ? "#393346" : "#302b43";
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = biome.id === "moldmoon" ? "#54705e" : biome.id === "bellbone" ? "#6b6278" : "#45405a";
      ctx.beginPath();
      ctx.arc(obstacle.x - 5, obstacle.y - 7, obstacle.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = index % 2 ? theme.accent : theme.mist;
      ctx.beginPath();
      ctx.arc(obstacle.x + 13, obstacle.y - obstacle.radius + 6, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    if (decoration && decoration.complete && decoration.naturalWidth) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(decoration, 0, height - 172, width, 180);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = theme.top;
    ctx.fillRect(0, 0, width, 48);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(width, 48);
    ctx.stroke();
  }

  function createEnemy(enemyId, x, y, index) {
    const EnemyClass = enemyConstructors[enemyId] || C.CandleGoblin;
    return new EnemyClass(x, y, index || 0);
  }

  function multiplayerRoom(defender) {
    const buildings = defender.buildings || {};
    const modifiers = defender.defenseModifiers || [];
    const guards = (defender.guards || []).slice(0, 6);
    const enemies = guards.map((guard, index) => (
      new C.DefenderGuard(roomPositions[index][0], roomPositions[index][1], guard, index)
    ));
    const shrineLevel = Math.max(1, defender.shrineLevel || buildings.shrine || 1);
    const beetleCount = Math.min(3, Math.floor(shrineLevel / 2));
    const wispCount = Math.min(3, Math.floor((buildings.ritual || 0) / 2) + (modifiers.includes("hexWards") ? 1 : 0));

    if (!enemies.length) {
      enemies.push(new C.CandleGoblin(90, 120, 0), new C.CandleGoblin(270, 120, 1));
    }
    for (let index = 0; index < beetleCount; index += 1) {
      enemies.push(new C.BoneBeetle(90 + (index * 90), 205 + ((index % 2) * 65)));
    }
    for (let index = 0; index < wispCount; index += 1) {
      enemies.push(new C.HexWisp(70 + (index * 110), 90));
    }
    if ((defender.basePower || 0) >= 75) enemies.push(new C.WaxHeadBrute(180, 150));

    const healthMultiplier = 1 + Math.min(0.6, (defender.basePower || 0) / 180) +
      (modifiers.includes("sturdyWalls") ? 0.2 : 0);
    enemies.forEach((enemy) => {
      enemy.health = Math.ceil(enemy.health * healthMultiplier);
      enemy.maxHealth = enemy.health;
      if (modifiers.includes("guardFervor")) enemy.speed *= 1.12;
    });

    return {
      name: `${defender.displayName || "Unknown Cult"} Defense`,
      layout: modifiers.includes("hexWards") ? "crypt" : "altar",
      enemies
    };
  }

  function roomChoices(depth, totalRooms) {
    if (depth >= totalRooms - 1) return ["boss"];
    const pool = depth === 0
      ? ["combat", "combat", "rescue", "supplies", "treasure"]
      : ["combat", "elite", "treasure", "rescue", "shrine", "supplies"];
    const choices = [];
    shuffled(pool).forEach((type) => {
      if (!choices.includes(type) && choices.length < 2) choices.push(type);
    });
    if (choices.length < 2) choices.push(choices[0] === "combat" ? "supplies" : "combat");
    return choices;
  }

  C.RaidScreen = {
    render(root, raidPayload) {
      const raidStats = C.store.beginRaidStats();
      const isAsyncRaid = Boolean(raidPayload && raidPayload.mode === "async");
      const requestedBiome = C.store.getBiome((raidPayload && raidPayload.biomeId) || "candlewood");
      const biome = !isAsyncRaid && C.store.isBiomeUnlocked(requestedBiome.id)
        ? requestedBiome
        : C.store.getBiome("candlewood");
      const totalRooms = isAsyncRaid ? 1 : 4 + Math.floor(Math.random() * 3);
      const biomeDecoration = new Image();
      biomeDecoration.src = C.UI.asset(`biomes/${biome.id}-decor.svg`);

      root.innerHTML = `
        <section class="raid-screen screen biome-${biome.id}" style="--biome-accent:${biome.theme.accent};--biome-mist:${biome.theme.mist}">
          <div class="raid-header raid-header-expanded">
            <div>
              <p class="eyebrow" id="raid-biome">${C.UI.escapeHtml(isAsyncRaid ? "Async Cult Raid" : biome.name)}</p>
              <strong id="raid-status">${isAsyncRaid ? "Defense room" : `Entrance - ${totalRooms} rooms ahead`}</strong>
            </div>
            <button id="raid-pause" class="raid-pause-button" aria-label="Pause raid">II</button>
            <div class="raid-health-wrap">
              <span id="health-label">${raidStats.maxHealth}/${raidStats.maxHealth}</span>
              <div class="raid-health-track"><i id="player-health-fill"></i></div>
            </div>
          </div>
          <div class="raid-objective-bar">
            <span id="room-name">${isAsyncRaid ? "Break the saved defenses" : "Choose the first path"}</span>
            <strong id="raid-objective">${isAsyncRaid ? "Defeat every guard" : "Select one of two rooms"}</strong>
          </div>
          <div id="raid-blessing-strip" class="raid-blessing-strip"></div>
          <div id="boss-health" class="boss-health is-hidden">
            <div><strong id="boss-name">Biome Boss</strong><span id="boss-health-label">0/0</span></div>
            <div class="boss-health-track"><i id="boss-health-fill"></i></div>
          </div>
          <div class="raid-frame">
            <canvas id="raid-canvas" width="360" height="520" aria-label="Top-down action raid"></canvas>
            <div id="player-damage-flash" class="player-damage-flash" aria-hidden="true"></div>
            <div id="raid-callout" class="raid-callout is-hidden">
              <strong id="callout-title">Room Cleared</strong>
              <span id="callout-copy">The next path has opened.</span>
            </div>
            <div id="raid-overlay" class="raid-overlay is-hidden"></div>
          </div>
          <div class="raid-controls" aria-label="Raid controls">
            <div id="joystick" class="joystick" aria-label="Movement joystick">
              <div id="joystick-stick" class="joystick-stick"></div>
            </div>
            <div class="raid-action-cluster">
              <button id="special-button" class="ability-button special-button" aria-label="Moon Pulse">
                <i class="ability-cooldown"></i><span>Moon</span><small>Pulse</small>
              </button>
              <button id="dodge-button" class="ability-button dodge-button" aria-label="Dodge">
                <i class="ability-cooldown"></i><span>Dodge</span><small>Shift</small>
              </button>
              <button id="attack-button" class="attack-button" aria-label="Attack">
                <i class="ability-cooldown"></i><span>Zap</span><small>Damage ${raidStats.damage}</small>
              </button>
            </div>
          </div>
          <p class="desktop-hint">WASD / arrows move. Click / Space attacks. Shift / right click dodges. E casts Moon Pulse. Escape pauses.</p>
        </section>
      `;

      const canvas = root.querySelector("#raid-canvas");
      const ctx = canvas.getContext("2d");
      const overlay = root.querySelector("#raid-overlay");
      const controls = root.querySelector(".raid-controls");
      const joystick = root.querySelector("#joystick");
      const stick = root.querySelector("#joystick-stick");
      const attackButton = root.querySelector("#attack-button");
      const dodgeButton = root.querySelector("#dodge-button");
      const specialButton = root.querySelector("#special-button");
      const pauseButton = root.querySelector("#raid-pause");
      const damageFlash = root.querySelector("#player-damage-flash");
      const callout = root.querySelector("#raid-callout");
      const calloutTitle = root.querySelector("#callout-title");
      const calloutCopy = root.querySelector("#callout-copy");
      const status = root.querySelector("#raid-status");
      const roomName = root.querySelector("#room-name");
      const objective = root.querySelector("#raid-objective");
      const blessingStrip = root.querySelector("#raid-blessing-strip");
      const healthLabel = root.querySelector("#health-label");
      const healthFill = root.querySelector("#player-health-fill");
      const bossHealth = root.querySelector("#boss-health");
      const bossName = root.querySelector("#boss-name");
      const bossHealthLabel = root.querySelector("#boss-health-label");
      const bossHealthFill = root.querySelector("#boss-health-fill");

      const player = new C.RaidPlayer(180, 446, raidStats);
      const rewards = { devotion: 0, food: 0, wood: 0, bones: 0 };
      const raidRecord = { enemiesDefeated: 0, damageTaken: 0 };
      const keys = new Set();
      const joystickVector = { x: 0, y: 0 };
      const particles = [];
      const damageNumbers = [];
      const dodgeGhosts = [];
      const pulseEffects = [];
      const blessings = [];
      let currentRoom = { name: "Entrance", layout: biome.layouts[0], type: "entrance" };
      let roomNumber = 0;
      let roomsCleared = 0;
      let obstacles = layouts[currentRoom.layout];
      let enemies = [];
      let projectiles = [];
      let dangerZones = [];
      let slowPatches = [];
      let pickups = [];
      let runRelicId = null;
      let rescuedFollower = false;
      let roomCleared = false;
      let mode = "map";
      let modeBeforePause = "map";
      let finished = false;
      let frameId = null;
      let previousTime = performance.now();
      let joystickPointer = null;
      let shakeTime = 0;
      let shakeStrength = 0;
      let ghostCooldown = 0;
      let pendingAfterBlessing = null;

      function hasBlessing(blessingId) {
        return blessings.includes(blessingId);
      }

      function setMode(nextMode) {
        mode = nextMode;
        const actionMode = mode === "combat";
        controls.classList.toggle("is-hidden", !actionMode);
        overlay.classList.toggle("is-hidden", actionMode);
        if (actionMode) overlay.innerHTML = "";
      }

      function updateHealth() {
        healthLabel.textContent = `${player.health}/${player.maxHealth}`;
        healthFill.style.width = `${C.Helpers.clamp((player.health / player.maxHealth) * 100, 0, 100)}%`;
      }

      function updateBlessingStrip() {
        blessingStrip.innerHTML = blessings.map((blessingId) => {
          const blessing = C.RAID_DATA.blessings.find((item) => item.id === blessingId);
          return `<span title="${C.UI.escapeHtml(blessing.description)}">${C.UI.escapeHtml(blessing.name)}</span>`;
        }).join("");
        blessingStrip.classList.toggle("is-empty", !blessings.length);
      }

      function updateAbilityButtons() {
        [
          [attackButton, player.attackCooldown, player.attackCooldownMax],
          [dodgeButton, player.dodgeCooldown, player.dodgeCooldownMax],
          [specialButton, player.specialCooldown, player.specialCooldownMax]
        ].forEach(([button, remaining, maximum]) => {
          const ratio = C.Helpers.clamp(remaining / maximum, 0, 1);
          button.style.setProperty("--cooldown-angle", `${ratio * 360}deg`);
          button.classList.toggle("is-ready", remaining <= 0);
        });
        attackButton.querySelector("small").textContent = `Damage ${player.damage}`;
      }

      function updateBossHealth() {
        const boss = enemies.find((enemy) => enemy.isBoss);
        bossHealth.classList.toggle("is-hidden", !boss);
        if (!boss) return;
        bossName.textContent = boss.name;
        bossHealthLabel.textContent = `${Math.max(0, boss.health)}/${boss.maxHealth}`;
        bossHealthFill.style.width = `${C.Helpers.clamp((boss.health / boss.maxHealth) * 100, 0, 100)}%`;
      }

      function updateStatus() {
        roomName.textContent = currentRoom.name;
        status.textContent = isAsyncRaid
          ? "Saved cult defense"
          : `Room ${Math.max(1, roomNumber)} of ${totalRooms} - ${C.RAID_DATA.roomTypes[currentRoom.type] ? C.RAID_DATA.roomTypes[currentRoom.type].name : "Entrance"}`;
        if (mode === "combat") {
          objective.textContent = currentRoom.type === "boss"
            ? `Defeat ${biome.bossName}`
            : `Defeat ${enemies.length} foe${enemies.length === 1 ? "" : "s"}`;
        }
        updateBossHealth();
      }

      function addBurst(x, y, color) {
        const count = particles.length > 72 ? 4 : 8;
        for (let index = 0; index < count; index += 1) {
          const angle = (Math.PI * 2 * index) / count;
          particles.push({
            x,
            y,
            vx: Math.cos(angle) * (25 + Math.random() * 30),
            vy: Math.sin(angle) * (25 + Math.random() * 30),
            life: 0.45,
            color
          });
        }
      }

      function addDamageNumber(x, y, value, color) {
        damageNumbers.push({ x, y, value, color: color || "#fff4d2", life: 0.72 });
      }

      function showCallout(title, copy) {
        calloutTitle.textContent = title;
        calloutCopy.textContent = copy;
        callout.classList.remove("is-hidden");
        window.setTimeout(() => callout.classList.add("is-hidden"), 1200);
      }

      function movementInput() {
        let x = joystickVector.x;
        let y = joystickVector.y;
        if (keys.has("arrowleft") || keys.has("a")) x -= 1;
        if (keys.has("arrowright") || keys.has("d")) x += 1;
        if (keys.has("arrowup") || keys.has("w")) y -= 1;
        if (keys.has("arrowdown") || keys.has("s")) y += 1;
        const slowed = slowPatches.some((patch) => (
          patch.isActive() && distance(player, patch) < player.radius + patch.radius
        ));
        return slowed ? { x: x * 0.55, y: y * 0.55 } : { x, y };
      }

      function spawnPickup(enemy) {
        const roll = Math.random();
        let resource = biome.resourceBias;
        let amount = enemy.isBoss ? 7 : 2;
        if (roll < 0.42) resource = "devotion";
        else if (roll < 0.62) resource = "food";
        else if (roll < 0.82) resource = "wood";
        else resource = "bones";
        if (enemy.isBoss) amount += 3;
        pickups.push(new C.RaidPickup(enemy.x, enemy.y, resource, amount));
      }

      function collectPickup(pickup) {
        rewards[pickup.resource] += pickup.amount;
        addBurst(pickup.x, pickup.y, biome.theme.accent);
        C.Audio.play("collect");
      }

      function defeatEnemy(enemy) {
        raidRecord.enemiesDefeated += 1;
        spawnPickup(enemy);
        addBurst(enemy.x, enemy.y, enemy.isBoss ? "#ff765f" : biome.theme.mist);
        if (!isAsyncRaid) C.store.discoverRunEnemy(biome.id, enemy.name);
        if (enemy.deathEffect === "poison") {
          slowPatches.push(new C.SlowPatch(enemy.x, enemy.y, {
            radius: 30,
            duration: 2.3,
            color: "#78ad78",
            damage: 1
          }));
        }
        C.Audio.play("death");
      }

      function hitEnemy(enemy, damage, force) {
        if (typeof enemy.canBeHit === "function" && !enemy.canBeHit()) {
          addDamageNumber(enemy.x, enemy.y - enemy.radius, "PHASED", "#d8cfff");
          return false;
        }
        const died = enemy.hit(damage, player.x, player.y, force);
        addDamageNumber(enemy.x, enemy.y - enemy.radius, damage);
        addBurst(enemy.x, enemy.y, enemy.isBoss ? "#ff765f" : biome.theme.accent);
        C.Audio.play("hit");
        if (enemy.isBoss) {
          shakeTime = 0.14;
          shakeStrength = 4;
        }
        if (died) defeatEnemy(enemy);
        return died;
      }

      function performAttack() {
        if (finished || roomCleared || mode !== "combat" || !player.attack()) return;
        C.Audio.play("attack");
        attackButton.classList.remove("is-attacking");
        void attackButton.offsetWidth;
        attackButton.classList.add("is-attacking");
        enemies = enemies.filter((enemy) => {
          const inRange = distance(player, enemy) < player.radius + enemy.radius + 48;
          const towardEnemy =
            ((enemy.x - player.x) * player.facingX) + ((enemy.y - player.y) * player.facingY) > -250;
          if (!inRange || !towardEnemy) return true;
          let died = hitEnemy(enemy, player.damage, enemy.isBoss ? 55 : 105);
          if (!died && hasBlessing("echoPaw") && Math.random() < 0.25) {
            died = hitEnemy(enemy, player.damage, enemy.isBoss ? 38 : 70);
            addDamageNumber(enemy.x + 9, enemy.y - enemy.radius - 8, "ECHO", "#d9bdff");
          }
          return !died;
        });
        updateStatus();
      }

      function performDodge() {
        if (finished || roomCleared || mode !== "combat" || !player.dodge(movementInput())) return;
        C.Audio.play("dodge");
        dodgeButton.classList.remove("is-activated");
        void dodgeButton.offsetWidth;
        dodgeButton.classList.add("is-activated");
      }

      function performSpecial() {
        if (finished || roomCleared || mode !== "combat" || !player.useSpecial()) return;
        C.Audio.play("special");
        pulseEffects.push({ x: player.x, y: player.y, radius: 18, life: 0.55 });
        specialButton.classList.remove("is-activated");
        void specialButton.offsetWidth;
        specialButton.classList.add("is-activated");
        enemies = enemies.filter((enemy) => {
          if (distance(player, enemy) > 122 + enemy.radius) return true;
          const died = hitEnemy(enemy, player.damage + 1, enemy.isBoss ? 90 : 210);
          return !died;
        });
        updateStatus();
      }

      function hurtPlayer(amount, x, y) {
        if (!player.hurt(amount)) return;
        raidRecord.damageTaken += amount || 1;
        C.Audio.play("hit");
        damageFlash.classList.remove("is-flashing");
        void damageFlash.offsetWidth;
        damageFlash.classList.add("is-flashing");
        shakeTime = 0.12;
        shakeStrength = 3;
        addDamageNumber(player.x, player.y - 25, `-${amount || 1}`, "#ff8f8f");
        addBurst(x || player.x, y || player.y, "#ec7c7c");
        updateHealth();
        if (player.health <= 0) finishRaid("defeat");
      }

      const world = {
        spawnProjectile(x, y, dx, dy, options) {
          projectiles.push(new C.HexProjectile(x, y, dx, dy, options));
        },
        radialProjectiles(x, y, count, options) {
          for (let index = 0; index < count; index += 1) {
            const angle = (Math.PI * 2 * index) / count;
            this.spawnProjectile(x, y, Math.cos(angle), Math.sin(angle), options);
          }
        },
        spawnDanger(x, y, options) {
          dangerZones.push(new C.DangerZone(x, y, options));
        },
        spawnSlow(x, y, options) {
          slowPatches.push(new C.SlowPatch(x, y, options));
        },
        spawnEnemy(enemyId, x, y) {
          enemies.push(createEnemy(enemyId, x, y, enemies.length));
        },
        buffEnemies(source) {
          enemies.forEach((enemy) => {
            if (enemy === source) return;
            enemy.speed = Math.min(enemy.speed * 1.04, 115);
            enemy.hitFlash = 0.12;
          });
          addBurst(source.x, source.y, "#ef80a0");
        },
        bossPhase(boss) {
          showCallout("Boss Phase Two", `${boss.name} changes its attack pattern.`);
          shakeTime = 0.35;
          shakeStrength = 7;
        }
      };

      function addRoomRewards(type) {
        const multiplier = hasBlessing("mushroomLuck") ? 1.25 : 1;
        const base = type === "elite" ? 5 : type === "boss" ? 9 : 3;
        rewards.devotion += Math.round(base * multiplier);
        if (type === "supplies") {
          rewards.food += Math.round(8 * multiplier);
          rewards.wood += Math.round(7 * multiplier);
        } else if (type === "treasure") {
          rewards.bones += Math.round(4 * multiplier);
          rewards[biome.resourceBias] += Math.round(6 * multiplier);
        } else {
          rewards[biome.resourceBias] += Math.round((base - 1) * multiplier);
          rewards.bones += type === "boss" ? 5 : type === "elite" ? 2 : 1;
        }
      }

      function applyBlessing(blessingId) {
        if (hasBlessing(blessingId)) return;
        blessings.push(blessingId);
        C.store.discoverBlessing(blessingId);
        if (blessingId === "sharpMoon") player.damage += 1;
        if (blessingId === "candleFeet") player.speed *= 1.25;
        if (blessingId === "boneSkin") {
          player.maxHealth += 2;
          player.health = Math.min(player.maxHealth, player.health + 2);
        }
        if (blessingId === "tinyThunder") player.specialCooldownMax = 6;
        updateHealth();
        updateBlessingStrip();
        showCallout("Dark Blessing", C.RAID_DATA.blessings.find((item) => item.id === blessingId).name);
      }

      function showBlessingChoice(afterChoice) {
        const available = C.RAID_DATA.blessings.filter((item) => !hasBlessing(item.id));
        if (!available.length) {
          afterChoice();
          return;
        }
        pendingAfterBlessing = afterChoice;
        const choices = shuffled(available).slice(0, 3);
        setMode("blessing");
        objective.textContent = "Choose one temporary upgrade";
        overlay.innerHTML = `
          <section class="raid-choice-panel blessing-choice-panel">
            <p class="eyebrow">The dark notices you</p>
            <h2>Choose a Dark Blessing</h2>
            <div class="blessing-choice-grid">
              ${choices.map((blessing) => `
                <button data-blessing="${blessing.id}" class="blessing-choice-card">
                  <span>${blessing.icon}</span>
                  <strong>${C.UI.escapeHtml(blessing.name)}</strong>
                  <small>${C.UI.escapeHtml(blessing.description)}</small>
                </button>
              `).join("")}
            </div>
          </section>
        `;
      }

      function finishRoom(offerBlessing) {
        roomsCleared += 1;
        roomCleared = true;
        projectiles = [];
        dangerZones = [];
        slowPatches = [];
        pickups.forEach(collectPickup);
        pickups = [];
        addRoomRewards(currentRoom.type);
        if (hasBlessing("hungryHalo")) {
          player.health = Math.min(player.maxHealth, player.health + 1);
          updateHealth();
        }

        if (currentRoom.type === "boss" || isAsyncRaid) {
          setMode("event");
          objective.textContent = "Collect the raid result";
          overlay.innerHTML = `
            <section class="raid-choice-panel room-event-panel">
              <span class="room-event-icon">${isAsyncRaid ? "!" : "B"}</span>
              <p class="eyebrow">${isAsyncRaid ? "Saved defenses broken" : "Biome guardian defeated"}</p>
              <h2>${C.UI.escapeHtml(isAsyncRaid ? "Cult Defense Broken" : biome.bossName)}</h2>
              <p>${isAsyncRaid
                ? `${C.UI.escapeHtml(raidPayload.defender.displayName || "The defender")} will receive the report later.`
                : "The path home opens beneath a shower of questionable treasure."}</p>
              <button class="button button-primary button-huge" data-finish-raid>Claim Raid Rewards</button>
            </section>
          `;
          return;
        }

        const continueRun = () => showRaidMap();
        if (offerBlessing || roomsCleared % 2 === 0) showBlessingChoice(continueRun);
        else showRaidMap();
      }

      function createCombatRoom(type) {
        const layout = C.Helpers.randomItem(biome.layouts);
        const count = type === "elite" ? 5 + Math.min(2, roomsCleared) : 3 + Math.min(3, roomsCleared);
        const roomEnemies = [];
        for (let index = 0; index < count; index += 1) {
          const enemyId = C.Helpers.randomItem(biome.enemies);
          const position = roomPositions[index % roomPositions.length];
          const enemy = createEnemy(enemyId, position[0], position[1], index);
          if (type === "elite") {
            enemy.health = Math.ceil(enemy.health * 1.35);
            enemy.maxHealth = enemy.health;
            enemy.speed *= 1.08;
          }
          roomEnemies.push(enemy);
        }
        return {
          type,
          name: type === "elite" ? `${biome.name} Elite Hollow` : `${biome.name} Skirmish`,
          layout,
          enemies: roomEnemies
        };
      }

      function createBossRoom() {
        return {
          type: "boss",
          name: biome.bossName,
          layout: biome.layouts[biome.layouts.length - 1],
          enemies: [
            createEnemy(biome.boss, 180, 145, 0),
            createEnemy(C.Helpers.randomItem(biome.enemies), 72, 135, 1),
            createEnemy(C.Helpers.randomItem(biome.enemies), 288, 135, 2)
          ]
        };
      }

      function startCombatRoom(type) {
        currentRoom = isAsyncRaid ? multiplayerRoom(raidPayload.defender || {}) :
          type === "boss" ? createBossRoom() : createCombatRoom(type);
        currentRoom.type = isAsyncRaid ? "combat" : type;
        roomNumber += 1;
        obstacles = layouts[currentRoom.layout] || layouts.clearing;
        enemies = currentRoom.enemies;
        projectiles = [];
        dangerZones = [];
        slowPatches = [];
        pickups = [];
        roomCleared = false;
        player.x = 180;
        player.y = 446;
        setMode("combat");
        updateStatus();
        showCallout(currentRoom.type === "boss" ? "Boss Room" : currentRoom.name,
          currentRoom.type === "elite" ? "Elite foes guard a Dark Blessing." :
            currentRoom.type === "boss" ? "Watch the warnings. The pattern changes at half health." :
              "Clear the room quickly.");
      }

      function completeNonCombat(type) {
        if (type === "treasure") {
          if (!runRelicId && C.store.isUnlocked(3) && Math.random() < 0.45) runRelicId = C.store.getRandomRelicId();
        } else if (type === "rescue") {
          rewards.devotion += 3;
          rescuedFollower = C.store.state.followers.length < C.store.getFollowerCapacity() &&
            Math.random() < Math.min(0.85, C.store.getRecruitChance() + 0.35);
        }
        finishRoom(false);
      }

      function showNonCombatRoom(type) {
        const definition = C.RAID_DATA.roomTypes[type];
        roomNumber += 1;
        currentRoom = {
          type,
          name: definition.name,
          layout: C.Helpers.randomItem(biome.layouts)
        };
        obstacles = layouts[currentRoom.layout] || layouts.clearing;
        roomCleared = false;
        setMode("event");
        updateStatus();

        if (type === "shrine") {
          objective.textContent = "Choose one shrine offering";
          overlay.innerHTML = `
            <section class="raid-choice-panel room-event-panel">
              <span class="room-event-icon">*</span>
              <p class="eyebrow">A small altar hums badly</p>
              <h2>Ritual Shrine</h2>
              <div class="room-event-actions">
                <button data-shrine-choice="blessing"><strong>Accept a Blessing</strong><small>Choose one temporary run upgrade.</small></button>
                <button data-shrine-choice="heal"><strong>Drink Moonwater</strong><small>Restore 3 health.</small></button>
                <button data-shrine-choice="sacrifice"><strong>Borrow Their Cheer</strong><small>Followers lose mood. Gain +1 raid damage.</small></button>
              </div>
            </section>
          `;
          return;
        }

        const messages = {
          treasure: {
            icon: "$",
            title: "A Very Suspicious Chest",
            text: "It contains useful resources and may contain a relic with poor boundaries.",
            action: "Open It Carefully"
          },
          rescue: {
            icon: "+",
            title: "Follower Rescue",
            text: "A damp stranger is trapped behind a tiny ceremonial fence.",
            action: "Break the Tiny Fence"
          },
          supplies: {
            icon: "S",
            title: "Camp Supplies",
            text: "Food and cursed wood sit unattended. That feels like permission.",
            action: "Gather Supplies"
          }
        };
        const message = messages[type];
        objective.textContent = definition.description;
        overlay.innerHTML = `
          <section class="raid-choice-panel room-event-panel">
            <span class="room-event-icon">${message.icon}</span>
            <p class="eyebrow">${C.UI.escapeHtml(biome.name)}</p>
            <h2>${message.title}</h2>
            <p>${message.text}</p>
            <button class="button button-primary button-huge" data-complete-event="${type}">${message.action}</button>
          </section>
        `;
      }

      function startRoom(type) {
        if (type === "combat" || type === "elite" || type === "boss") startCombatRoom(type);
        else showNonCombatRoom(type);
      }

      function showRaidMap() {
        const choices = roomChoices(roomsCleared, totalRooms);
        currentRoom = { type: "entrance", name: "Raid Map", layout: biome.layouts[0] };
        roomName.textContent = biome.name;
        status.textContent = roomsCleared
          ? `${roomsCleared} of ${totalRooms} rooms cleared`
          : `Entrance - ${totalRooms} rooms ahead`;
        objective.textContent = choices[0] === "boss" ? "The biome guardian waits" : "Choose the next room";
        setMode("map");
        const path = Array.from({ length: totalRooms }, (_, index) => `
          <i class="${index < roomsCleared ? "is-cleared" : index === roomsCleared ? "is-current" : ""}">${index + 1}</i>
        `).join("");
        overlay.innerHTML = `
          <section class="raid-choice-panel raid-map-panel">
            <p class="eyebrow">${C.UI.escapeHtml(biome.name)}</p>
            <h2>${roomsCleared ? "Choose the Next Room" : "Choose Your First Room"}</h2>
            <div class="raid-map-path">${path}</div>
            <div class="raid-room-choice-grid">
              ${choices.map((type) => {
                const definition = C.RAID_DATA.roomTypes[type];
                return `
                  <button data-room-choice="${type}" class="raid-room-choice room-${type}">
                    <span>${definition.icon}</span>
                    <strong>${definition.name}</strong>
                    <small>${definition.description}</small>
                  </button>
                `;
              }).join("")}
            </div>
            <small class="raid-map-note">Dark Blessings last only for this raid.</small>
          </section>
        `;
      }

      function showPause() {
        if (mode !== "combat" || finished) return;
        modeBeforePause = mode;
        setMode("pause");
        objective.textContent = "Raid paused";
        overlay.innerHTML = `
          <section class="raid-choice-panel raid-pause-panel">
            <p class="eyebrow">Take a breath</p>
            <h2>Raid Paused</h2>
            <button class="button button-primary" data-resume-raid>Resume</button>
            <label class="raid-setting-row">
              <span>Sound volume</span>
              <input data-raid-volume type="range" min="0" max="100" value="${Math.round(C.store.state.settings.volume * 100)}">
            </label>
            <button class="button button-secondary" data-abandon-raid>Abandon Raid</button>
          </section>
        `;
      }

      function resumeRaid() {
        setMode(modeBeforePause);
        if (mode === "map") showRaidMap();
        else if (mode === "combat") updateStatus();
      }

      function finishRaid(outcome, options) {
        if (finished) return;
        finished = true;
        const abandoned = Boolean(options && options.abandoned);
        pickups.forEach(collectPickup);
        pickups = [];
        if (abandoned) {
          Object.keys(rewards).forEach((key) => {
            rewards[key] = Math.floor(rewards[key] * 0.5);
          });
        }
        if (!isAsyncRaid && outcome === "victory" && !runRelicId && C.store.isUnlocked(3)) {
          runRelicId = C.store.getRandomRelicId();
        }
        C.App.finishRaid({
          outcome,
          rewards,
          recruitedFollower: !isAsyncRaid && rescuedFollower,
          roomsCleared,
          biomeId: isAsyncRaid ? null : biome.id,
          biomeName: isAsyncRaid ? null : biome.name,
          bossName: isAsyncRaid ? null : biome.bossName,
          bossDefeated: !isAsyncRaid && outcome === "victory",
          blessings: blessings.slice(),
          runRelicId,
          abandoned,
          stats: {
            enemiesDefeated: raidRecord.enemiesDefeated,
            damageTaken: raidRecord.damageTaken
          },
          asyncRaid: isAsyncRaid ? { defender: raidPayload.defender } : null
        });
      }

      function update(delta) {
        player.update(delta, movementInput());
        updateAbilityButtons();
        obstacles.forEach((obstacle) => resolveObstacle(player, obstacle));

        ghostCooldown -= delta;
        if (player.dodgeTimer > 0 && ghostCooldown <= 0) {
          dodgeGhosts.push({ x: player.x, y: player.y, life: 0.22 });
          ghostCooldown = 0.045;
        }

        enemies.forEach((enemy) => {
          enemy.update(delta, player, world);
          obstacles.forEach((obstacle) => resolveObstacle(enemy, obstacle));
          enemy.x = C.Helpers.clamp(enemy.x, enemy.radius, C.DATA.raid.worldWidth - enemy.radius);
          enemy.y = C.Helpers.clamp(enemy.y, 58 + enemy.radius, C.DATA.raid.worldHeight - enemy.radius);
          const touching = distance(player, enemy) < player.radius + enemy.radius + 4;
          if (touching && enemy.contactCooldown <= 0 && !enemy.attackQueued && !enemy.phased) {
            enemy.attackQueued = true;
            enemy.attackWarning = enemy.isBoss ? 0.34 : 0.22;
          } else if (touching && enemy.attackQueued && enemy.attackWarning <= 0) {
            enemy.attackQueued = false;
            enemy.contactCooldown = enemy.isBoss ? 1.15 : 0.9;
            hurtPlayer(enemy.damage, player.x, player.y);
          } else if (!touching && enemy.attackQueued) {
            enemy.attackQueued = false;
            enemy.attackWarning = 0;
          }
        });

        projectiles.forEach((projectile) => projectile.update(delta));
        projectiles = projectiles.filter((projectile) => {
          const inBounds = projectile.life > 0 &&
            projectile.x > -20 && projectile.x < C.DATA.raid.worldWidth + 20 &&
            projectile.y > 40 && projectile.y < C.DATA.raid.worldHeight + 20;
          if (!inBounds) return false;
          if (distance(player, projectile) < player.radius + projectile.radius) {
            hurtPlayer(projectile.damage, projectile.x, projectile.y);
            return false;
          }
          return true;
        });

        dangerZones.forEach((zone) => {
          zone.update(delta);
          if (zone.isDangerous() && !zone.hitPlayer && distance(player, zone) < player.radius + zone.radius) {
            zone.hitPlayer = true;
            hurtPlayer(zone.damage, player.x, player.y);
          }
        });
        dangerZones = dangerZones.filter((zone) => zone.timer > 0);

        slowPatches.forEach((patch) => {
          patch.update(delta);
          if (patch.isActive() && patch.damage && patch.damageCooldown <= 0 &&
            distance(player, patch) < player.radius + patch.radius) {
            hurtPlayer(patch.damage, player.x, player.y);
            patch.damageCooldown = 1.25;
          }
        });
        slowPatches = slowPatches.filter((patch) => patch.timer > 0);

        pickups.forEach((pickup) => {
          if (!hasBlessing("doomMagnet")) return;
          const dx = player.x - pickup.x;
          const dy = player.y - pickup.y;
          const length = Math.max(1, Math.hypot(dx, dy));
          if (length < 150) {
            pickup.x += (dx / length) * 145 * delta;
            pickup.y += (dy / length) * 145 * delta;
          }
        });
        pickups = pickups.filter((pickup) => {
          if (distance(player, pickup) < player.radius + pickup.radius + 6) {
            collectPickup(pickup);
            return false;
          }
          return true;
        });

        particles.forEach((particle) => {
          particle.x += particle.vx * delta;
          particle.y += particle.vy * delta;
          particle.life -= delta;
        });
        for (let index = particles.length - 1; index >= 0; index -= 1) {
          if (particles[index].life <= 0) particles.splice(index, 1);
        }
        damageNumbers.forEach((number) => {
          number.y -= 28 * delta;
          number.life -= delta;
        });
        for (let index = damageNumbers.length - 1; index >= 0; index -= 1) {
          if (damageNumbers[index].life <= 0) damageNumbers.splice(index, 1);
        }
        dodgeGhosts.forEach((ghost) => {
          ghost.life -= delta;
        });
        for (let index = dodgeGhosts.length - 1; index >= 0; index -= 1) {
          if (dodgeGhosts[index].life <= 0) dodgeGhosts.splice(index, 1);
        }
        pulseEffects.forEach((pulse) => {
          pulse.radius += 230 * delta;
          pulse.life -= delta;
        });
        for (let index = pulseEffects.length - 1; index >= 0; index -= 1) {
          if (pulseEffects[index].life <= 0) pulseEffects.splice(index, 1);
        }
        shakeTime = Math.max(0, shakeTime - delta);

        if (!roomCleared && enemies.length === 0) {
          const wasBoss = currentRoom.type === "boss";
          if (wasBoss && !runRelicId && C.store.isUnlocked(3)) runRelicId = C.store.getRandomRelicId();
          finishRoom(currentRoom.type === "elite");
        }
      }

      function drawEnemyFeedback(enemy) {
        if (enemy.spawnTimer > 0) {
          ctx.strokeStyle = `${biome.theme.mist}cc`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius + (enemy.spawnTimer * 45), 0, Math.PI * 2);
          ctx.stroke();
        }
        if (enemy.attackWarning > 0) {
          ctx.fillStyle = `rgba(255, 103, 82, ${0.15 + Math.sin(enemy.attackWarning * 70) * 0.1})`;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
          ctx.fill();
        }
        const width = enemy.isBoss ? 58 : 34;
        const y = enemy.y - enemy.radius - (enemy.isBoss ? 37 : 20);
        ctx.fillStyle = "rgba(11, 9, 20, .8)";
        ctx.fillRect(enemy.x - (width / 2), y, width, 5);
        ctx.fillStyle = enemy.isBoss ? "#ff765f" : biome.theme.accent;
        ctx.fillRect(enemy.x - (width / 2), y, width * C.Helpers.clamp(enemy.health / enemy.maxHealth, 0, 1), 5);
      }

      function draw(time) {
        ctx.save();
        if (shakeTime > 0) {
          ctx.translate((Math.random() - 0.5) * shakeStrength, (Math.random() - 0.5) * shakeStrength);
        }
        drawRoom(ctx, time, biome, currentRoom.layout, obstacles, biomeDecoration);
        ctx.strokeStyle = "rgba(217, 189, 255, .16)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        dangerZones.forEach((zone) => zone.draw(ctx));
        slowPatches.forEach((patch) => patch.draw(ctx, time));
        pickups.forEach((pickup) => pickup.draw(ctx, time));
        projectiles.forEach((projectile) => projectile.draw(ctx, time));
        dodgeGhosts.forEach((ghost) => {
          ctx.globalAlpha = Math.max(0, ghost.life / 0.5);
          ctx.fillStyle = biome.theme.mist;
          ctx.beginPath();
          ctx.ellipse(ghost.x, ghost.y, 15, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        pulseEffects.forEach((pulse) => {
          ctx.strokeStyle = `rgba(201, 167, 255, ${Math.max(0, pulse.life * 1.7)})`;
          ctx.lineWidth = 9 * Math.max(0.2, pulse.life);
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
          ctx.stroke();
        });
        enemies.forEach((enemy) => {
          ctx.save();
          if (enemy.spawnTimer > 0) ctx.globalAlpha = 1 - (enemy.spawnTimer / 0.55);
          enemy.draw(ctx, time);
          ctx.restore();
          drawEnemyFeedback(enemy);
        });
        player.draw(ctx, time);
        particles.forEach((particle) => {
          ctx.globalAlpha = Math.max(0, particle.life / 0.45);
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        damageNumbers.forEach((number) => {
          ctx.globalAlpha = Math.min(1, number.life * 2);
          ctx.fillStyle = number.color;
          ctx.strokeStyle = "rgba(22, 15, 31, .9)";
          ctx.lineWidth = 3;
          ctx.font = "900 16px system-ui";
          ctx.textAlign = "center";
          ctx.strokeText(String(number.value), number.x, number.y);
          ctx.fillText(String(number.value), number.x, number.y);
          ctx.globalAlpha = 1;
        });
        ctx.fillStyle = "#d6c4ed";
        ctx.font = "700 11px system-ui";
        ctx.textAlign = "left";
        ctx.fillText(`LOOT  D ${rewards.devotion}  F ${rewards.food}  W ${rewards.wood}  B ${rewards.bones}`, 12, 30);
        ctx.restore();
      }

      function frame(time) {
        const delta = Math.min(0.033, (time - previousTime) / 1000);
        previousTime = time;
        if (!finished) {
          if (mode === "combat") update(delta);
          draw(time);
          updateBossHealth();
          frameId = requestAnimationFrame(frame);
        }
      }

      function onKeyDown(event) {
        const key = event.key.toLowerCase();
        if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", " ", "shift", "e", "escape"].includes(key)) {
          event.preventDefault();
        }
        if (key === "escape" && !event.repeat) {
          if (mode === "pause") resumeRaid();
          else showPause();
          return;
        }
        keys.add(key);
        if (key === " " && !event.repeat) performAttack();
        if (key === "shift" && !event.repeat) performDodge();
        if (key === "e" && !event.repeat) performSpecial();
      }

      function onKeyUp(event) {
        keys.delete(event.key.toLowerCase());
      }

      function updateJoystick(event) {
        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        const centerY = rect.top + (rect.height / 2);
        let dx = event.clientX - centerX;
        let dy = event.clientY - centerY;
        const max = rect.width * 0.32;
        const length = Math.hypot(dx, dy);
        if (length > max) {
          dx = (dx / length) * max;
          dy = (dy / length) * max;
        }
        joystickVector.x = dx / max;
        joystickVector.y = dy / max;
        stick.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      function onJoystickDown(event) {
        joystickPointer = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        updateJoystick(event);
      }

      function onJoystickMove(event) {
        if (event.pointerId === joystickPointer) updateJoystick(event);
      }

      function onJoystickUp(event) {
        if (event.pointerId !== joystickPointer) return;
        joystickPointer = null;
        joystickVector.x = 0;
        joystickVector.y = 0;
        stick.style.transform = "translate(0, 0)";
      }

      function onCanvasPointer(event) {
        event.preventDefault();
        if (event.button === 2) performDodge();
        else performAttack();
      }

      function onOverlayClick(event) {
        const roomChoice = event.target.closest("[data-room-choice]");
        if (roomChoice) {
          startRoom(roomChoice.dataset.roomChoice);
          return;
        }
        const blessingChoice = event.target.closest("[data-blessing]");
        if (blessingChoice) {
          applyBlessing(blessingChoice.dataset.blessing);
          const afterChoice = pendingAfterBlessing;
          pendingAfterBlessing = null;
          if (afterChoice) afterChoice();
          return;
        }
        const eventChoice = event.target.closest("[data-complete-event]");
        if (eventChoice) {
          completeNonCombat(eventChoice.dataset.completeEvent);
          return;
        }
        const shrineChoice = event.target.closest("[data-shrine-choice]");
        if (shrineChoice) {
          const choice = shrineChoice.dataset.shrineChoice;
          if (choice === "heal") {
            player.health = Math.min(player.maxHealth, player.health + 3);
            updateHealth();
            finishRoom(false);
          } else if (choice === "sacrifice") {
            C.store.changeAllMoods(-6);
            C.store.save();
            player.damage += 1;
            finishRoom(false);
          } else {
            finishRoom(true);
          }
          return;
        }
        if (event.target.closest("[data-finish-raid]")) {
          finishRaid("victory");
          return;
        }
        if (event.target.closest("[data-resume-raid]")) {
          resumeRaid();
          return;
        }
        if (event.target.closest("[data-abandon-raid]")) finishRaid("defeat", { abandoned: true });
      }

      function onOverlayInput(event) {
        if (event.target.matches("[data-raid-volume]")) C.Audio.setVolume(Number(event.target.value) / 100);
      }

      function preventContextMenu(event) {
        event.preventDefault();
      }

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      joystick.addEventListener("pointerdown", onJoystickDown);
      joystick.addEventListener("pointermove", onJoystickMove);
      joystick.addEventListener("pointerup", onJoystickUp);
      joystick.addEventListener("pointercancel", onJoystickUp);
      attackButton.addEventListener("pointerdown", performAttack);
      dodgeButton.addEventListener("pointerdown", performDodge);
      specialButton.addEventListener("pointerdown", performSpecial);
      pauseButton.addEventListener("click", showPause);
      canvas.addEventListener("pointerdown", onCanvasPointer);
      canvas.addEventListener("contextmenu", preventContextMenu);
      overlay.addEventListener("click", onOverlayClick);
      overlay.addEventListener("input", onOverlayInput);

      if (!isAsyncRaid) C.store.visitBiome(biome.id);
      updateHealth();
      updateBlessingStrip();
      if (isAsyncRaid) startCombatRoom("combat");
      else showRaidMap();
      frameId = requestAnimationFrame(frame);

      return () => {
        finished = true;
        cancelAnimationFrame(frameId);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        joystick.removeEventListener("pointerdown", onJoystickDown);
        joystick.removeEventListener("pointermove", onJoystickMove);
        joystick.removeEventListener("pointerup", onJoystickUp);
        joystick.removeEventListener("pointercancel", onJoystickUp);
        attackButton.removeEventListener("pointerdown", performAttack);
        dodgeButton.removeEventListener("pointerdown", performDodge);
        specialButton.removeEventListener("pointerdown", performSpecial);
        pauseButton.removeEventListener("click", showPause);
        canvas.removeEventListener("pointerdown", onCanvasPointer);
        canvas.removeEventListener("contextmenu", preventContextMenu);
        overlay.removeEventListener("click", onOverlayClick);
        overlay.removeEventListener("input", onOverlayInput);
      };
    }
  };
})();
