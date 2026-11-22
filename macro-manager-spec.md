# 巨集管理工具（Macro Manager）規格

> 目標專案：`FFXIVTools`（純前端靜態站，GitHub Pages）
> 新增頁面：`macro.html` + `css/macro.css` + `js/macro.js`
> 語系：zh-TW

---

## 1. 目的

管理大量 FF14 巨集。每筆資料有一個「用途」與一個以上的巨集；檢視時可直接看到巨集內容、一鍵複製（類似程式碼區塊右上角的 Copy 按鈕）、並可就地編輯。資料存放在使用者自選的本機資料夾（不支援的瀏覽器退回瀏覽器儲存＋匯入／匯出）。

---

## 2. 與現有專案的整合

依照現有頁面慣例（每個工具一組 `xxx.html` / `css/xxx.css` / `js/xxx.js`，無建置流程、無框架）：

| 項目 | 內容 |
|---|---|
| 新檔案 | `macro.html`、`css/macro.css`、`js/macro.js` |
| `index.html` | 在 `.nav-links` 加一個 `.nav-item`：`巨集管理工具` / `<span>Macro Manager</span>`，放在最後 |
| `<head>` | 同其他頁：`favicon.ico`、`js/ga.js`、`<html lang="zh-TW">` |
| 頁首 | `.back-link`「← 返回導航頁」、`h1`「巨集管理工具」、`.subtitle`「Macro Manager」 |
| 引用 JS | `js/macro.js?v=1`（沿用 `?v=` 版本參數做快取更新） |
| 本機預覽 | 既有 `.claude/launch.json` 的 `static-site`（`python3 -m http.server 8931`） |

**GA 注意**：不得把任何巨集內容、用途文字送進 GA event。

---

## 3. 版面

### 3.1 外框

沿用現有羊皮紙 `.container`（`--paper-bg`、parchment 貼圖、金色內框 `::before`、深色點點背景 body），但這頁需要兩欄，所以容器加寬：

```css
.container.wide { max-width: 1080px; }
```

### 3.2 兩欄配置（桌面 ≥ 760px）

```
┌──────────────────────────────────────────────────────┐
│ ← 返回導航頁        巨集管理工具 / MACRO MANAGER        │
├──────────────┬───────────────────────────────────────┤
│ [🔍 搜尋…]    │  絕亞 P1 站位            [✎ 編輯][🗑]   │
│ [+ 新增]      │  備註：給固定隊用，開場前貼到小隊…        │
│ ───────────  │                                       │
│ ▌絕亞 P1 站位 │  ┌ 巨集 1 ─────── 12/15 行 [複製][✎][🗑]┐│
│  零式 4 層減傷│  │/p 【P1】                          ││
│  採集 輪替    │  │/p MT ← 左上  ST → 右上             ││
│  …           │  │…                                  ││
│              │  └───────────────────────────────────┘│
│ ───────────  │  ┌ 巨集 2 ─────────────────── [複製]…┐ │
│ 📁 my-macros │  │…                                  ││
│ ● 已儲存      │  └───────────────────────────────────┘│
│ [匯出][匯入]  │  [+ 新增巨集]                          │
└──────────────┴───────────────────────────────────────┘
```

- 左欄寬 240px，`grid-template-columns: 240px 1fr; gap: 20px`。
- 左欄清單可獨立捲動（`max-height: calc(100vh - 220px); overflow-y: auto`），右欄隨頁面捲動。

### 3.3 窄螢幕（< 760px）

- 改單欄；左欄收成頂部一列：`[清單 ▾]` 按鈕 + 目前選取項目名稱，點開展開清單（overlay 或下推皆可），選完自動收合。
- 不可出現水平捲動；巨集區塊內長行自動換行（`white-space: pre-wrap; word-break: break-all`）。

---

## 4. 功能

### 4.1 左側清單（Menu）

