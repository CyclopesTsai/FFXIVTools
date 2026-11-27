// 生產巨集計算畫面（掛在巨集管理工具的右側檢視區）
// 流程：角色數值＋製作筆記數值 → 反查配方係數 → Worker 跑 raphael-rs 求解 → 分段成 /ac 巨集 → 複製或匯入
// 注意：輸入值與巨集內容一律不送進 GA。
window.CraftApp = (function () {
    'use strict';

    const M = window.MacroApp;
    const C = window.CraftCalc;
    if (!M || !C) return null;
    const h = M.h;

    const LS_KEY = 'ffxiv-macro:craft';
    // 設定格式版本：2 起「已學會掌握」預設不勾，舊版存下的預設值不沿用
    const SETTINGS_VERSION = 2;
    const WORKER_VERSION = (document.currentScript && document.currentScript.dataset.workerVersion) || '1';
    const LONG_RUN_SEC = 60;

    const CHAR_FIELDS = [
        { key: 'level', label: '等級', min: 1, max: 100 },
        { key: 'craftsmanship', label: '作業精度', min: 1, max: 9999 },
        { key: 'control', label: '加工精度', min: 1, max: 9999 },
        { key: 'cp', label: 'CP', min: 1, max: 999 },
    ];
    const RECIPE_FIELDS = [
        { key: 'difficulty', label: '難度', min: 1, max: 65535 },
        { key: 'durability', label: '耐久', min: 1, max: 200 },
        { key: 'maxQuality', label: '最高品質', min: 0, max: 65535 },
        { key: 'initialQuality', label: '初期品質', min: 0, max: 65535 },
    ];
    const ALL_FIELDS = [...CHAR_FIELDS, ...RECIPE_FIELDS];

    const SOUNDS = [['', '無音效'], [' <se>', '隨機 <se>'], ...Array.from({ length: 16 }, (_, i) => [` <se.${i + 1}>`, `<se.${i + 1}>`])];

    const ERROR_TEXT = {
        NoSolution: '無法完成製作：作業精度、CP 或耐久不足以推滿進展。',
        SearchQueueCapacityExceeded: '搜尋範圍太大，請降低目標品質後再試。',
        Interrupted: '計算被中斷。',
    };

    // ---------- 狀態 ----------

    const defaults = () => ({
        values: { level: '100', craftsmanship: '', control: '', cp: '', difficulty: '', durability: '', maxQuality: '', initialQuality: '0' },
        specialist: false,
        manipulation: false,
        targetAuto: true,
        targetQuality: '',
        adversarial: false,
        backload: false,
        stellar: '0',
        manualMode: 'coef',
        manualCoef: '',
        measuredSynth: '',
        measuredTouch: '',
        exportOpts: { lock: false, notify: 'auto', sound: ' <se.1>', method: 'avg', extraWait: 0 },
    });

    const s = load();
    const run = {
        status: 'idle',      // idle | running | done | error
        result: null,        // { input, ctx, output }
        error: '',
        detail: '',
        worker: null,
        id: 0,
        startedAt: 0,
        timer: null,
        recalc: null,        // 重新計算模式：{ entryId }；從側欄進入時為 null
    };
    let ui = null;

    function load() {
        const d = defaults();
        try {
            const raw = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
            if (raw && typeof raw === 'object') {
                Object.assign(d.values, pickStrings(raw.values, Object.keys(d.values)));
                const keys = ['specialist', 'targetAuto', 'adversarial', 'backload'];
                if (raw.v >= SETTINGS_VERSION) keys.push('manipulation');
                for (const k of keys) {
                    if (typeof raw[k] === 'boolean') d[k] = raw[k];
                }
                for (const k of ['targetQuality', 'stellar', 'manualCoef', 'measuredSynth', 'measuredTouch']) {
                    if (typeof raw[k] === 'string') d[k] = raw[k];
                }
                if (raw.manualMode === 'coef' || raw.manualMode === 'measure') d.manualMode = raw.manualMode;
                const e = raw.exportOpts || {};
                if (typeof e.lock === 'boolean') d.exportOpts.lock = e.lock;
                if (['auto', 'on', 'off'].includes(e.notify)) d.exportOpts.notify = e.notify;
                if (SOUNDS.some(([v]) => v === e.sound)) d.exportOpts.sound = e.sound;
                if (['avg', 'fill'].includes(e.method)) d.exportOpts.method = e.method;
                if ([0, 1, 2].includes(e.extraWait)) d.exportOpts.extraWait = e.extraWait;
            }
        } catch (e) { /* 用預設值 */ }
        return d;
    }

    function pickStrings(obj, keys) {
        const out = {};
        if (!obj || typeof obj !== 'object') return out;
        for (const k of keys) if (typeof obj[k] === 'string') out[k] = obj[k];
        return out;
    }

    function save() {
        try { localStorage.setItem(LS_KEY, JSON.stringify({ ...s, v: SETTINGS_VERSION })); } catch (e) { /* 無法儲存就算了 */ }
    }

    // ---------- 計算輸入 ----------

    function parseInt10(v) {
        const t = String(v ?? '').trim();
        return /^\d+$/.test(t) ? Number(t) : NaN;
    }

    function num(key) { return parseInt10(s.values[key]); }

    function fieldError(f) {
        const raw = String(s.values[f.key] ?? '').trim();
        if (raw === '') return '必填';
        const n = parseInt10(raw);
        if (!Number.isFinite(n)) return '請輸入整數';
        if (n < f.min || n > f.max) return `${f.min}–${f.max}`;
        if (f.key === 'initialQuality') {
            const mq = num('maxQuality');
            if (Number.isFinite(mq) && n > mq) return '不可大於最高品質';
        }
        return null;
    }

    const valid = fields => fields.every(f => !fieldError(f));

    function targetQuality() {
        const mq = num('maxQuality');
        if (s.targetAuto) return mq;
        return parseInt10(s.targetQuality);
    }

    function targetError() {
        const mq = num('maxQuality');
        const t = targetQuality();
        if (!Number.isFinite(t)) return '請輸入整數';
        if (Number.isFinite(mq) && t > mq) return '不可大於最高品質';
        return null;
    }

    function stellarCharges() {
        const n = parseInt10(s.stellar);
        return Number.isFinite(n) ? Math.min(n, 20) : 0;
    }

    function recognize() {
        if (!valid(RECIPE_FIELDS.slice(0, 3)) || fieldError(CHAR_FIELDS[0])) return { status: 'incomplete' };
        return C.lookupRecipe({ difficulty: num('difficulty'), quality: num('maxQuality'), durability: num('durability'), level: num('level') });
    }

    // 找不到配方時，手動選係數用：優先列出與玩家等級相同的配方等級出現過的係數組
    function coefChoices(level) {
        const data = window.CRAFT_DATA;
        if (!data) return [];
        const count = new Map();
        const bump = idx => count.set(idx, (count.get(idx) || 0) + 1);
        for (const r of data.recipes) if (r[5] === level) bump(r[3]);
        if (data.scaling) for (const row of Object.values(data.scaling.rlvs)) if (row[3] === level) bump(row[2]);
        if (!count.size) data.coefs.forEach((_, i) => count.set(i, 0));
        return [...count.entries()]
            .sort((a, b) => b[1] - a[1] || a[0] - b[0])
            .map(([idx, n]) => {
                const c = data.coefs[idx];
                return { idx, label: `${c[0]}/${c[1]}・${c[2]}%/${c[3]}%${n ? `（${n} 個配方）` : ''}` };
            });
    }

    // 回傳 { base, info, manual } 或 null
    function context() {
        if (!valid(CHAR_FIELDS)) return null;
        const level = num('level');
        const stats = { craftsmanship: num('craftsmanship'), control: num('control'), level };
        const rec = recognize();
        if (rec.status === 'ok') return { base: C.baseValues(stats, rec.info), info: rec.info, manual: false };
        if (rec.status !== 'notFound') return null;
        if (s.manualMode === 'measure') {
            const synth = parseInt10(s.measuredSynth), touch = parseInt10(s.measuredTouch);
            if (!(synth > 0 && touch > 0)) return null;
            return { base: C.baseFromMeasured({ synthesis: synth, touch, level }), info: null, manual: true };
        }
        const data = window.CRAFT_DATA;
        const idx = parseInt10(s.manualCoef);
        const choices = coefChoices(level);
        const pick = Number.isFinite(idx) && data && data.coefs[idx] ? idx : (choices[0] && choices[0].idx);
        if (pick == null || !data) return null;
        const c = data.coefs[pick];
        // 不知道配方等級時假設與玩家同級（modifier 會套用）
        const info = { progressDivider: c[0], qualityDivider: c[1], progressModifier: c[2], qualityModifier: c[3], rlvJobLevel: level, expert: false };
        return { base: C.baseValues(stats, info), info: null, manual: true };
    }

    function blockers() {
        const missing = ALL_FIELDS.filter(f => fieldError(f)).map(f => f.label);
        const out = [];
        if (missing.length) out.push(`請確認：${missing.join('、')}`);
        else if (targetError()) out.push(`目標品質：${targetError()}`);
        else if (!context()) out.push(recognize().status === 'noData' ? '配方資料載入失敗' : '找不到配方，請使用下方的手動設定');
        return out;
    }

    function solveInput() {
        const ctx = context();
        if (!ctx) return null;
        const level = num('level');
        const initial = num('initialQuality');
        return {
            input: {
                maxCp: num('cp'),
                maxDurability: num('durability'),
                maxProgress: num('difficulty'),
                maxQuality: Math.max(0, targetQuality() - initial),
                baseProgress: ctx.base.baseProgress,
                baseQuality: ctx.base.baseQuality,
                jobLevel: level,
                allowManipulation: s.manipulation,
                allowHeartAndSoul: s.specialist,
                allowQuickInnovation: s.specialist,
                allowTrainedEye: C.trainedEyeAllowed(level, ctx.info),
                adversarial: s.adversarial,
                backloadProgress: s.backload,
                stellarSteadyHandCharges: stellarCharges(),
            },
            ctx: {
                level,
                craftsmanship: num('craftsmanship'),
                control: num('control'),
                cp: num('cp'),
                difficulty: num('difficulty'),
                durability: num('durability'),
                maxQuality: num('maxQuality'),
                initialQuality: initial,
                target: targetQuality(),
                manual: ctx.manual,
            },
        };
    }

    // ---------- Worker ----------

    function ensureWorker() {
        if (run.worker) return run.worker;
        const url = new URL(`js/craft-worker.js?v=${encodeURIComponent(WORKER_VERSION)}`, document.baseURI);
        const w = new Worker(url, { type: 'module' });
        w.onmessage = e => onWorkerMessage(e.data);
        w.onerror = e => {
            e.preventDefault && e.preventDefault();
            if (run.worker !== w) return;
            run.worker = null;
            w.terminate();
            finishError('此瀏覽器無法執行計算（無法載入求解器）。', e.message || '');
        };
        run.worker = w;
        return w;
    }

    function compute() {
        if (run.status === 'running') { cancel(); return; }
        const job = solveInput();
        if (!job || blockers().length) return;
        let worker;
        try {
            worker = ensureWorker();
        } catch (e) {
            finishError('此瀏覽器無法執行計算（不支援 Web Worker）。', String(e));
            return;
        }
        run.id++;
        run.status = 'running';
        run.pending = { ...job, recalcEntryId: run.recalc ? run.recalc.entryId : null };
        run.startedAt = performance.now();
        clearInterval(run.timer);
        run.timer = setInterval(renderStatusLine, 1000);
        worker.postMessage({ type: 'solve', id: run.id, input: job.input });
        renderControls();
    }

    function cancel(silent) {
        if (run.worker) run.worker.terminate();
        run.worker = null;
        clearInterval(run.timer);
        run.status = run.result ? 'done' : 'idle';
        run.pending = null;
        if (!silent) M.toast('已取消計算');
        renderControls();
        renderResult();
    }

    function onWorkerMessage(msg) {
        if (!msg || msg.id !== run.id || run.status !== 'running') return;
        clearInterval(run.timer);
        const job = run.pending;
        run.pending = null;
        if (msg.type === 'error') {
            finishError('計算時發生錯誤。', msg.message);
            return;
        }
        const out = msg.result;
        if (!out || !out.ok) {
            finishError(ERROR_TEXT[out && out.error] || '計算時發生錯誤。', out && out.message);
            return;
        }
        run.status = 'done';
        run.result = { input: job.input, ctx: job.ctx, output: out, title: '', recalcEntryId: job.recalcEntryId };
        run.error = '';
        renderControls();
        renderResult();
    }

    function finishError(message, detail) {
        clearInterval(run.timer);
        run.status = 'error';
        run.error = message;
        run.detail = detail || '';
        run.result = null;
        renderControls();
        renderResult();
    }

    // ---------- 畫面 ----------

    function numberInput(f, onChange) {
        const input = h('input', {
            type: 'text', class: 'input craft-input', inputMode: 'numeric', autocomplete: 'off',
            value: s.values[f.key] ?? '', 'aria-label': f.label,
        });
        input.addEventListener('input', () => {
            s.values[f.key] = input.value;
            onChange && onChange();
            changed();
        });
        return input;
    }

    function field(label, input, extra) {
        return h('label', { class: 'craft-field' },
            h('span', { class: 'craft-field-label' }, label),
            input,
            extra || null);
    }

    function checkbox(label, key, hint) {
        const cb = h('input', { type: 'checkbox', checked: !!s[key] });
        cb.addEventListener('change', () => { s[key] = cb.checked; changed(); });
        return h('label', { class: 'craft-check' }, cb, h('span', null, label, hint ? h('small', null, hint) : null));
    }

    function select(options, value, onChange, aria) {
        const el = h('select', { class: 'input craft-select', 'aria-label': aria || null },
            options.map(([v, label]) => h('option', { value: v }, label)));
        el.value = value;
        el.addEventListener('change', () => onChange(el.value));
        return el;
    }

    function build() {
        const inputs = {};
        for (const f of ALL_FIELDS) inputs[f.key] = numberInput(f);

        const targetInput = h('input', {
            type: 'text', class: 'input craft-input', inputMode: 'numeric', autocomplete: 'off', 'aria-label': '目標品質',
            value: s.targetAuto ? (s.values.maxQuality || '') : s.targetQuality,
        });
        targetInput.addEventListener('input', () => {
            s.targetQuality = targetInput.value;
            s.targetAuto = targetInput.value.trim() === '' || targetInput.value.trim() === String(s.values.maxQuality).trim();
            changed();
        });
        const targetHint = h('span', { class: 'craft-hint' });

        const stellarInput = h('input', {
            type: 'text', class: 'input craft-input craft-input-sm', inputMode: 'numeric', autocomplete: 'off',
            value: s.stellar, 'aria-label': 'Stellar Steady Hand 可用次數',
        });
        stellarInput.addEventListener('input', () => { s.stellar = stellarInput.value; changed(); });

        const recog = h('div', { class: 'craft-recog' });
        const manual = h('div', { class: 'craft-manual', hidden: true });
        const computeBtn = h('button', { type: 'button', class: 'btn btn-primary craft-compute', onclick: compute }, '計算');
        const statusLine = h('div', { class: 'craft-status', role: 'status' });
        const result = h('div', { class: 'craft-result' });
        const recalcBanner = h('div', { class: 'craft-recalc-banner', hidden: true });

        const node = h('div', { class: 'craft' },
            h('div', { class: 'craft-header' },
                h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => M.closeCraft() }, '← 返回巨集'),
                h('h2', { class: 'entry-title' }, '生產巨集計算 ', h('span', { class: 'beta-badge' }, 'BETA'))),
            h('p', { class: 'craft-beta-note' }, '此功能仍在測試中，計算結果與技能名稱尚未在繁中服完整驗證，使用前請先確認。'),
            recalcBanner,
            h('div', { class: 'craft-cards' },
                h('section', { class: 'craft-card' },
                    h('h3', { class: 'section-title' }, '角色'),
                    CHAR_FIELDS.map(f => field(f.label, inputs[f.key])),
                    checkbox('專家', 'specialist', '可使用「專心致志」「快速改革」'),
                    checkbox('已學會「掌握」', 'manipulation'),
                    h('p', { class: 'craft-hint' }, 'ⓘ 請在吃完食物、喝完藥後，從角色屬性讀取數值')),
                h('section', { class: 'craft-card' },
                    h('h3', { class: 'section-title' }, '配方（製作筆記）'),
                    RECIPE_FIELDS.map(f => field(f.label, inputs[f.key])),
                    recog)),
            manual,
            h('section', { class: 'craft-card' },
                h('h3', { class: 'section-title' }, '目標'),
                h('div', { class: 'craft-target-row' }, field('目標品質', targetInput), targetHint),
                h('details', { class: 'craft-advanced' },
                    h('summary', null, '進階選項'),
                    checkbox('保守模式', 'adversarial', '假設球色不利時，品質仍要達到目標（較慢）'),
                    checkbox('先做品質再推進展', 'backload'),
                    field('Stellar Steady Hand 次數', stellarInput, h('small', { class: 'craft-hint' }, '宇宙探索任務才有，其他配方保持 0')))),
            h('div', { class: 'craft-actions' }, computeBtn, statusLine),
            result,
            h('p', { class: 'craft-credit' },
                '求解器：',
                h('a', { href: 'https://github.com/KonaeAkira/raphael-rs', target: '_blank', rel: 'noopener' }, 'raphael-rs'),
                '（Apache-2.0）・配方資料：',
                h('a', { href: 'https://github.com/xivapi/ffxiv-datamining', target: '_blank', rel: 'noopener' }, 'xivapi/ffxiv-datamining'),
                '・遊戲資料 © SQUARE ENIX'));

        ui = { node, inputs, targetInput, targetHint, recog, manual, computeBtn, statusLine, result, recalcBanner };
    }

    function changed() {
        save();
        refresh();
    }

    // 依目前輸入更新欄位狀態、辨識結果、按鈕
    function refresh() {
        if (!ui) return;
        for (const f of ALL_FIELDS) {
            const err = fieldError(f);
            const empty = String(s.values[f.key] ?? '').trim() === '';
            const input = ui.inputs[f.key];
            // 空白時不標紅（還沒填），有填但不合法才標
            input.classList.toggle('invalid', !!err && !empty);
            input.title = err && !empty ? err : '';
        }
        if (s.targetAuto && document.activeElement !== ui.targetInput) ui.targetInput.value = s.values.maxQuality || '';
        const tErr = targetError();
        ui.targetInput.classList.toggle('invalid', !!tErr && ui.targetInput.value.trim() !== '');
        const mq = num('maxQuality'), t = targetQuality();
        ui.targetHint.textContent = Number.isFinite(mq) && Number.isFinite(t) && !tErr
            ? (t === 0 ? '只完成製作，不加品質' : `${t} / ${mq}`)
            : '';
        renderRecalcBanner();
        renderRecognition();
        renderManual();
        renderControls();
        renderResult();
    }

    function renderRecognition() {
        const rec = recognize();
        const box = ui.recog;
        box.replaceChildren();
        box.className = 'craft-recog';
        if (rec.status === 'incomplete') {
            box.append(h('span', { class: 'craft-hint' }, '填入難度、耐久、最高品質後自動辨識配方'));
            return;
        }
        if (rec.status === 'noData') {
            box.classList.add('warn');
            box.append(h('strong', null, '⚠ 配方資料載入失敗'), h('small', null, '請重新整理頁面'));
            return;
        }
        if (rec.status === 'notFound') {
            box.classList.add('warn');
            box.append(h('strong', null, '⚠ 找不到符合的配方'),
                h('small', null, '請確認難度、耐久、最高品質與製作筆記一致；若遊戲剛改版，可能是工具資料尚未更新。'));
            return;
        }
        const i = rec.info;
        const kind = i.expert ? '專家配方' : i.scaling ? '等級同步配方' : '一般配方';
        const stars = i.stars ? ' ' + '★'.repeat(i.stars) : '';
        box.classList.add('ok');
        box.append(h('strong', null, '✓ 已辨識配方'), h('small', null, `${kind}・配方等級 ${i.rlv}（Lv${i.rlvJobLevel}${stars}）`));
        if (valid(CHAR_FIELDS)) {
            const level = num('level');
            const base = C.baseValues({ craftsmanship: num('craftsmanship'), control: num('control'), level }, i);
            const first = C.firstStepPreview(base, level);
            box.append(h('small', null, `第一下：製作 +${first.synthesis} 進展・加工 +${first.touch} 品質`));
            if (C.trainedEyeAllowed(level, i)) box.append(h('small', null, '可使用「工匠的神速技巧」'));
        }
    }

    function renderManual() {
        const box = ui.manual;
        const show = recognize().status === 'notFound';
        box.hidden = !show;
        if (!show) return;
        // 正在這區塊的文字框內輸入時不重建，避免游標跳掉
        const active = document.activeElement;
        if (active && active.type === 'text' && box.contains(active)) return;
        box.replaceChildren();
        const level = num('level');
        const choices = Number.isFinite(level) ? coefChoices(level) : [];

        const radio = (mode, label) => {
            const r = h('input', { type: 'radio', name: 'craft-manual-mode', checked: s.manualMode === mode });
            r.addEventListener('change', () => { if (r.checked) { s.manualMode = mode; changed(); } });
            return h('label', { class: 'craft-check' }, r, h('span', null, label));
        };

        const coefSelect = select(choices.map(c => [String(c.idx), c.label]),
            choices.some(c => String(c.idx) === s.manualCoef) ? s.manualCoef : String(choices[0] ? choices[0].idx : ''),
            v => { s.manualCoef = v; changed(); }, '係數組');
        coefSelect.disabled = s.manualMode !== 'coef';

        const measured = (key, label) => {
            const input = h('input', {
                type: 'text', class: 'input craft-input', inputMode: 'numeric', autocomplete: 'off', value: s[key], 'aria-label': label,
                disabled: s.manualMode !== 'measure',
            });
            input.addEventListener('input', () => { s[key] = input.value; save(); renderControls(); renderResult(); });
            return field(label, input);
        };

        box.append(
            h('h3', { class: 'section-title' }, '手動設定係數'),
            h('p', { class: 'craft-hint' }, '找不到配方時，可以手動選擇係數，或在遊戲裡實測一次。結果可能有誤差。'),
            radio('coef', '選擇係數組'),
            h('div', { class: 'craft-manual-body' }, coefSelect),
            radio('measure', '實測（通常狀態、無 Buff 下各按一次）'),
            h('div', { class: 'craft-manual-body craft-manual-measure' },
                measured('measuredSynth', '「製作」增加的進展'),
                measured('measuredTouch', '「加工」增加的品質')));
    }

    function renderStatusLine() {
        const line = ui.statusLine;
        line.replaceChildren();
        if (run.status === 'running') {
            const sec = Math.floor((performance.now() - run.startedAt) / 1000);
            line.append(h('span', { class: 'craft-spinner', 'aria-hidden': 'true' }), `計算中… ${sec} 秒`);
            if (sec >= LONG_RUN_SEC) line.append(h('small', null, '配方較複雜，可能需要較久；可以取消後降低目標品質再試。'));
            return;
        }
        const b = blockers();
        if (b.length) line.append(h('small', { class: 'craft-hint' }, b[0]));
    }

    function renderControls() {
        if (!ui) return;
        const running = run.status === 'running';
        const b = blockers();
        ui.computeBtn.textContent = running ? '取消' : '計算';
        ui.computeBtn.classList.toggle('btn-primary', !running);
        ui.computeBtn.classList.toggle('btn-secondary', running);
        ui.computeBtn.disabled = !running && b.length > 0;
        ui.computeBtn.title = !running && b.length ? b[0] : '';
        renderStatusLine();
    }

    function currentMacros() {
        const r = run.result;
        if (!r) return [];
        return C.buildMacros(r.output.steps, s.exportOpts);
    }

    function isStale() {
        const r = run.result;
        if (!r) return false;
        const job = solveInput();
        return !job || JSON.stringify(job.input) !== JSON.stringify(r.input);
    }

    function defaultTitle(ctx) { return `生產：難度${ctx.difficulty}／品質${ctx.target}`; }

    // 匯入時寫進備註的說明文字（只給人看；重新計算用的是 entry.craft）
    function noteText(r) {
        const c = r.ctx, o = r.output;
        return [
            `Lv${c.level}　作業精度 ${c.craftsmanship}　加工精度 ${c.control}　CP ${c.cp}`,
            `難度 ${c.difficulty}　耐久 ${c.durability}　最高品質 ${c.maxQuality}　初期品質 ${c.initialQuality}　目標品質 ${c.target}`,
            `${o.steps.length} 步・約 ${o.durationSec} 秒${c.manual ? '・手動係數' : ''}`,
        ].join('\n');
    }

    // 存進巨集資料的計算條件（entry.craft），重新計算時從這裡帶回配方與目標
    function craftSnapshot(r) {
        const c = r.ctx, i = r.input;
        return {
            recipe: { difficulty: c.difficulty, durability: c.durability, maxQuality: c.maxQuality, initialQuality: c.initialQuality },
            target: c.target,
            options: { adversarial: i.adversarial, backload: i.backloadProgress, stellar: i.stellarSteadyHandCharges },
            stats: {
                level: c.level, craftsmanship: c.craftsmanship, control: c.control, cp: c.cp,
                specialist: i.allowHeartAndSoul, manipulation: i.allowManipulation,
            },
        };
    }

    function resultMacros() {
        return currentMacros().map((content, i) => ({ label: `巨集 ${i + 1}`, content }));
    }

    function recalcEntry() {
        const id = run.recalc && run.recalc.entryId;
        return id ? M.findEntry(id) : null;
    }

    function renderResult() {
        if (!ui) return;
        const box = ui.result;
        // 正在輸入標題時不重建
        if (box.contains(document.activeElement) && document.activeElement.classList.contains('craft-title-input')) {
            const staleNote = box.querySelector('.craft-stale');
            if (staleNote) staleNote.hidden = !isStale();
            return;
        }
        box.replaceChildren();
        if (run.status === 'error') {
            box.append(h('div', { class: 'notice' }, run.error,
                run.detail ? h('details', { class: 'craft-error-detail' }, h('summary', null, '技術訊息'), h('pre', null, run.detail)) : null));
            return;
        }
        const r = run.result;
        if (!r) return;
        const c = r.ctx, o = r.output;
        const last = o.steps[o.steps.length - 1] || { progress: 0, quality: 0, durability: c.durability, cp: c.cp };
        const progress = Math.min(last.progress, c.difficulty);
        const quality = Math.min(c.initialQuality + last.quality, c.maxQuality);
        const progressOk = last.progress >= c.difficulty;
        const qualityOk = c.initialQuality + last.quality >= c.target;

        const summary = h('div', { class: 'craft-summary' },
            h('div', { class: 'craft-summary-main' }, `${o.steps.length} 步・約 ${o.durationSec} 秒・剩餘 CP ${last.cp}`),
            h('div', { class: 'craft-summary-stats' },
                h('span', { class: progressOk ? 'ok' : 'bad' }, `進展 ${progress} / ${c.difficulty} ${progressOk ? '✓' : '✗'}`),
                h('span', { class: qualityOk ? 'ok' : 'bad' }, `品質 ${quality} / ${c.maxQuality} ${qualityOk ? '✓' : ''}`),
                h('span', null, `耐久剩 ${last.durability}`)),
            !qualityOk ? h('p', { class: 'craft-summary-warn' }, `無法達到目標品質 ${c.target}，以下為可完成製作的最高品質手法。`) : null,
            c.manual ? h('p', { class: 'craft-summary-warn' }, '使用手動係數，結果可能有誤差。') : null,
            h('p', { class: 'craft-stale craft-summary-warn', hidden: !isStale() }, '輸入已變更，結果是上一次的計算，請重新計算。'));

        const o2 = s.exportOpts;
        const setOpt = (k, v) => { o2[k] = v; save(); renderResult(); };
        const lockCb = h('input', { type: 'checkbox', checked: o2.lock });
        lockCb.addEventListener('change', () => setOpt('lock', lockCb.checked));
        const options = h('div', { class: 'craft-export-opts' },
            h('label', { class: 'craft-check' }, lockCb, h('span', null, '/mlock')),
            h('label', { class: 'craft-inline' }, '完成提示',
                select([['auto', '自動'], ['on', '開'], ['off', '關']], o2.notify, v => setOpt('notify', v), '完成提示')),
            o2.notify !== 'off' ? h('label', { class: 'craft-inline' }, '音效', select(SOUNDS, o2.sound, v => setOpt('sound', v), '音效')) : null,
            h('label', { class: 'craft-inline' }, '切法',
                select([['avg', '平均'], ['fill', '填滿']], o2.method, v => setOpt('method', v), '切法')),
            h('label', { class: 'craft-inline' }, '等待加秒',
                select([['0', '0'], ['1', '+1'], ['2', '+2']], String(o2.extraWait), v => setOpt('extraWait', Number(v)), '等待加秒')));

        const macros = currentMacros();
        const blocks = macros.map((text, i) => {
            const lines = M.lineCount(text);
            const copyBtn = h('button', { type: 'button', class: 'block-btn copy-btn', title: '複製巨集內容', onclick: () => M.copyWithFeedback(copyBtn, text) }, '複製');
            const block = h('div', { class: 'macro-block copyable', title: '點擊複製' },
                h('div', { class: 'block-head' },
                    h('span', { class: 'block-label' }, `巨集 ${i + 1}`),
                    h('div', { class: 'block-tools' },
                        h('span', { class: 'craft-lines' }, `${lines} / ${C.MAX_MACRO_LINES} 行`),
                        copyBtn)),
                h('div', { class: 'block-body' }, text));
            block.addEventListener('click', ev => {
                if (ev.target.closest('button')) return;
                M.copyWithFeedback(copyBtn, text);
                block.classList.remove('flash');
                void block.offsetWidth;
                block.classList.add('flash');
            });
            return block;
        });

        const table = h('table', { class: 'craft-steps' },
            h('thead', null, h('tr', null, ['#', '技能', '進展', '品質', '耐久', 'CP'].map(t => h('th', null, t)))),
            h('tbody', null, o.steps.map((st, i) => h('tr', null,
                h('td', null, String(i + 1)),
                h('td', null, C.displayName(st.action)),
                h('td', null, String(Math.min(st.progress, c.difficulty))),
                h('td', null, String(Math.min(c.initialQuality + st.quality, c.maxQuality))),
                h('td', null, String(st.durability)),
                h('td', null, String(st.cp))))));

        // 重新計算某筆資料時：主要動作是更新那筆；另外仍可匯入成新資料
        const target = r.recalcEntryId ? M.findEntry(r.recalcEntryId) : null;
        const titleInput = h('input', {
            type: 'text', class: 'input craft-title-input', value: r.title, placeholder: defaultTitle(c), 'aria-label': '匯入標題',
        });
        titleInput.addEventListener('input', () => { r.title = titleInput.value; });
        const importBtn = h('button', {
            type: 'button', class: target ? 'btn btn-secondary' : 'btn btn-primary', disabled: !macros.length,
            onclick: () => M.importEntry({
                title: r.title.trim() || defaultTitle(c),
                note: noteText(r),
                macros: resultMacros(),
                craft: craftSnapshot(r),
            }),
        }, target ? '匯入為新資料' : '匯入巨集管理');
        const updateRow = target ? h('div', { class: 'craft-update' },
            h('button', {
                type: 'button', class: 'btn btn-primary', disabled: !macros.length,
                onclick: () => M.updateEntryFromCraft(target.id, { macros: resultMacros(), note: noteText(r), craft: craftSnapshot(r) }),
            }, `更新「${target.title}」`),
            h('span', { class: 'craft-hint' }, `取代這筆資料目前的 ${target.macros.length} 個巨集與備註，標題不變`)) : null;

        // 原生 append 會把 null 印成文字 "null"，所以先濾掉
        box.append(...[
            h('h3', { class: 'section-title' }, '結果'),
            summary,
            options,
            ...blocks,
            h('details', { class: 'craft-steps-wrap' }, h('summary', null, `逐步明細（${o.steps.length} 步）`), table),
            updateRow,
            h('div', { class: 'craft-import' }, titleInput, importBtn),
        ].filter(Boolean));
    }

    function renderRecalcBanner() {
        const entry = recalcEntry();
        ui.recalcBanner.hidden = !entry;
        ui.recalcBanner.replaceChildren();
        if (!entry) return;
        ui.recalcBanner.append(
            h('span', null, `重新計算「${entry.title}」：配方與目標已帶入，角色數值使用目前的設定。`),
            h('button', { type: 'button', class: 'link-btn', onclick: clearRecalc }, '改為一般計算'));
    }

    // ---------- 對外 ----------

    function mount(root) {
        if (!ui) build();
        root.append(ui.node);
        refresh();
    }

    // 以某筆資料存下的配方與目標重新計算；角色數值沿用計算器目前的設定
    function recalc(entry) {
        const c = entry && entry.craft;
        if (!c) return;
        if (run.status === 'running') cancel(true);
        const v = s.values;
        v.difficulty = String(c.recipe.difficulty);
        v.durability = String(c.recipe.durability);
        v.maxQuality = String(c.recipe.maxQuality);
        v.initialQuality = String(c.recipe.initialQuality);
        s.targetAuto = c.target === c.recipe.maxQuality;
        s.targetQuality = s.targetAuto ? '' : String(c.target);
        s.adversarial = c.options.adversarial;
        s.backload = c.options.backload;
        s.stellar = String(c.options.stellar);
        save();
        run.recalc = { entryId: entry.id };
        run.result = null;
        run.status = 'idle';
        run.error = '';
        ui = null; // 欄位值改了，重建畫面
        M.openCraft();
        // 數值齊全就直接開始算；缺角色數值時停在畫面上讓使用者補
        if (!blockers().length) compute();
    }

    function clearRecalc() {
        if (!run.recalc) return;
        run.recalc = null;
        if (ui) refresh();
    }

    function currentStats() {
        const out = {};
        for (const f of CHAR_FIELDS) {
            const n = num(f.key);
            out[f.key] = Number.isFinite(n) ? n : null;
        }
        return out;
    }

    return { mount, recalc, clearRecalc, currentStats };
})();
