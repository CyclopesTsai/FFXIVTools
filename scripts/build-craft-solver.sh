#!/usr/bin/env bash
# 編譯生產巨集計算用的求解器（raphael-rs 包裝層）到 vendor/craft-solver/
# 需要：rustup（stable）、wasm32-unknown-unknown target、wasm-pack
#   rustup target add wasm32-unknown-unknown
#   cargo install wasm-pack --locked
# 執行：bash scripts/build-craft-solver.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/vendor/craft-solver"

wasm-pack build "$ROOT/tools/craft-solver" \
    --release \
    --target web \
    --out-dir "$OUT" \
    --out-name craft_solver \
    --no-typescript \
    --no-pack

# wasm-pack 會在輸出資料夾放 .gitignore（內容為 *），刪掉才能 commit
rm -f "$OUT/.gitignore"

# 附上 raphael-rs 的授權（Apache-2.0）；tag 與 tools/craft-solver/Cargo.toml 一致
RAPHAEL_TAG="$(grep -oE 'tag = "[^"]+"' "$ROOT/tools/craft-solver/Cargo.toml" | head -1 | cut -d'"' -f2)"
curl -sSfL "https://raw.githubusercontent.com/KonaeAkira/raphael-rs/${RAPHAEL_TAG}/LICENSE" -o "$OUT/LICENSE-raphael-rs"

ls -la "$OUT"
