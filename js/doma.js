(function () {
    const inputIds = ['c10000', 'c2500', 'c500', 'c100', 'c25', 'budget', 'ratio'];
    const inputEls = {};
    let resultsEl;
    let calcBtnEl;

    const MAX_ITERATIONS = 500000; // 防止極端情況卡死瀏覽器

    // 解析非負整數；只有在輸入真的無法解析成數字時才用 fallback，
    // 避免把使用者刻意輸入的合法 0 誤判成「沒填」
    function parseNonNegativeInt(value, fallback) {
        const n = parseInt(value, 10);
        if (Number.isNaN(n)) return fallback;
        return Math.max(0, n);
    }

    // 同上，但用於價格比率這類允許小數的欄位
    function parseNonNegativeFloat(value, fallback) {
        const n = parseFloat(value);
        if (Number.isNaN(n)) return fallback;
        return Math.max(0, n);
    }

    // 把目前所有輸入值存進 localStorage，供下次開啟頁面時還原
    function saveToStorage() {
        const data = {};
        inputIds.forEach(id => {
            data[id] = inputEls[id].value;
        });
        localStorage.setItem('doma_calculator_data', JSON.stringify(data));
    }

    // 從 localStorage 還原輸入值，並自動計算一次
    function loadFromStorage() {
        const dataStr = localStorage.getItem('doma_calculator_data');
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                inputIds.forEach(id => {
                    if (data[id] !== undefined) {
                        inputEls[id].value = data[id];
                    }
                });
                // 載入後自動計算一次
                calculate();
            } catch (e) {
                console.error('Failed to parse storage data', e);
            }
        }
    }

    function calculate() {
        // 讀取 5 種硬幣的持有數量
        const counts = [
            parseNonNegativeInt(inputEls.c10000.value, 0),
            parseNonNegativeInt(inputEls.c2500.value, 0),
            parseNonNegativeInt(inputEls.c500.value, 0),
            parseNonNegativeInt(inputEls.c100.value, 0),
            parseNonNegativeInt(inputEls.c25.value, 0)
        ];

        const budget = parseNonNegativeInt(inputEls.budget.value, 25000);
        const ratio = parseNonNegativeFloat(inputEls.ratio.value, 200);

        const baseValues = [10000, 2500, 500, 100, 25];
        const multiplier = ratio / 100;
        const effValues = baseValues.map(v => v * multiplier); // 計算收購加成後的實際價值

        resultsEl.innerHTML = '<p style="text-align:center;">計算中...</p>';

        // 檢查手上硬幣的總價值是否連預算都填不滿，不夠的話直接提示全數繳交即可
        let totalPossibleSum = counts.reduce((sum, count, i) => sum + count * effValues[i], 0);
        if (totalPossibleSum < budget) {
            resultsEl.innerHTML = `
                <div class="solution-card" style="border-left-color: #e74c3c;">
                    <p class="warning">你的硬幣總價值 (${totalPossibleSum}) 不足以填滿預算 (${budget})。</p>
                    <p>建議：全數繳交即可。</p>
                </div>`;
            return;
        }

        let validCombos = [];
        let iterations = 0;
        let truncated = false;

        // 深度優先搜尋 (DFS)：由高面額到低面額依序決定每種硬幣要繳交幾枚，
        // 找出所有「剛好達到或超過預算」的組合
        function dfs(coinIndex, currentSum, currentCombo) {
            if (iterations > MAX_ITERATIONS) {
                truncated = true;
                return;
            }

            // 已達到或超過預算：記錄這個組合，不再往更低面額加硬幣（加了只會更浪費）
            if (currentSum >= budget) {
                validCombos.push({
                    combo: [...currentCombo],
                    waste: currentSum - budget,
                    sum: currentSum
                });
                return;
            }

            // 5 種硬幣都試過卻還沒達到預算，回溯放棄這條路徑
            if (coinIndex >= 5) return;

            let val = effValues[coinIndex];
            let maxAvailable = counts[coinIndex];

            // 剪枝：這個面額最多只需要試到「單靠它就能達到預算」的數量（needed），
            // 超過這個數量必然只是徒增浪費，不用再往下嘗試
            let needed = Math.ceil((budget - currentSum) / val);
            let maxToTry = Math.min(maxAvailable, needed);

            // 從最大可能數量開始往下嘗試，每個數量都遞迴到下一個（更低）面額
            for (let qty = maxToTry; qty >= 0; qty--) {
                currentCombo[coinIndex] = qty;
                iterations++;
                dfs(coinIndex + 1, currentSum + qty * val, currentCombo);
            }
            currentCombo[coinIndex] = 0; // 回溯，把這一格恢復成 0 供上層下一輪嘗試使用
        }

        // 執行計算
        dfs(0, 0, [0, 0, 0, 0, 0]);

        // 搜尋被迭代上限中止時，提醒使用者結果可能不是真正的最優解
        const truncationNotice = truncated
            ? '<p class="warning" style="text-align:center;">⚠️ 組合數過多，已提前中止搜尋，結果可能非最優解。</p>'
            : '';

        if (validCombos.length === 0) {
            resultsEl.innerHTML = truncationNotice + '<p class="warning">找不到合適的組合。</p>';
            return;
        }

        // 排序：1. 浪費金額越少越好 -> 2. 使用的硬幣總數越少越好（省格子省點擊）
        validCombos.sort((a, b) => {
            if (a.waste !== b.waste) return a.waste - b.waste;
            let itemsA = a.combo.reduce((acc, qty) => acc + qty, 0);
            let itemsB = b.combo.reduce((acc, qty) => acc + qty, 0);
            return itemsA - itemsB;
        });

        // 過濾掉重複的組合（以硬幣數量字串當 Key），只取排序後的前 3 名
        let uniqueCombos = [];
        let seen = new Set();
        for (let result of validCombos) {
            let key = result.combo.join(',');
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCombos.push(result);
                if (uniqueCombos.length >= 3) break; // 只取 Top 3
            }
        }

        // 渲染 Top 3 方案卡片
        const labels = ['白金幣 (10,000)', '金幣 (2,500)', '銀幣 (500)', '銅幣 (100)', '錫幣 (25)'];
        const cardsHtml = uniqueCombos.map((result, index) => {
            let html = `
            <div class="solution-card">
                <h3>Top ${index + 1} 方案 (溢出浪費: ${result.waste} 價值)</h3>
                <p style="margin-top: 0; color: #555;">總提交價值: <b>${result.sum}</b> / ${budget}</p>
                <ul>`;

            result.combo.forEach((qty, i) => {
                if (qty > 0) {
                    html += `<li>繳交 <b>${qty}</b> 個 ${labels[i]}</li>`;
                }
            });

            html += `</ul></div>`;
            return html;
        }).join('');

        resultsEl.innerHTML = truncationNotice + cardsHtml;
    }

    // 初始化：快取 DOM 節點、綁定 input 事件即時儲存、綁定計算按鈕、還原上次的輸入
    window.addEventListener('DOMContentLoaded', () => {
        inputIds.forEach(id => {
            inputEls[id] = document.getElementById(id);
            inputEls[id].addEventListener('input', saveToStorage);
        });
        resultsEl = document.getElementById('results');
        calcBtnEl = document.getElementById('calc-btn');
        calcBtnEl.addEventListener('click', calculate);

        loadFromStorage();
    });
})();
