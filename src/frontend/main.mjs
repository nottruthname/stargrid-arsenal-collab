/**
 * 《星匣：深渊防线》v3.0 战术工业 UI · 物理拖拽碰撞 · 全屏肉鸽虫潮主控制器
 * - 零 Emoji：全部界面使用锋利矢量 SVG 与战术字体
 * - 1:1 实寸多格拖拽幽灵 + 速度倾角物理 + 右键/滚轮/R 空中旋转 + 碰撞震颤回弹
 * - 点击出击后整备界面缩小淡出并彻底隐藏，切换 100% 全屏深渊虫潮战斗剧场
 */

import {
  CATEGORY_META,
  GRID_COLS,
  GRID_ROWS,
  ITEM_CATALOG,
  ITEM_IDS,
  MAX_STASH_SLOTS,
  MAX_WAVES,
  RARITY_META,
  RELIC_CATALOG,
  RELIC_IDS,
  REQUIRED_ENGINE_EXPORTS,
  WAVE_CONFIGS,
} from '../../shared/protocol.mjs';
import * as Engine from '../backend/engine.mjs';
import {
  getItemSvg,
  getMiniShapeSvg,
  getPlacedItemVisualHtml,
  getRelicSvg,
  getShapeLayout,
  renderStars,
  uiIcon,
} from './art.mjs';
import { BattleArena } from './arena.mjs';
import { sfx } from './sfx.mjs';

const appRoot = document.getElementById('app');

const HULL_PALETTES = {
  plasma_dagger: { top: '#13314d', bot: '#091828', border: '#22d3ee', lip: '#050c16' },
  rail_rifle: { top: '#242952', bot: '#11142b', border: '#818cf8', lip: '#080917' },
  arc_launcher: { top: '#371d59', bot: '#1b0d30', border: '#c084fc', lip: '#0e061a' },
  aegis_buckler: { top: '#473014', bot: '#211507', border: '#f59e0b', lip: '#120b03' },
  cryo_plate: { top: '#113c3b', bot: '#071d1d', border: '#2dd4bf', lip: '#030f0f' },
  solar_core: { top: '#4c1426', bot: '#260812', border: '#fb7185', lip: '#140308' },
  chrono_battery: { top: '#0f3d2d', bot: '#061c14', border: '#34d399', lip: '#030e0a' },
  nano_medkit: { top: '#133d20', bot: '#071d0e', border: '#4ade80', lip: '#030f07' },
};

function showToast(msg) {
  let root = document.getElementById('toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toast-root';
    document.body.appendChild(root);
  }
  root.innerHTML = `<div class="toast mono">${msg}</div>`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    if (root) root.innerHTML = '';
  }, 2100);
}

// 渲染完整多格模块外壳 HTML（共享于 5×5 星匣与 1:1 物理拖拽幽灵）
function buildPolyominoCellsMarkup(itemId, cells, pal, isSelected = false) {
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
  const minR = Math.min(...cells.map(([r]) => r));
  const maxR = Math.max(...cells.map(([r]) => r));
  const minC = Math.min(...cells.map(([, c]) => c));
  const maxC = Math.max(...cells.map(([, c]) => c));
  const spanRows = maxR - minR + 1;
  const spanCols = maxC - minC + 1;

  return { minR, minC, spanRows, spanCols, cellSet };
}

