(function () {
    // 四個禁地地帶的天氣表：threshold 是該天氣在 0~99 演算值中的累計上界（由小到大比對，
    // 第一個 val 小於 threshold 的項目就是命中的天氣），special 標記稀有天氣
    const DATA = {
        anemos: [
            { threshold: 30, name: "晴朗", icon: "☀️" },
            { threshold: 60, name: "強風", icon: "🌤️" },
            { threshold: 90, name: "暴雨", icon: "🌪️", special: true },
            { threshold: 100, name: "小雪", icon: "🌧️" }
        ],
        pagos: [
            { threshold: 10, name: "晴朗", icon: "🌤️" },
            { threshold: 28, name: "薄霧", icon: "🌫️" },
            { threshold: 46, name: "熱浪", icon: "🌡️", special: true },
            { threshold: 64, name: "小雪", icon: "❄️" },
            { threshold: 82, name: "打雷", icon: "⚡", special: true },
            { threshold: 100, name: "暴雪", icon: "🌨️", special: true }
        ],
        pyros: [
            { threshold: 10, name: "晴朗", icon: "☀️" },
            { threshold: 28, name: "熱浪", icon: "🌡️", special: true },
            { threshold: 46, name: "打雷", icon: "⚡", special: true },
            { threshold: 64, name: "暴雪", icon: "🌨️" },
            { threshold: 82, name: "靈風", icon: "🌬️" },
            { threshold: 100, name: "小雪", icon: "❄️", special: true }
        ],
        hydatos: [
            { threshold: 12, name: "晴朗", icon: "☀️" },
            { threshold: 34, name: "暴雨", icon: "🌧️" },
            { threshold: 56, name: "妖霧", icon: "🌫️", special: true },
            { threshold: 78, name: "雷雨", icon: "⛈️" },
            { threshold: 100, name: "小雪", icon: "❄️" }
        ]
    };

    const FORECAST_ROW_COUNT = 20;
    const EOREZEA_HOURS_PER_WEATHER_BLOCK = 8;
    const SECONDS_PER_BELL = 175; // 1 Eorzea 小時 = 175 現實秒
    const WEATHER_BLOCK_MS = EOREZEA_HOURS_PER_WEATHER_BLOCK * SECONDS_PER_BELL * 1000;

    let zoneSelect;
    let container;
    let lastBlockStartMS = null; // 上一次完整渲染時對齊到的天氣區塊起點，用來判斷這次是否還在同一區塊內

    // FF14 標準天氣數值演算公式 (嚴格同步標準算法)
    function calculateFFXIVWeatherValue(timestampMillis) {
        const unixSeconds = Math.floor(timestampMillis / 1000);
        // 關鍵：FF14 的天氣算法是基於該天氣區段「結束」時的小時數 (Bell)
        // 00:00 的天氣由 08:00 的 bell 決定 (inc 8)
        // 08:00 的天氣由 16:00 的 bell 決定 (inc 16)
        // 16:00 的天氣由 00:00 的 bell 決定 (inc 0)
        const bell = Math.floor(unixSeconds / SECONDS_PER_BELL);
        const increment = (bell + 8 - (bell % 8)) % 24;

        // 總天數計算
        const totalDays = Math.floor(unixSeconds / 4200) >>> 0;
        const calcBase = (totalDays * 100) + increment;

        // 遊戲內建的偽隨機位元運算，刻意保留 32 位元整數溢位行為以對齊原始演算法
        const step1 = ((calcBase << 11) ^ calcBase) >>> 0;
        const step2 = ((step1 >>> 8) ^ step1) >>> 0;

        return step2 % 100;
    }

    // 將時間戳轉換為艾歐澤亞時間字串 (ET)
    function getEorzeaTimeStr(timestampMillis) {
        const unixSeconds = Math.floor(timestampMillis / 1000);
        const bell = Math.floor(unixSeconds / SECONDS_PER_BELL);
        const etHour = bell % 24;
        return `ET ${etHour.toString().padStart(2, '0')}:00`;
    }

    // 渲染天氣預報列表。force=false 時，若仍在同一天氣區塊內，只更新倒數秒數與「幾分後」文字，
    // 避免每秒都整個重新產生 20 列 DOM
    function renderForecast(force = false) {
        const zone = zoneSelect.value;

        const nowMS = Date.now();

        // 精確對齊到當前天氣塊的起點
        const currentBlockStartMS = Math.floor(nowMS / WEATHER_BLOCK_MS) * WEATHER_BLOCK_MS;

        const remainingSeconds = Math.floor((currentBlockStartMS + WEATHER_BLOCK_MS - nowMS) / 1000);
        const mm = Math.floor(remainingSeconds / 60);
        const ss = remainingSeconds % 60;
        const countdownStr = `${mm}:${ss.toString().padStart(2, '0')}`;

        // 快速路徑：還在同一個天氣區塊內，不用重繪整個列表
        if (!force && lastBlockStartMS === currentBlockStartMS && container.children.length > 0) {
            const countdownEl = container.querySelector('.weather-row.active .countdown');
            if (countdownEl) countdownEl.innerText = `剩餘 ${countdownStr}`;

            // 同步更新所有後續時段的「幾分後」字樣
            container.querySelectorAll('.relative-time').forEach(el => {
                const target = parseInt(el.getAttribute('data-target'));
                const diffSec = Math.floor((target - nowMS) / 1000);
                const diffH = Math.floor(diffSec / 3600);
                const diffM = Math.floor((diffSec % 3600) / 60);
                el.innerText = `(${diffH > 0 ? diffH + '時' : ''}${diffM}分後)`;
            });
            return;
        }

        // 完整重繪：換天氣區塊或切換地帶時，重新產生所有列
        container.innerHTML = '';
        lastBlockStartMS = currentBlockStartMS;

        for (let i = 0; i < FORECAST_ROW_COUNT; i++) {
            const targetTimeMS = currentBlockStartMS + (i * WEATHER_BLOCK_MS);
            // 使用該區段的起始時間進行計算
            const val = calculateFFXIVWeatherValue(targetTimeMS);
            const zoneData = DATA[zone];

            // 依 threshold 由小到大找出對應天氣
            let weather = { name: "未知", icon: "?" };
            for (let w of zoneData) {
                if (val < w.threshold) { weather = w; break; }
            }

            const startTime = new Date(targetTimeMS);
            const row = document.createElement('div');
            row.className = 'weather-row' + (i === 0 ? ' active' : '');

            const diffSec = Math.floor((targetTimeMS - nowMS) / 1000);
            const diffH = Math.floor(diffSec / 3600);
            const diffM = Math.floor((diffSec % 3600) / 60);

            let relativeHtml = "";
            if (i > 0) {
                relativeHtml = ` <small class="relative-time" data-target="${targetTimeMS}" style="opacity: 0.6; font-weight: normal;">(${diffH > 0 ? diffH + '時' : ''}${diffM}分後)</small>`;
            }

            const timeStr = startTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
            const etStr = getEorzeaTimeStr(targetTimeMS);
            const isSpecial = weather.special ? 'class="special-weather"' : '';

            row.innerHTML = `
                <div class="time-box">
                    <span>${i === 0 ? '現在 (' + timeStr + ')' : timeStr + relativeHtml}</span>
                    <span class="et-time">${etStr}</span>
                </div>
                <div class="weather-name" ${isSpecial}>
                  ${weather.icon} ${weather.name}
                  ${i === 0 ? `<div class="countdown" style="font-size: 0.7em; font-weight: normal; color: #27ae60; margin-top: 2px;">剩餘 ${countdownStr}</div>` : ''}
                </div>
                <div class="weather-val">Val: ${val}</div>
            `;
            container.appendChild(row);
        }
    }

    // 切換地帶：記住這次的選擇，並強制整個重繪
    function changeZone() {
        localStorage.setItem('eureka-zone', zoneSelect.value);
        renderForecast(true);
    }

    function init() {
        zoneSelect = document.getElementById('zoneSelect');
        container = document.getElementById('forecast');
        zoneSelect.addEventListener('change', changeZone);

        // 還原上次選擇的地帶
        const savedZone = localStorage.getItem('eureka-zone');
        if (savedZone && DATA[savedZone]) {
            zoneSelect.value = savedZone;
        }
        renderForecast();

        // 每 1 秒檢查一次以更新倒數計時
        setInterval(renderForecast, 1000);
    }

    init();
})();
