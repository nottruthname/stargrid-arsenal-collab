/**
 * 《铁血防线：1944》
 * 二战复古卡牌基地防兽潮 — 前后端共享契约与数值配置表
 */

export const GAME_TITLE = '铁血防线：1944';
export const GAME_SUBTITLE = '二战实体卡牌 · 钢铁要塞战兽潮';

// 核心沙盘与局内经济常量
export const GRID_ROWS = 5;
export const GRID_COLS = 5;
export const MAX_STASH_SLOTS = 6;
export const SHOP_SLOTS = 3;

export const INITIAL_GOLD = 12;
export const INITIAL_LIVES = 3;
export const PLAYER_BASE_MAX_HP = 120;

export const BASE_REFRESH_COST = 2;
export const MAX_WAVES = 10;
export const MAX_ITEM_LEVEL = 3;

export const LEVEL_MULTIPLIERS = Object.freeze({
  1: 1.0,
  2: 1.85,
  3: 3.1,
});

export const BATTLE_TICK_SEC = 0.1;
export const OVERTIME_START_SEC = 18.0;
export const MAX_BATTLE_SEC = 35.0;

export const RELIC_WAVE_MILESTONES = Object.freeze([2, 5, 8]);

export const CATEGORY_META = Object.freeze({
  infantry: { id: 'infantry', label: '步兵', color: '#4d6b3c' },
  firepower: { id: 'firepower', label: '火力', color: '#8c5a32' },
  artillery: { id: 'artillery', label: '重炮', color: '#a8431b' },
  armor: { id: 'armor', label: '装甲', color: '#3b573b' },
  airforce: { id: 'airforce', label: '空军', color: '#3b5978' },
  support: { id: 'support', label: '后勤', color: '#785c2b' },
});

export const RARITY_META = Object.freeze({
  common: { id: 'common', label: '常规', color: '#6b7280', weight: 52 },
  rare: { id: 'rare', label: '精锐', color: '#b45309', weight: 34 },
  epic: { id: 'epic', label: '王牌', color: '#991b1b', weight: 14 },
});

/**
 * 10 种经典二战兵种与后勤卡牌定义
 * baseCells 以 [rowOffset, colOffset] 表示（未旋转、已归一化到 [0,0] 左上基准）
 */