- 每列顯示「用途」（`title`），單行省略號截斷；滑過顯示完整文字（`title` 屬性）。
- 次要文字（小字、`#8c7a6b`）：巨集數量，例如 `3 個巨集`。
- 排序：預設依 `updatedAt` 由新到舊。（P2：拖曳自訂排序，存 `order` 欄位）
- 選取中的項目：背景 `#5d4037`、文字 `#f8f1e5`（同 `.nav-item`）。
- Hover：`rgba(255,255,255,0.85)` 背景 + `--gold` 邊框（同 `.dungeon-card:hover`）。
- **搜尋框**：即時篩選，比對 `title`、`note`、所有巨集的 `label` 與 `content`（不分大小寫）。無結果時顯示「找不到符合的資料」。
- **＋ 新增**：建立一筆空白資料（`title` = `未命名`，含 1 個空巨集），自動選取並讓 `title` 進入編輯狀態、focus。
- 清單為空時，右側顯示引導：「還沒有任何巨集，按左側『＋ 新增』開始」。
- 最後選取的項目 id 存在 `localStorage`（`ffxiv-macro:lastSelected`），重開頁面時還原。

### 4.2 右側檢視區

#### 標頭（Entry header）

- `title`（用途）：大字 `#4a3728`。
- `note`（備註，可空，多行）：小字 `#5d4037`，保留換行。空白時不顯示。
- 右側按鈕：`✎ 編輯`、`🗑 刪除`。
  - 編輯：`title` 變 `<input>`、`note` 變 `<textarea>`，下方出現 `[儲存] [取消]`。`Enter`（在 input）/ `Cmd/Ctrl+Enter` 儲存，`Esc` 取消。`title` 不可空白（trim 後為空則還原為 `未命名`）。
  - 刪除：`confirm('確定刪除「{title}」？此動作無法復原。')`，刪除後選取清單中相鄰的下一筆。

#### 巨集區塊（Copyable Block）——本工具的核心

每個巨集一個區塊，依 `macros` 陣列順序顯示：

- **外觀**：深色區塊，類似程式碼區塊但走這個站的配色
  - 背景 `#3e2723`、文字 `#f8f1e5`、圓角 6px、`box-shadow: 0 2px 6px rgba(0,0,0,0.15)`
  - 字型：`"Noto Sans Mono CJK TC", "Sarasa Mono TC", Menlo, Consolas, "PingFang TC", "Microsoft JhengHei", monospace`；13.5px；`line-height: 1.7`
  - `white-space: pre-wrap`，完整呈現巨集原文（**檢視時就看得到要複製的內容**）
- **區塊頂列**（類似 code block 的 header，背景 `#2d1f1a`）：
  - 左：`label`（例如「巨集 1」，可空；空時顯示 `巨集 {n}`）
  - 右：行數徽章 `12 / 15 行`（超過 15 行時徽章變紅 `#e53e3e`，並顯示提示「超過遊戲單一巨集 15 行上限」）
  - 右：`[複製]` `[✎]` `[🗑]` 按鈕
- **複製**：
  - `navigator.clipboard.writeText(content)`；失敗時 fallback 到隱藏 `<textarea>` + `document.execCommand('copy')`。
  - 複製前處理：換行統一為 `\n`、去除結尾多餘空行（避免在遊戲內多出空白行）；其餘原樣。
  - 回饋：按鈕文字變 `已複製 ✓`、顏色變 `--gold`，1.5 秒後還原。
  - 整個區塊內容區也可雙擊複製（P2，可選）。
- **就地編輯（✎）**：
  - 內容區變成同樣樣式的 `<textarea>`（深色背景、同字型、高度自動隨內容延展），上方 `label` 變 `<input>`。
  - 編輯中行數徽章即時更新。
  - `[儲存] [取消]`；`Cmd/Ctrl+Enter` 儲存、`Esc` 取消。
  - 同一時間只允許一個區塊在編輯中；切換時若有未儲存變更，詢問是否放棄。
- **刪除（🗑）**：`confirm`；若是最後一個巨集，刪除後保留一個空巨集（每筆資料至少 1 個巨集）。
- **排序**：區塊頂列加 `↑` `↓` 小按鈕（P1）；拖曳排序（P2）。
- 區塊下方 `[+ 新增巨集]`：新增空巨集並直接進入編輯狀態。

