(function () {
  const C = window.Cultlings = window.Cultlings || {};

  const layouts = {
    clearing: [
      { x: 72, y: 180, radius: 27 },
      { x: 292, y: 220, radius: 31 },
      { x: 182, y: 310, radius: 24 }
    ],
    ruins: [
      { x: 65, y: 245, radius: 25 },
      { x: 295, y: 245, radius: 25 },
      { x: 180, y: 155, radius: 28 },
      { x: 180, y: 375, radius: 25 }
    ],
    altar: [
      { x: 62, y: 175, radius: 23 },
      { x: 298, y: 175, radius: 23 }
    ]
  };

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
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

  function drawRoom(ctx, time, layoutKey, obstacles) {
    const width = C.DATA.raid.worldWidth;
    const height = C.DATA.raid.worldHeight;
    const colors = layoutKey === "ruins"
      ? ["#171329", "#30233b"]
      : layoutKey === "altar"
        ? ["#1d1426", "#352432"]
        : ["#15162a", "#242b3a"];
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = layoutKey === "ruins" ? "rgba(210, 148, 221, .12)" : "rgba(111, 90, 151, .12)";
    for (let i = 0; i < 20; i += 1) {
      const x = (i * 73) % width;
      const y = 66 + ((i * 119) % (height - 80));
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = layoutKey === "altar" ? "rgba(237, 132, 97, .24)" : "rgba(181, 155, 221, .14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, 270, 92 + Math.sin(time * 0.001) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(120, 270);
    ctx.lineTo(240, 270);
    ctx.moveTo(180, 210);
    ctx.lineTo(180, 330);
    ctx.stroke();

    if (layoutKey === "ruins") {
      ctx.fillStyle = "rgba(97, 75, 114, .38)";
      ctx.fillRect(18, 80, 45, 10);
      ctx.fillRect(297, 80, 45, 10);
      ctx.fillRect(128, 430, 104, 9);
    }

    obstacles.forEach((obstacle, index) => {
      ctx.fillStyle = layoutKey === "altar" ? "#463044" : "#302b43";
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = layoutKey === "ruins" ? "#60466a" : "#45405a";
      ctx.beginPath();
      ctx.arc(obstacle.x - 5, obstacle.y - 7, obstacle.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = index % 2 ? "#8c6cac" : "#675083";
      ctx.beginPath();
      ctx.arc(obstacle.x + 13, obstacle.y - obstacle.radius + 6, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#171329";
    ctx.fillRect(0, 0, width, 48);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(width, 48);
    ctx.stroke();
  }

  function multiplayerRoom(defender) {
    const buildings = defender.buildings || {};
    const modifiers = defender.defenseModifiers || [];
    const guards = (defender.guards || []).slice(0, 6);
    const positions = [
      [70, 115], [180, 105], [290, 115], [105, 250], [255, 250], [180, 345]
    ];
    const enemies = guards.map((guard, index) => (
      new C.DefenderGuard(positions[index][0], positions[index][1], guard, index)
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
    if ((defender.basePower || 0) >= 75) {
      const brute = new C.WaxHeadBrute(180, 150);
      brute.health = 16;
      brute.maxHealth = 16;
      enemies.push(brute);
    }

    const healthMultiplier = 1 + Math.min(0.6, (defender.basePower || 0) / 180) +
      (modifiers.includes("sturdyWalls") ? 0.2 : 0);
    enemies.forEach((enemy) => {
      enemy.health = Math.ceil(enemy.health * healthMultiplier);
      enemy.maxHealth = enemy.health;
      if (modifiers.includes("guardFervor")) enemy.speed *= 1.12;
    });

    return {
      name: `${defender.displayName || "Unknown Cult"} Defense`,
      layout: modifiers.includes("hexWards") ? "ruins" : "altar",
      enemies
    };
  }

  function roomDefinition(roomNumber, raidPayload) {
    if (raidPayload && raidPayload.mode === "async") {
      return multiplayerRoom(raidPayload.defender || {});
    }
    if (roomNumber === 1) {
      return {
        name: "Candlewood Clearing",
        layout: "clearing",
        enemies: [
          new C.CandleGoblin(55, 100, 0),
          new C.CandleGoblin(180, 115, 1),
          new C.CandleGoblin(305, 100, 2),
          new C.BoneBeetle(180, 245)
        ]
      };
    }
    if (roomNumber === 2) {
      const unlockedRuins = C.store.isUnlocked(4);
      return {
        name: unlockedRuins ? "Cursed Ruins" : "Deeper Candlewood",
        layout: unlockedRuins ? "ruins" : "clearing",
        enemies: [
          new C.CandleGoblin(55, 100, 0),
          new C.CandleGoblin(305, 100, 1),
          new C.BoneBeetle(100, 235),
          new C.BoneBeetle(260, 235),
          new C.HexWisp(180, 115)
        ]
      };
    }
    return {
      name: "The Melted Altar",
      layout: "altar",
      enemies: [
        new C.WaxHeadBrute(180, 135),
        new C.HexWisp(70, 115),
        new C.HexWisp(290, 115)
      ]
    };
  }

  C.RaidScreen = {
    render(root, raidPayload) {
      const raidStats = C.store.getRaidStats();
      const isAsyncRaid = raidPayload && raidPayload.mode === "async";
      const totalRooms = isAsyncRaid ? 1 : 3;
      const initialRoomName = isAsyncRaid
        ? `${raidPayload.defender.displayName || "Unknown Cult"} Defense`
        : "Candlewood Clearing";
      root.innerHTML = `
        <section class="raid-screen screen">
          <div class="raid-header raid-header-expanded">
            <div>
              <p class="eyebrow" id="room-name">${C.UI.escapeHtml(initialRoomName)}</p>
              <strong id="raid-status">Room 1 of ${totalRooms}</strong>
            </div>
            <div class="raid-health-wrap">
              <span id="health-label">${raidStats.maxHealth}/${raidStats.maxHealth}</span>
              <div class="raid-health-track"><i id="player-health-fill"></i></div>
            </div>
          </div>
          <div id="boss-health" class="boss-health is-hidden">
            <div><strong>The Wax-Head Brute</strong><span id="boss-health-label">26/26</span></div>
            <div class="boss-health-track"><i id="boss-health-fill"></i></div>
          </div>
          <div class="raid-frame">
            <canvas id="raid-canvas" width="360" height="520" aria-label="Top-down action raid"></canvas>
            <div id="player-damage-flash" class="player-damage-flash" aria-hidden="true"></div>
            <div id="raid-callout" class="raid-callout is-hidden">
              <strong id="callout-title">Room Cleared</strong>
              <span id="callout-copy">The path deeper has opened.</span>
            </div>
          </div>
          <div class="raid-controls" aria-label="Raid controls">
            <div id="joystick" class="joystick" aria-label="Movement joystick">
              <div id="joystick-stick" class="joystick-stick"></div>
            </div>
            <div class="raid-action-cluster">
              <button id="special-button" class="ability-button special-button" aria-label="Moon Pulse">
                <i class="ability-cooldown"></i>
                <span>Moon</span><small>Pulse</small>
              </button>
              <button id="dodge-button" class="ability-button dodge-button" aria-label="Dodge">
                <i class="ability-cooldown"></i>
                <span>Dodge</span><small>Shift</small>
              </button>
              <button id="attack-button" class="attack-button" aria-label="Attack">
                <i class="ability-cooldown"></i>
                <span>Zap</span>
                <small>Damage ${raidStats.damage}</small>
              </button>
            </div>
          </div>
          <button id="room-action" class="button button-primary claim-raid is-hidden">Enter Next Room</button>
          <p class="desktop-hint">WASD / arrows move. Click / Space attacks. Shift / right click dodges. E casts Moon Pulse.</p>
        </section>
      `;

      const canvas = root.querySelector("#raid-canvas");
      const ctx = canvas.getContext("2d");
      const joystick = root.querySelector("#joystick");
      const stick = root.querySelector("#joystick-stick");
      const attackButton = root.querySelector("#attack-button");
      const dodgeButton = root.querySelector("#dodge-button");
      const specialButton = root.querySelector("#special-button");
      const actionButton = root.querySelector("#room-action");
      const damageFlash = root.querySelector("#player-damage-flash");
      const callout = root.querySelector("#raid-callout");
      const calloutTitle = root.querySelector("#callout-title");
      const calloutCopy = root.querySelector("#callout-copy");
      const status = root.querySelector("#raid-status");
      const roomName = root.querySelector("#room-name");
      const healthLabel = root.querySelector("#health-label");
      const healthFill = root.querySelector("#player-health-fill");
      const bossHealth = root.querySelector("#boss-health");
      const bossHealthLabel = root.querySelector("#boss-health-label");
      const bossHealthFill = root.querySelector("#boss-health-fill");

      const player = new C.RaidPlayer(180, 446, raidStats);
      let roomNumber = 1;
      let currentRoom = null;
      let obstacles = [];
      let enemies = [];
      let projectiles = [];
      let dangerZones = [];
      let pickups = [];
      const rewards = { devotion: 4, food: 0, wood: 0, bones: 0 };
      const particles = [];
      const damageNumbers = [];
      const dodgeGhosts = [];
      const pulseEffects = [];
      const raidRecord = { enemiesDefeated: 0, damageTaken: 0 };
      const keys = new Set();
      const joystickVector = { x: 0, y: 0 };
      let joystickPointer = null;
      let frameId = null;
      let previousTime = performance.now();
      let finished = false;
      let roomCleared = false;
      let shakeTime = 0;
      let shakeStrength = 0;
      let ghostCooldown = 0;

      const world = {
        spawnProjectile(x, y, dx, dy) {
          projectiles.push(new C.HexProjectile(x, y, dx, dy));
        },
        spawnDanger(x, y) {
          dangerZones.push(new C.DangerZone(x, y));
        }
      };

      function updateHealth() {
        healthLabel.textContent = `${player.health}/${player.maxHealth}`;
        healthFill.style.width = `${(player.health / player.maxHealth) * 100}%`;
      }

      function updateAbilityButtons() {
        const abilities = [
          [attackButton, player.attackCooldown, player.attackCooldownMax],
          [dodgeButton, player.dodgeCooldown, player.dodgeCooldownMax],
          [specialButton, player.specialCooldown, player.specialCooldownMax]
        ];
        abilities.forEach(([button, remaining, maximum]) => {
          const ratio = C.Helpers.clamp(remaining / maximum, 0, 1);
          button.style.setProperty("--cooldown-angle", `${ratio * 360}deg`);
          button.classList.toggle("is-ready", remaining <= 0);
          button.setAttribute("aria-label", remaining > 0
            ? `${button.textContent.trim()} cooldown ${remaining.toFixed(1)} seconds`
            : button.textContent.trim());
        });
      }

      function updateBossHealth() {
        const boss = enemies.find((enemy) => enemy.isBoss);
        bossHealth.classList.toggle("is-hidden", !boss);
        if (!boss) return;
        bossHealthLabel.textContent = `${Math.max(0, boss.health)}/${boss.maxHealth}`;
        bossHealthFill.style.width = `${C.Helpers.clamp((boss.health / boss.maxHealth) * 100, 0, 100)}%`;
      }

      function updateStatus() {
        roomName.textContent = currentRoom.name;
        status.textContent = roomCleared
          ? `Room ${roomNumber} cleared`
          : `Room ${roomNumber} of ${totalRooms} - ${enemies.length} foe${enemies.length === 1 ? "" : "s"}`;
        updateBossHealth();
      }

      function setupRoom(number) {
        roomNumber = number;
        currentRoom = roomDefinition(roomNumber, raidPayload);
        obstacles = layouts[currentRoom.layout];
        enemies = currentRoom.enemies;
        projectiles = [];
        dangerZones = [];
        pickups = [];
        roomCleared = false;
        player.x = 180;
        player.y = 446;
        callout.classList.add("is-hidden");
        actionButton.classList.add("is-hidden");
        updateStatus();
      }

      function movementInput() {
        let x = joystickVector.x;
        let y = joystickVector.y;
        if (keys.has("arrowleft") || keys.has("a")) x -= 1;
        if (keys.has("arrowright") || keys.has("d")) x += 1;
        if (keys.has("arrowup") || keys.has("w")) y -= 1;
        if (keys.has("arrowdown") || keys.has("s")) y += 1;
        return { x, y };
      }

      function spawnPickup(enemy) {
        const roll = Math.random();
        let resource = "devotion";
        let amount = enemy.isBoss ? 8 : 3;
        if (roll < 0.28) {
          resource = "food";
          amount = enemy.isBoss ? 7 : 3;
        } else if (roll < 0.58) {
          resource = "wood";
          amount = enemy.isBoss ? 6 : 2;
        } else if (roll < 0.78) {
          resource = "bones";
          amount = enemy.isBoss ? 4 : 1;
        }
        pickups.push(new C.RaidPickup(enemy.x, enemy.y, resource, amount));
      }

      function addBurst(x, y, color) {
        const count = particles.length > 72 ? 4 : 8;
        for (let i = 0; i < count; i += 1) {
          const angle = (Math.PI * 2 * i) / count;
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

      function defeatEnemy(enemy) {
        raidRecord.enemiesDefeated += 1;
        spawnPickup(enemy);
        addBurst(enemy.x, enemy.y, enemy.isBoss ? "#ff765f" : "#d8c1ee");
        C.Audio.play("death");
      }

      function performAttack() {
        if (finished || roomCleared || !player.attack()) return;
        C.Audio.play("attack");
        attackButton.classList.remove("is-attacking");
        void attackButton.offsetWidth;
        attackButton.classList.add("is-attacking");

        enemies = enemies.filter((enemy) => {
          const inRange = distance(player, enemy) < player.radius + enemy.radius + 48;
          const towardEnemy =
            ((enemy.x - player.x) * player.facingX) + ((enemy.y - player.y) * player.facingY) > -250;
          if (!inRange || !towardEnemy) return true;
          const died = enemy.hit(player.damage, player.x, player.y, enemy.isBoss ? 55 : 105);
          addDamageNumber(enemy.x, enemy.y - enemy.radius, player.damage);
          C.Audio.play("hit");
          addBurst(enemy.x, enemy.y, enemy.isBoss ? "#ff765f" : "#f0a765");
          if (enemy.isBoss) {
            shakeTime = 0.13;
            shakeStrength = 4;
          }
          if (died) defeatEnemy(enemy);
          return !died;
        });
        updateStatus();
      }

      function performDodge() {
        if (finished || roomCleared || !player.dodge(movementInput())) return;
        C.Audio.play("dodge");
        dodgeButton.classList.remove("is-activated");
        void dodgeButton.offsetWidth;
        dodgeButton.classList.add("is-activated");
      }

      function performSpecial() {
        if (finished || roomCleared || !player.useSpecial()) return;
        C.Audio.play("special");
        pulseEffects.push({ x: player.x, y: player.y, radius: 18, life: 0.55 });
        specialButton.classList.remove("is-activated");
        void specialButton.offsetWidth;
        specialButton.classList.add("is-activated");
        enemies = enemies.filter((enemy) => {
          if (distance(player, enemy) > 122 + enemy.radius) return true;
          const damage = player.damage + 1;
          const died = enemy.hit(damage, player.x, player.y, enemy.isBoss ? 90 : 210);
          addDamageNumber(enemy.x, enemy.y - enemy.radius, damage, "#d9bdff");
          addBurst(enemy.x, enemy.y, "#b99cff");
          C.Audio.play("hit");
          if (enemy.isBoss) {
            shakeTime = 0.2;
            shakeStrength = 6;
          }
          if (died) defeatEnemy(enemy);
          return !died;
        });
        updateStatus();
      }

      function collectPickup(pickup) {
        rewards[pickup.resource] += pickup.amount;
        addBurst(pickup.x, pickup.y, "#b99cff");
        C.Audio.play("collect");
      }

      function finishRaid(outcome) {
        if (finished) return;
        finished = true;
        pickups.forEach(collectPickup);
        pickups = [];
        const recruitedFollower =
          !isAsyncRaid &&
          outcome === "victory" &&
          C.store.state.followers.length < C.store.getFollowerCapacity() &&
          Math.random() < C.store.getRecruitChance();
        C.App.finishRaid({
          outcome,
          rewards,
          recruitedFollower,
          roomsCleared: roomNumber - (roomCleared ? 0 : 1),
          stats: {
            enemiesDefeated: raidRecord.enemiesDefeated,
            damageTaken: raidRecord.damageTaken
          },
          asyncRaid: isAsyncRaid ? { defender: raidPayload.defender } : null
        });
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

      function clearRoom() {
        roomCleared = true;
        rewards.devotion += roomNumber * 3;
        rewards.food += roomNumber;
        rewards.wood += roomNumber;
        rewards.bones += roomNumber === 3 ? 3 : 1;
        projectiles = [];
        dangerZones = [];
        callout.classList.remove("is-hidden");
        actionButton.classList.remove("is-hidden");
        if (roomNumber < totalRooms) {
          calloutTitle.textContent = `Room ${roomNumber} Cleared`;
          calloutCopy.textContent = roomNumber === 1
            ? "Something heavier is moving deeper in the wood."
            : "The Melted Altar waits ahead.";
          actionButton.textContent = "Enter Next Room";
        } else if (isAsyncRaid) {
          calloutTitle.textContent = "Cult Defense Broken";
          calloutCopy.textContent = `${raidPayload.defender.displayName || "The defender"} will receive this report later.`;
          actionButton.textContent = "Claim Async Raid Rewards";
        } else {
          calloutTitle.textContent = "Brute Defeated";
          calloutCopy.textContent = "The great candle goes out with a tiny, offended hiss.";
          actionButton.textContent = "Claim Raid Rewards";
        }
        updateStatus();
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
          if (touching && enemy.contactCooldown <= 0 && !enemy.attackQueued) {
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
            hurtPlayer(1, projectile.x, projectile.y);
            return false;
          }
          return true;
        });

        dangerZones.forEach((zone) => {
          zone.update(delta);
          if (zone.isDangerous() && !zone.hitPlayer && distance(player, zone) < player.radius + zone.radius) {
            zone.hitPlayer = true;
            hurtPlayer(1, player.x, player.y);
          }
        });
        dangerZones = dangerZones.filter((zone) => zone.timer > 0);

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
        for (let i = particles.length - 1; i >= 0; i -= 1) {
          if (particles[i].life <= 0) particles.splice(i, 1);
        }
        damageNumbers.forEach((number) => {
          number.y -= 28 * delta;
          number.life -= delta;
        });
        for (let i = damageNumbers.length - 1; i >= 0; i -= 1) {
          if (damageNumbers[i].life <= 0) damageNumbers.splice(i, 1);
        }
        dodgeGhosts.forEach((ghost) => {
          ghost.life -= delta;
        });
        for (let i = dodgeGhosts.length - 1; i >= 0; i -= 1) {
          if (dodgeGhosts[i].life <= 0) dodgeGhosts.splice(i, 1);
        }
        pulseEffects.forEach((pulse) => {
          pulse.radius += 230 * delta;
          pulse.life -= delta;
        });
        for (let i = pulseEffects.length - 1; i >= 0; i -= 1) {
          if (pulseEffects[i].life <= 0) pulseEffects.splice(i, 1);
        }
        shakeTime = Math.max(0, shakeTime - delta);

        if (!roomCleared && enemies.length === 0) clearRoom();
      }

      function drawEnemyFeedback(enemy) {
        if (enemy.spawnTimer > 0) {
          ctx.strokeStyle = `rgba(185, 156, 255, ${enemy.spawnTimer * 1.5})`;
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
        ctx.fillStyle = enemy.isBoss ? "#ff765f" : "#e58a78";
        ctx.fillRect(enemy.x - (width / 2), y, width * C.Helpers.clamp(enemy.health / enemy.maxHealth, 0, 1), 5);
      }

      function draw(time) {
        ctx.save();
        if (shakeTime > 0) {
          ctx.translate((Math.random() - 0.5) * shakeStrength, (Math.random() - 0.5) * shakeStrength);
        }
        drawRoom(ctx, time, currentRoom.layout, obstacles);
        ctx.strokeStyle = "rgba(217, 189, 255, .16)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        dangerZones.forEach((zone) => zone.draw(ctx));
        pickups.forEach((pickup) => pickup.draw(ctx, time));
        projectiles.forEach((projectile) => projectile.draw(ctx, time));
        dodgeGhosts.forEach((ghost) => {
          ctx.globalAlpha = Math.max(0, ghost.life / 0.5);
          ctx.fillStyle = "#9d7be0";
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

        ctx.fillStyle = "#b69be0";
        ctx.font = "700 11px system-ui";
        ctx.textAlign = "left";
        ctx.fillText(`LOOT  D ${rewards.devotion}  F ${rewards.food}  W ${rewards.wood}  B ${rewards.bones}`, 12, 30);
        ctx.restore();
      }

      function frame(time) {
        const delta = Math.min(0.033, (time - previousTime) / 1000);
        previousTime = time;
        if (!finished) {
          update(delta);
          draw(time);
          updateBossHealth();
          frameId = requestAnimationFrame(frame);
        }
      }

      function onKeyDown(event) {
        const key = event.key.toLowerCase();
        if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", " ", "shift", "e"].includes(key)) {
          event.preventDefault();
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

      function onRoomAction() {
        if (roomNumber < totalRooms) setupRoom(roomNumber + 1);
        else finishRaid("victory");
      }

      function onCanvasPointer(event) {
        event.preventDefault();
        if (event.button === 2) performDodge();
        else performAttack();
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
      canvas.addEventListener("pointerdown", onCanvasPointer);
      canvas.addEventListener("contextmenu", preventContextMenu);
      actionButton.addEventListener("click", onRoomAction);

      setupRoom(1);
      updateHealth();
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
        canvas.removeEventListener("pointerdown", onCanvasPointer);
        canvas.removeEventListener("contextmenu", preventContextMenu);
        actionButton.removeEventListener("click", onRoomAction);
      };
    }
  };
})();
