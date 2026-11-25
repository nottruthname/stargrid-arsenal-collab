/**
 * 《铁血防线：1944》确定性后端核心引擎
 * - 100% 遵循 shared/protocol.mjs 前后端契约
 * - 不可变状态更新 + Mulberry32 确定性随机数 + 空间排序稳定模拟
 */

import {
  BASE_REFRESH_COST,
  BATTLE_TICK_SEC,
  GRID_COLS,
  GRID_ROWS,
  INITIAL_GOLD,
  INITIAL_LIVES,
  ITEM_CATALOG,
  ITEM_IDS,
  LEVEL_MULTIPLIERS,
  MAX_BATTLE_SEC,
  MAX_ITEM_LEVEL,
  MAX_STASH_SLOTS,
  MAX_WAVES,
  OVERTIME_START_SEC,
  PLAYER_BASE_MAX_HP,
  RARITY_META,
  RELIC_CATALOG,
  RELIC_IDS,
  RELIC_WAVE_MILESTONES,
  SHOP_SLOTS,
  WAVE_CONFIGS,
} from '../../shared/protocol.mjs';

export const IS_BACKEND_IMPLEMENTED = true;

function nextRng(rngState) {
  let t = (rngState + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), 1 | t);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return {
    value: ((r ^ (r >>> 14)) >>> 0) / 4294967296,
    rngState: t,
  };
}

function rollShopOffers(rngState, prevOffers = null, honorLock = false) {
  let curRng = rngState >>> 0;
  const totalWeight = ITEM_IDS.reduce((sum, id) => sum + RARITY_META[ITEM_CATALOG[id].rarity].weight, 0);
  const offers = [];

  for (let i = 0; i < SHOP_SLOTS; i++) {
    const prev = prevOffers?.[i];
    if (honorLock && prev && prev.locked && !prev.sold) {
      offers.push({ ...prev, slotIndex: i });
      continue;
    }
    const step = nextRng(curRng);
    curRng = step.rngState;
    let pickRoll = step.value * totalWeight;
    let chosenId = ITEM_IDS[0];
    for (const id of ITEM_IDS) {
      pickRoll -= RARITY_META[ITEM_CATALOG[id].rarity].weight;
      if (pickRoll <= 0) {
        chosenId = id;
        break;
      }
    }
    offers.push({
      slotIndex: i,
      itemId: chosenId,
      cost: ITEM_CATALOG[chosenId].cost,
      sold: false,
      locked: false,
    });
  }

  // 若 3 个槽位均被锁定，依然步进 1 次随机状态，防止波次重试时随机流冻结
  if (curRng === (rngState >>> 0)) {
    curRng = nextRng(curRng).rngState;
  }

  return { shopOffers: offers, rngState: curRng };
}

function cloneState(state) {
  return structuredClone(state);
}

function isPrepPhase(state) {
  return state && state.phase === 'prep';
}

export function getOccupiedCells(itemId, row, col, rotation = 0) {
  const def = ITEM_CATALOG[itemId];
  if (!def) throw new Error(`未知卡牌: ${itemId}`);

  const normRot = ((Number(rotation) || 0) % 360 + 360) % 360;
  if (![0, 90, 180, 270].includes(normRot)) {
    throw new Error('卡牌旋转角度必须为 90 的倍数');
  }
  const steps = normRot / 90;

  const rotated = def.baseCells.map(([br, bc]) => {
    let r = br;
    let c = bc;
    for (let i = 0; i < steps; i++) {
      const nr = c;
      const nc = -r;
      r = nr;
      c = nc;
    }
    return [r, c];
  });

  let minR = Infinity;
  let minC = Infinity;
  for (const [r, c] of rotated) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }

  return rotated
    .map(([r, c]) => [row + (r - minR), col + (c - minC)])
    .sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]));
}

export function createInitialState(seed = 20261124) {
  const initialRng = (seed >>> 0) || 1;
  const rolled = rollShopOffers(initialRng, null, false);
  const starterDef = ITEM_CATALOG.infantry_squad;
  return {
    seed: initialRng,
    rngState: rolled.rngState,
    wave: 1,
    phase: 'prep',
    gold: INITIAL_GOLD,
    lives: INITIAL_LIVES,
    playerMaxHp: PLAYER_BASE_MAX_HP,
    refreshCost: BASE_REFRESH_COST,
    shopOffers: rolled.shopOffers,
    placedItems: [
      {
        instanceId: 'unit_starter_1',
        itemId: 'infantry_squad',
        level: 1,
        row: 2,
        col: 2,
        rotation: 0,
        investedGold: starterDef.cost,
      },
    ],
    stashItems: [],
    relics: [],
    pendingRelicChoices: [],
    nextInstanceSeq: 2,
    refreshCountInWave: 0,
    lastBattleReport: null,
  };
}

