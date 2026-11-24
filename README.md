# 《星匣乱斗：口袋军械库》(Stargrid Arsenal) — A组（GPT/Codex 后端 + Antigravity 前端协作版）

本项目是双 AI 协作对比实验的 **A 组仓库**：
- **主策划 / 前端工程 / 契约设计**：Google Antigravity
- **后端核心逻辑引擎 (`src/backend/engine.mjs`)**：OpenAI GPT / Codex

## 快速启动与测试
```bash
# 运行后端契约测试（10 组）
node --test tests/contract.test.mjs

# 本地启动预览服务 (默认 http://127.0.0.1:4171)
node server.mjs

# 打包 TapTap H5 测试压缩包 (.zip)
node scripts/pack-taptap.mjs
```

## 给 Codex 的接入说明
请依次阅读 [`AGENTS.md`](AGENTS.md)、[`GAME_DESIGN.md`](GAME_DESIGN.md) 与 [`BACKEND_TASK.md`](BACKEND_TASK.md)，并在 `src/backend/engine.mjs` 中完成实现后开启 `IS_BACKEND_IMPLEMENTED = true`。
