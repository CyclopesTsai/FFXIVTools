// 從 js/deep-dungeon-data-*.js 產生選單頁用的輕量 meta 檔 (js/deep-dungeon-meta.js)
// 每次調整各迷宮的 floorSets（needsTranslation / verified）後，請重新執行:
//   node scripts/build-deep-dungeon-meta.js
'use strict';

const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '..', 'js');
const SOURCE_FILES = [
    'deep-dungeon-data-potd.js',
    'deep-dungeon-data-hoh.js',
    'deep-dungeon-data-eo.js',
];
const ORDER = ['potd', 'hoh', 'eo'];
const OUTPUT_FILE = path.join(JS_DIR, 'deep-dungeon-meta.js');

function loadDungeonData(fileName) {
    const code = fs.readFileSync(path.join(JS_DIR, fileName), 'utf8');
    const sandboxWindow = {};
    new Function('window', code)(sandboxWindow);
    return sandboxWindow.DEEP_DUNGEON_DATA;
}

const meta = {};
for (const file of SOURCE_FILES) {
    const data = loadDungeonData(file);
    for (const key of Object.keys(data)) {
        const d = data[key];
        const sets = d.floorSets || [];
        meta[key] = {
            key: d.key,
            nameZh: d.nameZh,
            nameEn: d.nameEn,
            floorRange: d.floorRange,
            pageUrl: d.pageUrl,
            overview: d.overview,
            needsTranslation: sets.some(fs => fs.needsTranslation),
            needsVerification: sets.some(fs => !fs.verified),
        };
    }
}

const orderedMeta = {};
for (const key of ORDER) {
    if (meta[key]) orderedMeta[key] = meta[key];
}

const output = `// 此檔由 scripts/build-deep-dungeon-meta.js 自動產生，請勿手動編輯。
// 選單頁 (deep-dungeon.html) 只需要名稱／樓層範圍／簡介等極少欄位，
// 改用這份輕量檔可避免載入三份完整攻略資料（含全部樓層機制文字）。
// 若更新了 js/deep-dungeon-data-*.js 的內容，請重新執行:
//   node scripts/build-deep-dungeon-meta.js
window.DEEP_DUNGEON_META = ${JSON.stringify(orderedMeta, null, 4)};
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`Generated ${path.relative(process.cwd(), OUTPUT_FILE)}`);
