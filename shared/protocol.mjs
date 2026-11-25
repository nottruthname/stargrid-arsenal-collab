/**
 * 《星匣乱斗：口袋军械库》(Stargrid Arsenal)
 * 前后端共享契约与数值配置表 (Single Source of Truth)
 *
 * 警告：在 A 组双 AI 协作模式中，此文件为前后端边界契约，后端开发者不得擅自修改字段名或常量值。
 */

export const GAME_TITLE = '星匣乱斗：口袋军械库';
export const GAME_SUBTITLE = 'Stargrid Arsenal';

// 核心网格与局内经济常量
export const GRID_ROWS = 5;
export const GRID_COLS = 5;
export const MAX_STASH_SLOTS = 6;
export const SHOP_SLOTS = 3;

export const INITIAL_GOLD = 12;
export const INITIAL_LIVES = 3;
export const PLAYER_BASE_MAX_HP = 100;

export const BASE_REFRESH_COST = 2;
export const MAX_WAVES = 10;
export const MAX_ITEM_LEVEL = 3;

export const LEVEL_MULTIPLIERS = Object.freeze({
  1: 1.0,
  2: 1.8,
  3: 3.0,
});

export const BATTLE_TICK_SEC = 0.1;
export const OVERTIME_START_SEC = 18.0;
export const MAX_BATTLE_SEC = 35.0;

export const RELIC_WAVE_MILESTONES = Object.freeze([2, 5, 8]);

export const CATEGORY_META = Object.freeze({
  weapon: { id: 'weapon', label: '武器', color: '#38bdf8' },
  shield: { id: 'shield', label: '护盾', color: '#fbbf24' },
  core: { id: 'core', label: '晶核', color: '#fb7185' },
  gadget: { id: 'gadget', label: '装置', color: '#4ade80' },
});

export const RARITY_META = Object.freeze({
  common: { id: 'common', label: '普通', color: '#94a3b8', weight: 55 },
  rare: { id: 'rare', label: '稀有', color: '#38bdf8', weight: 32 },
  epic: { id: 'epic', label: '史诗', color: '#c084fc', weight: 13 },
});

/**
 * 8 种装备图鉴定义
 * baseCells 以 [rowOffset, colOffset] 表示（未旋转、已归一化到 [0,0] 左上基准）
 */