export const ITEM_CATALOG = Object.freeze({
  infantry_squad: {
    id: 'infantry_squad',
    name: '突击步兵排',
    category: 'infantry',
    rarity: 'common',
    cost: 3,
    baseCells: [[0, 0]],
    cooldownSec: 1.0,
    baseDamage: 9,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.12,
    critMultiplier: 1.6,
    color: '#4d6b3c',
    description: '战壕突击步兵编组，快速齐射阻击先锋兽群。',
    synergyDesc: '每相邻1张【步兵】或【装甲】，自身装填冷却缩短12%（最快0.45秒）。',
  },
  heavy_mg: {
    id: 'heavy_mg',
    name: '马克沁重机枪',
    category: 'firepower',
    rarity: 'common',
    cost: 4,
    baseCells: [[0, 0], [0, 1]],
    cooldownSec: 1.4,
    baseDamage: 14,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.10,
    critMultiplier: 1.55,
    color: '#8c5a32',
    description: '双格重机枪火力点，高频扫射并附加1层【压制】。',
    synergyDesc: '每相邻1张【步兵】或【后勤】，额外+1层【压制】且单轮伤害+3。',
  },
  flak_cannon: {
    id: 'flak_cannon',
    name: '双联高射炮',
    category: 'firepower',
    rarity: 'rare',
    cost: 5,
    baseCells: [[0, 0], [1, 0]],
    cooldownSec: 1.6,
    baseDamage: 16,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.15,
    critMultiplier: 1.7,
    color: '#6b7280',
    description: '高炮防空阵地，对空袭飞兽与首领造成1.5倍破空重击。',
    synergyDesc: '每相邻1张【重炮】或【后勤】，自身暴击率额外+15%（上限95%）。',
  },
  howitzer_155: {
    id: 'howitzer_155',
    name: '155毫米榴弹炮',
    category: 'artillery',
    rarity: 'rare',
    cost: 5,
    baseCells: [[0, 0], [1, 0], [1, 1]],
    cooldownSec: 2.0,
    baseDamage: 22,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.14,
    critMultiplier: 1.75,
    color: '#b45309',
    description: 'L型重野战火炮，轰击兽群并附加2层【燃烧】。',
    synergyDesc: '每相邻1张【后勤】卡牌，额外附加+1层【燃烧】且伤害+5。',
  },
  katyusha_mlrs: {
    id: 'katyusha_mlrs',
    name: '喀秋莎火箭炮',
    category: 'artillery',
    rarity: 'epic',
    cost: 6,
    baseCells: [[0, 0], [0, 1], [0, 2]],
    cooldownSec: 2.4,
    baseDamage: 28,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.16,
    critMultiplier: 1.8,
    color: '#991b1b',
    description: '三格齐射多管火箭车，洗地轰炸并附加2层【破甲】。',
    synergyDesc: '每相邻1张【重炮】或【后勤】，自身伤害+18%且额外+1层【破甲】。',
  },
  heavy_tank: {
    id: 'heavy_tank',
    name: '重型主战坦克',
    category: 'armor',
    rarity: 'epic',
    cost: 7,
    baseCells: [[0, 0], [0, 1], [1, 0], [1, 1]],
    cooldownSec: 2.2,
    baseDamage: 22,
    baseShield: 16,
    baseHeal: 0,
    critChance: 0.15,
    critMultiplier: 1.8,
    color: '#3b573b',
    description: '2×2钢铁巨无霸，开炮歼敌同时为要塞构筑16点前线护甲。',
    synergyDesc: '自身光环使相邻所有【步兵】【火力】【后勤】伤害与护甲提升20%。',
  },
  dive_bomber: {
    id: 'dive_bomber',
    name: '俯冲轰炸机',
    category: 'airforce',
    rarity: 'rare',
    cost: 6,
    baseCells: [[0, 0], [0, 1]],
    cooldownSec: 2.5,
    baseDamage: 26,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0.22,
    critMultiplier: 1.9,
    color: '#3b5978',
    description: '呼啸掠过战场的轰炸编队，航弹直接穿透护甲打击兽群本体。',
    synergyDesc: '每相邻1张【指挥电台】或【空军】，暴击率额外+20%（上限95%）。',
  },
  concrete_bunker: {
    id: 'concrete_bunker',
    name: '钢筋混凝土碉堡',
    category: 'support',
    rarity: 'common',
    cost: 4,
    baseCells: [[0, 0], [1, 0]],
    cooldownSec: 2.1,
    baseDamage: 0,
    baseShield: 15,
    baseHeal: 6,
    critChance: 0,
    critMultiplier: 1,
    color: '#57534e',
    description: '双格永久工事，展开15点护甲并抢修6点基地耐久（溢出50%转护甲）。',
    synergyDesc: '每相邻1张【步兵】或【装甲】，每次修筑额外+5护甲。',
  },
  ammo_depot: {
    id: 'ammo_depot',
    name: '野战弹药库',
    category: 'support',
    rarity: 'rare',
    cost: 4,
    baseCells: [[0, 0]],
    cooldownSec: 0,
    baseDamage: 0,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0,
    critMultiplier: 1,
    color: '#a16207',
    description: '战地前线补给站，源源不断输送炮弹与油料。',
    synergyDesc: '相邻所有主动作战卡牌装填冷却速度加快25%/45%/70%（随星级）。',
  },
  command_radio: {
    id: 'command_radio',
    name: '前线指挥电台',
    category: 'support',
    rarity: 'rare',
    cost: 4,
    baseCells: [[0, 0]],
    cooldownSec: 0,
    baseDamage: 0,
    baseShield: 0,
    baseHeal: 0,
    critChance: 0,
    critMultiplier: 1,
    color: '#7c2d12',
    description: '高精度炮兵校准电台，协调周边部队集火兽群弱点。',
    synergyDesc: '相邻所有作战部队伤害提升30%/55%/90%（随星级），且攻击附加1层【破甲】。',
  },
});

export const ITEM_IDS = Object.freeze(Object.keys(ITEM_CATALOG));

/**
 * 6 枚战区军令勋章（第 2、5、8 波胜利后三选一）
 */
export const RELIC_CATALOG = Object.freeze({
  blitz_mobilization: {
    id: 'blitz_mobilization',
    name: '闪电战总动员',
    color: '#b45309',
    description: '开战前4秒我方全体主动单位装填冷却速度额外加快35%。',
  },
  armor_piercing_ammo: {
    id: 'armor_piercing_ammo',
    name: '穿甲曳光弹药',
    color: '#991b1b',
    description: '兽潮身上每层【破甲】提供的额外受击伤害从+1提升至+2。',
  },
  bastion_fortification: {
    id: 'bastion_fortification',
    name: '要塞永久化工程',
    color: '#57534e',
    description: '立即提升40点基地最大耐久，且每场战斗开局获得25点初始护甲。',
  },
  wartime_bonds: {
    id: 'wartime_bonds',
    name: '战时军需公债',
    color: '#a16207',
    description: '波次胜利结算时，每持有5军费额外获得+1利息（最多+5）。',
  },
  frontline_triage: {
    id: 'frontline_triage',
    name: '战地救护纵队',
    color: '#4d6b3c',
    description: '我方火力造成直接伤害时，抢修相当于伤害值10%的基地耐久（至少1点）。',
  },
  aerial_supremacy: {
    id: 'aerial_supremacy',
    name: '制空火力校准',
    color: '#3b5978',
    description: '全军暴击率额外+10%，且对空袭飞兽波次与首领伤害额外提升15%。',
  },
});

