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
  RELIC_IDS,
  RELIC_WAVE_MILESTONES,
  SHOP_SLOTS,
  WAVE_CONFIGS,
} from '../../shared/protocol.mjs';

export const IS_BACKEND_IMPLEMENTED = true;

const ROTATION_OFFSETS = [
  [0, 0], [0, -1], [-1, 0], [0, 1], [1, 0],
  [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -2], [-2, 0],
];
const BATTERY_BONUSES = [0, 0.25, 0.45, 0.7];
const SOLAR_BONUSES = [0, 0.35, 0.6, 0.95];

const shopPools = Object.values(RARITY_META).map(({ id, weight }) => ({
  weight,
  items: ITEM_IDS.filter((itemId) => ITEM_CATALOG[itemId].rarity === id),
}));
const shopWeight = shopPools.reduce((sum, pool) => sum + pool.weight, 0);

function createRng(seed) {
  let state = seed >>> 0;
  return {
    get state() { return state; },
    next() {
      state = (state + 0x6d2b79f5) >>> 0;
      let bits = Math.imul(state ^ (state >>> 15), state | 1);
      bits ^= bits + Math.imul(bits ^ (bits >>> 7), bits | 61);
      return ((bits ^ (bits >>> 14)) >>> 0) / 0x100000000;
    },
  };
}

function refillShop(state) {
  const rng = createRng(state.rngState);
  state.shopOffers = Array.from({ length: SHOP_SLOTS }, (_, slotIndex) => {
    const offer = state.shopOffers[slotIndex];
    if (offer?.locked && !offer.sold) return offer;

    let roll = rng.next() * shopWeight;
    for (const { weight, items } of shopPools) {
      if (roll < weight) {
        const itemId = items[Math.floor((roll / weight) * items.length)];
        return { slotIndex, itemId, cost: ITEM_CATALOG[itemId].cost, sold: false, locked: false };
      }
      roll -= weight;
    }
  });
  state.rngState = rng.state;
}

export function createInitialState(seed = 20261124) {
  const state = {
    seed: seed >>> 0,
    rngState: seed >>> 0,
    nextInstanceSeq: 2,
    wave: 1,
    phase: 'prep',
    gold: INITIAL_GOLD,
    lives: INITIAL_LIVES,
    playerMaxHp: PLAYER_BASE_MAX_HP,
    refreshCountThisWave: 0,
    refreshCost: BASE_REFRESH_COST,
    placedItems: [{
      instanceId: 'item_1',
      itemId: 'plasma_dagger',
      level: 1,
      row: 2,
      col: 2,
      rotation: 0,
      investedGold: ITEM_CATALOG.plasma_dagger.cost,
    }],
    stashItems: [],
    shopOffers: [],
    relics: [],
    pendingRelicChoices: [],
    lastBattleReport: null,
  };
  refillShop(state);
  return state;
}

function normalizeRotation(rotation) {
  if (!Number.isInteger(rotation) || rotation % 90 !== 0) {
    throw new Error('装备只能以 90° 为单位旋转');
  }
  return ((rotation % 360) + 360) % 360;
}

export function getOccupiedCells(itemId, row, col, rotation = 0) {
  if (!Object.hasOwn(ITEM_CATALOG, itemId)) throw new Error('未知装备');
  let cells = ITEM_CATALOG[itemId].baseCells;
  const turns = normalizeRotation(rotation) / 90;
  for (let turn = 0; turn < turns; turn++) {
    cells = cells.map(([r, c]) => [c, -r]);
  }
  const minRow = Math.min(...cells.map(([r]) => r));
  const minCol = Math.min(...cells.map(([, c]) => c));
  return cells.map(([r, c]) => [row + (r - minRow), col + (c - minCol)])
    .sort(([a, b], [c, d]) => a - c || b - d);
}

function itemCells(item) {
  return getOccupiedCells(item.itemId, item.row, item.col, item.rotation);
}