export const ITEM_CATALOG = Object.freeze({
  plasma_dagger: {
    id: 'plasma_dagger',
    name: '等离子短匕',
    category: 'weapon',
    rarity: 'common',
    cost: 3,
    baseCells: [[0, 0]],
    cooldownSec: 1.0,
    baseDamage: 8,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.10,
    critMultiplier: 1.6,
    color: '#38bdf8',
    description: '轻巧近战能量刃，高频穿刺。',
    synergyDesc: '每相邻1件【武器】，自身冷却缩短12%（最快0.45秒）。',
  },
  rail_rifle: {
    id: 'rail_rifle',
    name: '磁轨狙击枪',
    category: 'weapon',
    rarity: 'rare',
    cost: 5,
    baseCells: [[0, 0], [0, 1], [0, 2]],
    cooldownSec: 2.2,
    baseDamage: 24,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.15,
    critMultiplier: 1.85,
    color: '#818cf8',
    description: '三格超距电磁炮，单发高额暴击。',
    synergyDesc: '每相邻1颗【晶核】，暴击率+20%（上限95%）且基础伤害+6。',
  },
  arc_launcher: {
    id: 'arc_launcher',
    name: '电弧发射器',
    category: 'weapon',
    rarity: 'rare',
    cost: 5,
    baseCells: [[0, 0], [1, 0], [1, 1]],
    cooldownSec: 1.6,
    baseDamage: 14,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.12,
    critMultiplier: 1.65,
    color: '#c084fc',
    description: 'L型高压电弧器，命中附加2层【感电】。',
    synergyDesc: '每相邻1颗【晶核】或【极寒重甲】，额外附加+1层【感电】。',
  },
  aegis_buckler: {
    id: 'aegis_buckler',
    name: '宙斯盾牌',
    category: 'shield',
    rarity: 'common',
    cost: 4,
    baseCells: [[0, 0], [1, 0]],
    cooldownSec: 2.0,
    baseDamage: 0,
    baseShield: 14,
    baseHeal: 0,
    critChance: 0,
    critMultiplier: 1,
    color: '#fbbf24',
    description: '双格能量偏导盾，周期性展开护盾。',
    synergyDesc: '每相邻1件【武器】或【护盾】，每次触发额外+4护盾。',
  },
  cryo_plate: {
    id: 'cryo_plate',
    name: '极寒重甲',
    category: 'shield',
    rarity: 'epic',
    cost: 6,
    baseCells: [[0, 0], [0, 1], [1, 0], [1, 1]],
    cooldownSec: 2.6,
    baseDamage: 0,
    baseShield: 22,
    baseHeal: 0,
    critChance: 0,
    critMultiplier: 1,
    color: '#2dd4bf',
    description: '2×2重型冰霜装甲，展开护盾并施加1层【霜缓】。',
    synergyDesc: '使所有相邻【护盾】护盾量提升25%。',
  },
  solar_core: {
    id: 'solar_core',
    name: '耀斑晶核',
    category: 'core',
    rarity: 'rare',
    cost: 4,
    baseCells: [[0, 0]],
    cooldownSec: 0,
    baseDamage: 0,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0,
    critMultiplier: 1,
    color: '#fb7185',
    description: '被动增幅核心，炙热能量灌注周边武器。',
    synergyDesc: '相邻【武器】伤害提升35%/60%/95%（随星级），且命中附加1层【灼烧】。',
  },
  chrono_battery: {
    id: 'chrono_battery',
    name: '时序电池',
    category: 'core',
    rarity: 'rare',
    cost: 4,
    baseCells: [[0, 0], [0, 1]],
    cooldownSec: 0,
    baseDamage: 0,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0,
    critMultiplier: 1,
    color: '#34d399',
    description: '双格超频电池，加速周边主动装备。',
    synergyDesc: '相邻所有主动装备（武器/护盾/装置）冷却速度加快25%/45%/70%（随星级）。',
  },
  nano_medkit: {
    id: 'nano_medkit',
    name: '纳米急救仓',
    category: 'gadget',
    rarity: 'common',
    cost: 4,
    baseCells: [[0, 0]],
    cooldownSec: 2.5,
    baseDamage: 0,
    baseShield: 0,
    baseHeal: 9,
    critChance: 0,
    critMultiplier: 1,
    color: '#4ade80',
    description: '战地纳米修复仪，溢出治疗的50%转化为护盾。',
    synergyDesc: '每相邻1颗【晶核】，每次触发恢复量+5。',
  },
});

export const ITEM_IDS = Object.freeze(Object.keys(ITEM_CATALOG));

/**
 * 5 种核心遗物（第 2、5、8 波胜利后触发三选一）
 */
export const RELIC_CATALOG = Object.freeze({
  overclock_chip: {
    id: 'overclock_chip',
    name: '超频起搏芯片',
    color: '#38bdf8',
    description: '开局前4秒所有主动装备冷却速度额外加快35%。',
  },
  vampiric_coil: {
    id: 'vampiric_coil',
    name: '虹吸脉冲线圈',
    color: '#fb7185',
    description: '武器造成直接伤害时，恢复伤害值12%的生命（至少1点）。',
  },
  titanium_hull: {
    id: 'titanium_hull',
    name: '钛金复合装甲',
    color: '#fbbf24',
    description: '立即提升35点最大生命值，且每场战斗开局获得25点初始护盾。',
  },
  compound_interest: {
    id: 'compound_interest',
    name: '星际复利协议',
    color: '#34d399',
    description: '战斗胜利结算时，每持有5金币额外获得+1利息（最多+5）。',
  },
  high_voltage: {
    id: 'high_voltage',
    name: '高压电涌核心',
    color: '#c084fc',
    description: '敌人身上每层【感电】提供的额外受击伤害从+1提升至+2。',
  },
});

export const RELIC_IDS = Object.freeze(Object.keys(RELIC_CATALOG));

/**
 * 10 波次敌人配置
 */