export const RELIC_IDS = Object.freeze(Object.keys(RELIC_CATALOG));

/**
 * 10 波次变异兽潮配置（以近战狂潮+第3/6/9波空中飞兽突袭为主，无远程憋屈白嫖）
 */
export const WAVE_CONFIGS = Object.freeze([
  {
    wave: 1,
    name: '荒原饿狼群',
    title: '外围荒原突袭',
    isBoss: false,
    isAerial: false,
    maxHp: 65,
    attack: 7,
    cooldownSec: 1.8,
    initialShield: 0,
    baseRewardGold: 7,
    accentColor: '#6b7280',
    traitDesc: '敏捷凶残的变异狼群沿着泥泞战区扑向铁丝网阵地。',
  },
  {
    wave: 2,
    name: '狂躁蛮牛群',
    title: '厚甲冲锋兽潮',
    isBoss: false,
    isAerial: false,
    maxHp: 105,
    attack: 9,
    cooldownSec: 1.7,
    initialShield: 12,
    baseRewardGold: 8,
    accentColor: '#8c5a32',
    traitDesc: '体表生出骨质厚甲的巨型蛮牛集群，正全力撞击前线工事。',
  },
  {
    wave: 3,
    name: '腐翼空袭群',
    title: '低空飞兽突袭 · 防空克制',
    isBoss: false,
    isAerial: true,
    maxHp: 145,
    attack: 11,
    cooldownSec: 1.5,
    initialShield: 15,
    baseRewardGold: 9,
    accentColor: '#3b5978',
    traitDesc: '成群盘旋俯冲的变异飞兽！部署双联高射炮可触发1.5倍破空重击。',
  },
  {
    wave: 4,
    name: '毒囊狂暴兽潮',
    title: '高攻突变兽群',
    isBoss: false,
    isAerial: false,
    maxHp: 200,
    attack: 14,
    cooldownSec: 1.6,
    initialShield: 22,
    baseRewardGold: 10,
    accentColor: '#a8431b',
    traitDesc: '狂躁嗜血的突变兽群，重机枪压制与碉堡工事防线缺一不可。',
  },
  {
    wave: 5,
    name: '铁甲猛犸王',
    title: '战区首领 · 重装巨兽',
    isBoss: true,
    isAerial: false,
    maxHp: 280,
    attack: 16,
    cooldownSec: 1.7,
    initialShield: 45,
    baseRewardGold: 13,
    accentColor: '#991b1b',
    traitDesc: '第5波战区巨兽首领！身披厚重岩甲踏碎前线战壕，急需重炮轰炸破甲。',
  },
  {
    wave: 6,
    name: '黑羽夜枭飞兽群',
    title: '高速空袭集群 · 防空克制',
    isBoss: false,
    isAerial: true,
    maxHp: 350,
    attack: 18,
    cooldownSec: 1.35,
    initialShield: 35,
    baseRewardGold: 13,
    accentColor: '#3b5978',
    traitDesc: '高速扑击要塞顶部的夜袭飞兽群，防空高炮与压制火力至关重要。',
  },
  {
    wave: 7,
    name: '黑曜铁犀重兽潮',
    title: '重甲攻城兽群',
    isBoss: false,
    isAerial: false,
    maxHp: 440,
    attack: 21,
    cooldownSec: 1.6,
    initialShield: 65,
    baseRewardGold: 15,
    accentColor: '#3b573b',
    traitDesc: '拥有65点超厚生物骨甲的犀牛重兽群，推荐俯冲轰炸机无视护甲直击。',
  },
  {
    wave: 8,
    name: '深渊裂地兽主力',
    title: '狂暴混合兽海',
    isBoss: false,
    isAerial: false,
    maxHp: 530,
    attack: 23,
    cooldownSec: 1.4,
    initialShield: 75,
    baseRewardGold: 16,
    accentColor: '#7c2d12',
    traitDesc: '源源不断涌出的兽海主力集群，需要高星重坦与火炮阵地协同抵挡。',
  },
  {
    wave: 9,
    name: '炼狱翼龙空袭阵',
    title: '高空毁灭飞兽海 · 防空克制',
    isBoss: false,
    isAerial: true,
    maxHp: 640,
    attack: 26,
    cooldownSec: 1.4,
    initialShield: 85,
    baseRewardGold: 18,
    accentColor: '#b45309',
    traitDesc: '终局前夕遮天蔽日的翼龙空袭编队！防空炮网与重炮洗地迎击。',
  },
  {
    wave: 10,
    name: '混沌灾厄巨龙',
    title: '终极首领 · 末日巨兽皇',
    isBoss: true,
    isAerial: true,
    maxHp: 780,
    attack: 29,
    cooldownSec: 1.5,
    initialShield: 110,
    baseRewardGold: 22,
    accentColor: '#991b1b',
    traitDesc: '终极陆空双栖末日巨兽皇！全军集火、在炮火过热前将其彻底击坠！',
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