function canMerge(source, target) {
  return source.itemId === target.itemId &&
    source.level === target.level && target.level < MAX_ITEM_LEVEL;
}

export function validatePlacement(state, {
  itemId, level = 1, row, col, rotation = 0, ignoreInstanceId = null,
}) {
  const occupiedCells = getOccupiedCells(itemId, row, col, rotation);
  const result = { occupiedCells, overlappingInstanceIds: [], mergeTargetInstanceId: null };
  if (occupiedCells.some(([r, c]) =>
    !Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS
  )) {
    return { ...result, valid: false, reason: 'out_of_bounds' };
  }

  const overlaps = state.placedItems.filter((item) =>
    item.instanceId !== ignoreInstanceId &&
    itemCells(item).some(([r, c]) => occupiedCells.some(([a, b]) => r === a && c === b))
  );
  result.overlappingInstanceIds = overlaps.map((item) => item.instanceId);
  if (overlaps.length === 0) return { ...result, valid: true, reason: 'ok' };
  if (overlaps.length === 1 && canMerge({ itemId, level }, overlaps[0])) {
    return { ...result, valid: true, reason: 'merge', mergeTargetInstanceId: overlaps[0].instanceId };
  }
  return { ...result, valid: false, reason: 'overlap' };
}

function cloneForPrep(state) {
  if (state.phase !== 'prep') throw new Error('当前不在整备阶段');
  return structuredClone(state);
}

function getOffer(state, slotIndex) {
  const offer = state.shopOffers.find((entry) => entry.slotIndex === slotIndex);
  if (!offer || offer.sold) throw new Error('该商店槽位没有可用装备');
  return offer;
}

function locateItem(state, instanceId) {
  for (const items of [state.placedItems, state.stashItems]) {
    const index = items.findIndex((item) => item.instanceId === instanceId);
    if (index >= 0) return { items, index, item: items[index] };
  }
  throw new Error('找不到这件装备');
}

function mergeInto(target, source) {
  target.level++;
  target.investedGold += source.investedGold;
}

function putOnGrid(state, item, { row, col, rotation = item.rotation }, source = null) {
  const check = validatePlacement(state, { ...item, row, col, rotation, ignoreInstanceId: item.instanceId });
  if (!check.valid) {
    throw new Error(check.reason === 'out_of_bounds' ? '装备超出网格边界' : '装备与网格内的装备重叠');
  }
  if (check.mergeTargetInstanceId) {
    const target = state.placedItems.find((entry) => entry.instanceId === check.mergeTargetInstanceId);
    mergeInto(target, item);
    if (source) source.items.splice(source.index, 1);
    return;
  }

  const placed = { ...item, row, col, rotation: normalizeRotation(rotation) };
  if (source?.items === state.placedItems) {
    source.items[source.index] = placed;
  } else {
    if (source) source.items.splice(source.index, 1);
    state.placedItems.push(placed);
  }
}

function putInStash(state, item) {
  if (state.stashItems.length >= MAX_STASH_SLOTS) throw new Error('暂存舱已满');
  const { instanceId, itemId, level, rotation, investedGold } = item;
  state.stashItems.push({ instanceId, itemId, level, rotation, investedGold });
}

export function buyShopItem(state, slotIndex, placement = null) {
  const next = cloneForPrep(state);
  const offer = getOffer(next, slotIndex);
  if (next.gold < offer.cost) throw new Error('金币不足');

  const item = {
    instanceId: 'item_' + next.nextInstanceSeq++,
    itemId: offer.itemId,
    level: 1,
    rotation: 0,
    investedGold: offer.cost,
  };
  if (placement && placement.toGrid !== false) putOnGrid(next, item, placement);
  else putInStash(next, item);
  next.gold -= offer.cost;
  offer.sold = true;
  offer.locked = false;
  return next;
}

