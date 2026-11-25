/**
 * 《星匣：深渊防线》v3.0 全屏 2.5D 俯视角肉鸽虫潮生存战斗引擎
 * - 100% 忠实同步权威 BattleReport.timeline（绝不篡改后端判定）
 * - 支持自动风筝走位 + 玩家按住鼠标/触控手动走位牵引
 * - 三类深渊异虫 + 巨型利维坦 Boss + 地面持久酸液/焦痕贴花层
 * - 零 Emoji：所有伤害跳字均采用硬核描边战术数值风格
 */

import { ITEM_CATALOG, OVERTIME_START_SEC } from '../../shared/protocol.mjs';
import { sfx } from './sfx.mjs';

export class BattleArena {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;

    this.decalCanvas = document.createElement('canvas');
    this.decalCtx = this.decalCanvas.getContext('2d');

    this.logicalW = 410;
    this.logicalH = 760;

    this.mode = 'idle'; // 'idle' | 'playing' | 'done'
    this.speed = 1;
    this.report = null;

    this.simTime = 0;
    this.eventCursor = 0;
    this.lastFrameTs = 0;
    this.rafId = null;

    this.playerHp = 100;
    this.playerMaxHp = 100;
    this.playerShield = 0;

    this.enemyHp = 65;
    this.enemyMaxHp = 65;
    this.enemyShield = 0;
    this.enemyBurn = 0;
    this.enemyShock = 0;
    this.enemyChill = 0;
    this.totalEnemyPool = 65;

    this.rig = {
      x: 205,
      y: 380,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      turretAngle: -Math.PI / 2,
      hitFlash: 0,
      recoil: 0,
      orbitPhase: 0,
    };

    this.pointerSteer = { active: false, x: 205, y: 380 };
    this.equippedMeta = { hasDagger: false, hasMedkit: false };

    this.monsters = [];
    this.killCount = 0;
    this.initialSwarmCount = 18;

    this.slashes = [];
    this.beams = [];
    this.bolts = [];
    this.particles = [];
    this.shards = [];
    this.floatingTexts = [];
    this.rings = [];

    this.shakeTime = 0;
    this.shakeAmp = 0;
    this.playerHurtPulse = 0;
    this.ambientPhase = 0;

