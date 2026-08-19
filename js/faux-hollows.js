(function () {
const BOARD_SIZE = 6;
const TOTAL_CELLS = 36;
const MAX_CLICKS = 11; // 剩餘可翻牌（標記道具）次數上限

const PHASE1_HINT = '🔍 點擊你翻到的障礙物格，其餘位置會自動推算。';
const PHASE2_HINT = '✅ 障礙物已確定，點格子標記實際發現的內容。';

// board：使用者實際標記的棋盤狀態，null 代表尚未標記
// null | 'obstacle' | 'sword' | 'chest' | 'fox' | 'empty'
let board = Array(TOTAL_CELLS).fill(null);
let obstaclesConfirmed = false; // 是否已經標滿 5 個障礙物，進入「標記道具」階段
let clickCount = 0; // 已消耗的翻牌次數
let selectedIndex = null; // 目前開啟 picker 的格子索引
let obstacleProb = Array(TOTAL_CELLS).fill(0); // 障礙物階段：每格是障礙物的機率 (%)
let treasureProb = {
    sword: Array(TOTAL_CELLS).fill(0),
    chest: Array(TOTAL_CELLS).fill(0),
    fox: Array(TOTAL_CELLS).fill(0),
    empty: Array(TOTAL_CELLS).fill(0)
};

let cellEls = [];
const gridEl = document.getElementById('grid');
const matchCountEl = document.getElementById('match-count');
const phaseLabelEl = document.getElementById('phase-label');
const hintEl = document.getElementById('hint-text');
const pickerOverlayEl = document.getElementById('picker-overlay');
const pickerEl = document.getElementById('picker-area');
const scoreBarEl = document.getElementById('score-bar');
const clicksLeftEl = document.getElementById('clicks-left');
const resetBtnEl = document.getElementById('reset-btn');

// 把使用者標記的狀態轉換成 BOARD_DATA 使用的數字代碼：
// 0=空格 1=障礙物 2=劍 3=寶箱 4=狐狸
function mapCellStateToCode(state) {
    switch (state) {
        case 'obstacle': return 1;
        case 'sword': return 2;
        case 'chest': return 3;
        case 'fox': return 4;
        case 'empty': return 0;
        default: return 0;
    }
}

// 檢查某個候選棋盤是否跟目前使用者已標記的格子都吻合。
// 未標記的格子 (null) 一律視為相容，略過不比對；
// 候選棋盤上代碼 4（狐狸）比較特殊：只要使用者標記的是「狐狸」或「空格」都算相容，
// 因為狐狸位置一旦被排除掉，實際上就會變成空格。
function boardMatches(candidateBoard) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const idx = r * BOARD_SIZE + c;
            const userValue = board[idx];
            if (userValue === null) continue;
            const mapped = mapCellStateToCode(userValue);
            const candidateValue = candidateBoard[r][c];
            if (candidateValue === 4) {
                if (mapped !== 4 && mapped !== 0) return false;
            } else if (mapped !== candidateValue) {
                return false;
            }
        }
    }
    return true;
}

// 從 258 個內建棋盤中，篩出所有跟目前標記狀態相容的候選棋盤
function getMatchingBoards() {
    return BOARD_DATA.filter(boardMatches);
}

// 統計目前 board 上，已標記為指定類型的格子數量
function countType(type) {
    return board.filter(v => v === type).length;
}

// 障礙物階段：依所有候選棋盤，統計每格「是障礙物」的機率，並更新符合盤面數
function updateObstacleProbabilities() {
    const matches = getMatchingBoards();
    const counts = Array(TOTAL_CELLS).fill(0);
    for (const candidateBoard of matches) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (candidateBoard[r][c] === 1) counts[r * BOARD_SIZE + c]++;
            }
        }
    }
    for (let i = 0; i < TOTAL_CELLS; i++) {
        obstacleProb[i] = matches.length ? Math.round(counts[i] / matches.length * 100) : 0;
    }
    matchCountEl.textContent = matches.length;
    return matches;
}