export function placeOrMoveItem(state, { instanceId, toGrid, row, col, rotation, targetStashInstanceId }) {
  const next = cloneForPrep(state);
  const source = locateItem(next, instanceId);
  const { item, items, index } = source;
  if (toGrid) {
    putOnGrid(next, item, { row, col, rotation }, source);
  } else if (targetStashInstanceId != null && targetStashInstanceId !== instanceId) {
    const target = next.stashItems.find((entry) => entry.instanceId === targetStashInstanceId);
    if (!target || !canMerge(item, target)) throw new Error('只有同种同星级且未满星的装备可以合成');
    mergeInto(target, item);
    items.splice(index, 1);
  } else if (items === next.placedItems) {
    putInStash(next, item);
    items.splice(index, 1);
  }
  return next;
}

export function rotateItem(state, instanceId) {
  const next = cloneForPrep(state);
  const { item, items } = locateItem(next, instanceId);
  const rotation = normalizeRotation(item.rotation + 90);
  if (items === next.stashItems) {
    item.rotation = rotation;
    return next;
  }
  for (const [dr, dc] of ROTATION_OFFSETS) {
    const row = item.row + dr;
    const col = item.col + dc;
    const check = validatePlacement(next, { ...item, row, col, rotation, ignoreInstanceId: instanceId });
    if (check.valid && !check.mergeTargetInstanceId) {
      Object.assign(item, { row, col, rotation });
      return next;
    }
  }
  throw new Error('周围没有足够的空间旋转装备');
}

export function sellItem(state, instanceId) {
  const next = cloneForPrep(state);
  const { item, items, index } = locateItem(next, instanceId);
  items.splice(index, 1);
  next.gold += Math.ceil(item.investedGold * 0.6);
  return next;
}

export function toggleLockShopSlot(state, slotIndex) {
  const next = cloneForPrep(state);
  const offer = getOffer(next, slotIndex);
  offer.locked = !offer.locked;
  return next;
}

export function refreshShop(state) {
  const next = cloneForPrep(state);
  if (next.gold < next.refreshCost) throw new Error('金币不足');
  next.gold -= next.refreshCost;
  refillShop(next);
  next.refreshCountThisWave++;
  next.refreshCost = BASE_REFRESH_COST + Math.floor(next.refreshCountThisWave / 2);
  return next;
}

function itemCategory(item) {
  return ITEM_CATALOG[item.itemId].category;
}

function hasDirectedSynergy(item, neighbor) {
  const category = itemCategory(item);
  const neighborCategory = itemCategory(neighbor);
  switch (item.itemId) {
    case 'chrono_battery': return ITEM_CATALOG[neighbor.itemId].cooldownSec > 0;
    case 'solar_core': return neighborCategory === 'weapon';
    case 'cryo_plate': return neighborCategory === 'shield';
    case 'plasma_dagger': return neighborCategory === 'weapon';
    case 'rail_rifle':
    case 'nano_medkit': return neighborCategory === 'core';
    case 'arc_launcher': return neighborCategory === 'core' || neighbor.itemId === 'cryo_plate';
    case 'aegis_buckler': return neighborCategory === 'weapon' || neighborCategory === category;
    default: return false;
  }
}