export const WAVE_CONFIGS = Object.freeze([
  {
    wave: 1,
    name: '裂隙蚀骨虫群',
    title: '外环深渊虫潮',
    isBoss: false,
    maxHp: 65,
    attack: 7,
    cooldownSec: 1.8,
    initialShield: 0,
    baseRewardGold: 7,
    accentColor: '#38bdf8',
    traitDesc: '大批低阶深渊幼体从四面八方扑来，测试火力覆盖。',
  },
  {
    wave: 2,
    name: '酸液工兵集群',
    title: '腐蚀甲壳虫潮',
    isBoss: false,
    maxHp: 100,
    attack: 9,
    cooldownSec: 1.7,
    initialShield: 10,
    baseRewardGold: 8,
    accentColor: '#22d3ee',
    traitDesc: '甲壳覆盖生物几丁质护盾，需持续输出破甲击杀。',
  },
  {
    wave: 3,
    name: '疾袭镰爪兽潮',
    title: '高速撕裂兽群',
    isBoss: false,
    maxHp: 145,
    attack: 11,
    cooldownSec: 1.5,
    initialShield: 15,
    baseRewardGold: 9,
    accentColor: '#a78bfa',
    traitDesc: '扑击频率极高的掠食兽群，考验护盾与续航。',
  },
  {
    wave: 4,
    name: '熔核自爆虫潮',
    title: '高热突变集群',
    isBoss: false,
    maxHp: 195,
    attack: 14,
    cooldownSec: 1.7,
    initialShield: 20,
    baseRewardGold: 10,
    accentColor: '#fb923c',
    traitDesc: '体表携带灼热熔核的高伤害异虫潮。',
  },
  {
    wave: 5,
    name: '深渊母巢暴君',
    title: 'BOSS · 裂隙领主',
    isBoss: true,
    maxHp: 260,
    attack: 16,
    cooldownSec: 1.7,
    initialShield: 35,
    baseRewardGold: 12,
    accentColor: '#f43f5e',
    traitDesc: '第5波深渊首领！率领重甲虫卫围攻生存舱。',
  },
  {
    wave: 6,
    name: '暗影潜伏夜魔群',
    title: '高频猎杀兽潮',
    isBoss: false,
    maxHp: 330,
    attack: 17,
    cooldownSec: 1.3,
    initialShield: 30,
    baseRewardGold: 12,
    accentColor: '#c084fc',
    traitDesc: '高速突袭夜魔群，极寒霜缓对其移动与攻势克制明显。',
  },
  {
    wave: 7,
    name: '黑曜重甲巨兽潮',
    title: '厚壳吞噬集群',
    isBoss: false,
    maxHp: 410,
    attack: 20,
    cooldownSec: 1.6,
    initialShield: 55,
    baseRewardGold: 14,
    accentColor: '#2dd4bf',
    traitDesc: '55点生物重甲护盾，考验星级合成与暴击穿透。',
  },
  {
    wave: 8,
    name: '虚空雷霆撕裂群',
    title: '狂暴深渊主力',
    isBoss: false,
    maxHp: 500,
    attack: 22,
    cooldownSec: 1.4,
    initialShield: 60,
    baseRewardGold: 15,
    accentColor: '#818cf8',
    traitDesc: '狂暴异虫与重装撕裂者混编集群。',
  },
  {
    wave: 9,
    name: '终焉深潜尸潮',
    title: '高危湮灭兽海',
    isBoss: false,
    maxHp: 600,
    attack: 25,
    cooldownSec: 1.4,
    initialShield: 75,
    baseRewardGold: 16,
    accentColor: '#e879f9',
    traitDesc: '最终母体降临前的极限高压兽海。',
  },
  {
    wave: 10,
    name: '星渊古神 · 欧米茄',
    title: 'FINAL BOSS · 终极母体',
    isBoss: true,
    maxHp: 720,
    attack: 28,
    cooldownSec: 1.5,
    initialShield: 90,
    baseRewardGold: 20,
    accentColor: '#f59e0b',
    traitDesc: '终极深渊古神！必须在星渊风暴彻底失控前将其歼灭。',
  },
]);

export const REQUIRED_ENGINE_EXPORTS = Object.freeze([
  'IS_BACKEND_IMPLEMENTED',
  'createInitialState',
  'getOccupiedCells',
  'validatePlacement',
  'buyShopItem',
  'placeOrMoveItem',
  'rotateItem',
  'sellItem',
  'toggleLockShopSlot',
  'refreshShop',
  'computeGridSynergies',
  'simulateBattle',
  'runWaveBattle',
  'chooseRelic',
]);
