// 天之御柱 攻略資料
// 內容整理自 https://www.ddcompendium.com/ 的樓層機制資料，以繁體中文重新改寫說明文字。
// 怪物/Boss 專有名稱暫以英文保留，待後續補上正式繁中譯名（bossNameZh）。
window.DEEP_DUNGEON_DATA = window.DEEP_DUNGEON_DATA || {};
window.DEEP_DUNGEON_DATA.hoh = {
    key: 'hoh',
    nameZh: '天之御柱',
    nameEn: 'Heaven-on-High',
    floorRange: '1-100',
    pageUrl: 'heaven-on-high.html',
    overview: '天之御柱是接續死者宮殿的第二座深層迷宮，玩家同樣從等級1開始，依靠聚魔裝備與魔陶器成長，目標是爬到第100層。相較死者宮殿，天之御柱加入了「魔石」系統，銀寶箱有機率開出可召喚召喚獸瞬殺本層小怪、甚至重創Boss的強力道具，也新增了稱為「謬誤殿堂」的大型開放式樓層。',
    uniqueSystems: [
        { name: '魔石', desc: '銀寶箱在天之御柱有機率開出魔石，使用後會召喚召喚獸，給全隊 10 秒無敵狀態；一般樓層可清空當層怪物，Boss 層則對 Boss 造成一定傷害，可當作緊急保命手段。其中「奧丁魔石」最為稀有，在 Boss 層使用可直接斬殺當前 Boss，但必須先進入 Boss 戰鬥才會生效，單純站在門口使用無效。' },
        { name: '謬誤殿堂 (Hall of Fallacies)', desc: '天之御柱特有的樓層型態，整層是一個由12個無牆隔間組成的大型開放空間。怪物與陷阱規則仍與一般房間相同(每間0-1個陷阱、可能出現寶物房等)，但因為沒有牆壁阻隔，很容易同時被多個區域的怪物發現，須特別小心仇恨範圍。' },
        { name: '聖塔燈標 (Beacons)', desc: '天之御柱對應「通行/歸還」機制的稱呼(死者宮殿稱為Cairn、正統優雷卡稱為Pylon)，擊殺一定數量的怪物即可啟動，啟動後才能前進下一層或返回上一層；擊殺全樓層怪物可直接啟動，不受原本所需擊殺數限制。' }
    ],
    generalTraps: [
        { name: '弱化陷阱', desc: '觸發後自身攻擊力與防禦力降低 30%，持續 60 秒。' },
        { name: '妨礙陷阱', desc: '讓範圍內所有單位（包含怪物與召喚物）陷入沉默與戰技封印 30 秒，無法行動。' },
        { name: '爆炸陷阱', desc: '對範圍內所有單位（包含怪物）造成等同目前 HP 80% 的傷害，務必分散站位。' },
        { name: '誘餌陷阱', desc: '觸發後當前房間會額外出現 3 隻本層可能出現的敵人，並直接瞄準踩到陷阱的玩家。' },
        { name: '獺獺陷阱（天之御柱限定）', desc: '觸發後變成獺獺 30 秒，無法使用道具、技能與開寶箱，且最大 HP 降低 60%；連續踩兩次會提前變回原本的樣子，中陷阱時務必留意四周安全。' }
    ],
    specialRooms: [
        { name: '寶物房 Treasure Room', desc: '該樓層中會隨機出現的房間，固定有4個寶箱，但怪物數量明顯較多；若巡邏怪一開始就生成在寶物房內，則會維持不動，不會像平常一樣在樓層間遊走。' },
        { name: '謬誤殿堂 Hall of Fallacies(天之御柱限定)', desc: '偶爾會出現的特殊樓層型態，整層變成一個由12個無牆區塊構成的巨大開放空間，陷阱與怪物配置規則不變，但視野與仇恨範圍會互相干擾，建議小心推進。' }
    ],
    floorSets: [
        {
            range: '1-10',
            bossFloor: 10, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Mojabune',
            notes: '1-6層沒有銅寶箱、也沒有寶箱怪(Mimic)；多數魔陶器與魔石要到7層後才會開始出現；9層不會掉落寶箱增加、減少敵人、改變敵人三種魔陶器。',
            mobTips: '小怪方面要特別留意 Shark(鯊魚)與 Amikiri 的攻擊，命中後可能直接造成即死級的「斬首」效果，遭遇時務必提高警覺、盡量閃避。',
            bossTips: '戰鬥循環固定為：震盪波圓形AoE → 從房間中央發動擊退(無法用擊退免疫抵抗) → 半場扇形AoE並疊加「受到傷害提升」(最高16層、每層40%)。建議站位時預留被擊退的空間，並留意減益不要疊加過高。'
        },
        {
            range: '11-20',
            bossFloor: 20, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Beccho',
            notes: '15層固定為「謬誤殿堂」大型開放樓層。',
            mobTips: '留意「Hands」(手型小怪)的狂暴機制，若拖太久交戰可能會爆發大量傷害，建議盡快解決、避免戰鬥時間過長。',
            bossTips: '主要技能為大範圍扇形混亂攻擊，以及360度凝視混亂(需背對Boss閃避)，混亂發動後場邊會出現蝴蝶分身並同時爆炸造成麻痺。整體策略是盡量站在場地中央，讓所有技能範圍都比較容易判斷與閃避。'
        },
        {
            range: '21-30',
            bossFloor: 30, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Hiruko',
            notes: '這組樓層是玩家最常用來練等的區段；29層不會掉落寶箱增加、減少敵人、改變敵人三種魔陶器。',
            mobTips: null,
            bossTips: '開場先是直線閃電AoE，接著召喚雷雲並以Shiko技能震飛玩家(與標記保持距離可大幅降低傷害)；要躲進雷雲下方破壞雷雲形成安全區，等其他雷雲爆炸完才能離開。後續循環會加入覆蓋半場的大範圍AoE，同樣要等雷雲結束才能走位閃避。'
        },
        {
            range: '31-40',
            bossFloor: 40, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Bhima',
            notes: null,
            mobTips: '留意 Harakiri 與 Onmitsu 怪物的狂暴機制，避免戰鬥拖太久；本區有兩隻同名的 Onmitsu(忍者)，一隻是巡邏怪、一隻不是，交戰前需注意辨別，以免誤判遭遇時機。',
            bossTips: 'Boss交替使用直線/圓形風屬性AoE並附加風傷持續傷害，每隔一段時間會在場地兩側(東西或南北)召喚旋風分身，接著發動全場擊退AoE(擊退可被完全格擋的護盾抵銷)，旋風會在擊退後立刻爆炸，務必避開被擊退後會落地的位置。'
        },
        {
            range: '41-50',
            bossFloor: 50, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Gozu',
            notes: '本組樓層已知有牆壁陷阱，行走時務必留意。',
            mobTips: '留意 Sekiban 與 Mizumimizu 怪物的狂暴機制，拖久了容易累積大量傷害。本區有多組外觀不同、但同名的怪物，例如兩種 Sekizo 石像(一隻是巡邏怪)、兩種 Iseki 魔像(顏色不同)，以及兩種 Saikoro(需看施放的是風系還是風暴系技能來分辨)，交戰前最好先確認對象，避免誤判。',
            bossTips: 'Boss交替使用利爪與怨言的扇形/直線AoE並疊加受到傷害提升，接著使用360度凝視混亂(需背對閃避)。混亂後會召喚持續釋放AoE的球體並壓縮安全範圍，同時Boss會蓄力發動大範圍震盪攻擊(越靠近標記傷害越高)，應盡量遠離Boss與球體，等下一輪利爪技能出現後球體才會消失。'
        },
        {
            range: '51-60',
            bossFloor: 60, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Suikazura',
            notes: '本組樓層已知有牆壁陷阱，行走時務必留意。',
            mobTips: '留意 Kongorei(砲台型)與 Tesso(手型)怪物的狂暴機制、Naga 的怒嚎技能(Baleful Roar)，以及 Rachimonai 即使脫離戰鬥仍會持續發動的範圍技，稍不留神容易被波及。',
            bossTips: '戰鬥中會不斷召喚「受詛咒的手杖」分身，分批輪流施放甜甜圈狀AoE與直線AoE，場地中心通常是安全區；後期會同時出現8支手杖一起發動技能，建議把直線AoE引導到靠牆位置閃避。整場機制偏向密集讀技能、持續走位，沒有特別固定的安全站位。'
        },
        {
            range: '61-70',
            bossFloor: 70, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Kenko',
            notes: null,
            mobTips: '從這組樓層開始，金寶箱裡的寶箱怪(Mimic)無法被眩暈，開箱前請先做好戰鬥準備；Onryo是觸碰式仇恨(非視覺)，很難靠視線提前迴避，常常難以避開，需特別小心。',
            bossTips: '場上會出現會疊加「降低25%輸出、提升400%受到傷害」減益的水坑。流程大致為：全場AoE發動時要站在水坑外；Boss對某玩家使用衝撞暈眩技能時，該玩家要站進水坑內；緊接著的即死技能「吞噬」也要留在水坑內才能免疫（水坑減益會讓這個即死技能必定失手）；下一次全場AoE前要離開水坑。簡言之：全場AoE站外面，衝撞到即死技能這段時間站裡面，結束後再回到外面。'
        },
        {
            range: '71-80',
            bossFloor: 80, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Kajigakaka',
            notes: '從這組樓層開始掉落白金寶藏袋；71-73層爆炸陷阱特別多，建議坦克使用全景類魔陶器應對。這組樓層仍可取得重生類魔陶器（機率提升，也是最後能取得的樓層）。',
            mobTips: '留意幽靈(Wraith)與 Elbst 類怪物在脫離戰鬥後仍會發動的範圍技，稍不留神可能直接被秒殺；Mammoth類怪物在隱形狀態下移動時也容易造成意外，需隨時保持警覺。',
            bossTips: 'Boss先用扇形嚎叫附加凍傷持續傷害，接著使用瞬間位移技能，若目標仍處於凍傷狀態會被直接即死，需留意凍傷是否已消退。戰鬥中會在場地邊緣召出冰塊，冰塊若被直線AoE或其他爆炸波及會連鎖爆炸，需留意站位避免被牽連在內。'
        },
        {
            range: '81-90',
            bossFloor: 90, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: 'Onra',
            notes: '記得在本組樓層一開始就使用重生類魔陶器，之後的樓層不會再掉落。87-89層爆炸陷阱多，適合坦克使用全景類魔陶器。',
            mobTips: '84-86層的 Shinzei 巡邏怪特別棘手，建議能避則避，可用減少敵人、改變敵人、石化類魔陶器或魔石閃過。',
            bossTips: '戰鬥分為兩階段：血量85%前循環固定的三個大招(扇形直線AoE、近身擊退AoE、寬幅直線AoE)；85%後加入比例傷害的全場AoE，並會在某位玩家身上標記延遲觸發的流星AoE，同時場上黑球會持續對周遭造成重擊與擊退。近戰要維持輸出需配合Boss的走位與轉向時機，機制較複雜，建議先熟悉走位教學圖再挑戰。'
        },
        {
            range: '91-100',
            bossFloor: 100, needsTranslation: true, verified: false,
            bossNameZh: null,
            bossNameEn: null,
            notes: '97-99層怪物強度最低，99層保證會附帶3個強化效果，建議保留一個魔法效果解除類魔陶器應對。',
            mobTips: '91-93層若單人練習，建議挑白魔道士型怪物下手：只要靠視線躲開其石化咒語(Stone)就完全不會受傷，可以先在11層以上的小妖精身上練習抓視線時機；盡量避免招惹戰士(WAR)型怪物。94-96層是本組最難應付的區段，建議保留減少敵人、改變敵人、石化類魔陶器或魔石給這幾層。',
            bossTips: '第100層沒有Boss戰，只需跑到樓層最深處觸碰「天靈神座」即可完成攻略，不使用疾走技能大約15秒可以跑到終點。單人完成挑戰可取得稱號，若想在神座內截圖留念，可用指令 /title set "Lone Hero" 設定稱號。'
        }
    ],
    sourceUrl: 'https://www.ddcompendium.com/'
};
