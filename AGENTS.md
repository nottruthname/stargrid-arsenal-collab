# AGENTS.md — 仓库协作边界约定

- **Repository Role**: Track A of Dual-AI Game Experiment (`Stargrid Arsenal` / 《星匣乱斗：口袋军械库》).
- **Backend Owner (GPT / Codex)**:
  - Owns `src/backend/engine.mjs` and optional extra unit tests under `tests/`.
  - Must read `GAME_DESIGN.md`, `BACKEND_TASK.md`, and `shared/protocol.mjs` before coding.
  - Must flip `IS_BACKEND_IMPLEMENTED = true` in `src/backend/engine.mjs` once ready.
  - Must verify with `node --test tests/contract.test.mjs` (0 failures).
- **Frontend & Design Owner (Antigravity)**:
  - Owns `GAME_DESIGN.md`, `shared/protocol.mjs`, `index.html`, and `src/frontend/*`.
- **Forbidden Edits for Backend Agents**:
  - Do NOT alter `shared/protocol.mjs`, `src/frontend/*`, `index.html`, or `tests/contract.test.mjs`.
  - Do NOT add `node_modules` or external dependencies.
