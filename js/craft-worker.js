// 生產巨集計算：在背景執行 raphael-rs 求解器（WASM，單執行緒）
// Module worker；URL 上的 ?v= 會一併帶給 WASM 檔做快取更新。
// 訊息：{ type: 'solve', id, input } → { type: 'done', id, result } | { type: 'error', id, message }

const v = new URL(self.location.href).searchParams.get('v') || '';
const q = v ? `?v=${encodeURIComponent(v)}` : '';
const base = new URL('../vendor/craft-solver/', self.location.href);

const ready = (async () => {
    const mod = await import(new URL(`craft_solver.js${q}`, base).href);
    await mod.default({ module_or_path: new URL(`craft_solver_bg.wasm${q}`, base) });
    return mod;
})();

self.onmessage = async (e) => {
    const { type, id, input } = e.data || {};
    if (type !== 'solve') return;
    try {
        const mod = await ready;
        const t0 = performance.now();
        const result = mod.solve(input);
        self.postMessage({ type: 'done', id, result, ms: performance.now() - t0 });
    } catch (err) {
        self.postMessage({ type: 'error', id, message: String((err && err.message) || err) });
    }
};