// =====================================================================
// 分支 A：若后端尚未由 Codex 实现，渲染暗黑战术诊断大厅
// =====================================================================
function renderCodexLobby() {
  let activeTab = 'status';

  const draw = () => {
    const isImpl = (name) => {
      if (name === 'IS_BACKEND_IMPLEMENTED') return Engine.IS_BACKEND_IMPLEMENTED === true;
      const fn = Engine[name];
      return typeof fn === 'function' && !fn.toString().includes('notImplemented(');
    };
    const missingExports = REQUIRED_ENGINE_EXPORTS.filter((name) => !isImpl(name));

    appRoot.innerHTML = `
      <div class="prep-workspace">
        <header class="hud-bar">
          <div class="hud-group">
            <span class="hud-tag mono">${uiIcon('target', 13)} TRACK A // 双AI协作终端</span>
          </div>
          <div class="hud-group">
            <span class="hud-tag credits mono">WAITING CODEX</span>
          </div>
        </header>

        <div class="lobby-card">
          <div style="font-size:13px;font-weight:800;color:#22d3ee;">
            前端战术系统 v3.0 与契约已就绪 (${missingExports.length} 项待提交)
          </div>
          <div class="export-grid">
            ${REQUIRED_ENGINE_EXPORTS.map((name) => {
              const ok = isImpl(name);
              return `<div class="export-pill">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
                <span style="color:${ok ? '#10b981' : '#f59e0b'};flex-shrink:0;">${ok ? 'OK' : 'PENDING'}</span>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="tab-row">
          <button class="tab-btn ${activeTab === 'status' ? 'active' : ''}" data-tab="status">协作指令</button>
          <button class="tab-btn ${activeTab === 'items' ? 'active' : ''}" data-tab="items">武装档案</button>
          <button class="tab-btn ${activeTab === 'waves' ? 'active' : ''}" data-tab="waves">虫潮情报</button>
        </div>

        <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:7px;">
          ${
            activeTab === 'status'
              ? RELIC_IDS.map((id) => {
                  const r = RELIC_CATALOG[id];
                  return `<div class="codex-item-row">
                    <div>${getRelicSvg(id, 30)}</div>
                    <div>
                      <div style="font-size:12px;font-weight:800;color:${r.color};">${r.name}</div>
                      <div style="font-size:11px;color:#94a3b8;">${r.description}</div>
                    </div>
                  </div>`;
                }).join('')
              : activeTab === 'items'
                ? ITEM_IDS.map((id) => {
                    const item = ITEM_CATALOG[id];
                    return `<div class="codex-item-row">
                      <div>${getItemSvg(id, 38)}</div>
                      <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;">
                          <span style="font-size:12px;font-weight:800;color:${item.color};">
                            ${item.name} · ${CATEGORY_META[item.category].label}
                          </span>
                          <span class="mono" style="font-size:11px;color:#f59e0b;">${item.cost} CR</span>
                        </div>
                        <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">${item.description}</div>
                        <div style="font-size:11px;color:#f59e0b;margin-top:2px;">连携：${item.synergyDesc}</div>
                      </div>
                    </div>`;
                  }).join('')
                : WAVE_CONFIGS.map(
                    (w) => `<div class="codex-item-row">
                      <div class="mono" style="min-width:46px;font-size:11px;font-weight:800;color:${w.accentColor};">
                        W-${String(w.wave).padStart(2, '0')}${w.isBoss ? '<br/>BOSS' : ''}
                      </div>
                      <div style="flex:1;">
                        <div style="font-size:12px;font-weight:800;">${w.name}</div>
                        <div class="mono" style="font-size:10.5px;color:#cbd5e1;">
                          HP ${w.maxHp} · SHD ${w.initialShield} · ATK ${w.attack}/${w.cooldownSec}s
                        </div>
                        <div style="font-size:11px;color:#7e90ad;">${w.traitDesc}</div>
                      </div>
                    </div>`
                  ).join('')
          }
        </div>
      </div>
    `;

    appRoot.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        draw();
      });
    });
  };

  draw();
}

// =====================================================================
// 分支 B：完整可玩游戏（封面 -> 整备工坊 -> 全屏肉鸽虫潮战斗）
// =====================================================================
function renderCodexModalHtml() {
  return `
    <div class="modal-backdrop" id="codex-backdrop">
      <div class="modal-card">
        <h2 class="modal-title">
          <span style="display:inline-flex;align-items:center;gap:6px;">${uiIcon('codex', 16)} 军械库武装档案</span>
          <button class="icon-btn" id="close-codex">ESC</button>
        </h2>
        <div style="font-size:11.5px;color:#94a3b8;line-height:1.55;">
          • 将多格模块拖入 <b>5×5 装甲星匣</b>，拖拽中按 <b>右键 / R / 滚轮</b> 可空中旋转。<br/>
          • 同装备同星级叠放触发 <b>二合一超载升星</b>（最高 3 星）；正交贴合激活能量连携。<br/>
          • 锁定配置出击后，界面自动收起进入 <b>全屏虫潮生存战</b>（可按住屏幕牵引走位）。
        </div>
        ${ITEM_IDS.map((id) => {
          const item = ITEM_CATALOG[id];
          return `<div class="codex-item-row">
            <div>${getItemSvg(id, 38)}</div>
            <div style="flex:1;">
              <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:800;color:${item.color};">
                <span>${item.name} (${RARITY_META[item.rarity].label})</span>
                <span class="mono" style="color:#f59e0b;">${item.cost} CR</span>
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${item.description}</div>
              <div style="font-size:11px;color:#f59e0b;margin-top:2px;">连携：${item.synergyDesc}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function showSplashScreen(onStart) {
  appRoot.innerHTML = `
    <section class="splash-screen">
      <div class="splash-header">
        <span class="splash-code mono">${uiIcon('target', 12)} STARGRID // ABYSSAL PROTOCOL</span>
        <h1 class="splash-title">星匣：深渊防线</h1>
        <p class="splash-sub mono">TACTICAL RIG ASSEMBLY · SWARM SURVIVAL</p>
      </div>

      <div class="splash-radar" aria-hidden="true">
        <div class="radar-ring"></div>
        <div class="radar-ring r2"></div>
        <div class="radar-ring r3"></div>
        <div class="radar-sweep"></div>
        ${getItemSvg('rail_rifle', 78)}
      </div>

      <div style="z-index:2;">
        <div class="splash-specs">
          <div class="spec-cell">
            <div class="spec-cell-top mono">01 // MATRIX</div>
            <div class="spec-cell-sub">5×5 异形拼装</div>
          </div>
          <div class="spec-cell">
            <div class="spec-cell-top mono">02 // OVERCLOCK</div>
            <div class="spec-cell-sub">二合一升星连携</div>
          </div>
          <div class="spec-cell">
            <div class="spec-cell-top mono">03 // SWARM</div>
            <div class="spec-cell-sub">全屏虫潮肉鸽</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="btn-start-game" class="tactical-btn">
            ${uiIcon('engage', 15)} INITIALIZE // 接入深渊防线
          </button>
          <button id="btn-splash-codex" class="tactical-btn secondary">
            ${uiIcon('codex', 14)} CODEX // 查阅军械档案
          </button>
        </div>
      </div>
    </section>
    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;

  document.getElementById('btn-start-game').addEventListener('click', () => {
    sfx.playLockIn();
    onStart();
  });

  const modalRoot = document.getElementById('modal-root');
  document.getElementById('btn-splash-codex').addEventListener('click', () => {
    modalRoot.innerHTML = renderCodexModalHtml();
    document.getElementById('close-codex').addEventListener('click', () => {
      modalRoot.innerHTML = '';
    });
    document.getElementById('codex-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'codex-backdrop') modalRoot.innerHTML = '';
    });
  });
}

function bootPlayableGame() {
  let state = Engine.createInitialState(20261124);
  let selectedRef = null;
  let isPlayingBattle = false;
  let battleSpeed = 1;
  let showBattleSummaryModal = false;
  let showCodexModal = false;
  let slamTargetId = null;
  let slamNeighborIds = new Set();
  const triggeredInstanceIds = new Map();
  let drag = null;

  appRoot.innerHTML = `
    <div id="prep-workspace" class="prep-workspace">
      <header id="hud-bar" class="hud-bar"></header>
      <div id="threat-scanner" class="threat-scanner"></div>
      <div id="relics-strip" class="relics-strip"></div>
      <section class="grid-section">
        <div id="stargrid-board" class="stargrid-board">
          <div class="grid-inner">
            <div id="grid-cells-bg" class="grid-cells-bg"></div>
            <svg id="synergy-svg" class="synergy-svg" viewBox="0 0 100 100"></svg>
            <div id="grid-items-layer" class="grid-items-layer"></div>
          </div>
        </div>
      </section>
      <div id="inspector-bar" class="inspector-bar"></div>
      <div id="stash-bar" class="stash-bar" aria-label="模块暂存架"></div>
      <section id="shop-section" class="shop-section"></section>
      <button id="battle-cta" class="tactical-btn"></button>
    </div>

    <div id="battle-screen" class="battle-screen" hidden>
      <canvas id="arena-canvas" class="arena-canvas"></canvas>
      <div id="battle-hud-overlay" class="battle-hud-overlay"></div>
      <div class="battle-bottom-overlay">
        <div id="battle-deck-strip" class="battle-deck-strip"></div>
        <div id="battle-controls" class="battle-controls">
          <button class="icon-btn active mono" data-speed="1">1X</button>
          <button class="icon-btn mono" data-speed="2">2X</button>
          <button class="icon-btn mono" data-skip="1">SKIP</button>
        </div>
      </div>
    </div>

    <div id="modal-root"></div>
    <div id="toast-root"></div>
  `;

  const prepWorkspaceEl = document.getElementById('prep-workspace');
  const battleScreenEl = document.getElementById('battle-screen');
  const canvasEl = document.getElementById('arena-canvas');
  const battleHudEl = document.getElementById('battle-hud-overlay');
  const battleDeckStripEl = document.getElementById('battle-deck-strip');
  const battleControlsEl = document.getElementById('battle-controls');

  const hudEl = document.getElementById('hud-bar');
  const threatScannerEl = document.getElementById('threat-scanner');
  const relicsStripEl = document.getElementById('relics-strip');
  const gridCellsBgEl = document.getElementById('grid-cells-bg');
  const synergySvgEl = document.getElementById('synergy-svg');
  const gridItemsLayerEl = document.getElementById('grid-items-layer');
  const inspectorBarEl = document.getElementById('inspector-bar');
  const stashBarEl = document.getElementById('stash-bar');
  const shopSectionEl = document.getElementById('shop-section');
  const battleCtaEl = document.getElementById('battle-cta');
  const modalRootEl = document.getElementById('modal-root');

  const COL_LABELS = ['A', 'B', 'C', 'D', 'E'];
  const cellElements = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const slot = document.createElement('div');
      slot.className = 'grid-cell-slot';
      slot.dataset.row = String(r);
      slot.dataset.col = String(c);
      slot.innerHTML = `<div class="grid-cell-socket"><span class="grid-coord mono">${COL_LABELS[c]}${r + 1}</span></div>`;
      slot.addEventListener('click', () => {
        if (isPlayingBattle || state.phase !== 'prep' || !selectedRef) return;
        const item = findItemByInstanceId(selectedRef.instanceId);
        if (!item) {
          selectedRef = null;
          renderAll();
          return;
        }
        try {
          const prevPlaced = state.placedItems.length;
          const prevLvSum = state.placedItems.reduce((a, b) => a + b.level, 0);
          state = Engine.placeOrMoveItem(state, {
            instanceId: item.instanceId,
            toGrid: true,
            row: r,
            col: c,
            rotation: item.rotation || 0,
          });
          const nextLvSum = state.placedItems.reduce((a, b) => a + b.level, 0);
          if (state.placedItems.length <= prevPlaced && nextLvSum > prevLvSum) {
            sfx.playMerge();
            showToast('UPGRADE // 模块二合一超载升星');
          } else {
            sfx.playLockIn();
          }
          triggerSlamFeedback(item.instanceId);
          if (!findItemByInstanceId(item.instanceId)) selectedRef = null;
          renderAll();
        } catch (err) {
          sfx.playClang();
          showToast(err.message);
        }
      });
      gridCellsBgEl.appendChild(slot);
      cellElements.push(slot);
    }
  }

  function renderBattleHudOverlay(tele) {
    const waveCfg = WAVE_CONFIGS[(state.wave || 1) - 1] || WAVE_CONFIGS[0];
    const pPct = Math.max(0, Math.min(100, (tele.playerHp / Math.max(1, tele.playerMaxHp)) * 100));
    const ePct = Math.max(0, Math.min(100, (tele.enemyHp / Math.max(1, tele.enemyMaxHp)) * 100));
    const statusChips = [];
    if (tele.enemyBurn > 0) statusChips.push(`BURN ${tele.enemyBurn}`);
    if (tele.enemyShock > 0) statusChips.push(`SHOCK ${tele.enemyShock}`);
    if (tele.enemyChill > 0) statusChips.push(`CHILL ${tele.enemyChill}`);

    battleHudEl.innerHTML = `
      <div class="battle-top-row mono">
        <span class="battle-badge" style="border-color:${waveCfg.accentColor};">
          W-${String(state.wave).padStart(2, '0')} // ${waveCfg.name}
        </span>
        <span class="battle-badge" style="color:${tele.simTime >= 18 ? '#f59e0b' : '#22d3ee'};">
          ${tele.simTime >= 18 ? 'STORM ' : ''}${tele.simTime.toFixed(1)}s · KILL ${tele.killCount}/${tele.totalKills}
        </span>
      </div>
      <div class="battle-bars mono">
        <div class="bar-box">
          <div class="bar-label" style="color:#22d3ee;">
            <span>RIG HP</span>
            <span>${tele.playerHp}/${tele.playerMaxHp}${tele.playerShield > 0 ? ` +${tele.playerShield}S` : ''}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pPct}%;background:#10b981;"></div>
          </div>
        </div>
        <div class="bar-box">
          <div class="bar-label" style="color:${waveCfg.accentColor};">
            <span>SWARM POOL</span>
            <span>${tele.enemyHp}/${tele.enemyMaxHp}${tele.enemyShield > 0 ? ` +${tele.enemyShield}S` : ''}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${ePct}%;background:${waveCfg.accentColor};"></div>
          </div>
        </div>
      </div>
      ${
        statusChips.length
          ? `<div class="mono" style="text-align:right;font-size:10px;color:#fbbf24;">${statusChips.join(' // ')}</div>`
          : `<div class="battle-hint mono">DRAG ARENA TO STEER RIG // 按住屏幕可手动牵引机甲走位</div>`
      }
    `;
  }

  const arena = new BattleArena(canvasEl, {
    onTelemetryTick: (tele) => {
      if (isPlayingBattle) renderBattleHudOverlay(tele);
    },
    onItemTrigger: (instanceId) => {
      if (triggeredInstanceIds.has(instanceId)) {
        clearTimeout(triggeredInstanceIds.get(instanceId));
      }
      const chip = battleDeckStripEl.querySelector(`[data-deck-id="${instanceId}"]`);
      if (chip) chip.classList.add('triggered');
      const tid = setTimeout(() => {
        const c2 = battleDeckStripEl.querySelector(`[data-deck-id="${instanceId}"]`);
        if (c2) c2.classList.remove('triggered');
        triggeredInstanceIds.delete(instanceId);
      }, 170);
      triggeredInstanceIds.set(instanceId, tid);
    },
    onPlaybackComplete: () => {
      isPlayingBattle = false;
      showBattleSummaryModal = true;
      renderModal();
    },
  });
  arena.startLoop();

  battleControlsEl.querySelectorAll('[data-speed]').forEach((btn) => {
    btn.addEventListener('click', () => {
      battleSpeed = Number(btn.dataset.speed);
      arena.setSpeed(battleSpeed);
      battleControlsEl.querySelectorAll('[data-speed]').forEach((b) => {
        b.classList.toggle('active', Number(b.dataset.speed) === battleSpeed);
      });
    });
  });

  battleControlsEl.querySelector('[data-skip]').addEventListener('click', () => {
    arena.skipToEnd();
  });

  function findItemByInstanceId(instanceId) {
    return (
      state.placedItems.find((p) => p.instanceId === instanceId) ||
      state.stashItems.find((s) => s.instanceId === instanceId) ||
      null
    );
  }

  function triggerSlamFeedback(placedId) {
    slamTargetId = placedId;
    const syn = Engine.computeGridSynergies(state);
    const neighbors = syn.itemStats[placedId]?.neighborIds || [];
    slamNeighborIds = new Set(neighbors);
    setTimeout(() => {
      slamTargetId = null;
      slamNeighborIds.clear();
    }, 210);
  }

  function getItemCentroidPercent(item) {
    const cells = Engine.getOccupiedCells(item.itemId, item.row, item.col, item.rotation);
    let sumR = 0;
    let sumC = 0;
    for (const [r, c] of cells) {
      sumR += r;
      sumC += c;
    }
    return {
      x: (sumC / cells.length + 0.5) * 20,
      y: (sumR / cells.length + 0.5) * 20,
      cells,
    };
  }

  function computeHudSummary(synergies) {
    const raw = synergies.summary || {};
    let estimatedDps = raw.estimatedDps;
    let estimatedShieldPerSec = raw.estimatedShieldPerSec;
    const activeLinkCount =
      raw.activeLinkCount ?? raw.activeLinks ?? (synergies.links || []).filter((l) => l.active).length;

    if (typeof estimatedDps !== 'number' || typeof estimatedShieldPerSec !== 'number') {
      let dps = 0;
      let shieldPerSec = 0;
      for (const stats of Object.values(synergies.itemStats || {})) {
        const cd = stats.effectiveCooldownSec || 0;
        if (cd <= 0) continue;
        if (stats.effectiveDamage > 0) {
          const critChance = stats.effectiveCritChance ?? stats.critChance ?? 0;
          const critMult = stats.critMultiplier ?? 1;
          dps += (stats.effectiveDamage * (1 + critChance * (critMult - 1))) / cd;
        }
        if (stats.effectiveShield > 0) {
          shieldPerSec += stats.effectiveShield / cd;
        }
      }
      if (typeof estimatedDps !== 'number') estimatedDps = Number(dps.toFixed(1));
      if (typeof estimatedShieldPerSec !== 'number') estimatedShieldPerSec = Number(shieldPerSec.toFixed(1));
    }
    return { estimatedDps, estimatedShieldPerSec, activeLinkCount };
  }

  function renderHud() {
    const waveCfg = WAVE_CONFIGS[(state.wave || 1) - 1] || WAVE_CONFIGS[0];
    const pips = [0, 1, 2]
      .map(
        (i) =>
          `<span class="pip-heart ${i < state.lives ? '' : 'lost'}">${uiIcon('integrity', 11)}</span>`
      )
      .join('');

    hudEl.innerHTML = `
      <div class="hud-group">
        <span class="hud-tag mono ${waveCfg.isBoss ? 'boss' : ''}">
          W-${String(state.wave).padStart(2, '0')}/${MAX_WAVES}${waveCfg.isBoss ? ' BOSS' : ''}
        </span>
        <span class="hud-tag credits mono">${uiIcon('credits', 12)} ${state.gold} CR</span>
        <span class="integrity-pips" title="防线完整度">${pips}</span>
      </div>
      <div class="hud-group">
        <button class="icon-btn mono" id="btn-codex">${uiIcon('codex', 12)} 档案</button>
        <button class="icon-btn" id="btn-mute" title="音效开关">${uiIcon(sfx.muted ? 'audioOff' : 'audioOn', 13)}</button>
        <button class="icon-btn" id="btn-restart" title="重开">${uiIcon('reset', 13)}</button>
      </div>
    `;
    document.getElementById('btn-codex').addEventListener('click', () => {
      showCodexModal = true;
      renderModal();
    });
    document.getElementById('btn-mute').addEventListener('click', () => {
      sfx.toggleMute();
      renderHud();
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      if (isPlayingBattle) return;
      state = Engine.createInitialState((Date.now() ^ Math.floor(Math.random() * 99999)) >>> 0);
      selectedRef = null;
      showBattleSummaryModal = false;
      renderAll();
      showToast('SYSTEM RESET // 已重建深渊防线');
    });
  }

  function renderThreatAndRelics(synergies) {
    const waveCfg = WAVE_CONFIGS[(state.wave || 1) - 1] || WAVE_CONFIGS[0];
    const { estimatedDps, estimatedShieldPerSec, activeLinkCount } = computeHudSummary(synergies);

    threatScannerEl.className = `threat-scanner${waveCfg.isBoss ? ' boss' : ''}`;
    threatScannerEl.innerHTML = `
      <div class="threat-left">
        <div class="threat-title">
          <span style="color:${waveCfg.accentColor};">${uiIcon('skull', 13)}</span>
          <span>${waveCfg.name}</span>
          <span class="mono" style="font-size:9.5px;color:#7e90ad;">[${waveCfg.title}]</span>
        </div>
        <div class="threat-sub mono">
          虫群总量 HP ${waveCfg.maxHp} · 甲 ${waveCfg.initialShield} · 攻 ${waveCfg.attack}/${waveCfg.cooldownSec}s
        </div>
      </div>
      <div class="telemetry-right mono">
        <span class="tele-chip">${uiIcon('dps', 11)} ${estimatedDps}/s</span>
        <span class="tele-chip shd">${uiIcon('shield', 11)} ${estimatedShieldPerSec}/s</span>
        <span class="tele-chip link">${uiIcon('bolt', 11)} ${activeLinkCount}</span>
      </div>
    `;

    if (state.relics.length === 0) {
      relicsStripEl.innerHTML = `<span class="mono" style="font-size:10px;color:#52637d;">RELIC SLOTS // 第 2 / 5 / 8 波击破虫巢解锁协议遗物</span>`;
    } else {
      relicsStripEl.innerHTML = state.relics
        .map((id) => {
          const r = RELIC_CATALOG[id];
          return `<span class="relic-chip" title="${r.description}">
            ${getRelicSvg(id, 14)} <span>${r.name}</span>
          </span>`;
        })
        .join('');
    }
  }

  function renderGrid(synergies) {
    const centroids = new Map();
    for (const item of state.placedItems) {
      centroids.set(item.instanceId, getItemCentroidPercent(item));
    }

    synergySvgEl.innerHTML = synergies.links
      .filter((link) => link.active)
      .map((link) => {
        const a = centroids.get(link.fromInstanceId);
        const b = centroids.get(link.toInstanceId);
        if (!a || !b) return '';
        return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="synergy-line" />`;
      })
      .join('');

    gridItemsLayerEl.innerHTML = '';
    for (const item of state.placedItems) {
      const def = ITEM_CATALOG[item.itemId];
      const pal = HULL_PALETTES[item.itemId] || {
        top: '#1e293b',
        bot: '#0f172a',
        border: def.color,
        lip: '#050811',
      };
      const info = centroids.get(item.instanceId);
      const stats = synergies.itemStats[item.instanceId];
      const isSelected = selectedRef?.instanceId === item.instanceId;
      const isSlammed = slamTargetId === item.instanceId;
      const isJolted = slamNeighborIds.has(item.instanceId);
      const { minR, minC, spanRows, spanCols, cellSet } = buildPolyominoCellsMarkup(
        item.itemId,
        info.cells,
        pal,
        isSelected
      );

      for (const [r, c] of info.cells) {
        const hasUp = cellSet.has(`${r - 1},${c}`);
        const hasDown = cellSet.has(`${r + 1},${c}`);
        const hasLeft = cellSet.has(`${r},${c - 1}`);
        const hasRight = cellSet.has(`${r},${c + 1}`);

        const padT = hasUp ? '0px' : '2.5px';
        const padB = hasDown ? '0px' : '2.5px';
        const padL = hasLeft ? '0px' : '2.5px';
        const padR = hasRight ? '0px' : '2.5px';

        const rTL = !hasUp && !hasLeft ? '6px' : '0px';
        const rTR = !hasUp && !hasRight ? '6px' : '0px';
        const rBL = !hasDown && !hasLeft ? '6px' : '0px';
        const rBR = !hasDown && !hasRight ? '6px' : '0px';

        const cellTile = document.createElement('div');
        cellTile.className = `grid-piece-cell${isSelected ? ' selected' : ''}${isSlammed ? ' just-slammed' : ''}${isJolted ? ' neighbor-jolt' : ''}`;
        cellTile.dataset.instanceId = item.instanceId;
        cellTile.style.left = `${c * 20}%`;
        cellTile.style.top = `${r * 20}%`;
        cellTile.style.width = '20%';
        cellTile.style.height = '20%';
        cellTile.style.padding = `${padT} ${padR} ${padB} ${padL}`;
        cellTile.style.setProperty('--item-color', def.color);
        cellTile.style.setProperty('--hull-top', pal.top);
        cellTile.style.setProperty('--hull-bot', pal.bot);

        const hull = document.createElement('div');
        hull.className = 'grid-piece-hull';
        hull.style.borderRadius = `${rTL} ${rTR} ${rBR} ${rBL}`;
        const borderCol = isSelected ? '#f8fafc' : pal.border;
        const lipCol = isSelected ? '#bae6fd' : pal.lip;
        hull.style.borderTop = hasUp ? 'none' : `1.5px solid ${borderCol}`;
        hull.style.borderBottom = hasDown ? 'none' : `3px solid ${lipCol}`;
        hull.style.borderLeft = hasLeft ? 'none' : `1.5px solid ${borderCol}`;
        hull.style.borderRight = hasRight ? 'none' : `1.5px solid ${borderCol}`;

        cellTile.appendChild(hull);
        cellTile.addEventListener('pointerdown', (e) => {
          if (isPlayingBattle || state.phase !== 'prep') return;
          startDrag(e, {
            kind: 'grid',
            instanceId: item.instanceId,
            itemId: item.itemId,
            level: item.level,
            rotation: item.rotation || 0,
            grabOffsetR: r - item.row,
            grabOffsetC: c - item.col,
          });
        });

        gridItemsLayerEl.appendChild(cellTile);
      }

      const overlay = document.createElement('div');
      overlay.className = `grid-piece-overlay${isSlammed ? ' just-slammed' : ''}${isJolted ? ' neighbor-jolt' : ''}`;
      overlay.dataset.instanceId = item.instanceId;
      overlay.style.left = `${minC * 20}%`;
      overlay.style.top = `${minR * 20}%`;
      overlay.style.width = `${spanCols * 20}%`;
      overlay.style.height = `${spanRows * 20}%`;

      overlay.innerHTML = `
        ${getPlacedItemVisualHtml(item.itemId, spanRows, spanCols, item.rotation || 0)}
        <span class="star-badge">${renderStars(item.level)}</span>
        ${stats?.synergyTags?.length ? '<span class="synergy-dot"></span>' : ''}
      `;
      gridItemsLayerEl.appendChild(overlay);
    }
  }

  function renderInspector(synergies) {
    const selected = selectedRef ? findItemByInstanceId(selectedRef.instanceId) : null;
    if (!selected) {
      inspectorBarEl.innerHTML = `
        <div class="inspector-info">
          <div class="inspector-title mono" style="color:#94a3b8;">${uiIcon('target', 12)} 拖拽模块以 1:1 实寸拼装 · 拖拽中 [右键 / R / 滚轮] 空中旋转</div>
          <div class="inspector-sub">同装备同星级叠放二合一超载升星，正交相邻自动建立连携线路。</div>
        </div>
      `;
      return;
    }

    const def = ITEM_CATALOG[selected.itemId];
    const inGrid = state.placedItems.some((p) => p.instanceId === selected.instanceId);
    const stats = inGrid ? synergies.itemStats[selected.instanceId] : null;
    const sellPrice = Math.ceil(selected.investedGold * 0.6);

    let statText = def.synergyDesc;
    if (stats) {
      const parts = [];
      if (stats.effectiveDamage > 0) parts.push(`DMG ${stats.effectiveDamage}`);
      if (stats.effectiveShield > 0) parts.push(`SHD ${stats.effectiveShield}`);
      if (stats.effectiveHeal > 0) parts.push(`HEAL ${stats.effectiveHeal}`);
      if (stats.effectiveCooldownSec > 0) parts.push(`CD ${stats.effectiveCooldownSec}s`);
      if (stats.synergyTags.length > 0) parts.push(stats.synergyTags.join(' · '));
      statText = parts.join(' | ') || def.description;
    }

    inspectorBarEl.innerHTML = `
      <div class="inspector-info">
        <div class="inspector-title" style="color:${def.color};">
          <span>${def.name}</span>
          ${renderStars(selected.level)}
          <span class="mono" style="font-size:9.5px;color:#7e90ad;">${inGrid ? '[ARMED]' : '[STASH]'}</span>
        </div>
        <div class="inspector-sub mono" title="${statText}">${statText}</div>
      </div>
      <div class="inspector-actions">
        <button class="action-mini-btn mono" id="btn-rotate">${uiIcon('rotate', 11)} 旋转</button>
        ${
          inGrid
            ? `<button class="action-mini-btn mono" id="btn-to-stash">暂存</button>`
            : `<button class="action-mini-btn mono" id="btn-auto-place">上阵</button>`
        }
        <button class="action-mini-btn sell mono" id="btn-sell">+${sellPrice} CR</button>
      </div>
    `;

    document.getElementById('btn-rotate')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.rotateItem(state, selected.instanceId);
        sfx.playRotate();
        triggerSlamFeedback(selected.instanceId);
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });

    document.getElementById('btn-to-stash')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.placeOrMoveItem(state, { instanceId: selected.instanceId, toGrid: false });
        sfx.playLift();
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });

    document.getElementById('btn-auto-place')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      const target = findFirstValidGridCell(selected.itemId, selected.level, selected.rotation || 0);
      if (!target) {
        sfx.playClang();
        showToast('星匣空间不足，请先旋转或腾出格子');
        return;
      }
      try {
        const beforeLen = state.placedItems.length;
        state = Engine.placeOrMoveItem(state, {
          instanceId: selected.instanceId,
          toGrid: true,
          row: target.row,
          col: target.col,
          rotation: selected.rotation || 0,
        });
        if (target.isMerge || state.placedItems.length === beforeLen) {
          sfx.playMerge();
          showToast('UPGRADE // 自动部署并完成升星');
        } else {
          sfx.playLockIn();
        }
        triggerSlamFeedback(selected.instanceId);
        if (!findItemByInstanceId(selected.instanceId)) selectedRef = null;
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });

    document.getElementById('btn-sell')?.addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.sellItem(state, selected.instanceId);
        selectedRef = null;
        sfx.playSell();
        showToast(`SALVAGE // 回收模块 +${sellPrice} CR`);
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });
  }

  function renderStash() {
    stashBarEl.innerHTML = '';
    for (let i = 0; i < MAX_STASH_SLOTS; i++) {
      const item = state.stashItems[i];
      const slot = document.createElement('div');
      slot.dataset.stashIndex = String(i);
      if (item) {
        const def = ITEM_CATALOG[item.itemId];
        const isSel = selectedRef?.instanceId === item.instanceId;
        slot.className = `stash-slot filled${isSel ? ' selected' : ''}`;
        slot.dataset.stashInstanceId = item.instanceId;
        slot.style.setProperty('--item-color', def.color);
        slot.innerHTML = `
          ${getItemSvg(item.itemId, 28)}
          <span class="star-badge">${renderStars(item.level)}</span>
        `;
        slot.addEventListener('pointerdown', (e) => {
          if (isPlayingBattle || state.phase !== 'prep') return;
          startDrag(e, {
            kind: 'stash',
            instanceId: item.instanceId,
            itemId: item.itemId,
            level: item.level,
            rotation: item.rotation || 0,
            grabOffsetR: 0,
            grabOffsetC: 0,
          });
        });
      } else {
        slot.className = 'stash-slot';
        slot.innerHTML = `<span class="mono" style="font-size:9px;color:#3d4d6b;">S-0${i + 1}</span>`;
      }
      stashBarEl.appendChild(slot);
    }
  }

  function renderShop() {
    const canRefresh = !isPlayingBattle && state.phase === 'prep' && state.gold >= state.refreshCost;
    shopSectionEl.innerHTML = `
      <div class="shop-header">
        <span style="display:inline-flex;align-items:center;gap:5px;">
          ${uiIcon('stash', 13)} 军械补给站 <span class="mono" style="font-size:9.5px;color:#7e90ad;">[点击入舱 / 拖入星匣]</span>
        </span>
        <button class="action-mini-btn mono" id="btn-refresh" ${canRefresh ? '' : 'disabled'}>
          ${uiIcon('refresh', 11)} REROLL ${state.refreshCost} CR
        </button>
      </div>
      <div class="shop-cards" id="shop-cards"></div>
    `;

    document.getElementById('btn-refresh').addEventListener('click', () => {
      if (isPlayingBattle || state.phase !== 'prep') return;
      try {
        state = Engine.refreshShop(state);
        sfx.playRotate();
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    });

    const cardsEl = document.getElementById('shop-cards');
    state.shopOffers.forEach((offer, idx) => {
      const def = ITEM_CATALOG[offer.itemId];
      const affordable = state.gold >= offer.cost;
      const card = document.createElement('div');
      card.className = `shop-card${offer.sold ? ' sold' : ''}${!affordable ? ' unaffordable' : ''}`;
      card.style.setProperty('--item-color', def.color);
      card.dataset.slotIndex = String(idx);
      card.innerHTML = `
        <div class="shop-card-top">
          ${getMiniShapeSvg(def.baseCells, 0, def.color)}
          <button class="lock-btn ${offer.locked ? 'locked' : ''}" data-lock="${idx}" title="锁定到下一波">
            ${uiIcon(offer.locked ? 'lock' : 'unlock', 10)}
          </button>
        </div>
        ${getItemSvg(offer.itemId, 34)}
        <div class="shop-name" style="color:${def.color};">${def.name}</div>
        <div class="shop-cost mono ${!affordable ? 'lack' : ''}">${offer.sold ? 'SOLD' : `${offer.cost} CR`}</div>
      `;

      const lockBtn = card.querySelector('.lock-btn');
      lockBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlayingBattle || state.phase !== 'prep' || offer.sold) return;
        state = Engine.toggleLockShopSlot(state, idx);
        sfx.playLockIn();
        renderShop();
      });

      if (!offer.sold) {
        card.addEventListener('pointerdown', (e) => {
          if (isPlayingBattle || state.phase !== 'prep') return;
          startDrag(e, {
            kind: 'shop',
            slotIndex: idx,
            itemId: offer.itemId,
            level: 1,
            rotation: 0,
            cost: offer.cost,
            grabOffsetR: 0,
            grabOffsetC: 0,
          });
        });
      }

      cardsEl.appendChild(card);
    });
  }

  function renderBattleCta() {
    if (state.phase === 'relic_draft') {
      battleCtaEl.innerHTML = `${uiIcon('bolt', 14)} PROTOCOL DRAFT // 请抽取 1 件遗物`;
    } else if (state.phase === 'victory') {
      battleCtaEl.innerHTML = `${uiIcon('trophy', 14)} MISSION COMPLETE // 查看通关战报`;
    } else if (state.phase === 'gameover') {
      battleCtaEl.innerHTML = `${uiIcon('skull', 14)} RIG DESTROYED // 查看终局战报`;
    } else {
      const waveCfg = WAVE_CONFIGS[state.wave - 1];
      battleCtaEl.innerHTML = `${uiIcon('engage', 13)} ENGAGE // 锁定出击 · W-${String(state.wave).padStart(2, '0')} (${waveCfg.name})`;
    }
    battleCtaEl.disabled = isPlayingBattle;
  }

  function renderBattleDeckStrip() {
    const active = state.placedItems.filter((p) => ITEM_CATALOG[p.itemId].cooldownSec > 0);
    battleDeckStripEl.innerHTML = active
      .map((item) => {
        const def = ITEM_CATALOG[item.itemId];
        return `<div class="deck-mini-chip" data-deck-id="${item.instanceId}" style="--item-color:${def.color};" title="${def.name}">
          ${getItemSvg(item.itemId, 20)}
        </div>`;
      })
      .join('');
  }

  function enterFullBattleMode(report, snapshotState) {
    isPlayingBattle = true;
    selectedRef = null;
    showBattleSummaryModal = false;

    renderBattleDeckStrip();
    prepWorkspaceEl.classList.add('collapsing');

    setTimeout(() => {
      prepWorkspaceEl.hidden = true;
      prepWorkspaceEl.classList.remove('collapsing');
      battleScreenEl.hidden = false;
      arena.setSpeed(battleSpeed);
      arena.playReport(report, snapshotState);
    }, 200);
  }

  function exitFullBattleMode() {
    battleScreenEl.hidden = true;
    prepWorkspaceEl.hidden = false;
    prepWorkspaceEl.classList.remove('collapsing');
    renderAll();
  }

  battleCtaEl.addEventListener('click', () => {
    if (isPlayingBattle) return;
    if (state.phase === 'prep') {
      try {
        const snapshotBefore = state;
        state = Engine.runWaveBattle(state);
        sfx.playLockIn();
        enterFullBattleMode(state.lastBattleReport, snapshotBefore);
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    } else {
      showBattleSummaryModal = true;
      renderModal();
    }
  });

  function renderModal() {
    if (showCodexModal) {
      modalRootEl.innerHTML = renderCodexModalHtml();
      document.getElementById('close-codex').addEventListener('click', () => {
        showCodexModal = false;
        renderModal();
      });
      document.getElementById('codex-backdrop').addEventListener('click', (e) => {
        if (e.target.id === 'codex-backdrop') {
          showCodexModal = false;
          renderModal();
        }
      });
      return;
    }

    if (showBattleSummaryModal && state.lastBattleReport) {
      const rep = state.lastBattleReport;
      const maxVal = Math.max(1, ...rep.contributions.map((c) => c.damage + c.shield + c.healing));
      let ctaLabel = `NEXT WAVE // 进入第 ${state.wave} 波整备`;
      if (state.phase === 'relic_draft') ctaLabel = 'PROTOCOL DRAFT // 抽取战利品遗物';
      else if (state.phase === 'victory') ctaLabel = 'SECTOR CLEARED // 重启新防线';
      else if (state.phase === 'gameover') ctaLabel = 'REBOOT RIG // 重新部署挑战';

      modalRootEl.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2 class="modal-title" style="color:${rep.won ? '#10b981' : '#f43f5e'};">
              <span>${rep.won ? `波次 W-${String(rep.wave).padStart(2, '0')} 虫潮清除` : `防线失守 (-1 完整度)`}</span>
              <span class="mono" style="font-size:11px;color:#7e90ad;">${rep.durationSec.toFixed(1)}s</span>
            </h2>
            <div style="display:flex;gap:6px;flex-wrap:wrap;" class="mono">
              <span class="hud-tag credits">+${rep.goldEarned} CR${rep.interestEarned ? ` (+${rep.interestEarned} 利息)` : ''}</span>
              <span class="hud-tag">总输出 ${rep.totalDamageDealt}</span>
              <span class="hud-tag">总护盾 ${rep.totalShieldGained}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:7px;">
              <div class="mono" style="font-size:11px;font-weight:800;color:#94a3b8;">COMBAT TELEMETRY // 武装贡献结算</div>
              ${
                rep.contributions.length === 0
                  ? '<div style="font-size:12px;color:#52637d;">本波次未部署主动武装</div>'
                  : rep.contributions
                      .map((c) => {
                        const score = c.damage + c.shield + c.healing;
                        const pct = Math.round((score / maxVal) * 100);
                        return `<div class="contrib-row">
                          <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="color:${c.color};font-weight:800;display:inline-flex;align-items:center;gap:4px;">${c.name} ${renderStars(c.level)}</span>
                            <span class="mono" style="color:#cbd5e1;font-size:10.5px;">DMG ${c.damage} · SHD ${c.shield}${c.healing ? ` · HEAL ${c.healing}` : ''}</span>
                          </div>
                          <div class="contrib-bar-bg">
                            <div class="contrib-bar-fill" style="width:${pct}%;background:${c.color};"></div>
                          </div>
                        </div>`;
                      })
                      .join('')
              }
            </div>
            <button class="tactical-btn" id="btn-report-continue">${ctaLabel}</button>
          </div>
        </div>
      `;

      document.getElementById('btn-report-continue').addEventListener('click', () => {
        showBattleSummaryModal = false;
        if (state.phase === 'victory' || state.phase === 'gameover') {
          state = Engine.createInitialState((Date.now() ^ Math.floor(Math.random() * 99999)) >>> 0);
        }
        exitFullBattleMode();
      });
      return;
    }

    if (state.phase === 'relic_draft' && !isPlayingBattle) {
      modalRootEl.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card">
            <h2 class="modal-title" style="color:#f59e0b;">PROTOCOL // 选择 1 项核心遗物</h2>
            <div style="font-size:11.5px;color:#94a3b8;">虫巢阶段清除奖励！该协议将在本局后续波次永久生效：</div>
            ${state.pendingRelicChoices
              .map((relicId) => {
                const r = RELIC_CATALOG[relicId];
                return `<button class="relic-option" data-relic="${relicId}">
                  <div>${getRelicSvg(relicId, 38)}</div>
                  <div>
                    <div style="font-size:13px;font-weight:800;color:${r.color};">${r.name}</div>
                    <div style="font-size:11px;color:#cbd5e1;margin-top:2px;">${r.description}</div>
                  </div>
                </button>`;
              })
              .join('')}
          </div>
        </div>
      `;
      modalRootEl.querySelectorAll('[data-relic]').forEach((btn) => {
        btn.addEventListener('click', () => {
          state = Engine.chooseRelic(state, btn.dataset.relic);
          sfx.playMerge();
          renderAll();
          showToast(`PROTOCOL ACTIVE // ${RELIC_CATALOG[btn.dataset.relic].name}`);
        });
      });
      return;
    }

    modalRootEl.innerHTML = '';
  }

  function findFirstValidGridCell(itemId, level, rotation) {
    let mergeCandidate = null;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const res = Engine.validatePlacement(state, { itemId, level, row: r, col: c, rotation });
        if (res.valid && !res.mergeTargetInstanceId) {
          return { row: r, col: c, isMerge: false };
        }
        if (res.valid && res.mergeTargetInstanceId && !mergeCandidate) {
          mergeCandidate = { row: r, col: c, isMerge: true };
        }
      }
    }
    return mergeCandidate;
  }

  function clearDragVisuals() {
    cellElements.forEach((el) => {
      el.classList.remove('preview-valid', 'preview-merge', 'preview-invalid');
    });
    stashBarEl.querySelectorAll('.stash-slot').forEach((s) => s.classList.remove('drop-hover', 'dragging-source'));
    gridItemsLayerEl
      .querySelectorAll('.colliding-pulse, .dragging-source')
      .forEach((el) => el.classList.remove('colliding-pulse', 'dragging-source'));
  }

  // 构建 1:1 真实格距大小的拖拽多格幽灵
  function buildRealScaleGhost(dragInfo) {
    const cellPx = Math.max(46, gridCellsBgEl.clientWidth / GRID_COLS);
    const { rows, cols, cells } = getShapeLayout(ITEM_CATALOG[dragInfo.itemId].baseCells, dragInfo.rotation);
    const pal = HULL_PALETTES[dragInfo.itemId] || {
      top: '#1e293b',
      bot: '#0f172a',
      border: '#22d3ee',
      lip: '#050811',
    };
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.style.width = `${cols * cellPx}px`;
    ghost.style.height = `${rows * cellPx}px`;

    const inner = document.createElement('div');
    inner.className = 'drag-ghost-inner';

    for (const [r, c] of cells) {
      const hasUp = cellSet.has(`${r - 1},${c}`);
      const hasDown = cellSet.has(`${r + 1},${c}`);
      const hasLeft = cellSet.has(`${r},${c - 1}`);
      const hasRight = cellSet.has(`${r},${c + 1}`);

      const tile = document.createElement('div');
      tile.style.position = 'absolute';
      tile.style.left = `${c * cellPx}px`;
      tile.style.top = `${r * cellPx}px`;
      tile.style.width = `${cellPx}px`;
      tile.style.height = `${cellPx}px`;
      tile.style.padding = `${hasUp ? 0 : 2}px ${hasRight ? 0 : 2}px ${hasDown ? 0 : 2}px ${hasLeft ? 0 : 2}px`;

      const hull = document.createElement('div');
      hull.className = 'grid-piece-hull';
      hull.style.setProperty('--hull-top', pal.top);
      hull.style.setProperty('--hull-bot', pal.bot);
      hull.style.borderRadius = `${!hasUp && !hasLeft ? 6 : 0}px ${!hasUp && !hasRight ? 6 : 0}px ${!hasDown && !hasRight ? 6 : 0}px ${!hasDown && !hasLeft ? 6 : 0}px`;
      hull.style.borderTop = hasUp ? 'none' : `1.5px solid ${pal.border}`;
      hull.style.borderBottom = hasDown ? 'none' : `3px solid ${pal.lip}`;
      hull.style.borderLeft = hasLeft ? 'none' : `1.5px solid ${pal.border}`;
      hull.style.borderRight = hasRight ? 'none' : `1.5px solid ${pal.border}`;

      tile.appendChild(hull);
      inner.appendChild(tile);
    }

    const artOverlay = document.createElement('div');
    artOverlay.className = 'grid-piece-overlay';
    artOverlay.style.inset = '0';
    artOverlay.innerHTML = `
      ${getPlacedItemVisualHtml(dragInfo.itemId, rows, cols, dragInfo.rotation)}
      <span class="star-badge">${renderStars(dragInfo.level)}</span>
    `;
    inner.appendChild(artOverlay);

    const rotHint = document.createElement('div');
    rotHint.className = 'drag-rotate-badge mono';
    rotHint.textContent = '[右键/R] 旋转';
    inner.appendChild(rotHint);

    ghost.appendChild(inner);
    return { ghost, width: cols * cellPx, height: rows * cellPx, cellPx };
  }

  function getMagneticGridTarget(clientX, clientY, dragInfo) {
    const rect = gridCellsBgEl.getBoundingClientRect();
    if (
      clientX < rect.left - 14 ||
      clientX > rect.right + 14 ||
      clientY < rect.top - 14 ||
      clientY > rect.bottom + 14
    ) {
      return null;
    }

    const { rows, cols } = getShapeLayout(ITEM_CATALOG[dragInfo.itemId].baseCells, dragInfo.rotation);
    const cellW = rect.width / GRID_COLS;
    const cellH = rect.height / GRID_ROWS;
    const relC = (clientX - rect.left) / cellW;
    const relR = (clientY - rect.top) / cellH;

    let rawRow =
      dragInfo.kind === 'grid'
        ? Math.floor(relR) - (dragInfo.grabOffsetR || 0)
        : Math.round(relR - rows * 0.5);
    let rawCol =
      dragInfo.kind === 'grid'
        ? Math.floor(relC) - (dragInfo.grabOffsetC || 0)
        : Math.round(relC - cols * 0.5);

    // 仅在贴边微越界 1 格内磁吸纠偏，避免贴墙放置卡手
    const clampedRow = Math.max(0, Math.min(GRID_ROWS - rows, rawRow));
    const clampedCol = Math.max(0, Math.min(GRID_COLS - cols, rawCol));
    if (Math.abs(clampedRow - rawRow) <= 1 && Math.abs(clampedCol - rawCol) <= 1) {
      const checkRaw = Engine.validatePlacement(state, {
        itemId: dragInfo.itemId,
        level: dragInfo.level,
        row: rawRow,
        col: rawCol,
        rotation: dragInfo.rotation,
        ignoreInstanceId: dragInfo.instanceId || null,
      });
      if (!checkRaw.valid && checkRaw.reason === 'out_of_bounds') {
        const checkClamped = Engine.validatePlacement(state, {
          itemId: dragInfo.itemId,
          level: dragInfo.level,
          row: clampedRow,
          col: clampedCol,
          rotation: dragInfo.rotation,
          ignoreInstanceId: dragInfo.instanceId || null,
        });
        if (checkClamped.valid) {
          return { row: clampedRow, col: clampedCol, check: checkClamped };
        }
      }
    }

    const check = Engine.validatePlacement(state, {
      itemId: dragInfo.itemId,
      level: dragInfo.level,
      row: rawRow,
      col: rawCol,
      rotation: dragInfo.rotation,
      ignoreInstanceId: dragInfo.instanceId || null,
    });
    return { row: rawRow, col: rawCol, check };
  }

  function startDrag(e, info) {
    if (e.button !== undefined && e.button !== 0) return;
    drag = {
      ...info,
      startX: e.clientX,
      startY: e.clientY,
      curX: e.clientX,
      curY: e.clientY,
      prevX: e.clientX,
      tilt: 0,
      moved: false,
      ghostEl: null,
      ghostW: 0,
      ghostH: 0,
      lastSnapKey: null,
      rafId: null,
    };

    const updateHoverPreview = (clientX, clientY) => {
      clearDragVisuals();
      if (drag.instanceId) {
        gridItemsLayerEl
          .querySelectorAll(`[data-instance-id="${drag.instanceId}"]`)
          .forEach((el) => el.classList.add('dragging-source'));
        stashBarEl
          .querySelectorAll(`[data-stash-instance-id="${drag.instanceId}"]`)
          .forEach((el) => el.classList.add('dragging-source'));
      }

      const target = getMagneticGridTarget(clientX, clientY, drag);
      if (target) {
        const { row, col, check } = target;
        const snapKey = `${row},${col},${drag.rotation}`;
        if (snapKey !== drag.lastSnapKey) {
          drag.lastSnapKey = snapKey;
          sfx.playDetent();
        }
        const cls = check.valid
          ? check.mergeTargetInstanceId
            ? 'preview-merge'
            : 'preview-valid'
          : 'preview-invalid';
        for (const [r, c] of check.occupiedCells) {
          if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
            cellElements[r * GRID_COLS + c].classList.add(cls);
          }
        }
        if (!check.valid && check.overlappingInstanceIds.length > 0) {
          for (const oid of check.overlappingInstanceIds) {
            gridItemsLayerEl
              .querySelectorAll(`[data-instance-id="${oid}"]`)
              .forEach((el) => el.classList.add('colliding-pulse'));
          }
        }
      } else {
        drag.lastSnapKey = null;
        const elUnder = document.elementFromPoint(clientX, clientY);
        const stashSlot = elUnder?.closest?.('.stash-slot');
        if (stashSlot) stashSlot.classList.add('drop-hover');
      }
    };

    const refreshGhostAfterRotate = () => {
      if (!drag || !drag.moved) return;
      drag.rotation = (drag.rotation + 90) % 360;
      drag.grabOffsetR = 0;
      drag.grabOffsetC = 0;
      if (drag.ghostEl) drag.ghostEl.remove();
      const built = buildRealScaleGhost(drag);
      drag.ghostEl = built.ghost;
      drag.ghostW = built.width;
      drag.ghostH = built.height;
      document.body.appendChild(built.ghost);
      sfx.playRotate();
      updateHoverPreview(drag.curX, drag.curY);
    };

    const tickPhysics = () => {
      if (!drag || !drag.moved || !drag.ghostEl) return;
      const vx = drag.curX - drag.prevX;
      drag.prevX = drag.curX;
      const targetTilt = Math.max(-14, Math.min(14, vx * 0.5));
      drag.tilt += (targetTilt - drag.tilt) * 0.28;
      const gx = drag.curX - drag.ghostW * 0.5;
      const gy = drag.curY - drag.ghostH * 0.5;
      drag.ghostEl.style.transform = `translate3d(${gx}px, ${gy}px, 0) rotate(${drag.tilt.toFixed(2)}deg) scale(1.04)`;
      drag.rafId = requestAnimationFrame(tickPhysics);
    };

    const onMove = (ev) => {
      if (!drag) return;
      drag.curX = ev.clientX;
      drag.curY = ev.clientY;
      const dist = Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY);
      if (!drag.moved && dist > 5) {
        drag.moved = true;
        sfx.playLift();
        const built = buildRealScaleGhost(drag);
        drag.ghostEl = built.ghost;
        drag.ghostW = built.width;
        drag.ghostH = built.height;
        document.body.appendChild(built.ghost);
        drag.rafId = requestAnimationFrame(tickPhysics);
      }
      if (!drag.moved) return;
      updateHoverPreview(ev.clientX, ev.clientY);
    };

    const onContextMenu = (ev) => {
      if (!drag || !drag.moved) return;
      ev.preventDefault();
      refreshGhostAfterRotate();
    };

    const onWheel = (ev) => {
      if (!drag || !drag.moved) return;
      ev.preventDefault();
      refreshGhostAfterRotate();
    };

    const onKeyDuringDrag = (ev) => {
      if (!drag || !drag.moved) return;
      if (ev.key === 'r' || ev.key === 'R') {
        ev.preventDefault();
        refreshGhostAfterRotate();
      }
    };

    const springBackGhost = (ghost, width, height, toX, toY) => {
      if (!ghost) return;
      ghost.style.transition = 'transform 0.19s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.19s ease';
      ghost.style.transform = `translate3d(${toX - width * 0.5}px, ${toY - height * 0.5}px, 0) scale(0.92)`;
      ghost.style.opacity = '0';
      setTimeout(() => ghost.remove(), 200);
    };

    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDuringDrag);

      const currentDrag = drag;
      drag = null;
      if (currentDrag?.rafId) cancelAnimationFrame(currentDrag.rafId);
      clearDragVisuals();
      if (!currentDrag) return;

      if (!currentDrag.moved) {
        if (currentDrag.ghostEl) currentDrag.ghostEl.remove();
        handleTapAction(currentDrag);
        return;
      }

      const target = getMagneticGridTarget(ev.clientX, ev.clientY, currentDrag);
      if (target) {
        if (!target.check.valid) {
          sfx.playClang();
          for (const oid of target.check.overlappingInstanceIds) {
            gridItemsLayerEl
              .querySelectorAll(`[data-instance-id="${oid}"]`)
              .forEach((el) => el.classList.add('collision-shake'));
          }
          springBackGhost(
            currentDrag.ghostEl,
            currentDrag.ghostW,
            currentDrag.ghostH,
            currentDrag.startX,
            currentDrag.startY
          );
          showToast(
            target.check.reason === 'out_of_bounds'
              ? 'BOUNDARY // 超出星匣网格边界'
              : 'COLLISION // 与现有装备位置冲突'
          );
          return;
        }

        if (currentDrag.ghostEl) currentDrag.ghostEl.remove();
        try {
          let activeId = currentDrag.instanceId;
          if (currentDrag.kind === 'shop') {
            const prevMaxSum = state.placedItems.reduce((a, b) => a + b.level, 0);
            const prevLen = state.placedItems.length;
            state = Engine.buyShopItem(state, currentDrag.slotIndex, {
              row: target.row,
              col: target.col,
              rotation: currentDrag.rotation,
            });
            const nextMaxSum = state.placedItems.reduce((a, b) => a + b.level, 0);
            activeId = target.check.mergeTargetInstanceId || state.placedItems[state.placedItems.length - 1]?.instanceId;
            if (state.placedItems.length === prevLen && nextMaxSum > prevMaxSum) {
              sfx.playMerge();
              showToast('UPGRADE // 购入并直接升星');
            } else {
              sfx.playLockIn();
            }
          } else {
            const prevLen = state.placedItems.length + state.stashItems.length;
            state = Engine.placeOrMoveItem(state, {
              instanceId: currentDrag.instanceId,
              toGrid: true,
              row: target.row,
              col: target.col,
              rotation: currentDrag.rotation,
            });
            activeId = target.check.mergeTargetInstanceId || currentDrag.instanceId;
            if (state.placedItems.length + state.stashItems.length < prevLen) {
              sfx.playMerge();
              showToast('UPGRADE // 二合一超载升星');
            } else {
              sfx.playLockIn();
            }
          }
          if (activeId) triggerSlamFeedback(activeId);
          renderAll();
        } catch (err) {
          sfx.playClang();
          showToast(err.message);
        }
        return;
      }

      const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
      const stashSlot = elUnder?.closest?.('.stash-slot');
      if (stashSlot) {
        if (currentDrag.ghostEl) currentDrag.ghostEl.remove();
        const targetStashInstanceId = stashSlot.dataset.stashInstanceId || null;
        try {
          if (currentDrag.kind === 'shop') {
            state = Engine.buyShopItem(state, currentDrag.slotIndex, null);
            sfx.playBuy();
          } else {
            const prevTotal = state.placedItems.length + state.stashItems.length;
            state = Engine.placeOrMoveItem(state, {
              instanceId: currentDrag.instanceId,
              toGrid: false,
              targetStashInstanceId:
                targetStashInstanceId && targetStashInstanceId !== currentDrag.instanceId
                  ? targetStashInstanceId
                  : null,
            });
            if (state.placedItems.length + state.stashItems.length < prevTotal) {
              sfx.playMerge();
              showToast('UPGRADE // 暂存舱内合成升星');
            } else {
              sfx.playLockIn();
            }
          }
          renderAll();
        } catch (err) {
          sfx.playClang();
          showToast(err.message);
        }
        return;
      }

      // 拖到无效空白处 -> 弹性回弹原位
      sfx.playClang();
      springBackGhost(
        currentDrag.ghostEl,
        currentDrag.ghostW,
        currentDrag.ghostH,
        currentDrag.startX,
        currentDrag.startY
      );
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDuringDrag);
  }

  function handleTapAction(info) {
    if (info.kind === 'shop') {
      if (state.gold < info.cost) {
        sfx.playClang();
        showToast('INSUFFICIENT CREDITS // 信用点不足');
        return;
      }
      try {
        if (state.stashItems.length < MAX_STASH_SLOTS) {
          state = Engine.buyShopItem(state, info.slotIndex, null);
          const newest = state.stashItems[state.stashItems.length - 1];
          selectedRef = newest ? { source: 'stash', instanceId: newest.instanceId } : null;
          sfx.playBuy();
          showToast(`ACQUIRED // ${ITEM_CATALOG[info.itemId].name} 已入舱`);
        } else {
          const spot = findFirstValidGridCell(info.itemId, 1, 0);
          if (!spot) {
            sfx.playClang();
            showToast('CAPACITY FULL // 暂存舱与星匣均已满');
            return;
          }
          state = Engine.buyShopItem(state, info.slotIndex, {
            row: spot.row,
            col: spot.col,
            rotation: 0,
          });
          if (spot.isMerge) {
            sfx.playMerge();
            showToast('UPGRADE // 购入并直接合成升星');
          } else {
            sfx.playLockIn();
            showToast(`DEPLOYED // 自动装入 ${COL_LABELS[spot.col]}${spot.row + 1}`);
          }
        }
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
      return;
    }

    if (selectedRef && selectedRef.instanceId !== info.instanceId && info.kind === 'grid') {
      const prevItem = findItemByInstanceId(selectedRef.instanceId);
      const targetItem = state.placedItems.find((p) => p.instanceId === info.instanceId);
      if (
        prevItem &&
        targetItem &&
        prevItem.itemId === targetItem.itemId &&
        prevItem.level === targetItem.level &&
        targetItem.level < 3
      ) {
        try {
          state = Engine.placeOrMoveItem(state, {
            instanceId: prevItem.instanceId,
            toGrid: true,
            row: targetItem.row,
            col: targetItem.col,
            rotation: prevItem.rotation || 0,
          });
          selectedRef = { source: 'grid', instanceId: targetItem.instanceId };
          sfx.playMerge();
          triggerSlamFeedback(targetItem.instanceId);
          showToast('UPGRADE // 模块二合一超载升星');
          renderAll();
          return;
        } catch {
          // 退回正常选中
        }
      }
    }

    selectedRef = { source: info.kind, instanceId: info.instanceId };
    sfx.playLift();
    renderAll();
  }

  window.addEventListener('keydown', (e) => {
    if (isPlayingBattle || state.phase !== 'prep' || drag?.moved) return;
    if ((e.key === 'r' || e.key === 'R') && selectedRef) {
      try {
        state = Engine.rotateItem(state, selectedRef.instanceId);
        sfx.playRotate();
        triggerSlamFeedback(selectedRef.instanceId);
        renderAll();
      } catch (err) {
        sfx.playClang();
        showToast(err.message);
      }
    }
  });

  function renderAll() {
    const synergies = Engine.computeGridSynergies(state);
    renderHud();
    renderThreatAndRelics(synergies);
    renderGrid(synergies);
    renderInspector(synergies);
    renderStash();
    renderShop();
    renderBattleCta();
    renderModal();
  }

  renderAll();
}

// 启动入口
if (Engine.IS_BACKEND_IMPLEMENTED) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') {
    bootPlayableGame();
  } else {
    showSplashScreen(bootPlayableGame);
  }
} else {
  renderCodexLobby();
}
