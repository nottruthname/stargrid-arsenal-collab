# 后端开发任务书（给 OpenAI GPT / Codex）

你好 Codex！这是双 AI 协作对比实验的 **A 组仓库**：
- **前端界面、矢量美术、WebAudio 音效与共享协议契约**已由 Antigravity 全部完成；
- **你的核心职责**：独立设计并完整实现后端核心逻辑引擎 [`src/backend/engine.mjs`](src/backend/engine.mjs)。

## 1. 开始之前必读文件
1. [`GAME_DESIGN.md`](GAME_DESIGN.md) —— 完整的数值公式、状态机流转、连携与战斗规则说明。
2. [`shared/protocol.mjs`](shared/protocol.mjs) —— 所有常量、8 件装备、5 件遗物与 10 波敌人的唯一数据源。
3. [`tests/contract.test.mjs`](tests/contract.test.mjs) —— 10 组自动验收契约测试。

## 2. 边界与约束（请严格遵守）
- **允许修改的文件**：
  - `src/backend/engine.mjs`（以及你可以按需补充新的后端单元测试到 `tests/` 目录）
- **严禁修改的文件**：
  - `shared/protocol.mjs`
  - `src/frontend/*`
  - `index.html`、`server.mjs`、`tests/contract.test.mjs`
- **纯函数要求**：所有状态更新函数（`buyShopItem`、`placeOrMoveItem`、`rotateItem`、`sellItem`、`toggleLockShopSlot`、`refreshShop`、`runWaveBattle`、`chooseRelic`）都不得直接修改传入的 `state`，请深拷贝后返回新状态。
- **零第三方依赖**：项目仅依赖原生 Node.js (ESM)，不要引入外部 npm 包。

## 3. 验收标准
完成 `src/backend/engine.mjs` 后：
1. 将 `export const IS_BACKEND_IMPLEMENTED = true;` 开启。
2. 运行测试命令：
   ```bash
   node --test tests/contract.test.mjs
   ```
3. 确认全部测试 **10/10 通过** 且无任何错误或警告，随后提交修改并发起 Pull Request（或推送到当前分支）。
