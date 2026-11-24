/**
 * 《星匣乱斗：口袋军械库》(Stargrid Arsenal)
 * A组（GPT/Codex 后端 + Antigravity 前端）后端引擎契约桩文件
 *
 * 【给 GPT / Codex 的施工说明】：
 * 1. 请先阅读根目录的 `GAME_DESIGN.md`、`BACKEND_TASK.md` 与 `shared/protocol.mjs`。
 * 2. 在本文件中完整实现以下全部导出函数，并将 `IS_BACKEND_IMPLEMENTED` 改为 `true`。
 * 3. 请保持所有函数为纯函数（不要直接 mutate 传入的 state 参数）。
 * 4. 严禁修改 `shared/protocol.mjs` 与 `src/frontend/*` 中的任何文件。
 * 5. 完成后运行 `node --test tests/contract.test.mjs`，确保全部契约测试 100% 通过。
 */

export const IS_BACKEND_IMPLEMENTED = false;

function notImplemented(name) {
  throw new Error(`TODO_CODEX: 请在 src/backend/engine.mjs 中实现 ${name}()`);
}

/**
 * 创建新局初始状态（必须支持 seed 确定性生成）
 * @param {number} [seed=20261124]
 * @returns {object} GameState
 */
export function createInitialState(seed = 20261124) {
  void seed;
  notImplemented('createInitialState');
}

/**
 * 计算指定装备在 (row, col, rotation) 顺时针旋转并归一化后占据的网格坐标数组 [[r, c], ...]
 * @param {string} itemId
 * @param {number} row
 * @param {number} col
 * @param {number} [rotation=0]
 * @returns {Array<[number, number]>}
 */
export function getOccupiedCells(itemId, row, col, rotation = 0) {
  void itemId;
  void row;
  void col;
  void rotation;
  notImplemented('getOccupiedCells');
}

/**
 * 校验网格放置是否合法（越界、多格重叠、或与唯一同ID同星级且<3星装备二合一合成）
 * @param {object} state
 * @param {{ itemId: string, level?: number, row: number, col: number, rotation?: number, ignoreInstanceId?: string|null }} params
 * @returns {{ valid: boolean, reason: string, occupiedCells: Array<[number, number]>, overlappingInstanceIds: string[], mergeTargetInstanceId: string|null }}
 */
export function validatePlacement(state, params) {
  void state;
  void params;
  notImplemented('validatePlacement');
}

/**
 * 从商店购买装备：placement 为 null 时放入暂存舱；传入 { row, col, rotation } 时直接上盘或合成
 * @param {object} state
 * @param {number} slotIndex
 * @param {{ row: number, col: number, rotation?: number, toGrid?: boolean }|null} [placement=null]
 * @returns {object} nextState
 */
export function buyShopItem(state, slotIndex, placement = null) {
  void state;
  void slotIndex;
  void placement;
  notImplemented('buyShopItem');
}

/**
 * 在网格与暂存舱之间移动、放置或触发二合一升星合成
 * @param {object} state
 * @param {{ instanceId: string, toGrid: boolean, row?: number, col?: number, rotation?: number, targetStashInstanceId?: string|null }} params
 * @returns {object} nextState
 */
export function placeOrMoveItem(state, params) {
  void state;
  void params;
  notImplemented('placeOrMoveItem');
}

/**
 * 顺时针旋转装备 90°（位于网格内时需支持贴边微调避让且不得误触合成）
 * @param {object} state
 * @param {string} instanceId
 * @returns {object} nextState
 */
export function rotateItem(state, instanceId) {
  void state;
  void instanceId;
  notImplemented('rotateItem');
}

/**
 * 出售装备（返还 Math.ceil(investedGold * 0.6) 金币）
 * @param {object} state
 * @param {string} instanceId
 * @returns {object} nextState
 */
export function sellItem(state, instanceId) {
  void state;
  void instanceId;
  notImplemented('sellItem');
}

/**
 * 锁定或解锁商店槽位
 * @param {object} state
 * @param {number} slotIndex
 * @returns {object} nextState
 */
export function toggleLockShopSlot(state, slotIndex) {
  void state;
  void slotIndex;
  notImplemented('toggleLockShopSlot');
}

/**
 * 消耗 refreshCost 刷新未锁定的商店槽位，并按规则递增刷新费用
 * @param {object} state
 * @returns {object} nextState
 */
export function refreshShop(state) {
  void state;
  notImplemented('refreshShop');
}

/**
 * 计算网格正交相邻连携（多格装备之间仅计为相邻 1 次）及每件装备的最终实战数值
 * @param {object} state
 * @returns {{ links: Array<object>, itemStats: Record<string, object>, summary: object }}
 */
export function computeGridSynergies(state) {
  void state;
  notImplemented('computeGridSynergies');
}

/**
 * 纯函数确定性模拟当前波次完整战斗（0.1s Tick，返回完整 BattleReport 与 timeline）
 * @param {object} state
 * @returns {object} BattleReport
 */
export function simulateBattle(state) {
  void state;
  notImplemented('simulateBattle');
}

/**
 * 执行当前波次战斗并推进游戏状态（含奖励、利息、遗物三选一触发、胜利/失败、扣命）
 * @param {object} state
 * @returns {object} nextState
 */
export function runWaveBattle(state) {
  void state;
  notImplemented('runWaveBattle');
}

/**
 * 在 relic_draft 阶段选择遗物并推进至下一波 prep 阶段
 * @param {object} state
 * @param {string} relicId
 * @returns {object} nextState
 */
export function chooseRelic(state, relicId) {
  void state;
  void relicId;
  notImplemented('chooseRelic');
}
