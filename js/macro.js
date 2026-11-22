// 巨集管理工具：左側清單 + 右側巨集區塊（檢視／一鍵複製／就地編輯）
// 儲存：資料夾模式（File System Access API，Chromium）或瀏覽器模式（localStorage）＋ 匯入／匯出
// 注意：所有使用者內容一律以 textContent 輸出（h() 的字串子節點都是文字節點），也不送進 GA。
window.MacroApp = (function () {
    'use strict';

    const APP_ID = 'ffxiv-macro-manager';
    const DATA_VERSION = 1;
    const FILE_NAME = 'ff14-macros.json';
    const LS_DATA = 'ffxiv-macro:data';
    const LS_LAST = 'ffxiv-macro:lastSelected';
    const IDB_NAME = 'ffxiv-macro';
    const IDB_STORE = 'handles';
    const IDB_KEY = 'dir';
    const MAX_LINES = 15;
    const SAVE_DELAY = 600;
    const DEFAULT_TITLE = '未命名';
    const FOLDER_SUPPORTED = 'showDirectoryPicker' in window;

    const state = {
        data: emptyData(),
        readOnly: false,       // 檔案版本較新：只顯示、不寫回
        selectedId: null,
        filter: '',
        editing: null,         // 見下方「編輯狀態」說明
        storageMode: 'browser',
        dirHandle: null,
        needsReconnect: false,
        reconnectReason: '',
        saveStatus: 'saved',   // saved | saving | error
        saveError: '',
        menuOpen: false,
    };

    // 寫檔排程：changeSeq 每次變更 +1，writtenSeq 記錄已寫入資料夾的版本
    let saveTimer = null;
    let changeSeq = 0;
    let writtenSeq = 0;
    let writeInFlight = false;
    let writeAgain = false;

    const $ = id => document.getElementById(id);

    // ---------- 小工具 ----------

    // 建立 DOM：字串子節點一律變成文字節點，不會被當作 HTML
    function h(tag, props, ...children) {
        const node = document.createElement(tag);
        if (props) {
            for (const [k, v] of Object.entries(props)) {
                if (v == null || v === false) continue;
                if (k === 'class') node.className = v;
                else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
                else if (k === 'role' || k.includes('-')) node.setAttribute(k, v);
                else if (k in node) node[k] = v;
                else node.setAttribute(k, v === true ? '' : v);
            }
        }
        children.flat(Infinity).forEach(c => {
            if (c == null || c === false) return;
            node.append(c instanceof Node ? c : String(c));
        });
        return node;
    }

    function nowIso() { return new Date().toISOString(); }

    function newId() {
        if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
        return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }

    function emptyData() {
        return { app: APP_ID, version: DATA_VERSION, updatedAt: null, entries: [] };
    }

    function newMacro() { return { id: newId(), label: '', content: '' }; }

    function timeOf(iso) {
        const t = Date.parse(iso);
        return isNaN(t) ? 0 : t;
    }

    function str(v) { return typeof v === 'string' ? v : (v == null ? '' : String(v)); }

    function isoOr(v, fallback) {
        return typeof v === 'string' && !isNaN(Date.parse(v)) ? v : fallback;
    }

    function normalizeNewlines(s) { return str(s).replace(/\r\n?/g, '\n'); }

    // 複製用文字：換行統一為 \n、去掉結尾多餘的空白行，其餘原樣
    function textForCopy(content) {
        return normalizeNewlines(content).replace(/(?:\n[ \t　]*)+$/, '');
    }

    function lineCount(content) {
        const t = textForCopy(content);
        return t === '' ? 0 : t.split('\n').length;
    }

    function macroLabel(m, index) { return m.label.trim() || `巨集 ${index + 1}`; }

    function isComposing(e) { return e.isComposing || e.keyCode === 229; }

    function describeError(e) {
        if (!e) return '未知錯誤';
        if (e.name === 'NotAllowedError' || e.name === 'SecurityError') return '沒有存取權限';
        if (e.name === 'NotFoundError') return '找不到資料夾或檔案';
        return e.message || e.name || '未知錯誤';
    }

    function ymd(d) {
        const p = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
    }

    function autoGrow(ta) {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
    }

    function toast(message) {
        const node = h('div', { class: 'toast', role: 'status' }, message);
        document.body.append(node);
        requestAnimationFrame(() => node.classList.add('show'));
        setTimeout(() => {
            node.classList.remove('show');
            setTimeout(() => node.remove(), 300);
        }, 2500);
    }

    // 自訂選擇對話框（三選一等），回傳選到的 key；Esc／點背景為 null
    function choose(message, options) {
        return new Promise(resolve => {
            const prevFocus = document.activeElement;
            const buttons = options.map(o => h('button', {
                type: 'button',
                class: `btn ${o.kind === 'primary' ? 'btn-primary' : o.kind === 'danger' ? 'btn-danger' : 'btn-secondary'}`,
                onclick: () => close(o.key),
            }, o.label));
            const overlay = h('div', { class: 'dialog-overlay', onclick: e => { if (e.target === overlay) close(null); } },
                h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true' },
                    h('p', { class: 'dialog-message' }, message),
                    h('div', { class: 'dialog-actions' }, buttons)));

            function onKey(e) {
                if (e.key === 'Escape') { e.preventDefault(); close(null); }
            }
            function close(v) {
                document.removeEventListener('keydown', onKey, true);
                overlay.remove();
                if (prevFocus && prevFocus.focus) prevFocus.focus();
                resolve(v);
            }
            document.addEventListener('keydown', onKey, true);
            document.body.append(overlay);
            buttons[0].focus();
        });
    }

    // ---------- 資料格式 ----------

    // 讀取時容錯：缺欄位補預設值、id 重複就重新產生；version 較新 → readOnly
    function normalizeData(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Array.isArray(raw.entries)) {
            throw new Error('不是有效的巨集資料檔');
        }
        const version = typeof raw.version === 'number' ? raw.version : DATA_VERSION;
        const readOnly = version > DATA_VERSION;
        const seen = new Set();
        const uniqueId = id => {
            let v = typeof id === 'string' && id ? id : newId();
            while (seen.has(v)) v = newId();
            seen.add(v);
            return v;
        };
        const now = nowIso();
        const entries = raw.entries
            .filter(e => e && typeof e === 'object')
            .map(e => {
                const createdAt = isoOr(e.createdAt, now);
                const macros = (Array.isArray(e.macros) ? e.macros : [])
                    .filter(m => m && typeof m === 'object')
                    .map(m => ({ id: uniqueId(m.id), label: str(m.label), content: normalizeNewlines(m.content) }));
                if (!macros.length) macros.push(newMacro());
                return {
                    id: uniqueId(e.id),
                    title: str(e.title).trim() || DEFAULT_TITLE,
                    note: str(e.note),
                    order: Number.isFinite(e.order) ? e.order : null,
                    createdAt,
                    updatedAt: isoOr(e.updatedAt, createdAt),
                    macros,
                };
            });
        normalizeOrders(entries);
        return {
            data: { app: APP_ID, version: readOnly ? version : DATA_VERSION, updatedAt: isoOr(raw.updatedAt, null), entries },
            readOnly,
        };
    }

    function serialize() {
        const d = state.data;
        return JSON.stringify({ app: APP_ID, version: d.version, updatedAt: d.updatedAt, entries: d.entries }, null, 2) + '\n';
    }

    // ---------- 儲存：localStorage ----------

    function loadLocal() {
        try {
            const raw = localStorage.getItem(LS_DATA);
            return raw ? normalizeData(JSON.parse(raw)) : null;
        } catch (e) {
            console.warn('[macro] 讀取瀏覽器快取失敗', e);
            return null;
        }
    }

    function saveLocal() {
        try {
            localStorage.setItem(LS_DATA, serialize());
            return true;
        } catch (e) {
            console.warn('[macro] 寫入瀏覽器快取失敗', e);
            return false;
        }
    }

    function saveLastSelected() {
        try {
            if (state.selectedId) localStorage.setItem(LS_LAST, state.selectedId);
            else localStorage.removeItem(LS_LAST);
        } catch (e) { /* 忽略 */ }
    }

    function loadLastSelected() {
        try { return localStorage.getItem(LS_LAST); } catch (e) { return null; }
    }

    // ---------- 儲存：IndexedDB（記住資料夾 handle）----------

    function idbOpen() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(IDB_NAME, 1);
            req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async function idbRun(mode, fn) {
        const db = await idbOpen();
        try {
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(IDB_STORE, mode);
                const req = fn(tx.objectStore(IDB_STORE));
                tx.oncomplete = () => resolve(req.result);
                tx.onerror = tx.onabort = () => reject(tx.error);
            });
        } finally {
            db.close();
        }
    }

    const idb = {
        getHandle: () => idbRun('readonly', s => s.get(IDB_KEY)).catch(() => null),
        setHandle: handle => idbRun('readwrite', s => s.put(handle, IDB_KEY)).catch(e => console.warn('[macro] 無法記住資料夾', e)),
        clearHandle: () => idbRun('readwrite', s => s.delete(IDB_KEY)).catch(() => {}),
    };

    // ---------- 儲存：資料夾 ----------

    function isFolderConnected() {
        return state.storageMode === 'folder' && !!state.dirHandle && !state.needsReconnect;
    }

    async function ensurePermission(handle, request) {
        const opts = { mode: 'readwrite' };
        try {
            if (typeof handle.queryPermission === 'function' && (await handle.queryPermission(opts)) === 'granted') return true;
            if (request && typeof handle.requestPermission === 'function') {
                return (await handle.requestPermission(opts)) === 'granted';
            }
        } catch (e) {
            console.warn('[macro] 權限檢查失敗', e);
        }
        return false;
    }

    // 回傳 { status: 'missing' } / { status: 'invalid' } / { status: 'ok', parsed }
    async function readFolderFile(handle) {
        let fileHandle;
        try {
            fileHandle = await handle.getFileHandle(FILE_NAME);
        } catch (e) {
            if (e.name === 'NotFoundError') return { status: 'missing' };
            throw e;
        }
        const text = await (await fileHandle.getFile()).text();
        if (!text.trim()) return { status: 'missing' };
        try {
            return { status: 'ok', parsed: normalizeData(JSON.parse(text)) };
        } catch (e) {
            return { status: 'invalid' };
        }
    }

    async function writeFolderFile() {
        const fileHandle = await state.dirHandle.getFileHandle(FILE_NAME, { create: true });
        const writable = await fileHandle.createWritable();
        try {
            await writable.write(serialize());
            await writable.close();
        } catch (e) {
            try { await writable.abort(); } catch (_) { /* 忽略 */ }
            throw e;
        }
    }

    async function flushWrite() {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (!isFolderConnected() || state.readOnly) return;
        if (writeInFlight) { writeAgain = true; return; }
        writeInFlight = true;
        writeAgain = false;
        const seq = changeSeq;
        try {
            await writeFolderFile();
            writtenSeq = Math.max(writtenSeq, seq);
        } catch (e) {
            writeInFlight = false;
            console.error('[macro] 寫入資料夾失敗', e);
            setSaveStatus('error', describeError(e));
            return;
        }
        writeInFlight = false;
        if (writeAgain) return flushWrite();
        if (!saveTimer) setSaveStatus(writtenSeq >= changeSeq ? 'saved' : 'saving');
    }

    // 任何變更後呼叫：立刻寫 localStorage 快取，資料夾則 debounce 寫檔
    function persist() {
        if (state.readOnly) return;
        changeSeq++;
        const localOk = saveLocal();
        if (isFolderConnected()) {
            setSaveStatus('saving');
            clearTimeout(saveTimer);
            saveTimer = setTimeout(flushWrite, SAVE_DELAY);
        } else if (state.storageMode === 'browser') {
            setSaveStatus(localOk ? 'saved' : 'error', localOk ? '' : '瀏覽器儲存空間不足或已停用');
        }
        // 資料夾待重新連結：資料已在 localStorage，重新連結時以較新者為準寫回
    }

    function hasPendingWrite() {
        if (state.saveStatus === 'error') return true;
        return isFolderConnected() && (writtenSeq < changeSeq || writeInFlight);
    }

    function setSaveStatus(status, message) {
        state.saveStatus = status;
        state.saveError = message || '';
        renderStatus();
    }

    // 採用另一份資料（資料夾檔案／匯入取代）
    function adoptData(parsed) {
        state.editing = null;
        state.data = parsed.data;
        state.readOnly = parsed.readOnly;
        ensureSelection();
        if (!state.readOnly) saveLocal();
    }

    // 連結資料夾並同步資料，成功回傳 true
    // fromPicker：使用者剛選的資料夾（兩邊都有資料時詢問）；否則為重新開頁／重新連結（以 updatedAt 較新者為準）
    async function connectFolder(handle, fromPicker) {
        let result;
        try {
            result = await readFolderFile(handle);
        } catch (e) {
            alert(`無法讀取資料夾：${describeError(e)}`);
            return false;
        }

        let action; // 'load' | 'write'
        if (result.status === 'missing') {
            action = 'write';
        } else if (result.status === 'invalid') {
            const c = await choose(`資料夾「${handle.name}」中的 ${FILE_NAME} 格式錯誤，無法讀取。`, [
                { key: 'write', label: '以目前資料覆蓋檔案', kind: 'danger' },
                { key: null, label: '取消' },
            ]);
            if (!c) return false;
            action = 'write';
        } else {
            const fileHas = result.parsed.data.entries.length > 0;
            const localHas = state.data.entries.length > 0;
            if (fromPicker) {
                if (fileHas && localHas) {
                    const c = await choose(
                        `資料夾「${handle.name}」中已有 ${FILE_NAME}（${result.parsed.data.entries.length} 筆），目前瀏覽器內也有 ${state.data.entries.length} 筆資料。要使用哪一份？`,
                        [
                            { key: 'load', label: '載入資料夾中的檔案', kind: 'primary' },
                            { key: 'write', label: '以目前資料覆蓋檔案', kind: 'danger' },
                            { key: null, label: '取消' },
                        ]);
                    if (!c) return false;
                    action = c;
                } else {
                    action = fileHas ? 'load' : 'write';
                }
            } else {
                action = timeOf(result.parsed.data.updatedAt) >= timeOf(state.data.updatedAt) ? 'load' : 'write';
            }
        }

        state.dirHandle = handle;
        state.storageMode = 'folder';
        state.needsReconnect = false;
        state.reconnectReason = '';

        if (action === 'load') {
            adoptData(result.parsed);
            writtenSeq = changeSeq;
            state.saveStatus = 'saved';
            renderAll();
            if (state.readOnly) alert('檔案版本較新，請更新頁面。目前以唯讀方式載入，不會寫回。');
        } else {
            changeSeq++;
            saveLocal();
            renderStatus();
            await flushWrite();
        }
        return true;
    }

    async function pickFolder() {
        let handle;
        try {
            handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'ffxiv-macro' });
        } catch (e) {
            if (e.name !== 'AbortError') alert(`無法選擇資料夾：${describeError(e)}`);
            return;
        }
        if (!(await ensurePermission(handle, true))) {
            alert('未取得資料夾的寫入權限。');
            return;
        }
        if (await connectFolder(handle, true)) {
            await idb.setHandle(handle);
            toast(`已連結資料夾「${handle.name}」`);
        }
    }

    async function reconnectFolder() {
        const handle = state.dirHandle;
        if (!handle) return;
        if (!(await ensurePermission(handle, true))) {
            alert('未取得資料夾的存取權限。');
            return;
        }
        if (!(await connectFolder(handle, false))) {
            state.needsReconnect = true;
            renderStatus();
        }
    }

    async function disconnectFolder() {
        if (isFolderConnected() && writtenSeq < changeSeq) {
            try { await flushWrite(); } catch (e) { /* 資料仍在 localStorage */ }
        }
        clearTimeout(saveTimer);
        saveTimer = null;
        state.storageMode = 'browser';
        state.dirHandle = null;
        state.needsReconnect = false;
        state.reconnectReason = '';
        await idb.clearHandle();
        setSaveStatus(saveLocal() || state.readOnly ? 'saved' : 'error');
    }

    async function retrySave() {
        if (state.storageMode === 'folder' && state.dirHandle) {
            if (!(await ensurePermission(state.dirHandle, true))) {
                state.needsReconnect = true;
                renderStatus();
                return;
            }
            changeSeq++;
            setSaveStatus('saving');
            await flushWrite();
        } else {
            changeSeq--;
            persist();
        }
    }

    // ---------- 匯入／匯出 ----------

    function exportJson() {
        const blob = new Blob([serialize()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = h('a', { href: url, download: `ff14-macros-${ymd(new Date())}.json` });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function importFile(file) {
        let parsed;
        try {
            parsed = normalizeData(JSON.parse(await file.text()));
        } catch (e) {
            alert(`匯入失敗：「${file.name}」不是有效的巨集資料檔。`);
            return;
        }
        if (parsed.readOnly) {
            alert('檔案版本較新，請更新頁面後再匯入。');
            return;
        }
        const incoming = parsed.data.entries;
        if (!incoming.length) {
            alert('檔案中沒有任何資料。');
            return;
        }
        if (!requestLeaveEdit()) return;

        let mode = 'replace';
        if (state.data.entries.length) {
            mode = await choose(`要如何匯入「${file.name}」中的 ${incoming.length} 筆資料？\n合併：相同資料以較新的為準；取代全部：刪除目前所有資料。`, [
                { key: 'merge', label: '合併', kind: 'primary' },
                { key: 'replace', label: '取代全部', kind: 'danger' },
                { key: null, label: '取消' },
            ]);
            if (!mode) return;
        }

        let message;
        if (mode === 'replace') {
            state.data.entries = incoming;
            message = `已匯入 ${incoming.length} 筆資料`;
        } else {
            const index = new Map(state.data.entries.map((e, i) => [e.id, i]));
            let added = 0, updated = 0;
            incoming.forEach(e => {
                if (!index.has(e.id)) {
                    // 新加入的資料排在清單最上方，維持在檔案中的相對順序
                    e.order = -incoming.length + e.order;
                    index.set(e.id, state.data.entries.length);
                    state.data.entries.push(e);
                    added++;
                } else {
                    const i = index.get(e.id);
                    const cur = state.data.entries[i];
                    if (timeOf(e.updatedAt) > timeOf(cur.updatedAt)) {
                        e.order = cur.order; // 保留目前清單中的位置
                        state.data.entries[i] = e;
                        updated++;
                    }
                }
            });
            normalizeOrders(state.data.entries);
            message = `合併完成：新增 ${added} 筆、更新 ${updated} 筆`;
        }
        ensureSelection();
        commit(null);
        renderAll();
        toast(message);
    }

    // ---------- 剪貼簿 ----------

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (e) { /* 改用 fallback */ }
        }
        const active = document.activeElement;
        const ta = h('textarea', { class: 'copy-helper', readOnly: true, value: text, 'aria-hidden': 'true' });
        document.body.append(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
        if (active && active.focus) active.focus();
        return ok;
    }

    async function copyWithFeedback(btn, content) {
        const ok = await copyText(textForCopy(content));
        clearTimeout(btn._resetTimer);
        btn.classList.remove('copied', 'failed');
        btn.classList.add(ok ? 'copied' : 'failed');
        btn.textContent = ok ? '已複製 ✓' : '複製失敗';
        btn._resetTimer = setTimeout(() => {
            btn.textContent = '複製';
            btn.classList.remove('copied', 'failed');
        }, 1500);
    }

    // ---------- 資料操作 ----------

    // 清單順序：依 order 由小到大；沒有 order 的（舊資料）排在後面，依 updatedAt 由新到舊，最後重新編號 0..n-1
    function normalizeOrders(entries) {
        const key = e => (Number.isFinite(e.order) ? e.order : Infinity);
        [...entries]
            .sort((a, b) => {
                const ao = key(a), bo = key(b);
                if (ao !== bo) return ao - bo;
                return timeOf(b.updatedAt) - timeOf(a.updatedAt);
            })
            .forEach((e, i) => { e.order = i; });
    }

    function sortedEntries() {
        return [...state.data.entries].sort((a, b) => a.order - b.order);
    }

    function matches(entry, q) {
        if (!q) return true;
        const has = s => s.toLowerCase().includes(q);
        return has(entry.title) || has(entry.note) || entry.macros.some(m => has(m.label) || has(m.content));
    }

    function isFiltering() { return state.filter.trim() !== ''; }

    function visibleEntries() {
        const q = state.filter.trim().toLowerCase();
        return sortedEntries().filter(e => matches(e, q));
    }

    function findEntry(id) { return state.data.entries.find(e => e.id === id) || null; }

    function ensureSelection() {
        if (!findEntry(state.selectedId)) {
            const first = sortedEntries()[0];
            state.selectedId = first ? first.id : null;
        }
        saveLastSelected();
    }

    function commit(entry) {
        const now = nowIso();
        if (entry) entry.updatedAt = now;
        state.data.updatedAt = now;
        persist();
    }

    // ----- 編輯狀態 -----
    // state.editing = {
    //   entryId,
    //   header: 是否編輯用途／備註,
    //   macroId: 編輯中的巨集（null 表示沒有）,
    //   isNew: 剛按「＋ 新增」建立的資料（用途與巨集 1 同時編輯）,
    //   newMacro: 剛按「＋ 新增巨集」建立的巨集,
    //   autofocus: 'title' | 'content' | null,
    //   fields: 目前畫面上的輸入框 { title, note, label, content },
    //   draft: 重繪前保留的草稿,
    // }

    function readFields(ed) {
        const out = {};
        Object.entries(ed.fields || {}).forEach(([k, node]) => { out[k] = node.value; });
        return out;
    }

    function editOriginals(ed) {
        const entry = findEntry(ed.entryId);
        const m = entry && ed.macroId ? entry.macros.find(x => x.id === ed.macroId) : null;
        return {
            title: entry ? (ed.isNew ? '' : entry.title) : '',
            note: entry ? entry.note : '',
            label: m ? m.label : '',
            content: m ? m.content : '',
        };
    }

    function isEditDirty(ed) {
        if (!ed) return false;
        const orig = editOriginals(ed);
        const cur = readFields(ed);
        return Object.keys(cur).some(k => (k === 'content' ? normalizeNewlines(cur[k]) : cur[k]) !== orig[k]);
    }

    // 目前若有編輯中且有未儲存變更，詢問是否放棄；可以離開時回傳 true
    function requestLeaveEdit() {
        const ed = state.editing;
        if (!ed) return true;
        if (isEditDirty(ed) && !confirm('有尚未儲存的變更，確定要放棄嗎？')) return false;
        discardEdit();
        return true;
    }

    // 放棄編輯：新增後沒儲存就取消 → 整筆移除；新增的巨集沒輸入就取消 → 移除（每筆至少保留一個）
    function discardEdit() {
        const ed = state.editing;
        state.editing = null;
        if (!ed) return;
        const entry = findEntry(ed.entryId);
        if (!entry) return;
        if (ed.isNew) {
            removeEntry(entry);
        } else if (ed.newMacro) {
            const idx = entry.macros.findIndex(m => m.id === ed.macroId);
            if (idx >= 0 && entry.macros.length > 1 && !entry.macros[idx].content && !entry.macros[idx].label) {
                entry.macros.splice(idx, 1);
                commit(entry);
            }
        }
    }

    function saveEdit() {
        const ed = state.editing;
        if (!ed) return;
        const entry = findEntry(ed.entryId);
        const v = readFields(ed);
        state.editing = null;
        if (!entry) {
            renderAll();
            return;
        }
        let changed = false;
        if ('title' in v) {
            const title = v.title.trim() || DEFAULT_TITLE;
            const note = v.note.replace(/\s+$/, '');
            if (title !== entry.title || note !== entry.note) {
                entry.title = title;
                entry.note = note;
                changed = true;
            }
        }
        if ('content' in v) {
            const m = entry.macros.find(x => x.id === ed.macroId);
            if (m) {
                const label = v.label.trim();
                const content = normalizeNewlines(v.content);
                if (label !== m.label || content !== m.content) {
                    m.label = label;
                    m.content = content;
                    changed = true;
                }
            }
        }
        if (changed) commit(entry);
        renderAll();
    }

    function cancelEdit() {
        discardEdit();
        renderAll();
    }

    function startEdit(ed) {
        if (state.readOnly || !requestLeaveEdit()) return;
        state.editing = ed;
        renderAll();
    }

    // ----- 資料 -----

    function selectEntry(id) {
        if (id === state.selectedId) {
            setMenuOpen(false);
            return;
        }
        if (!requestLeaveEdit()) return;
        if (!findEntry(id)) { renderAll(); return; } // 被放棄的新資料
        state.selectedId = id;
        state.menuOpen = false;
        saveLastSelected();
        renderAll();
    }

    function addEntry() {
        if (state.readOnly || !requestLeaveEdit()) return;
        const now = nowIso();
        const entry = { id: newId(), title: DEFAULT_TITLE, note: '', order: -1, createdAt: now, updatedAt: now, macros: [newMacro()] };
        state.data.entries.push(entry);
        normalizeOrders(state.data.entries);
        state.selectedId = entry.id;
        state.filter = '';
        $('search').value = '';
        state.menuOpen = false;
        saveLastSelected();
        commit(entry);
        state.editing = { entryId: entry.id, header: true, macroId: entry.macros[0].id, isNew: true, autofocus: 'title' };
        renderAll();
    }

    // 移除一筆資料並選取清單中相鄰的下一筆
    function removeEntry(entry) {
        const list = visibleEntries();
        const idx = list.findIndex(e => e.id === entry.id);
        const neighbor = idx >= 0 ? (list[idx + 1] || list[idx - 1]) : null;
        state.data.entries = state.data.entries.filter(e => e.id !== entry.id);
        normalizeOrders(state.data.entries);
        if (state.selectedId === entry.id) state.selectedId = neighbor ? neighbor.id : null;
        ensureSelection();
        commit(null);
    }

    function deleteEntry(entry) {
        if (!requestLeaveEdit()) return;
        if (findEntry(entry.id) && confirm(`確定刪除「${entry.title}」？此動作無法復原。`)) removeEntry(entry);
        renderAll();
    }

    function moveEntry(id, delta) {
        const list = sortedEntries();
        const from = list.findIndex(e => e.id === id);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= list.length) return;
        const [e] = list.splice(from, 1);
        list.splice(to, 0, e);
        reorderEntries(list.map(x => x.id));
        focusHandle(id);
    }

    function reorderEntries(ids) {
        ids.forEach((id, i) => {
            const e = findEntry(id);
            if (e) e.order = i;
        });
        normalizeOrders(state.data.entries);
        commit(null);
        renderSidebar();
    }

    function addMacro(entry) {
        if (state.readOnly || !requestLeaveEdit()) return;
        const m = newMacro();
        entry.macros.push(m);
        commit(entry);
        state.editing = { entryId: entry.id, header: false, macroId: m.id, newMacro: true, autofocus: 'content' };
        renderAll();
    }

    function deleteMacro(entry, m, index) {
        if (!requestLeaveEdit()) return;
        if (confirm(`確定刪除「${macroLabel(m, index)}」？此動作無法復原。`)) {
            entry.macros = entry.macros.filter(x => x.id !== m.id);
            if (!entry.macros.length) entry.macros.push(newMacro());
            commit(entry);
        }
        renderAll();
    }

    function moveMacro(entry, id, delta) {
        const from = entry.macros.findIndex(m => m.id === id);
        const to = from + delta;
        if (from < 0 || to < 0 || to >= entry.macros.length) return;
        const ids = entry.macros.map(m => m.id);
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        reorderMacros(entry, ids);
        focusHandle(id);
    }

    function reorderMacros(entry, ids) {
        const byId = new Map(entry.macros.map(m => [m.id, m]));
        const next = ids.map(id => byId.get(id)).filter(Boolean);
        if (next.length !== entry.macros.length) return renderAll();
        entry.macros = next;
        commit(entry);
        renderAll();
    }

    function focusHandle(id) {
        const node = document.querySelector(`.drag-handle[data-handle="${CSS.escape(id)}"]`);
        if (node) node.focus();
    }

    // ---------- 拖曳排序（Pointer Events，滑鼠與觸控共用）----------
    // 拖曳中的項目以 transform 跟著指標移動；超過相鄰項目的一半時在 DOM 中換位，放開後依 DOM 順序回報
    let lastDragEnd = 0; // 拖曳放開時可能觸發一次 click，用來避免被當成「點擊複製」

    function startDrag(e, itemEl, opts) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        // 不用 setPointerCapture：拖曳中項目會在 DOM 中搬動，capture 會因此失效，改在 window 上監聽
        const pointerId = e.pointerId;

        const { container, itemSelector, scroller, onDrop } = opts;
        const items = () => [...container.querySelectorAll(itemSelector)];
        const idsOf = () => items().map(n => n.dataset.id);
        const startIds = idsOf().join('\n');
        const rect = itemEl.getBoundingClientRect();
        const height = rect.height;
        const grabOffset = e.clientY - rect.top;
        let pointerY = e.clientY;
        let offset = 0;
        let raf = 0;
        let done = false;

        itemEl.classList.add('dragging');
        document.body.classList.add('is-dragging');

        function place() {
            const top = pointerY - grabOffset;
            const bottom = top + height;
            const list = items();
            const idx = list.indexOf(itemEl);
            let moved = false;
            for (let i = 0; i < idx; i++) {
                const r = list[i].getBoundingClientRect();
                if (top < r.top + r.height / 2) { list[i].before(itemEl); moved = true; break; }
            }
            if (!moved) {
                for (let i = list.length - 1; i > idx; i--) {
                    const r = list[i].getBoundingClientRect();
                    if (bottom > r.top + r.height / 2) { list[i].after(itemEl); break; }
                }
            }
            const naturalTop = itemEl.getBoundingClientRect().top - offset;
            offset = top - naturalTop;
            itemEl.style.transform = `translateY(${offset}px)`;
        }

        // 指標靠近邊緣時自動捲動（清單本身或整個頁面）
        function tick() {
            const b = scroller ? scroller.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
            const edge = 40;
            let dy = 0;
            if (pointerY < b.top + edge) dy = -Math.min(14, (b.top + edge - pointerY) / 2);
            else if (pointerY > b.bottom - edge) dy = Math.min(14, (pointerY - (b.bottom - edge)) / 2);
            if (dy) {
                if (scroller) scroller.scrollTop += dy;
                else window.scrollBy(0, dy);
                place();
            }
            raf = requestAnimationFrame(tick);
        }

        function onMove(ev) {
            if (ev.pointerId !== pointerId) return;
            pointerY = ev.clientY;
            place();
        }

        function finish(ev) {
            if (done || ev.pointerId !== pointerId) return;
            done = true;
            cancelAnimationFrame(raf);
            // 快速甩動時最後一個 pointermove 可能沒進來，放開的位置也要算進去
            if (ev.type === 'pointerup') {
                pointerY = ev.clientY;
                place();
            }
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', finish);
            window.removeEventListener('pointercancel', finish);
            lastDragEnd = performance.now();
            itemEl.classList.remove('dragging');
            itemEl.style.transform = '';
            document.body.classList.remove('is-dragging');
            const ids = idsOf();
            if (ev.type === 'pointercancel') renderAll(); // 還原
            else if (ids.join('\n') !== startIds) onDrop(ids);
        }

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', finish);
        window.addEventListener('pointercancel', finish);
        raf = requestAnimationFrame(tick);
    }

    function dragHandle(id, label, onPointerDown, onMove) {
        return h('button', {
            type: 'button',
            class: 'drag-handle',
            'data-handle': id,
            title: '拖曳排序',
            'aria-label': `${label}：拖曳排序，或用方向鍵 ↑↓ 移動`,
            onpointerdown: onPointerDown,
            onkeydown: ev => {
                if (ev.key === 'ArrowUp' || ev.key === 'ArrowDown') {
                    ev.preventDefault();
                    onMove(ev.key === 'ArrowUp' ? -1 : 1);
                }
            },
        }, '⋮⋮');
    }

    // ---------- 渲染 ----------

    function renderAll() {
        renderSidebar();
        renderDetail();
        renderStatus();
    }

    function setMenuOpen(open) {
        state.menuOpen = open;
        renderSidebar();
    }

    function renderSidebar() {
        const list = $('entry-list');
        const items = visibleEntries();
        list.replaceChildren();
        if (!state.data.entries.length) {
            list.append(h('li', { class: 'list-empty' }, '尚無資料'));
        } else if (!items.length) {
            list.append(h('li', { class: 'list-empty' }, '找不到符合的資料'));
        }
        // 搜尋中只顯示部分資料，排序會有歧義，所以不提供拖曳
        const canSort = !state.readOnly && !isFiltering() && items.length > 1;
        items.forEach(e => {
            const active = e.id === state.selectedId;
            list.append(h('li', { class: 'entry-row' + (canSort ? ' sortable' : ''), 'data-id': e.id },
                h('button', {
                    type: 'button',
                    class: 'entry-item' + (active ? ' active' : ''),
                    title: e.title,
                    'aria-current': active ? 'true' : null,
                    onclick: () => selectEntry(e.id),
                },
                h('span', { class: 'entry-item-title' }, e.title),
                h('span', { class: 'entry-item-meta' }, `${e.macros.length} 個巨集`)),
                canSort ? dragHandle(e.id, e.title,
                    ev => startDrag(ev, ev.currentTarget.closest('.entry-row'), {
                        container: list,
                        itemSelector: ':scope > .entry-row',
                        scroller: list,
                        onDrop: reorderEntries,
                    }),
                    delta => moveEntry(e.id, delta)) : null));
        });

        const selected = findEntry(state.selectedId);
        $('mobile-current').textContent = selected ? selected.title : '';
        $('add-entry').disabled = state.readOnly;
        $('side-panel').classList.toggle('open', state.menuOpen);
        const toggle = $('menu-toggle');
        toggle.textContent = state.menuOpen ? '清單 ▴' : '清單 ▾';
        toggle.setAttribute('aria-expanded', String(state.menuOpen));
    }

    function renderDetail() {
        const root = $('detail');
        const ed = state.editing;
        // 若重繪時正在編輯，先保留草稿，輸入框會在下面重新建立
        if (ed) {
            if (ed.fields && Object.keys(ed.fields).length) ed.draft = readFields(ed);
            ed.fields = {};
        }
        root.replaceChildren();

        if (state.readOnly) {
            root.append(h('div', { class: 'notice' }, '檔案版本較新，請更新頁面。目前以唯讀方式顯示，不會寫回。'));
        }

        if (!state.data.entries.length) {
            root.append(h('div', { class: 'empty-guide' }, '還沒有任何巨集，按左側『＋ 新增』開始'));
            return;
        }
        const entry = findEntry(state.selectedId);
        if (!entry) {
            root.append(h('div', { class: 'empty-guide' }, '請從清單選擇一筆資料'));
            return;
        }

        root.append(renderEntryHeader(entry));
        const section = h('section', { class: 'macro-section' },
            h('h3', { class: 'section-title' }, `巨集（${entry.macros.length}）`));
        entry.macros.forEach((m, i) => section.append(renderBlock(entry, m, i, section)));
        if (!state.readOnly) {
            section.append(h('button', { type: 'button', class: 'btn btn-secondary add-macro', onclick: () => addMacro(entry) }, '＋ 新增巨集'));
        }
        root.append(section);

        root.querySelectorAll('textarea.autogrow').forEach(autoGrow);
        if (ed && ed.autofocus && ed.fields) {
            const target = ed.fields[ed.autofocus];
            ed.autofocus = null;
            if (target) {
                target.focus();
                if (target.tagName === 'INPUT') target.select();
                else target.setSelectionRange(target.value.length, target.value.length);
            }
        }
    }

    // Ctrl/⌘+Enter 儲存、Esc 取消；onEnter：單按 Enter 時要做的事（null 表示照常換行）
    function bindEditKeys(node, onEnter) {
        node.addEventListener('keydown', e => {
            if (isComposing(e)) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Enter' && !e.shiftKey && onEnter) {
                e.preventDefault();
                onEnter();
            }
        });
    }

    function editButtons(hint) {
        return [
            h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: saveEdit }, '儲存'),
            h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: cancelEdit }, '取消'),
            h('span', { class: 'edit-hint' }, hint),
        ];
    }

    function renderEntryHeader(entry) {
        const ed = state.editing;
        if (ed && ed.header && ed.entryId === entry.id) {
            const orig = editOriginals(ed);
            const draft = ed.draft || {};
            const withMacro = !!ed.macroId; // 新增資料：用途與巨集 1 同時編輯，儲存鈕在巨集區塊下方
            const titleInput = h('input', {
                type: 'text', class: 'input title-input', value: draft.title ?? orig.title,
                placeholder: `用途（例如：絕亞 P1 站位）`, 'aria-label': '用途',
            });
            const noteInput = h('textarea', {
                class: 'input note-input autogrow', value: draft.note ?? orig.note, rows: 2,
                placeholder: '備註（可空白）', 'aria-label': '備註',
            });
            noteInput.addEventListener('input', () => autoGrow(noteInput));
            bindEditKeys(titleInput, withMacro ? () => ed.fields.content && ed.fields.content.focus() : saveEdit);
            bindEditKeys(noteInput, null);
            ed.fields.title = titleInput;
            ed.fields.note = noteInput;
            return h('div', { class: 'entry-header editing' },
                titleInput,
                noteInput,
                withMacro
                    ? h('div', { class: 'edit-hint' }, 'Enter 跳到巨集內容・Ctrl/⌘+Enter 儲存・Esc 取消')
                    : h('div', { class: 'edit-actions' }, editButtons('Enter 儲存・Esc 取消')));
        }

        return h('div', { class: 'entry-header' },
            h('div', { class: 'entry-head-main' },
                h('h2', { class: 'entry-title' }, entry.title),
                entry.note.trim() ? h('p', { class: 'entry-note' }, entry.note) : null),
            state.readOnly ? null : h('div', { class: 'entry-actions' },
                h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => startEdit({ entryId: entry.id, header: true, macroId: null, autofocus: 'title' }) }, '✎ 編輯'),
                h('button', { type: 'button', class: 'btn btn-danger btn-sm', onclick: () => deleteEntry(entry) }, '🗑 刪除')));
    }

    function renderBlock(entry, m, index, section) {
        const ed = state.editing;
        const editing = !!(ed && ed.entryId === entry.id && ed.macroId === m.id);
        const label = macroLabel(m, index);
        const ro = state.readOnly;

        const warn = h('div', { class: 'block-warn', hidden: true }, `⚠ 超過遊戲單一巨集 ${MAX_LINES} 行上限`);
        // 只在編輯時提示超過 15 行，平常檢視不顯示
        const updateWarn = text => { warn.hidden = lineCount(text) <= MAX_LINES; };

        let body, labelNode, textarea = null, actions = null;
        if (editing) {
            const orig = editOriginals(ed);
            const draft = ed.draft || {};
            labelNode = h('input', {
                type: 'text', class: 'label-input', value: draft.label ?? orig.label,
                placeholder: `巨集 ${index + 1}`, 'aria-label': '巨集名稱',
            });
            textarea = h('textarea', {
                class: 'block-textarea autogrow', value: draft.content ?? orig.content,
                placeholder: '/p 在這裡輸入巨集內容…', 'aria-label': `${label} 內容`,
            });
            textarea.spellcheck = false;
            textarea.addEventListener('input', () => {
                autoGrow(textarea);
                updateWarn(textarea.value);
            });
            bindEditKeys(labelNode, () => textarea.focus());
            bindEditKeys(textarea, null);
            ed.fields.label = labelNode;
            ed.fields.content = textarea;
            body = textarea;
            actions = h('div', { class: 'block-edit-actions' }, editButtons('Ctrl/⌘+Enter 儲存・Esc 取消'));
            updateWarn(textarea.value);
        } else {
            labelNode = h('span', { class: 'block-label', title: label }, label);
            body = m.content
                ? h('div', { class: 'block-body' }, m.content)
                : h('div', { class: 'block-body empty' }, ro ? '（空白巨集）' : '（空白巨集，按 ✎ 編輯）');
        }

        const copyBtn = h('button', {
            type: 'button', class: 'block-btn copy-btn', title: '複製巨集內容',
            onclick: () => copyWithFeedback(copyBtn, textarea ? textarea.value : m.content),
        }, '複製');

        const canSort = !ro && !editing && entry.macros.length > 1;
        const block = h('div', { class: 'macro-block' + (editing ? ' editing' : ''), 'data-id': m.id },
            h('div', { class: 'block-head' },
                canSort ? dragHandle(m.id, label,
                    ev => startDrag(ev, block, {
                        container: section,
                        itemSelector: ':scope > .macro-block',
                        scroller: null,
                        onDrop: ids => reorderMacros(entry, ids),
                    }),
                    delta => moveMacro(entry, m.id, delta)) : null,
                labelNode,
                h('div', { class: 'block-tools' },
                    copyBtn,
                    !ro && !editing ? [
                        h('button', { type: 'button', class: 'block-btn icon', title: '編輯', 'aria-label': '編輯', onclick: () => startEdit({ entryId: entry.id, header: false, macroId: m.id, autofocus: 'content' }) }, '✎'),
                        h('button', { type: 'button', class: 'block-btn icon danger', title: '刪除', 'aria-label': '刪除', onclick: () => deleteMacro(entry, m, index) }, '🗑'),
                    ] : null)),
            warn,
            body,
            actions);

        // 非編輯狀態：點區塊任何地方（按鈕以外）就複製
        if (!editing && m.content) {
            block.classList.add('copyable');
            block.title = '點擊複製';
            block.addEventListener('click', ev => {
                if (ev.target.closest('button, input, textarea, a')) return;
                if (performance.now() - lastDragEnd < 400) return;
                copyWithFeedback(copyBtn, m.content);
                block.classList.remove('flash');
                void block.offsetWidth; // 重新觸發動畫
                block.classList.add('flash');
            });
        }
        return block;
    }

    function renderStatus() {
        const panel = $('storage-panel');
        if (!panel) return;
        panel.replaceChildren(h('h3', { class: 'section-title' }, '儲存位置'));

        const statusLine = () => {
            if (state.saveStatus === 'error') {
                return h('button', { type: 'button', class: 'status-error', title: state.saveError, onclick: retrySave },
                    '⚠ 儲存失敗（點此重試）');
            }
            return state.saveStatus === 'saving'
                ? h('div', { class: 'save-status saving' }, '● 儲存中…')
                : h('div', { class: 'save-status saved' }, '● 已儲存');
        };

        if (state.storageMode === 'folder' && state.dirHandle) {
            const name = state.dirHandle.name;
            panel.append(h('div', { class: 'storage-where', title: name }, `📁 ${name}`));
            if (state.needsReconnect) {
                panel.append(
                    h('p', { class: 'storage-hint warn' }, state.reconnectReason || '需要重新授權才能寫入資料夾，目前顯示的是瀏覽器中的快取。'),
                    h('button', { type: 'button', class: 'btn btn-primary btn-block btn-sm', onclick: reconnectFolder }, `🔗 重新連結「${name}」`));
            } else {
                panel.append(statusLine());
            }
            panel.append(h('div', { class: 'btn-row' },
                h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: pickFolder }, '更換資料夾'),
                h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: disconnectFolder }, '中斷連結')));
        } else {
            panel.append(h('div', { class: 'storage-where' }, '💾 儲存在此瀏覽器'));
            if (state.saveStatus === 'error') panel.append(statusLine());
            panel.append(h('p', { class: 'storage-hint' }, '清除瀏覽器資料會遺失，請定期匯出'));
            if (FOLDER_SUPPORTED) {
                panel.append(h('button', { type: 'button', class: 'btn btn-secondary btn-block btn-sm', onclick: pickFolder }, '📁 選擇儲存資料夾'));
            } else {
                panel.append(h('p', { class: 'storage-hint' }, '此瀏覽器不支援直接存到資料夾，請使用 Chrome / Edge，或使用匯出／匯入'));
            }
        }

        const fileInput = h('input', {
            type: 'file', accept: '.json,application/json', hidden: true,
            onchange: () => {
                const file = fileInput.files && fileInput.files[0];
                fileInput.value = '';
                if (file) importFile(file);
            },
        });
        panel.append(h('div', { class: 'btn-row' },
            h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: exportJson, disabled: !state.data.entries.length }, '匯出'),
            h('button', { type: 'button', class: 'btn btn-secondary btn-sm', onclick: () => fileInput.click(), disabled: state.readOnly }, '匯入')),
            fileInput);
    }

    // ---------- 初始化 ----------

    async function init() {
        const local = loadLocal();
        if (local) {
            state.data = local.data;
            state.readOnly = local.readOnly;
        }
        state.selectedId = loadLastSelected();
        ensureSelection();

        $('search').addEventListener('input', e => {
            state.filter = e.target.value;
            renderSidebar();
        });
        $('add-entry').addEventListener('click', addEntry);
        $('menu-toggle').addEventListener('click', () => setMenuOpen(!state.menuOpen));

        window.addEventListener('beforeunload', e => {
            const unsavedEdit = isEditDirty(state.editing);
            if (hasPendingWrite() || unsavedEdit) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        renderAll();

        if (!FOLDER_SUPPORTED) return;
        const handle = await idb.getHandle();
        if (!handle) return;
        state.storageMode = 'folder';
        state.dirHandle = handle;
        if (await ensurePermission(handle, false)) {
            if (!(await connectFolder(handle, false))) {
                state.needsReconnect = true;
                state.reconnectReason = '資料夾中的檔案無法讀取，已暫停寫入。';
            }
        } else {
            state.needsReconnect = true;
        }
        renderStatus();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    return { state };
})();