// 道具階段：依所有候選棋盤，統計每格出現劍/寶箱/狐狸/空格的機率
function updateTreasureProbabilities() {
    const matches = getMatchingBoards();
    // 狐狸在每個棋盤上只有一隻；一旦使用者已經標記出狐狸，
    // 其餘候選棋盤裡「原本可能是狐狸」的格子，實際上一定是空格
    const foxAlreadyFound = countType('fox') >= 1;
    const counts = { sword: Array(TOTAL_CELLS).fill(0), chest: Array(TOTAL_CELLS).fill(0), fox: Array(TOTAL_CELLS).fill(0), empty: Array(TOTAL_CELLS).fill(0) };
    for (const candidateBoard of matches) {
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                const v = candidateBoard[r][c];
                const idx = r * BOARD_SIZE + c;
                if (v === 2) counts.sword[idx]++;
                else if (v === 3) counts.chest[idx]++;
                else if (v === 4) {
                    if (foxAlreadyFound) counts.empty[idx]++;
                    else counts.fox[idx]++;
                } else if (v === 0) {
                    counts.empty[idx]++;
                }
            }
        }
    }
    for (let i = 0; i < TOTAL_CELLS; i++) {
        treasureProb.sword[i] = matches.length ? Math.round(counts.sword[i] / matches.length * 100) : 0;
        treasureProb.chest[i] = matches.length ? Math.round(counts.chest[i] / matches.length * 100) : 0;
        treasureProb.fox[i] = matches.length ? Math.round(counts.fox[i] / matches.length * 100) : 0;
        treasureProb.empty[i] = matches.length ? Math.round(counts.empty[i] / matches.length * 100) : 0;
    }
    matchCountEl.textContent = matches.length;
}

// 自動標記「所有候選棋盤都同意是障礙物」的格子，減少使用者需要手動點擊的次數。
// 回傳是否有新標記，讓呼叫端知道要不要重新計算機率再跑一次（可能因此又篩掉更多候選棋盤）
function autoFillObstacles() {
    const matches = getMatchingBoards();
    if (!matches.length) return false;
    let filled = false;
    for (let i = 0; i < TOTAL_CELLS; i++) {
        if (board[i] !== null) continue;
        const r = Math.floor(i / BOARD_SIZE), c = i % BOARD_SIZE;
        if (matches.every(candidateBoard => candidateBoard[r][c] === 1)) {
            board[i] = 'obstacle';
            filled = true;
        }
    }
    return filled;
}

// 障礙物滿 5 個時，切換到「標記道具」階段並重新計算道具機率
function checkPhaseTransition() {
    if (obstaclesConfirmed) return;
    if (countType('obstacle') === 5) {
        obstaclesConfirmed = true;
        updateTreasureProbabilities();
    }
}

function updateClicksLeft() {
    clicksLeftEl.textContent = MAX_CLICKS - clickCount;
}

// 格子點擊處理，依目前階段分成兩種行為：
// 1. 障礙物階段：點擊代表「翻到障礙物」，會嘗試自動推算其餘障礙物位置
// 2. 道具階段：點擊代表「打開 picker 選擇這格實際發現的內容」；
//    若只有唯一一種可能，直接套用，不用再跳出 picker 讓使用者多點一次
function onCellClick(i) {
    if (obstaclesConfirmed) {
        if (board[i] === 'obstacle') return;
        const options = getPickerOptions(i);
        if (board[i] === null) {
            if (options.length === 1) {
                selectedIndex = i;
                pickType(options[0]);
                return;
            }
        } else if (options.length === 1 && options[0] === board[i]) {
            selectedIndex = i;
            pickType('clear');
            return;
        }
        selectedIndex = (selectedIndex === i) ? null : i;
        render();
        return;
    }

    if (board[i] === null) {
        if (obstacleProb[i] <= 0) return;
        board[i] = 'obstacle';
    }
    else if (board[i] === 'obstacle') board[i] = null;
    else return;

    updateObstacleProbabilities();
    // 標記障礙物後可能觸發新一輪的自動推算，反覆跑到沒有新格子被填滿為止
    // （guard 是安全上限，避免理論外的例外狀況造成無窮迴圈）
    let changed = true, guard = 0;
    while (changed && guard < 10) {
        changed = autoFillObstacles();
        if (changed) updateObstacleProbabilities();
        guard++;
    }
    checkPhaseTransition();
    updateClicksLeft();
    render();
}

