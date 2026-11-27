// 生產巨集計算：純計算（配方係數反查、基礎值換算、技能名稱、巨集分段）
// 不碰 DOM；瀏覽器下掛在 window.CraftCalc，node 下可 require 做測試。
(function (root) {
    'use strict';

    const MAX_MACRO_LINES = 15;
    const FLAG_EXPERT = 1;

    // raphael-rs Action 名稱 → 繁中技能名（巨集用）
    // 來源：raphael-rs v0.29.3 raphael-data/src/locales.rs 的 action_name_tw / macro_name
    const ACTION_NAMES = {
        BasicSynthesis: '製作',
        BasicTouch: '加工',
        MasterMend: '精修',
        Observe: '觀察',
        TricksOfTheTrade: '秘訣',
        WasteNot: '儉約',
        Veneration: '崇敬',
        StandardTouch: '中級加工',
        GreatStrides: '闊步',
        Innovation: '改革',
        WasteNot2: '長期儉約',
        ByregotsBlessing: '比爾格的祝福',
        PreciseTouch: '集中加工',
        MuscleMemory: '堅信',
        CarefulSynthesis: '模範製作',
        Manipulation: '掌握',
        PrudentTouch: '儉約加工',
        AdvancedTouch: '上級加工',
        Reflect: '閒靜',
        PreparatoryTouch: '坯料加工',
        Groundwork: '坯料製作',
        DelicateSynthesis: '精密製作',
        IntensiveSynthesis: '集中製作',
        TrainedEye: '工匠的神速技巧',
        HeartAndSoul: '專心致志',
        PrudentSynthesis: '儉約製作',
        TrainedFinesse: '工匠的神技',
        RefinedTouch: '精煉加工',
        QuickInnovation: '快速改革',
        ImmaculateMend: '巧奪天工',
        TrainedPerfection: '工匠的絕技',
        StellarSteadyHand: '任務指令2',
        RapidSynthesis: '高速製作',
        HastyTouch: '倉促',
        // 冒進在巨集裡要寫「倉促」，遊戲會在專注狀態下自動變成冒進
        DaringTouch: '倉促',
    };

    // 畫面上顯示用（與巨集用名稱不同的才列）
    const DISPLAY_NAMES = {
        DaringTouch: '冒進',
        StellarSteadyHand: 'Stellar Steady Hand',
    };

    function macroName(action) { return ACTION_NAMES[action] || action; }
    function displayName(action) { return DISPLAY_NAMES[action] || ACTION_NAMES[action] || action; }

    // ---------- 配方係數反查 ----------

    let index = null;
    function buildIndex(data) {
        const map = new Map();
        for (const r of data.recipes) {
            const key = `${r[0]}|${r[1]}|${r[2]}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(r);
        }
        return { data, map };
    }

    function getIndex() {
        const data = root.CRAFT_DATA;
        if (!data) return null;
        if (!index || index.data !== data) index = buildIndex(data);
        return index;
    }

    function infoFrom(data, coefIdx, rlv, rlvJobLevel, stars, flags, scaling) {
        const c = data.coefs[coefIdx];
        return {
            progressDivider: c[0],
            qualityDivider: c[1],
            progressModifier: c[2],
            qualityModifier: c[3],
            rlv,
            rlvJobLevel,
            stars,
            expert: (flags & FLAG_EXPERT) !== 0,
            scaling,
        };
    }

    const sameCoef = (a, b) => a.progressDivider === b.progressDivider && a.qualityDivider === b.qualityDivider
        && a.progressModifier === b.progressModifier && a.qualityModifier === b.qualityModifier
        && a.rlvJobLevel === b.rlvJobLevel && a.expert === b.expert;

    /**
     * 以製作筆記上的數值反查配方等級係數
     * @returns {{status:'ok', info} | {status:'notFound'} | {status:'noData'}}
     */
    function lookupRecipe({ difficulty, quality, durability, level }) {
        const idx = getIndex();
        if (!idx) return { status: 'noData' };
        const data = idx.data;
        const found = [];

        for (const r of idx.map.get(`${difficulty}|${quality}|${durability}`) || []) {
            found.push(infoFrom(data, r[3], r[4], r[5], r[6], r[7], false));
        }

        // 等級同步配方：依玩家等級（不超過該配方的同步上限）換算
        const s = data.scaling;
        if (s && level > 0) {
            for (const f of s.factors) {
                const lv = Math.min(level, f[4], s.levels.length - 1);
                const rlvId = s.levels[lv];
                const row = rlvId && s.rlvs[rlvId];
                if (!row) continue;
                const d = Math.floor(row[0] * f[0] / 100);
                const q = Math.floor(row[1] * f[1] / 100);
                const u = Math.floor(s.durability * f[2] / 100);
                if (d === difficulty && q === quality && u === durability) {
                    found.push(infoFrom(data, row[2], rlvId, row[3], row[4], f[3], true));
                }
            }
        }

        if (!found.length) return { status: 'notFound' };
        // 產生腳本已保證不會衝突；保險起見若真的不同就當作找不到
        if (found.some(f => !sameCoef(f, found[0]))) {
            if (typeof console !== 'undefined') console.warn('CraftCalc: ambiguous recipe', found);
            return { status: 'notFound' };
        }
        return { status: 'ok', info: found[0] };
    }

    // ---------- 基礎值 ----------

    // 與 raphael-rs 相同：以 f32 計算後取整
    const f32 = Math.fround;
    function baseValues({ craftsmanship, control, level }, info) {
        let p = f32(f32(f32(craftsmanship * 10) / info.progressDivider) + 2);
        let q = f32(f32(f32(control * 10) / info.qualityDivider) + 35);
        if (level <= info.rlvJobLevel) {
            p = f32(f32(p * info.progressModifier) / 100);
            q = f32(f32(q * info.qualityModifier) / 100);
        }
        return { baseProgress: Math.floor(p), baseQuality: Math.floor(q) };
    }

    // 「製作」的效率：31 級起 120%
    function basicSynthesisEfficiency(level) { return level < 31 ? 100 : 120; }

    // 通常狀態、無 Buff 時第一下「製作」「加工」的數值（給玩家在遊戲裡核對）
    function firstStepPreview(base, level) {
        return {
            synthesis: Math.floor(base.baseProgress * basicSynthesisEfficiency(level) / 100),
            touch: base.baseQuality,
        };
    }

    // 實測值反推基礎值（找不到配方時的備案）
    function baseFromMeasured({ synthesis, touch, level }) {
        return {
            baseProgress: Math.round(synthesis * 100 / basicSynthesisEfficiency(level)),
            baseQuality: Math.round(touch),
        };
    }

    // 工匠的神速技巧：非專家配方，且玩家等級 ≥ 配方等級 + 10
    function trainedEyeAllowed(level, info) {
        return !!info && !info.expert && level >= info.rlvJobLevel + 10;
    }

    // ---------- 巨集分段 ----------

    function quoteName(name) { return /\s/.test(name) ? `"${name}"` : name; }

    /**
     * @param steps [{ action, time }]
     * @param opts { lock, notify: 'auto'|'on'|'off', sound, method: 'avg'|'fill', extraWait }
     * @returns string[]（每段巨集全文）
     */
    function buildMacros(steps, opts = {}) {
        const n = steps.length;
        if (!n) return [];
        const lock = !!opts.lock;
        const extraWait = Math.max(0, Math.floor(Number(opts.extraWait) || 0));
        const sound = opts.sound || '';
        const capBase = MAX_MACRO_LINES - (lock ? 1 : 0);

        let notify;
        if (opts.notify === 'on') notify = true;
        else if (opts.notify === 'off') notify = false;
        // 自動：加上完成提示不會讓段數變多時才加
        else notify = Math.ceil(n / capBase) === Math.ceil(n / (capBase - 1));

        const cap = capBase - (notify ? 1 : 0);
        const chunks = Math.ceil(n / cap);
        const size = opts.method === 'fill' ? cap : Math.ceil(n / chunks);

        const macros = [];
        for (let i = 0; i < chunks; i++) {
            const part = steps.slice(i * size, Math.min(n, (i + 1) * size));
            if (!part.length) break;
            const lines = [];
            if (lock) lines.push('/mlock');
            for (const s of part) {
                lines.push(`/ac ${quoteName(macroName(s.action))} <wait.${(s.time || 3) + extraWait}>`);
            }
            if (notify) {
                const last = i === chunks - 1;
                lines.push(`/e ${last ? '製作完成' : `巨集${i + 1}完成`}${sound}`);
            }
            macros.push(lines.join('\n'));
        }
        return macros;
    }

    const api = {
        MAX_MACRO_LINES,
        ACTION_NAMES,
        macroName,
        displayName,
        lookupRecipe,
        baseValues,
        basicSynthesisEfficiency,
        firstStepPreview,
        baseFromMeasured,
        trainedEyeAllowed,
        buildMacros,
    };
    root.CraftCalc = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