function computeItemStats(item, neighbors) {
  const def = ITEM_CATALOG[item.itemId];
  const multiplier = LEVEL_MULTIPLIERS[item.level];
  const cores = neighbors.filter((neighbor) => itemCategory(neighbor) === 'core');
  const weapons = neighbors.filter((neighbor) => itemCategory(neighbor) === 'weapon');
  const shields = neighbors.filter((neighbor) => itemCategory(neighbor) === 'shield');
  const solar = cores.filter((neighbor) => neighbor.itemId === 'solar_core');
  const cryo = shields.filter((neighbor) => neighbor.itemId === 'cryo_plate');
  const batteryBonus = cores.reduce((sum, neighbor) =>
    sum + (neighbor.itemId === 'chrono_battery' ? BATTERY_BONUSES[neighbor.level] : 0), 0);
  const solarBonus = solar.reduce((sum, neighbor) => sum + SOLAR_BONUSES[neighbor.level], 0);
  const isWeapon = def.category === 'weapon';
  const railBonus = item.itemId === 'rail_rifle' ? cores.length : 0;
  const bucklerBonus = item.itemId === 'aegis_buckler' ? 4 * (weapons.length + shields.length) : 0;
  const medkitBonus = item.itemId === 'nano_medkit' ? 5 * cores.length : 0;
  const daggerFactor = item.itemId === 'plasma_dagger' ? Math.max(0.45, 1 - 0.12 * weapons.length) : 1;
  const synergyTags = new Set();
  for (const neighbor of neighbors) {
    if (hasDirectedSynergy(neighbor, item) || hasDirectedSynergy(item, neighbor)) {
      synergyTags.add(ITEM_CATALOG[neighbor.itemId].name);
    }
  }

  return {
    neighborIds: neighbors.map((neighbor) => neighbor.instanceId),
    synergyTags: [...synergyTags],
    effectiveCooldownSec: def.cooldownSec === 0 ? 0
      : Number(Math.max(0.45, def.cooldownSec / (1 + batteryBonus) * daggerFactor).toFixed(2)),
    effectiveDamage: Math.round((def.baseDamage + 6 * railBonus) * multiplier * (1 + solarBonus)),
    effectiveShield: Math.round((def.baseShield * multiplier + bucklerBonus) * (1 + 0.25 * cryo.length)),
    effectiveHeal: Math.round(def.baseHeal * multiplier + medkitBonus),
    critChance: Math.min(0.95, def.critChance + 0.2 * railBonus),
    critMultiplier: def.critMultiplier,
    burnOnHit: isWeapon ? solar.length : 0,
    shockOnHit: item.itemId === 'arc_launcher' ? 2 + cores.length + cryo.length : 0,
    chillOnTrigger: item.itemId === 'cryo_plate' ? 1 : 0,
  };
}

export function computeGridSynergies(state) {
  const items = state.placedItems.map((item) => ({ item, cells: itemCells(item), neighbors: [] }));
  const links = [];
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (!a.cells.some(([r, c]) => b.cells.some(([s, t]) => Math.abs(r - s) + Math.abs(c - t) === 1))) continue;
      a.neighbors.push(b.item);
      b.neighbors.push(a.item);
      links.push({
        fromInstanceId: a.item.instanceId,
        toInstanceId: b.item.instanceId,
        active: hasDirectedSynergy(a.item, b.item) || hasDirectedSynergy(b.item, a.item),
      });
    }
  }
  return {
    links,
    itemStats: Object.fromEntries(items.map(({ item, neighbors }) => [
      item.instanceId, computeItemStats(item, neighbors),
    ])),
    summary: { adjacentPairs: links.length, activeLinks: links.filter((link) => link.active).length },
  };
}

const TICKS_PER_SECOND = Math.round(1 / BATTLE_TICK_SEC);
const OVERTIME_START_TICK = OVERTIME_START_SEC * TICKS_PER_SECOND;
const MAX_BATTLE_TICKS = MAX_BATTLE_SEC * TICKS_PER_SECOND;
const COOLDOWN_EPSILON = 1e-9;

function absorbDamage(combatant, damage) {
  const absorbed = Math.min(combatant.shield, damage);
  combatant.shield -= absorbed;
  combatant.hp = Math.max(0, combatant.hp - (damage - absorbed));
}

function healPlayer(player, amount, maxHp) {
  const restored = Math.min(maxHp - player.hp, amount);
  player.hp += restored;
  return restored;
}

function selectRelicChoices(state) {
  const rng = createRng(state.rngState);
  const pool = RELIC_IDS.filter((id) => !state.relics.includes(id));
  state.pendingRelicChoices = [];
  while (pool.length && state.pendingRelicChoices.length < 3) {
    const index = Math.floor(rng.next() * pool.length);
    state.pendingRelicChoices.push(pool.splice(index, 1)[0]);
  }
  state.rngState = rng.state;
}