export function validatePlacement(state, candidate) {
  const { itemId, level = 1, row, col, rotation = 0, ignoreInstanceId = null } = candidate;
  const occupiedCells = getOccupiedCells(itemId, row, col, rotation);

  const outOfBounds = occupiedCells.some(
    ([r, c]) => r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS
  );
  if (outOfBounds) {
    return {
      valid: false,
      reason: 'out_of_bounds',
      occupiedCells,
      overlappingInstanceIds: [],
      mergeTargetInstanceId: null,
    };
  }

  const cellKeys = new Set(occupiedCells.map(([r, c]) => `${r},${c}`));
  const overlappingItems = [];

  for (const placed of state.placedItems) {
    if (placed.instanceId === ignoreInstanceId) continue;
    const pCells = getOccupiedCells(placed.itemId, placed.row, placed.col, placed.rotation);
    if (pCells.some(([r, c]) => cellKeys.has(`${r},${c}`))) {
      overlappingItems.push(placed);
    }
  }

  const overlappingInstanceIds = overlappingItems.map((p) => p.instanceId);
  if (overlappingItems.length === 0) {
    return {
      valid: true,
      reason: 'ok',
      occupiedCells,
      overlappingInstanceIds: [],
      mergeTargetInstanceId: null,
    };
  }

  if (overlappingItems.length === 1) {
    const target = overlappingItems[0];
    if (target.itemId === itemId && target.level === level && level < MAX_ITEM_LEVEL) {
      return {
        valid: true,
        reason: 'merge',
        occupiedCells,
        overlappingInstanceIds,
        mergeTargetInstanceId: target.instanceId,
      };
    }
  }

  return {
    valid: false,
    reason: overlappingItems.length === 1 && overlappingItems[0].level >= MAX_ITEM_LEVEL ? 'max_level' : 'collision',
    occupiedCells,
    overlappingInstanceIds,
    mergeTargetInstanceId: null,
  };
}

export function buyShopItem(state, slotIndex, targetPlacement = null) {
  if (!isPrepPhase(state)) throw new Error('当前不在整备阶段');
  const offer = state.shopOffers[slotIndex];
  if (!offer || offer.sold) throw new Error('该补给槽位暂无可用军械');
  if (state.gold < offer.cost) throw new Error('军费不足');

  const next = cloneState(state);
  const nextOffer = next.shopOffers[slotIndex];
  const newInstanceId = `unit_${next.nextInstanceSeq++}`;

  if (targetPlacement === null) {
    if (next.stashItems.length >= MAX_STASH_SLOTS) {
      throw new Error('备战区已满');
    }
    next.gold -= nextOffer.cost;
    nextOffer.sold = true;
    nextOffer.locked = false;
    next.stashItems.push({
      instanceId: newInstanceId,
      itemId: nextOffer.itemId,
      level: 1,
      rotation: 0,
      investedGold: nextOffer.cost,
    });
    return next;
  }

  const { row, col, rotation = 0 } = targetPlacement;
  const check = validatePlacement(next, {
    itemId: nextOffer.itemId,
    level: 1,
    row,
    col,
    rotation,
  });
  if (!check.valid) {
    throw new Error(check.reason === 'out_of_bounds' ? '超出作战沙盘边界' : '目标格位已被其他单位占用');
  }

  next.gold -= nextOffer.cost;
  nextOffer.sold = true;
  nextOffer.locked = false;

  if (check.mergeTargetInstanceId) {
    const target = next.placedItems.find((p) => p.instanceId === check.mergeTargetInstanceId);
    target.level += 1;
    target.investedGold += nextOffer.cost;
  } else {
    next.placedItems.push({
      instanceId: newInstanceId,
      itemId: nextOffer.itemId,
      level: 1,
      row,
      col,
      rotation,
      investedGold: nextOffer.cost,
    });
  }

  return next;
}