    this.bindInput();
  }

  bindInput() {
    const updatePtr = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      this.pointerSteer.x = ((e.clientX - rect.left) / rect.width) * this.logicalW;
      this.pointerSteer.y = ((e.clientY - rect.top) / rect.height) * this.logicalH;
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'playing') return;
      this.pointerSteer.active = true;
      updatePtr(e);
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.pointerSteer.active) return;
      updatePtr(e);
    });
    window.addEventListener('pointerup', () => {
      this.pointerSteer.active = false;
    });
    window.addEventListener('pointercancel', () => {
      this.pointerSteer.active = false;
    });
  }

  resizeToContainer() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const w = Math.max(300, Math.round(rect.width));
    const h = Math.max(420, Math.round(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    this.logicalW = w;
    this.logicalH = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (this.decalCanvas.width !== w || this.decalCanvas.height !== h) {
      this.decalCanvas.width = w;
      this.decalCanvas.height = h;
    }
  }

  startLoop() {
    if (this.rafId !== null) return;
    const step = (ts) => {
      if (!this.lastFrameTs) this.lastFrameTs = ts;
      const dt = Math.min(0.05, (ts - this.lastFrameTs) / 1000);
      this.lastFrameTs = ts;
      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }

  stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  spawnMonster(kind, wave, edgeBias = null) {
    const w = this.logicalW;
    const h = this.logicalH;
    const edge = edgeBias !== null ? edgeBias : Math.floor(Math.random() * 4);
    let x = w * 0.5;
    let y = 70;
    const pad = 26;
    if (edge === 0) {
      x = Math.random() * w;
      y = -pad;
    } else if (edge === 1) {
      x = w + pad;
      y = Math.random() * h;
    } else if (edge === 2) {
      x = Math.random() * w;
      y = h + pad;
    } else {
      x = -pad;
      y = Math.random() * h;
    }

    const isBoss = kind === 'boss';
    const radius = isBoss ? 30 : kind === 'brute' ? 16 : kind === 'stalker' ? 12 : 10;
    const baseSpeed = isBoss ? 34 : kind === 'stalker' ? 76 : kind === 'brute' ? 42 : 58;

    return {
      id: Math.random().toString(36).slice(2),
      kind,
      x,
      y,
      vx: 0,
      vy: 0,
      radius,
      speed: baseSpeed + Math.min(20, wave * 2),
      angle: 0,
      legPhase: Math.random() * Math.PI * 2,
      hitFlash: 0,
      alive: true,
      isBoss,
    };
  }

  playReport(report, stateSnapshot = null) {
    this.resizeToContainer();
    this.report = report;
    this.mode = 'playing';
    this.simTime = 0;
    this.eventCursor = 0;

    this.playerMaxHp = report.playerStartHp;
    this.playerHp = report.playerStartHp;
    this.playerShield = report.playerStartShield;

    this.enemyMaxHp = report.enemy.maxHp;
    this.enemyHp = report.enemy.maxHp;
    this.enemyShield = report.enemy.initialShield;
    this.totalEnemyPool = Math.max(1, report.enemy.maxHp + report.enemy.initialShield);

    this.enemyBurn = 0;
    this.enemyShock = 0;
    this.enemyChill = 0;

    this.rig = {
      x: this.logicalW * 0.5,
      y: this.logicalH * 0.54,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      turretAngle: -Math.PI / 2,
      hitFlash: 0,
      recoil: 0,
      orbitPhase: 0,
    };

    const placed = stateSnapshot?.placedItems || [];
    this.equippedMeta = {
      hasDagger: placed.some((p) => p.itemId === 'plasma_dagger'),
      hasMedkit: placed.some((p) => p.itemId === 'nano_medkit'),
    };

    this.decalCtx.clearRect(0, 0, this.decalCanvas.width, this.decalCanvas.height);
    this.slashes = [];
    this.beams = [];
    this.bolts = [];
    this.particles = [];
    this.shards = [];
    this.floatingTexts = [];
    this.rings = [];
    this.shakeTime = 0;
    this.playerHurtPulse = 0;

    this.monsters = [];
    this.killCount = 0;
    const count = 14 + report.wave * 3;
    this.initialSwarmCount = count;

    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      const kind = roll > 0.8 ? 'brute' : roll > 0.45 ? 'stalker' : 'crawler';
      const m = this.spawnMonster(kind, report.wave, i % 4);
      // 首批异虫提前分布在视野边缘内侧，开战即刻接敌
      if (i < 8) {
        const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
        const dist = 145 + Math.random() * 60;
        m.x = Math.max(20, Math.min(this.logicalW - 20, this.rig.x + Math.cos(ang) * dist));
        m.y = Math.max(75, Math.min(this.logicalH - 75, this.rig.y + Math.sin(ang) * dist));
      }
      this.monsters.push(m);
    }

    if (report.enemy.isBoss) {
      const boss = this.spawnMonster('boss', report.wave, 0);
      boss.x = this.logicalW * 0.5;
      boss.y = 115;
      this.monsters.push(boss);
      this.initialSwarmCount += 1;
    }

    this.emitTelemetry();
  }

  emitTelemetry() {
    this.callbacks.onTelemetryTick?.({
      simTime: this.simTime,
      playerHp: this.playerHp,
      playerMaxHp: this.playerMaxHp,
      playerShield: this.playerShield,
      enemyHp: this.enemyHp,
      enemyMaxHp: this.enemyMaxHp,
      enemyShield: this.enemyShield,
      enemyBurn: this.enemyBurn,
      enemyShock: this.enemyShock,
      enemyChill: this.enemyChill,
      killCount: this.killCount,
      totalKills: this.initialSwarmCount,
    });
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  skipToEnd() {
    if (!this.report || this.mode !== 'playing') return;
    while (this.eventCursor < this.report.timeline.length) {
      this.consumeEvent(this.report.timeline[this.eventCursor], true);
      this.eventCursor++;
    }
    this.simTime = this.report.durationSec;
    this.finishPlayback();
  }

  finishPlayback() {
    if (this.mode === 'done') return;
    this.mode = 'done';
    if (this.report) {
      this.playerHp = this.report.playerEndHp;
      this.playerShield = this.report.playerEndShield;
      this.enemyHp = this.report.enemyEndHp;
      this.enemyShield = this.report.enemyEndShield;

      if (this.report.won) {
        for (const m of this.monsters) {
          if (m.alive) this.killMonster(m, '#38bdf8');
        }
        this.rings.push({
          x: this.rig.x,
          y: this.rig.y,
          r: 18,
          maxR: 260,
          color: '#38bdf8',
          life: 0.48,
          maxLife: 0.48,
        });
        sfx.playVictory();
      } else {
        sfx.playDefeat();
      }
      this.emitTelemetry();
      this.callbacks.onPlaybackComplete?.(this.report);
    }
  }

  stampDecal(x, y, color, radius, isScorch = false) {
    const dctx = this.decalCtx;
    dctx.save();
    dctx.globalAlpha = isScorch ? 0.38 : 0.34;
    dctx.fillStyle = isScorch ? '#02040a' : color;
    dctx.beginPath();
    dctx.arc(x, y, radius, 0, Math.PI * 2);
    dctx.fill();
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = radius * (0.7 + Math.random() * 0.9);
      dctx.beginPath();
      dctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, radius * 0.32, 0, Math.PI * 2);
      dctx.fill();
    }
    dctx.restore();
  }

  killMonster(m, sparkColor = '#a855f7') {
    if (!m.alive) return;
    m.alive = false;
    this.killCount += 1;
    const ichorCol = m.isBoss ? '#9f1239' : m.kind === 'brute' ? '#0f766e' : '#581c87';
    this.stampDecal(m.x, m.y, ichorCol, m.radius * 1.15);
    this.spawnSparks(m.x, m.y, sparkColor, m.isBoss ? 28 : 10);

    // 掉落生物晶核碎片飞向玩家
    const shardCount = m.isBoss ? 8 : 2;
    for (let i = 0; i < shardCount; i++) {
      this.shards.push({
        x: m.x + (Math.random() - 0.5) * 16,
        y: m.y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 70,
        vy: (Math.random() - 0.5) * 70,
        color: m.isBoss ? '#f59e0b' : '#38bdf8',
      });
    }
  }

  syncSwarmCasualties(sparkColor = '#38bdf8') {
    if (!this.report) return;
    const nonBoss = this.monsters.filter((m) => !m.isBoss);
    const boss = this.monsters.find((m) => m.isBoss);
    const remainRatio = Math.max(0, (this.enemyHp + this.enemyShield) / this.totalEnemyPool);
    const targetAliveNonBoss = Math.ceil(nonBoss.length * remainRatio);
    let currentAlive = nonBoss.filter((m) => m.alive).length;

    while (currentAlive > targetAliveNonBoss) {
      // 优先击杀离玩家最近的普通虫群
      let nearest = null;
      let minDist = Infinity;
      for (const m of nonBoss) {
        if (!m.alive) continue;
        const d = Math.hypot(m.x - this.rig.x, m.y - this.rig.y);
        if (d < minDist) {
          minDist = d;
          nearest = m;
        }
      }
      if (!nearest) break;
      this.killMonster(nearest, sparkColor);
      currentAlive--;
    }

    if (boss && boss.alive && this.enemyHp <= 0) {
      this.killMonster(boss, '#f59e0b');
    }
  }

  getNearestAliveMonsters(limit = 4) {
    return this.monsters
      .filter((m) => m.alive)
      .sort(
        (a, b) =>
          Math.hypot(a.x - this.rig.x, a.y - this.rig.y) -
          Math.hypot(b.x - this.rig.x, b.y - this.rig.y)
      )
      .slice(0, limit);
  }

  spawnSparks(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 50 + Math.random() * 170;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 1.8 + Math.random() * 2.4,
        color,
        life: 0.22 + Math.random() * 0.25,
        maxLife: 0.45,
      });
    }
  }

  consumeEvent(ev, silent = false) {
    this.playerHp = ev.playerHp;
    this.playerShield = ev.playerShield;
    this.enemyHp = ev.enemyHp;
    this.enemyShield = ev.enemyShield;
    this.enemyBurn = ev.enemyBurn ?? this.enemyBurn;
    this.enemyShock = ev.enemyShock ?? this.enemyShock;
    this.enemyChill = ev.enemyChill ?? this.enemyChill;

    if (silent) {
      this.syncSwarmCasualties('#38bdf8');
      return;
    }

    const targets = this.getNearestAliveMonsters(5);
    const primary = targets[0] || {
      x: this.rig.x + Math.cos(this.rig.turretAngle) * 120,
      y: this.rig.y + Math.sin(this.rig.turretAngle) * 120,
    };

    if (ev.type === 'weapon_hit') {
      const def = ITEM_CATALOG[ev.itemId];
      const color = def?.color || '#38bdf8';
      const aimAngle = Math.atan2(primary.y - this.rig.y, primary.x - this.rig.x);
      this.rig.turretAngle = aimAngle;
      this.rig.recoil = 1.0;

      if (ev.itemId === 'rail_rifle') {
        const endX = this.rig.x + Math.cos(aimAngle) * 520;
        const endY = this.rig.y + Math.sin(aimAngle) * 520;
        this.beams.push({
          x1: this.rig.x,
          y1: this.rig.y,
          x2: endX,
          y2: endY,
          color: '#818cf8',
          life: 0.26,
          maxLife: 0.26,
          width: ev.isCrit ? 12 : 7,
        });
        this.stampDecal(primary.x, primary.y, '#02040a', 14, true);
        this.spawnSparks(primary.x, primary.y, '#c7d2fe', ev.isCrit ? 22 : 12);
        this.shakeTime = Math.max(this.shakeTime, 0.16);
        this.shakeAmp = Math.max(this.shakeAmp, ev.isCrit ? 6 : 3.5);
      } else if (ev.itemId === 'arc_launcher') {
        const chainTargets = targets.length > 0 ? targets : [primary];
        const pts = [[this.rig.x, this.rig.y]];
        let prevX = this.rig.x;
        let prevY = this.rig.y;
        for (const t of chainTargets) {
          const midX = (prevX + t.x) * 0.5 + (Math.random() - 0.5) * 26;
          const midY = (prevY + t.y) * 0.5 + (Math.random() - 0.5) * 26;
          pts.push([midX, midY], [t.x, t.y]);
          if (t.hitFlash !== undefined) t.hitFlash = 0.18;
          this.spawnSparks(t.x, t.y, '#e879f9', 8);
          prevX = t.x;
          prevY = t.y;
        }
        this.bolts.push({ pts, color: '#c084fc', life: 0.24, maxLife: 0.24 });
      } else {
        // 等离子短匕大范围弧形斩击
        this.slashes.push({
          x: this.rig.x,
          y: this.rig.y,
          angle: aimAngle,
          radius: ev.isCrit ? 96 : 80,
          color,
          life: 0.2,
          maxLife: 0.2,
        });
        for (const t of targets.slice(0, 3)) {
          if (t.hitFlash !== undefined) t.hitFlash = 0.16;
          this.spawnSparks(t.x, t.y, color, 8);
        }
      }

      if (primary.hitFlash !== undefined) primary.hitFlash = 0.18;
      if (ev.isCrit) {
        this.shakeTime = 0.2;
        this.shakeAmp = 5.5;
      }

      this.floatingTexts.push({
        x: primary.x + (Math.random() * 20 - 10),
        y: primary.y - 16,
        text: ev.isCrit ? `CRIT ${ev.damage}` : `${ev.damage}`,
        color: ev.isCrit ? '#f59e0b' : '#f8fafc',
        vy: -48,
        life: 0.72,
        maxLife: 0.72,
        scale: ev.isCrit ? 1.25 : 0.95,
      });

      if (ev.vampHealed > 0) {
        this.floatingTexts.push({
          x: this.rig.x,
          y: this.rig.y - 24,
          text: `+${ev.vampHealed} HP`,
          color: '#4ade80',
          vy: -34,
          life: 0.65,
          maxLife: 0.65,
          scale: 0.85,
        });
      }

      this.syncSwarmCasualties(color);
      sfx.playHit(ev.isCrit);
      this.callbacks.onItemTrigger?.(ev.instanceId, color);
    } else if (ev.type === 'shield_gain') {
      this.rings.push({
        x: this.rig.x,
        y: this.rig.y,
        r: 14,
        maxR: 62,
        color: '#f59e0b',
        life: 0.4,
        maxLife: 0.4,
      });
      this.floatingTexts.push({
        x: this.rig.x,
        y: this.rig.y - 26,
        text: `SHD +${ev.shieldGained}`,
        color: '#fbbf24',
        vy: -36,
        life: 0.68,
        maxLife: 0.68,
        scale: 0.9,
      });
      sfx.playShield();
      this.callbacks.onItemTrigger?.(ev.instanceId, '#f59e0b');
    } else if (ev.type === 'gadget_heal') {
      this.rings.push({
        x: this.rig.x,
        y: this.rig.y,
        r: 12,
        maxR: 54,
        color: '#22c55e',
        life: 0.4,
        maxLife: 0.4,
      });
      const label = ev.healed > 0 ? `HP +${ev.healed}` : `SHD +${ev.shieldGained}`;
      this.floatingTexts.push({
        x: this.rig.x,
        y: this.rig.y - 26,
        text: label,
        color: '#4ade80',
        vy: -36,
        life: 0.68,
        maxLife: 0.68,
        scale: 0.9,
      });
      sfx.playHeal();
      this.callbacks.onItemTrigger?.(ev.instanceId, '#22c55e');
    } else if (ev.type === 'burn_tick') {
      this.spawnSparks(primary.x, primary.y, '#fb7185', 8);
      this.floatingTexts.push({
        x: primary.x,
        y: primary.y - 20,
        text: `BURN ${ev.damage}`,
        color: '#fb7185',
        vy: -34,
        life: 0.65,
        maxLife: 0.65,
        scale: 0.9,
      });
      this.syncSwarmCasualties('#fb7185');
    } else if (ev.type === 'enemy_attack') {
      this.rig.hitFlash = 0.2;
      this.playerHurtPulse = 0.28;
      this.shakeTime = 0.14;
      this.shakeAmp = 4;
      this.spawnSparks(this.rig.x, this.rig.y, '#f43f5e', 10);
      this.floatingTexts.push({
        x: this.rig.x + (Math.random() * 14 - 7),
        y: this.rig.y - 26,
        text: `-${ev.damage}`,
        color: '#fb7185',
        vy: -40,
        life: 0.7,
        maxLife: 0.7,
        scale: 1.0,
      });
    } else if (ev.type === 'overtime_storm') {
      this.shakeTime = 0.18;
      this.shakeAmp = 4.5;
      this.floatingTexts.push({
        x: this.logicalW * 0.5,
        y: this.logicalH * 0.28,
        text: `STORM -${ev.damage}`,
        color: '#f59e0b',
        vy: -24,
        life: 0.8,
        maxLife: 0.8,
        scale: 1.05,
      });
      this.syncSwarmCasualties('#f59e0b');
    }

    this.emitTelemetry();
  }

  update(dt) {
    this.ambientPhase += dt * 3.0;
    this.rig.orbitPhase += dt * 4.2;
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    if (this.playerHurtPulse > 0) this.playerHurtPulse = Math.max(0, this.playerHurtPulse - dt);
    if (this.rig.hitFlash > 0) this.rig.hitFlash = Math.max(0, this.rig.hitFlash - dt);
    if (this.rig.recoil > 0) this.rig.recoil = Math.max(0, this.rig.recoil - dt * 6);

    if (this.mode === 'playing' && this.report) {
      this.simTime += dt * this.speed;
      while (
        this.eventCursor < this.report.timeline.length &&
        this.report.timeline[this.eventCursor].time <= this.simTime + 1e-6
      ) {
        this.consumeEvent(this.report.timeline[this.eventCursor], false);
        this.eventCursor++;
      }
      if (this.eventCursor >= this.report.timeline.length && this.simTime >= this.report.durationSec) {
        this.finishPlayback();
      }
    }

    // 生存者机甲移动逻辑：手动牵引优先，否则自动风筝远离最近虫群
    const w = this.logicalW;
    const h = this.logicalH;
    let moveX = 0;
    let moveY = 0;

    if (this.pointerSteer.active) {
      const dx = this.pointerSteer.x - this.rig.x;
      const dy = this.pointerSteer.y - this.rig.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        moveX = dx / dist;
        moveY = dy / dist;
      }
    } else {
      const nearest = this.getNearestAliveMonsters(4);
      let repX = 0;
      let repY = 0;
      for (const m of nearest) {
        const dx = this.rig.x - m.x;
        const dy = this.rig.y - m.y;
        const d = Math.max(12, Math.hypot(dx, dy));
        if (d < 150) {
          repX += (dx / d) * (150 - d);
          repY += (dy / d) * (150 - d);
        }
      }
      // 柔和拉回场地中心避免卡墙角
      repX += (w * 0.5 - this.rig.x) * 0.45 + Math.cos(this.ambientPhase * 0.35) * 28;
      repY += (h * 0.53 - this.rig.y) * 0.45 + Math.sin(this.ambientPhase * 0.45) * 28;
      const mag = Math.hypot(repX, repY);
      if (mag > 1) {
        moveX = repX / mag;
        moveY = repY / mag;
      }
    }

    const rigSpeed = 105;
    this.rig.vx = moveX * rigSpeed;
    this.rig.vy = moveY * rigSpeed;
    this.rig.x = Math.max(36, Math.min(w - 36, this.rig.x + this.rig.vx * dt));
    this.rig.y = Math.max(96, Math.min(h - 108, this.rig.y + this.rig.vy * dt));
    if (Math.hypot(this.rig.vx, this.rig.vy) > 10) {
      this.rig.angle = Math.atan2(this.rig.vy, this.rig.vx);
    }

    // 虫群追击与彼此分离转向
    const chillFactor = 1 - Math.min(0.45, this.enemyChill * 0.15);
    for (let i = 0; i < this.monsters.length; i++) {
      const m = this.monsters[i];
      if (!m.alive) continue;
      if (m.hitFlash > 0) m.hitFlash = Math.max(0, m.hitFlash - dt);
      m.legPhase += dt * (m.kind === 'stalker' ? 14 : 10) * chillFactor;

      const dx = this.rig.x - m.x;
      const dy = this.rig.y - m.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      let sx = dx / dist;
      let sy = dy / dist;

      // 保持最小交战圈避免重合成一点
      if (dist < m.radius + 26) {
        sx *= -0.4;
        sy *= -0.4;
      }

      // 简单近邻分离力
      for (let j = i + 1; j < this.monsters.length; j++) {
        const o = this.monsters[j];
        if (!o.alive) continue;
        const ox = m.x - o.x;
        const oy = m.y - o.y;
        const od = Math.hypot(ox, oy);
        const minSep = m.radius + o.radius + 6;
        if (od > 0.1 && od < minSep) {
          const push = ((minSep - od) / minSep) * 1.4;
          const nx = (ox / od) * push;
          const ny = (oy / od) * push;
          sx += nx;
          sy += ny;
          o.x -= nx * 16 * dt;
          o.y -= ny * 16 * dt;
        }
      }

      const len = Math.max(0.01, Math.hypot(sx, sy));
      const spd = m.speed * chillFactor * Math.max(1, this.speed * 0.8);
      m.x += (sx / len) * spd * dt;
      m.y += (sy / len) * spd * dt;
      m.angle = Math.atan2(dy, dx);
    }

    // 生物晶核磁力吸取
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const sh = this.shards[i];
      const dx = this.rig.x - sh.x;
      const dy = this.rig.y - sh.y;
      const d = Math.hypot(dx, dy);
      if (d < 16) {
        this.shards.splice(i, 1);
        continue;
      }
      sh.vx += (dx / d) * 620 * dt;
      sh.vy += (dy / d) * 620 * dt;
      sh.vx *= 0.94;
      sh.vy *= 0.94;
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
    }

    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life -= dt;
      if (this.slashes[i].life <= 0) this.slashes.splice(i, 1);
    }
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life -= dt;
      if (this.beams[i].life <= 0) this.beams.splice(i, 1);
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      this.bolts[i].life -= dt;
      if (this.bolts[i].life <= 0) this.bolts.splice(i, 1);
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.vy *= 0.92;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const rg = this.rings[i];
      rg.life -= dt;
      rg.r = rg.maxR * (1 - rg.life / rg.maxLife);
      if (rg.life <= 0) this.rings.splice(i, 1);
    }
  }

  drawTerrain(w, h) {
    const ctx = this.ctx;
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, w, h);

    // 金属工业甲板网格与深渊裂隙纹路
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    const step = 36;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 甲板锚点十字准星
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    for (let x = step; x < w; x += step * 2) {
      for (let y = step; y < h; y += step * 2) {
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 3);
        ctx.lineTo(x, y + 3);
        ctx.stroke();
      }
    }

    // 持久地面污迹/焦痕贴花层
    ctx.drawImage(this.decalCanvas, 0, 0);

    // 以生存者为中心的战术探照灯与四周暗角压暗
    const light = ctx.createRadialGradient(this.rig.x, this.rig.y, 40, this.rig.x, this.rig.y, Math.max(w, h) * 0.65);
    light.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
    light.addColorStop(0.55, 'rgba(7, 9, 15, 0.0)');
    light.addColorStop(1, 'rgba(2, 4, 10, 0.72)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, w, h);
  }

  drawMonster(m) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);

    // 投影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-2, 4, m.radius * 1.05, m.radius * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();

    if (m.isBoss) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius + 9 + Math.sin(this.ambientPhase * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    const legWiggle = Math.sin(m.legPhase) * 4;
    const chitinFill =
      m.hitFlash > 0
        ? '#ffffff'
        : this.enemyChill > 0
          ? '#164e63'
          : m.isBoss
            ? '#3b0764'
            : m.kind === 'brute'
              ? '#1e293b'
              : m.kind === 'stalker'
                ? '#4c0519'
                : '#172554';
    const edgeColor =
      m.hitFlash > 0
        ? '#ffffff'
        : m.isBoss
          ? '#f43f5e'
          : m.kind === 'brute'
            ? '#2dd4bf'
            : m.kind === 'stalker'
              ? '#fb7185'
              : '#38bdf8';

    // 节肢步足
    ctx.strokeStyle = m.hitFlash > 0 ? '#ffffff' : '#0f172a';
    ctx.lineWidth = m.isBoss ? 3.5 : 2;
    for (const side of [-1, 1]) {
      for (const offset of [-0.5, 0, 0.5]) {
        const bx = offset * m.radius * 0.9;
        const by = side * m.radius * 0.65;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - legWiggle * offset, side * (m.radius * 1.45));
        ctx.stroke();
      }
    }

    // 钳螯前肢
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = m.isBoss ? 3.5 : 2.2;
    ctx.beginPath();
    ctx.moveTo(m.radius * 0.4, -m.radius * 0.5);
    ctx.lineTo(m.radius * 1.35, -m.radius * 0.35);
    ctx.moveTo(m.radius * 0.4, m.radius * 0.5);
    ctx.lineTo(m.radius * 1.35, m.radius * 0.35);
    ctx.stroke();

    // 甲壳躯体
    ctx.fillStyle = chitinFill;
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = m.isBoss ? 2.5 : 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, m.radius, m.radius * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 复眼与核心裂口
    if (m.hitFlash <= 0) {
      ctx.fillStyle = m.isBoss ? '#fde047' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(m.radius * 0.48, -m.radius * 0.24, m.isBoss ? 4 : 2.1, 0, Math.PI * 2);
      ctx.arc(m.radius * 0.48, m.radius * 0.24, m.isBoss ? 4 : 2.1, 0, Math.PI * 2);
      ctx.fill();

      if (m.isBoss) {
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(-4, 0, 9 + Math.sin(this.ambientPhase * 3) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawSurvivorRig() {
    const ctx = this.ctx;
    const { x, y, angle, turretAngle, hitFlash, recoil, orbitPhase } = this.rig;

    ctx.save();
    ctx.translate(x, y);

    // 护盾力场六边形
    if (this.playerShield > 0) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + orbitPhase * 0.12;
        const px = Math.cos(a) * 29;
        const py = Math.sin(a) * 29;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 接地阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 5, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 底盘与推进尾焰
    ctx.save();
    ctx.rotate(angle);
    if (Math.hypot(this.rig.vx, this.rig.vy) > 15) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.beginPath();
      ctx.moveTo(-14, -5);
      ctx.lineTo(-26 - Math.random() * 6, 0);
      ctx.lineTo(-14, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = hitFlash > 0 ? '#ffffff' : '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-15, -13, 30, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 旋转炮塔与主炮管
    ctx.save();
    ctx.rotate(turretAngle);
    const rx = -recoil * 5;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.6;
    ctx.fillRect(6 + rx, -3.5, 17, 7);
    ctx.strokeRect(6 + rx, -3.5, 17, 7);

    ctx.fillStyle = hitFlash > 0 ? '#ffffff' : '#0284c7';
    ctx.strokeStyle = '#050811';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(rx, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(rx + 2, -3, 5, 6);
    ctx.restore();

    // 环绕浮游刃与急救无人机
    if (this.equippedMeta.hasDagger) {
      const bx = Math.cos(orbitPhase) * 36;
      const by = Math.sin(orbitPhase) * 36;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(orbitPhase + Math.PI / 2);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (this.equippedMeta.hasMedkit) {
      const mx = Math.cos(-orbitPhase * 0.7) * 34;
      const my = Math.sin(-orbitPhase * 0.7) * 34;
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    const w = this.logicalW;
    const h = this.logicalH;
    ctx.clearRect(0, 0, w, h);

    ctx.save();
    if (this.shakeTime > 0) {
      ctx.translate(
        (Math.random() - 0.5) * this.shakeAmp * 2,
        (Math.random() - 0.5) * this.shakeAmp * 2
      );
    }

    this.drawTerrain(w, h);

    // 生物碎片
    for (const sh of this.shards) {
      ctx.fillStyle = sh.color;
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 扩散环
    for (const rg of this.rings) {
      ctx.strokeStyle = rg.color;
      ctx.globalAlpha = Math.max(0, rg.life / rg.maxLife);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 虫群绘制
    for (const m of this.monsters) {
      if (m.alive) this.drawMonster(m);
    }

    // 生存者装甲核心
    this.drawSurvivorRig();

    // 弧形等离子斩击
    for (const sl of this.slashes) {
      const a = Math.max(0, sl.life / sl.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = sl.color;
      ctx.lineWidth = 10 * a;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.radius, sl.angle - 1.05, sl.angle + 1.05);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3 * a;
      ctx.stroke();
      ctx.restore();
    }

    // 贯穿钨芯磁轨炮光束
    for (const bm of this.beams) {
      const a = Math.max(0, bm.life / bm.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = bm.color;
      ctx.lineWidth = bm.width * a;
      ctx.beginPath();
      ctx.moveTo(bm.x1, bm.y1);
      ctx.lineTo(bm.x2, bm.y2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, bm.width * 0.35 * a);
      ctx.stroke();
      ctx.restore();
    }

    // 高压闪电链
    for (const bl of this.bolts) {
      const a = Math.max(0, bl.life / bl.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = bl.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      bl.pts.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      ctx.strokeStyle = '#fdf4ff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }

    // 火花粒子
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 粗描边战术数值跳字（无 Emoji）
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, (ft.life / ft.maxLife) * 1.4));
      const pop = 1 + Math.max(0, (ft.life / ft.maxLife - 0.75) * 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(13 * ft.scale * pop)}px "JetBrains Mono", "Space Grotesk", monospace`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#050811';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 受击屏幕红框脉冲与 18s+ 加时风暴警戒
    if (this.playerHurtPulse > 0) {
      ctx.strokeStyle = `rgba(244, 63, 94, ${this.playerHurtPulse * 2.2})`;
      ctx.lineWidth = 14;
      ctx.strokeRect(0, 0, w, h);
    }
    if (this.mode === 'playing' && this.simTime >= OVERTIME_START_SEC) {
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.35 + Math.sin(this.ambientPhase * 4) * 0.2})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);
    }

    ctx.restore();
  }
}
