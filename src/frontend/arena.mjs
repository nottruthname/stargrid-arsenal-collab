/**
 * 《星匣：深渊防线》v4.0 商业成品级 2.5D 俯视角肉鸽虫潮战斗渲染引擎
 * - 100% 忠实同步权威 BattleReport.timeline（绝不篡改后端战斗判定）
 * - 加载异星工业甲板无缝地面贴图 + 动态体积探照灯锥 + 持久酸液焦痕贴花层
 * - 离屏高分辨率预渲染 2.5D 重装机甲与四类深渊异虫精灵 + 多关节步足/弹壳抛飞/音爆光环
 * - 100% 纯中文化战斗跳字与 Boss 铭牌（零英文、零 Emoji）
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
      muzzleFlash: 0,
      orbitPhase: 0,
    };

    this.pointerSteer = { active: false, x: 205, y: 380 };
    this.equippedMeta = { hasDagger: false, hasMedkit: false, hasCryo: false, hasRail: false };

    this.monsters = [];
    this.killCount = 0;
    this.initialSwarmCount = 18;

    this.slashes = [];
    this.beams = [];
    this.bolts = [];
    this.particles = [];
    this.casings = [];
    this.shards = [];
    this.floatingTexts = [];
    this.rings = [];

    this.shakeTime = 0;
    this.shakeAmp = 0;
    this.playerHurtPulse = 0;
    this.ambientPhase = 0;

    this.groundPattern = null;
    this.loadGroundTexture();
    this.sprites = this.buildSpriteAtlas();
    this.bindInput();
  }

  loadGroundTexture() {
    const img = new Image();
    img.onload = () => {
      try {
        const tile = document.createElement('canvas');
        tile.width = 256;
        tile.height = 256;
        const tctx = tile.getContext('2d');
        tctx.drawImage(img, 0, 0, 256, 256);
        this.groundPattern = this.ctx.createPattern(tile, 'repeat');
      } catch {
        this.groundPattern = null;
      }
    };
    img.src = './src/frontend/assets/battle_tile.jpg';
  }

  /**
   * 离屏预渲染 2.5D 高细节机甲与异虫壳体图集
   */
  buildSpriteAtlas() {
    const make = (size, drawFn) => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const g = c.getContext('2d');
      g.translate(size * 0.5, size * 0.5);
      drawFn(g, size * 0.5);
      return c;
    };

    const crawler = make(96, (g) => {
      // 后腹甲壳节
      for (let i = 2; i >= 0; i--) {
        const ox = -i * 7 + 4;
        const rx = 14 - i * 2.2;
        const ry = 13 - i * 1.8;
        const grad = g.createRadialGradient(ox - 2, -3, 2, ox, 0, rx);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.28, '#1e3a8a');
        grad.addColorStop(0.85, '#0f172a');
        grad.addColorStop(1, '#040812');
        g.fillStyle = grad;
        g.strokeStyle = '#38bdf8';
        g.lineWidth = 1.4;
        g.beginPath();
        g.ellipse(ox, 0, rx, ry, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      // 脊线装甲片
      g.strokeStyle = 'rgba(186,230,253,0.45)';
      g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(-14, 0);
      g.lineTo(12, 0);
      g.stroke();
      // 头部四眼
      g.fillStyle = '#fb7185';
      for (const [ex, ey, r] of [
        [10, -4.5, 2.2],
        [10, 4.5, 2.2],
        [13, -2.5, 1.4],
        [13, 2.5, 1.4],
      ]) {
        g.beginPath();
        g.arc(ex, ey, r, 0, Math.PI * 2);
        g.fill();
      }
    });

    const stalker = make(108, (g) => {
      // 狭长流线掠食躯干
      const bodyGrad = g.createLinearGradient(-22, 0, 22, 0);
      bodyGrad.addColorStop(0, '#1e0610');
      bodyGrad.addColorStop(0.55, '#881337');
      bodyGrad.addColorStop(1, '#4c0519');
      g.fillStyle = bodyGrad;
      g.strokeStyle = '#fb7185';
      g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(22, 0);
      g.quadraticCurveTo(8, -15, -18, -8);
      g.lineTo(-26, 0);
      g.lineTo(-18, 8);
      g.quadraticCurveTo(8, 15, 22, 0);
      g.closePath();
      g.fill();
      g.stroke();
      // 背部红曜骨刺纹
      g.strokeStyle = '#fda4af';
      g.lineWidth = 1.5;
      for (let x = -12; x <= 6; x += 6) {
        g.beginPath();
        g.moveTo(x - 3, -5);
        g.lineTo(x + 2, 0);
        g.lineTo(x - 3, 5);
        g.stroke();
      }
      // 凶戾复眼
      g.fillStyle = '#fde047';
      g.beginPath();
      g.arc(13, -4.5, 2.3, 0, Math.PI * 2);
      g.arc(13, 4.5, 2.3, 0, Math.PI * 2);
      g.fill();
    });

    const brute = make(124, (g) => {
      // 尾部翠绿毒酸囊泡
      for (const [bx, by, br] of [
        [-18, -9, 7.5],
        [-18, 9, 7.5],
        [-22, 0, 8.5],
      ]) {
        const sac = g.createRadialGradient(bx - 1, by - 1, 1, bx, by, br);
        sac.addColorStop(0, '#bbf7d0');
        sac.addColorStop(0.45, '#10b981');
        sac.addColorStop(1, '#064e3b');
        g.fillStyle = sac;
        g.strokeStyle = '#34d399';
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(bx, by, br, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      // 重型黑曜青甲壳
      const shellGrad = g.createRadialGradient(4, -5, 4, 0, 0, 26);
      shellGrad.addColorStop(0, '#334155');
      shellGrad.addColorStop(0.65, '#1e293b');
      shellGrad.addColorStop(1, '#070b14');
      g.fillStyle = shellGrad;
      g.strokeStyle = '#2dd4bf';
      g.lineWidth = 2.2;
      g.beginPath();
      g.ellipse(2, 0, 23, 21, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      // 前方分叉撞角
      g.fillStyle = '#0f172a';
      g.strokeStyle = '#5eead4';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(18, -7);
      g.lineTo(34, -10);
      g.lineTo(25, 0);
      g.lineTo(34, 10);
      g.lineTo(18, 7);
      g.closePath();
      g.fill();
      g.stroke();
    });

    const boss = make(192, (g) => {
      // 多节利维坦虫皇厚重外壳
      const outer = g.createRadialGradient(6, -6, 10, 0, 0, 56);
      outer.addColorStop(0, '#581c87');
      outer.addColorStop(0.55, '#2e1065');
      outer.addColorStop(1, '#090314');
      g.fillStyle = outer;
      g.strokeStyle = '#f43f5e';
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(0, 0, 52, 42, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      // 左右对称翼甲片
      g.fillStyle = '#1e1b4b';
      g.strokeStyle = '#fb7185';
      g.lineWidth = 2;
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(-26, s * 14);
        g.lineTo(16, s * 42);
        g.lineTo(32, s * 24);
        g.lineTo(4, s * 14);
        g.closePath();
        g.fill();
        g.stroke();
      }
      // 四对金红复眼
      g.fillStyle = '#fde047';
      for (const s of [-1, 1]) {
        g.beginPath();
        g.arc(33, s * 12, 4.2, 0, Math.PI * 2);
        g.arc(39, s * 6, 3.0, 0, Math.PI * 2);
        g.fill();
      }
    });

    const rigChassis = make(120, (g) => {
      // 双肩重型反应护肩 + 底盘履带轮廓
      g.fillStyle = '#090d16';
      g.strokeStyle = '#1e293b';
      g.lineWidth = 2;
      g.beginPath();
      g.roundRect(-24, -22, 48, 12, 3);
      g.roundRect(-24, 10, 48, 12, 3);
      g.fill();
      g.stroke();

      const body = g.createLinearGradient(-18, -18, 20, 18);
      body.addColorStop(0, '#475569');
      body.addColorStop(0.5, '#1e293b');
      body.addColorStop(1, '#0f172a');
      g.fillStyle = body;
      g.strokeStyle = '#38bdf8';
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(-18, -16);
      g.lineTo(14, -18);
      g.lineTo(22, -10);
      g.lineTo(22, 10);
      g.lineTo(14, 18);
      g.lineTo(-18, 16);
      g.closePath();
      g.fill();
      g.stroke();

      // 护肩琥珀斜纹警示条
      g.fillStyle = '#f59e0b';
      g.fillRect(-14, -15, 7, 4);
      g.fillRect(-14, 11, 7, 4);
      g.fillStyle = '#0f172a';
      g.fillRect(-20, -8, 6, 16);
    });

    const rigTurret = make(120, (g) => {
      // 双联磁轨/脉冲重炮管
      const barrel = g.createLinearGradient(0, -10, 32, 10);
      barrel.addColorStop(0, '#334155');
      barrel.addColorStop(1, '#94a3b8');
      g.fillStyle = barrel;
      g.strokeStyle = '#040811';
      g.lineWidth = 1.8;
      g.fillRect(6, -9, 25, 6);
      g.strokeRect(6, -9, 25, 6);
      g.fillRect(6, 3, 25, 6);
      g.strokeRect(6, 3, 25, 6);

      // 中央发光能源槽
      g.fillStyle = '#38bdf8';
      g.fillRect(10, -7, 16, 2);
      g.fillRect(10, 5, 16, 2);

      // 主炮塔球形座舱
      const dome = g.createRadialGradient(-3, -3, 2, 0, 0, 15);
      dome.addColorStop(0, '#38bdf8');
      dome.addColorStop(0.45, '#0284c7');
      dome.addColorStop(1, '#0c4a6e');
      g.fillStyle = dome;
      g.strokeStyle = '#040811';
      g.lineWidth = 2.4;
      g.beginPath();
      g.arc(0, 0, 13.5, 0, Math.PI * 2);
      g.fill();
      g.stroke();

      // 炽亮面罩观测窗
      g.fillStyle = '#e0f2fe';
      g.fillRect(3, -5, 7, 10);
    });

    return { crawler, stalker, brute, boss, rigChassis, rigTurret };
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
    const pad = 28;
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
    const radius = isBoss ? 34 : kind === 'brute' ? 18 : kind === 'stalker' ? 14 : 11;
    const baseSpeed = isBoss ? 32 : kind === 'stalker' ? 78 : kind === 'brute' ? 40 : 58;

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
      muzzleFlash: 0,
      orbitPhase: 0,
    };

    const placed = stateSnapshot?.placedItems || [];
    this.equippedMeta = {
      hasDagger: placed.some((p) => p.itemId === 'plasma_dagger'),
      hasMedkit: placed.some((p) => p.itemId === 'nano_medkit'),
      hasCryo: placed.some((p) => p.itemId === 'cryo_plate'),
      hasRail: placed.some((p) => p.itemId === 'rail_rifle'),
    };

    this.decalCtx.clearRect(0, 0, this.decalCanvas.width, this.decalCanvas.height);
    this.slashes = [];
    this.beams = [];
    this.bolts = [];
    this.particles = [];
    this.casings = [];
    this.shards = [];
    this.floatingTexts = [];
    this.rings = [];
    this.shakeTime = 0;
    this.playerHurtPulse = 0;

    this.monsters = [];
    this.killCount = 0;
    const count = 15 + report.wave * 3;
    this.initialSwarmCount = count;

    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      const kind = roll > 0.78 ? 'brute' : roll > 0.42 ? 'stalker' : 'crawler';
      const m = this.spawnMonster(kind, report.wave, i % 4);
      if (i < 9) {
        const ang = (Math.PI * 2 * i) / 9 + Math.random() * 0.28;
        const dist = 135 + Math.random() * 65;
        m.x = Math.max(22, Math.min(this.logicalW - 22, this.rig.x + Math.cos(ang) * dist));
        m.y = Math.max(85, Math.min(this.logicalH - 85, this.rig.y + Math.sin(ang) * dist));
      }
      this.monsters.push(m);
    }

    if (report.enemy.isBoss) {
      const boss = this.spawnMonster('boss', report.wave, 0);
      boss.x = this.logicalW * 0.5;
      boss.y = 128;
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
          maxR: 280,
          color: '#38bdf8',
          life: 0.5,
          maxLife: 0.5,
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
    dctx.globalAlpha = isScorch ? 0.48 : 0.36;
    dctx.fillStyle = isScorch ? '#03050a' : color;
    dctx.beginPath();
    dctx.arc(x, y, radius, 0, Math.PI * 2);
    dctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = radius * (0.65 + Math.random() * 0.95);
      dctx.beginPath();
      dctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, radius * 0.3, 0, Math.PI * 2);
      dctx.fill();
    }
    dctx.restore();
  }

  killMonster(m, sparkColor = '#a855f7') {
    if (!m.alive) return;
    m.alive = false;
    this.killCount += 1;
    const ichorCol = m.isBoss ? '#9f1239' : m.kind === 'brute' ? '#059669' : m.kind === 'stalker' ? '#881337' : '#4c1d95';
    this.stampDecal(m.x, m.y, ichorCol, m.radius * 1.18);
    this.spawnSparks(m.x, m.y, sparkColor, m.isBoss ? 34 : 12);

    const shardCount = m.isBoss ? 10 : 2;
    for (let i = 0; i < shardCount; i++) {
      this.shards.push({
        x: m.x + (Math.random() - 0.5) * 18,
        y: m.y + (Math.random() - 0.5) * 18,
        vx: (Math.random() - 0.5) * 85,
        vy: (Math.random() - 0.5) * 85,
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

  getNearestAliveMonsters(limit = 5) {
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
      const spd = 55 + Math.random() * 190;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 1.8 + Math.random() * 2.6,
        color,
        life: 0.24 + Math.random() * 0.28,
        maxLife: 0.5,
      });
    }
  }

  spawnBrassCasings(angle, count = 2) {
    const ejectAng = angle + Math.PI * 0.55;
    for (let i = 0; i < count; i++) {
      const spd = 48 + Math.random() * 55;
      this.casings.push({
        x: this.rig.x + Math.cos(ejectAng) * 8,
        y: this.rig.y + Math.sin(ejectAng) * 8,
        vx: Math.cos(ejectAng + (Math.random() - 0.5) * 0.6) * spd,
        vy: Math.sin(ejectAng + (Math.random() - 0.5) * 0.6) * spd - 20,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 16,
        life: 0.55,
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
      this.rig.muzzleFlash = 0.14;
      this.spawnBrassCasings(aimAngle, ev.itemId === 'rail_rifle' ? 2 : 1);

      if (ev.itemId === 'rail_rifle') {
        const endX = this.rig.x + Math.cos(aimAngle) * 560;
        const endY = this.rig.y + Math.sin(aimAngle) * 560;
        this.beams.push({
          x1: this.rig.x + Math.cos(aimAngle) * 26,
          y1: this.rig.y + Math.sin(aimAngle) * 26,
          x2: endX,
          y2: endY,
          color: '#818cf8',
          life: 0.28,
          maxLife: 0.28,
          width: ev.isCrit ? 14 : 8,
        });
        // 枪口激波环
        this.rings.push({
          x: this.rig.x + Math.cos(aimAngle) * 28,
          y: this.rig.y + Math.sin(aimAngle) * 28,
          r: 6,
          maxR: 42,
          color: '#a5b4fc',
          life: 0.24,
          maxLife: 0.24,
        });
        this.stampDecal(primary.x, primary.y, '#03050a', 16, true);
        this.spawnSparks(primary.x, primary.y, '#e0e7ff', ev.isCrit ? 24 : 14);
        this.shakeTime = Math.max(this.shakeTime, 0.18);
        this.shakeAmp = Math.max(this.shakeAmp, ev.isCrit ? 6.5 : 4);
      } else if (ev.itemId === 'arc_launcher') {
        const chainTargets = targets.length > 0 ? targets : [primary];
        const pts = [[this.rig.x + Math.cos(aimAngle) * 18, this.rig.y + Math.sin(aimAngle) * 18]];
        let prevX = pts[0][0];
        let prevY = pts[0][1];
        for (const t of chainTargets) {
          const midX = (prevX + t.x) * 0.5 + (Math.random() - 0.5) * 30;
          const midY = (prevY + t.y) * 0.5 + (Math.random() - 0.5) * 30;
          pts.push([midX, midY], [t.x, t.y]);
          if (t.hitFlash !== undefined) t.hitFlash = 0.2;
          this.rings.push({ x: t.x, y: t.y, r: 4, maxR: 26, color: '#e879f9', life: 0.2, maxLife: 0.2 });
          this.spawnSparks(t.x, t.y, '#f0abfc', 9);
          prevX = t.x;
          prevY = t.y;
        }
        this.bolts.push({ pts, color: '#c084fc', life: 0.26, maxLife: 0.26 });
      } else {
        this.slashes.push({
          x: this.rig.x,
          y: this.rig.y,
          angle: aimAngle,
          radius: ev.isCrit ? 102 : 86,
          color,
          life: 0.22,
          maxLife: 0.22,
        });
        for (const t of targets.slice(0, 3)) {
          if (t.hitFlash !== undefined) t.hitFlash = 0.18;
          this.spawnSparks(t.x, t.y, color, 9);
        }
      }

      if (primary.hitFlash !== undefined) primary.hitFlash = 0.2;
      if (ev.isCrit) {
        this.shakeTime = 0.2;
        this.shakeAmp = 5.5;
      }

      this.floatingTexts.push({
        x: primary.x + (Math.random() * 20 - 10),
        y: primary.y - 18,
        text: ev.isCrit ? `暴击 ${ev.damage}` : `${ev.damage}`,
        color: ev.isCrit ? '#fbbf24' : '#f8fafc',
        vy: -50,
        life: 0.74,
        maxLife: 0.74,
        scale: ev.isCrit ? 1.24 : 0.96,
      });

      if (ev.vampHealed > 0) {
        this.floatingTexts.push({
          x: this.rig.x,
          y: this.rig.y - 28,
          text: `生命 +${ev.vampHealed}`,
          color: '#4ade80',
          vy: -36,
          life: 0.68,
          maxLife: 0.68,
          scale: 0.9,
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
        maxR: 68,
        color: '#f59e0b',
        life: 0.42,
        maxLife: 0.42,
      });
      this.floatingTexts.push({
        x: this.rig.x,
        y: this.rig.y - 28,
        text: `护盾 +${ev.shieldGained}`,
        color: '#fbbf24',
        vy: -36,
        life: 0.68,
        maxLife: 0.68,
        scale: 0.92,
      });
      sfx.playShield();
      this.callbacks.onItemTrigger?.(ev.instanceId, '#f59e0b');
    } else if (ev.type === 'gadget_heal') {
      this.rings.push({
        x: this.rig.x,
        y: this.rig.y,
        r: 12,
        maxR: 58,
        color: '#22c55e',
        life: 0.42,
        maxLife: 0.42,
      });
      const label = ev.healed > 0 ? `恢复 +${ev.healed}` : `护盾 +${ev.shieldGained}`;
      this.floatingTexts.push({
        x: this.rig.x,
        y: this.rig.y - 28,
        text: label,
        color: '#4ade80',
        vy: -36,
        life: 0.68,
        maxLife: 0.68,
        scale: 0.92,
      });
      sfx.playHeal();
      this.callbacks.onItemTrigger?.(ev.instanceId, '#22c55e');
    } else if (ev.type === 'burn_tick') {
      this.spawnSparks(primary.x, primary.y, '#fb7185', 9);
      this.floatingTexts.push({
        x: primary.x,
        y: primary.y - 20,
        text: `灼烧 ${ev.damage}`,
        color: '#fb7185',
        vy: -34,
        life: 0.66,
        maxLife: 0.66,
        scale: 0.9,
      });
      this.syncSwarmCasualties('#fb7185');
    } else if (ev.type === 'enemy_attack') {
      this.rig.hitFlash = 0.22;
      this.playerHurtPulse = 0.3;
      this.shakeTime = 0.16;
      this.shakeAmp = 4.5;
      this.spawnSparks(this.rig.x, this.rig.y, '#f43f5e', 12);
      this.floatingTexts.push({
        x: this.rig.x + (Math.random() * 14 - 7),
        y: this.rig.y - 30,
        text: `-${ev.damage}`,
        color: '#fb7185',
        vy: -42,
        life: 0.7,
        maxLife: 0.7,
        scale: 1.02,
      });
    } else if (ev.type === 'overtime_storm') {
      this.shakeTime = 0.2;
      this.shakeAmp = 5;
      this.floatingTexts.push({
        x: this.logicalW * 0.5,
        y: this.logicalH * 0.28,
        text: `星渊风暴 -${ev.damage}`,
        color: '#f59e0b',
        vy: -24,
        life: 0.85,
        maxLife: 0.85,
        scale: 1.08,
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
    if (this.rig.muzzleFlash > 0) this.rig.muzzleFlash = Math.max(0, this.rig.muzzleFlash - dt);
    if (this.rig.recoil > 0) this.rig.recoil = Math.max(0, this.rig.recoil - dt * 6.5);

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
        if (d < 155) {
          repX += (dx / d) * (155 - d);
          repY += (dy / d) * (155 - d);
        }
      }
      repX += (w * 0.5 - this.rig.x) * 0.45 + Math.cos(this.ambientPhase * 0.35) * 30;
      repY += (h * 0.53 - this.rig.y) * 0.45 + Math.sin(this.ambientPhase * 0.45) * 30;
      const mag = Math.hypot(repX, repY);
      if (mag > 1) {
        moveX = repX / mag;
        moveY = repY / mag;
      }
    }

    const rigSpeed = 108;
    this.rig.vx = moveX * rigSpeed;
    this.rig.vy = moveY * rigSpeed;
    this.rig.x = Math.max(38, Math.min(w - 38, this.rig.x + this.rig.vx * dt));
    this.rig.y = Math.max(105, Math.min(h - 115, this.rig.y + this.rig.vy * dt));
    if (Math.hypot(this.rig.vx, this.rig.vy) > 10) {
      this.rig.angle = Math.atan2(this.rig.vy, this.rig.vx);
    }

    const chillFactor = 1 - Math.min(0.45, this.enemyChill * 0.15);
    for (let i = 0; i < this.monsters.length; i++) {
      const m = this.monsters[i];
      if (!m.alive) continue;
      if (m.hitFlash > 0) m.hitFlash = Math.max(0, m.hitFlash - dt);
      m.legPhase += dt * (m.kind === 'stalker' ? 15 : 10.5) * chillFactor;

      const dx = this.rig.x - m.x;
      const dy = this.rig.y - m.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      let sx = dx / dist;
      let sy = dy / dist;

      if (dist < m.radius + 28) {
        sx *= -0.45;
        sy *= -0.45;
      }

      for (let j = i + 1; j < this.monsters.length; j++) {
        const o = this.monsters[j];
        if (!o.alive) continue;
        const ox = m.x - o.x;
        const oy = m.y - o.y;
        const od = Math.hypot(ox, oy);
        const minSep = m.radius + o.radius + 7;
        if (od > 0.1 && od < minSep) {
          const push = ((minSep - od) / minSep) * 1.45;
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

    for (let i = this.casings.length - 1; i >= 0; i--) {
      const cs = this.casings[i];
      cs.x += cs.vx * dt;
      cs.y += cs.vy * dt;
      cs.vy += 120 * dt;
      cs.rot += cs.vrot * dt;
      cs.life -= dt;
      if (cs.life <= 0) this.casings.splice(i, 1);
    }

    for (let i = this.shards.length - 1; i >= 0; i--) {
      const sh = this.shards[i];
      const dx = this.rig.x - sh.x;
      const dy = this.rig.y - sh.y;
      const d = Math.hypot(dx, dy);
      if (d < 16) {
        this.shards.splice(i, 1);
        continue;
      }
      sh.vx += (dx / d) * 650 * dt;
      sh.vy += (dy / d) * 650 * dt;
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
    if (this.groundPattern) {
      ctx.fillStyle = this.groundPattern;
      ctx.fillRect(0, 0, w, h);
      // 微弱战术覆膜提纯暗部
      ctx.fillStyle = 'rgba(6, 9, 16, 0.25)';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // 持久战场酸液与弹坑焦痕贴花层
    ctx.drawImage(this.decalCanvas, 0, 0);

    // 随炮塔转向的体积感双层探照灯光锥
    ctx.save();
    ctx.translate(this.rig.x, this.rig.y);
    ctx.rotate(this.rig.turretAngle);
    const beamGrad = ctx.createRadialGradient(0, 0, 14, 0, 0, 290);
    beamGrad.addColorStop(0, 'rgba(125, 211, 252, 0.22)');
    beamGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.08)');
    beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 290, -0.44, 0.44);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 四周深渊压暗与顶部/底部信息带衬底暗角
    const vignette = ctx.createRadialGradient(
      this.rig.x,
      this.rig.y,
      60,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.72
    );
    vignette.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
    vignette.addColorStop(0.55, 'rgba(4, 6, 12, 0.15)');
    vignette.addColorStop(1, 'rgba(2, 4, 9, 0.8)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  drawMonster(m) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(m.x, m.y);

    // Boss 脚底威胁警戒圈
    if (m.isBoss) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, m.radius + 13 + Math.sin(this.ambientPhase * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.rotate(m.angle);

    // 接地立体投影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    ctx.beginPath();
    ctx.ellipse(-2, 5, m.radius * 1.12, m.radius * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();

    // 动态双节肢步足
    const swing = Math.sin(m.legPhase) * (m.isBoss ? 8 : 5);
    ctx.strokeStyle =
      m.hitFlash > 0
        ? '#ffffff'
        : m.kind === 'stalker'
          ? '#fb7185'
          : m.kind === 'brute'
            ? '#2dd4bf'
            : '#1e293b';
    ctx.lineWidth = m.isBoss ? 3.8 : m.kind === 'brute' ? 2.8 : 2;
    const legOffsets = m.isBoss ? [-0.65, -0.22, 0.22, 0.65] : [-0.48, 0, 0.48];
    for (const side of [-1, 1]) {
      legOffsets.forEach((off, idx) => {
        const bx = off * m.radius * 0.85;
        const by = side * m.radius * 0.6;
        const step = idx % 2 === 0 ? swing : -swing;
        const kneeX = bx + step * 0.5;
        const kneeY = side * m.radius * 1.15;
        const footX = bx - step;
        const footY = side * m.radius * 1.62;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();
      });
    }

    // 镰爪 / 巨钳前肢挥舞动画
    if (m.kind === 'stalker' || m.isBoss) {
      const pinch = Math.sin(m.legPhase * 0.65) * 0.18;
      ctx.strokeStyle = m.hitFlash > 0 ? '#ffffff' : m.isBoss ? '#fda4af' : '#e2e8f0';
      ctx.lineWidth = m.isBoss ? 4.2 : 2.6;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.38, s * m.radius * 0.55);
        ctx.quadraticCurveTo(
          m.radius * 1.15,
          s * m.radius * (0.95 - pinch),
          m.radius * 1.48,
          s * m.radius * (0.28 - pinch)
        );
        ctx.stroke();
      }
    }

    // 绘制预渲染 2.5D 高细节甲壳精灵
    if (m.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, m.radius, m.radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const spr = this.sprites[m.kind] || this.sprites.crawler;
      const drawSize = m.isBoss ? 96 : m.kind === 'brute' ? 56 : m.kind === 'stalker' ? 46 : 38;
      ctx.drawImage(spr, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);

      if (m.isBoss) {
        ctx.fillStyle = 'rgba(251, 113, 133, 0.9)';
        ctx.beginPath();
        ctx.arc(-8, 0, 8 + Math.sin(this.ambientPhase * 3.5) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (this.enemyChill > 0) {
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.72)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * 0.92, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Boss 专属头顶纯中文铭牌与实时血条
    if (m.isBoss) {
      const barW = 86;
      const pct = Math.max(0, Math.min(1, this.enemyHp / Math.max(1, this.enemyMaxHp)));
      ctx.fillStyle = 'rgba(4, 7, 13, 0.88)';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.4;
      ctx.fillRect(-barW * 0.5, -m.radius - 22, barW, 8);
      ctx.strokeRect(-barW * 0.5, -m.radius - 22, barW, 8);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-barW * 0.5 + 1, -m.radius - 21, (barW - 2) * pct, 6);
      ctx.font = '900 10px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fda4af';
      ctx.fillText('深渊首领', 0, -m.radius - 26);
    }

    ctx.restore();
  }

  drawSurvivorRig() {
    const ctx = this.ctx;
    const { x, y, angle, turretAngle, hitFlash, recoil, muzzleFlash, orbitPhase } = this.rig;

    ctx.save();
    ctx.translate(x, y);

    // 六边形蜂窝护盾力场
    if (this.playerShield > 0) {
      const shdGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, 34);
      shdGrad.addColorStop(0, 'rgba(245, 158, 11, 0.02)');
      shdGrad.addColorStop(0.8, 'rgba(245, 158, 11, 0.16)');
      shdGrad.addColorStop(1, 'rgba(251, 191, 36, 0.45)');
      ctx.fillStyle = shdGrad;
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + orbitPhase * 0.15;
        const px = Math.cos(a) * 33;
        const py = Math.sin(a) * 33;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 极寒霜环光晕
    if (this.equippedMeta.hasCryo) {
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.28)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 44, -orbitPhase * 0.2, -orbitPhase * 0.2 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 接地重装投影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 22, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // 机甲底盘与双联推进器尾焰
    ctx.save();
    ctx.rotate(angle);
    if (Math.hypot(this.rig.vx, this.rig.vy) > 12) {
      const fLen = 14 + Math.random() * 8;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      for (const fy of [-7, 7]) {
        ctx.beginPath();
        ctx.moveTo(-17, fy - 4);
        ctx.lineTo(-17 - fLen, fy);
        ctx.lineTo(-17, fy + 4);
        ctx.closePath();
        ctx.fill();
      }
    }
    if (hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-19, -18, 38, 36);
    } else {
      ctx.drawImage(this.sprites.rigChassis, -29, -29, 58, 58);
    }
    ctx.restore();

    // 独立旋转炮塔 + 枪口火光
    ctx.save();
    ctx.rotate(turretAngle);
    const rx = -recoil * 5.5;
    if (hitFlash <= 0) {
      ctx.drawImage(this.sprites.rigTurret, rx - 30, -30, 60, 60);
    }
    if (muzzleFlash > 0) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(31 + rx, -7);
      ctx.lineTo(48 + rx, 0);
      ctx.lineTo(31 + rx, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(32 + rx, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 环绕浮游光刃与纳米急救无人机
    if (this.equippedMeta.hasDagger) {
      const bx = Math.cos(orbitPhase) * 39;
      const by = Math.sin(orbitPhase) * 39;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(orbitPhase + Math.PI / 2);
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -4.5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (this.equippedMeta.hasMedkit) {
      const mx = Math.cos(-orbitPhase * 0.72) * 36;
      const my = Math.sin(-orbitPhase * 0.72) * 36;
      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(mx, my, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ecfdf5';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(mx - 2.6, my);
      ctx.lineTo(mx + 2.6, my);
      ctx.moveTo(mx, my - 2.6);
      ctx.lineTo(mx, my + 2.6);
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

    // 弹壳抛飞粒子
    for (const cs of this.casings) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, cs.life * 2);
      ctx.translate(cs.x, cs.y);
      ctx.rotate(cs.rot);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2.5, -1, 5, 2);
      ctx.restore();
    }

    // 生物晶核磁吸碎片
    for (const sh of this.shards) {
      ctx.fillStyle = sh.color;
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 扩散能量环
    for (const rg of this.rings) {
      ctx.strokeStyle = rg.color;
      ctx.globalAlpha = Math.max(0, rg.life / rg.maxLife);
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 深渊异虫群
    for (const m of this.monsters) {
      if (m.alive) this.drawMonster(m);
    }

    // 重装机甲核心
    this.drawSurvivorRig();

    // 等离子弧形斩击双层刃光
    for (const sl of this.slashes) {
      const a = Math.max(0, sl.life / sl.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = sl.color;
      ctx.lineWidth = 14 * a;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.radius, sl.angle - 1.08, sl.angle + 1.08);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.8 * a;
      ctx.stroke();
      ctx.restore();
    }

    // 贯穿磁轨狙击束
    for (const bm of this.beams) {
      const a = Math.max(0, bm.life / bm.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = bm.color;
      ctx.lineWidth = bm.width * 1.4 * a;
      ctx.beginPath();
      ctx.moveTo(bm.x1, bm.y1);
      ctx.lineTo(bm.x2, bm.y2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.8, bm.width * 0.38 * a);
      ctx.stroke();
      ctx.restore();
    }

    // 高压闪电链
    for (const bl of this.bolts) {
      const a = Math.max(0, bl.life / bl.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = bl.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      bl.pts.forEach(([px, py], idx) => (idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      ctx.stroke();
      ctx.strokeStyle = '#fdf4ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // 溅射火花粒子
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 纯中文粗描边战斗跳字
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, Math.min(1, (ft.life / ft.maxLife) * 1.45));
      const pop = 1 + Math.max(0, (ft.life / ft.maxLife - 0.72) * 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(13.5 * ft.scale * pop)}px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.8;
      ctx.strokeStyle = '#04070d';
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 受击屏幕红框脉冲与 18秒+ 星渊风暴警戒
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