export function placeOrMoveItem(state, moveOp) {
  if (!isPrepPhase(state)) throw new Error('当前不在整备阶段');
  const { instanceId, toGrid, row = 0, col = 0, rotation = 0, targetStashInstanceId = null } = moveOp;

  const next = cloneState(state);
  const gridIdx = next.placedItems.findIndex((p) => p.instanceId === instanceId);
  const stashIdx = next.stashItems.findIndex((s) => s.instanceId === instanceId);
  if (gridIdx === -1 && stashIdx === -1) {
    throw new Error('未找到指定部队单位');
  }

  const moving = gridIdx !== -1 ? next.placedItems[gridIdx] : next.stashItems[stashIdx];

  if (!toGrid) {
    if (targetStashInstanceId && targetStashInstanceId !== instanceId) {
      const target = next.stashItems.find((s) => s.instanceId === targetStashInstanceId);
      if (!target || target.itemId !== moving.itemId || target.level !== moving.level || target.level >= MAX_ITEM_LEVEL) {
        throw new Error('仅同兵种同星级且未满星的卡牌可合成');
      }
      target.level += 1;
      target.investedGold += moving.investedGold;
      if (gridIdx !== -1) next.placedItems.splice(gridIdx, 1);
      else next.stashItems.splice(stashIdx, 1);
      return next;
    }

    if (stashIdx !== -1) {
      return next;
    }
    if (next.stashItems.length >= MAX_STASH_SLOTS) {
      throw new Error('备战区已满');
    }
    next.placedItems.splice(gridIdx, 1);
    next.stashItems.push({
      instanceId: moving.instanceId,
      itemId: moving.itemId,
      level: moving.level,
      rotation: moving.rotation || 0,
      investedGold: moving.investedGold,
    });
    return next;
  }

  const check = validatePlacement(next, {
    itemId: moving.itemId,
    level: moving.level,
    row,
    col,
    rotation,
    ignoreInstanceId: moving.instanceId,
  });
  if (!check.valid) {
    throw new Error(check.reason === 'out_of_bounds' ? '超出作战沙盘边界' : '单位部署位置发生冲突');
  }

  if (gridIdx !== -1) next.placedItems.splice(gridIdx, 1);
  else next.stashItems.splice(stashIdx, 1);

  if (check.mergeTargetInstanceId) {
    const target = next.placedItems.find((p) => p.instanceId === check.mergeTargetInstanceId);
    target.level += 1;
    target.investedGold += moving.investedGold;
  } else {
    next.placedItems.push({
      instanceId: moving.instanceId,
      itemId: moving.itemId,
      level: moving.level,
      row,
      col,
      rotation,
      investedGold: moving.investedGold,
    });
  }

  return next;
}

export function rotateItem(state, instanceId) {
  if (!isPrepPhase(state)) throw new Error('当前不在整备阶段');
  const next = cloneState(state);
  const gridItem = next.placedItems.find((p) => p.instanceId === instanceId);
  if (gridItem) {
    const nextRot = ((gridItem.rotation || 0) + 90) % 360;
    const offsets = [
      [0, 0],
      [-1, 0],
      [0, -1],
      [1, 0],
      [0, 1],
      [-2, 0],
      [0, -2],
      [-1, -1],
    ];
    for (const [dr, dc] of offsets) {
      const nr = gridItem.row + dr;
      const nc = gridItem.col + dc;
      const check = validatePlacement(next, {
        itemId: gridItem.itemId,
        level: gridItem.level,
        row: nr,
        col: nc,
        rotation: nextRot,
        ignoreInstanceId: gridItem.instanceId,
      });
      if (check.valid && !check.mergeTargetInstanceId) {
        gridItem.row = nr;
        gridItem.col = nc;
        gridItem.rotation = nextRot;
        return next;
      }
    }
    throw new Error('周边战壕空间不足，无法旋转卡牌');
  }

  const stashItem = next.stashItems.find((s) => s.instanceId === instanceId);
  if (!stashItem) throw new Error('未找到指定单位');
  stashItem.rotation = ((stashItem.rotation || 0) + 90) % 360;
  return next;
}

export function sellItem(state, instanceId) {
  if (!isPrepPhase(state)) throw new Error('当前不在整备阶段');
  const next = cloneState(state);
  const gIdx = next.placedItems.findIndex((p) => p.instanceId === instanceId);
  if (gIdx !== -1) {
    const [removed] = next.placedItems.splice(gIdx, 1);
    next.gold += Math.ceil(removed.investedGold * 0.6);
    return next;
  }
  const sIdx = next.stashItems.findIndex((s) => s.instanceId === instanceId);
  if (sIdx !== -1) {
    const [removed] = next.stashItems.splice(sIdx, 1);
    next.gold += Math.ceil(removed.investedGold * 0.6);
    return next;
  }
  throw new Error('未找到可撤编单位');
}

export function toggleLockShopSlot(state, slotIndex) {
  if (!isPrepPhase(state)) throw new Error('当前不在整备阶段');
  const next = cloneState(state);
  const offer = next.shopOffers[slotIndex];
  if (!offer) throw new Error('无效的补给槽位');
  if (!offer.sold) {
    offer.locked = !offer.locked;
  }
  return next;
}

export function refreshShop(state) {
  if (!isPrepPhase(state)) throw new Error('当前不在整备阶段');
  if (state.gold < state.refreshCost) throw new Error('军费不足');
  const next = cloneState(state);
  next.gold -= next.refreshCost;
  next.refreshCountInWave += 1;
  next.refreshCost = BASE_REFRESH_COST + Math.floor(next.refreshCountInWave / 2);
  const rolled = rollShopOffers(next.rngState, next.shopOffers, true);
  next.shopOffers = rolled.shopOffers;
  next.rngState = rolled.rngState;
  return next;
}

