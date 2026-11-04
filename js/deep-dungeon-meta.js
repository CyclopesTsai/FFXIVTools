// 此檔由 scripts/build-deep-dungeon-meta.js 自動產生，請勿手動編輯。
// 選單頁 (deep-dungeon.html) 只需要名稱／樓層範圍／簡介等極少欄位，
// 改用這份輕量檔可避免載入三份完整攻略資料（含全部樓層機制文字）。
// 若更新了 js/deep-dungeon-data-*.js 的內容，請重新執行:
//   node scripts/build-deep-dungeon-meta.js
window.DEEP_DUNGEON_META = {
    "potd": {
        "key": "potd",
        "nameZh": "死者宮殿",
        "nameEn": "Palace of the Dead",
        "floorRange": "1-200",
        "pageUrl": "palace-of-the-dead.html",
        "overview": "死者宮殿是系列第一座深層迷宮，角色不論原本等級都會重置成 1 級，透過擊殺樓層怪物獲得經驗值成長到 60 級。玩家靠專用的「聚魔裝備」提升基礎戰力，並以「魔陶器」取得各種輔助效果，每 10 層會遭遇一次固定 Boss。攻略到 50 層後可開啟支線任務，讓之後的存檔能直接從 51 層開始挑戰。",
        "needsTranslation": true,
        "needsVerification": true
    },
    "hoh": {
        "key": "hoh",
        "nameZh": "天之御柱",
        "nameEn": "Heaven-on-High",
        "floorRange": "1-100",
        "pageUrl": "heaven-on-high.html",
        "overview": "天之御柱是接續死者宮殿的第二座深層迷宮，玩家同樣從等級1開始，依靠聚魔裝備與魔陶器成長，目標是爬到第100層。相較死者宮殿，天之御柱加入了「魔石」系統，銀寶箱有機率開出可召喚召喚獸瞬殺本層小怪、甚至重創Boss的強力道具，也新增了稱為「謬誤殿堂」的大型開放式樓層。",
        "needsTranslation": true,
        "needsVerification": true
    },
    "eo": {
        "key": "eo",
        "nameZh": "正統優雷卡",
        "nameEn": "Eureka Orthos",
        "floorRange": "1-100",
        "pageUrl": "eureka-orthos.html",
        "overview": "正統優雷卡是繼死者宮殿、天之御柱之後推出的第三座深層迷宮，角色會以 81 級的狀態重新起算成長，依靠「聚魔裝備」與各類輔助道具（本迷宮稱為魔科學器）逐層推進。全程共 100 層，每 10 層會遭遇一次樓層守關王，99 層為最終 Boss，100 層只是一段衝刺跑圖。",
        "needsTranslation": false,
        "needsVerification": true
    }
};