export function simulateBattle(state) {
  const enemyConfig = WAVE_CONFIGS[state.wave - 1];
  if (!enemyConfig) throw new Error('无效的波次');
  const relics = new Set(state.relics);
  const rng = createRng(state.rngState ^ state.wave);
  const playerStartShield = relics.has('titanium_hull') ? 25 : 0;
  const player = { hp: state.playerMaxHp, shield: playerStartShield };
  const enemy = { hp: enemyConfig.maxHp, shield: enemyConfig.initialShield, burn: 0, shock: 0, chill: 0 };
  const { itemStats } = computeGridSynergies(state);
  const equipment = state.placedItems.map(({ instanceId, itemId, level }) => ({
    stats: itemStats[instanceId],
    progress: 0,
    burnStacks: 0,
    contribution: {
      instanceId, itemId, level,
      name: ITEM_CATALOG[itemId].name,
      color: ITEM_CATALOG[itemId].color,
      damage: 0,
      shield: 0,
      healing: 0,
    },
  }));
  const activeEquipment = equipment.filter(({ stats }) => stats.effectiveCooldownSec > 0);
  const timeline = [];
  const shockDamagePerStack = relics.has('high_voltage') ? 2 : 1;
  let time = 0;
  let enemyProgress = 0;
  let totalDamageDealt = 0;
  let totalShieldGained = playerStartShield;
  let totalHealing = 0;

  function record(type, details = {}) {
    timeline.push({
      time, type, burnApplied: 0, shockApplied: 0, chillApplied: 0, ...details,
      playerHp: player.hp, playerShield: player.shield,
      enemyHp: enemy.hp, enemyShield: enemy.shield,
      enemyBurn: enemy.burn, enemyShock: enemy.shock, enemyChill: enemy.chill,
    });
  }

  for (let tick = 1; tick <= MAX_BATTLE_TICKS && player.hp > 0 && enemy.hp > 0; tick++) {
    time = tick / TICKS_PER_SECOND;
    const enemySpeed = 1 - Math.min(0.45, enemy.chill * 0.15);
    enemyProgress += BATTLE_TICK_SEC * enemySpeed;

    if (tick % (2 * TICKS_PER_SECOND) === 0 && enemy.shock > 0) {
      enemy.shock--;
      record('shock_decay');
    }
    if (tick % TICKS_PER_SECOND === 0 && enemy.burn > 0) {
      const damage = enemy.burn * 3;
      absorbDamage(enemy, damage);
      totalDamageDealt += damage;
      for (const item of activeEquipment) item.contribution.damage += item.burnStacks * 3;
      record('burn_tick', { damage });
    }
    if (enemy.hp === 0) break;

    if (tick >= OVERTIME_START_TICK && (tick - OVERTIME_START_TICK) % TICKS_PER_SECOND === 0) {
      const damage = 2 + Math.floor((time - OVERTIME_START_SEC) * 1.5);
      absorbDamage(player, damage);
      absorbDamage(enemy, damage);
      record('overtime_storm', { damage });
      if (player.hp === 0 || enemy.hp === 0) break;
    }

    const playerSpeed = time <= 4 && relics.has('overclock_chip') ? 1.35 : 1;
    for (const item of activeEquipment) {
      const { stats, contribution } = item;
      item.progress += BATTLE_TICK_SEC * playerSpeed;
      if (item.progress + COOLDOWN_EPSILON < stats.effectiveCooldownSec) continue;
      item.progress = Math.max(0, item.progress - stats.effectiveCooldownSec);
      const source = { instanceId: contribution.instanceId, itemId: contribution.itemId };

      if (stats.effectiveDamage > 0) {
        const isCrit = rng.next() < stats.critChance;
        const directDamage = Math.round(stats.effectiveDamage * (isCrit ? stats.critMultiplier : 1));
        const damage = directDamage + enemy.shock * shockDamagePerStack;
        absorbDamage(enemy, damage);
        contribution.damage += damage;
        totalDamageDealt += damage;
        enemy.burn += stats.burnOnHit;
        item.burnStacks += stats.burnOnHit;
        enemy.shock += stats.shockOnHit;
        const vampHealed = relics.has('vampiric_coil')
          ? healPlayer(player, Math.max(1, Math.round(damage * 0.12)), state.playerMaxHp)
          : 0;
        contribution.healing += vampHealed;
        totalHealing += vampHealed;
        record('weapon_hit', {
          ...source, damage, isCrit, vampHealed, burnApplied: stats.burnOnHit, shockApplied: stats.shockOnHit,
        });
      } else if (stats.effectiveShield > 0) {
        const shieldGained = stats.effectiveShield;
        player.shield += shieldGained;
        contribution.shield += shieldGained;
        totalShieldGained += shieldGained;
        enemy.chill += stats.chillOnTrigger;
        record('shield_gain', { ...source, shieldGained, chillApplied: stats.chillOnTrigger });
      } else if (stats.effectiveHeal > 0) {
        const healed = healPlayer(player, stats.effectiveHeal, state.playerMaxHp);
        const shieldGained = Math.floor((stats.effectiveHeal - healed) / 2);
        player.shield += shieldGained;
        contribution.healing += healed;
        contribution.shield += shieldGained;
        totalHealing += healed;
        totalShieldGained += shieldGained;
        record('gadget_heal', { ...source, healed, shieldGained });
      }
      if (enemy.hp === 0) break;
    }

    if (enemy.hp > 0 && enemyProgress + COOLDOWN_EPSILON >= enemyConfig.cooldownSec) {
      enemyProgress = Math.max(0, enemyProgress - enemyConfig.cooldownSec);
      absorbDamage(player, enemyConfig.attack);
      record('enemy_attack', { damage: enemyConfig.attack });
    }
  }

  const won = enemy.hp === 0 && player.hp > 0;
  const { baseRewardGold } = enemyConfig;
  const interestEarned = won && relics.has('compound_interest') ? Math.min(5, Math.floor(state.gold / 5)) : 0;
  return {
    wave: state.wave,
    enemy: { ...enemyConfig },
    won,
    durationSec: time,
    playerStartHp: state.playerMaxHp,
    playerStartShield,
    playerEndHp: player.hp,
    playerEndShield: player.shield,
    enemyEndHp: enemy.hp,
    enemyEndShield: enemy.shield,
    goldEarned: won ? baseRewardGold : Math.max(4, Math.floor(baseRewardGold * 0.6)),
    interestEarned,
    totalDamageDealt,
    totalShieldGained,
    totalHealing,
    contributions: equipment.map(({ contribution }) => contribution).sort((a, b) =>
      (b.damage + b.shield + b.healing) - (a.damage + a.shield + a.healing)
    ),
    timeline,
  };
}