### 4.3 FF14 巨集限制提示

| 限制 | 處理 |
|---|---|
| 單一巨集最多 15 行 | 行數徽章 + 超過時紅字警示（不阻擋儲存，因為使用者可能刻意存長文再分段） |
| 單行長度上限 | P2：實作前以遊戲內實測確認上限後再加警示，先不做 |

---

## 5. 資料儲存

### 5.1 資料格式（單一 JSON 檔）

檔名：`ff14-macros.json`

```json
{
  "app": "ffxiv-macro-manager",
  "version": 1,
  "updatedAt": "2026-11-22T10:00:00.000Z",
  "entries": [
    {
      "id": "e_lq2x9a",
      "title": "絕亞 P1 站位",
      "note": "給固定隊用",
      "createdAt": "2026-11-22T09:00:00.000Z",
      "updatedAt": "2026-11-22T10:00:00.000Z",
      "macros": [
        { "id": "m_8fk2p1", "label": "巨集 1", "content": "/p 【P1】\n/p MT ← 左上" }
      ]
    }
  ]
}
```

- `id`：`crypto.randomUUID()`（GitHub Pages 為 HTTPS，可用）。
- 讀取時要容錯：缺欄位補預設值；`version` 不認得時提示「檔案版本較新，請更新頁面」並以唯讀方式載入（不寫回）。
- JSON 以 2 空格縮排寫出，方便使用者用 git／雲端硬碟做版本控管或手動編輯。

### 5.2 儲存模式

偵測 `'showDirectoryPicker' in window` 決定可用模式。

#### A. 資料夾模式（Chrome / Edge 等 Chromium）

1. 左欄底部顯示 `[📁 選擇儲存資料夾]`。
2. 使用者選資料夾（`showDirectoryPicker({ mode: 'readwrite', id: 'ffxiv-macro' })`）：
   - 資料夾內已有 `ff14-macros.json`，且目前瀏覽器內也有資料 → 對話框三選一：**載入資料夾中的檔案** / **以目前資料覆蓋檔案** / 取消。
   - 只有一邊有資料 → 直接採用那一邊。
3. `FileSystemDirectoryHandle` 存進 IndexedDB（DB `ffxiv-macro`、store `handles`、key `dir`），下次開頁可重用。
4. 重新開頁時：
   - `handle.queryPermission({ mode: 'readwrite' })` 為 `granted` → 直接讀檔。
   - 否則顯示 `[🔗 重新連結「{資料夾名}」]` 按鈕（`requestPermission` 必須由使用者點擊觸發）；連結前先用 localStorage 快取顯示資料。
5. 寫入：任何變更後 debounce 600ms，`getFileHandle('ff14-macros.json', { create: true })` → `createWritable()` → `write` → `close`。
6. 狀態列：`📁 {資料夾名}` + `● 已儲存` / `● 儲存中…` / `⚠ 儲存失敗（點此重試）`。
7. 提供 `[更換資料夾]` / `[中斷連結]`。

#### B. 瀏覽器模式（Firefox / Safari，或使用者未選資料夾時）

- 資料自動存在 `localStorage`（key `ffxiv-macro:data`）。
- 狀態列顯示 `💾 儲存在此瀏覽器` 與小字提醒「清除瀏覽器資料會遺失，請定期匯出」。
- 不支援資料夾模式的瀏覽器，隱藏「選擇資料夾」按鈕，改顯示「此瀏覽器不支援直接存到資料夾，請使用 Chrome / Edge，或使用匯出／匯入」。

#### 兩種模式共通

- `localStorage` 永遠保留一份最新快取（資料夾模式下也是），作為離線/未授權時的備援。
- **匯出**：下載 `ff14-macros-YYYYMMDD.json`（Blob + `<a download>`）。
- **匯入**：選 `.json` 檔 → 驗證格式 → 對話框：**合併**（以 `id` 判斷，相同 id 以 `updatedAt` 較新者為準）/ **取代全部** / 取消。
- 關閉分頁前若還有未寫入的變更（debounce 中或寫入失敗），`beforeunload` 提示。

---

