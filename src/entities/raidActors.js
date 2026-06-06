(function () {
  const C = window.Cultlings = window.Cultlings || {};

  function drawEyes(ctx, spread, y, color) {
    ctx.fillStyle = color || "#ffd978";
    ctx.beginPath();
    ctx.arc(-spread, y, 3, 0, Math.PI * 2);
    ctx.arc(spread, y, 3, 0, Math.PI * 2);
    ctx.fill();
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
      this.attackFlash = 0;
      this.hurtFlash = 0;
      this.facingX = 0;
      this.facingY = -1;
    }

    update(delta, movement) {
      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
      this.attackFlash = Math.max(0, this.attackFlash - delta);
      this.hurtFlash = Math.max(0, this.hurtFlash - delta);

      const length = Math.hypot(movement.x, movement.y);
      if (length > 0.05) {
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
      this.attackCooldown = 0.4;
      this.attackFlash = 0.16;
      return true;
    }

    hurt(amount) {
      if (this.hurtFlash > 0) return false;
      this.health = Math.max(0, this.health - (amount || 1));
      this.hurtFlash = 0.62;
      return true;
    }

    draw(ctx, time) {
      const bob = Math.sin(time * 0.006) * 2;
      ctx.save();
      ctx.translate(this.x, this.y + bob);

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
    }

    hit(amount) {
      this.health -= amount || 1;
      this.hitFlash = 0.15;
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
      this.dangerCooldown = 2.1;
    }

    update(delta, player, world) {
      this.updateTimers(delta);
      this.chase(delta, player);
      this.dangerCooldown -= delta;
      if (this.dangerCooldown <= 0) {
        world.spawnDanger(player.x, player.y);
        this.dangerCooldown = this.health < this.maxHealth / 2 ? 1.7 : 2.35;
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
    constructor(x, y, directionX, directionY) {
      this.x = x;
      this.y = y;
      this.vx = directionX * 82;
      this.vy = directionY * 82;
      this.radius = 7;
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
      ctx.fillStyle = "#c58af1";
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
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 34;
      this.timer = 1.25;
      this.hitPlayer = false;
    }

    update(delta) {
      this.timer -= delta;
    }

    isDangerous() {
      return this.timer <= 0.55 && this.timer > 0;
    }

    draw(ctx) {
      const dangerous = this.isDangerous();
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.fillStyle = dangerous ? "rgba(244, 105, 80, .42)" : "rgba(244, 166, 80, .12)";
      ctx.strokeStyle = dangerous ? "#ff765f" : "#eaa258";
      ctx.lineWidth = dangerous ? 5 : 2;
      ctx.setLineDash(dangerous ? [] : [5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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
  C.DefenderGuard = DefenderGuard;
  C.HexProjectile = HexProjectile;
  C.DangerZone = DangerZone;
  C.RaidPickup = RaidPickup;
})();
