// 正統優雷卡 攻略資料
// 內容整理自 https://www.ddcompendium.com/ 的樓層機制資料，以繁體中文重新改寫說明文字。
// 小怪與 Boss 中文譯名已依灰機wiki（ff14.huijiwiki.com）的中國服官方譯名簡轉繁校正。
window.DEEP_DUNGEON_DATA = window.DEEP_DUNGEON_DATA || {};
window.DEEP_DUNGEON_DATA.eo = {
    key: 'eo',
    nameZh: '正統優雷卡',
    nameEn: 'Eureka Orthos',
    floorRange: '1-100',
    pageUrl: 'eureka-orthos.html',
    overview: '正統優雷卡是繼死者宮殿、天之御柱之後推出的第三座深層迷宮，角色會以 81 級的狀態重新起算成長，依靠「聚魔裝備」與各類輔助道具（本迷宮稱為魔科學器）逐層推進。全程共 100 層，每 10 層會遭遇一次樓層守關王，99 層為最終 Boss，100 層只是一段衝刺跑圖。',
    uniqueSystems: [
        {
            name: '魔科學器',
            desc: '功能與其他深層迷宮的魔陶器相同，在正統優雷卡裡稱為魔科學器，以下三個效果為本迷宮專屬：',
            subItems: [
                { name: '緩速', desc: '會讓本層所有敵人進入 10 分鐘緩速狀態（對 Boss 無效），大幅拉長招式詠唱與攻速間隔，適合用在不熟悉的敵人身上。' },
                { name: '大漩渦', desc: '會把本層所有敵人的 HP 砍到剩 1，方便集中引怪後一次收尾（若敵人同時帶有禁止自然回血的效果會更穩定）。' },
                { name: '恐慌裝甲化', desc: '會讓自己短暫變身，取得可秒殺一般敵人的單體技能與遠程技能，對付小怪非常有效，但對強力魔物無效且無法造成擊退。' }
            ]
        },
        {
            name: '正統魔器碎片',
            desc: '銅箱常見的掉落物，突破第 30 層時也會固定獲得一個，可在創造系統摩杜納處兌換正統治療劑等消耗品，單人攻略時相當依賴這項資源。部分樓層區段一開始幾層的銅箱不會掉落，需留意資源分配與補充時機。'
        },
        {
            name: '亞靈複製體',
            desc: '銀箱有機率開出亞靈複製體生成器，使用後會召喚一名會自動行動的分身協助戰鬥，直到死亡或離開樓層為止，每人同時只能召喚一名，分為以下三種：',
            subItems: [
                { name: '烏內（幻術師）', desc: '治療型，會幫忙補血，可當作持續的額外治療來源。' },
                { name: '多加（咒術師）', desc: '輸出型，會幫忙攻擊敵人，可加速清怪與 Boss 戰。' },
                { name: '洋蔥劍士（劍術師）', desc: '較稀有的全能型，攻擊與補血兼具，整體價值最高。' }
            ]
        },
        {
            name: '強力魔物',
            desc: '進入樓層時若出現「能夠感受到強大魔物的氣息……」的提示，代表場上出現了美拉西迪亞複製體、亞靈智慧之靈、拉米亞女王三種強力魔物之一，攻擊力極高，普通攻擊就可能一擊打倒輸出或治療，且免疫擊退，建議能避則避。成功擊殺可獲得持續 30 分鐘的增益，以及一份額外的埋藏的寶藏。'
        }
    ],
    generalTraps: [
        { name: '弱化陷阱', desc: '觸發後自身攻擊力與防禦力降低 30%，持續 60 秒，效果期間盡量避免戰鬥。' },
        { name: '妨礙陷阱', desc: '讓周圍所有單位（含敵人與召喚物）陷入沉默與戰技封印，無法使用技能，容易打斷自己的輸出節奏。' },
        { name: '爆炸陷阱', desc: '對周圍所有單位（含敵人）造成相當於目前 HP 80% 的傷害，可反過來當作清怪手段，先引怪站上去再觸發。' },
        { name: '誘餌陷阱', desc: '觸發後會在原地額外喚出 3 個敵人，並直接鎖定踩到陷阱的人，建議備好形態變化類魔科學器應急。' },
        { name: '貓頭小鷹陷阱', desc: '正統優雷卡限定的變身陷阱，踩中後會變成貓頭小鷹 30 秒，無法使用道具、技能與開啟寶箱，且最大 HP 降低 50%；連續踩兩次會提前變回原本的樣子。' }
    ],
    specialRooms: [
        { name: '寶物房 (Treasure Room)', desc: '偶爾出現的特殊房間，固定有 4 個寶箱，但同時會聚集大量敵人；原本會四處遊走的巡邏怪若剛好生成在寶物房內，則會留在房內不離開。' }
    ],
    floorSets: [
        {
            range: '1-10',
            bossFloor: 10, needsTranslation: false, verified: true,
            bossNameZh: '蜜言妖',
            bossNameEn: 'Gancanagh',
            notes: '1-6 層沒有銅箱、不會出現寶箱怪，也不會掉落分身召喚物或多種魔科學器，須到第 7 層後才會出現；第 9 層不掉落寶箱增加、減少敵人、改變敵人三種魔科學器。',
            mobNames: [
                { nameEn: 'Orthos Grenade', nameZh: '正統榴彈怪', tips: '「Big Burst」預兆較晚，是傷害極高的貼地範圍爆炸技，看到牠開始動作要立刻遠離；若同時拉到多隻，要特別注意被接連炸到。' }
            ],
            mobTips: null,
            bossTips: '場地是 3x3 的地雷格，Boss 會隨機整排啟動地雷（固定從中間排開始引爆）。建議站在最後才會引爆的那一排，等該排炸完立刻移動到最先引爆、已經安全的那一排躲避下一波。同時留意他的範圍技，盡量遠離 Boss 本體以降低傷害。'
        },
        {
            range: '11-20',
            bossFloor: 20, needsTranslation: false, verified: true,
            bossNameZh: '複製系統',
            bossNameEn: 'Cloning Node',
            notes: '第 19 層不掉落寶箱增加、減少敵人、改變敵人三種魔科學器，11-13 層銅箱不掉落正統魔器碎片。',
            mobNames: [],
            mobTips: null,
            bossTips: '開場會召喚一圈共 8 個以鎖鏈相連的分身小怪，要站在「沒有被兩條鎖鏈同時指向」的小怪旁邊才安全。之後 Boss 會分兩批命令小怪朝固定方向噴火，第一組噴完後要立刻移動到另一組的安全位置躲避。'
        },
        {
            range: '21-30',
            bossFloor: 30, needsTranslation: false, verified: true,
            bossNameZh: '提亞馬特複製體',
            bossNameEn: "Tiamat's clone",
            notes: '第 29 層同樣不掉落寶箱增加、減少敵人、改變敵人三種魔科學器，21-23 層銅箱不掉落正統魔器碎片。',
            mobNames: [
                { nameEn: 'Orthodemolisher', nameZh: '正統破壞者', tips: '殘血 30% 以下會使用自爆技能，範圍極大、傷害極高，可用視線阻擋，也能搶在牠自爆前優先擊殺。' },
                { nameEn: 'Orthoknight', nameZh: '正統騎士', tips: '電磁技能預兆較晚，會先把範圍內玩家吸過去，緊接著立刻補上一記高傷的貼地範圍技，中招後務必立刻遠離。' },
                { nameEn: 'Lesser Orthos Dragon', nameZh: '正統小龍', tips: '巡邏怪，尾擊是大角度扇形攻擊、預兆較晚，緊貼牠身邊反而更容易閃到身後。' },
                { nameEn: 'Orthos Vanara', nameZh: '正統婆那羅', tips: '尾鐮同樣預兆較晚，需隨時留意周遭空間。' }
            ],
            mobTips: null,
            bossTips: 'Boss 會持續在場地中央或兩側噴發大範圍直線技，同時召喚會緩慢逼近玩家的小怪。中央噴發時要站到外側，兩側噴發時要站到中央，並持續移動閃避緩慢追蹤你的小怪，不被直線技或小怪追上即可穩定過關。'
        },
        {
            range: '31-40',
            bossFloor: 40, needsTranslation: false, verified: true,
            bossNameZh: '雙塔尼亞複製體',
            bossNameEn: "Twintania's clone",
            notes: '第 39 層不掉落寶箱增加、減少敵人、改變敵人三種魔科學器，31-33 層銅箱不掉落正統魔器碎片。此區段起寶箱怪等級提升為銀箱怪，獎勵也隨之提升。',
            mobNames: [
                { nameEn: 'Orthos Mirrorknight', nameZh: '正統鏡騎士', tips: '有背對機制，沒有及時轉身躲避會被暈眩長達 20 秒，幾乎等於直接等死，務必優先處理。' },
                { nameEn: 'Orthospider', nameZh: '正統蜘蛛', tips: '技能會把人縮小並附加 20 秒持續時間，縮小狀態下若被牠的雷射針命中會直接陣亡。' },
                { nameEn: 'Orthotaur', nameZh: '正統彌諾陶洛斯', tips: '兩招大範圍攻擊（鋼鐵／扇形）都有明顯預兆、可用視線阻擋迴避，拉怪後第一招固定是鋼鐵。' },
                { nameEn: 'Orthochimera', nameZh: '正統奇美拉', tips: '會交替使用冰、雷兩種無預兆的鋼鐵與月環攻擊，使用咆哮後必定緊接著用相反屬性的咆哮，可用視線阻擋。' },
                { nameEn: 'Phantom Orthoray', nameZh: '正統幻影光', tips: '劍閃與劍風會交替使用，同樣可用視線阻擋因應。' }
            ],
            mobTips: null,
            bossTips: '全程會不斷在腳下留下小型龍捲風，詠唱完成瞬間務必已經在移動，避免原地被瞬殺。Boss 也會放置數個圓形範圍技，記得預留一條從中央通往外圈、沒有範圍的安全通道，因為技能收尾時會把全員往外擊退，必須經過這條通道才不會被擊退到場外的傷害圈上。'
        },
        {
            range: '41-50',
            bossFloor: 50, needsTranslation: false, verified: true,
            bossNameZh: '自控化奇美拉14X',
            bossNameEn: 'Servomechanical Chimera 14X',
            notes: '第 49 層不掉落寶箱增加、減少敵人、改變敵人三種魔科學器，41-43 層銅箱不掉落正統魔器碎片。這個區段起請假設任何一招小怪技能都可能直接把人秒殺，務必謹慎應對。',
            mobNames: [
                { nameEn: 'Orthos Acheron', nameZh: '正統阿刻戎', tips: '地震技範圍極大，但可以打斷、也可以視線阻擋。' },
                { nameEn: 'Orthos Kelpie', nameZh: '正統凱爾派', tips: '衝刺成功後會立刻補上一招無預兆的中範圍攻擊。' },
                { nameEn: 'Orthos Hoarhound', nameZh: '正統霜狼', tips: '最危險，牠的深淵嚎是大範圍攻擊並附帶 5 秒暈眩，緊接著的冰狼蝕日會直接讓仍處於暈眩狀態的玩家受到極高傷害，建議預先把牠拉到牆角方便視線阻擋。' },
                { nameEn: 'Orthos Bergthurs', nameZh: '正統山巨魔', tips: '範圍感知，落肘技能是無預兆的後方錐形攻擊，只要不站在牠正後方就不會觸發。' },
                { nameEn: 'Orthos Gelato', nameZh: '正統明膠怪', tips: '殘血 30% 以下會使用自爆技能，讀條較長的大範圍攻擊，可用視線阻擋迴避。' }
            ],
            mobTips: null,
            bossTips: 'Boss 會不斷朝左側或右側施放 180 度扇形攻擊，需站到攻擊範圍的另一側閃避。另外會交替使用「冰→雷」或「雷→冰」的冰雷組合技，務必看清詠唱中的技能名稱順序（冰在前或雷在前）再決定站位內外側。遇到帶有遠距離鎖鏈的衝鋒技時，距離越遠衝鋒傷害越低，衝鋒結束後會緊接著再補上一次冰雷組合技，記得衝完鎖鏈後還要再跑位一次。場上偶爾會出現追蹤玩家一段時間的光球，放著不管會自動停下爆炸，命中會造成大量傷害與異常狀態，務必提前遠離。'
        },
        {
            range: '51-60',
            bossFloor: 60, needsTranslation: false, verified: true,
            bossNameZh: '自控化彌諾陶洛斯16',
            bossNameEn: 'Servomechanical Minotaur 16',
            notes: '此區段起寶箱怪等級再提升一階，場上怪物血量與自動攻擊傷害明顯提高，小怪普攻開始變痛，第一次挑戰建議開場就使用復生系道具。',
            mobNames: [
                { nameEn: 'Orthos Ice Sprite', nameZh: '正統冰元精', tips: '被擊殺後會短暫延遲再自爆，擊殺後務必立刻遠離。' },
                { nameEn: 'Orthos Ymir', nameZh: '正統尤彌爾', tips: '會對自己上一個反傷普攻增益，中了之後若繼續攻擊牠會受到等同即死的傷害，看到增益要立刻停手並解除鎖定。' },
                { nameEn: 'Orthos Rockfin', nameZh: '正統石鰭鯊', tips: '水之矛是即死技能，必須用視線阻擋迴避。' },
                { nameEn: 'Orthos Stingray', nameZh: '正統刺魟', tips: '猛撞擊退玩家後會立刻詠唱中範圍或大範圍環形攻擊，後者無法用視線阻擋，需提前抓好走位。' },
                { nameEn: 'Orthos Zaratan', nameZh: '正統札拉坦', tips: '靠聲音感知仇恨，牠的前後連續咬擊要留意站位，避免被連續命中。' }
            ],
            mobTips: null,
            bossTips: 'Boss 會連續揮出 8 次扇形攻擊，方向固定沿「前、後、右、左」或相反方向輪替，且每輪方向會與上一輪相反。（朱雀）'
        },
        {
            range: '61-70',
            bossFloor: 70, needsTranslation: false, verified: true,
            bossNameZh: '永恆',
            bossNameEn: 'Aeturna',
            notes: '此區段起寶箱怪等級再提升一階，屬於中後期難度的分水嶺，正式進入迷宮深層（61 層起），之後樓層的怪物強度不會再大幅提升；第一次挑戰建議開場使用復生系道具。',
            mobNames: [
                { nameEn: 'Orthoninja', nameZh: '正統忍者', tips: '靠聲音感知仇恨，玩家生命值低於 20% 時會被牠直接處決，血線不足時務必優先遠離或處理。' },
                { nameEn: 'Orthos Cobra', nameZh: '正統眼鏡蛇', tips: '有落肘類技能，不要站在牠正後方。' },
                { nameEn: 'Orthos Gowrow', nameZh: '正統高牢怪龍', tips: '抬手、抬尾攻擊完全沒有讀條提示，分別是前方與後方扇形範圍，需隨時留意牠的動作。' },
                { nameEn: 'Orthos Basilisk', nameZh: '正統烈陽火蛟', tips: '會對自己上一個反傷普攻增益，中了之後繼續攻擊會受到等同即死的傷害，看到增益要立刻停手並解除鎖定。' },
                { nameEn: 'Orthos Falak', nameZh: '正統法拉克', tips: '若有玩家距離過遠會詠唱大範圍環形攻擊，群戰時盡量不要讓隊友離得太散。' }
            ],
            mobTips: null,
            bossTips: '開場：坦克傷害技「鐵爪斬」→ 鎖鏈衝鋒「強襲」（粉紅鋸齒連線傷害較高、紫線中等，衝鋒前盡量拉開距離）。\n循環：「魔科學旋爪」（發藍光＝月環，無特效＝鋼鐵）→「咆哮」落石並留下四顆水晶，水晶隨後以「飛散」補上對應攻擊：旋爪鋼鐵時水晶放扇形，旋爪月環時水晶放鋼鐵。\n安全位置：鋼鐵情況站在最遠水晶與鄰近水晶之間、稍微靠近遠側；月環情況貼近 Boss 腳下內圈、朝向最遠水晶。'
        },
        {
            range: '71-80',
            bossFloor: 80, needsTranslation: false, verified: false,
            bossNameZh: '原型卡利亞',
            bossNameEn: 'Proto-Kaliya',
            notes: '71-73 層已知會出現大量地雷陷阱，若能提前探路可以輕鬆不少，坦克或補師可善用這點爭取時間；公認是全程最危險的一個區段，特別要提防 73、76 層開始出現的強力巡邏怪，建議這段開始積極使用減速或群體控場，並預留至少 7 分鐘應付 80 層王戰。',
            mobNames: [
                { nameEn: 'Orthokunoichi', nameZh: '正統女忍', tips: '同樣在玩家生命值低於 20% 時會直接處決，需留意血線。' },
                { nameEn: 'Orthos Coeurl', nameZh: '正統夸爾', tips: '有落肘類技能，不要站在牠正後方。' },
                { nameEn: 'Orthos Primelephas', nameZh: '正統曙象', tips: '衝刺後會快速補上一記範圍技。' },
                { nameEn: 'Orthos Gulo Gulo', nameZh: '正統狼獾', tips: '殺人爪會連續使用兩次前方扇形攻擊，看清牠動作完結後再靠近比較安全。' },
                { nameEn: 'Orthos Thunderbeast', nameZh: '正統雷獸', tips: '若伏下不動代表即將詠唱無預兆的大範圍攻擊，可以帶著牠繞圈走動、留意牠腳下範圍判定是否停下；若有人離太遠牠也會補上大範圍環形攻擊。' },
                { nameEn: 'Orthos Sasquatch', nameZh: '正統大腳巨猿', tips: '吃香蕉的動作會有延遲才發動超大範圍攻擊，可用視線阻擋，建議聽到特殊音效時立刻停止探索並找掩護。' },
                { nameEn: 'Orthos Flamebeast', nameZh: '正統焰獸', tips: '前方扇形範圍無法用視線阻擋，需留意位置。' },
                { nameEn: 'Orthos Skatene', nameZh: '正統斯卡尼特', tips: '靠聲音感知仇恨，中招會附加睡眠狀態，都需要特別提防。' }
            ],
            mobTips: null,
            bossTips: '開場使用扇形傷害技「共鳴」，接著發動「氣壓領域」（限第一輪）：場地中央是即死區，外圍環狀地帶也有持續傷害。\n「魔科學粒子散布」會為玩家與場外四個炮擊無人機標記正／負極（南北為負、東西為正），效果結束會觸發「魔科學磁石」造成短暫定身並產生磁力拉扯，請配合標記移動；無人機會同步施放「自動火炮」直線攻擊，構成十字形彈幕。\nBoss 會交替使用前方／左側／右側神經毒氣噴射（扇形攻擊），最後收尾是「環形神經毒氣噴射」：只有中央窄環安全，施放瞬間中央即死區會消失。中招任何毒氣或炮火都會疊加受到傷害提升。'
        },
        {
            range: '81-90',
            bossFloor: 90, needsTranslation: false, verified: false,
            bossNameZh: '管理者',
            bossNameEn: 'Administrator',
            notes: '此區段銀箱有相當高機率開出分身召喚物，但不會掉落重生類魔科學器；場地明顯變大，建議盡早探路找出口，接戰時保持中至近距離會比較容易閃避招式，第一次挑戰可考慮在此區段開場使用重生類魔科學器，並預留至少 7 分鐘應付 90 層王戰。',
            mobNames: [
                { nameEn: 'Orthos Catoblepas', nameZh: '正統卡托布萊帕斯', tips: '有超大範圍的背對機制，沒有背對成功會被附加異常狀態，看不到牠的名字代表還在安全距離之外，務必提早反應。' },
                { nameEn: 'Orthos Hecteyes', nameZh: '正統百目妖', tips: '靠聲音感知仇恨，牠的洗滌是超大範圍攻擊且無法被暈眩或打斷，相當浪費時間，建議能繞開就繞開。' },
                { nameEn: 'Orthoiron Corse', nameZh: '正統鐵面腐屍', tips: '扇形攻擊有延遲提示，正常應對即可。' },
                { nameEn: 'Orthos Gourmand', nameZh: '正統貪吃鬼', tips: '吸氣後會快速補上前方扇形攻擊，看到動作要提前準備閃避。' },
                { nameEn: 'Orthos Pegasus', nameZh: '正統黑天馬', tips: '嘶嘯是有預兆的大範圍攻擊，留意詠唱並提前拉開距離。' }
            ],
            mobTips: null,
            bossTips: 'Boss 會召喚蛋形、方塊、球形三種機械哨兵（分別會發動扇形、直線、環形攻擊其中一種），依照頭頂出現的數字標記順序依序躲避。\n後續會使用環狀射線（月環）或十字射線（十字形）其中一種大範圍技，接著補上一次傷害較低的全場射線流；十字射線跟環狀射線就算開減傷也可能讓後排（輸出、治療）瞬間陣亡，務必確實走位閃避，不要單純依賴減傷硬吃。\n其中一輪哨兵攻擊會搭配五個圓形範圍技同時出現，需要一邊閃避圓形技、一邊跑到安全的開火側；命中任何攻擊（射線流除外）都會疊加受到傷害提升。'
        },
        {
            range: '91-100',
            bossFloor: 99, needsTranslation: false, verified: false,
            bossNameZh: '鬥神 王者之劍',
            bossNameEn: 'Excalibur',
            notes: '最終 Boss 位於第 99 層，第 100 層只是一段約 1 分鐘的衝刺跑圖，記得預留足夠時間並一開始就衝刺。此區段銀箱同樣有高機率開出分身召喚物，但不會掉落重生類魔科學器；怪物房出現機率明顯變高，建議預留至少 10 分鐘應付 99 層王戰與 100 層長跑。',
            mobNames: [
                { nameEn: 'Orthos Mining Drone', nameZh: '正統採掘無人機', tips: '血量較厚且帶有擊退，連續衝撞 4 次後會補上一記前方大範圍攻擊，必要時可以考慮繞過。' },
                { nameEn: 'Orthosystem α', nameZh: '正統系統α', tips: '會釋放前方扇形的魔科學雷射，依延遲提示正常閃避即可。' },
                { nameEn: 'Orthosystem γ', nameZh: '正統系統γ', tips: '會先詠唱超大範圍的高壓電流，接著固定交替施放鋼鐵與月環攻擊。' },
                { nameEn: 'Orthodrone', nameZh: '正統無人機', tips: '被擊殺後會短暫延遲再自爆，擊殺後務必立刻遠離。' },
                { nameEn: 'Orthos Motherbit', nameZh: '正統浮游炮主板', tips: '會朝前方釋放直線攻擊，依延遲提示正常閃避即可。' },
                { nameEn: 'Orthos Zaghnal', nameZh: '正統札戈斧龍', tips: '殘虐咆哮是超大範圍攻擊，另外會隨機點名一名玩家並波及周遭隊友造成擊退，需留意站位。' },
                { nameEn: 'Orthos Fitter', nameZh: '正統整備工', tips: '邪聖同樣是超大範圍攻擊，兩者若搭配減速道具使用，詠唱條有機會顯示異常，仍要提高警覺。' },
                { nameEn: 'Orthos Mithridates', nameZh: '正統米特里達梯', tips: '雷射劍是前方大範圍扇形攻擊，建議站在牠後方閃避。' },
                { nameEn: 'Orthos Durga', nameZh: '正統杜爾迦', tips: '洗腦會讓人陷入混亂無法行動，緊接著的氣化炸彈範圍技在混亂結束後仍有足夠時間離開，不必慌張。' },
                { nameEn: 'Servomechanical Orthotaur', nameZh: '正統自控化彌諾陶洛斯', tips: '固定先使用前方扇形攻擊，再使用中範圍鋼鐵攻擊，依序交替循環，閃避節奏固定。' },
                { nameEn: 'Servomechanical Orthochimera', nameZh: '正統自控化奇美拉', tips: '招式大多有清楚的預兆或固定循環，依照延遲提示正常閃避即可。' }
            ],
            mobTips: null,
            bossTips: '核心規則：全程帶著冰或火屬性 buff，中到同屬性攻擊會即死（傷害 x10），中到相反屬性攻擊只會切換 buff、不會死，務必隨時留意自己的屬性要跟即將發動的攻擊相反。\n開場：佯謬（賦予冰／火 buff）→ 石中劍（投劍，稍後彈回）→ 熱力分割（場地分冰火兩側，站在跟自己 buff 相反的一側）→ 劍彈回（刻意用相反屬性的劍撞擊自己來切換 buff）→ 魂劍之虛（月環，站內）或魂劍之實（鋼鐵，站外）。\n循環：石中劍 → 佯謬賦予部分劍冰／火屬性 → 烈焰／寒霜匯聚預告（提前切換成相反屬性）→ 劍彈回 → 魂劍之虛／實 → 寒霜／烈焰天啟（依匯聚結果再次切換 buff）→ 極寒冰川或極熱炎流（依系統標示的安全位置閃避）→ 熱力分割，之後重複。'
        }
    ],
    sourceUrl: 'https://www.ddcompendium.com/',
    translationNote: '小怪、Boss、系統名稱與魔科學器（Protomander）名稱已依灰機wiki（ff14.huijiwiki.com）的中國服官方譯名簡轉繁校正；少數轉寫用字（如扎/紮）因無法百分之百確認，暫保留原樣。'
};