function getPairRelation(a, b) {
  const idA = a.itemId;
  const idB = b.itemId;
  const catA = ITEM_CATALOG[idA].category;
  const catB = ITEM_CATALOG[idB].category;

  const affects = (src, dst) => {
    const sId = src.itemId;
    const dId = dst.itemId;
    const dCat = ITEM_CATALOG[dId].category;
    const dActive = ITEM_CATALOG[dId].cooldownSec > 0;
    if (sId === 'ammo_depot' && dActive) return true;
    if (sId === 'command_radio' && dActive && ITEM_CATALOG[dId].baseDamage > 0) return true;
    if (sId === 'heavy_tank' && (dCat === 'infantry' || dCat === 'firepower' || dId === 'concrete_bunker')) return true;
    if (dId === 'infantry_squad' && (catA === 'infantry' || catA === 'armor') && src === a) return true;
    if (sId === 'infantry_squad' && (catB === 'infantry' || catB === 'armor') && dst === a) return false;
    if (dId === 'heavy_mg' && (catA === 'infantry' || catA === 'support') && src === a) return true;
    if (dId === 'flak_cannon' && (catA === 'artillery' || catA === 'support') && src === a) return true;
    if (dId === 'howitzer_155' && catA === 'support' && src === a) return true;
    if (dId === 'katyusha_mlrs' && (catA === 'artillery' || catA === 'support') && src === a) return true;
    if (dId === 'dive_bomber' && (sId === 'command_radio' || catA === 'airforce') && src === a) return true;
    if (dId === 'concrete_bunker' && (catA === 'infantry' || catA === 'armor') && src === a) return true;
    return false;
  };

  return affects(a, b) || affects(b, a);
}

