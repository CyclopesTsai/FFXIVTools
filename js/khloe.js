(function () {
    // 快取常用的 DOM 節點，避免每次操作都重新查詢
    const gridEl = document.getElementById('grid');
    const countEl = document.getElementById('sticker-count');
    const suggestionEl = document.getElementById('suggestion-area');
    const resultsEl = document.getElementById('results-area');
    const resetBtnEl = document.getElementById('reset-btn');

    let selectedCells = [];
    let cellEls = [];

    // 4x4 棋盤所有可能連成一線的組合：4 橫排、4 直排、2 對角線
    const winningLines = [
        [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15],
        [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
        [0, 5, 10, 15], [3, 6, 9, 12]
    ];

    // 產生 16 個棋盤格子的 DOM 節點並綁定點擊事件
    function init() {
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.addEventListener('click', () => toggleCell(i));
            gridEl.appendChild(cell);
            cellEls.push(cell);
        }
        resetBtnEl.addEventListener('click', resetGrid);
    }

    // 切換格子的選取狀態；最多只能選 7 格，對應遊戲裡已放置的 7 枚貼紙
    function toggleCell(index) {
        const idx = selectedCells.indexOf(index);
        if (idx > -1) {
            selectedCells.splice(idx, 1);
        } else {
            if (selectedCells.length < 7) {
                selectedCells.push(index);
            }
        }
        updateUI();
    }

    function resetGrid() {
        selectedCells = [];
        updateUI();
    }

    // 依目前選取數量更新畫面：滿 7 格才觸發機率計算，否則顯示還差幾格的提示
    function updateUI() {
        cellEls.forEach((cell, i) => {
            cell.classList.toggle('selected', selectedCells.includes(i));
        });

        countEl.innerText = selectedCells.length;

        if (selectedCells.length === 7) {
            calculateProbabilities();
        } else {
            suggestionEl.innerHTML = '';
            resultsEl.innerHTML = `<div class="placeholder-text">還需要標記 ${7 - selectedCells.length} 個貼紙位置</div>`;
        }
    }

    // 窮舉剩餘空格中所有可能的 2 格組合（對應遊戲剩下的 2 次貼紙放置），
    // 統計每種組合最終會連成幾條線，最後交給 renderResults 畫出結果
    function calculateProbabilities() {
        let remainingIndices = [];
        for (let i = 0; i < 16; i++) {
            if (!selectedCells.includes(i)) remainingIndices.push(i);
        }

        // 從剩餘格子中選 2 格的組合總數，用來當機率分母
        const total = remainingIndices.length * (remainingIndices.length - 1) / 2;
        let comboCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };

        for (let i = 0; i < remainingIndices.length; i++) {
            for (let j = i + 1; j < remainingIndices.length; j++) {
                const finalSet = new Set([...selectedCells, remainingIndices[i], remainingIndices[j]]);
                let lines = 0;

                winningLines.forEach(line => {
                    if (line.every(pos => finalSet.has(pos))) {
                        lines++;
                    }
                });

                // 遊戲獎勵最高只算到 3 線，超過 3 線一律歸類成 3
                comboCounts[Math.min(lines, 3)]++;
            }
        }

        renderResults(comboCounts, total);
    }

    // 依機率分布決定要顯示哪一種建議文案（門檻用原始次數比較，避免顯示用的四捨五入字串影響判斷）
    function getAdvice(comboCounts, total) {
        const p2plusRaw = comboCounts[2] + comboCounts[3];
        const p1plusRaw = comboCounts[1] + p2plusRaw;

        if (comboCounts[3] > 0) {
            const p3 = (comboCounts[3] / total * 100).toFixed(1);
            return {
                cls: "perfect",
                text: `🌟 <strong>發現 3 線雛形！</strong> 目前有 ${p3}% 的機率連成 3 線（金票）。這在數學上是非常罕見的強勢陣型，強烈建議直接開獎！`
            };
        }
        if (p2plusRaw / total >= 0.2) {
            const p2plus = (p2plusRaw / total * 100).toFixed(1);
            return {
                cls: "good",
                text: `✅ <strong>陣型非常穩健：</strong> 至少 2 線的機率高達 ${p2plus}%。這已經是很優質的結果，若非執著金票，不建議再消耗點數「重新貼」。`
            };
        }
        if (p1plusRaw / total >= 0.5) {
            const p1plus = (p1plusRaw / total * 100).toFixed(1);
            return {
                cls: "",
                text: `💡 <strong>低標機率尚可：</strong> 至少有 ${p1plus}% 的機會拿到 1 線。若獎勵點數剩餘不多，可以考慮收手。`
            };
        }
        return {
            cls: "bad",
            text: `⚠️ <strong>建議「重新貼」：</strong> 目前陣型不可能達成 3 線，且連 1 線的機率都低於一半。若有點數，建議重洗位置。`
        };
    }

    // 渲染建議卡片，以及 0/1+/2+/3 線的機率長條
    function renderResults(comboCounts, total) {
        const p0 = (comboCounts[0] / total * 100).toFixed(1);
        const p1 = (comboCounts[1] / total * 100).toFixed(1);
        const p2 = (comboCounts[2] / total * 100).toFixed(1);
        const p3 = (comboCounts[3] / total * 100).toFixed(1);

        const p1plusRaw = comboCounts[1] + comboCounts[2] + comboCounts[3];
        const p2plusRaw = comboCounts[2] + comboCounts[3];

        const p1plus = (p1plusRaw / total * 100).toFixed(1);
        const p2plus = (p2plusRaw / total * 100).toFixed(1);

        const advice = getAdvice(comboCounts, total);
        suggestionEl.innerHTML = `<div class="suggestion-card ${advice.cls}">${advice.text}</div>`;

        resultsEl.innerHTML = `
            <div class="result-section">
                <div class="prob-item">
                    <div class="prob-header"><span>0 線 (槓龜)</span><span>${p0}%</span></div>
                    <div class="progress-container"><div class="progress-bar bar-0" style="width: ${p0}%"></div></div>
                </div>
                <div class="prob-item">
                    <div class="prob-header">
                        <span>至少 1 線 (1+)</span>
                        <span>${p1plus}% <span class="prob-details">(${p1}% + ${p2plus}%)</span></span>
                    </div>
                    <div class="progress-container"><div class="progress-bar bar-1" style="width: ${p1plus}%"></div></div>
                </div>
                <div class="prob-item">
                    <div class="prob-header">
                        <span>至少 2 線 (2+)</span>
                        <span>${p2plus}% <span class="prob-details">(${p2}% + ${p3}%)</span></span>
                    </div>
                    <div class="progress-container"><div class="progress-bar bar-2" style="width: ${p2plus}%"></div></div>
                </div>
                <div class="prob-item">
                    <div class="prob-header"><span>恰好 3 線 (金票)</span><span>${p3}%</span></div>
                    <div class="progress-container"><div class="progress-bar bar-3" style="width: ${p3}%"></div></div>
                </div>
            </div>
        `;
    }

    init();
})();
