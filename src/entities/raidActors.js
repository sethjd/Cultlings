(function () {
  const C = window.Cultlings = window.Cultlings || {};

  function drawEyes(ctx, spread, y, color) {
    ctx.fillStyle = color || "#ffd978";
    ctx.beginPath();
    ctx.arc(-spread, y, 3, 0, Math.PI * 2);
    ctx.arc(spread, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayerMask(ctx) {
    const equipped = C.store && C.store.getEquippedCosmetic("masks");
    if (!equipped || equipped.id === "maskBareMoon") return;
    ctx.save();
    if (equipped.id === "maskWaxSmile") {
      ctx.fillStyle = "#ead6aa";
      ctx.beginPath();
      ctx.ellipse(0, -1, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9c665c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 1, 6, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (equipped.id === "maskBoneVisor") {
      ctx.fillStyle = "#dfd5ba";
      ctx.beginPath();
      ctx.moveTo(-15, -9);
      ctx.lineTo(15, -9);
      ctx.lineTo(11, 8);
      ctx.lineTo(0, 12);
      ctx.lineTo(-11, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2a2035";
      ctx.fillRect(-11, -4, 8, 5);
      ctx.fillRect(3, -4, 8, 5);
    } else if (equipped.id === "maskMushroom") {
      ctx.fillStyle = "#d97f88";
      ctx.beginPath();
      ctx.arc(0, -10, 18, Math.PI, Math.PI * 2);
      ctx.lineTo(14, -2);
      ctx.lineTo(-14, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f5d8be";
      ctx.beginPath();
      ctx.arc(-7, -11, 3, 0, Math.PI * 2);
      ctx.arc(7, -15, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (equipped.id === "maskStarVeil") {
      ctx.fillStyle = "rgba(28, 24, 57, .88)";
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(17, 12);
      ctx.lineTo(-17, 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e8d28c";
      for (let index = 0; index < 4; index += 1) {
        ctx.beginPath();
        ctx.arc(-9 + (index * 6), -8 + ((index % 2) * 10), 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  class RaidPlayer {
    constructor(x, y, stats) {
      this.x = x;
      this.y = y;
      this.radius = 17;
      this.speed = 150;
      this.maxHealth = stats.maxHealth;
      this.health = this.maxHealth;
      this.damage = stats.damage;
      this.attackCooldown = 0;
      this.attackCooldownMax = 0.4;
      this.attackFlash = 0;
      this.hurtFlash = 0;
      this.dodgeCooldown = 0;
      this.dodgeCooldownMax = 2.25;
      this.dodgeTimer = 0;
      this.dodgeDirection = { x: 0, y: -1 };
      this.specialCooldown = 0;
      this.specialCooldownMax = 9;
      this.facingX = 0;
      this.facingY = -1;
    }

    update(delta, movement) {
      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
      this.attackFlash = Math.max(0, this.attackFlash - delta);
      this.hurtFlash = Math.max(0, this.hurtFlash - delta);
      this.dodgeCooldown = Math.max(0, this.dodgeCooldown - delta);
      this.specialCooldown = Math.max(0, this.specialCooldown - delta);
      this.dodgeTimer = Math.max(0, this.dodgeTimer - delta);

      const length = Math.hypot(movement.x, movement.y);
      if (this.dodgeTimer > 0) {
        this.x += this.dodgeDirection.x * 430 * delta;
        this.y += this.dodgeDirection.y * 430 * delta;
      } else if (length > 0.05) {
        const nx = movement.x / Math.max(1, length);
        const ny = movement.y / Math.max(1, length);
        this.x += nx * this.speed * delta;
        this.y += ny * this.speed * delta;
        this.facingX = nx;
        this.facingY = ny;
      }

      this.x = C.Helpers.clamp(this.x, 25, C.DATA.raid.worldWidth - 25);
      this.y = C.Helpers.clamp(this.y, 62, C.DATA.raid.worldHeight - 26);
    }

    attack() {
      if (this.attackCooldown > 0) return false;
      this.attackCooldown = this.attackCooldownMax;
      this.attackFlash = 0.16;
      return true;
    }

    dodge(movement) {
      if (this.dodgeCooldown > 0 || this.dodgeTimer > 0) return false;
      const length = Math.hypot(movement.x, movement.y);
      const direction = length > 0.05
        ? { x: movement.x / length, y: movement.y / length }
        : { x: this.facingX, y: this.facingY };
      this.dodgeDirection = direction;
      this.facingX = direction.x;
      this.facingY = direction.y;
      this.dodgeTimer = 0.2;
      this.dodgeCooldown = this.dodgeCooldownMax;
      return true;
    }

    useSpecial() {
      if (this.specialCooldown > 0) return false;
      this.specialCooldown = this.specialCooldownMax;
      return true;
    }

    hurt(amount) {
      if (this.hurtFlash > 0 || this.dodgeTimer > 0) return false;
      this.health = Math.max(0, this.health - (amount || 1));
      this.hurtFlash = 0.62;
      return true;
    }

    draw(ctx, time) {
      const bob = Math.sin(time * 0.006) * 2;
      ctx.save();
      const breath = 1 + (Math.sin(time * 0.004) * 0.025);
      ctx.translate(this.x, this.y + bob);
      ctx.scale(breath, 1 / breath);

      if (this.attackFlash > 0) {
        ctx.strokeStyle = "rgba(255, 218, 126, .88)";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(this.facingX * 22, this.facingY * 22, 43, -1.15, 1.15);
        ctx.stroke();
      }

      if (this.hurtFlash > 0 && Math.floor(this.hurtFlash * 20) % 2 === 0) ctx.globalAlpha = 0.35;

      ctx.fillStyle = "#151126";
      ctx.beginPath();
      ctx.moveTo(-17, -10);
      ctx.quadraticCurveTo(-28, -28, -11, -31);
      ctx.quadraticCurveTo(-5, -24, -3, -17);
      ctx.lineTo(3, -17);
      ctx.quadraticCurveTo(5, -24, 11, -31);
      ctx.quadraticCurveTo(28, -28, 17, -10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#8063c5";
      ctx.beginPath();
      ctx.ellipse(0, 3, 19, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#211934";
      ctx.beginPath();
      ctx.ellipse(0, 16, 13, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      drawPlayerMask(ctx);
      drawEyes(ctx, 7, -1);
      ctx.restore();
    }
  }

  class BaseEnemy {
    constructor(x, y, options) {
      this.x = x;
      this.y = y;
      this.radius = options.radius;
      this.speed = options.speed;
      this.health = options.health;
      this.maxHealth = options.health;
      this.damage = options.damage || 1;
      this.name = options.name;
      this.hitFlash = 0;
      this.contactCooldown = 0;
      this.attackWarning = 0;
      this.attackQueued = false;
      this.spawnTimer = 0.36 + (Math.random() * 0.18);
      this.knockbackX = 0;
      this.knockbackY = 0;
      this.phase = Math.random() * Math.PI * 2;
      this.isBoss = false;
    }

    chase(delta, player, speedMultiplier) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      this.x += (dx / length) * this.speed * (speedMultiplier || 1) * delta;
      this.y += (dy / length) * this.speed * (speedMultiplier || 1) * delta;
    }

    updateTimers(delta) {
      this.hitFlash = Math.max(0, this.hitFlash - delta);
      this.contactCooldown = Math.max(0, this.contactCooldown - delta);
      this.attackWarning = Math.max(0, this.attackWarning - delta);
      this.spawnTimer = Math.max(0, this.spawnTimer - delta);
      this.x += this.knockbackX * delta;
      this.y += this.knockbackY * delta;
      const damping = Math.pow(0.025, delta);
      this.knockbackX *= damping;
      this.knockbackY *= damping;
    }

    hit(amount, sourceX, sourceY, force) {
      this.health -= amount || 1;
      this.hitFlash = 0.15;
      if (Number.isFinite(sourceX) && Number.isFinite(sourceY)) {
        const dx = this.x - sourceX;
        const dy = this.y - sourceY;
        const length = Math.max(1, Math.hypot(dx, dy));
        this.knockbackX += (dx / length) * (force || 95);
        this.knockbackY += (dy / length) * (force || 95);
      }
      return this.health <= 0;
    }
  }

  class CandleGoblin extends BaseEnemy {
    constructor(x, y, index) {
      super(x, y, { radius: 17, speed: 56 + ((index || 0) * 2), health: 3, name: "Candle Goblin" });
    }

    update(delta, player) {
      this.updateTimers(delta);
      this.chase(delta, player);
    }

    draw(ctx, time) {
      const bob = Math.sin((time * 0.007) + this.phase) * 2;
      ctx.save();
      ctx.translate(this.x, this.y + bob);
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#75496f";
      ctx.beginPath();
      ctx.ellipse(0, 8, 17, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#a26965";
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-25, -9);
      ctx.lineTo(-15, 10);
      ctx.moveTo(14, 0);
      ctx.lineTo(25, -9);
      ctx.lineTo(15, 10);
      ctx.fill();

      ctx.fillStyle = "#2c2038";
      ctx.beginPath();
      ctx.arc(0, -2, 14, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, 5, -3, "#f6c76d");

      ctx.fillStyle = "#f3e1b1";
      ctx.fillRect(-5, -25, 10, 18);
      ctx.fillStyle = "#f3a65a";
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.quadraticCurveTo(11, -27, 0, -21);
      ctx.quadraticCurveTo(-10, -28, 0, -40);
      ctx.fill();
      ctx.restore();
    }
  }

  class BoneBeetle extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 22, speed: 35, health: 7, name: "Bone Beetle" });
    }

    update(delta, player) {
      this.updateTimers(delta);
      this.chase(delta, player);
    }

    draw(ctx, time) {
      const wobble = Math.sin((time * 0.004) + this.phase) * 0.05;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(wobble);

      ctx.strokeStyle = "#d8ceb4";
      ctx.lineWidth = 5;
      for (let side = -1; side <= 1; side += 2) {
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.moveTo(side * 12, i * 9);
          ctx.lineTo(side * 27, i * 14 + 5);
          ctx.stroke();
        }
      }

      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#4c4960";
      ctx.beginPath();
      ctx.ellipse(0, 2, 20, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#aaa28e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, 22);
      ctx.stroke();
      ctx.fillStyle = "#252132";
      ctx.beginPath();
      ctx.arc(0, -15, 13, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, 5, -17, "#b99cff");
      ctx.restore();
    }
  }

  class HexWisp extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 15, speed: 43, health: 4, name: "Hex Wisp" });
      this.shotCooldown = 1 + Math.random();
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      this.shotCooldown -= delta;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      if (length > 185) {
        this.x += (dx / length) * this.speed * delta;
        this.y += (dy / length) * this.speed * delta;
      } else if (length < 115) {
        this.x -= (dx / length) * this.speed * 0.75 * delta;
        this.y -= (dy / length) * this.speed * 0.75 * delta;
      }
      if (this.shotCooldown <= 0) {
        world.spawnProjectile(this.x, this.y, dx / length, dy / length);
        this.shotCooldown = 2.2;
      }
    }

    draw(ctx, time) {
      const bob = Math.sin((time * 0.006) + this.phase) * 5;
      ctx.save();
      ctx.translate(this.x, this.y + bob);
      ctx.fillStyle = "rgba(164, 116, 220, .18)";
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#8f68bd";
      ctx.beginPath();
      ctx.arc(0, -2, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-11, 8);
      ctx.quadraticCurveTo(-5, 29, 0, 14);
      ctx.quadraticCurveTo(7, 31, 12, 7);
      ctx.fill();
      drawEyes(ctx, 5, -4, "#d9ffef");
      ctx.restore();
    }
  }

  class WaxHeadBrute extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 32, speed: 31, health: 26, damage: 2, name: "The Wax-Head Brute" });
      this.isBoss = true;
      this.bossId = "waxBrute";
      this.phase = 1;
      this.dangerCooldown = 2.1;
      this.volleyCooldown = 3.6;
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      if (this.phase === 1 && this.health <= this.maxHealth / 2) {
        this.phase = 2;
        this.speed *= 1.18;
        world.bossPhase(this);
      }
      this.chase(delta, player, this.phase === 2 ? 1.08 : 1);
      this.dangerCooldown -= delta;
      this.volleyCooldown -= delta;
      if (this.dangerCooldown <= 0) {
        world.spawnDanger(player.x, player.y, {
          radius: this.phase === 2 ? 42 : 34,
          color: "#ff765f",
          warning: 1.15
        });
        this.dangerCooldown = this.phase === 2 ? 1.55 : 2.35;
      }
      if (this.volleyCooldown <= 0) {
        world.radialProjectiles(this.x, this.y, this.phase === 2 ? 8 : 5, {
          speed: 88,
          color: "#f2a35c",
          radius: 7
        });
        this.volleyCooldown = this.phase === 2 ? 2.6 : 3.8;
      }
    }

    draw(ctx, time) {
      const bob = Math.sin(time * 0.003) * 2;
      ctx.save();
      ctx.translate(this.x, this.y + bob);
      ctx.fillStyle = "rgba(243, 166, 90, .12)";
      ctx.beginPath();
      ctx.arc(0, -12, 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#5b3b58";
      ctx.beginPath();
      ctx.ellipse(0, 13, 31, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#35263d";
      ctx.beginPath();
      ctx.arc(0, -11, 27, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, 10, -13, "#ffb75e");

      ctx.fillStyle = "#e9d8b1";
      ctx.fillRect(-13, -55, 26, 35);
      ctx.fillStyle = "#e49757";
      ctx.beginPath();
      ctx.moveTo(0, -83);
      ctx.quadraticCurveTo(24, -58, 4, -47);
      ctx.quadraticCurveTo(-18, -60, 0, -83);
      ctx.fill();
      ctx.fillStyle = "#c9b58d";
      ctx.beginPath();
      ctx.ellipse(-8, -35, 7, 16, 0.25, 0, Math.PI * 2);
      ctx.ellipse(10, -31, 6, 19, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class SporeImp extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 14, speed: 82, health: 3, name: "Spore Imp" });
      this.deathEffect = "poison";
    }

    update(delta, player) {
      this.updateTimers(delta);
      this.chase(delta, player, 1 + (Math.sin(this.phase + performance.now() * 0.008) * 0.08));
    }

    draw(ctx, time) {
      const bob = Math.sin(time * 0.012 + this.phase) * 3;
      ctx.save();
      ctx.translate(this.x, this.y + bob);
      ctx.fillStyle = "rgba(144, 222, 141, .2)";
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#7eae73";
      ctx.beginPath();
      ctx.ellipse(0, 6, 13, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#b7759e";
      ctx.beginPath();
      ctx.arc(0, -8, 16, Math.PI, Math.PI * 2);
      ctx.lineTo(12, -2);
      ctx.lineTo(-12, -2);
      ctx.closePath();
      ctx.fill();
      drawEyes(ctx, 5, 3, "#f1efad");
      ctx.restore();
    }
  }

  class BogSkull extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 19, speed: 27, health: 6, name: "Bog Skull" });
      this.shotCooldown = 1.1;
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      this.shotCooldown -= delta;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      if (length > 215) this.chase(delta, player);
      if (length < 120) {
        this.x -= (dx / length) * this.speed * delta;
        this.y -= (dy / length) * this.speed * delta;
      }
      if (this.shotCooldown <= 0) {
        this.attackWarning = 0.25;
        world.spawnProjectile(this.x, this.y, dx / length, dy / length, {
          speed: 72,
          color: "#8fd29a",
          radius: 8
        });
        this.shotCooldown = 2.5;
      }
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y + Math.sin(time * 0.004 + this.phase) * 2);
      ctx.fillStyle = "rgba(91, 151, 114, .24)";
      ctx.beginPath();
      ctx.ellipse(0, 12, 25, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#c8c8a8";
      ctx.beginPath();
      ctx.arc(0, -1, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#24322e";
      ctx.beginPath();
      ctx.arc(-7, -4, 5, 0, Math.PI * 2);
      ctx.arc(7, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-7, 8, 14, 4);
      ctx.restore();
    }
  }

  class GraveCandle extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 17, speed: 0, health: 8, name: "Grave Candle" });
      this.shotCooldown = 0.8;
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      this.shotCooldown -= delta;
      if (this.shotCooldown <= 0) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const length = Math.max(1, Math.hypot(dx, dy));
        this.attackWarning = 0.32;
        world.spawnProjectile(this.x, this.y, dx / length, dy / length, {
          speed: 104,
          color: "#e99762",
          radius: 6
        });
        this.shotCooldown = 1.75;
      }
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#d8cfb2";
      ctx.fillRect(-11, -17, 22, 40);
      ctx.fillStyle = "#9b8c73";
      ctx.beginPath();
      ctx.ellipse(-6, 0, 5, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f1a35e";
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.quadraticCurveTo(16, -24, 0, -17);
      ctx.quadraticCurveTo(-13, -27, 0, -42);
      ctx.fill();
      ctx.fillStyle = "#30263a";
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, 3, 1, "#ffc878");
      ctx.restore();
    }
  }

  class BellWraith extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 16, speed: 52, health: 5, name: "Bell Wraith" });
      this.phaseTimer = 1.5;
      this.phased = false;
    }

    canBeHit() {
      return !this.phased;
    }

    update(delta, player) {
      this.updateTimers(delta);
      this.phaseTimer -= delta;
      if (this.phaseTimer <= 0) {
        this.phased = !this.phased;
        this.phaseTimer = this.phased ? 0.55 : 1.9;
      }
      this.chase(delta, player, this.phased ? 1.45 : 0.9);
    }

    draw(ctx, time) {
      ctx.save();
      ctx.globalAlpha = this.phased ? 0.28 : 0.88;
      ctx.translate(this.x, this.y + Math.sin(time * 0.007 + this.phase) * 5);
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#9386bd";
      ctx.beginPath();
      ctx.arc(0, -6, 15, 0, Math.PI * 2);
      ctx.moveTo(-13, 4);
      ctx.quadraticCurveTo(-8, 28, 0, 13);
      ctx.quadraticCurveTo(9, 30, 14, 3);
      ctx.fill();
      ctx.strokeStyle = "#d9cfaa";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -8, 10, Math.PI, 0);
      ctx.stroke();
      drawEyes(ctx, 5, -7, "#f2e7b7");
      ctx.restore();
    }
  }

  class RootGrasper extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 21, speed: 24, health: 7, name: "Root Grasper" });
      this.rootCooldown = 1.4;
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      this.chase(delta, player, 0.65);
      this.rootCooldown -= delta;
      if (this.rootCooldown <= 0) {
        world.spawnSlow(player.x, player.y, { radius: 38, duration: 3.4, color: "#7e5f8f" });
        this.rootCooldown = 3.2;
      }
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.strokeStyle = this.hitFlash > 0 ? "#fff4d2" : "#76644d";
      ctx.lineWidth = 7;
      for (let index = 0; index < 5; index += 1) {
        const angle = ((Math.PI * 2) / 5) * index + Math.sin(time * 0.003 + this.phase) * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(Math.cos(angle) * 12, Math.sin(angle) * 12, Math.cos(angle) * 28, Math.sin(angle) * 28);
        ctx.stroke();
      }
      ctx.fillStyle = "#493f32";
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, 5, -2, "#bfe09d");
      ctx.restore();
    }
  }

  class TinyHeretic extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 14, speed: 76, health: 4, name: "Tiny Heretic" });
      this.buffCooldown = 1;
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      this.x += (dx / length) * this.speed * delta;
      this.y += (dy / length) * this.speed * delta;
      this.buffCooldown -= delta;
      if (this.buffCooldown <= 0) {
        world.buffEnemies(this);
        this.buffCooldown = 3.4;
      }
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y + Math.sin(time * 0.01 + this.phase) * 2);
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#c56e83";
      ctx.beginPath();
      ctx.ellipse(0, 5, 13, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#30243a";
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(0, -24);
      ctx.lineTo(14, -4);
      ctx.closePath();
      ctx.fill();
      drawEyes(ctx, 5, 1, "#f8dd8b");
      ctx.strokeStyle = "rgba(239, 128, 160, .5)";
      ctx.beginPath();
      ctx.arc(0, 0, 23 + Math.sin(time * 0.01) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  class BigWetProphet extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 34, speed: 27, health: 30, damage: 2, name: "The Big Wet Prophet" });
      this.isBoss = true;
      this.bossId = "wetProphet";
      this.phase = 1;
      this.spitCooldown = 1.4;
      this.puddleCooldown = 2.2;
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      if (this.phase === 1 && this.health <= this.maxHealth / 2) {
        this.phase = 2;
        world.bossPhase(this);
        world.spawnEnemy("sporeImp", this.x - 50, this.y + 30);
        world.spawnEnemy("sporeImp", this.x + 50, this.y + 30);
      }
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      if (length > 170) this.chase(delta, player);
      this.spitCooldown -= delta;
      this.puddleCooldown -= delta;
      if (this.spitCooldown <= 0) {
        const count = this.phase === 2 ? 5 : 3;
        for (let index = 0; index < count; index += 1) {
          const spread = (index - ((count - 1) / 2)) * 0.18;
          const angle = Math.atan2(dy, dx) + spread;
          world.spawnProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle), {
            speed: 76,
            color: "#90d894",
            radius: 8
          });
        }
        this.spitCooldown = this.phase === 2 ? 1.55 : 2.2;
      }
      if (this.puddleCooldown <= 0) {
        world.spawnSlow(player.x, player.y, { radius: this.phase === 2 ? 48 : 40, duration: 4, color: "#6f9c83", damage: 1 });
        this.puddleCooldown = this.phase === 2 ? 2.25 : 3.2;
      }
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y + Math.sin(time * 0.003) * 3);
      ctx.fillStyle = "rgba(102, 173, 137, .25)";
      ctx.beginPath();
      ctx.ellipse(0, 25, 48, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#608e78";
      ctx.beginPath();
      ctx.ellipse(0, 5, 33, 37, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#313d43";
      ctx.beginPath();
      ctx.arc(0, -13, 25, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, 10, -15, "#d4f29e");
      ctx.fillStyle = "#ab6f9f";
      ctx.beginPath();
      ctx.arc(0, -35, 28, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class SaintHollowbell extends BaseEnemy {
    constructor(x, y) {
      super(x, y, { radius: 31, speed: 34, health: 34, damage: 2, name: "Saint Hollowbell" });
      this.isBoss = true;
      this.bossId = "hollowbell";
      this.phase = 1;
      this.tollCooldown = 1.8;
      this.echoCooldown = 3.4;
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      if (this.phase === 1 && this.health <= this.maxHealth / 2) {
        this.phase = 2;
        this.speed *= 1.15;
        world.bossPhase(this);
        world.spawnEnemy("bellWraith", this.x - 55, this.y);
        world.spawnEnemy("bellWraith", this.x + 55, this.y);
      }
      this.chase(delta, player, 0.72);
      this.tollCooldown -= delta;
      this.echoCooldown -= delta;
      if (this.tollCooldown <= 0) {
        world.radialProjectiles(this.x, this.y, this.phase === 2 ? 10 : 7, {
          speed: 92,
          color: "#d9cfaa",
          radius: 6
        });
        this.tollCooldown = this.phase === 2 ? 1.85 : 2.55;
      }
      if (this.echoCooldown <= 0) {
        world.spawnDanger(this.x, this.y, {
          radius: this.phase === 2 ? 100 : 78,
          color: "#b9a9df",
          warning: 1.35,
          damage: 1
        });
        this.echoCooldown = this.phase === 2 ? 2.8 : 3.8;
      }
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y + Math.sin(time * 0.004) * 3);
      ctx.fillStyle = "rgba(199, 190, 157, .16)";
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : "#77708f";
      ctx.beginPath();
      ctx.moveTo(-30, -15);
      ctx.quadraticCurveTo(0, -48, 30, -15);
      ctx.lineTo(24, 28);
      ctx.quadraticCurveTo(0, 42, -24, 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#201c2c";
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      drawEyes(ctx, 7, -2, "#eee3b4");
      ctx.strokeStyle = "#d9cfaa";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -17, 25, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  class DefenderGuard extends BaseEnemy {
    constructor(x, y, guard, index) {
      super(x, y, {
        radius: 18,
        speed: 50 + ((index || 0) * 2),
        health: 5,
        name: guard.name || "Cult Guard"
      });
      this.guard = guard;
      this.color = guard.color || "#bca7ff";
    }

    update(delta, player) {
      this.updateTimers(delta);
      this.chase(delta, player);
    }

    draw(ctx, time) {
      const bob = Math.sin((time * 0.006) + this.phase) * 2;
      ctx.save();
      ctx.translate(this.x, this.y + bob);
      ctx.fillStyle = this.hitFlash > 0 ? "#fff4d2" : this.color;
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#211934";
      ctx.beginPath();
      ctx.ellipse(0, 17, 14, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-13, -8);
      ctx.lineTo(-23, -20);
      ctx.lineTo(-17, 2);
      ctx.moveTo(13, -8);
      ctx.lineTo(23, -20);
      ctx.lineTo(17, 2);
      ctx.fill();
      drawEyes(ctx, 6, -1, "#ffd978");

      ctx.strokeStyle = "#e3d5ef";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(15, 5);
      ctx.lineTo(27, -12);
      ctx.stroke();
      ctx.restore();
    }
  }

  class HexProjectile {
    constructor(x, y, directionX, directionY, options) {
      const settings = options || {};
      this.x = x;
      this.y = y;
      this.vx = directionX * (settings.speed || 82);
      this.vy = directionY * (settings.speed || 82);
      this.radius = settings.radius || 7;
      this.color = settings.color || "#c58af1";
      this.damage = settings.damage || 1;
      this.life = 5;
    }

    update(delta) {
      this.x += this.vx * delta;
      this.y += this.vy * delta;
      this.life -= delta;
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(time * 0.004);
      ctx.fillStyle = "rgba(190, 135, 246, .25)";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  class DangerZone {
    constructor(x, y, options) {
      const settings = options || {};
      this.x = x;
      this.y = y;
      this.radius = settings.radius || 34;
      this.timer = settings.warning || 1.25;
      this.startTimer = this.timer;
      this.color = settings.color || "#ff765f";
      this.damage = settings.damage || 1;
      this.hitPlayer = false;
    }

    update(delta) {
      this.timer -= delta;
    }

    isDangerous() {
      return this.timer <= Math.min(0.55, this.startTimer * 0.45) && this.timer > 0;
    }

    draw(ctx) {
      const dangerous = this.isDangerous();
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = `${this.color}${dangerous ? "66" : "20"}`;
      ctx.strokeStyle = `${this.color}${dangerous ? "ff" : "aa"}`;
      ctx.lineWidth = dangerous ? 5 : 2;
      ctx.setLineDash(dangerous ? [] : [5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  class SlowPatch {
    constructor(x, y, options) {
      const settings = options || {};
      this.x = x;
      this.y = y;
      this.radius = settings.radius || 38;
      this.timer = settings.duration || 3;
      this.color = settings.color || "#7e5f8f";
      this.damage = settings.damage || 0;
      this.damageCooldown = 0;
      this.warning = Number.isFinite(settings.warning) ? settings.warning : 0.45;
    }

    update(delta) {
      this.timer -= delta;
      this.warning = Math.max(0, this.warning - delta);
      this.damageCooldown = Math.max(0, this.damageCooldown - delta);
    }

    isActive() {
      return this.warning <= 0;
    }

    draw(ctx, time) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = `${this.color}${this.isActive() ? "44" : "18"}`;
      ctx.strokeStyle = `${this.color}${this.isActive() ? "bb" : "88"}`;
      ctx.lineWidth = this.isActive() ? 2 : 4;
      ctx.setLineDash(this.isActive() ? [] : [6, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + Math.sin(time * 0.006) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  class RaidPickup {
    constructor(x, y, resource, amount) {
      this.x = x;
      this.y = y;
      this.resource = resource;
      this.amount = amount;
      this.radius = 11;
      this.phase = Math.random() * Math.PI * 2;
    }

    draw(ctx, time) {
      const colors = {
        devotion: "#b99cff",
        food: "#e58a78",
        wood: "#7fc4a4",
        bones: "#e8dfc4"
      };
      ctx.save();
      ctx.translate(this.x, this.y + Math.sin(time * 0.008 + this.phase) * 3);
      ctx.fillStyle = "rgba(255,255,255,.12)";
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors[this.resource];
      if (this.resource === "wood") {
        ctx.rotate(-0.4);
        ctx.fillRect(-5, -11, 10, 22);
      } else if (this.resource === "bones") {
        ctx.rotate(0.7);
        ctx.fillRect(-3, -10, 6, 20);
        ctx.beginPath();
        ctx.arc(0, -9, 5, 0, Math.PI * 2);
        ctx.arc(0, 9, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  C.RaidPlayer = RaidPlayer;
  C.CandleGoblin = CandleGoblin;
  C.BoneBeetle = BoneBeetle;
  C.HexWisp = HexWisp;
  C.WaxHeadBrute = WaxHeadBrute;
  C.SporeImp = SporeImp;
  C.BogSkull = BogSkull;
  C.GraveCandle = GraveCandle;
  C.BellWraith = BellWraith;
  C.RootGrasper = RootGrasper;
  C.TinyHeretic = TinyHeretic;
  C.BigWetProphet = BigWetProphet;
  C.SaintHollowbell = SaintHollowbell;
  C.DefenderGuard = DefenderGuard;
  C.HexProjectile = HexProjectile;
  C.DangerZone = DangerZone;
  C.SlowPatch = SlowPatch;
  C.RaidPickup = RaidPickup;
})();
