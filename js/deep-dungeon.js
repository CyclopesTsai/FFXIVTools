// 深層迷宮工具：子選單 + 各迷宮詳情頁共用的渲染邏輯
window.DeepDungeon = (function () {

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str == null ? '' : str;
        return div.innerHTML;
    }

    // 攻略文字常常需要分段顯示：資料裡用 \n 換行，這裡轉成 <br>（先跳脫 HTML 再處理，避免被當成標籤）
    function escapeHtmlMultiline(str) {
        return escapeHtml(str).replace(/\n/g, '<br>');
    }

    // 狀態標籤：待翻譯(內容仍有未翻譯部分)、待驗證(樓層尚未實際體驗過)
    function renderStatusTags(needsTranslation, needsVerification) {
        return `${needsTranslation ? '<span class="status-tag">待翻譯</span>' : ''}${needsVerification ? '<span class="status-tag">待驗證</span>' : ''}`;
    }

    // 子選單頁：列出 DEEP_DUNGEON_DATA 裡所有迷宮的卡片
    function renderMenu(containerEl, order) {
        const data = window.DEEP_DUNGEON_DATA || {};
        const keys = order || Object.keys(data);

        containerEl.innerHTML = keys.map(key => {
            const d = data[key];
            if (!d) return '';
            const shortDesc = (d.overview || '').slice(0, 40) + ((d.overview || '').length > 40 ? '...' : '');
            const sets = d.floorSets || [];
            const needsTranslation = sets.some(fs => fs.needsTranslation);
            const needsVerification = sets.some(fs => !fs.verified);
            return `
                <a class="dungeon-card" href="${escapeHtml(d.pageUrl)}">
                    <div class="name-row">
                        <span class="name-zh">${escapeHtml(d.nameZh)} ${renderStatusTags(needsTranslation, needsVerification)}</span>
                        <span class="floor-range">${escapeHtml(d.floorRange)} 層</span>
                    </div>
                    <div class="name-en">${escapeHtml(d.nameEn)}</div>
                    <div class="desc">${escapeHtml(shortDesc)}</div>
                </a>
            `;
        }).join('');
    }

    // 詳情頁：陷阱類型 / 特殊房間 / 特殊系統 等條列區塊
    // 若項目有 subItems（如魔科學器底下的緩速／大漩渦／恐慌裝甲化），會再各自獨立顯示
    function renderInfoItems(containerEl, items) {
        const group = containerEl.closest('.info-group');
        if (!items || items.length === 0) {
            if (group) group.style.display = 'none';
            return;
        }
        containerEl.innerHTML = items.map(item => `
            <div class="info-item">
                <span class="item-name">${escapeHtml(item.name)}</span>${escapeHtml(item.desc)}
                ${item.subItems && item.subItems.length ? `
                <div class="info-sub-items">
                    ${item.subItems.map(sub => `
                        <div class="info-sub-item"><span class="item-name">${escapeHtml(sub.name)}</span>${escapeHtml(sub.desc)}</div>
                    `).join('')}
                </div>` : ''}
            </div>
        `).join('');
    }

    // 怪物/Boss 名稱統一顯示格式：「中文名稱 (英文名稱)」；沒有中文譯名時標註待補
    function formatCreatureName(nameZh, nameEn) {
        const en = nameEn || '未知';
        if (nameZh) {
            return `${escapeHtml(nameZh)}（${escapeHtml(en)}）`;
        }
        return `${escapeHtml(en)} <span class="pending">(中文名稱待補)</span>`;
    }

    // 小怪攻略區塊：每隻小怪各自獨立一張卡片顯示名稱與攻略，而非擠在同一段文字裡
    function renderMobBlock(fs) {
        const mobNames = fs.mobNames || [];
        const hasPerMobTips = mobNames.some(m => m.tips);

        if (hasPerMobTips) {
            return `
                <div class="mob-block">
                    <div class="block-label">小怪攻略</div>
                    <div class="mob-entries">
                        ${mobNames.map(m => `
                            <div class="mob-entry">
                                <div class="mob-entry-name">${formatCreatureName(m.nameZh, m.nameEn)}</div>
                                <div class="mob-entry-tips">${escapeHtmlMultiline(m.tips || '尚無攻略資料')}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (fs.mobTips) {
            return `
                <div class="mob-block">
                    <div class="block-label">小怪攻略</div>
                    ${mobNames.length ? `
                    <div class="mob-name-tags">
                        ${mobNames.map(m => `<span class="mob-name-tag">${formatCreatureName(m.nameZh, m.nameEn)}</span>`).join('')}
                    </div>` : ''}
                    <div>${escapeHtmlMultiline(fs.mobTips)}</div>
                </div>
            `;
        }

        return '';
    }

    // 詳情頁：樓層分段 Accordion，點擊標題展開/收合該分段的 Boss 攻略
    function renderFloorSets(containerEl, floorSets) {
        containerEl.innerHTML = (floorSets || []).map((fs, i) => {
            return `
                <div class="floor-set" data-index="${i}">
                    <div class="floor-set-header">
                        <span class="range-label">${escapeHtml(fs.range)} 層 ${renderStatusTags(fs.needsTranslation, !fs.verified)}</span>
                        <span class="boss-label">Boss: ${escapeHtml(fs.bossNameZh || fs.bossNameEn || '未知')}</span>
                        <span class="chevron">▶</span>
                    </div>
                    <div class="floor-set-body">
                        ${fs.notes ? `<div class="fs-notes">${escapeHtmlMultiline(fs.notes)}</div>` : ''}
                        ${renderMobBlock(fs)}
                        <div class="boss-block">
                            <div class="block-label">Boss 攻略</div>
                            <div class="boss-name">${formatCreatureName(fs.bossNameZh, fs.bossNameEn)}</div>
                            <div>${escapeHtmlMultiline(fs.bossTips || '尚無攻略資料')}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        containerEl.querySelectorAll('.floor-set-header').forEach(header => {
            header.addEventListener('click', () => {
                const current = header.parentElement;
                const wasOpen = current.classList.contains('open');
                containerEl.querySelectorAll('.floor-set.open').forEach(el => el.classList.remove('open'));
                if (!wasOpen) current.classList.add('open');
            });
        });
    }

    // 詳情頁：整頁渲染入口，依 key 從 DEEP_DUNGEON_DATA 取出對應迷宮資料
    function renderDetail(key) {
        const data = (window.DEEP_DUNGEON_DATA || {})[key];
        const titleEl = document.getElementById('dungeon-title');
        if (!data) {
            if (titleEl) titleEl.textContent = '找不到資料';
            return;
        }

        document.title = data.nameZh + ' 攻略 - 深層迷宮';
        titleEl.textContent = data.nameZh;
        document.getElementById('dungeon-subtitle').textContent = `${data.nameEn} · ${data.floorRange} 層`;

        document.getElementById('overview-section').innerHTML = `
            <span class="floor-badge">${escapeHtml(data.floorRange)} 層</span>
            <div>${escapeHtml(data.overview)}</div>
        `;

        renderInfoItems(document.getElementById('unique-systems-list'), data.uniqueSystems);
        renderInfoItems(document.getElementById('traps-list'), data.generalTraps);
        renderInfoItems(document.getElementById('rooms-list'), data.specialRooms);
        renderFloorSets(document.getElementById('floor-sets'), data.floorSets);
    }

    return { renderMenu, renderDetail };
})();
