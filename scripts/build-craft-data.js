// 從遊戲解包資料產生生產巨集計算用的配方係數對照表 (js/craft-data.js)
// 資料來源：xivapi/ffxiv-datamining 的 csv/en/Recipe.csv、RecipeLevelTable.csv、GathererCrafterLvAdjustTable.csv
// 遊戲改版後重新執行：
//   node scripts/build-craft-data.js                # 從 GitHub 下載最新 CSV
//   node scripts/build-craft-data.js --dir <資料夾>  # 改用本機的 CSV
// 若有「同樣的難度／品質／耐久卻對應到不同係數」的衝突，會列出並以非 0 結束，不會寫檔。
'use strict';

const fs = require('fs');
const path = require('path');

const REPO = 'xivapi/ffxiv-datamining';
const BRANCH = 'master';
const FILES = ['Recipe', 'RecipeLevelTable', 'GathererCrafterLvAdjustTable'];
const OUTPUT_FILE = path.join(__dirname, '..', 'js', 'craft-data.js');
// 等級同步配方（宇宙探索）的耐久固定為 80，同 raphael-rs 的處理
const SCALING_DURABILITY = 80;

const FLAG_EXPERT = 1;
const FLAG_SCALING = 2;

function parseCsv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
            } else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
        else field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
}