function prepareRound(state) {
  state.phase = 'prep';
  state.refreshCountThisWave = 0;
  state.refreshCost = BASE_REFRESH_COST;
  state.pendingRelicChoices = [];
  refillShop(state);
}

export function runWaveBattle(state) {
  const next = cloneForPrep(state);
  const report = simulateBattle(next);
  next.lastBattleReport = report;
  next.gold += report.goldEarned + report.interestEarned;

  if (!report.won) {
    next.lives--;
    if (next.lives <= 0) next.phase = 'gameover';
    else prepareRound(next);
  } else if (next.wave === MAX_WAVES) {
    next.phase = 'victory';
  } else if (RELIC_WAVE_MILESTONES.includes(next.wave)) {
    selectRelicChoices(next);
    next.phase = 'relic_draft';
  } else {
    next.wave++;
    prepareRound(next);
  }
  return next;
}

export function chooseRelic(state, relicId) {
  if (state.phase !== 'relic_draft') throw new Error('当前没有可选遗物');
  if (!state.pendingRelicChoices.includes(relicId)) throw new Error('该遗物不在本次候选中');
  const next = structuredClone(state);
  next.relics.push(relicId);
  if (relicId === 'titanium_hull') next.playerMaxHp += 35;
  next.wave++;
  prepareRound(next);
  return next;
}
