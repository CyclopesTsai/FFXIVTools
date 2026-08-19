(function () {
    const inputIds = ['c10000', 'c2500', 'c500', 'c100', 'c25', 'budget', 'ratio'];
    const inputEls = {};
    let resultsDiv;
    let calcBtn;

    const MAX_ITERATIONS = 500000; // 防止極端情況卡死瀏覽器

    function parseNonNegativeInt(value, fallback) {
        const n = parseInt(value, 10);
        if (Number.isNaN(n)) return fallback;
        return Math.max(0, n);
    }

    function parseNonNegativeFloat(value, fallback) {
        const n = parseFloat(value);
        if (Number.isNaN(n)) return fallback;
        return Math.max(0, n);
    }

    function saveToStorage() {
        const data = {};
        inputIds.forEach(id => {
            data[id] = inputEls[id].value;
        });
        localStorage.setItem('doma_calculator_data', JSON.stringify(data));
    }

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
        // 取得輸入值
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

        resultsDiv.innerHTML = '<p style="text-align:center;">計算中...</p>';

        // 檢查總資產是否足夠
        let totalPossibleSum = counts.reduce((sum, count, i) => sum + count * effValues[i], 0);
        if (totalPossibleSum < budget) {
            resultsDiv.innerHTML = `
                <div class="solution-card" style="border-left-color: #e74c3c;">
                    <p class="warning">你的硬幣總價值 (${totalPossibleSum}) 不足以填滿預算 (${budget})。</p>
                    <p>建議：全數繳交即可。</p>
                </div>`;
            return;
        }

        let validCombos = [];
        let iterations = 0;
        let truncated = false;

        // 深度優先搜尋 (DFS) 尋找所有剛好超過或等於預算的組合
        function dfs(index, currentSum, currentCombo) {
            if (iterations > MAX_ITERATIONS) {
                truncated = true;
                return;
            }

            // 如果已經達到或超過預算，記錄下來並停止往更深層加硬幣
            if (currentSum >= budget) {
                validCombos.push({
                    combo: [...currentCombo],
                    waste: currentSum - budget,
                    sum: currentSum
                });
                return;
            }

            // 如果硬幣種類用完卻還沒達到預算，回溯
            if (index >= 5) return;

            let val = effValues[index];
            let maxAvailable = counts[index];

            // 貪婪優化：計算「至少」還需要幾個當前硬幣才能達到預算
            let needed = Math.ceil((budget - currentSum) / val);
            let maxToTry = Math.min(maxAvailable, needed);

            // 從最大可能數量開始往下嘗試
            for (let q = maxToTry; q >= 0; q--) {
                currentCombo[index] = q;
                iterations++;
                dfs(index + 1, currentSum + q * val, currentCombo);
            }
            currentCombo[index] = 0; // 回溯恢復
        }

        // 執行計算
        dfs(0, 0, [0, 0, 0, 0, 0]);

        const truncationNotice = truncated
            ? '<p class="warning" style="text-align:center;">⚠️ 組合數過多，已提前中止搜尋，結果可能非最優解。</p>'
            : '';

        if (validCombos.length === 0) {
            resultsDiv.innerHTML = truncationNotice + '<p class="warning">找不到合適的組合。</p>';
            return;
        }

        // 排序演算法：1. 浪費金額越少越好 -> 2. 使用的硬幣總數越少越好（省格子省點擊）
        validCombos.sort((a, b) => {
            if (a.waste !== b.waste) return a.waste - b.waste;
            let itemsA = a.combo.reduce((acc, val) => acc + val, 0);
            let itemsB = b.combo.reduce((acc, val) => acc + val, 0);
            return itemsA - itemsB;
        });

        // 過濾掉重複的結果 (以字串做 Key)
        let uniqueCombos = [];
        let seen = new Set();
        for (let c of validCombos) {
            let key = c.combo.join(',');
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCombos.push(c);
                if (uniqueCombos.length >= 3) break; // 只取 Top 3
            }
        }

        // 渲染結果畫面
        const labels = ['白金幣 (10,000)', '金幣 (2,500)', '銀幣 (500)', '銅幣 (100)', '錫幣 (25)'];
        const cardsHtml = uniqueCombos.map((c, index) => {
            let html = `
            <div class="solution-card">
                <h3>Top ${index + 1} 方案 (溢出浪費: ${c.waste} 價值)</h3>
                <p style="margin-top: 0; color: #555;">總提交價值: <b>${c.sum}</b> / ${budget}</p>
                <ul>`;

            c.combo.forEach((qty, i) => {
                if (qty > 0) {
                    html += `<li>繳交 <b>${qty}</b> 個 ${labels[i]}</li>`;
                }
            });

            html += `</ul></div>`;
            return html;
        }).join('');

        resultsDiv.innerHTML = truncationNotice + cardsHtml;
    }

    window.addEventListener('DOMContentLoaded', () => {
        inputIds.forEach(id => {
            inputEls[id] = document.getElementById(id);
            inputEls[id].addEventListener('input', saveToStorage);
        });
        resultsDiv = document.getElementById('results');
        calcBtn = document.getElementById('calc-btn');
        calcBtn.addEventListener('click', calculate);

        loadFromStorage();
    });
})();