// 回傳以 # 欄位為 key 的物件陣列（跳過非數字 id 的說明列）
function toRecords(text) {
    const rows = parseCsv(text);
    const header = rows.find(r => r[0] === '#');
    if (!header) throw new Error('找不到 CSV 標頭列');
    return rows
        .filter(r => /^\d+$/.test(r[0]))
        .map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function loadCsv(name, dir) {
    if (dir) return fs.readFileSync(path.join(dir, `${name}.csv`), 'utf8');
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/csv/en/${name}.csv`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`下載失敗 ${url}: ${res.status}`);
    return res.text();
}

async function sourceCommit() {
    try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/commits/${BRANCH}`, {
            headers: { 'User-Agent': 'ffxivtools-build-script' },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.sha ? json.sha.slice(0, 10) : null;
    } catch {
        return null;
    }
}

const int = v => Number.parseInt(v, 10) || 0;

async function main() {
    const dirArg = process.argv.indexOf('--dir');
    const dir = dirArg >= 0 ? process.argv[dirArg + 1] : null;

    const [recipeCsv, rlvCsv, adjustCsv] = await Promise.all(FILES.map(f => loadCsv(f, dir)));
    const recipes = toRecords(recipeCsv);
    const rlvTable = new Map(toRecords(rlvCsv).map(r => [int(r['#']), r]));
    const adjust = new Map(toRecords(adjustCsv).map(r => [int(r['#']), int(r.RecipeLevel)]));

    const coefs = [];
    const coefIndex = new Map();
    function coefOf(rlv) {
        const c = [int(rlv.ProgressDivider), int(rlv.QualityDivider), int(rlv.ProgressModifier), int(rlv.QualityModifier)];
        const key = c.join(',');
        if (!coefIndex.has(key)) { coefIndex.set(key, coefs.length); coefs.push(c); }
        return coefIndex.get(key);
    }

    // key = 難度|品質|耐久 → 候選列表
    const groups = new Map();
    let recipeCount = 0, scalingCount = 0;

    function add(recipe, rlvId, durabilityBase, onlyPlayerLevel, flags) {
        const rlv = rlvTable.get(rlvId);
        if (!rlv) return;
        const difficulty = Math.floor(int(rlv.Difficulty) * int(recipe.DifficultyFactor) / 100);
        const quality = Math.floor(int(rlv.Quality) * int(recipe.QualityFactor) / 100);
        const durability = Math.floor(durabilityBase * int(recipe.DurabilityFactor) / 100);
        if (difficulty <= 0 || durability <= 0) return;
        const entry = {
            difficulty, quality, durability,
            coef: coefOf(rlv),
            rlv: rlvId,
            rlvJobLevel: int(rlv.ClassJobLevel),
            stars: int(rlv.Stars),
            flags,
            onlyPlayerLevel,
            recipeId: int(recipe['#']),
        };
        const key = `${difficulty}|${quality}|${durability}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(entry);
    }

    for (const r of recipes) {
        const rlvId = int(r.RecipeLevelTable);
        if (rlvId <= 0 || int(r.ItemResult) <= 0) continue;
        const expert = r.IsExpert === 'True' ? FLAG_EXPERT : 0;
        const maxScaling = int(r.MaxAdjustableJobLevel);
        recipeCount++;
        if (maxScaling > 0) {
            scalingCount++;
            for (let level = 1; level <= maxScaling; level++) {
                const scaledRlv = adjust.get(level);
                if (scaledRlv) add(r, scaledRlv, SCALING_DURABILITY, level, expert | FLAG_SCALING);
            }
        } else {
            const rlv = rlvTable.get(rlvId);
            if (rlv) add(r, rlvId, int(rlv.Durability), 0, expert);
        }
    }

    // 影響計算結果的部分：係數、配方等級（決定 modifier 與工匠的神速技巧）、專家旗標
    const signature = e => `${e.coef}|${e.rlvJobLevel}|${e.flags & FLAG_EXPERT}`;
    const conflicts = [];
    const out = [];
    for (const [key, list] of groups) {
        // 依「限定玩家等級」分桶：0 = 任何等級都成立
        const anyLevel = list.filter(e => e.onlyPlayerLevel === 0);
        const byLevel = new Map();
        for (const e of list.filter(e => e.onlyPlayerLevel > 0)) {
            if (!byLevel.has(e.onlyPlayerLevel)) byLevel.set(e.onlyPlayerLevel, []);
            byLevel.get(e.onlyPlayerLevel).push(e);
        }
        const check = (bucket, label) => {
            const sigs = new Set(bucket.map(signature));
            if (sigs.size > 1) conflicts.push({ key, label, recipes: bucket.map(e => `${e.recipeId}(rlv${e.rlv})`) });
        };
        check(anyLevel, '任何等級');
        for (const [level, bucket] of byLevel) check([...anyLevel, ...bucket], `玩家等級 ${level}`);

        if (anyLevel.length) out.push(anyLevel[0]);
        // 等級同步的候選：與「任何等級」相同的就不重複輸出；相同等級只留一筆
        for (const bucket of byLevel.values()) {
            const e = bucket[0];
            if (!anyLevel.length || signature(anyLevel[0]) !== signature(e)) out.push(e);
        }
    }

    if (conflicts.length) {
        console.error(`發現 ${conflicts.length} 組衝突（相同數值對應到不同係數），未寫檔：`);
        for (const c of conflicts.slice(0, 30)) console.error(`  ${c.key} @${c.label}: ${c.recipes.slice(0, 6).join(', ')}`);
        process.exit(1);
    }

    // 一般配方直接列數值；等級同步配方只存倍率，執行時依玩家等級換算（避免每個等級各存一份）
    const fixed = out.filter(e => e.onlyPlayerLevel === 0);
    fixed.sort((a, b) => a.difficulty - b.difficulty || a.quality - b.quality || a.durability - b.durability);

    const scalingFactors = new Map();
    let maxScalingLevel = 0;
    for (const r of recipes) {
        const maxScaling = int(r.MaxAdjustableJobLevel);
        if (maxScaling <= 0 || int(r.RecipeLevelTable) <= 0 || int(r.ItemResult) <= 0) continue;
        maxScalingLevel = Math.max(maxScalingLevel, maxScaling);
        const f = [int(r.DifficultyFactor), int(r.QualityFactor), int(r.DurabilityFactor), r.IsExpert === 'True' ? FLAG_EXPERT : 0, maxScaling];
        scalingFactors.set(f.join(','), f);
    }
    const levels = [];
    const rlvRows = {};
    for (let level = 0; level <= maxScalingLevel; level++) {
        const id = adjust.get(level) || 0;
        levels.push(id);
        const rlv = rlvTable.get(id);
        if (id && rlv && !rlvRows[id]) {
            rlvRows[id] = [int(rlv.Difficulty), int(rlv.Quality), coefOf(rlv), int(rlv.ClassJobLevel), int(rlv.Stars)];
        }
    }

    const commit = await sourceCommit();
    const data = {
        source: `${REPO}${commit ? '@' + commit : ''}`,
        generatedAt: new Date().toISOString().slice(0, 10),
        coefs,
        recipes: fixed.map(e => [e.difficulty, e.quality, e.durability, e.coef, e.rlv, e.rlvJobLevel, e.stars, e.flags]),
        scaling: {
            durability: SCALING_DURABILITY,
            levels,
            rlvs: rlvRows,
            factors: [...scalingFactors.values()],
        },
    };

    const header = [
        '// 產生檔，請勿手改。重新產生：node scripts/build-craft-data.js',
        `// 資料來源：${data.source}（${data.generatedAt}）；遊戲資料 © SQUARE ENIX`,
        '// coefs: [ProgressDivider, QualityDivider, ProgressModifier, QualityModifier]',
        '// recipes: [難度, 最高品質, 耐久, coefIndex, rlv, rlv 職業等級, 星數, flags(1=專家)]',
        '// scaling（等級同步配方）: levels[玩家等級] = rlv；rlvs[rlv] = [難度基準, 品質基準, coefIndex, rlv 職業等級, 星數]',
        '//   factors: [難度倍率%, 品質倍率%, 耐久倍率%, flags, 最高同步等級]；耐久基準固定 durability',
    ].join('\n');
    const body = `window.CRAFT_DATA = ${JSON.stringify(data)};\n`;
    fs.writeFileSync(OUTPUT_FILE, `${header}\n${body}`);

    console.log(`配方 ${recipeCount} 筆（等級同步 ${scalingCount} 筆）→ 一般對照 ${fixed.length} 筆、等級同步倍率 ${scalingFactors.size} 組、係數 ${coefs.length} 組，無衝突`);
    console.log(`已寫入 ${path.relative(process.cwd(), OUTPUT_FILE)}（${(Buffer.byteLength(body) / 1024).toFixed(1)} KB）`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
