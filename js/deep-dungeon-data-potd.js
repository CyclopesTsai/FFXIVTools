// 死者宮殿 攻略資料
// 內容整理自 https://www.ddcompendium.com/ 的樓層機制資料，以繁體中文重新改寫說明文字。
// 怪物/Boss 專有名稱暫以英文保留，待後續補上正式繁中譯名（bossNameZh）。
// 圖片（選填）：mobNames 項目與 floorSets 可各自加上 images / bossImages 陣列（一張或多張路徑），
// 圖檔放在 img/deep-dungeon/potd/ 底下，例如 images: ['img/deep-dungeon/potd/example.jpg']。
window.DEEP_DUNGEON_DATA = window.DEEP_DUNGEON_DATA || {};
window.DEEP_DUNGEON_DATA.potd = {
    key: 'potd',
    nameZh: '死者宮殿',
    nameEn: 'Palace of the Dead',
    floorRange: '1-200',
    pageUrl: 'palace-of-the-dead.html',
    overview: '死者宮殿是系列第一座深層迷宮，角色不論原本等級都會重置成 1 級，透過擊殺樓層怪物獲得經驗值成長到 60 級。玩家靠專用的「聚魔裝備」提升基礎戰力，並以「魔陶器」取得各種輔助效果，每 10 層會遭遇一次固定 Boss。攻略到 50 層後可開啟支線任務，讓之後的存檔能直接從 51 層開始挑戰。',
    uniqueSystems: [
        { name: '聚魔裝備', desc: '死者宮殿專用的武器/盾與防具，透過開啟樓層中的銀寶箱進行強化，強化等級會隨角色等級同步調整上限，是決定輸出與生存能力的核心。' },
        { name: '魔陶器', desc: '從金寶箱取得的消耗型輔助道具，效果五花八門（如全體增傷、減傷、移除陷阱、顯示地圖等），每種最多持有 3 個，且無法帶出迷宮外。' },
        { name: '傳送石塚與再生石塚', desc: '擊殺樓層內一定數量的怪物即可啟動：傳送石塚啟動後可前往下一層，再生石塚啟動後可復活戰鬥不能的隊員；若把整層怪物清光，兩者會直接瞬間啟動。' },
        { name: '死者宮殿限定魔陶器', desc: '「曼提克化」可讓自己變身曼提克、取得一擊必殺非 Boss 怪物的技能；「夢魔化」變身夢魔、取得範圍傷害技能常用於加速 Boss 戰；「基路伯化」變身基路伯、對不死系怪物有加成傷害，是清小怪與速殺特定 Boss 的利器，地下 51 層後才會出現。' },
        { name: '徬徨的英靈', desc: '宮殿中會出現曾在 FFXIV 劇情中殞落的 NPC 幽魂，依不同樓層區段登場，本質上是外觀特殊的一般怪物。' }
    ],
    generalTraps: [
        { name: '弱化陷阱', desc: '觸發後自身攻擊力與防禦力降低 30%，持續 60 秒，踩到後建議暫緩進攻，先閃避怪物攻擊。' },
        { name: '妨礙陷阱', desc: '觸發後範圍內所有單位（含怪物與召喚物）陷入沉默與戰技封印 30 秒，對己方是短暫的風險，但也能用來牽制周圍的怪物。' },
        { name: '爆炸陷阱', desc: '對觸發點周遭所有單位（含怪物）造成相當於當前 HP 80% 的傷害，可視情況反過來利用它來清理雜兵。' },
        { name: '誘餌陷阱', desc: '觸發後當前房間會出現 3 隻本層可能出現的敵人，並對踩到的人自帶初始仇恨，若人數眾多可考慮用「形態變化」類魔陶器應急。' },
        { name: '蛙變陷阱（死者宮殿限定）', desc: '把踩到的人變成青蛙 20 秒，無法使用道具、技能與開寶箱，且上限 HP 降低 60%；連續踩兩次會提前變回原本的樣子。變成青蛙時務必遠離蛇型怪物，牠們的吞食技能會直接把青蛙狀態的玩家秒殺。' }
    ],
    specialRooms: [
        { name: '寶物房', desc: '固定會有 4 個寶箱但怪物數量較多；原本會巡邏的怪物若一開始就生成在寶物房內，會留守不離開，之後才生成的巡邏怪則仍會正常遊走。' },
        { name: '樓層附加狀態', desc: '進入新樓層時有機率隨機套用增益或減益效果，分成三組（各組最多套用一種）：第一組如失神、黑暗、減傷、加速、HP 上限增減；第二組如回復停止、道具封印、擊退封印、衝刺封印；第三組「陰雲」會提升怪物的攻防與移動速度。使用魔陶器「魔法效果解除」可一次清除本層所有附加狀態。' },
        { name: '寶箱分級', desc: '銅寶箱開出藥水與可兌換道具的碎片；銀寶箱有機率強化聚魔裝備，也有機率直接爆炸、對周遭所有人造成當前 HP 70% 的傷害；金寶箱開出魔陶器，越深的樓層金寶箱偽裝成寶箱怪的機率也越高。' }
    ],
    floorSets: [
        { range: '51-60', bossFloor: 60, needsTranslation: false, verified: true, bossNameZh: '深黑騎士', bossNameEn: 'The Black Rider', notes: '此區段是許多玩家刷經驗值的熱門地點，仍需留意壁陷阱。', mobNames: [
            { nameEn: 'Palace Pudding', nameZh: '地宮軟糊怪' },
            { nameEn: 'Palace Anubys', nameZh: '地宮阿努比斯' },
            { nameEn: 'Palace Gremlin', nameZh: '地宮格雷姆林' },
            { nameEn: 'Palace Deepeye', nameZh: '地宮深瞳' },
            { nameEn: 'Palace Imp', nameZh: '地宮小魔精' },
            { nameEn: 'Palace Idol', nameZh: '地宮魔力石偶' },
            { nameEn: 'Palace Pot', nameZh: '地宮魔力罐' },
            { nameEn: 'Palace Taurus', nameZh: '地宮牛頭魔' },
            { nameEn: 'Palace Vodoriga', nameZh: '地宮石像魔' },
            { nameEn: 'Palace Arch Demon', nameZh: '地宮上級惡魔' },
            { nameEn: 'Palace Soulflayer', nameZh: '地宮奪魂魔' }
        ], mobTips: null, bossTips: '場邊蠟燭會噴出火焰造成擊退效果，被擊退進入火焰爆炸範圍會受到約 70% 最大 HP 的高額傷害，請確保有擊退免疫或提前移動到安全位置；地面會留下不會疊加的流血持續傷害水漬，可固定站在兩座火燭之間躲避。' },
        { range: '61-70', bossFloor: 70, needsTranslation: false, verified: true, bossNameZh: '水虎龍亞夸虜', bossNameEn: 'Yaquaru', notes: '延續 51-60 層的怪物強度與壁陷阱分布。', mobNames: [
            { nameEn: 'Palace Elbst', nameZh: '地宮水龍蜥' },
            { nameEn: 'Palace Raptor', nameZh: '地宮盜龍' },
            { nameEn: 'Palace Tyrannosaur', nameZh: '地宮暴龍' },
            { nameEn: 'Palace Sarcosuchus', nameZh: '地宮帝王鱷' },
            { nameEn: 'Palace Wivre', nameZh: '地宮犀蜴' },
            { nameEn: 'Palace Blade', nameZh: '地宮利刃醋蠍龍' },
            { nameEn: 'Palace Croc', nameZh: '地宮野生巨鱷' },
            { nameEn: 'Palace Diplocaulus', nameZh: '地宮笠頭螈' },
            { nameEn: 'Palace Triceratops', nameZh: '地宮三角龍' },
            { nameEn: 'Palace Pteranodon', nameZh: '地宮無齒翼龍' },
            { nameEn: 'Palace Mylodon', nameZh: '地宮磨齒獸' }
        ], mobTips: null, bossTips: 'Boss 使用浸濕技能後會在原地留下不會傷人、但會為自身加速的水漬，記得把 Boss 拖離水漬範圍；尾擊技能會附加沉重狀態，若還處於沉重就立即衝刺移動，以避開緊接而來的隨機單體雷擊 AoE。' },
        { range: '71-80', bossFloor: 80, needsTranslation: false, verified: true, bossNameZh: '古丹納', bossNameEn: 'Gudanna', notes: '整體難度持平，主要留意壁陷阱位置。', mobNames: [], mobTips: null, bossTips: 'Boss 會跑到場地兩端使用大範圍扇形重擊，同時隨機對單人放置會產生龍捲風的定點 AoE，被捲入龍捲風會被緩慢吸入並持續遭受雷擊傷害，請盡快脫離；Boss 殘血 10% 時會施放一次大型隕石 AoE，造成全體約 80% 最大 HP 的傷害，務必預先安排減傷或治療應對。' },
        { range: '81-90', bossFloor: 90, needsTranslation: false, verified: true, bossNameZh: '爆彈怪教母', bossNameEn: 'The Godmother', notes: '此區段有一處已知但可繞開的壁陷阱。', mobNames: [
            { nameEn: 'Palace Bomb', nameZh: '地宮爆彈怪', tips: '拉怪後約 37 秒會自爆，造成約自身最大 HP 70% 的範圍傷害，看到牠開始倒數要優先擊殺或盡快遠離。' },
            { nameEn: 'Palace Worm', nameZh: '地宮巨蟲', tips: '帶有激怒機制，拖得越久攻擊力越高，建議盡快解決、避免戰鬥時間過長。' }
        ], mobTips: null, bossTips: '戰鬥中會召喚灰色炸彈小怪並開始讀取爆裂技能，必須在它施放前擊殺，否則會造成全場約 80% 最大 HP 傷害；後段會召喚眩暈炸彈並配合 Boss 讀取大爆裂（約 99% 最大 HP 傷害），攻擊眩暈炸彈可以把它推往 Boss 身邊藉此中斷施法，同時留意場上其他未鎖定目標、會自爆的炸彈型小怪。' },
        { range: '91-100', bossFloor: 100, needsTranslation: true, verified: false, bossNameZh: '死靈術士尼博斯', bossNameEn: 'Nybeth Obdilord', notes: '這是劇情樓層的最後區段，91-95 層每房間 2-3 隻怪、96-99 層增加到 3-4 隻，仍需留意壁陷阱。', mobNames: [
            { nameEn: 'Palace Wraith', nameZh: '地宮幽靈' },
            { nameEn: 'Palace Mummy', nameZh: '地宮木乃伊' },
            { nameEn: 'Palace Swarm', nameZh: '地宮蠅群' },
            { nameEn: 'Palace Roselet', nameZh: '地宮小紅花' },
            { nameEn: 'Dark Dragon', nameZh: '暗龍' },
            { nameEn: 'Palace Hippocerf', nameZh: '地宮駿雕' },
            { nameEn: 'Palace Iron Corse', nameZh: '地宮鐵面腐屍' },
            { nameEn: 'Palace Corse', nameZh: '地宮巨人腐屍' },
            { nameEn: 'Palace Knight', nameZh: '地宮騎士' },
            { nameEn: 'Palace Gourmand', nameZh: '地宮貪吃鬼' },
            { nameEn: 'Palace Gravekeeper', nameZh: '地宮墓穴守衛' }
        ], mobTips: '此處怪物多為不死系且採「接近感知」，除了蠅群、小紅花、駿雕以外，幾乎都能用「基路伯化」類魔陶器 1-2 擊解決，但建議保留至少一次使用機會給 Boss 戰前清場。', bossTips: '戰鬥分為四個階段，Boss 在每次階段轉換時都會召喚不死系小怪，這些小怪若只是打死而未徹底「清除」，過一段時間會原地復活，建議使用基路伯化類魔陶器或強力 AoE 一次清乾淨；最終階段會固定輪替死亡宣告、虛無、痛苦之言與束縛技能，死亡宣告可用艾斯那淨化解除。' },
        { range: '101-110', bossFloor: 110, needsTranslation: true, verified: false, bossNameZh: '阿利坎托', bossNameEn: 'Alicanto', notes: '怪物與陷阱配置幾乎是 51-60 層的高數值版本。', mobNames: [
            { nameEn: 'Deep Palace Sprite', nameZh: '深宮元精' },
            { nameEn: 'Deep Palace Ziz', nameZh: '深宮席茲' },
            { nameEn: 'Deep Palace Doblyn', nameZh: '深宮礦妖蟲' },
            { nameEn: 'Deep Palace Yarzon', nameZh: '深宮盲頭蟹' },
            { nameEn: 'Goblin Adventurer', nameZh: '哥布林冒險者' },
            { nameEn: 'Deep Palace Stag', nameZh: '深宮雄羚羊' },
            { nameEn: 'Deep Palace Squirrel', nameZh: '深宮松鼠' },
            { nameEn: 'Deep Palace Hippogryph', nameZh: '深宮駿鷹' },
            { nameEn: 'Deep Palace Dung Beetle', nameZh: '深宮糞甲蟲' },
            { nameEn: 'Deep Palace Ladybug', nameZh: '深宮花甲蟲' },
            { nameEn: 'Deep Palace Hornet', nameZh: '深宮黃蜂' },
            { nameEn: 'Deep Palace Gaelicat', nameZh: '深宮風箏貓' }
        ], mobTips: '同樣要留意黃蜂瀕死時的「終極針」，固定造成自身最大 HP 70% 的傷害並自爆，請盡快擊殺或遠離。', bossTips: '技能循環與 10 層的 Boss 幾乎相同：瞬發近戰、扇形 AoE、定點緩速 AoE、隨機單體 AoE，最後以全體風傷 AoE 收尾，熟悉前段機制即可直接套用應對方式。' },
        { range: '111-120', bossFloor: 120, needsTranslation: true, verified: false, bossNameZh: '榮光魔花', bossNameEn: 'Kirtimukha', notes: '此區段壁陷阱同樣密集。', mobNames: [
            { nameEn: 'Deep Palace Gigantoad', nameZh: '深宮巨蟾蜍' },
            { nameEn: 'Deep Palace Leech', nameZh: '深宮水蛭' },
            { nameEn: 'Deep Palace Bifericeras', nameZh: '深宮對菊石' },
            { nameEn: 'Deep Palace Pudding', nameZh: '深宮軟糊怪' },
            { nameEn: 'Deep Palace Slime', nameZh: '深宮黏液怪' },
            { nameEn: 'Deep Palace Cobra', nameZh: '深宮眼鏡蛇' },
            { nameEn: 'Deep Palace Nanka', nameZh: '深宮南加' },
            { nameEn: 'Deep Palace Salamander', nameZh: '深宮蠑螈' },
            { nameEn: 'Deep Palace Ochu', nameZh: '深宮大口花' },
            { nameEn: 'Deep Palace Biloko', nameZh: '深宮比洛克' },
            { nameEn: 'Deep Palace Morbol', nameZh: '深宮魔界花' },
            { nameEn: 'Deep Palace Seedling', nameZh: '深宮幼苗' }
        ], mobTips: '黏液怪的自爆機制與一般史萊姆相同，開戰一段時間後務必優先解決；若踩到蛙變陷阱，務必遠離眼鏡蛇；南加即使脫離戰鬥也會持續對隨機玩家放出水滴 AoE，不要大意。', bossTips: '開場同樣是連續潑酸攻擊，接著召喚黃蜂小怪，牠們的終極針會造成約 70% 最大 HP 傷害且會不斷嘗試施放直到命中為止，務必優先擊殺或盡快遠離；若使用夢魔化類魔陶器，可以在第二波蜂群出現時用範圍技能一次清掉兩批小怪，非坦克請搭配減傷手段才能撐住。' },
        { range: '121-130', bossFloor: 130, needsTranslation: true, verified: false, bossNameZh: '埃爾法德', bossNameEn: 'Alfard', notes: '此區段壁陷阱同樣密集。', mobNames: [
            { nameEn: 'Deep Palace Dullahan', nameZh: '深宮無頭騎士' },
            { nameEn: 'Deep Palace Pteroc', nameZh: '深宮翼蜥' },
            { nameEn: 'Deep Palace Biast', nameZh: '深宮雷蛟' },
            { nameEn: 'Deep Palace Spriggan', nameZh: '深宮魔石精' },
            { nameEn: 'Deep Palace Adamantoise', nameZh: '深宮精金龜' },
            { nameEn: 'Deep Palace Wivre', nameZh: '深宮犀蜴' },
            { nameEn: 'Deep Palace Minotaur', nameZh: '深宮彌諾陶洛斯' },
            { nameEn: 'Deep Palace Basilisk', nameZh: '深宮石蜥蜴' },
            { nameEn: 'Deep Palace Centaur', nameZh: '深宮半人馬' },
            { nameEn: 'Deep Palace Skatene', nameZh: '深宮斯卡尼特' },
            { nameEn: 'Deep Palace Effigy', nameZh: '深宮泥岩巨獸' },
            { nameEn: 'Deep Palace Urolith', nameZh: '深宮烏洛里石' }
        ], mobTips: '彌諾陶洛斯的「百十一噗回轉」沒有預兆就會擊退範圍內玩家，清怪時請保持警覺，避免被巡邏中的牠意外命中。', bossTips: '機制與 30 層的 Boss 相同（火球／冰球交錯放置，搭配扇形撕裂爪與中央全場混亂 AoE），差異在於本層混亂 AoE 的讀條速度更快，看到 Boss 往中央移動要立刻跟上集合，否則來不及站到安全位置。' },
        { range: '131-140', bossFloor: 140, needsTranslation: true, verified: false, bossNameZh: '阿普切', bossNameEn: 'Ah Puch', notes: '壁陷阱持續增加。', mobNames: [
            { nameEn: 'Deep Palace Soul', nameZh: '深宮游魂' },
            { nameEn: 'Deep Palace Gourmand', nameZh: '深宮貪吃鬼' },
            { nameEn: 'Deep Palace Hecteyes', nameZh: '深宮百目妖' },
            { nameEn: 'Deep Palace Ogre', nameZh: '深宮食人魔' },
            { nameEn: 'Deep Palace Ahriman', nameZh: '深宮冥鬼之眼' },
            { nameEn: 'Deep Palace Mummy', nameZh: '深宮木乃伊' },
            { nameEn: 'Deep Palace Guard', nameZh: '深宮護衛' },
            { nameEn: 'Deep Palace Catoblepas', nameZh: '深宮卡托布萊帕斯' },
            { nameEn: 'Deep Palace Dahak', nameZh: '深宮扎哈克' },
            { nameEn: 'Deep Palace Troubador', nameZh: '深宮行吟詩人' },
            { nameEn: 'Deep Palace Monk', nameZh: '深宮鬼魚' },
            { nameEn: 'Deep Palace Taurus', nameZh: '深宮牛頭魔' }
        ], mobTips: '冥鬼之眼的「5 級石化」是沒有預兆的扇形 AoE，命中會直接附加石化，正面遭遇時務必避免站在牠面前，盡量繞到側邊或背後擊殺。', bossTips: '與 40 層的 Boss 機制相同，但本層小怪若在嘶吼階段仍存活，獵物狀態會使牠們使出必定秒殺全隊的技能，清小怪的時間壓力更高；本層 Boss 對「基路伯化」類傷害特別脆弱，可考慮直接用基路伯化在一分鐘內解決戰鬥。' },
        { range: '141-150', bossFloor: 150, needsTranslation: true, verified: false, bossNameZh: '提西福涅', bossNameEn: 'Tisiphone', notes: '戰鬥節奏開始吃緊，壁陷阱持續增加。', mobNames: [
            { nameEn: 'Deep Palace Ked', nameZh: '深宮巨虻' },
            { nameEn: 'Deep Palace Demon', nameZh: '深宮惡魔' },
            { nameEn: 'Deep Palace Manticore', nameZh: '深宮曼提克' },
            { nameEn: 'Deep Palace Gargoyle', nameZh: '深宮石像鬼' },
            { nameEn: 'Deep Palace Knight', nameZh: '深宮騎士' },
            { nameEn: 'Deep Palace Bhoot', nameZh: '深宮浮靈' },
            { nameEn: 'Deep Palace Wraith', nameZh: '深宮幽靈' },
            { nameEn: 'Deep Palace Hellhound', nameZh: '深宮地獄犬' },
            { nameEn: 'Deep Palace Persona', nameZh: '深宮假面' },
            { nameEn: 'Deep Palace Succubus', nameZh: '深宮夢魔' },
            { nameEn: 'Onyx Dragon', nameZh: '奧尼克斯龍' },
            { nameEn: 'Deep Palace Keeper', nameZh: '深宮守衛' }
        ], mobTips: '夢魔即使脫離戰鬥也會持續對隨機玩家放出虛空熾炎 AoE，請提早留意；惡魔的「大漩渦」是讀條式自爆技能、可被打斷，建議儘早處理或預先打斷以免承受大量傷害。', bossTips: 'Boss 每輪會召喚不同種類的小怪配合技能：石像鬼小怪會搭配大範圍直線 AoE；殭屍小怪會緩慢爬向玩家，碰到後會造成束縛（建議優先擊殺，或用遠程持續輸出拖住）；另有延遲施放定點 AoE 的石像魔與可留著輸出的夢魔小怪，夢魔會被 Boss 吸收剩餘血量強化自身；整場偶爾會施放一次全屏高傷害的血雨 AoE（連敵方單位也會受傷），走位時留意不要被束縛卡住。' },
        { range: '151-160', bossFloor: 160, needsTranslation: true, verified: false, bossNameZh: '非生騎士', bossNameEn: 'Todesritter', notes: '巡邏怪消失、視野大幅提升，但誘餌陷阱風險隨樓層提高；金寶袋開始出現，建議盡快用掉感知寶藏類魔陶器，拾取戰利品前請先確認陷阱位置。', mobNames: [
            { nameEn: 'Deep Palace Shabti', nameZh: '深宮沙布提' },
            { nameEn: 'Deep Palace Pudding', nameZh: '深宮軟糊怪' },
            { nameEn: 'Deep Palace Gremlin', nameZh: '深宮格雷姆林' },
            { nameEn: 'Deep Palace Deepeye', nameZh: '深宮深瞳' },
            { nameEn: 'Deep Palace Pot', nameZh: '深宮魔力罐' },
            { nameEn: 'Deep Palace Marolith', nameZh: '深宮馬洛里石' },
            { nameEn: 'Deep Palace Imp', nameZh: '深宮小惡魔' },
            { nameEn: 'Deep Palace Soulflayer', nameZh: '深宮奪魂魔' },
            { nameEn: 'Deep Palace Taurus', nameZh: '深宮牛頭魔' },
            { nameEn: 'Deep Palace Arch Demon', nameZh: '深宮上級惡魔' }
        ], mobTips: '小惡魔與奪魂魔是這個區段要特別提防的小怪，兩者都帶有反擊或吸血類技能、能拖長戰鬥時間，建議優先處理或保持距離，避免被圍攻。', bossTips: '機制與 60 層的 Boss 完全相同，只是數值更高：一樣要注意蠟燭擊退後的爆炸傷害，以及不會疊加的流血水漬。' },
        { range: '161-170', bossFloor: 170, needsTranslation: true, verified: false, bossNameZh: '虹蛇', bossNameEn: 'Yulunggu', notes: '整體難度比 151-160 層區段略低，仍需留意壁陷阱。', mobNames: [
            { nameEn: 'Deep Palace Tursus', nameZh: '深宮圖蘇斯水龍蜥' },
            { nameEn: 'Deep Palace Lindwurm', nameZh: '深宮森疾龍' },
            { nameEn: 'Deep Palace Croc', nameZh: '深宮中音巨鱷' },
            { nameEn: 'Deep Palace Sarcosuchus', nameZh: '深宮帝王鱷' },
            { nameEn: 'Deep Palace Wivre', nameZh: '深宮犀蜴' },
            { nameEn: 'Deep Palace Vinegaroon', nameZh: '深宮醋蠍龍' },
            { nameEn: 'Deep Palace Mylodon', nameZh: '深宮磨齒獸' },
            { nameEn: 'Deep Palace Archaeosaur', nameZh: '深宮古恐龍' },
            { nameEn: 'Deep Palace Triceratops', nameZh: '深宮三角龍' },
            { nameEn: 'Deep Palace Pteranodon', nameZh: '深宮無齒翼龍' },
            { nameEn: 'Deep Palace Diplocaulus', nameZh: '深宮笠頭螈' }
        ], mobTips: '恐龍系小怪攻擊力較高，正面硬吃傷害不小，建議避免同時拉動太多隻。', bossTips: '與 70 層的 Boss 機制相同，但浸濕水漬這次還會額外提升 Boss 的傷害輸出，務必確實把 Boss 拖出水漬範圍，否則輸出效率會被嚴重拖慢。' },
        { range: '171-180', bossFloor: 180, needsTranslation: true, verified: false, bossNameZh: '丹代恩索涅', bossNameEn: 'Dendainsonne', notes: '歡迎來到最終幾個區段：前段怪物較好應付，但最後幾層（187-189 尤其明顯）怪物強度大幅提升，建議省著用魔陶器，留到最後幾層再集中爆發使用。', mobNames: [
            { nameEn: 'Deep Palace Snowclops', nameZh: '深宮獨眼雪巨人' },
            { nameEn: 'Deep Palace Bandersnatch', nameZh: '深宮斑攫獸' },
            { nameEn: 'Deep Palace Bear', nameZh: '深宮白熊' },
            { nameEn: 'Deep Palace Dhalmel', nameZh: '深宮長頸駝' },
            { nameEn: 'Deep Palace Wolf', nameZh: '深宮白狼' },
            { nameEn: 'Deep Palace Aurochs', nameZh: '深宮文森野牛' },
            { nameEn: 'Deep Palace Lion', nameZh: '深宮雄獅' },
            { nameEn: 'Deep Palace Sasquatch', nameZh: '深宮大腳巨猿' },
            { nameEn: 'Bird of the Palace', nameZh: '深宮妖鳥' },
            { nameEn: 'Deep Palace Anzu', nameZh: '深宮安祖' },
            { nameEn: 'Deep Palace Coeurl', nameZh: '深宮長鬚黑豹' }
        ], mobTips: '後段樓層常出現安祖與大腳巨猿的難纏組合：安祖的「狂亂」會造成暈眩並疊加易傷，大腳巨猿脫離戰鬥時會持續用「捶胸」疊加減益；雪巨人的揮砍與回轉重擊也完全沒有預兆，手上若有曼提克化類魔陶器可考慮在這類樓層使用清場。', bossTips: '機制與 80 層的 Boss 相同，但本層會在 Boss 殘血 15% 時進入狂暴：之後會不斷重複施放造成全隊約 80% 最大 HP 傷害的隕石技能，直到擊殺 Boss 或團滅為止。進入狂暴前請確保減傷技能與藥水能撐過最後衝刺，必要時可取消變身／飽食類 buff 來降低自身 HP 上限，減輕治療負擔。' },
        { range: '181-190', bossFloor: 190, needsTranslation: true, verified: false, bossNameZh: '爆彈怪教父', bossNameEn: 'The Godfather', notes: '此區段一般樓層被視為最危險的部分，87-89 層的怪物組合特別棘手，建議省著用魔陶器撐過前段，到後面再視情況使用形態變化／曼提克化等魔陶器清場；務必在此區段一開始就用掉手上的重生類魔陶器。', mobNames: [
            { nameEn: 'Palace Wamoura', nameZh: '深宮瓦魔蛾' },
            { nameEn: 'Palace Grenade', nameZh: '深宮榴彈怪' },
            { nameEn: 'Palace Sprite', nameZh: '深宮元精' },
            { nameEn: 'Palace Wamouracampa', nameZh: '深宮瓦魔蛾幼蟲' },
            { nameEn: 'Palace Garm', nameZh: '深宮加姆' },
            { nameEn: 'Palace Worm', nameZh: '深宮洪水巨蟲' },
            { nameEn: 'Palace Crawler', nameZh: '深宮毛爬蟲' },
            { nameEn: 'Palace Vindthurs', nameZh: '深宮風巨魔' },
            { nameEn: 'Palace Archaeosaur', nameZh: '深宮古恐龍' },
            { nameEn: 'Palace Claw', nameZh: '深宮巨鉗蝦' },
            { nameEn: 'Flood Dragon', nameZh: '水龍' }
        ], mobTips: '瓦魔蛾會用「蛻皮」治療其他敵人，若同時拉到兩隻瓦魔蛾務必優先集火擊殺其中一隻，否則牠們會互相回血打不完；除了 87-89 層外，86 層出現的怪物組合也偏隨機，有機會遇到棘手配置，建議保持警覺，不要掉以輕心。', bossTips: '機制與 90 層的 Boss 相同：清算型炸彈讀條時必須搶先擊殺，否則會造成約 80% 最大 HP 傷害並附加凍傷持續傷害；熾焰型炸彈可以用攻擊移動的方式中斷 Boss 的大爆裂技能（約 99% 最大 HP 傷害），過程中留意路上其他未鎖定、會自爆的炸彈型小怪。' },
        { range: '191-200', bossFloor: 200, needsTranslation: true, verified: false, bossNameZh: null, bossNameEn: null, notes: '怪物數量與每房間人數來到全程最高（3-4 人/房），多數怪物可用基路伯化類魔陶器以 2-3 擊解決；務必善用感知寶藏、咒印解除、全景等魔陶器加快清場速度。', mobNames: [
            { nameEn: 'Deep Palace Mummy', nameZh: '深宮木乃伊' },
            { nameEn: 'Deep Palace Iron Corse', nameZh: '深宮鐵面腐屍' },
            { nameEn: 'Deep Palace Trap', nameZh: '深宮寒冰陷阱草' },
            { nameEn: 'Deep Palace Hippogryph', nameZh: '深宮駿鷹' },
            { nameEn: 'Deep Palace Wraith', nameZh: '深宮幽靈' },
            { nameEn: 'Onyx Dragon', nameZh: '奧尼克斯龍' },
            { nameEn: 'Deep Palace Fachan', nameZh: '深宮幽鬼之眼' },
            { nameEn: 'Deep Palace Bicephalus', nameZh: '深宮雙頭腐屍' },
            { nameEn: 'Deep Palace Knight', nameZh: '深宮騎士' },
            { nameEn: 'Deep Palace Gourmand', nameZh: '深宮貪吃鬼' },
            { nameEn: 'Deep Palace Keeper', nameZh: '深宮守衛' }
        ], mobTips: '幽鬼之眼的「5 級即死」是沒有預兆的扇形 AoE，中招會直接陣亡，正面遭遇時務必避開牠面前的方向；部分殭屍系巡邏怪繞路閃避反而更浪費時間，建議直接正面清掉，同時留意哪些怪物免疫昏厥，別浪費控場技能。', bossTips: '本區段沒有真正的 Boss 戰，只要走到 200 層底端、觸碰終點的聖火盆或玻璃南瓜即可完成攻略（單人大約需要 35 秒跑過整層）。單人成功觸碰終點會自動取得稱號，過程中怪物數量明顯提升，建議保留足夠的重生類魔陶器應付最後衝刺。' }
    ],
    sourceUrl: 'https://www.ddcompendium.com/'
};