export function computeGridSynergies(state) {
  const placed = [...state.placedItems].sort((a, b) =>
    a.row !== b.row ? a.row - b.row : a.col !== b.col ? a.col - b.col : a.instanceId.localeCompare(b.instanceId)
  );
  const cellMap = new Map();
  const occupiedByItem = new Map();

  for (const item of placed) {
    const cells = getOccupiedCells(item.itemId, item.row, item.col, item.rotation);
    occupiedByItem.set(item.instanceId, cells);
    for (const [r, c] of cells) {
      cellMap.set(`${r},${c}`, item);
    }
  }

  const neighborSets = new Map();
  for (const item of placed) {
    neighborSets.set(item.instanceId, new Set());
  }

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (const item of placed) {
    const cells = occupiedByItem.get(item.instanceId);
    const nSet = neighborSets.get(item.instanceId);
    for (const [r, c] of cells) {
      for (const [dr, dc] of dirs) {
        const nb = cellMap.get(`${r + dr},${c + dc}`);
        if (nb && nb.instanceId !== item.instanceId) {
          nSet.add(nb.instanceId);
        }
      }
    }
  }

  const itemById = new Map(placed.map((p) => [p.instanceId, p]));
  const links = [];
  const seenPairs = new Set();

  for (const a of placed) {
    for (const nbId of neighborSets.get(a.instanceId)) {
      const pairKey = a.instanceId < nbId ? `${a.instanceId}|${nbId}` : `${nbId}|${a.instanceId}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);
      const b = itemById.get(nbId);
      const active = getPairRelation(a, b);
      links.push({
        fromInstanceId: a.instanceId,
        toInstanceId: b.instanceId,
        active,
        type: 'synergy',
      });
    }
  }

  const itemStats = {};
  let estimatedDps = 0;
  let estimatedShieldPerSec = 0;
  const hasAirRelic = (state.relics || []).includes('aerial_supremacy');

  for (const item of placed) {
    const def = ITEM_CATALOG[item.itemId];
    const mult = LEVEL_MULTIPLIERS[item.level] || 1;
    const neighborIds = [...neighborSets.get(item.instanceId)];
    const neighbors = neighborIds.map((id) => itemById.get(id));
    const synergyTags = [];

    let dmg = def.baseDamage > 0 ? def.baseDamage * mult : 0;
    let shield = def.baseShield > 0 ? def.baseShield * mult : 0;
    let heal = def.baseHeal > 0 ? def.baseHeal * mult : 0;
    let cd = def.cooldownSec;
    let critChance = def.critChance + (hasAirRelic && def.baseDamage > 0 ? 0.1 : 0);
    let burnOnHit = item.itemId === 'howitzer_155' ? 2 : 0;
    let breakOnHit = item.itemId === 'katyusha_mlrs' ? 2 : 0;
    let suppressOnHit = item.itemId === 'heavy_mg' ? 1 : 0;

    let speedMult = 1.0;
    let dmgBonusPct = 0;
    let armorBonusPct = 0;

    for (const nb of neighbors) {
      if (nb.itemId === 'ammo_depot' && def.cooldownSec > 0) {
        const bonus = nb.level === 3 ? 0.7 : nb.level === 2 ? 0.45 : 0.25;
        speedMult += bonus;
        synergyTags.push(`弹药加速+${Math.round(bonus * 100)}%`);
      }
      if (nb.itemId === 'command_radio' && def.cooldownSec > 0 && def.baseDamage > 0) {
        const bonus = nb.level === 3 ? 0.9 : nb.level === 2 ? 0.55 : 0.3;
        dmgBonusPct += bonus;
        breakOnHit += 1;
        synergyTags.push(`电台校准+${Math.round(bonus * 100)}%伤/+1破甲`);
      }
      if (nb.itemId === 'heavy_tank' && (def.category === 'infantry' || def.category === 'firepower' || item.itemId === 'concrete_bunker')) {
        dmgBonusPct += 0.2;
        armorBonusPct += 0.2;
        synergyTags.push('重坦协同+20%攻防');
      }
    }

    if (item.itemId === 'infantry_squad') {
      const cnt = neighbors.filter((n) => {
        const c = ITEM_CATALOG[n.itemId].category;
        return c === 'infantry' || c === 'armor';
      }).length;
      if (cnt > 0) {
        cd = Math.max(0.45, cd * Math.pow(0.88, cnt));
        synergyTags.push(`集结快射×${cnt}`);
      }
    } else if (item.itemId === 'heavy_mg') {
      const cnt = neighbors.filter((n) => {
        const c = ITEM_CATALOG[n.itemId].category;
        return c === 'infantry' || c === 'support';
      }).length;
      if (cnt > 0) {
        dmg += 3 * cnt;
        suppressOnHit += cnt;
        synergyTags.push(`交叉火网+${cnt}压制`);
      }
    } else if (item.itemId === 'flak_cannon') {
      const cnt = neighbors.filter((n) => {
        const c = ITEM_CATALOG[n.itemId].category;
        return c === 'artillery' || c === 'support';
      }).length;
      if (cnt > 0) {
        critChance = Math.min(0.95, critChance + cnt * 0.15);
        synergyTags.push(`防空标定+${cnt * 15}%暴击`);
      }
    } else if (item.itemId === 'howitzer_155') {
      const cnt = neighbors.filter((n) => ITEM_CATALOG[n.itemId].category === 'support').length;
      if (cnt > 0) {
        dmg += 5 * cnt;
        burnOnHit += cnt;
        synergyTags.push(`高爆装药+${5 * cnt}伤/+${cnt}燃`);
      }
    } else if (item.itemId === 'katyusha_mlrs') {
      const cnt = neighbors.filter((n) => {
        const c = ITEM_CATALOG[n.itemId].category;
        return c === 'artillery' || c === 'support';
      }).length;
      if (cnt > 0) {
        dmgBonusPct += cnt * 0.18;
        breakOnHit += cnt;
        synergyTags.push(`炮群齐射+${cnt * 18}%伤/+${cnt}破甲`);
      }
    } else if (item.itemId === 'dive_bomber') {
      const cnt = neighbors.filter((n) => n.itemId === 'command_radio' || ITEM_CATALOG[n.itemId].category === 'airforce').length;
      if (cnt > 0) {
        critChance = Math.min(0.95, critChance + cnt * 0.2);
        synergyTags.push(`航空指引+${cnt * 20}%暴击`);
      }
    } else if (item.itemId === 'concrete_bunker') {
      const cnt = neighbors.filter((n) => {
        const c = ITEM_CATALOG[n.itemId].category;
        return c === 'infantry' || c === 'armor';
      }).length;
      if (cnt > 0) {
        shield += 5 * cnt;
        synergyTags.push(`联合工事+${5 * cnt}护甲`);
      }
    }

    const effectiveDamage = dmg > 0 ? Math.round(dmg * (1 + dmgBonusPct)) : 0;
    const effectiveShield = shield > 0 ? Math.round(shield * (1 + armorBonusPct)) : 0;
    const effectiveHeal = heal > 0 ? Math.round(heal) : 0;
    const effectiveCooldownSec = cd > 0 ? Number(Math.max(0.45, cd / speedMult).toFixed(2)) : 0;
    const effectiveCritChance = Number(Math.min(0.95, critChance).toFixed(2));

    itemStats[item.instanceId] = {
      instanceId: item.instanceId,
      itemId: item.itemId,
      level: item.level,
      neighborIds,
      synergyTags: [...new Set(synergyTags)],
      effectiveDamage,
      effectiveShield,
      effectiveHeal,
      effectiveCooldownSec,
      effectiveCritChance,
      critMultiplier: def.critMultiplier,
      burnOnHit,
      breakOnHit,
      suppressOnHit,
    };

    if (effectiveCooldownSec > 0) {
      if (effectiveDamage > 0) {
        estimatedDps += (effectiveDamage * (1 + effectiveCritChance * (def.critMultiplier - 1))) / effectiveCooldownSec;
      }
      if (effectiveShield > 0) {
        estimatedShieldPerSec += effectiveShield / effectiveCooldownSec;
      }
    }
  }

  return {
    links,
    itemStats,
    summary: {
      estimatedDps: Number(estimatedDps.toFixed(1)),
      estimatedShieldPerSec: Number(estimatedShieldPerSec.toFixed(1)),
      activeLinkCount: links.filter((l) => l.active).length,
    },
  };
}

export function simulateBattle(state) {
  const waveCfg = WAVE_CONFIGS[(state.wave || 1) - 1];
  if (!waveCfg) throw new Error(`无效波次: ${state.wave}`);

  const synergies = computeGridSynergies(state);
  const relics = new Set(state.relics || []);
  const hasBlitz = relics.has('blitz_mobilization');
  const hasAP = relics.has('armor_piercing_ammo');
  const hasBastion = relics.has('bastion_fortification');
  const hasTriage = relics.has('frontline_triage');
  const hasAirSupremacy = relics.has('aerial_supremacy');

  let playerHp = state.playerMaxHp;
  const playerMaxHp = state.playerMaxHp;
  let playerShield = hasBastion ? 25 : 0;
  const playerStartShield = playerShield;

  let enemyHp = waveCfg.maxHp;
  const enemyMaxHp = waveCfg.maxHp;
  let enemyShield = waveCfg.initialShield;
  let enemyBurn = 0;
  let enemyBreak = 0;
  let enemySuppress = 0;

  let rng = (state.rngState ^ (state.wave * 0x9e3779b1)) >>> 0 || 1;
  const rand = () => {
    const r = nextRng(rng);
    rng = r.rngState;
    return r.value;
  };

  // 按稳定空间顺序部署主动参战单元
  const activeUnits = [...state.placedItems]
    .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col !== b.col ? a.col - b.col : a.instanceId.localeCompare(b.instanceId)))
    .filter((p) => ITEM_CATALOG[p.itemId].cooldownSec > 0)
    .map((p) => {
      const stats = synergies.itemStats[p.instanceId];
      const def = ITEM_CATALOG[p.itemId];
      return {
        instanceId: p.instanceId,
        itemId: p.itemId,
        name: def.name,
        category: def.category,
        level: p.level,
        color: def.color,
        stats,
        timer: stats.effectiveCooldownSec,
        damage: 0,
        shield: 0,
        healing: 0,
      };
    });

  const timeline = [];
  let enemyAttackTimer = waveCfg.cooldownSec;
  let burnTickAccum = 0;
  let stormTickAccum = 0;
  let totalDamageDealt = 0;
  let totalShieldGained = playerStartShield;
  let time = 0;

  const applyPlayerDamageToEnemy = (rawDmg, armorPiercing = false) => {
    let remaining = rawDmg;
    if (!armorPiercing && enemyShield > 0) {
      const absorbed = Math.min(enemyShield, remaining);
      enemyShield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      enemyHp = Math.max(0, enemyHp - remaining);
    }
    totalDamageDealt += rawDmg;
  };

  const applyEnemyDamageToPlayer = (dmg) => {
    let remaining = dmg;
    if (playerShield > 0) {
      const absorbed = Math.min(playerShield, remaining);
      playerShield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      playerHp = Math.max(0, playerHp - remaining);
    }
  };

  const totalTicks = Math.round(MAX_BATTLE_SEC / BATTLE_TICK_SEC);
  for (let tick = 1; tick <= totalTicks; tick++) {
    time = Number((tick * BATTLE_TICK_SEC).toFixed(1));
    const blitzMult = hasBlitz && time <= 4.0 ? 1.35 : 1.0;

    // 1. 我方参战兵种冷却推进与火力触发
    for (const unit of activeUnits) {
      if (enemyHp <= 0 || playerHp <= 0) break;
      unit.timer -= BATTLE_TICK_SEC * blitzMult;
      if (unit.timer <= 1e-6) {
        unit.timer += unit.stats.effectiveCooldownSec;

        if (unit.stats.effectiveDamage > 0) {
          let dmg = unit.stats.effectiveDamage;
          let isAerialBonus = false;
          if (unit.itemId === 'flak_cannon' && (waveCfg.isAerial || waveCfg.isBoss)) {
            dmg = Math.round(dmg * 1.5);
            isAerialBonus = true;
          }
          if (hasAirSupremacy && (waveCfg.isAerial || waveCfg.isBoss)) {
            dmg = Math.round(dmg * 1.15);
          }
          const isCrit = rand() < unit.stats.effectiveCritChance;
          if (isCrit) {
            dmg = Math.round(dmg * unit.stats.critMultiplier);
          }
          if (enemyBreak > 0) {
            dmg += enemyBreak * (hasAP ? 2 : 1);
          }

          const armorPiercing = unit.itemId === 'dive_bomber';
          applyPlayerDamageToEnemy(dmg, armorPiercing);
          unit.damage += dmg;

          if (unit.stats.burnOnHit > 0) enemyBurn += unit.stats.burnOnHit;
          if (unit.stats.breakOnHit > 0) enemyBreak += unit.stats.breakOnHit;
          if (unit.stats.suppressOnHit > 0) enemySuppress += unit.stats.suppressOnHit;

          let triageHealed = 0;
          if (hasTriage) {
            triageHealed = Math.max(1, Math.floor(dmg * 0.1));
            const before = playerHp;
            playerHp = Math.min(playerMaxHp, playerHp + triageHealed);
            const actual = playerHp - before;
            unit.healing += actual;
            triageHealed = actual;
          }

          timeline.push({
            time,
            actor: 'player',
            type: 'weapon_hit',
            instanceId: unit.instanceId,
            itemId: unit.itemId,
            category: unit.category,
            damage: dmg,
            isCrit,
            isAerialBonus,
            armorPierced: armorPiercing,
            vampHealed: triageHealed,
            burnApplied: unit.stats.burnOnHit,
            shockApplied: unit.stats.breakOnHit,
            chillApplied: unit.stats.suppressOnHit,
            playerHp,
            playerShield,
            enemyHp,
            enemyShield,
            enemyBurn,
            enemyShock: enemyBreak,
            enemyChill: enemySuppress,
          });
        }

        if (unit.stats.effectiveShield > 0) {
          playerShield += unit.stats.effectiveShield;
          totalShieldGained += unit.stats.effectiveShield;
          unit.shield += unit.stats.effectiveShield;
          timeline.push({
            time,
            actor: 'player',
            type: 'shield_gain',
            instanceId: unit.instanceId,
            itemId: unit.itemId,
            shieldGained: unit.stats.effectiveShield,
            burnApplied: 0,
            shockApplied: 0,
            chillApplied: 0,
            playerHp,
            playerShield,
            enemyHp,
            enemyShield,
            enemyBurn,
            enemyShock: enemyBreak,
            enemyChill: enemySuppress,
          });
        }

        if (unit.stats.effectiveHeal > 0) {
          const prevHp = playerHp;
          playerHp = Math.min(playerMaxHp, playerHp + unit.stats.effectiveHeal);
          const healed = playerHp - prevHp;
          const overflow = unit.stats.effectiveHeal - healed;
          const bonusShield = overflow > 0 ? Math.floor(overflow * 0.5) : 0;
          if (bonusShield > 0) {
            playerShield += bonusShield;
            totalShieldGained += bonusShield;
          }
          unit.healing += healed;
          unit.shield += bonusShield;
          timeline.push({
            time,
            actor: 'player',
            type: 'gadget_heal',
            instanceId: unit.instanceId,
            itemId: unit.itemId,
            healed,
            shieldGained: bonusShield,
            burnApplied: 0,
            shockApplied: 0,
            chillApplied: 0,
            playerHp,
            playerShield,
            enemyHp,
            enemyShield,
            enemyBurn,
            enemyShock: enemyBreak,
            enemyChill: enemySuppress,
          });
        }
      }
    }

    if (enemyHp <= 0) break;

    // 2. 燃烧每 1.0 秒跳伤
    if (enemyBurn > 0) {
      burnTickAccum += BATTLE_TICK_SEC;
      if (burnTickAccum >= 1.0 - 1e-6) {
        burnTickAccum -= 1.0;
        const burnDmg = enemyBurn;
        applyPlayerDamageToEnemy(burnDmg, false);
        timeline.push({
          time,
          actor: 'status',
          type: 'burn_tick',
          damage: burnDmg,
          burnApplied: 0,
          shockApplied: 0,
          chillApplied: 0,
          playerHp,
          playerShield,
          enemyHp,
          enemyShield,
          enemyBurn,
          enemyShock: enemyBreak,
          enemyChill: enemySuppress,
        });
      }
    }

    if (enemyHp <= 0) break;

    // 3. 兽潮攻城节奏（受压制层数减速，最高减速 45%）
    const suppressSlow = Math.min(0.45, enemySuppress * 0.12);
    enemyAttackTimer -= BATTLE_TICK_SEC * (1 - suppressSlow);
    if (enemyAttackTimer <= 1e-6) {
      enemyAttackTimer += waveCfg.cooldownSec;
      const eDmg = waveCfg.attack;
      applyEnemyDamageToPlayer(eDmg);
      timeline.push({
        time,
        actor: 'enemy',
        type: 'enemy_attack',
        damage: eDmg,
        burnApplied: 0,
        shockApplied: 0,
        chillApplied: 0,
        playerHp,
        playerShield,
        enemyHp,
        enemyShield,
        enemyBurn,
        enemyShock: enemyBreak,
        enemyChill: enemySuppress,
      });
    }

    if (playerHp <= 0 || enemyHp <= 0) break;

    // 4. 18 秒炮火过热 / 狂暴风暴加时机制
    if (time >= OVERTIME_START_SEC) {
      stormTickAccum += BATTLE_TICK_SEC;
      if (stormTickAccum >= 1.0 - 1e-6) {
        stormTickAccum -= 1.0;
        const stormDmg = Math.round((time - OVERTIME_START_SEC + 1) * 4);
        applyEnemyDamageToPlayer(stormDmg);
        applyPlayerDamageToEnemy(stormDmg, false);
        timeline.push({
          time,
          actor: 'storm',
          type: 'overtime_storm',
          damage: stormDmg,
          burnApplied: 0,
          shockApplied: 0,
          chillApplied: 0,
          playerHp,
          playerShield,
          enemyHp,
          enemyShield,
          enemyBurn,
          enemyShock: enemyBreak,
          enemyChill: enemySuppress,
        });
      }
    }

    if (playerHp <= 0 || enemyHp <= 0) break;
  }

  const won = enemyHp <= 0 && playerHp > 0;
  const interestEarned = won && relics.has('wartime_bonds') ? Math.min(5, Math.floor(state.gold / 5)) : 0;
  const goldEarned = won ? waveCfg.baseRewardGold + interestEarned : Math.max(2, Math.floor(waveCfg.baseRewardGold * 0.5));

  const contributions = activeUnits.map((u) => ({
    instanceId: u.instanceId,
    itemId: u.itemId,
    name: u.name,
    level: u.level,
    color: u.color,
    damage: u.damage,
    shield: u.shield,
    healing: u.healing,
  }));

  return {
    wave: waveCfg.wave,
    won,
    durationSec: time,
    playerStartHp: state.playerMaxHp,
    playerStartShield,
    playerEndHp: playerHp,
    playerEndShield: playerShield,
    enemy: {
      name: waveCfg.name,
      title: waveCfg.title,
      isBoss: waveCfg.isBoss,
      isAerial: waveCfg.isAerial,
      maxHp: waveCfg.maxHp,
      initialShield: waveCfg.initialShield,
    },
    enemyEndHp: enemyHp,
    enemyEndShield: enemyShield,
    totalDamageDealt,
    totalShieldGained,
    goldEarned,
    interestEarned,
    contributions,
    timeline,
  };
}

export function runWaveBattle(state) {
  if (!isPrepPhase(state)) throw new Error('当前不在整备阶段');
  const report = simulateBattle(state);
  const next = cloneState(state);
  next.lastBattleReport = report;
  next.gold += report.goldEarned;

  if (report.won) {
    if (next.wave >= MAX_WAVES) {
      next.phase = 'victory';
      return next;
    }

    if (RELIC_WAVE_MILESTONES.includes(next.wave)) {
      const available = RELIC_IDS.filter((id) => !next.relics.includes(id));
      let curRng = next.rngState;
      const choices = [];
      const pool = [...available];
      while (choices.length < 3 && pool.length > 0) {
        const step = nextRng(curRng);
        curRng = step.rngState;
        const idx = Math.floor(step.value * pool.length);
        choices.push(pool.splice(idx, 1)[0]);
      }
      next.rngState = curRng;
      next.pendingRelicChoices = choices;
      next.phase = 'relic_draft';
      return next;
    }

    next.wave += 1;
  } else {
    next.lives = Math.max(0, next.lives - 1);
    if (next.lives <= 0) {
      next.phase = 'gameover';
      return next;
    }
  }

  // 刷新下波商店（保留锁定槽位并推进 rngState）
  next.refreshCountInWave = 0;
  next.refreshCost = BASE_REFRESH_COST;
  const rolled = rollShopOffers(next.rngState, next.shopOffers, true);
  next.shopOffers = rolled.shopOffers;
  next.rngState = rolled.rngState;
  next.phase = 'prep';
  return next;
}

export function chooseRelic(state, relicId) {
  if (state.phase !== 'relic_draft') throw new Error('当前不在军令勋章抉择阶段');
  if (!state.pendingRelicChoices.includes(relicId)) throw new Error('所选军令勋章不在候选中');

  const next = cloneState(state);
  next.relics.push(relicId);
  next.pendingRelicChoices = [];

  if (relicId === 'bastion_fortification') {
    next.playerMaxHp += 40;
  }

  next.wave += 1;
  next.refreshCountInWave = 0;
  next.refreshCost = BASE_REFRESH_COST;
  const rolled = rollShopOffers(next.rngState, next.shopOffers, true);
  next.shopOffers = rolled.shopOffers;
  next.rngState = rolled.rngState;
  next.phase = 'prep';
  return next;
}