// 在 picker 選擇實際發現的內容，寫回 board 並視情況消耗一次翻牌次數
function pickType(type) {
    if (selectedIndex === null) return;
    const i = selectedIndex;
    const wasSet = board[i] !== null;

    if (type === 'clear') {
        if (wasSet) clickCount = Math.max(0, clickCount - 1);
        board[i] = null;
    } else {
        if (type !== 'empty') {
            // 劍最多 6 把、寶箱最多 4 個、狐狸最多 1 隻，超過上限就不允許再標記
            const max = type === 'sword' ? 6 : type === 'chest' ? 4 : 1;
            const count = countType(type) - (board[i] === type ? 1 : 0);
            if (count >= max) return;
        }
        if (!wasSet && clickCount >= MAX_CLICKS) return;
        if (!wasSet) clickCount++;
        board[i] = type;
    }

    selectedIndex = null;
    updateTreasureProbabilities();
    updateClicksLeft();
    render();
}

// 暫時把這一格清空，看看候選棋盤裡這格「實際可能出現」哪些類型，算完再還原
function getPossibleTypesForCell(i) {
    const saved = board[i];
    board[i] = null;
    const flattenedBoards = getMatchingBoards().map(candidateBoard => candidateBoard.flat());
    board[i] = saved;
    return {
        sword: flattenedBoards.some(f => f[i] === 2),
        chest: flattenedBoards.some(f => f[i] === 3),
        fox: flattenedBoards.some(f => f[i] === 4),
        empty: flattenedBoards.some(f => f[i] === 0 || f[i] === 4)
    };
}

// 綜合「這格數學上可能是什麼」與「數量上限 / 翻牌次數上限」，
// 算出 picker 實際應該顯示哪些可選項目
function getPickerOptions(i) {
    const current = board[i];
    const budgetUsed = current === null && clickCount >= MAX_CLICKS;
    if (budgetUsed) return [];

    const possible = getPossibleTypesForCell(i);
    const swordCount = countType('sword') - (current === 'sword' ? 1 : 0);
    const chestCount = countType('chest') - (current === 'chest' ? 1 : 0);
    const foxCount = countType('fox') - (current === 'fox' ? 1 : 0);

    const options = [];
    if (possible.sword && swordCount < 6) options.push('sword');
    if (possible.chest && chestCount < 4) options.push('chest');
    if (possible.fox && foxCount < 1) options.push('fox');
    if (possible.empty) options.push('empty');
    return options;
}

const PICKER_LABELS = { sword: '⚔️ 劍', chest: '📦 寶箱', fox: '🦊 狐狸', empty: '✓ 空格' };

// 渲染格子的選項彈窗（picker）。按鈕用 data-type / data-action 標記，
// 實際點擊由 init() 裡在 pickerEl 上的事件代理統一處理
function renderPicker() {
    if (selectedIndex === null || !obstaclesConfirmed) {
        pickerOverlayEl.classList.remove('open');
        pickerEl.innerHTML = '';
        return;
    }
    const i = selectedIndex;
    const row = Math.floor(i / BOARD_SIZE) + 1, col = i % BOARD_SIZE + 1;
    const current = board[i];
    const budgetUsed = current === null && clickCount >= MAX_CLICKS;
    const options = getPickerOptions(i);

    let buttons = options.map(t => `<button class="pick-btn ${t}" data-type="${t}">${PICKER_LABELS[t]}</button>`).join('');
    if (current !== null) buttons += `<button class="pick-btn clear" data-type="clear">清除已選</button>`;
    if (!buttons) buttons = `<div class="picker-empty">${budgetUsed ? '已達最大翻牌次數（11 次），無法再標記新內容。' : '這個格子沒有可選的內容。'}</div>`;

    pickerEl.innerHTML = `
        <div class="picker">
            <div class="picker-header">
                <div class="picker-title">第 ${row} 列第 ${col} 行 － 選擇實際發現的內容</div>
                <button class="picker-close" data-action="close">✕</button>
            </div>
            <div class="picker-buttons">${buttons}</div>
        </div>`;
    pickerOverlayEl.classList.add('open');
}