## 6. 視覺規格（取自 FFXIVTools 現有色票）

```css
:root {
    --paper-bg: #f8f1e5;
    --paper-dark: #e6d5b8;
    --ink: #3d2b1f;
    --gold: #b8860b;
    --heading: #4a3728;
    --muted: #8c7a6b;
    --brown: #5d4037;
    --brown-dark: #3e2723;
    --border: #d4c4a8;
    --danger: #e53e3e;
    --block-bg: #3e2723;
    --block-head: #2d1f1a;
    --block-text: #f8f1e5;
}
```

| 元件 | 樣式來源 |
|---|---|
| body 背景、容器、金色內框 | 同 `css/deep-dungeon.css` 的 `body` / `.container` / `::before` |
| 主要按鈕（＋新增、儲存） | 背景 `--brown`，hover `--brown-dark`，文字 `--paper-bg`，圓角 6px |
| 次要按鈕（取消、匯出、匯入） | 透明底 + `1px solid --border`，hover 邊框 `--gold` |
| 危險按鈕（刪除） | 文字 `--danger`，hover 淡紅底 |
| 清單項目 / 卡片 | 同 `.dungeon-card` 的半透明白底、`--border` 邊框 |
| 區段標題 | 同 `.info-group h3`（左側 4px 金色邊） |
| 輸入框 | 白底 `rgba(255,255,255,0.7)`、`1px solid --border`，focus 邊框 `--gold` |

---

## 7. 程式結構建議（`js/macro.js`）

沿用 `deep-dungeon.js` 的 IIFE 寫法、`escapeHtml` 慣例，所有使用者內容一律以 `textContent` / escape 後輸出（避免 XSS）。

```
MacroApp (IIFE)
├─ state: { data, selectedId, filter, editing, storageMode, dirHandle, saveStatus }
├─ store/
│   ├─ loadLocal() / saveLocal()
│   ├─ idb: getHandle() / setHandle() / clearHandle()
│   ├─ pickFolder() / reconnectFolder() / readFile() / writeFile()
│   └─ scheduleSave()            // debounce → 寫檔 + 寫 localStorage
├─ io/ exportJson() / importJson(file)
├─ render/
│   ├─ renderSidebar()
│   ├─ renderDetail()
│   ├─ renderBlock(macro, index)
│   └─ renderStatus()
├─ actions/ addEntry, updateEntry, deleteEntry, addMacro, updateMacro, deleteMacro, moveMacro
└─ clipboard/ copyText(text)
```

---

## 8. 優先順序

**P1（第一版必做）**
- 兩欄版面＋窄螢幕單欄
- 新增／編輯／刪除資料（用途、備註）
- 新增／編輯／刪除／上下移動巨集
- 巨集區塊顯示內容＋右上角複製（含回饋與 fallback）
- 15 行提示
- 左側搜尋
- 資料夾模式（含 IndexedDB 記住資料夾、重新連結）
- 瀏覽器模式＋匯出／匯入
- `index.html` 加入導航

**P2（之後再說）**
- 拖曳排序（清單、巨集）
- 分類／標籤
- 單行長度警示
- 雙擊區塊複製
- 寫檔前保留一份 `ff14-macros.backup.json`

---

## 9. 驗收條件

1. GitHub Pages 上開啟 `macro.html`，Chrome 可選資料夾，新增資料後資料夾內出現 `ff14-macros.json`，內容正確。
2. 重新整理頁面後資料仍在；若權限需重新授權，點「重新連結」後可繼續寫入。
3. Firefox / Safari 開啟不報錯，以瀏覽器模式運作，匯出的 JSON 可在 Chrome 匯入。
4. 複製按鈕複製出的文字貼進 FF14 巨集編輯視窗，行數與內容與畫面一致、尾端無多餘空行。
5. 用途、備註、巨集內容含 `<script>`、`&`、emoji、中日文等字元，顯示與複製都正確、不被當作 HTML。
6. 375px 寬度下無水平捲動，所有按鈕可點擊。
7. 其他既有頁面外觀與功能不受影響（樣式只寫在 `css/macro.css`）。