function closePicker() {
    selectedIndex = null;
    render();
}

// 整個棋盤的主要渲染函式：依每格狀態畫出對應圖示或機率文字，
// 並依階段切換提示文字與翻牌次數顯示，最後連帶更新 picker
function render() {
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = cellEls[i];
        cell.className = 'cell';
        cell.innerHTML = '';
        const v = board[i];

        if (v === 'obstacle') {
            cell.classList.add('obstacle');
            cell.textContent = '✕';
        } else if (v === 'sword') {
            cell.classList.add('sword');
            cell.textContent = '⚔️';
        } else if (v === 'chest') {
            cell.classList.add('chest');
            cell.textContent = '📦';
        } else if (v === 'fox') {
            cell.classList.add('fox');
            cell.textContent = '🦊';
        } else if (v === 'empty') {
            cell.classList.add('empty');
            cell.textContent = '✓';
        } else if (!obstaclesConfirmed) {
            // 障礙物階段：還沒標記的格子顯示是障礙物的機率，機率為 0 代表已被排除
            if (obstacleProb[i] > 0) {
                cell.classList.add('prob');
                cell.textContent = obstacleProb[i] + '%';
            } else {
                cell.classList.add('blocked');
            }
        } else {
            // 道具階段：還沒標記的格子顯示劍/寶箱/狐狸的機率（沒有機率就留空，代表只可能是空格）
            const s = treasureProb.sword[i], c = treasureProb.chest[i], f = treasureProb.fox[i];
            if (s > 0 || c > 0 || f > 0) {
                cell.classList.add('tprob');
                let segs = '';
                if (s > 0) segs += `<div class="seg seg-sword">劍${s}%</div>`;
                if (c > 0) segs += `<div class="seg seg-chest">箱${c}%</div>`;
                if (f > 0) segs += `<div class="seg seg-fox">狐${f}%</div>`;
                cell.innerHTML = segs;
            }
        }

        if (selectedIndex === i) cell.classList.add('active');
    }

    phaseLabelEl.textContent = obstaclesConfirmed ? '階段：標記道具' : '階段：標記障礙物';
    hintEl.textContent = obstaclesConfirmed ? PHASE2_HINT : PHASE1_HINT;
    scoreBarEl.style.display = obstaclesConfirmed ? 'flex' : 'none';

    renderPicker();
}

// 重設整個棋盤與計算狀態，回到初始的障礙物標記階段
function resetGame() {
    board = Array(TOTAL_CELLS).fill(null);
    obstaclesConfirmed = false;
    clickCount = 0;
    selectedIndex = null;
    updateObstacleProbabilities();
    updateClicksLeft();
    render();
}

function init() {
    // 產生 36 個棋盤格子的 DOM 節點並綁定點擊事件
    for (let i = 0; i < TOTAL_CELLS; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.addEventListener('click', () => onCellClick(i));
        gridEl.appendChild(cell);
        cellEls.push(cell);
    }

    // 點擊 picker 半透明背景（非內容區域）即關閉
    pickerOverlayEl.addEventListener('click', (e) => {
        if (e.target === pickerOverlayEl) closePicker();
    });

    // picker 內容區域用事件代理統一處理「選項按鈕」與「關閉鈕」，
    // 因為 picker 的按鈕是動態產生的 innerHTML，不能個別綁定監聽器
    pickerEl.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('[data-action="close"]');
        if (closeBtn) { closePicker(); return; }
        const pickBtn = e.target.closest('[data-type]');
        if (pickBtn) pickType(pickBtn.dataset.type);
    });

    resetBtnEl.addEventListener('click', resetGame);

    updateObstacleProbabilities();
    updateClicksLeft();
    render();
}

init();
})();
