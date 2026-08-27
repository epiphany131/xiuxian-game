'use strict';
// 修仙问道 · 游戏核心逻辑

/* ================= 常量 ================= */
const REALMS = [
  { name: '练气', req: 100,     chance: 1.0,  desc: '炼精化气，初窥门径' },
  { name: '筑基', req: 300,     chance: 0.92, desc: '筑就道基，褪去凡胎' },
  { name: '金丹', req: 800,     chance: 0.84, desc: '凝结金丹，寿元大涨' },
  { name: '元婴', req: 2000,    chance: 0.76, desc: '元婴出窍，逍遥天地' },
  { name: '化神', req: 5000,    chance: 0.68, desc: '炼神还虚，万法归宗' },
  { name: '炼虚', req: 12000,   chance: 0.60, desc: '碎虚合道，感悟法则' },
  { name: '合体', req: 30000,   chance: 0.52, desc: '身与道合，三花聚顶' },
  { name: '大乘', req: 80000,   chance: 0.44, desc: '功德圆满，静候天劫' },
  { name: '渡劫', req: 200000,  chance: 0.36, desc: '九重天劫，一步登仙或万劫不复' },
];

const PILLS = {
  jq: { name: '聚气丹', desc: '服用后立即获得当前境界所需修为的 40%', cost: r => 60 * (r + 1), max: 99 },
  pz: { name: '破障丹', desc: '突破时自动服用，成功率 +15%（最多持 3 枚）', cost: r => 120 * (r + 1), max: 3 },
  as: { name: '安神丹', desc: '平息心魔，减少 30 点心魔值', cost: r => 80 * (r + 1), max: 99 },
  ningshen: { name: '凝神丹', desc: '服用后心魔值减半', cost: () => Infinity, max: 99, craftOnly: true },
  xidi:     { name: '洗髓丹', desc: '服用后洗练灵根，随机重获一具新灵根', cost: () => Infinity, max: 99, craftOnly: true },
  wudao:    { name: '悟道丹', desc: '服用后立即获得所需修为的 60%', cost: () => Infinity, max: 99, craftOnly: true },
  dutian:   { name: '渡劫丹', desc: '服用后获得天劫护体（3 次突破内）：成功率 +10%，失败反噬减半', cost: () => Infinity, max: 99, craftOnly: true },
};

const SAVE_KEY = 'xiuxian_idle_save';
const PLAYER_KEY = 'xiuxian_player_id';
const SAVE_VERSION = 1;              // 存档版本号（迁移用）
const SAVE_INTERVAL = 15000;         // 自动存档间隔（毫秒）

// 离线收益上限（秒）：基础 8 小时，仙府每层 +10 分钟，至多 +12 小时
function offlineCap() {
  return 8 * 3600 + Math.min((state.xianManor || 0) * 600, 12 * 3600);
}

/* ================= 灵根 / 体质 / 法宝 / 洞府 ================= */
const SPIRIT_ROOTS = [
  { name: '杂灵根',   cult: 1.0, rarity: '凡品', weight: 40 },
  { name: '三灵根',   cult: 1.2, rarity: '中品', weight: 30 },
  { name: '双灵根',   cult: 1.5, rarity: '上品', weight: 18 },
  { name: '天灵根',   cult: 2.0, rarity: '极品', weight: 9 },
  { name: '混沌灵根', cult: 3.0, rarity: '仙品', weight: 3 },
];

const PHYSIQUES = [
  { name: '凡体',   chance: 0.0, stones: 1.0, rarity: '凡品', weight: 40 },
  { name: '灵体',   chance: 0.05, stones: 1.0, rarity: '中品', weight: 30 },
  { name: '道体',   chance: 0.10, stones: 1.0, rarity: '上品', weight: 18 },
  { name: '圣体',   chance: 0.15, stones: 1.2, rarity: '极品', weight: 9 },
  { name: '混沌圣体', chance: 0.20, stones: 1.5, rarity: '仙品', weight: 3 },
];

const TREASURES = {
  sword:   { name: '灵剑', slot: '攻', desc: '提升修炼速度', max: 30 },
  armor:   { name: '玄甲', slot: '御', desc: '提升突破成功率', max: 10 },
  pendant: { name: '灵佩', slot: '辅', desc: '提升灵石产出', max: 30 },
};

const DWELLING_MAX = 50;

/* ================= 每日任务 ================= */
const DAILY_QUESTS = [
  { id: 'meditate', name: '静坐入定', stat: 'meditations', target: 15, reward: { stones: 300 }, desc: '今日打坐修炼 {n} 次' },
  { id: 'break',    name: '破境有成', stat: 'breakthroughs', target: 2, reward: { stones: 400, pz: 1 }, desc: '今日突破境界 {n} 次' },
  { id: 'pills',    name: '服丹问道', stat: 'pillsUsed', target: 8, reward: { stones: 250, jq: 1 }, desc: '今日服用丹药 {n} 次' },
  { id: 'stones',   name: '日进斗金', stat: 'lifetimeStones', target: 5000, reward: { stones: 400 }, desc: '今日累计获得 {n} 灵石' },
  { id: 'events',   name: '机缘深厚', stat: 'events', target: 2, reward: { stones: 300 }, desc: '今日经历奇遇 {n} 次' },
  { id: 'craft',    name: '丹道有恒', stat: 'crafts', target: 3, reward: { stones: 300, jq: 1 }, desc: '今日炼制丹药 {n} 次' },
  { id: 'travel',   name: '云游四方', stat: 'travels', target: 2, reward: { stones: 350 }, desc: '今日云游历练 {n} 次' },
  { id: 'defend',   name: '驻守有方', stat: 'defends', target: 3, reward: { stones: 400 }, desc: '今日驻地驻守胜绩 {n} 次' },
  { id: 'spirit',   name: '器灵养炼', stat: 'spirits', target: 1, reward: { stones: 500, jq: 1 }, desc: '今日器灵觉醒/升级 {n} 次' },
  { id: 'breed',    name: '血脉相传', stat: 'breeds', target: 1, reward: { stones: 600, jq: 2 }, desc: '今日繁育后代 {n} 次' },
];

/* ================= 灵宠 ================= */
const PET_SPECIES = [
  { name: '灵狐', rarity: '凡品', bonus: 0.04, weight: 40, desc: '灵动敏捷，修为 +4%/级' },
  { name: '仙鹤', rarity: '中品', bonus: 0.07, weight: 30, desc: '仙姿清雅，修为 +7%/级' },
  { name: '蛟龙', rarity: '上品', bonus: 0.11, weight: 18, desc: '龙血初醒，修为 +11%/级' },
  { name: '凤凰', rarity: '极品', bonus: 0.16, weight: 9,  desc: '涅槃之气，修为 +16%/级' },
  { name: '麒麟', rarity: '仙品', bonus: 0.24, weight: 3,  desc: '瑞兽降世，修为 +24%/级' },
];
const PET_CAPTURE_COST = 500;

/* 灵宠资质：捕捉时随机，影响加成倍率与成长上限 */
const PET_TALENTS = [
  { name: '凡资', mult: 1.0,  max: 20, weight: 50 },
  { name: '灵资', mult: 1.15, max: 35, weight: 30 },
  { name: '通灵', mult: 1.35, max: 50, weight: 15 },
  { name: '仙资', mult: 1.6,  max: 80, weight: 5 },
];

/* 进化阶段：随等级演化，突破蜕变化形 */
const PET_TIERS = [
  { min: 1,  name: '幼兽', mult: 1.0 },
  { min: 6,  name: '成熟', mult: 1.2 },
  { min: 13, name: '化形', mult: 1.5 },
  { min: 21, name: '圣灵', mult: 2.0 },
];

/* ================= 宗门 ================= */
const SECTS = [
  { name: '剑宗',   joinCost: 800, cultBonus: 0.30, stoneBonus: 0,    chanceBonus: 0,    desc: '以剑入道，修炼速度 +30%' },
  { name: '丹鼎宗', joinCost: 800, cultBonus: 0,    stoneBonus: 0,    chanceBonus: 0,    desc: '丹道圣地，丹药价格 8 折' },
  { name: '符箓宗', joinCost: 800, cultBonus: 0,    stoneBonus: 0.30, chanceBonus: 0,    desc: '符法通天，灵石产出 +30%' },
  { name: '体修宗', joinCost: 800, cultBonus: 0,    stoneBonus: 0,    chanceBonus: 0.08, desc: '肉身成圣，突破成功率 +8%' },
];
const SECT_TECH_MAX = 20;

/* ================= 秘境试炼 ================= */
const DUNGEONS = [
  { name: '外门试炼', minRealm: 0, energy: 3,  reward: { stones: [80, 200], pill: 'jq', petChance: 0.02 }, desc: '低阶妖兽盘踞，偶得机缘' },
  { name: '内门禁地', minRealm: 3, energy: 6,  reward: { stones: [300, 700], pill: 'pz', petChance: 0.05, treasure: 'armor' }, desc: '凶兽出没，机缘更盛' },
  { name: '仙家秘境', minRealm: 6, energy: 10, reward: { stones: [1200, 2500], pill: 'as', petChance: 0.10, treasure: 'sword', petExp: true }, desc: '上古遗泽，藏宝无数' },
];
const ENERGY_MAX = 20;
const ENERGY_REGEN = 1 / 90; // 每 90 秒恢复 1 点精力

/* ================= 灵田 ================= */
const HERBS = [
  { id: 'zicao',    name: '紫灵草', grow: 60,   seedCost: 20,   yield: [1, 2], rarity: '凡品', desc: '最常见的灵草，炼丹基础材料' },
  { id: 'qingyang', name: '青阳花', grow: 300,  seedCost: 80,   yield: [1, 2], rarity: '中品', desc: '汲取日月精华，蕴含一缕道韵' },
  { id: 'longxian', name: '龙涎果', grow: 900,  seedCost: 300,  yield: [1, 2], rarity: '上品', desc: '传闻沾染真龙涎液，价值连城' },
];
const FIELD_SLOT_COST = [0, 0, 500, 3000]; // 下标为格子序号，初始 2 格，可开至 4 格

/* ================= 炼丹 ================= */
const RECIPES = [
  { id: 'jq',       name: '聚气丹',   lv: 1, herbs: { zicao: 3 },                          desc: '3 紫灵草' },
  { id: 'ningshen', name: '凝神丹',   lv: 2, herbs: { zicao: 4, qingyang: 1 },             desc: '4 紫灵草 + 1 青阳花' },
  { id: 'xidi',     name: '洗髓丹',   lv: 3, herbs: { zicao: 5, qingyang: 2 },             desc: '5 紫灵草 + 2 青阳花' },
  { id: 'pz',       name: '破障丹',   lv: 4, herbs: { qingyang: 2, longxian: 1 },          desc: '2 青阳花 + 1 龙涎果' },
  { id: 'wudao',    name: '悟道丹',   lv: 5, herbs: { qingyang: 3, longxian: 2 },          desc: '3 青阳花 + 2 龙涎果' },
  { id: 'dutian',   name: '渡劫丹',   lv: 6, herbs: { zicao: 6, longxian: 2 },             desc: '6 紫灵草 + 2 龙涎果' },
];

/* ================= 炼器 ================= */
const AFFIXES = [
  { id: 'cult',   name: '通灵', desc: '修炼速度 +5%',  fx: { cult: 0.05 } },
  { id: 'stones', name: '聚宝', desc: '灵石产出 +5%',  fx: { stones: 0.05 } },
  { id: 'chance', name: '破障', desc: '突破成功率 +3%', fx: { chance: 0.03 } },
  { id: 'all',    name: '混元', desc: '全属性 +3%',    fx: { all: 0.03 } },
];
const FORGE_MAX = 10;

/* ================= 云游历练 ================= */
const TRAVEL_MAPS = [
  { id: 'market',  name: '凡尘市井', minRealm: 0, cooldown: 60,  stones: [20, 60],    herbs: [['zicao', 0.5], ['qingyang', 0.15]], ore: 0.2, treasure: null,     desc: '烟火人间，坊市奇遇不断' },
  { id: 'beast',   name: '妖兽山脉', minRealm: 2, cooldown: 120, stones: [80, 200],   herbs: [['zicao', 0.7], ['qingyang', 0.3], ['longxian', 0.08]], ore: 0.5, treasure: 'armor',  desc: '妖兽横行，亦藏天材地宝' },
  { id: 'ancient', name: '荒古禁地', minRealm: 4, cooldown: 240, stones: [300, 800],  herbs: [['qingyang', 0.6], ['longxian', 0.25]], ore: 0.8, treasure: 'sword',  desc: '上古战场，凶险与机缘并存' },
  { id: 'relic',   name: '上界遗墟', minRealm: 6, cooldown: 480, stones: [1000, 2500], herbs: [['longxian', 0.5]],                     ore: 1.2, treasure: 'pendant', desc: '仙路遗痕，机缘无限' },
];

/* ================= 功法秘典 ================= */
const METHODS = [
  { id: 'tianyan', name: '天衍诀',   unlockRealm: 0, cost: 0,       cult: 0.30, stones: 0.10, chance: 0,    demon: 0,   desc: '推演天机，修炼 +30%、灵石 +10%/级' },
  { id: 'jianyu',  name: '玉清剑诀', unlockRealm: 2, cost: 8000,    cult: 0.20, stones: 0,    chance: 0.06, demon: 0,   desc: '剑心通明，修炼 +20%、突破 +6%/级' },
  { id: 'taiqing', name: '太清心经', unlockRealm: 4, cost: 40000,   cult: 0.25, stones: 0,    chance: 0,    demon: 0.5, desc: '清心寡欲，修炼 +25%、心魔滋扰减半/级' },
  { id: 'hunyuan', name: '混元道典', unlockRealm: 6, cost: 150000,  cult: 0.15, stones: 0.25, chance: 0,    demon: 0,   desc: '混元一体，修炼 +15%、灵石 +25%/级' },
];

/* ================= 悟道神通 ================= */
const DIVINE_SKILLS = [
  { id: 'cult',   name: '汲灵',   icon: '修', max: 5, desc: '修炼速度 +8%/级' },
  { id: 'stones', name: '聚财',   icon: '财', max: 5, desc: '灵石产出 +8%/级' },
  { id: 'chance', name: '悟道',   icon: '破', max: 5, desc: '突破成功率 +3%/级' },
  { id: 'travel', name: '云游',   icon: '游', max: 3, desc: '云游收益 +10%/级' },
  { id: 'craft',  name: '丹心',   icon: '丹', max: 3, desc: '炼丹产量 +1 枚/级' },
  { id: 'ore',    name: '冶金',   icon: '炼', max: 3, desc: '精铁掉落 +20%/级' },
];

/* ================= 坊市 ================= */
const MARKET_ITEMS = [
  { id: 'zicao',    type: 'herb',  herb: 'zicao',    name: '紫灵草', base: 25,  sellable: true  },
  { id: 'qingyang', type: 'herb',  herb: 'qingyang', name: '青阳花', base: 100, sellable: true  },
  { id: 'longxian', type: 'herb',  herb: 'longxian', name: '龙涎果', base: 350, sellable: true  },
  { id: 'ore',      type: 'ore',   herb: null,       name: '精铁',   base: 50,  sellable: true  },
  { id: 'jq',       type: 'pill',  pill: 'jq',       name: '聚气丹', base: 120, sellable: false },
];

/* ================= 图鉴 ================= */
const CODEX_GROUPS = [
  { id: 'herbs',     name: '灵草',  items: HERBS.map(h => ({ id: h.id, name: h.name, rarity: h.rarity })) },
  { id: 'pills',     name: '丹药',  items: Object.keys(PILLS).map(k => ({ id: k, name: PILLS[k].name })) },
  { id: 'treasures', name: '法宝',  items: Object.keys(TREASURES).map(k => ({ id: k, name: TREASURES[k].name })) },
  { id: 'pets',      name: '灵宠',  items: PET_SPECIES.map((p, i) => ({ id: 'pet' + i, name: p.name, rarity: p.rarity })) },
  { id: 'dungeons',  name: '秘境',  items: DUNGEONS.map((d, i) => ({ id: 'dun' + i, name: d.name })) },
  { id: 'methods',   name: '功法',  items: METHODS.map(m => ({ id: m.id, name: m.name })) },
  { id: 'spirits',   name: '器灵',  items: [
    { id: 'sword',   name: '灵剑 · 剑魂', rarity: '凡品' },
    { id: 'armor',   name: '玄甲 · 器灵', rarity: '中品' },
    { id: 'pendant', name: '灵佩 · 元灵', rarity: '上品' },
  ] },
];
const CODEX_REWARD = 10000;

/* ================= 玩法速览（新手引导） ================= */
const GUIDE = [
  { icon: '修', name: '修炼突破', unlock: '开局', desc: '打坐或挂机积攒修为，进度条满后尝试突破境界。境界越高，修炼与灵石收益越大。' },
  { icon: '功', name: '功法秘典', unlock: '开局', desc: '参悟功法提升修炼 / 灵石 / 突破加成，等级越高效用越强。' },
  { icon: '灵', name: '灵根与体质', unlock: '开局', desc: '轮回转世可洗练灵根与体质，品阶越高修炼倍率越强。' },
  { icon: '丹', name: '炼丹炼药', unlock: '种下灵草后', desc: '灵田种药 → 按配方炼丹（聚气 / 破障 / 洗髓…）。炼丹师等级越高越省药、越易出多枚，支持一键连炼。' },
  { icon: '器', name: '炼器与器灵', unlock: '法宝淬炼 3 阶', desc: '用精铁淬炼法宝，可洗练、重铸提品阶。淬炼至 3 阶觉醒器灵：剑魂加战力、玄甲器灵加突破率、元灵加灵石产出。' },
  { icon: '宠', name: '灵宠繁育', unlock: '捕捉灵宠后', desc: '驯服灵宠提升修为。为灵宠寻得伴侣后可繁育后代，遗传父母更高资质，或概率变异。' },
  { icon: '宗', name: '宗门与季赛', unlock: '经过历练后', desc: '加入宗门得加成，捐贡献、升科技、习宗门技能。驻地季赛周期驻守积累战功，赛季结算领丰厚奖励。' },
  { icon: '秘', name: '秘境云游', unlock: '分境界解锁', desc: '消耗精力挑战秘境、云游历练，获得灵石、灵草、精铁乃至法宝。' },
  { icon: '塔', name: '镇妖塔与妖王', unlock: '战力达标', desc: '逐层挑战镇妖塔、讨伐妖王，检验战力并领取称号与奖励。' },
  { icon: '缘', name: '道侣双修', unlock: '度过仙缘后', desc: '与道侣双修快速获得修为、平息心魔，情缘越深加成越高。' },
  { icon: '轮', name: '轮回与符文', unlock: '轮回开放后', desc: '轮回转世获得传承点与符文，跨周目保留强化，是核心成长引擎。' },
  { icon: '阵', name: '符箓·阵法·弟子', unlock: '随境界解锁', desc: '符箓提供临时增益；阵法增幅修炼 / 战力；收徒培养弟子提供辅助，共享宗门声望。' },
  { icon: '坊', name: '坊市与拍卖', unlock: '经营开放', desc: '坊市每日随机折扣交易；拍卖行定期刷新，低价囤货、高价出手。' },
  { icon: '仙', name: '仙界飞升', unlock: '渡过天劫', desc: '飞升仙界开启全新境界（天仙→仙帝）、仙器、仙宠、仙术、仙府、仙界塔与跨服榜。' },
  { icon: '历', name: '成就·每日·图鉴', unlock: '全程', desc: '完成成就、每日任务、收集图鉴可获得目标与丰厚奖励；冒险奇遇随机触发，选择影响结果。' },
];

/* ================= 战斗历练 ================= */
const TOWER_MAX = 60;
const TOWER_TITLES = { 10: '镇妖使', 20: '伏魔真君', 30: '荡魔仙尊', 45: '镇妖之祖', 60: '镇天降龙' };
const BOSS_BASE_HP = 3000;
const BOSS_CD = 30; // 妖王挑战冷却（秒）

/* ================= 更高境界（仙界） ================= */
const XIAN_REALMS = [
  { name: '天仙',     desc: '羽化登仙，重开道果',     req: 500000 },
  { name: '真仙',     desc: '道行精纯，万法随心',     req: 1500000 },
  { name: '金仙',     desc: '金刚不坏，历经万劫',     req: 5000000 },
  { name: '太乙金仙', desc: '道果凝结，逍遥无羁',     req: 12000000 },
  { name: '大罗金仙', desc: '跳出三界，不在五行',     req: 30000000 },
  { name: '准圣',     desc: '参悟造化，半步成圣',     req: 75000000 },
  { name: '仙君',     desc: '统御一方，言出法随',     req: 180000000 },
  { name: '仙帝',     desc: '威震诸天，万仙来朝',     req: 450000000 },
  { name: '仙尊',     desc: '道之高者，岁月长存',     req: 1200000000 },
  { name: '不朽',     desc: '与道同存，寿与天齐',     req: 3000000000 },
];

/* ================= 仙器（仙界专属法宝） ================= */
const XIAN_CAPTURE_LOCK = '飞升仙界后方可寻访仙兽';
const XIAN_TREASURES = [
  { id: 'sword',   name: '诛仙剑', slot: '攻', key: 'combat', per: 0.20, xian: 2,  base: 400, desc: '战力 +20%/阶', max: 10 },
  { id: 'armor',   name: '玄元甲', slot: '御', key: 'chance', per: 0.02, xian: 1,  base: 600, desc: '突破成功率 +2%/阶', max: 10 },
  { id: 'pendant', name: '入道佩', slot: '辅', key: 'cult',   per: 0.12, xian: 3,  base: 800, desc: '修炼速度 +12%/阶', max: 10 },
];
const XIAN_PET_SPECIES = [
  { name: '青龙', cult: 0.05, combat: 60,  weight: 30, desc: '木德润苍生，灵气盎然' },
  { name: '白虎', cult: 0.03, combat: 110, weight: 25, desc: '金煞主杀伐，所向披靡' },
  { name: '朱雀', cult: 0.08, combat: 45,  weight: 25, desc: '离火焚天，涅槃再生' },
  { name: '玄武', cult: 0.06, combat: 50,  weight: 20, desc: '玄水镇北，稳若磐石' },
];
const XIAN_PET_CAPTURE = 300; // 寻兽消耗（仙晶）
const XIAN_PET_FEED = 20;     // 喂养基础消耗（仙晶）
const XIAN_PET_MAX_LEVEL = 30;
const XIAN_PET_MAX = 4;       // 仙兽谷容量
const XIAN_MASTERY_CULT = 0.05;   // 每件仙器满阶：修为 +5%（仙器之威）
const XIAN_MASTERY_COMBAT = 0.08; // 每件仙器满阶：战力 +8%
const XIAN_CRYSTAL_RATE = 3500;   // 仙晶坊兑换：1 仙晶 = 3500 灵石
const XIAN_CRYSTAL_BUY_STEP = 10; // 仙晶坊每次兑换数量

/* ================= 仙法道藏（仙晶解锁的成长树） ================= */
const XIAN_ARTS = [
  { id: 'wuji',    name: '无极道藏', desc: '参悟无极之妙，修炼 +15%',              cult: 0.15,              cost: 2500,  xian: 1 },
  { id: 'taiyi',   name: '太乙仙诀', desc: '道法精微，战力 +15%',                  combat: 0.15,            cost: 4000,  xian: 2 },
  { id: 'sancai',  name: '三才仙阵', desc: '天地人三才相济，修炼 +10%、战力 +8%',    cult: 0.10, combat: 0.08, cost: 7000,  xian: 4 },
  { id: 'jie',     name: '劫引仙术', desc: '引动天劫淬炼，突破成功率 +5%',          chance: 0.05,            cost: 9000,  xian: 6 },
  { id: 'hunyuan', name: '混元一气', desc: '混元一气贯体，修炼 +12%、战力 +10%',     cult: 0.12, combat: 0.10, cost: 15000, xian: 8 },
];

/* ================= 仙缘图鉴 / 称号（收藏型终极目标） ================= */
const XIAN_CODEX_CULT = 0.10;   // 称号：修炼 +10%
const XIAN_CODEX_COMBAT = 0.15; // 称号：战力 +15%
const XIAN_TITLE = {
  name: '· 混元仙主 ·',
  desc: '集齐四象仙兽，并使三件仙器臻至大圆满，可获此混元无双之号',
};

/* ================= 仙界试炼（精力挑战） ================= */
const XIAN_TRIAL_ENERGY = 5;      // 每次消耗精力
const XIAN_TRIAL_MAX_DAILY = 6;   // 每日试炼次数上限
const XIAN_TRIAL_CRYSTAL = 40;    // 胜者基础仙晶
const XIAN_TRIAL_CRYSTAL_LOSE = 8;// 败者安慰仙晶
const XIAN_TRIAL_SOUL = 1;        // 胜者基础精魄

/* ================= 精魄 / 高阶仙器 / 仙兽进化（高阶获取途径） ================= */
const XIAN_SOUL_RATE = 800;       // 仙晶坊：1 精魄 = 800 仙晶
const XIAN_SHEN_MAX = 3;          // 仙器神铸上限（仙品阶）
const XIAN_SHEN_SOUL = 2;         // 神铸基础精魄消耗
const XIAN_SHEN_XIAN = 5000;      // 神铸基础仙晶消耗
const XIAN_SHEN_POWER = 0.35;     // 每阶神铸：该仙器效果 +35%
const XIAN_EVOLVE_XIAN = 1500;    // 血脉觉醒仙晶消耗
const XIAN_EVOLVE_SOUL = 3;       // 血脉觉醒精魄消耗
const XIAN_EVOLVE_MAX = 50;       // 觉醒后仙兽等级上限
const XIAN_EVOLVE_MULT = 1.5;     // 觉醒后该仙兽加成 ×1.5
const XIAN_CHAOS = { name: '混沌', cult: 0.20, combat: 220, desc: '鸿蒙未判，吞噬万灵，乃四象之上古神兽' };
const XIAN_CHAOS_XIAN = 30000;    // 神兽契约仙晶
const XIAN_CHAOS_SOUL = 15;       // 神兽契约精魄

/* ================= 仙器套装（组合加成） ================= */
const XIAN_SETS = [
  { id: 'gs', name: '攻守兼备', members: ['sword', 'armor'],        minShen: 1, fx: { combat: 0.12, chance: 0.02 }, desc: '诛仙剑 + 玄元甲 · 战力 +12%、突破 +2%' },
  { id: 'yd', name: '御道双修', members: ['armor', 'pendant'],      minShen: 1, fx: { cult: 0.10, chance: 0.02 }, desc: '玄元甲 + 入道佩 · 修炼 +10%、突破 +2%' },
  { id: 'jd', name: '剑道通玄', members: ['sword', 'pendant'],      minShen: 1, fx: { cult: 0.08, combat: 0.10 }, desc: '诛仙剑 + 入道佩 · 修炼 +8%、战力 +10%' },
  { id: 'zm', name: '诛仙灭世', members: ['sword', 'armor', 'pendant'], minShen: 2, fx: { cult: 0.20, combat: 0.25, chance: 0.05 }, desc: '三器齐集并神铸 2 阶 · 修炼 +20%、战力 +25%、突破 +5%' },
];

/* ================= 飞升仙府（仙界洞天 · 挂机产出） ================= */
const XIAN_MANOR_MAX = 10;        // 仙府等级上限
const XIAN_MANOR_BASE = 30;       // 每级每小时基础仙晶产出
const XIAN_MANOR_COST = 2000;     // 仙府基础建造/升级成本（仙晶）
const XIAN_MANOR_GROW = 1.8;      // 仙府成本成长
const XIAN_MANOR_SOUL_PER = 60000;// 仙府每累积产出 6 万仙晶 → 1 精魄

/* ================= 仙兽试炼场（每日 · 出战赢取精魄） ================= */
const XIAN_PET_TRIAL_ENERGY = 10; // 每次试炼消耗精力
const XIAN_PET_TRIAL_CD = 120;    // 每只仙兽出战冷却（秒）
const XIAN_PET_TRIAL_DAILY = 8;   // 每日出战上限
const XIAN_PET_TRIAL_CRYSTAL = 200; // 胜利基础仙晶
const XIAN_PET_TRIAL_SOUL = 1;    // 胜利基础精魄

/* ================= 修仙排行榜（战力 / 境界 / 收藏） ================= */
const RANK_RIVALS = [
  { name: '玄霄上人', power: 150000, realm: 92, collect: 46 },
  { name: '青鸾仙子', power: 126000, realm: 84, collect: 55 },
  { name: '金鹏老祖', power: 98000,  realm: 76, collect: 38 },
  { name: '白泽道人', power: 76000,  realm: 68, collect: 42 },
  { name: '赤狐妖尊', power: 58000,  realm: 61, collect: 33 },
  { name: '沧海散仙', power: 42000,  realm: 54, collect: 29 },
  { name: '无尘真人', power: 30000,  realm: 46, collect: 36 },
  { name: '风月剑客', power: 20000,  realm: 39, collect: 24 },
  { name: '南山隐者', power: 12000,  realm: 31, collect: 20 },
];
const RANK_GROW = 0.10;   // 榜单群雄每 30 天成长 10%（随时间缓慢变强）
const RANK_TITLES = [
  { min: 0,  name: '籍籍无名', desc: '修真之路，方兴未艾', cult: 0.00, combat: 0.00 },
  { min: 7,  name: '崭露头角', desc: '小有所成，渐入佳境', cult: 0.01, combat: 0.00 },
  { min: 5,  name: '名动一方', desc: '声名鹊起，威震同侪', cult: 0.02, combat: 0.01 },
  { min: 3,  name: '位列仙班', desc: '风头正盛，名动仙域', cult: 0.03, combat: 0.02 },
  { min: 2,  name: '天骄无双', desc: '傲视群雄，天资卓绝', cult: 0.04, combat: 0.03 },
  { min: 1,  name: '魁首·冠绝诸天', desc: '万仙之首，唯我独尊', cult: 0.06, combat: 0.05 },
];
const RANK_REWARD_DATE = 'rankClaimDate'; // 排行榜每日嘉奖日期标记

/* ================= 镇界塔（仙界专属战斗副本 · 爬塔） ================= */
const XIAN_TOWER_MAX = 30;      // 塔层上限
const XIAN_TOWER_ENERGY = 5;    // 每次挑战消耗精力
const XIAN_TOWER_TITLES = { 5: '镇界使者', 10: '荡界真君', 15: '界尊', 20: '界主', 25: '界皇', 30: '镇界之主' };

/* ================= 仙侣双修（结缘 · 情缘成长） ================= */
const XIAN_SPOUSES = [
  { id: 'xiaren',   name: '弦月仙子', cult: 0.15, xian: 8000,  soul: 2,  desc: '月华倾泻，修炼 +15%' },
  { id: 'yanling',  name: '炎灵圣女', cult: 0.22, xian: 20000, soul: 6,  desc: '炎灵入体，修炼 +22%' },
  { id: 'xuanyuan', name: '玄元帝君', cult: 0.30, xian: 60000, soul: 15, desc: '帝君坐镇，修炼 +30%' },
];
const XIAN_DUAL_CD = 600;       // 双修冷却（秒）
const XIAN_DUAL_ENERGY = 5;     // 双修消耗精力
const XIAN_DUAL_CULT = 0.35;    // 双修获得当前境界所需修为的 35%
const XIAN_DUAL_DEMON = -8;     // 双修平息心魔
const XIAN_BOND_MAX = 10;       // 情缘上限（每重情缘：道侣加成 +8%）

/* ================= 宗门技能 & 贡献兑换 ================= */
const SECT_SKILLS = [
  { id: 'ling', name: '聚灵阵', desc: '修炼速度 +8%',       cost: 800,  fx: { cult: 0.08 } },
  { id: 'cang', name: '藏经阁', desc: '灵石产出 +8%',       cost: 800,  fx: { stones: 0.08 } },
  { id: 'dan',  name: '炼丹房', desc: '每次炼制丹药 +1 枚',  cost: 1000, fx: { craft: 1 } },
  { id: 'lian', name: '炼器阁', desc: '每次淬炼精铁消耗 -1', cost: 1000, fx: { forge: 1 } },
];
const SECT_EXCHANGES = [
  { id: 'ore', name: '精铁 x5',        cost: 200, desc: '兑换 5 份精铁' },
  { id: 'dp',  name: '1 悟道点',       cost: 600, desc: '兑换 1 点悟道点' },
  { id: 'pz',  name: '破障丹 x1',      cost: 120, desc: '兑换 1 枚破障丹' },
];

/* ================= 道侣 / 灵根进阶 ================= */
const SPAUSES = [
  { name: '灵溪仙子', desc: '清冷出尘，双修得益',  cult: 0.10, weight: 45 },
  { name: '酒剑侠客', desc: '洒脱不羁，双修益增',  cult: 0.12, weight: 35 },
  { name: '无衣魔女', desc: '亦正亦邪，双修益厚',  cult: 0.15, weight: 20 },
];
const SPOUSE_COST = 2000;
const SPOUSE_CD = 90; // 双修冷却（秒）

/* ================= 传承道统（轮回功业 · 永久留存） ================= */
const LEGACY_RUNES = [
  { id: 'linghui', name: '灵慧道纹', desc: '永久 · 修炼速度 +3%',         cost: 1, fx: { cult: 0.03 } },
  { id: 'fuyuan',  name: '福缘道纹', desc: '永久 · 灵石产出 +3%',         cost: 1, fx: { stones: 0.03 } },
  { id: 'wupo',    name: '悟破道纹', desc: '永久 · 突破成功率 +2%',       cost: 2, fx: { chance: 0.02 } },
  { id: 'zhanda',  name: '战修道纹', desc: '永久 · 战力 +5%',             cost: 2, fx: { combat: 0.05 } },
  { id: 'tiguan',  name: '体贯道纹', desc: '永久 · 洞府产出 +10%',        cost: 3, fx: { dwell: 0.10 } },
  { id: 'danyun',  name: '丹韵道纹', desc: '永久 · 炼丹产量 +1 枚',       cost: 3, fx: { craft: 1 } },
  { id: 'yejin',   name: '冶金道纹', desc: '永久 · 淬炼精铁消耗 -1',      cost: 3, fx: { forge: 1 } },
  { id: 'weizhen', name: '威震道纹', desc: '永久 · 讨伐妖王战利 +10%',    cost: 4, fx: { pvp: 0.10 } },
  { id: 'liuhuo',  name: '流火道纹', desc: '永久 · 全属性 +2%',           cost: 4, fx: { all: 0.02 } },
  { id: 'tianming', name: '天命道纹', desc: '永久 · 修炼速度 +8%',        cost: 8, fx: { cult: 0.08 } },
];

/* ================= 宗门职位晋升 ================= */
const SECT_POSITIONS = [
  { name: '外门弟子', realm: 0,  cost: 0,     cult: 0.00, stones: 0.00, combat: 0.00, desc: '初入宗门，洒扫听令' },
  { name: '内门弟子', realm: 1,  cost: 500,   cult: 0.05, stones: 0.00, combat: 0.03, desc: '根骨尚可，小有所成' },
  { name: '核心弟子', realm: 3,  cost: 2000,  cult: 0.10, stones: 0.05, combat: 0.06, desc: '宗门栋梁，得授真传' },
  { name: '真传弟子', realm: 5,  cost: 6000,  cult: 0.15, stones: 0.08, combat: 0.10, desc: '亲传衣钵，代掌门户' },
  { name: '执事',     xian: 1,   cost: 15000, cult: 0.20, stones: 0.12, combat: 0.15, desc: '执掌庶务，调度门人' },
  { name: '护法',     xian: 2,   cost: 35000, cult: 0.25, stones: 0.15, combat: 0.20, desc: '护佑宗门，威震四方' },
  { name: '峰主',     xian: 3,   cost: 70000, cult: 0.30, stones: 0.20, combat: 0.26, desc: '镇守一峰，独当一面' },
  { name: '掌门',     xian: 5,   cost: 150000, cult: 0.40, stones: 0.25, combat: 0.35, desc: '执掌宗门，一言兴法' },
];

/* ================= 拍卖行 ================= */
const AUCTION_CYCLE = 300; // 每 5 分钟刷新一批
const AUCTION_POOL = [
  { key: 'sword',   name: '灵剑',      type: 'treasure', price: 1200 },
  { key: 'armor',   name: '玄甲',      type: 'treasure', price: 1600 },
  { key: 'pendant', name: '灵佩',      type: 'treasure', price: 1000 },
  { key: 'ore',     name: '精铁 x12',   type: 'ore',      price: 900 },
  { key: 'pz',      name: '破障丹 x2',  type: 'pz',       price: 1100 },
  { key: 'wudao',   name: '悟道丹 x1',  type: 'wudao',    price: 2500 },
];

/* ================= 法宝洗练 / 重铸 ================= */
const WASH_COST_STONE = 300; // 洗练：灵石
const WASH_COST_ORE  = 3;    // 洗练：精铁
const REFORGE_MULT    = 1.9; // 重铸价格成长
const REFORGE_QUALITY = 0.06;// 每品阶全属性 +6%

function rollRoot() {
  return weightedPick(SPIRIT_ROOTS);
}

function rollPhysique() {
  return weightedPick(PHYSIQUES);
}

function weightedPick(list) {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= list[i].weight;
    if (r <= 0) return i;
  }
  return list.length - 1;
}

/* ================= 状态 ================= */
let state = null;
let loadAt = Date.now();

function defaultState() {
  return {
    _v: SAVE_VERSION,
    realm: 0,
    cultivation: 0,
    spiritStones: 20,
    heartDemon: 0,
    methodLevel: 1,
    pills: { jq: 1, pz: 0, as: 0, ningshen: 0, xidi: 0, wudao: 0, dutian: 0 },
    breakthroughCount: 0,
    lifetimeCultivation: 0,
    lifetimeStones: 0,
    nextEventAt: 0,
    lastTick: Date.now(),
    ascended: false,
    achievementsUnlocked: [],
    rootId: 0,
    physiqueId: 0,
    dwelling: 1,
    treasures: { sword: 0, armor: 0, pendant: 0 },
    reincarnations: 0,
    signInDate: '',
    signInStreak: 0,
    questDate: '',
    questBaseline: null,
    claimedQuests: [],
    pet: null,
    petMate: null,       // 灵宠繁育 · 伴侣灵宠
    petBreedAt: 0,       // 灵宠繁育冷却截止时间戳
    sectId: null,
    sectContribution: 0,
    sectTech: 0,
    sectPosition: 0,
    legacyPoints: 0,
    legacyRunes: [],
    auction: { list: [], until: 0 },
    energy: ENERGY_MAX,
    energyMax: ENERGY_MAX,
    herbs: { zicao: 0, qingyang: 0, longxian: 0 },
    fields: [{ herbId: null, plantedAt: 0 }, { herbId: null, plantedAt: 0 }],
    ores: 0,
    forge: { sword: { tier: 0, affixes: [], quality: 0 }, armor: { tier: 0, affixes: [], quality: 0 }, pendant: { tier: 0, affixes: [], quality: 0 } },
    spirits: { sword: 0, armor: 0, pendant: 0 }, // 法宝器灵觉醒等级
    tribulationShield: 0,
    tribDone: 0,         // 渡劫强化 · 已渡雷劫波数
    travelCooldowns: {},
    methodId: 'tianyan',
    unlockedMethods: ['tianyan'],
    divinePoints: 0,
    divine: {},
    marketDate: '',
    marketDeals: {},
    codex: {},
    codexRewarded: false,
    towerFloor: 1,
    bossHp: null,
    bossAt: 0,
    xianStage: 0,
    sectSkills: [],
    spouse: null,
    spouseAt: 0,
    stats: { breakthroughs: 0, fails: 0, pillsUsed: 0, events: 0, meditations: 0, captures: 0, trials: 0, donates: 0, harvests: 0, crafts: 0, travels: 0, forges: 0, tribulations: 0, tower: 0, bossKills: 0, dual: 0, breeds: 0, spirits: 0, defends: 0 },
    alchemy: { level: 1, xp: 0 },  // 丹道熟练度：炼丹师等级与悟性
    bodyRealm: 0,
    bodyCult: 0,
    talismans: { juling: 0, pozhen: 0, huti: 0, jucai: 0 },
    talismanBuffs: { juling: 0, pozhen: 0, huti: 0, jucai: 0 },
    formations: { jyj: 0, xjz: 0, jcz: 0, tyz: 0 },
    disciples: [],
    sectPrestige: 0,
    tourneyAt: 0,
    seasonScore: 0,      // 宗门驻地季赛 · 本赛季战功积分
    seasonDefendAt: 0,   // 驻地防御冷却
    seasonClaimed: '',   // 已领取奖励的赛季标识
    xianCrystal: 0,
    xianTreasures: {},
    xianPets: [],
    xianArts: {},
    xianTrialDate: '',
    xianTrialCount: 0,
    xianSoul: 0,
    xianShen: {},
    xianManor: 0,
    xianManorAcc: 0,
    xianPetTrialDate: '',
    xianPetTrialCount: 0,
    xianTowerFloor: 1,
    xianSpouse: null,
    xianBond: 0,
    xianDualAt: 0,
    rankClaimDate: '',
  };
}

/* ================= 数值计算 ================= */
function reqCultivation() {
  if ((state.xianStage || 0) > 0) {
    const x = XIAN_REALMS[state.xianStage - 1];
    return x ? x.req : Infinity;
  }
  return REALMS[state.realm].req;
}

function sectSkillFactor(key) {
  let sum = 0;
  for (const id of (state.sectSkills || [])) {
    const sk = SECT_SKILLS.find(x => x.id === id);
    if (sk && sk.fx[key]) sum += sk.fx[key];
  }
  return sum;
}
function sectCraftBonus() { return Math.floor(sectSkillFactor('craft')); }
function sectForgeBonus() { return Math.floor(sectSkillFactor('forge')); }

function spouseCultFactor() {
  return state.spouse == null ? 1 : 1 + SPAUSES[state.spouse].cult;
}

function cultRate() {
  const base = (state.xianStage || 0) > 0 ? 200 + (state.xianStage - 1) * 400 : 3 + state.realm * 3;
  const method = 1 + methodCultBonus();
  const demon = Math.max(0, 1 - state.heartDemon / 100);
  const bonus = 1 + state.breakthroughCount * 0.05;
  const root = SPIRIT_ROOTS[state.rootId].cult;
  const dwelling = 1 + (state.dwelling - 1) * 0.1 + legacyDwell();
  const sword = 1 + state.treasures.sword * 0.1;
  const reinc = 1 + state.reincarnations * 0.1;
  const pet = petFactor();
  const sect = sectCultFactor();
  const forge = forgeTotal('cult');
  const divine = 1 + divineBonus('cult');
  const spouseF = spouseCultFactor();
  const skill = 1 + sectSkillFactor('cult');
  const legacy = 1 + legacyCult();
  const pos = 1 + sectPositionBonus().cult;
  const tal = 1 + talismanFactor('cult');
  const form = 1 + formationFactor('cult');
  const pres = 1 + sectPrestigeFactor('cult');
  const disc = 1 + discipleCultBonus();
  const xianT = 1 + xianTreasureFactor('cult');
  const xianPet = 1 + xianPetCultBonus();
  const xianM = 1 + xianTreasureMastery() * XIAN_MASTERY_CULT;
  const xianArt = 1 + xianArtFactor('cult');
  const xianCodex = 1 + xianCodexAbil() * XIAN_CODEX_CULT;
  const xianSet = 1 + xianSetFactor('cult');
  const xianSpouse = xianSpouseFactor();
  const rank = 1 + rankTitleBonus('cult');
  return base * method * demon * bonus * root * dwelling * sword * reinc * pet * sect * forge * divine * spouseF * skill * legacy * pos * tal * form * pres * disc * xianT * xianPet * xianM * xianArt * xianCodex * xianSet * xianSpouse * rank;
}

function stoneRate() {
  const base = (0.8 + state.realm * 0.4) * (1 + methodStoneBonus());
  const physique = PHYSIQUES[state.physiqueId].stones;
  const pendant = 1 + state.treasures.pendant * 0.1;
  const dwelling = 1 + (state.dwelling - 1) * 0.1;
  const sect = sectStoneFactor();
  const forge = forgeTotal('stones');
  const divine = 1 + divineBonus('stones');
  const skill = 1 + sectSkillFactor('stones');
  const legacy = 1 + legacyStone();
  const pos = 1 + sectPositionBonus().stones;
  const tal = 1 + talismanFactor('stones');
  const form = 1 + formationFactor('stones');
  const pres = 1 + sectPrestigeFactor('stones');
  return base * physique * pendant * dwelling * sect * forge * divine * skill * legacy * pos * tal * form * pres * (1 + spiritLevel('pendant') * 0.08);
}

function breakthroughChance() {
  const pillBonus = state.pills.pz > 0 ? 0.15 : 0;
  const physique = PHYSIQUES[state.physiqueId].chance;
  const armor = state.treasures.armor * 0.02;
  const reinc = state.reincarnations * 0.05;
  const sect = sectChanceBonus();
  const forge = forgeTotal('chance') - 1;
  const shield = (state.tribulationShield || 0) > 0 ? 0.10 : 0;
  const method = methodChanceBonus();
  const divine = divineBonus('chance');
  const tal = talismanFactor('chance');
  const form = formationFactor('chance');
  return Math.min(0.99, REALMS[state.realm].chance + pillBonus + physique + armor + reinc + sect + forge + shield + method + divine + legacyChance() + tal + form + bodyRealmChance() + xianTreasureFactor('chance') + xianArtFactor('chance') + xianSetFactor('chance') + spiritLevel('armor') * 0.02);
}

function methodCost() {
  return Math.floor(50 * Math.pow(state.methodLevel, 1.6));
}

/* ================= 功法秘典 ================= */
function currentMethod() {
  return METHODS.find(m => m.id === state.methodId) || METHODS[0];
}
function methodCultBonus() { return currentMethod().cult * (state.methodLevel - 1); }
function methodStoneBonus() { return currentMethod().stones * (state.methodLevel - 1); }
function methodChanceBonus() { return currentMethod().chance * (state.methodLevel - 1); }
function methodDemonMult() { return currentMethod().demon ? 0.5 : 1; } // 太清心经：心魔滋扰减半

function switchMethod(m) {
  if (state.methodId === m.id) return true;
  state.methodId = m.id;
  codexAdd('methods', m.id);
  log(`你改修【${m.name}】，新法更合道途，修行愈发顺畅！`, 'success');
  saveGame();
  return true;
}

function unlockMethod(m) {
  if (state.realm < m.unlockRealm) { toast('境界不足', 'danger'); return false; }
  if (state.unlockedMethods.includes(m.id)) return switchMethod(m);
  if (state.spiritStones < m.cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= m.cost;
  state.unlockedMethods.push(m.id);
  state.methodId = m.id;
  codexAdd('methods', m.id);
  log(`你觅得功法【${m.name}】并当即改修，道途焕然一新！`, 'success');
  saveGame();
  return true;
}

/* ================= 悟道神通 ================= */
function divineBonus(key) {
  let sum = 0;
  if (key === 'cult')   sum += 0.08 * (state.divine.cult || 0);
  if (key === 'stones') sum += 0.08 * (state.divine.stones || 0);
  if (key === 'chance') sum += 0.03 * (state.divine.chance || 0);
  if (key === 'travel') sum += 0.10 * (state.divine.travel || 0);
  if (key === 'ore')    sum += 0.20 * (state.divine.ore || 0);
  return sum;
}
function craftBonus() { return state.divine.craft || 0; } // 丹心：炼丹产量 +1 枚/级

function upgradeDivine(id) {
  const sk = DIVINE_SKILLS.find(x => x.id === id);
  if (!sk) return false;
  const lv = state.divine[id] || 0;
  if (lv >= sk.max) { toast('神通已至圆满', 'danger'); return false; }
  if ((state.divinePoints || 0) <= 0) { toast('悟道点不足', 'danger'); return false; }
  state.divinePoints--;
  state.divine[id] = lv + 1;
  log(`你道心通明，顿悟神通【${sk.name}】至第 ${lv + 1} 层！`, 'success');
  saveGame();
  return true;
}

/* ================= 坊市 ================= */
function ensureMarket() {
  const today = todayStr();
  if (state.marketDate === today) return;
  state.marketDate = today;
  const ids = MARKET_ITEMS.map(i => i.id);
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const deals = {};
  // 随机 2 件打折、1 件抬价
  for (const id of shuffled.slice(0, 2)) deals[id] = +(0.7 + Math.random() * 0.2).toFixed(2); // 7~9 折
  for (const id of shuffled.slice(2, 3)) deals[id] = +(1.1 + Math.random() * 0.2).toFixed(2); // 1.1~1.3
  state.marketDeals = deals;
}

function marketFactor(item) {
  const deals = state.marketDeals || {};
  return deals[item.id] || 1;
}
function marketBuyPrice(item) { return Math.floor(item.base * marketFactor(item)); }
function marketSellPrice(item) { return Math.floor(item.base * 0.55 * marketFactor(item)); }
function marketStock(item) {
  if (item.type === 'herb')  return state.herbs[item.herb] || 0;
  if (item.type === 'ore')   return state.ores || 0;
  if (item.type === 'pill')  return state.pills[item.pill] || 0;
  return 0;
}

function marketBuy(item) {
  const price = marketBuyPrice(item);
  if (state.spiritStones < price) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= price;
  if (item.type === 'herb') state.herbs[item.herb] = (state.herbs[item.herb] || 0) + 1;
  else if (item.type === 'ore') state.ores = (state.ores || 0) + 1;
  else if (item.type === 'pill') state.pills[item.pill] = Math.min(PILLS[item.pill].max, state.pills[item.pill] + 1);
  log(`你在坊市购得 1 份【${item.name}】，花费 ${fmtInt(price)} 灵石`, '');
  saveGame();
  return true;
}

function marketSell(item) {
  if (!item.sellable) return false;
  if (marketStock(item) <= 0) { toast('没有可出售的', 'danger'); return false; }
  const price = marketSellPrice(item);
  if (item.type === 'herb') state.herbs[item.herb]--;
  else if (item.type === 'ore') state.ores--;
  else if (item.type === 'pill') state.pills[item.pill]--;
  state.spiritStones += price;
  state.lifetimeStones += price;
  log(`你在坊市售出 1 份【${item.name}】，得 ${fmtInt(price)} 灵石`, '');
  saveGame();
  return true;
}

/* ================= 图鉴 ================= */
function codexUnlocked(groupId, id) {
  return (state.codex[groupId] || []).includes(id);
}
function codexAdd(groupId, id) {
  if (!state.codex[groupId]) state.codex[groupId] = [];
  if (state.codex[groupId].includes(id)) return;
  state.codex[groupId].push(id);
  const g = CODEX_GROUPS.find(x => x.id === groupId);
  const item = g ? g.items.find(x => x.id === id) : null;
  log(`图鉴点亮：【${g ? g.name : ''} · ${item ? item.name : ''}】`, '');
  checkCodexReward();
}
function codexProgress() {
  let got = 0, total = 0;
  for (const g of CODEX_GROUPS) {
    for (const it of g.items) {
      total++;
      if (codexUnlocked(g.id, it.id)) got++;
    }
  }
  return { got, total };
}
function checkCodexReward() {
  const p = codexProgress();
  if (p.got >= p.total && !state.codexRewarded) {
    state.codexRewarded = true;
    state.spiritStones += CODEX_REWARD;
    state.lifetimeStones += CODEX_REWARD;
    const extra = [];
    if (state.pills.wudao < PILLS.wudao.max) { state.pills.wudao++; extra.push('悟道丹 ×1'); }
    if (state.pills.dutian < PILLS.dutian.max) { state.pills.dutian++; extra.push('渡劫丹 ×1'); }
    if (xianUnlocked()) { state.xianSoul = (state.xianSoul || 0) + 1; extra.push('精魄 ×1'); }
    const extraTxt = extra.length ? `，并获${extra.join('、')}` : '';
    log(`图鉴集齐！你遍览仙途万象，福缘天降 +${fmtInt(CODEX_REWARD)} 灵石${extraTxt}！`, 'important');
    toast(`图鉴集齐 · +10000 灵石${extra.length ? ' +额外福缘' : ''}`, '');
    saveGame();
  }
}

/* ================= 动作 ================= */
function meditate() {
  state.stats.meditations++;
  const cult = 20 + state.realm * 15;
  const stones = 8 + state.realm * 12;
  state.cultivation += cult;
  state.spiritStones += stones;
  state.lifetimeCultivation += cult;
  state.lifetimeStones += stones;
  if (state.heartDemon > 0) state.heartDemon = Math.max(0, state.heartDemon - 2);
  log(`你静心打坐，修为 +${fmt(cult)}，灵石 +${fmt(stones)}`, 'success');
  return true;
}

const TRIB_WAVES = 9; // 渡劫强化：须连渡九道天雷，方证仙途
function breakthrough() {
  const req = reqCultivation();
  if (state.cultivation < req) return false;

  const xian = (state.xianStage || 0) > 0;
  const trib = !xian && state.realm >= 2; // 凡界金丹期及以上引动天劫，飞升仙界后无天劫
  let chance = xian ? 0.85 : REALMS[state.realm].chance;
  let msg = '';
  let shielded = false;
  if (trib && (state.tribulationShield || 0) > 0) {
    state.tribulationShield--;
    chance += 0.10;
    shielded = true;
    msg += '（天劫护体，成功率提升）';
  }
  if (state.pills.pz > 0) {
    state.pills.pz--;
    state.stats.pillsUsed++;
    chance += 0.15;
    msg += '（服用破障丹，成功率提升）';
  }
  chance = Math.min(0.99, chance + spiritLevel('armor') * 0.02); // 玄甲器灵：突破成功

  if (Math.random() < chance) {
    state.stats.breakthroughs++;
    if ((state.talismanBuffs && state.talismanBuffs.pozhen > 0)) state.talismanBuffs.pozhen--;
    if (trib) state.stats.tribulations = (state.stats.tribulations || 0) + 1;
    if (!xian && state.realm === REALMS.length - 1) {
      // 渡劫期突破：须连渡九道天雷，方证仙途
      state.tribDone = (state.tribDone || 0) + 1;
      if (state.tribDone >= TRIB_WAVES) {
        state.ascended = true;
        state.xianStage = 1;
        state.cultivation = 0;
        log('九重天劫尽数渡过，你白日飞升，登临仙界【天仙】！自此仙路再续，道无止境。', 'success');
        showAscend();
      } else {
        log(`你力抗天劫，渡过第 ${state.tribDone} / ${TRIB_WAVES} 道天雷，道心愈坚！`, 'important');
        state.heartDemon = Math.max(0, (state.heartDemon || 0) - 3);
        toast(`已渡天劫 ${state.tribDone}/${TRIB_WAVES}`, '');
      }
    } else if (xian) {
      if (state.xianStage >= XIAN_REALMS.length) {
        state.cultivation = 0;
        log('你已臻至【不朽】，与道同存，寿与天齐！', 'important');
      } else {
        state.xianStage++;
        state.breakthroughCount++;
        state.cultivation = 0;
        state.divinePoints = (state.divinePoints || 0) + 1;
        state.xianCrystal = (state.xianCrystal || 0) + 8 + state.xianStage * 6;
        const bonus = 1000 + state.xianStage * 500;
        state.spiritStones += bonus;
        state.lifetimeStones += bonus;
        log(`仙功再进！你突破至【${XIAN_REALMS[state.xianStage - 1].name}】${msg}，祥瑞天降 +${fmt(bonus)} 灵石、仙晶 +${8 + state.xianStage * 6}`, 'success');
      }
    } else {
      state.realm++;
      state.breakthroughCount++;
      state.cultivation = 0;
      state.divinePoints = (state.divinePoints || 0) + 1;
      const bonus = 100 + state.realm * 200;
      state.spiritStones += bonus;
      state.lifetimeStones += bonus;
      log(`突破成功！你踏入【${REALMS[state.realm].name}期】${msg}，祥瑞天降 +${fmt(bonus)} 灵石`, 'success');
    }
  } else {
    // 天劫反噬：玄甲等级与破障词条、天劫护体可减免
    const armorMit = Math.min(0.4, state.treasures.armor * 0.02 + (forgeTotal('chance') - 1) * 0.5);
    const mit = Math.min(0.8, armorMit + (shielded ? 0.5 : 0));
    state.cultivation *= (1 - 0.3 * (1 - mit));
    const demonGain = (6 + state.realm * 2) * (1 - mit);
    state.heartDemon = Math.min(100, state.heartDemon + demonGain);
    state.stats.fails++;
    if (trib) state.stats.tribulations = (state.stats.tribulations || 0) + 1;
    if (!xian && state.realm === REALMS.length - 1 && (state.tribDone || 0) > 0) {
      state.tribDone = 0; // 天劫倾颓，已渡雷劫尽归虚无，须从头再渡
    }
    log(`突破失败！${trib ? '天劫劈落，' : '灵气紊乱反噬，'}修为折损 ${Math.round(30 * (1 - mit))}%，心魔 +${Math.round(demonGain)}${msg}`, 'danger');
    shakePanel();
  }
  saveGame();
  return true;
}

function buyPill(type) {
  const pill = PILLS[type];
  if (!pill) return false;
  const cost = Math.floor(pill.cost(state.realm) * pillPriceFactor());
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  if (state.pills[type] >= pill.max) { toast(`${pill.name} 已至上限`, 'danger'); return false; }
  state.spiritStones -= cost;
  state.pills[type]++;
  codexAdd('pills', type);
  log(`花费 ${fmt(cost)} 灵石购得 ${pill.name}`, '');
  saveGame();
  return true;
}

function usePill(type) {
  if (state.pills[type] <= 0) { toast('没有该丹药', 'danger'); return false; }
  if (type === 'jq') {
    state.cultivation += reqCultivation() * 0.4 * pillEffectFactor();
    state.pills.jq--;
    state.stats.pillsUsed++;
    log('服用聚气丹，修为大增！', 'success');
  } else if (type === 'as') {
    state.heartDemon = Math.max(0, state.heartDemon - 30);
    state.pills.as--;
    state.stats.pillsUsed++;
    log('服用安神丹，心魔平息。', 'success');
  } else if (type === 'ningshen') {
    state.heartDemon = Math.max(0, Math.floor(state.heartDemon / 2));
    state.pills.ningshen--;
    state.stats.pillsUsed++;
    log('服用凝神丹，心魔骤减！', 'success');
  } else if (type === 'xidi') {
    const old = SPIRIT_ROOTS[state.rootId].name;
    state.rootId = rollRoot();
    state.pills.xidi--;
    state.stats.pillsUsed++;
    log(`服用洗髓丹，灵根由【${old}】洗练为【${SPIRIT_ROOTS[state.rootId].name}】！`, 'important');
  } else if (type === 'wudao') {
    state.cultivation += reqCultivation() * 0.6 * pillEffectFactor();
    state.pills.wudao--;
    state.stats.pillsUsed++;
    log('服用悟道丹，道韵灌顶，修为暴涨！', 'success');
  } else if (type === 'dutian') {
    state.pills.dutian--;
    state.stats.pillsUsed++;
    state.tribulationShield = (state.tribulationShield || 0) + 3;
    log('服用渡劫丹，天劫护体加身（3 次突破内有效）！', 'important');
  }
  saveGame();
  return true;
}

function upgradeMethod() {
  const cost = methodCost();
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  state.methodLevel++;
  log(`功法参悟至第 ${state.methodLevel} 层，修炼速度提升！`, 'success');
  saveGame();
  return true;
}

function dwellingCost() {
  return Math.floor(120 * Math.pow(state.dwelling, 1.7));
}

function upgradeDwelling() {
  if (state.dwelling >= DWELLING_MAX) { toast('洞府已至仙宫极致', 'danger'); return false; }
  const cost = dwellingCost();
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  state.dwelling++;
  log(`扩建洞府至第 ${state.dwelling} 层，灵气愈发浓郁！`, 'success');
  saveGame();
  return true;
}

function treasureCost(slot) {
  return Math.floor(150 * Math.pow(state.treasures[slot] + 1, 1.6));
}

function treasureBonusText(slot) {
  const lv = state.treasures[slot];
  if (slot === 'sword') return lv > 0 ? `+${lv * 10}% 修为` : '未拥有';
  if (slot === 'armor') return lv > 0 ? `+${lv * 2}% 突破` : '未拥有';
  if (slot === 'pendant') return lv > 0 ? `+${lv * 10}% 灵石` : '未拥有';
  return '';
}

function upgradeTreasure(slot) {
  const t = TREASURES[slot];
  const lv = state.treasures[slot];
  if (lv >= t.max) { toast(`${t.name}已至极限`, 'danger'); return false; }
  const cost = treasureCost(slot);
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  state.treasures[slot]++;
  codexAdd('treasures', slot);
  log(`${t.name}祭炼至 +${state.treasures[slot]} 阶！`, 'success');
  saveGame();
  return true;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function signIn() {
  const t = todayStr();
  if (state.signInDate === t) { toast('今日已签到', 'danger'); return false; }
  state.signInStreak = (state.signInDate === yesterdayStr()) ? state.signInStreak + 1 : 1;
  state.signInDate = t;
  const base = 50 + state.realm * 50;
  const reward = Math.floor(base * (1 + (state.signInStreak - 1) * 0.1));
  state.spiritStones += reward;
  state.lifetimeStones += reward;
  log(`每日签到：连续 ${state.signInStreak} 天，获 ${fmtInt(reward)} 灵石！`, 'success');
  toast(`签到成功 +${fmtInt(reward)} 灵石`, '');
  saveGame();
  return true;
}

function reincarnate() {
  if (!state.ascended) return false;
  state.reincarnations++;
  state.divinePoints = (state.divinePoints || 0) + 3;
  state.legacyPoints = (state.legacyPoints || 0) + legacyReincGain();
  state.realm = 0;
  state.cultivation = 0;
  state.spiritStones = 60;
  state.heartDemon = 0;
  state.methodLevel = 1;
  state.pills = { jq: 1, pz: 0, as: 0, ningshen: 0, xidi: 0, wudao: 0, dutian: 0 };
  state.breakthroughCount = 0;
  state.dwelling = 1;
  state.treasures = { sword: 0, armor: 0, pendant: 0 };
  state.forge = { sword: { tier: 0, affixes: [] }, armor: { tier: 0, affixes: [] }, pendant: { tier: 0, affixes: [] } };
  state.spirits = { sword: 0, armor: 0, pendant: 0 };
  state.fields = [{ herbId: null, plantedAt: 0 }, { herbId: null, plantedAt: 0 }];
  state.tribulationShield = 0;
  state.tribDone = 0;
  state.ascended = false;
  state.xianStage = 0;
  state.towerFloor = 1;
  state.bossHp = null;
  state.bossAt = 0;
  state.spouse = null;
  state.spouseAt = 0;
  state.sectSkills = [];
  state.sectPosition = 0;
  state.rootId = rollRoot();
  state.physiqueId = rollPhysique();
  state.pet = null;
  state.petMate = null;
  state.petBreedAt = 0;
  state.sectId = null;
  state.sectContribution = 0;
  state.sectTech = 0;
  state.energy = state.energyMax;
  const root = SPIRIT_ROOTS[state.rootId].name;
  const phys = PHYSIQUES[state.physiqueId].name;
  log(`轮回转世，重入凡尘！此世灵根【${root}】、体质【${phys}】，轮回加成 +${state.reincarnations * 10}% 修为、+${state.reincarnations * 5}% 突破`, 'important');
  hideReincButton();
  saveGame();
  return true;
}

/* ================= 每日任务 ================= */
function ensureDaily() {
  const t = todayStr();
  if (state.questDate !== t) {
    state.questDate = t;
    state.claimedQuests = [];
    state.questBaseline = {
      meditations: state.stats.meditations,
      breakthroughs: state.stats.breakthroughs,
      pillsUsed: state.stats.pillsUsed,
      events: state.stats.events,
      crafts: state.stats.crafts,
      travels: state.stats.travels,
      lifetimeStones: state.lifetimeStones,
      defends: state.stats.defends || 0,
      spirits: state.stats.spirits || 0,
      breeds: state.stats.breeds || 0,
    };
  }
}

function questProgress(q) {
  ensureDaily();
  const base = state.questBaseline ? (state.questBaseline[q.stat] || 0) : 0;
  const cur = q.stat === 'lifetimeStones' ? state.lifetimeStones : state.stats[q.stat];
  return clamp(cur - base, 0, q.target);
}

// 每日任务灵石奖励随境界成长，避免后期沦为可有可无的蚊子腿
function questStoneMult() {
  return 1 + state.realm * 0.5 + (state.xianStage || 0) * 8;
}

function questClaimed(q) {
  return (state.claimedQuests || []).includes(q.id);
}

function claimQuest(id) {
  ensureDaily();
  const q = DAILY_QUESTS.find(x => x.id === id);
  if (!q || questClaimed(q)) return false;
  if (questProgress(q) < q.target) { toast('任务尚未完成', 'danger'); return false; }
  state.claimedQuests.push(id);
  const parts = [];
  if (q.reward.stones) {
    const amt = Math.floor(q.reward.stones * questStoneMult());
    state.spiritStones += amt;
    state.lifetimeStones += amt;
    parts.push(`${fmtInt(amt)} 灵石`);
  }
  for (const k of ['jq', 'pz', 'as']) {
    if (q.reward[k]) {
      state.pills[k] = Math.min(PILLS[k].max, state.pills[k] + q.reward[k]);
      parts.push(`${PILLS[k].name} x${q.reward[k]}`);
    }
  }
  log(`完成任务「${q.name}」，获得 ${parts.join('、')}！`, 'success');
  toast('任务奖励已领取', '');
  saveGame();
  return true;
}

/* ================= 灵宠 ================= */
function petExpToNext() {
  if (!state.pet) return 0;
  return Math.floor(60 * Math.pow(state.pet.level, 1.5));
}

function petFeedCost() {
  if (!state.pet) return 0;
  return Math.floor(80 * Math.pow(state.pet.level, 1.3));
}

function petFactor() {
  if (!state.pet) return 1;
  const sp = PET_SPECIES[state.pet.speciesId];
  const talent = PET_TALENTS[state.pet.talent] || PET_TALENTS[0];
  const tier = petTier(state.pet.level);
  return 1 + state.pet.level * sp.bonus * talent.mult * tier.mult;
}

/* 生成一只新灵宠（随机资质） */
function createPet(speciesId) {
  return { speciesId, talent: weightedPick(PET_TALENTS), level: 1, exp: 0 };
}
function petTalent() {
  return PET_TALENTS[state.pet.talent] || PET_TALENTS[0];
}
function petTier(level) {
  let t = PET_TIERS[0];
  for (const x of PET_TIERS) if (level >= x.min) t = x;
  return t;
}
function petMaxLevel() {
  return petTalent().max;
}
function petLevelBonus() {
  const sp = PET_SPECIES[state.pet.speciesId];
  const talent = petTalent();
  const tier = petTier(state.pet.level);
  return state.pet.level * sp.bonus * talent.mult * tier.mult;
}

function capturePet() {
  if (state.pet) { toast('已拥有灵宠，可先放生再捕捉', 'danger'); return false; }
  if (state.spiritStones < PET_CAPTURE_COST) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= PET_CAPTURE_COST;
  const id = weightedPick(PET_SPECIES);
  state.pet = createPet(id);
  codexAdd('pets', 'pet' + id);
  state.stats.captures = (state.stats.captures || 0) + 1;
  const sp = PET_SPECIES[id];
  const talent = PET_TALENTS[state.pet.talent];
  log(`你驯服了一只【${sp.name}】（${sp.rarity} · ${talent.name}）！当前修为 +${Math.round(petLevelBonus() * 100)}%/级`, 'important');
  toast(`获得灵宠 · ${sp.name}（${talent.name}）！`, '');
  saveGame();
  return true;
}

function feedPet() {
  if (!state.pet) { toast('尚未拥有灵宠', 'danger'); return false; }
  if (state.pet.level >= petMaxLevel()) {
    toast(`${PET_SPECIES[state.pet.speciesId].name}已至资质极限，可放生重获新宠`, 'danger');
    return false;
  }
  const cost = petFeedCost();
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  state.pet.exp++;
  const need = petExpToNext();
  if (state.pet.exp >= need) {
    state.pet.exp -= need;
    const oldLv = state.pet.level;
    state.pet.level++;
    const oldTier = petTier(oldLv).name;
    const newTier = petTier(state.pet.level).name;
    const sp = PET_SPECIES[state.pet.speciesId];
    if (newTier !== oldTier) {
      log(`机缘降临！灵宠【${sp.name}】蜕变化形，进化为${newTier}，修为加成大幅跃升！`, 'important');
      toast(`灵宠进化为 ${newTier}！`, '');
    } else {
      log(`灵宠【${sp.name}】提升至 ${state.pet.level} 级，灵性大涨！`, 'success');
      toast(`灵宠升至 ${state.pet.level} 级！`, '');
    }
  } else {
    log(`喂养灵宠，成长 ${state.pet.exp}/${need}`, '');
  }
  saveGame();
  return true;
}

/* 放生当前灵宠，以便捕捉更优资质的新宠 */
function releasePet() {
  if (!state.pet) { toast('尚未拥有灵宠', 'danger'); return false; }
  const name = PET_SPECIES[state.pet.speciesId].name;
  state.pet = null;
  state.petMate = null;
  state.petBreedAt = 0;
  log(`你放生了【${name}】，任其归于山林，愿有机缘再觅良宠……`, '');
  toast('已放生灵宠', '');
  saveGame();
  return true;
}

/* ================= 灵宠繁育 · 血脉传承 ================= */
const PET_SEEK_COST = 300;     // 为灵宠寻一位同属伴侣的灵石
const PET_BREED_COST = 660;    // 繁育一次消耗的灵石
const PET_BREED_CD = 7200;     // 繁育冷却（秒）：2 小时
const PET_MUTATE_CHANCE = 0.28; // 后代资质变异（资质档 +1）概率

// 为当前灵宠觅一位同属伴侣（资质随机野生）
function seekPetMate() {
  if (!state.pet) { toast('尚未拥有灵宠', 'danger'); return false; }
  if (state.petMate) { toast('已有伴侣灵宠相伴', 'danger'); return false; }
  if (state.spiritStones < PET_SEEK_COST) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= PET_SEEK_COST;
  state.petMate = { speciesId: state.pet.speciesId, talent: weightedPick(PET_TALENTS), level: 1, exp: 0 };
  const sp = PET_SPECIES[state.petMate.speciesId];
  const t = PET_TALENTS[state.petMate.talent];
  log(`你为【${sp.name}】寻得一位同属伴侣（${t.name}），两情相悦，坐待繁育。`, 'success');
  toast('寻得伴侣灵宠', '');
  saveGame();
  return true;
}

// 繁育冷却剩余（秒）
function petBreedLeft() {
  return Math.max(0, ((state.petBreedAt || 0) - Date.now()) / 1000);
}

// 双亲繁育：后代继承更优资质，可能血脉变异（资质档 +1）
function breedPets() {
  if (!state.pet || !state.petMate) { toast('需先为灵宠寻得伴侣', 'danger'); return false; }
  if (petBreedLeft() > 0) { toast('血脉尚需调和，稍后再试', 'danger'); return false; }
  if (state.spiritStones < PET_BREED_COST) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= PET_BREED_COST;
  state.petBreedAt = Date.now() + PET_BREED_CD * 1000;
  const pIdx = state.pet.talent, mIdx = state.petMate.talent;
  let child = Math.max(pIdx, mIdx); // 继承父母更高资质
  if (Math.random() < PET_MUTATE_CHANCE && child < PET_TALENTS.length - 1) {
    child++; // 血脉变异，资质更进一步
  }
  const sp = PET_SPECIES[state.pet.speciesId];
  const parentName = sp.name;
  state.pet = { speciesId: state.pet.speciesId, talent: child, level: 1, exp: 0 };
  // 伴侣保留为另一亲本，可继续繁育传承
  const ct = PET_TALENTS[child];
  state.stats.breeds = (state.stats.breeds || 0) + 1;
  log(`【${parentName}】繁育出新一代灵宠，血脉传承至【${ct.name}】资质！`, 'important');
  toast(`新宠诞育 · ${ct.name}`, '');
  saveGame();
  return true;
}

/* ================= 宗门 ================= */
function sectInfo() {
  return state.sectId == null ? null : SECTS[state.sectId];
}

function sectTechCost() {
  return Math.floor(120 * Math.pow(state.sectTech + 1, 1.6));
}

function sectRankBonus() {
  const c = state.sectContribution;
  if (c >= 20000) return 0.5;
  if (c >= 8000) return 0.3;
  if (c >= 2000) return 0.2;
  if (c >= 500) return 0.1;
  return 0;
}

function sectRank() {
  const c = state.sectContribution;
  if (c >= 20000) return '太上长老';
  if (c >= 8000) return '真传弟子';
  if (c >= 2000) return '核心弟子';
  if (c >= 500) return '内门弟子';
  return '外门弟子';
}

function sectRankNext() {
  const c = state.sectContribution;
  if (c < 500) return { name: '内门弟子', need: 500 };
  if (c < 2000) return { name: '核心弟子', need: 2000 };
  if (c < 8000) return { name: '真传弟子', need: 8000 };
  if (c < 20000) return { name: '太上长老', need: 20000 };
  return null;
}

function sectCultFactor() {
  const s = sectInfo();
  if (!s) return 1;
  return 1 + (s.cultBonus || 0) + state.sectTech * 0.03 + sectRankBonus();
}

function sectStoneFactor() {
  const s = sectInfo();
  if (!s) return 1;
  return 1 + (s.stoneBonus || 0) + state.sectTech * 0.015 + sectRankBonus();
}

function sectChanceBonus() {
  const s = sectInfo();
  if (!s) return 0;
  return (s.chanceBonus || 0) + state.sectTech * 0.003;
}

function pillPriceFactor() {
  const s = sectInfo();
  if (!s || s.name !== '丹鼎宗') return 1;
  return 0.8;
}

function pillEffectFactor() {
  const s = sectInfo();
  if (!s || s.name !== '丹鼎宗') return 1;
  return 1.2;
}

function joinSect(id) {
  if (state.sectId != null) { toast('已有宗门', 'danger'); return false; }
  const s = SECTS[id];
  if (state.spiritStones < s.joinCost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= s.joinCost;
  state.sectId = id;
  state.sectContribution = 0;
  state.sectTech = 0;
  log(`你拜入【${s.name}】：${s.desc}`, 'important');
  toast(`加入 ${s.name}！`, '');
  saveGame();
  return true;
}

function donateSect(amount) {
  if (state.sectId == null) return false;
  const a = Math.max(1, Math.min(Math.floor(amount), state.spiritStones));
  if (a <= 0) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= a;
  const contrib = Math.floor(a / 10);
  state.sectContribution += contrib;
  state.stats.donates = (state.stats.donates || 0) + 1;
  log(`向宗门捐献 ${fmtInt(a)} 灵石，获 ${fmtInt(contrib)} 贡献`, 'success');
  saveGame();
  return true;
}

function upgradeSectTech() {
  if (state.sectId == null) return false;
  if (state.sectTech >= SECT_TECH_MAX) { toast('宗门功法已至大成', 'danger'); return false; }
  const cost = sectTechCost();
  if (state.sectContribution < cost) { toast('宗门贡献不足', 'danger'); return false; }
  state.sectContribution -= cost;
  state.sectTech++;
  log(`宗门功法参悟至第 ${state.sectTech} 层！`, 'success');
  saveGame();
  return true;
}

/* ================= 秘境试炼 ================= */
function challengeDungeon(id) {
  const d = DUNGEONS[id];
  if (state.realm < d.minRealm) { toast('境界不足', 'danger'); return false; }
  if (state.energy < d.energy) { toast('精力不足，稍候恢复', 'danger'); return false; }
  state.energy -= d.energy;
  state.stats.trials = (state.stats.trials || 0) + 1;
  codexAdd('dungeons', 'dun' + id);
  const parts = [];
  const stones = Math.floor(randRange(d.reward.stones[0], d.reward.stones[1]) * (1 + state.realm * 0.1));
  state.spiritStones += stones;
  state.lifetimeStones += stones;
  parts.push(`灵石 ${fmtInt(stones)}`);
  if (d.reward.pill && Math.random() < 0.6) {
    const pk = d.reward.pill;
    state.pills[pk] = Math.min(PILLS[pk].max, state.pills[pk] + 1);
    parts.push(`${PILLS[pk].name} x1`);
  }
  if (d.reward.treasure && Math.random() < 0.15 && state.treasures[d.reward.treasure] < TREASURES[d.reward.treasure].max) {
    state.treasures[d.reward.treasure]++;
    codexAdd('treasures', d.reward.treasure);
    parts.push(`法宝「${TREASURES[d.reward.treasure].name}」+1阶`);
  }
  const hadPet = !!state.pet;
  if (!hadPet && Math.random() < d.reward.petChance) {
    const pid = weightedPick(PET_SPECIES);
    state.pet = createPet(pid);
    codexAdd('pets', 'pet' + pid);

    const talent = PET_TALENTS[state.pet.talent];
    state.stats.captures = (state.stats.captures || 0) + 1;
    parts.push(`驯服灵宠「${PET_SPECIES[pid].name}」（${talent.name}）`);
  }
  if (hadPet && d.reward.petExp && Math.random() < 0.5) {
    state.pet.exp += 2;
    const need = petExpToNext();
    if (state.pet.exp >= need) {
      state.pet.exp -= need;
      state.pet.level++;
      parts.push(`灵宠升至 ${state.pet.level} 级`);
    }
  }
  log(`【${d.name}】探索归来，获得 ${parts.join('、')}！`, 'success');
  toast('秘境历练结束', '');
  saveGame();
  return true;
}

/* ================= 灵田 ================= */
function fieldUnlockCost(slot) {
  return FIELD_SLOT_COST[slot] || 0;
}

function herbById(id) {
  return HERBS.find(h => h.id === id);
}

function fieldReady(f) {
  const herb = herbById(f.herbId);
  return f.herbId != null && herb && (Date.now() - f.plantedAt) >= herb.grow * 1000;
}

function fieldGrowText(f) {
  if (f.herbId == null) return { pct: 0, ready: false };
  const herb = herbById(f.herbId);
  const pct = Math.min(100, (Date.now() - f.plantedAt) / 1000 / herb.grow * 100);
  return { pct, ready: pct >= 100 };
}

function plantHerb(slot, herbId) {
  const f = state.fields[slot];
  if (!f) return false;
  if (f.herbId != null) { toast('该灵田已有灵草', 'danger'); return false; }
  const herb = herbById(herbId);
  if (!herb) return false;
  if (state.spiritStones < herb.seedCost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= herb.seedCost;
  f.herbId = herbId;
  f.plantedAt = Date.now();
  log(`你在灵田种下一株【${herb.name}】，静待灵机孕育……`, '');
  saveGame();
  return true;
}

function harvestField(slot) {
  const f = state.fields[slot];
  if (!f || f.herbId == null) return false;
  const herb = herbById(f.herbId);
  if (!fieldReady(f)) { toast('灵草尚未成熟', 'danger'); return false; }
  const n = Math.floor(randRange(herb.yield[0], herb.yield[1] + 1));
  state.herbs[herb.id] = (state.herbs[herb.id] || 0) + n;
  codexAdd('herbs', herb.id);
  state.stats.harvests = (state.stats.harvests || 0) + 1;
  f.herbId = null;
  f.plantedAt = 0;
  log(`你收获 ${n} 株【${herb.name}】！`, 'success');
  saveGame();
  return true;
}

function unlockField() {
  const slot = state.fields.length;
  const cost = fieldUnlockCost(slot);
  if (!cost) return false;
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  state.fields.push({ herbId: null, plantedAt: 0 });
  log(`你开辟了新的灵田（第 ${state.fields.length} 格）！`, 'success');
  saveGame();
  return true;
}

/* ================= 炼丹 · 丹道熟练度 ================= */
const ALCHEMY_MAX_LEVEL = 99;                    // 炼丹师等级上限
function alchemyLevel() { return (state.alchemy && state.alchemy.level) || 1; }
function alchemyXp() { return Math.max(0, (state.alchemy && state.alchemy.xp) || 0); }
function alchemyXpNeed() { return Math.floor(60 * Math.pow(alchemyLevel(), 1.4)); }
// 省药：每 4 级，同炉丹药每味灵草耗量 -1（最低 1）
function alchemySave() { return Math.floor((alchemyLevel() - 1) / 4); }
// 熟能生巧：每级 +4% 概率出丹时额外产 1 枚
function alchemyExtraChance() { return (alchemyLevel() - 1) * 0.04; }
// 扣除省药后，单味灵草的实际需求
function alchemyHerbCost(n) { return Math.max(1, n - alchemySave()); }
// 方单当前所需的药材清单（省药后）
function alchemyRecipeCost(r) {
  const out = {};
  for (const h of Object.keys(r.herbs)) out[h] = alchemyHerbCost(r.herbs[h]);
  return out;
}
function herbName(id) { const h = HERBS.find(x => x.id === id); return h ? h.name : id; }
function alchemyCostText(r) {
  const cost = alchemyRecipeCost(r);
  return Object.keys(cost).map(h => `${cost[h]} ${herbName(h)}`).join(' + ');
}

function recipeCanMake(r) {
  const cost = alchemyRecipeCost(r);
  return Object.keys(cost).every(h => (state.herbs[h] || 0) >= cost[h]);
}

function craftPill(recipeId) {
  const r = RECIPES.find(x => x.id === recipeId);
  if (!r) return false;
  if (!recipeCanMake(r)) { toast('灵草不足', 'danger'); return false; }
  const cost = alchemyRecipeCost(r);
  for (const h of Object.keys(cost)) state.herbs[h] -= cost[h];
  const pill = PILLS[r.id];
  let n = 1 + craftBonus() + sectCraftBonus() + legacyCraft();
  if (state.pills[r.id] < pill.max && Math.random() < alchemyExtraChance()) n++; // 熟能生巧
  state.pills[r.id] = Math.min(pill.max, state.pills[r.id] + n);
  codexAdd('pills', r.id);
  state.stats.crafts = (state.stats.crafts || 0) + 1;
  log(`你于丹炉中炼成 ${n} 枚【${pill.name}】！`, 'success');
  toast(`炼成 ${pill.name}`, '');
  gainAlchemyExp(r);
  saveGame();
  return true;
}

// 炼制后获得丹道悟性，累计升级
function gainAlchemyExp(r) {
  if (!state.alchemy) state.alchemy = { level: 1, xp: 0 };
  state.alchemy.xp = (state.alchemy.xp || 0) + Math.round((r.lv || 1) * 30);
  let leveled = false;
  while (state.alchemy.level < ALCHEMY_MAX_LEVEL && state.alchemy.xp >= alchemyXpNeed()) {
    state.alchemy.xp -= alchemyXpNeed();
    state.alchemy.level++;
    leveled = true;
  }
  if (state.alchemy.xp > alchemyXpNeed()) state.alchemy.xp = alchemyXpNeed();
  if (leveled) {
    const save = alchemySave();
    log(`丹道精进！你晋升炼丹师 Lv.${state.alchemy.level}${save > 0 ? `，火候纯熟，每味灵草可省 ${save} 份。` : ''}`, 'important');
    toast(`炼丹师 · Lv.${state.alchemy.level}`, '');
  }
}

// 连炼：一次性炼制多炉同方丹药（灵草/容纳上限或次数用尽即止）
function craftPillBatch(recipeId, times) {
  const r = RECIPES.find(x => x.id === recipeId);
  if (!r) return 0;
  const pill = PILLS[r.id];
  if (!recipeCanMake(r)) { toast('灵草不足', 'danger'); return 0; }
  let done = 0;
  while (done < times) {
    if (state.pills[r.id] >= pill.max) break;          // 丹药已满，不再连炼
    if (!recipeCanMake(r)) break;                       // 灵草不足
    const cost = alchemyRecipeCost(r);
    for (const h of Object.keys(cost)) state.herbs[h] -= cost[h];
    let n = 1 + craftBonus() + sectCraftBonus() + legacyCraft();
    if (state.pills[r.id] < pill.max && Math.random() < alchemyExtraChance()) n++;
    const added = Math.min(pill.max - state.pills[r.id], n);
    state.pills[r.id] += added;
    state.stats.crafts = (state.stats.crafts || 0) + 1;
    codexAdd('pills', r.id);
    gainAlchemyExp(r);
    done++;
  }
  if (done > 0) {
    log(`你运火连烧，一日炼成 ${done} 炉【${pill.name}】！`, 'success');
    toast(`${pill.name} × ${done}`, '');
    saveGame();
  }
  return done;
}

/* ================= 炼器 ================= */
function forgeInfo(slot) {
  return state.forge[slot] || { tier: 0, affixes: [] };
}

function forgeOreCost(slot) {
  return Math.max(1, Math.floor(5 * Math.pow(forgeInfo(slot).tier + 1, 1.5)) - sectForgeBonus() - legacyForge());
}

function forgeStoneCost(slot) {
  return Math.floor(120 * Math.pow(forgeInfo(slot).tier + 1, 1.6));
}

function forgeAffixText(slot) {
  const affs = forgeInfo(slot).affixes || [];
  if (!affs.length) return '';
  return affs.map(id => { const a = AFFIXES.find(x => x.id === id); return a ? a.name : ''; }).join('、');
}

function forgeTotal(key) {
  let sum = 0;
  for (const slot of Object.keys(TREASURES)) {
    const affs = (state.forge[slot] || {}).affixes || [];
    for (const id of affs) {
      const a = AFFIXES.find(x => x.id === id);
      if (!a) continue;
      if (a.fx[key] != null) sum += a.fx[key];
      if (a.fx.all != null) sum += a.fx.all;
    }
    sum += forgeQualityBonus(slot); // 重铸品阶：全属性
  }
  return 1 + sum;
}

function forgeTreasure(slot) {
  const info = state.forge[slot];
  if (!info) return false;
  if (state.treasures[slot] <= 0) { toast('先祭炼该法宝', 'danger'); return false; }
  if (info.tier >= FORGE_MAX) { toast('法宝已至淬炼极限', 'danger'); return false; }
  const oc = forgeOreCost(slot), sc = forgeStoneCost(slot);
  if ((state.ores || 0) < oc) { toast('精铁不足', 'danger'); return false; }
  if (state.spiritStones < sc) { toast('灵石不足', 'danger'); return false; }
  state.ores -= oc;
  state.spiritStones -= sc;
  info.tier++;
  const aff = AFFIXES[Math.floor(Math.random() * AFFIXES.length)];
  info.affixes.push(aff.id);
  state.stats.forges = (state.stats.forges || 0) + 1;
  log(`你以精铁淬炼【${TREASURES[slot].name}】，法宝灵性大涨，铭刻词条「${aff.name}」！`, 'success');
  toast(`淬炼成功 · ${aff.name}`, '');
  saveGame();
  return true;
}

/* ================= 法宝器灵 · 觉醒 ================= */
const SPIRIT_MAX = 10;
const SPIRIT_AWAKEN_TIER = 3; // 法宝淬炼至此阶方可觉醒器灵
function spiritLevel(slot) { return state.spirits[slot] || 0; }
function spiritOreCost(lv) { return Math.floor((lv + 1) * 6); }
function spiritStoneCost(lv) { return Math.floor(150 * Math.pow(lv + 1, 1.5)); }
function spiritDesc(slot) {
  switch (slot) {
    case 'sword': return '觉醒器灵，战力 +12%/层';
    case 'armor': return '觉醒器灵，突破成功率 +2%/层';
    case 'pendant': return '觉醒器灵，灵石产出 +8%/层';
  }
  return '';
}
function awakenSpirit(slot) {
  const info = state.forge[slot];
  if (!info) return false;
  if (state.treasures[slot] <= 0 || info.tier < SPIRIT_AWAKEN_TIER) {
    toast(`器灵需该法宝淬炼至 ${SPIRIT_AWAKEN_TIER} 阶方可觉醒`, 'danger'); return false;
  }
  const lv = spiritLevel(slot);
  if (lv >= SPIRIT_MAX) { toast(`${TREASURES[slot].name}器灵已至圆满`, 'danger'); return false; }
  const ore = spiritOreCost(lv), stone = spiritStoneCost(lv);
  if ((state.ores || 0) < ore) { toast('精铁不足', 'danger'); return false; }
  if (state.spiritStones < stone) { toast('灵石不足', 'danger'); return false; }
  state.ores -= ore;
  state.spiritStones -= stone;
  state.spirits[slot] = lv + 1;
  state.stats.spirits = (state.stats.spirits || 0) + 1;
  if (lv === 0) { codexAdd('spirits', slot); log(`法宝【${TREASURES[slot].name}】器灵觉醒！${spiritDesc(slot)}`, 'important'); }
  else log(`【${TREASURES[slot].name}】器灵滋长至 ${lv + 1} 层，${spiritDesc(slot)}`, 'success');
  toast(lv === 0 ? '器灵觉醒！' : '器灵升级', '');
  saveGame();
  return true;
}

/* ================= 云游历练 ================= */
function travelCooldownLeft(m) {
  const t = state.travelCooldowns[m.id] || 0;
  return Math.max(0, (t - Date.now()) / 1000);
}

function travelMap(m) {
  if (state.realm < m.minRealm) { toast('境界不足', 'danger'); return false; }
  if (travelCooldownLeft(m) > 0) { toast('此地尚需休整', 'danger'); return false; }
  state.travelCooldowns[m.id] = Date.now() + m.cooldown * 1000;
  state.stats.travels = (state.stats.travels || 0) + 1;
  const parts = [];
  const stones = Math.floor(randRange(m.stones[0], m.stones[1]));
  state.spiritStones += stones;
  state.lifetimeStones += stones;
  parts.push(`灵石 ${fmtInt(stones)}`);
  for (const [hid, prob] of m.herbs) {
    if (Math.random() < prob) {
      const herb = herbById(hid);
      const n = Math.floor(randRange(1, 3));
      state.herbs[hid] = (state.herbs[hid] || 0) + n;
      parts.push(`${herb.name} x${n}`);
    }
  }
  const ore = Math.floor(randRange(0, 3) * m.ore);
  if (ore > 0) {
    state.ores = (state.ores || 0) + ore;
    parts.push(`精铁 x${ore}`);
  }
  if (m.treasure && Math.random() < 0.1 && state.treasures[m.treasure] < TREASURES[m.treasure].max) {
    state.treasures[m.treasure]++;
    codexAdd('treasures', m.treasure);
    parts.push(`法宝「${TREASURES[m.treasure].name}」+1阶`);
  }
  log(`【${m.name}】云游归来，获得 ${parts.join('、')}！`, 'success');
  toast('云游历练结束', '');
  saveGame();
  return true;
}

/* ================= 战斗历练 ================= */
function combatPower() {
  let base = 80 + state.realm * 90 + (state.xianStage || 0) * 1800;
  base += state.treasures.sword * 70;
  base += state.treasures.armor * 45;
  base += state.treasures.pendant * 35;
  if (state.pet) base += 30 + state.pet.level * 22;
  base += xianPetCombat(); // 仙兽战力
  const sectC = 1 + (state.sectTech || 0) * 0.04 + sectRankBonus() + sectSkillFactor('cult') + sectPositionBonus().combat;
  const forge = forgeTotal('cult');
  const divine = 1 + divineBonus('cult');
  const legacy = 1 + legacyCombat();
  base += discipleCombatBonus();
  const body = 1 + (state.bodyRealm || 0) * 0.12;
  const tal = 1 + talismanFactor('combat');
  const form = 1 + formationFactor('combat');
  const pres = 1 + sectPrestigeFactor('combat');
  const xianT = 1 + xianTreasureFactor('combat');
  const xianM = 1 + xianTreasureMastery() * XIAN_MASTERY_COMBAT;
  const xianArt = 1 + xianArtFactor('combat');
  const xianCodex = 1 + xianCodexAbil() * XIAN_CODEX_COMBAT;
  const xianSet = 1 + xianSetFactor('combat');
  const rank = 1 + rankTitleBonus('combat');
  return Math.floor(base * 1 * sectC * forge * divine * legacy * body * tal * form * pres * xianT * xianM * xianArt * xianCodex * xianSet * rank * (1 + spiritLevel('sword') * 0.12));
}

function towerTitle(floor) {
  let t = '无名散修';
  for (const k of Object.keys(TOWER_TITLES)) {
    if (floor >= +k) t = TOWER_TITLES[k];
  }
  return t;
}

/* ================= 仙器 & 仙宠（仙界专属） ================= */
function xianUnlocked() { return (state.xianStage || 0) > 0; }

function xianTreasureFactor(key) {
  let sum = 0;
  for (const t of XIAN_TREASURES) {
    if (t.key !== key) continue;
    const shen = state.xianShen && state.xianShen[t.id] ? state.xianShen[t.id] : 0;
    sum += (state.xianTreasures[t.id] || 0) * t.per * (1 + shen * XIAN_SHEN_POWER);
  }
  return sum;
}
function xianTreasureCost(t) {
  const lv = state.xianTreasures[t.id] || 0;
  return Math.floor(t.base * Math.pow(1.7, lv));
}
function xianTreasureMastery() {
  let n = 0;
  for (const t of XIAN_TREASURES) if ((state.xianTreasures[t.id] || 0) >= t.max) n++;
  return n;
}
function buyXianCrystal() {
  if (!xianUnlocked()) { toast('飞升仙界后方可兑换仙晶', 'danger'); return false; }
  const need = XIAN_CRYSTAL_RATE * XIAN_CRYSTAL_BUY_STEP;
  if ((state.spiritStones || 0) < need) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= need;
  state.xianCrystal = (state.xianCrystal || 0) + XIAN_CRYSTAL_BUY_STEP;
  log(`以 ${fmt(need)} 灵石兑得 ${XIAN_CRYSTAL_BUY_STEP} 仙晶。`, 'success');
  saveGame(); return true;
}
function forgeXianTreasure(id) {
  const t = XIAN_TREASURES.find(x => x.id === id); if (!t) return false;
  if (!xianUnlocked()) { toast('飞升仙界后方可锻造仙器', 'danger'); return false; }
  if ((state.xianStage || 0) < t.xian) { toast(`需【${XIAN_REALMS[t.xian - 1].name}】方可锻造`, 'danger'); return false; }
  const lv = state.xianTreasures[id] || 0;
  if (lv >= t.max) { toast('仙器已至大圆满', 'danger'); return false; }
  const cost = xianTreasureCost(t);
  if ((state.xianCrystal || 0) < cost) { toast('仙晶不足', 'danger'); return false; }
  state.xianCrystal -= cost;
  state.xianTreasures[id] = lv + 1;
  log(`仙火淬炼，${t.name}升至 ${lv + 1}/${t.max} 阶！`, 'success');
  saveGame(); return true;
}

function xianPetCultBonus() {
  let sum = 0;
  for (const p of (state.xianPets || [])) {
    if (p.chaos) { sum += XIAN_CHAOS.cult * (p.level || 1); continue; }
    const sp = XIAN_PET_SPECIES[p.species];
    if (!sp) continue;
    let v = sp.cult * (p.level || 1);
    if (p.evolved) v *= XIAN_EVOLVE_MULT;
    sum += v;
  }
  return sum;
}
function xianPetCombat() {
  let sum = 0;
  for (const p of (state.xianPets || [])) {
    if (p.chaos) { sum += XIAN_CHAOS.combat * (p.level || 1); continue; }
    const sp = XIAN_PET_SPECIES[p.species];
    if (!sp) continue;
    let v = sp.combat * (p.level || 1);
    if (p.evolved) v *= XIAN_EVOLVE_MULT;
    sum += v;
  }
  return Math.floor(sum);
}
function xianPetMaxLevel(p) { return p.chaos ? 1 : (p.evolved ? XIAN_EVOLVE_MAX : XIAN_PET_MAX_LEVEL); }
function xianPetFeedCost(p) { return XIAN_PET_FEED * (p.level || 1); }
function seekXianPet() {
  if (!xianUnlocked()) { toast(XIAN_CAPTURE_LOCK, 'danger'); return false; }
  if ((state.xianPets || []).length >= XIAN_PET_MAX) { toast('仙兽谷已满，需先放归一只', 'danger'); return false; }
  if ((state.xianCrystal || 0) < XIAN_PET_CAPTURE) { toast('仙晶不足', 'danger'); return false; }
  state.xianCrystal -= XIAN_PET_CAPTURE;
  const idx = weightedPick(XIAN_PET_SPECIES);
  const sp = XIAN_PET_SPECIES[idx];
  state.xianPets.push({ species: idx, level: 1 });
  log(`仙光乍现，你寻得仙兽【${sp.name}】！再添一段仙缘。`, 'success');
  saveGame(); return true;
}
function feedXianPet(i) {
  const p = (state.xianPets || [])[i]; if (!p) return false;
  if (p.chaos) { toast('混沌乃上古神兽，无需滋养', 'danger'); return false; }
  const sp = XIAN_PET_SPECIES[p.species];
  if (!sp) { toast('仙兽血脉有异，无法滋养', 'danger'); return false; }
  if (!xianUnlocked()) { toast(XIAN_CAPTURE_LOCK, 'danger'); return false; }
  const maxLv = xianPetMaxLevel(p);
  if ((p.level || 1) >= maxLv) { toast(p.evolved ? '仙兽血脉已臻圆满' : '仙兽已至巅峰', 'danger'); return false; }
  const cost = xianPetFeedCost(p);
  if ((state.xianCrystal || 0) < cost) { toast('仙晶不足', 'danger'); return false; }
  state.xianCrystal -= cost;
  p.level++;
  log(`你以仙晶滋养【${sp.name}】，升至 ${p.level} 级`, 'success');
  saveGame(); return true;
}
function releaseXianPet(i) {
  const p = (state.xianPets || [])[i]; if (!p) return false;
  if (p.chaos) { toast('混沌乃上古神兽，羁绊已定，不可放归', 'danger'); return false; }
  const sp = XIAN_PET_SPECIES[p.species];
  const lv = p.level || 1;
  const invested = XIAN_PET_FEED * (lv - 1) * lv / 2; // 累计投入
  const refund = Math.floor(invested * 0.4);
  state.xianCrystal = (state.xianCrystal || 0) + refund;
  state.xianPets.splice(i, 1);
  const label = sp ? sp.name : '灵兽';
  log(refund > 0
    ? `你放归【${label}】回归山林，天地回还 ${refund} 仙晶。`
    : `你放归【${label}】回归山林，仙缘暂止。`, 'info');
  saveGame(); return true;
}

/* ================= 高阶飞升途径（精魄 / 神铸 / 血脉觉醒 / 混沌神兽） ================= */
function xianSoulBuyCost() { return XIAN_SOUL_RATE; }
// 仙晶坊 · 精魄兑换：消耗仙晶提炼精魄，精魄乃神铸与众兽觉醒之基
function buyXianSoul() {
  if (!xianUnlocked()) { toast('飞升仙界后方可炼制精魄', 'danger'); return false; }
  if ((state.xianCrystal || 0) < XIAN_SOUL_RATE) { toast('仙晶不足', 'danger'); return false; }
  state.xianCrystal -= XIAN_SOUL_RATE;
  state.xianSoul = (state.xianSoul || 0) + 1;
  log(`你于仙晶坊凝练一缕精魄，魂力愈深。`, 'success');
  saveGame(); return true;
}
function shenForgeCost(id) {
  const lv = state.xianShen && state.xianShen[id] ? state.xianShen[id] : 0;
  return { xian: XIAN_SHEN_XIAN * (lv + 1), soul: XIAN_SHEN_SOUL * (lv + 1) };
}
// 仙器神铸：仅大圆满仙器可升华仙品，威能骤增
function shenForgeArtifact(id) {
  const t = XIAN_TREASURES.find(x => x.id === id); if (!t) return false;
  if (!xianUnlocked()) { toast('飞升仙界后方可神铸仙器', 'danger'); return false; }
  if ((state.xianTreasures[id] || 0) < t.max) { toast('需先锻造至大圆满方可神铸', 'danger'); return false; }
  const cur = state.xianShen && state.xianShen[id] ? state.xianShen[id] : 0;
  if (cur >= XIAN_SHEN_MAX) { toast('此仙器已臻仙品极致', 'danger'); return false; }
  const c = shenForgeCost(id);
  if ((state.xianSoul || 0) < c.soul) { toast('精魄不足，请于仙晶坊凝练', 'danger'); return false; }
  if ((state.xianCrystal || 0) < c.xian) { toast('仙晶不足', 'danger'); return false; }
  state.xianSoul -= c.soul;
  state.xianCrystal -= c.xian;
  state.xianShen[id] = cur + 1;
  log(`仙火焚魂，【${t.name}】神铸至仙品 ${cur + 1} 阶，威能 +${Math.round(XIAN_SHEN_POWER * 100 * (cur + 1))}%！`, 'success');
  saveGame(); return true;
}
// 血脉觉醒：仙兽养至巅峰后以精魄觉醒，突破天堑
function evolveXianPet(i) {
  const p = (state.xianPets || [])[i]; if (!p) return false;
  if (p.chaos) { toast('混沌本就是上古血脉，无需觉醒', 'danger'); return false; }
  if (p.evolved) { toast('此仙兽血脉已然觉醒', 'danger'); return false; }
  if ((p.level || 1) < XIAN_PET_MAX_LEVEL) { toast('仙兽需养至巅峰方可觉醒血脉', 'danger'); return false; }
  if ((state.xianSoul || 0) < XIAN_EVOLVE_SOUL) { toast('精魄不足', 'danger'); return false; }
  if ((state.xianCrystal || 0) < XIAN_EVOLVE_XIAN) { toast('仙晶不足', 'danger'); return false; }
  state.xianSoul -= XIAN_EVOLVE_SOUL;
  state.xianCrystal -= XIAN_EVOLVE_XIAN;
  p.evolved = true;
  log(`天雷淬魂，【${XIAN_PET_SPECIES[p.species].name}】血脉觉醒，可再登更高之境，加成 ×${XIAN_EVOLVE_MULT} ！`, 'success');
  saveGame(); return true;
}
function chaosOwned() { return (state.xianPets || []).some(p => p.chaos); }
// 神兽契约 · 混沌：集至强之力，号令鸿蒙
function summonChaos() {
  if (!xianUnlocked()) { toast('飞升仙界后方可契约上古神兽', 'danger'); return false; }
  if (chaosOwned()) { toast('混沌已与你羁绊深固', 'danger'); return false; }
  if ((state.xianPets || []).length >= XIAN_PET_MAX) { toast('仙兽谷已满，需先腾出位置', 'danger'); return false; }
  if ((state.xianSoul || 0) < XIAN_CHAOS_SOUL) { toast('精魄不足（需 ' + XIAN_CHAOS_SOUL + '）', 'danger'); return false; }
  if ((state.xianCrystal || 0) < XIAN_CHAOS_XIAN) { toast('仙晶不足', 'danger'); return false; }
  state.xianSoul -= XIAN_CHAOS_SOUL;
  state.xianCrystal -= XIAN_CHAOS_XIAN;
  state.xianPets.push({ chaos: true, level: 1 });
  log(`天地异象，鸿蒙初醒，上古神兽【${XIAN_CHAOS.name}】应你号令而降！修炼 +20%、战力 +220。`, 'success');
  saveGame(); return true;
}

/* ================= 仙器套装 ================= */
function xianSetActive(id) {
  const s = XIAN_SETS.find(x => x.id === id); if (!s) return false;
  for (const m of s.members) {
    const shen = state.xianShen && state.xianShen[m] ? state.xianShen[m] : 0;
    if (shen < s.minShen) return false;
  }
  return true;
}
function xianSetFactor(key) {
  let sum = 0;
  for (const s of XIAN_SETS) if (xianSetActive(s.id) && s.fx[key]) sum += s.fx[key];
  return sum;
}

/* ================= 飞升仙府（挂机产出） ================= */
function xianManorRate() { return (state.xianManor || 0) * XIAN_MANOR_BASE; }          // 每小时仙晶
function xianManorRateSec() { return xianManorRate() / 3600; }                          // 每秒仙晶
function xianManorCost() { return Math.floor(XIAN_MANOR_COST * Math.pow(XIAN_MANOR_GROW, state.xianManor || 0)); }
function buildXianManor() {
  if (!xianUnlocked()) { toast('飞升仙界后方可开辟仙府', 'danger'); return false; }
  if ((state.xianManor || 0) >= XIAN_MANOR_MAX) { toast('仙府已臻极致', 'danger'); return false; }
  const cost = xianManorCost();
  if ((state.xianCrystal || 0) < cost) { toast('仙晶不足', 'danger'); return false; }
  state.xianCrystal -= cost;
  state.xianManor = (state.xianManor || 0) + 1;
  log(`仙云缭绕，你开辟仙府第 ${state.xianManor} 层，灵气汇聚，仙晶渐涌！`, 'success');
  saveGame(); return true;
}

/* ================= 仙兽试炼场（每日出战） ================= */
function xianPetTrialDaily() {
  if (state.xianPetTrialDate !== todayKey()) { state.xianPetTrialDate = todayKey(); state.xianPetTrialCount = 0; }
  return state.xianPetTrialCount;
}
function xianPetPower(p) {
  if (p.chaos) return XIAN_CHAOS.combat * (p.level || 1);
  const sp = XIAN_PET_SPECIES[p.species];
  if (!sp) return 0;
  let v = sp.combat * (p.level || 1);
  if (p.evolved) v *= XIAN_EVOLVE_MULT;
  return Math.floor(v);
}
function xianPetTrialLeft(i) {
  const p = (state.xianPets || [])[i]; if (!p) return 0;
  const until = (p.trialAt || 0) + XIAN_PET_TRIAL_CD * 1000;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}
function xianPetTrial(i) {
  const p = (state.xianPets || [])[i]; if (!p) return false;
  xianPetTrialDaily();
  if (!xianUnlocked()) { toast('飞升仙界后方可出战试炼', 'danger'); return false; }
  if (state.xianPetTrialCount >= XIAN_PET_TRIAL_DAILY) { toast('今日试炼次数已尽，待明日再来', 'danger'); return false; }
  if ((state.energy || 0) < XIAN_PET_TRIAL_ENERGY) { toast('精力不足，稍候恢复', 'danger'); return false; }
  if (xianPetTrialLeft(i) > 0) { toast('仙兽尚在休整', 'danger'); return false; }
  state.energy -= XIAN_PET_TRIAL_ENERGY;
  state.xianPetTrialCount++;
  p.trialAt = Date.now();
  const sp = p.chaos ? XIAN_CHAOS : XIAN_PET_SPECIES[p.species];
  const power = xianPetPower(p);
  const stage = state.xianStage || 1;
  // 敌手强度随仙兽实力与仙境成长，略低于仙兽自身战力，保证可胜
  const target = Math.floor(power * (0.9 + 0.05 * Math.random()) * (1 + 0.03 * stage));
  const win = power >= target;
  if (win) {
    const soul = XIAN_PET_TRIAL_SOUL + Math.floor((p.level || 1) / 15);
    const crystal = XIAN_PET_TRIAL_CRYSTAL + (p.level || 1) * 15 + stage * 20;
    state.xianSoul = (state.xianSoul || 0) + soul;
    state.xianCrystal = (state.xianCrystal || 0) + crystal;
    log(`仙兽试炼大捷！【${sp.name}】力克群妖，斩获 ${crystal} 仙晶、${soul} 精魄。`, 'success');
  } else {
    state.xianCrystal = (state.xianCrystal || 0) + 60;
    log(`仙兽试炼惜败，【${sp.name}】负伤而返，仅得 60 仙晶聊作安勉。`, 'danger');
  }
  saveGame(); return true;
}

/* ================= 修仙排行榜 ================= */
function rankTimeFactor() { return 1 + RANK_GROW * (Date.now() - loadAt) / (30 * 24 * 3600 * 1000); }
function rankBoard(key, playerVal) {
  const rows = RANK_RIVALS.map(r => ({ name: r.name, val: r[key] * rankTimeFactor(), me: false }));
  rows.push({ name: '你', val: playerVal, me: true });
  rows.sort((a, b) => b.val - a.val);
  return rows;
}
function rankPlayerPos(key, playerVal) {
  const rows = rankBoard(key, playerVal);
  return rows.findIndex(r => r.me) + 1;
}
function xianRealmScore() {
  return (state.xianStage || 0) * 10 + state.realm;
}
function xianCollectScore() {
  let c = 0;
  c += (state.xianPets || []).length * 2;                 // 每只仙兽 +2
  c += Object.keys(state.xianArts || {}).length * 4;      // 每门道藏 +4
  c += (state.xianShen && Object.keys(state.xianShen).length) * 6; // 每次神铸 +6
  c += (state.legacyRunes || []).length * 3;              // 每道传承 +3
  c += (state.achievementsUnlocked || []).length * 1;     // 每项成就 +1
  return c;
}

/* ================= 排行榜奖励（称号加成 · 每日嘉奖） ================= */
let _rankTitleCache = null;
let _rankTitleAt = 0;
let _rankTitleBusy = false; // 递归守卫：combatPower → rankTitleBonus → rankTitle → rankBestPos → combatPower 死循环
function rankBestPos() {
  return Math.min(
    rankPlayerPos('power', combatPower(true)),
    rankPlayerPos('realm', xianRealmScore()),
    rankPlayerPos('collect', xianCollectScore())
  );
}
function rankTitle() {
  const now = Date.now();
  if (_rankTitleCache && now - _rankTitleAt < 3000) return _rankTitleCache;
  // 正在计算时被 combatPower 反向调用：直接按无称号加成处理，避免无限递归
  if (_rankTitleBusy) return RANK_TITLES[0];
  _rankTitleBusy = true;
  try {
    const best = rankBestPos();
    let t = RANK_TITLES[0];
    // 取满足 best <= min 的最优称号（min 越小越尊）
    for (const x of RANK_TITLES) if (best <= x.min) t = x;
    _rankTitleCache = t;
    _rankTitleAt = now;
    return t;
  } finally {
    _rankTitleBusy = false;
  }
}
function rankTitleBonus(key) {
  const t = rankTitle();
  return t && t[key] ? t[key] : 0;
}
function rankClaimReward() {
  const best = rankBestPos();
  if (best <= 1) return { cry: 2000, soul: 2 };
  if (best <= 2) return { cry: 1200, soul: 1 };
  if (best <= 3) return { cry: 800,  soul: 1 };
  if (best <= 5) return { cry: 400,  soul: 0 };
  return { cry: 0, soul: 0 };
}
function claimRankReward() {
  const r = rankClaimReward();
  if (r.cry <= 0) { toast('位列榜前五方有嘉奖', 'danger'); return false; }
  if (state.rankClaimDate === todayKey()) { toast('今日嘉奖已领，明日再来', 'danger'); return false; }
  state.rankClaimDate = todayKey();
  state.xianCrystal = (state.xianCrystal || 0) + r.cry;
  state.xianSoul = (state.xianSoul || 0) + r.soul;
  log(`榜上嘉奖已至：仙晶 +${fmtInt(r.cry)}${r.soul ? '、精魄 +' + r.soul : ''}`, 'success');
  saveGame(); return true;
}

/* ================= 镇界塔（仙界专属战斗副本 · 爬塔） ================= */
function xianTowerEnemy(floor) {
  const stg = state.xianStage || 1;
  const atk = Math.floor(combatPower() * (0.42 + floor * 0.06) * (1 + stg * 0.01));
  const hp = Math.floor(atk * (2.2 + floor * 0.12));
  return { atk, hp };
}
function xianTowerTitle(floor) {
  let t = '无名散仙';
  for (const k of Object.keys(XIAN_TOWER_TITLES)) if (floor >= +k) t = XIAN_TOWER_TITLES[k];
  return t;
}
function challengeXianTower() {
  if (!xianUnlocked()) { toast('飞升仙界后方可踏入镇界塔', 'danger'); return false; }
  const floor = state.xianTowerFloor || 1;
  if (floor > XIAN_TOWER_MAX) { toast('三十重镇界塔已登顶！', 'danger'); return false; }
  if ((state.energy || 0) < XIAN_TOWER_ENERGY) { toast('精力不足，稍候恢复', 'danger'); return false; }
  state.energy -= XIAN_TOWER_ENERGY;
  const e = xianTowerEnemy(floor);
  const cs = combatStats();
  const r = simBattle(cs.atk, cs.hp, e.atk, e.hp);
  if (r.win) {
    const cry = Math.floor(60 + floor * 30 + (state.xianStage || 1) * 20);
    const soul = Math.floor(1 + floor / 10);
    state.xianCrystal = (state.xianCrystal || 0) + cry;
    state.xianSoul = (state.xianSoul || 0) + soul;
    state.xianTowerFloor = floor + 1;
    log(`镇界塔第 ${floor} 重告破！获封【${xianTowerTitle(floor)}】，仙晶 +${fmtInt(cry)}、精魄 +${soul}`, 'success');
    toast(`通过第 ${floor} 重`, '');
    if (floor % 5 === 0) {
      const bonus = floor * 40;
      state.xianCrystal = (state.xianCrystal || 0) + bonus;
      log(`里程碑！镇界塔第 ${floor} 重首破，仙晶 +${fmtInt(bonus)}`, 'important');
    }
    if (floor % 10 === 0 && (state.xianPets || []).length < XIAN_PET_MAX) {
      const idx = weightedPick(XIAN_PET_SPECIES);
      state.xianPets.push({ species: idx, level: 1 });
      log(`塔内灵光乍现！你寻得仙兽【${XIAN_PET_SPECIES[idx].name}】，再添仙缘！`, 'success');
    }
    if (floor === XIAN_TOWER_MAX) log('你登顶镇界塔，俯瞰诸天，唯你称尊！', 'important');
  } else {
    const cry = Math.floor(15 + floor * 5);
    state.xianCrystal = (state.xianCrystal || 0) + cry;
    log(`第 ${floor} 重守界者凶威滔天，你败退而归，仅得仙晶 +${fmtInt(cry)}`, 'danger');
    toast('挑战失败', 'danger');
  }
  saveGame();
  return r.win;
}

/* ================= 仙侣双修（结缘 · 情缘成长） ================= */
function xianSpouse() {
  if (state.xianSpouse == null) return null;
  return XIAN_SPOUSES.find(s => s.id === state.xianSpouse) || null;
}
function xianSpouseFactor() {
  const sp = xianSpouse();
  if (!sp) return 1;
  return 1 + sp.cult * (1 + (state.xianBond || 0) * 0.08);
}
function xianDualLeft() {
  return Math.max(0, Math.ceil(((state.xianDualAt || 0) + XIAN_DUAL_CD * 1000 - Date.now()) / 1000));
}
function bondXianSpouse(id) {
  if (!xianUnlocked()) { toast('飞升仙界后方可结缘道侣', 'danger'); return false; }
  if (state.xianSpouse != null) { toast('已有道侣，一心一意方得道', 'danger'); return false; }
  const sp = XIAN_SPOUSES.find(s => s.id === id); if (!sp) return false;
  if ((state.xianCrystal || 0) < sp.xian) { toast('仙晶不足', 'danger'); return false; }
  if ((state.xianSoul || 0) < sp.soul) { toast('精魄不足', 'danger'); return false; }
  state.xianCrystal -= sp.xian;
  state.xianSoul -= sp.soul;
  state.xianSpouse = sp.id;
  state.xianBond = 0;
  log(`琴瑟和鸣！你与【${sp.name}】结为道侣，自此双修共进，道途不再孤寂！`, 'success');
  saveGame(); return true;
}
function xianDualCultivate() {
  const sp = xianSpouse();
  if (!sp) { toast('尚无道侣，何来双修', 'danger'); return false; }
  if (xianDualLeft() > 0) { toast('双修尚需休憩', 'danger'); return false; }
  if ((state.energy || 0) < XIAN_DUAL_ENERGY) { toast('精力不足', 'danger'); return false; }
  state.energy -= XIAN_DUAL_ENERGY;
  state.xianDualAt = Date.now();
  const gain = reqCultivation() * XIAN_DUAL_CULT;
  state.cultivation += gain;
  state.lifetimeCultivation += gain;
  state.heartDemon = Math.max(0, (state.heartDemon || 0) + XIAN_DUAL_DEMON);
  state.xianBond = Math.min(XIAN_BOND_MAX, (state.xianBond || 0) + 1);
  state.stats.dual = (state.stats.dual || 0) + 1;
  log(`与【${sp.name}】共赴双修，道行精进 +${fmt(gain)}，心魔渐消，情缘升至 ${state.xianBond}/${XIAN_BOND_MAX} 重`, 'success');
  toast('双修有成', '');
  saveGame(); return true;
}

/* ================= 仙法道藏 ================= */
function xianArtOwned(id) { return (state.xianArts && state.xianArts[id]) === true; }
function xianArtFactor(key) {
  let sum = 0;
  for (const a of XIAN_ARTS) if (xianArtOwned(a.id) && a[key]) sum += a[key];
  return sum;
}
function buyXianArt(id) {
  const a = XIAN_ARTS.find(x => x.id === id); if (!a) return false;
  if (!xianUnlocked()) { toast('飞升仙界后方可参悟道藏', 'danger'); return false; }
  if ((state.xianStage || 0) < a.xian) { toast(`需【${XIAN_REALMS[a.xian - 1].name}】方可参悟`, 'danger'); return false; }
  if (xianArtOwned(a.id)) { toast('此道藏已参悟', 'danger'); return false; }
  if ((state.xianCrystal || 0) < a.cost) { toast('仙晶不足', 'danger'); return false; }
  state.xianCrystal -= a.cost;
  state.xianArts[a.id] = true;
  log(`参悟【${a.name}】，道法精进，${a.desc}。`, 'success');
  saveGame(); return true;
}

/* ================= 仙缘图鉴 / 称号 ================= */
function xianCodexPets() {
  const seen = new Set((state.xianPets || []).map(p => p.species));
  return seen.size >= XIAN_PET_SPECIES.length;
}
function xianCodexComplete() {
  return xianTreasureMastery() >= XIAN_TREASURES.length && xianCodexPets();
}
function xianCodexAbil() { return xianCodexComplete() ? 1 : 0; }

/* ================= 仙界试炼（每日 · 精力挑战） ================= */
function todayKey() { return new Date().toISOString().slice(0, 10); }
function xianTrialDaily() {
  if (state.xianTrialDate !== todayKey()) { state.xianTrialDate = todayKey(); state.xianTrialCount = 0; }
  return state.xianTrialCount;
}
function xianTrialChallenge() {
  xianTrialDaily();
  if (!xianUnlocked()) { toast('飞升仙界后方可挑战试炼', 'danger'); return false; }
  if (state.xianTrialCount >= XIAN_TRIAL_MAX_DAILY) { toast('今日试炼次数已尽，待明日再来', 'danger'); return false; }
  if ((state.energy || 0) < XIAN_TRIAL_ENERGY) { toast('精力不足，稍候恢复', 'danger'); return false; }
  state.energy -= XIAN_TRIAL_ENERGY;
  state.xianTrialCount++;
  const stage = state.xianStage || 1;
  // 敌手强度随仙境与仙器大成成长
  const target = (30000 + 20000 * (stage - 1)) * (1 + 0.4 * xianTreasureMastery()) * (1 + 0.3 * xianCodexAbil());
  const win = combatPower() >= target;
  if (win) {
    const crystal = XIAN_TRIAL_CRYSTAL + Math.floor(stage * 6) + Math.floor(Math.random() * 30);
    state.xianCrystal = (state.xianCrystal || 0) + crystal;
    state.spiritStones = (state.spiritStones || 0) + 20000 + 20000 * (stage - 1);
    log(`仙域试炼大捷！斩获 ${crystal} 仙晶、${fmt(20000 + 20000 * (stage - 1))} 灵石。`, 'success');
  } else {
    state.xianCrystal = (state.xianCrystal || 0) + XIAN_TRIAL_CRYSTAL_LOSE;
    log(`仙域试炼落败，你负伤而退，仅得 ${XIAN_TRIAL_CRYSTAL_LOSE} 仙晶聊作安勉。`, 'danger');
  }
  saveGame(); return true;
}

function towerEnemy(floor) {
  return {
    hp: Math.round(60 * Math.pow(1.16, floor)),
    atk: Math.round(5 * Math.pow(1.13, floor)),
    reward: Math.round(20 * Math.pow(1.15, floor)),
  };
}

function combatStats() {
  const atk = Math.max(10, Math.floor(combatPower() * 0.3));
  const hp = 200 + (state.xianStage || 0) * 1500 + state.realm * 120 + state.treasures.armor * 90 + (state.bodyRealm || 0) * 60;
  return { atk, hp };
}

function simBattle(pAtk, pHp, eAtk, eHp) {
  let pH = pHp, eH = eHp;
  for (let i = 0; i < 300; i++) {
    eH -= pAtk;
    if (eH <= 0) return { win: true, hpLeft: pH };
    pH -= eAtk;
    if (pH <= 0) return { win: false, enemyLeft: eH };
  }
  return { win: false, enemyLeft: eH };
}

function challengeTower() {
  const floor = state.towerFloor || 1;
  if (floor > TOWER_MAX) { toast('六十层镇妖塔已登顶！', 'danger'); return false; }
  const e = towerEnemy(floor);
  const cs = combatStats();
  const r = simBattle(cs.atk, cs.hp, e.atk, e.hp);
  if (r.win) {
    state.stats.tower = (state.stats.tower || 0) + 1;
    const reward = e.reward + Math.floor(combatPower() * 0.15);
    state.spiritStones += reward;
    state.lifetimeStones += reward;
    state.towerFloor = floor + 1;
    log(`登塔成功！你击败第 ${floor} 层守关妖兽，获封【${towerTitle(floor)}】，灵石 +${fmtInt(reward)}`, 'success');
    toast(`通过第 ${floor} 层`, '');
    if (floor === TOWER_MAX) log('你登顶镇妖塔顶，俯瞰众生，威震三界！', 'important');
  } else {
    const reward = Math.floor(e.reward * 0.3);
    state.spiritStones += reward;
    state.lifetimeStones += reward;
    log(`第 ${floor} 层妖兽凶悍，你败下阵来，仅得灵石 +${fmtInt(reward)}`, 'danger');
    toast('挑战失败', 'danger');
  }
  saveGame();
  return r.win;
}

function bossLeft() {
  if (!state.bossAt) return 0;
  return Math.max(0, (state.bossAt - Date.now()) / 1000);
}
function bossHp() {
  if (state.bossHp != null) return state.bossHp;
  const lv = state.realm + (state.xianStage || 0) * 9;
  return Math.round(BOSS_BASE_HP * (1 + lv * 0.8));
}
function fightBoss() {
  if (bossLeft() > 0) { toast('妖王尚在酝酿', 'danger'); return false; }
  const cs = combatStats();
  state.bossHp = bossHp();
  const r = simBattle(cs.atk, cs.hp, Math.floor(state.bossHp * 0.02) + 5, state.bossHp);
  state.bossAt = Date.now() + BOSS_CD * 1000;
  state.bossHp = null;
  if (r.win) {
    state.stats.bossKills = (state.stats.bossKills || 0) + 1;
    const reward = Math.floor(BOSS_BASE_HP * (0.5 + (state.realm + (state.xianStage || 0) * 9) * 0.4) * (1 + legacyPvp()));
    state.spiritStones += reward;
    state.lifetimeStones += reward;
    const contrib = Math.floor(reward / 20);
    state.sectContribution = (state.sectContribution || 0) + contrib;
    log(`你力斩【妖王】！众人敬服，灵石 +${fmtInt(reward)}，宗门贡献 +${fmtInt(contrib)}`, 'important');
    toast('妖王伏诛', '');
  } else {
    const reward = Math.floor(BOSS_BASE_HP * 0.05);
    state.spiritStones += reward;
    state.lifetimeStones += reward;
    log(`妖王凶威盖世，你负伤而退，仅得灵石 +${fmtInt(reward)}`, 'danger');
    toast('不敌妖王', 'danger');
  }
  saveGame();
  return r.win;
}

/* ================= 灵根进阶 ================= */
const ROOT_ADVANCE = [
  { from: 0, to: 1, realm: 2, cost: 5000 },
  { from: 1, to: 2, realm: 4, cost: 20000 },
  { from: 2, to: 3, realm: 6, cost: 80000 },
  { from: 3, to: 4, realm: 8, cost: 300000 },
];
function rootAdvance() {
  const step = ROOT_ADVANCE.find(s => s.from === state.rootId);
  if (!step) { toast('灵根已臻至圆满', 'danger'); return false; }
  if (state.realm < step.realm) { toast('境界不足，无法洗炼灵根', 'danger'); return false; }
  if (state.spiritStones < step.cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= step.cost;
  const from = SPIRIT_ROOTS[state.rootId].name;
  state.rootId = step.to;
  log(`你以海量灵材淬炼资质，灵根由【${from}】晋升为【${SPIRIT_ROOTS[state.rootId].name}】！`, 'important');
  toast('灵根进阶', '');
  saveGame();
  return true;
}

/* ================= 宗门技能 & 贡献兑换 ================= */
function learnSectSkill(id) {
  if (state.sectId == null) return false;
  const sk = SECT_SKILLS.find(x => x.id === id);
  if (!sk) return false;
  if ((state.sectSkills || []).includes(id)) { toast('已习得该宗门秘技', 'danger'); return false; }
  if (state.sectContribution < sk.cost) { toast('贡献不足', 'danger'); return false; }
  state.sectContribution -= sk.cost;
  state.sectSkills = state.sectSkills || [];
  state.sectSkills.push(id);
  log(`你参透宗门秘技【${sk.name}】：${sk.desc}`, 'success');
  saveGame();
  return true;
}
function exchangeSect(id) {
  if (state.sectId == null) return false;
  const ex = SECT_EXCHANGES.find(x => x.id === id);
  if (!ex) return false;
  if (state.sectContribution < ex.cost) { toast('贡献不足', 'danger'); return false; }
  state.sectContribution -= ex.cost;
  if (ex.id === 'ore') { state.ores = (state.ores || 0) + 5; log(`你以贡献换取【精铁 x5】，+5 精铁`, 'success'); }
  else if (ex.id === 'dp') { state.divinePoints = (state.divinePoints || 0) + 1; log('你以贡献换取 1 点悟道点', 'success'); }
  else if (ex.id === 'pz') { state.pills.pz = Math.min(PILLS.pz.max, state.pills.pz + 1); log('你以贡献换取 1 枚破障丹', 'success'); }
  else return false;
  saveGame();
  return true;
}

/* ================= 道侣 ================= */
function adoptSpouse() {
  if (state.spouse != null) { toast('已有道侣', 'danger'); return false; }
  if (state.spiritStones < SPOUSE_COST) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= SPOUSE_COST;
  state.spouse = weightedPick(SPAUSES);
  const s = SPAUSES[state.spouse];
  log(`你于红尘中觅得良缘，与【${s.name}】结为道侣：${s.desc}，双修修为 +${Math.round(s.cult * 100)}%`, 'important');
  toast('喜结道侣', '');
  saveGame();
  return true;
}
function dualLeft() {
  if (!state.spouseAt) return 0;
  return Math.max(0, (state.spouseAt - Date.now()) / 1000);
}
function dualCultivate() {
  if (state.spouse == null) { toast('尚无道侣', 'danger'); return false; }
  if (dualLeft() > 0) { toast('双修尚需温养', 'danger'); return false; }
  state.spouseAt = Date.now() + SPOUSE_CD * 1000;
  state.stats.dual = (state.stats.dual || 0) + 1;
  const s = SPAUSES[state.spouse];
  const gain = reqCultivation() * 0.05 + 500 * s.cult;
  state.cultivation += gain;
  state.lifetimeCultivation += gain;
  const stones = 200 + Math.floor(combatPower() * 0.2);
  state.spiritStones += stones;
  state.lifetimeStones += stones;
  log(`你与【${s.name}】于月下双修，修为 +${fmt(gain)}，灵石 +${fmt(stones)}`, 'success');
  toast('双修得益', '');
  saveGame();
  return true;
}

/* ================= 传承道统 ================= */
function legacyTotal(key) {
  let sum = 0;
  for (const id of (state.legacyRunes || [])) {
    const r = LEGACY_RUNES.find(x => x.id === id);
    if (!r) continue;
    if (r.fx[key] != null) sum += r.fx[key];
    if (r.fx.all != null) sum += r.fx.all;
  }
  return sum;
}
function legacyCult() { return legacyTotal('cult'); }
function legacyStone() { return legacyTotal('stones'); }
function legacyChance() { return legacyTotal('chance'); }
function legacyCombat() { return legacyTotal('combat'); }
function legacyDwell() { return legacyTotal('dwell'); }
function legacyCraft() { return Math.floor(legacyTotal('craft')); }
function legacyForge() { return Math.floor(legacyTotal('forge')); }
function legacyPvp() { return legacyTotal('pvp'); }
// 轮回获得传承点：随世数递增
function legacyReincGain() { return 1 + Math.floor(state.reincarnations / 3); }
function lightRune(id) {
  const r = LEGACY_RUNES.find(x => x.id === id);
  if (!r) return false;
  if ((state.legacyRunes || []).includes(id)) { toast('已点亮该道纹', 'danger'); return false; }
  if ((state.legacyPoints || 0) < r.cost) { toast('传承点不足', 'danger'); return false; }
  state.legacyPoints -= r.cost;
  state.legacyRunes = state.legacyRunes || [];
  state.legacyRunes.push(id);
  log(`你以传承功业点亮【${r.name}】：${r.desc}，此光万世不灭！`, 'important');
  toast('道纹点亮', '');
  saveGame();
  return true;
}

/* ================= 宗门职位晋升 ================= */
function sectPositionObj() {
  return SECT_POSITIONS[Math.min((state.sectPosition || 0), SECT_POSITIONS.length - 1)];
}
function sectPositionNext() {
  const i = (state.sectPosition || 0) + 1;
  return i < SECT_POSITIONS.length ? SECT_POSITIONS[i] : null;
}
function sectPositionBonus() {
  const p = sectPositionObj();
  return { cult: p.cult, stones: p.stones, combat: p.combat };
}
function promoteSect() {
  if (state.sectId == null) return false;
  const next = sectPositionNext();
  if (!next) { toast('已位居掌门，无职可晋', 'danger'); return false; }
  if (state.sectContribution < next.cost) { toast('宗门贡献不足', 'danger'); return false; }
  const realmOK = next.realm != null ? state.realm >= next.realm : true;
  const xianOK = next.xian != null ? (state.xianStage || 0) >= next.xian : true;
  if (!realmOK || !xianOK) { toast('境界不足，暂难晋升', 'danger'); return false; }
  state.sectContribution -= next.cost;
  state.sectPosition = (state.sectPosition || 0) + 1;
  log(`你获宗门擢升，就任【${next.name}】：${next.desc}！`, 'important');
  toast(`晋升 ${next.name}`, '');
  saveGame();
  return true;
}

/* ================= 拍卖行 ================= */
function auctionUntil() { return state.auction ? (state.auction.until || 0) : 0; }
function auctionLeft() { return Math.max(0, (auctionUntil() - Date.now()) / 1000); }
function ensureAuction() {
  if (!state.auction) state.auction = { list: [], until: 0 };
  if (auctionLeft() > 0 && state.auction.list.length) return;
  const pool = [...AUCTION_POOL].sort(() => Math.random() - 0.5);
  state.auction.list = pool.slice(0, 3).map(it => ({
    key: it.key,
    price: Math.floor(it.price * (0.85 + Math.random() * 0.3)),
  }));
  state.auction.until = Date.now() + AUCTION_CYCLE * 1000;
}
function auctionBuy(idx) {
  ensureAuction();
  const item = state.auction.list[idx];
  if (!item) return false;
  if (auctionLeft() <= 0) { ensureAuction(); toast('本轮拍卖结算，正在刷新', ''); return false; }
  if (state.spiritStones < item.price) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= item.price;
  const parts = [];
  if (item.key === 'ore') {
    state.ores = (state.ores || 0) + 12;
    parts.push('精铁 x12');
  } else if (item.key === 'pz') {
    state.pills.pz = Math.min(PILLS.pz.max, state.pills.pz + 2);
    parts.push('破障丹 x2');
  } else if (item.key === 'wudao') {
    state.pills.wudao = Math.min(PILLS.wudao.max, state.pills.wudao + 1);
    parts.push('悟道丹 x1');
  } else {
    if (state.treasures[item.key] < TREASURES[item.key].max) {
      state.treasures[item.key]++;
      codexAdd('treasures', item.key);
      parts.push(`${TREASURES[item.key].name} +1 阶`);
    } else {
      const comp = Math.floor(item.price * 0.8);
      state.spiritStones += comp;
      parts.push(`${TREASURES[item.key].name} 已至满阶，返还 ${fmtInt(comp)} 灵石`);
    }
  }
  state.auction.list.splice(idx, 1);
  log(`你在拍卖行竞得 ${parts.join('、')}，花费 ${fmtInt(item.price)} 灵石`, 'success');
  toast('拍卖成交', '');
  saveGame();
  return true;
}

/* ================= 法宝洗练 / 重铸 ================= */
function forgeQuality(slot) { return (forgeInfo(slot).quality || 0); }
function forgeQualityBonus(slot) { return forgeQuality(slot) * REFORGE_QUALITY; }
function washCost() { return WASH_COST_STONE; }
function reforgeCost(slot) {
  return Math.floor(WASH_COST_STONE * 5 * Math.pow(REFORGE_MULT, forgeQuality(slot)));
}
function washTreasure(slot) {
  const info = forgeInfo(slot);
  if (!info || state.treasures[slot] <= 0) { toast('先祭炼该法宝', 'danger'); return false; }
  if (!(info.affixes || []).length) { toast('尚无词条可洗，先淬炼', 'danger'); return false; }
  if (state.spiritStones < WASH_COST_STONE) { toast('灵石不足', 'danger'); return false; }
  if ((state.ores || 0) < WASH_COST_ORE) { toast('精铁不足', 'danger'); return false; }
  state.spiritStones -= WASH_COST_STONE;
  state.ores -= WASH_COST_ORE;
  const n = info.affixes.length;
  info.affixes = [];
  for (let i = 0; i < n; i++) info.affixes.push(AFFIXES[Math.floor(Math.random() * AFFIXES.length)].id);
  log(`你耗费灵材洗练【${TREASURES[slot].name}】，词条焕然一新：${forgeAffixText(slot)}`, 'success');
  toast('洗练成功', '');
  saveGame();
  return true;
}
function reforgeTreasure(slot) {
  const info = forgeInfo(slot);
  if (!info || state.treasures[slot] <= 0) { toast('先祭炼该法宝', 'danger'); return false; }
  if (!(info.affixes || []).length) { toast('先淬炼出词条', 'danger'); return false; }
  const cost = reforgeCost(slot);
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  info.quality = (info.quality || 0) + 1;
  const n = info.affixes.length;
  info.affixes = [];
  for (let i = 0; i < n; i++) info.affixes.push(AFFIXES[Math.floor(Math.random() * AFFIXES.length)].id);
  log(`你以洪荒灵材重铸【${TREASURES[slot].name}】，品阶提升至 ${info.quality} 品，全属性 +${Math.round(info.quality * REFORGE_QUALITY * 100)}%！`, 'important');
  toast('重铸成功', '');
  saveGame();
  return true;
}

/* ================= 主循环 ================= */
function tick(dt) {
  const s = dt / 1000;
  const cr = cultRate();
  const sr = stoneRate();
  state.cultivation += cr * s;
  state.spiritStones += sr * s;
  state.lifetimeCultivation += cr * s;
  state.lifetimeStones += sr * s;
  // 仙府挂机产出：仙晶 + 精魄（每累积 6 万仙晶 1 精魄）
  if ((state.xianManor || 0) > 0) {
    const ms = xianManorRateSec() * s;
    state.xianCrystal = (state.xianCrystal || 0) + ms;
    state.xianManorAcc = (state.xianManorAcc || 0) + ms;
    if (state.xianManorAcc >= XIAN_MANOR_SOUL_PER) {
      const souls = Math.floor(state.xianManorAcc / XIAN_MANOR_SOUL_PER);
      state.xianSoul = (state.xianSoul || 0) + souls;
      state.xianManorAcc -= souls * XIAN_MANOR_SOUL_PER;
    }
  }
  if (state.heartDemon > 0) state.heartDemon = Math.max(0, state.heartDemon - 0.05 * s);
  if (state.energy < state.energyMax) state.energy = Math.min(state.energyMax, state.energy + s * ENERGY_REGEN);
  state.lastTick = Date.now(); // 心跳：语义统一为「最近一次在线时刻」
}

/* ================= 奇遇事件 ================= */
const EVENTS = [
  {
    title: '上古秘境',
    text: '你于深山中发现一座灵气喷涌的上古秘境，深处隐约传来妖兽低吼。机缘与凶险并存……',
    choices: [
      { label: '深入探索', outcomes: [
        { w: 0.55, fx: { cult: 0.5, stones: 300 }, msg: '你寻得灵脉源头，修为暴涨，收获颇丰！' },
        { w: 0.45, fx: { demon: 18 }, msg: '守护妖兽暴起发难，你负伤而逃，心魔渐生……' },
      ] },
      { label: '在外围采药', outcomes: [
        { w: 1, fx: { stones: 160 }, msg: '你采得几株灵草，兑换了些许灵石。' },
      ] },
      { label: '明哲保身', outcomes: [
        { w: 1, fx: {}, msg: '你选择离去，虽无所得，却也安然无恙。' },
      ] },
    ],
  },
  {
    title: '黑衣修士',
    text: '一名来历不明的黑衣修士拦住去路，目光不善地打量着你腰间的储物袋……',
    choices: [
      { label: '拔剑迎战', outcomes: [
        { w: 0.5, fx: { cult: 0.4, stones: 200 }, msg: '你险胜对手，夺得对方的储物袋，收获颇丰！' },
        { w: 0.5, fx: { cult: -0.15, demon: 10 }, msg: '对方修为高你一筹，你败逃而去，损失部分修为。' },
      ] },
      { label: '破财消灾', outcomes: [
        { w: 1, fx: { stones: -120 }, msg: '你交出灵石，对方冷哼一声扬长而去。' },
      ] },
    ],
  },
  {
    title: '云游老道',
    text: '一位鹤发童颜的云游老道打量你片刻，抚须笑道：“小友根骨不错，可愿听老朽一言？”',
    choices: [
      { label: '虚心求教', outcomes: [
        { w: 1, fx: { method: 1 }, msg: '老道指点你修行要诀，功法感悟更上一层楼！' },
      ] },
      { label: '请教突破之法', outcomes: [
        { w: 1, fx: { cult: 0.3 }, msg: '老道点破你的修行瓶颈，你隐隐有所顿悟。' },
      ] },
    ],
  },
  {
    title: '丹炉遗宝',
    text: '你在废弃洞府中发现一座古朴丹炉，炉中竟还温养着数枚丹药，清香扑鼻……',
    choices: [
      { label: '小心取出', outcomes: [
        { w: 0.7, fx: { pills: 'jq', n: 2 }, msg: '你得到两枚聚气丹，如获至宝！' },
        { w: 0.3, fx: { demon: 8 }, msg: '丹炉突然炸裂，毒烟扑面，你心魔暗生。' },
      ] },
      { label: '用丹炉炼丹', outcomes: [
        { w: 1, fx: { stones: 260 }, msg: '你炼出数枚品质不错的丹药，卖了个好价钱。' },
      ] },
    ],
  },
  {
    title: '月下灵泉',
    text: '月光下的灵泉泛起五彩涟漪，传闻饮下灵泉水可洗练心魔、增长修为……',
    choices: [
      { label: '沐浴灵泉', outcomes: [
        { w: 0.75, fx: { demon: -25, cult: 0.2 }, msg: '灵泉洗髓伐骨，心魔尽散，修为亦有精进！' },
        { w: 0.25, fx: { demon: 10 }, msg: '泉水暗藏寒毒，你冷得浑身发抖，心魔反而滋生。' },
      ] },
      { label: '舀水带走', outcomes: [
        { w: 1, fx: { stones: 120 }, msg: '你将灵泉水封装成瓶，卖给坊市得了些灵石。' },
      ] },
    ],
  },
];

/* ================= 成就 ================= */
const ACHIEVEMENTS = [
  // 境界
  { id: 'realm_1', cat: '境界', icon: '筑', name: '筑就道基', desc: '踏入筑基期，褪去凡胎', check: s => s.realm >= 1 },
  { id: 'realm_2', cat: '境界', icon: '金', name: '金丹凝成', desc: '踏入金丹期，寿元大涨', check: s => s.realm >= 2 },
  { id: 'realm_3', cat: '境界', icon: '元', name: '元婴出窍', desc: '踏入元婴期，逍遥天地', check: s => s.realm >= 3 },
  { id: 'realm_4', cat: '境界', icon: '化', name: '化神之境', desc: '踏入化神期，万法归宗', check: s => s.realm >= 4 },
  { id: 'realm_5', cat: '境界', icon: '虚', name: '炼虚合道', desc: '踏入炼虚期，感悟法则', check: s => s.realm >= 5 },
  { id: 'realm_6', cat: '境界', icon: '合', name: '合体归元', desc: '踏入合体期，三花聚顶', check: s => s.realm >= 6 },
  { id: 'realm_7', cat: '境界', icon: '乘', name: '大乘圆满', desc: '踏入大乘期，静候天劫', check: s => s.realm >= 7 },
  { id: 'realm_8', cat: '境界', icon: '劫', name: '渡劫修士', desc: '踏入渡劫期，九死一生', check: s => s.realm >= 8 },
  { id: 'realm_9', cat: '境界', icon: '仙', name: '白日飞升', desc: '渡过天劫，飞升仙界', check: s => s.ascended },
  { id: 'realm_10', cat: '境界', icon: '太', name: '太乙之姿', desc: '登临太乙金仙，道果凝结', check: s => (s.xianStage || 0) >= 4 },
  { id: 'realm_11', cat: '境界', icon: '圣', name: '半步成圣', desc: '登临准圣，参悟造化', check: s => (s.xianStage || 0) >= 6 },
  { id: 'realm_12', cat: '境界', icon: '帝', name: '仙帝临世', desc: '登临仙帝，威震诸天', check: s => (s.xianStage || 0) >= 8 },
  { id: 'realm_13', cat: '境界', icon: '尊', name: '道之仙尊', desc: '登临仙尊，岁月长存', check: s => (s.xianStage || 0) >= 9 },
  // 修为
  { id: 'cult_1', cat: '修为', icon: '修', name: '日积月累', desc: '累计获得 1 万修为', check: s => s.lifetimeCultivation >= 1e4 },
  { id: 'cult_2', cat: '修为', icon: '修', name: '苦修不辍', desc: '累计获得 10 万修为', check: s => s.lifetimeCultivation >= 1e5 },
  { id: 'cult_3', cat: '修为', icon: '修', name: '大道初成', desc: '累计获得 100 万修为', check: s => s.lifetimeCultivation >= 1e6 },
  { id: 'cult_4', cat: '修为', icon: '修', name: '道法通玄', desc: '累计获得 1000 万修为', check: s => s.lifetimeCultivation >= 1e7 },
  // 财富
  { id: 'stone_1', cat: '财富', icon: '财', name: '小有积蓄', desc: '累计获得 1000 灵石', check: s => s.lifetimeStones >= 1000 },
  { id: 'stone_2', cat: '财富', icon: '财', name: '腰缠万贯', desc: '累计获得 1 万灵石', check: s => s.lifetimeStones >= 1e4 },
  { id: 'stone_3', cat: '财富', icon: '财', name: '富甲一方', desc: '累计获得 10 万灵石', check: s => s.lifetimeStones >= 1e5 },
  { id: 'stone_4', cat: '财富', icon: '财', name: '灵石矿主', desc: '累计获得 100 万灵石', check: s => s.lifetimeStones >= 1e6 },
  // 功法
  { id: 'method_1', cat: '功法', icon: '法', name: '功法小成', desc: '功法参悟至第 5 层', check: s => s.methodLevel >= 5 },
  { id: 'method_2', cat: '功法', icon: '法', name: '功法大成', desc: '功法参悟至第 10 层', check: s => s.methodLevel >= 10 },
  { id: 'method_3', cat: '功法', icon: '法', name: '功法通神', desc: '功法参悟至第 20 层', check: s => s.methodLevel >= 20 },
  // 历练
  { id: 'act_1', cat: '历练', icon: '道', name: '初入仙途', desc: '完成第一次突破', check: s => s.stats.breakthroughs >= 1 },
  { id: 'act_2', cat: '历练', icon: '道', name: '百炼成钢', desc: '突破成功 10 次', check: s => s.stats.breakthroughs >= 10 },
  { id: 'act_3', cat: '历练', icon: '道', name: '久经考验', desc: '突破失败 10 次', check: s => s.stats.fails >= 10 },
  { id: 'act_4', cat: '历练', icon: '道', name: '越挫越勇', desc: '突破失败 30 次', check: s => s.stats.fails >= 30 },
  { id: 'act_5', cat: '历练', icon: '丹', name: '丹道入门', desc: '服用丹药 10 次', check: s => s.stats.pillsUsed >= 10 },
  { id: 'act_6', cat: '历练', icon: '丹', name: '丹道宗师', desc: '服用丹药 50 次', check: s => s.stats.pillsUsed >= 50 },
  { id: 'act_7', cat: '历练', icon: '缘', name: '缘法深厚', desc: '经历 5 次奇遇', check: s => s.stats.events >= 5 },
  { id: 'act_8', cat: '历练', icon: '缘', name: '天命之子', desc: '经历 20 次奇遇', check: s => s.stats.events >= 20 },
  { id: 'act_9', cat: '历练', icon: '心', name: '打坐有成', desc: '打坐修炼 20 次', check: s => s.stats.meditations >= 20 },
  { id: 'act_10', cat: '历练', icon: '静', name: '宁静致远', desc: '打坐修炼 100 次', check: s => s.stats.meditations >= 100 },
  { id: 'pet_1', cat: '历练', icon: '宠', name: '灵宠相伴', desc: '驯服第一只灵宠', check: s => (s.stats.captures || 0) >= 1 },
  { id: 'pet_2', cat: '历练', icon: '宠', name: '灵宠宗师', desc: '灵宠培养至 10 级', check: s => s.pet && s.pet.level >= 10 },
  { id: 'trial_1', cat: '历练', icon: '探', name: '初探秘境', desc: '挑战秘境 5 次', check: s => (s.stats.trials || 0) >= 5 },
  { id: 'trial_2', cat: '历练', icon: '探', name: '秘境常客', desc: '挑战秘境 30 次', check: s => (s.stats.trials || 0) >= 30 },
  { id: 'sect_1', cat: '历练', icon: '宗', name: '拜入宗门', desc: '加入任意宗门', check: s => s.sectId != null },
  { id: 'sect_2', cat: '历练', icon: '宗', name: '宗门栋梁', desc: '宗门贡献达到 5000', check: s => s.sectContribution >= 5000 },
  { id: 'daily_1', cat: '历练', icon: '勤', name: '日行一善', desc: '单日完成 3 个每日任务', check: s => (s.claimedQuests || []).length >= 3 },
  { id: 'daily_2', cat: '历练', icon: '勤', name: '勤勉不懈', desc: '单日完成全部每日任务', check: s => (s.claimedQuests || []).length >= DAILY_QUESTS.length },
  { id: 'field_1', cat: '历练', icon: '田', name: '开荒种药', desc: '灵田收获 10 次', check: s => (s.stats.harvests || 0) >= 10 },
  { id: 'field_2', cat: '历练', icon: '田', name: '药圃满园', desc: '灵田收获 50 次', check: s => (s.stats.harvests || 0) >= 50 },
  { id: 'craft_1', cat: '历练', icon: '炉', name: '初窥丹道', desc: '炼制丹药 5 次', check: s => (s.stats.crafts || 0) >= 5 },
  { id: 'craft_2', cat: '历练', icon: '炉', name: '丹道宗师', desc: '炼制丹药 50 次', check: s => (s.stats.crafts || 0) >= 50 },
  { id: 'travel_1', cat: '历练', icon: '游', name: '初涉凡尘', desc: '云游历练 5 次', check: s => (s.stats.travels || 0) >= 5 },
  { id: 'travel_2', cat: '历练', icon: '游', name: '行万里路', desc: '云游历练 30 次', check: s => (s.stats.travels || 0) >= 30 },
  { id: 'forge_1', cat: '历练', icon: '炼', name: '初窥炼器', desc: '淬炼法宝 3 次', check: s => (s.stats.forges || 0) >= 3 },
  { id: 'forge_2', cat: '历练', icon: '炼', name: '炼器大师', desc: '淬炼法宝 20 次', check: s => (s.stats.forges || 0) >= 20 },
  { id: 'trib_1', cat: '历练', icon: '劫', name: '直面天劫', desc: '引动天劫 10 次', check: s => (s.stats.tribulations || 0) >= 10 },
  // 新功能成就：炼丹 / 器灵 / 繁育 / 驻地季赛 / 渡劫
  { id: 'alch_1', cat: '历练', icon: '丹', name: '丹道烘炉', desc: '炼丹师等级达到 10', check: s => (s.alchemy && s.alchemy.level) >= 10 },
  { id: 'alch_2', cat: '历练', icon: '鼎', name: '炉火纯青', desc: '炼丹师等级达到 30', check: s => (s.alchemy && s.alchemy.level) >= 30 },
  { id: 'spirit_1', cat: '历练', icon: '灵', name: '器灵初醒', desc: '觉醒任意一件法宝器灵', check: s => Object.values(s.spirits || {}).some(v => v >= 1) },
  { id: 'spirit_2', cat: '历练', icon: '灵', name: '器灵圆满', desc: '任一件器灵培育至圆满（10 层）', check: s => Object.values(s.spirits || {}).some(v => v >= SPIRIT_MAX) },
  { id: 'breed_1', cat: '历练', icon: '缘', name: '灵宠连理', desc: '为灵宠寻得伴侣', check: s => !!s.petMate },
  { id: 'breed_2', cat: '历练', icon: '诞', name: '血脉传承', desc: '繁育后代灵宠 1 次', check: s => (s.stats.breeds || 0) >= 1 },
  { id: 'season_1', cat: '历练', icon: '驻', name: '边关悍将', desc: '单一赛季战功达到 15', check: s => (s.seasonScore || 0) >= 15 },
  { id: 'season_2', cat: '历练', icon: '城', name: '镇守有功', desc: '驻地驻守胜绩 10 次', check: s => (s.stats.defends || 0) >= 10 },
  { id: 'trib_2', cat: '历练', icon: '雷', name: '天雷淬体', desc: '渡天劫连渡 5 道天雷', check: s => (s.tribDone || 0) >= 5 },
];

// 成就奖励：按类别给予灵石（里程碑类越靠后略高，作为成长辅助）
function achievementReward(a) {
  switch (a.cat) {
    case '境界': case '修为': return 2500;
    case '财富': case '功法': return 1800;
    default: return 1200;
  }
}

// 检测成就，返回本次新解锁的成就列表
function checkAchievements() {
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (state.achievementsUnlocked.includes(a.id)) continue;
    if (a.check(state)) {
      state.achievementsUnlocked.push(a.id);
      newly.push(a);
      const rw = achievementReward(a);
      state.spiritStones += rw;
      state.lifetimeStones += rw;
      log(`成就达成：${a.name} — ${a.desc}（吾道酬勤 +${fmtInt(rw)} 灵石）`, 'important');
    }
  }
  if (newly.length) {
    const total = newly.reduce((s, a) => s + achievementReward(a), 0);
    if (newly.length === 1) toast(`成就达成！+${fmtInt(achievementReward(newly[0]))} 灵石`, '');
    else toast(`成就 ×${newly.length} · +${fmtInt(total)} 灵石`, '');
    saveGame();
  }
  return newly;
}


function rollEvent() {
  if (Date.now() < state.nextEventAt) return;
  const mask = document.getElementById('eventModal');
  if (mask && !mask.classList.contains('hidden')) return; // 已有弹窗打开时不触发
  const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  state.nextEventAt = Date.now() + randRange(45000, 90000);
  state.stats.events++;
  showEvent(ev);
}

function resolveChoice(ev, choice) {
  const roll = Math.random();
  let acc = 0;
  for (const o of choice.outcomes) {
    acc += o.w;
    if (roll <= acc) {
      applyEventOutcome(o.fx);
      log(`【${ev.title}】${o.msg}`, o.fx && (o.fx.demon > 0 || o.fx.cult < 0) ? 'danger' : 'important');
      if (o.fx && (o.fx.demon > 0 || o.fx.cult < 0)) {
        toast('遭遇不测……', 'danger');
      } else if (o.fx && Object.keys(o.fx).length > 0) {
        toast('机缘所得！', '');
      }
      saveGame();
      return;
    }
  }
}

function applyEventOutcome(fx) {
  if (!fx) return;
  if (fx.cult) {
    const gain = reqCultivation() * fx.cult;
    state.cultivation = Math.max(0, state.cultivation + gain);
    if (gain > 0) state.lifetimeCultivation += gain;
  }
  if (fx.stones) {
    const gain = fx.stones;
    state.spiritStones = Math.max(0, state.spiritStones + gain);
    if (gain > 0) state.lifetimeStones += gain;
  }
  if (fx.method) state.methodLevel += fx.method;
  if (fx.demon) state.heartDemon = clamp(state.heartDemon + fx.demon, 0, 100);
  if (fx.pills) {
    state.pills[fx.pills] = Math.min(PILLS[fx.pills].max, state.pills[fx.pills] + fx.n);
  }
}

/* ================= 离线收益 ================= */
function computeOffline() {
  const elapsed = (Date.now() - state.lastTick) / 1000;
  if (elapsed < 10) return null;
  const capped = Math.min(elapsed, offlineCap());
  const cr = cultRate();
  const sr = stoneRate();
  const c = cr * capped;
  const s = sr * capped;
  state.cultivation += c;
  state.spiritStones += s;
  state.lifetimeCultivation += c;
  state.lifetimeStones += s;
  // 离线同样结算仙府挂机产出：仙晶 + 精魄
  let manor = 0, soul = 0;
  if ((state.xianManor || 0) > 0) {
    manor = xianManorRateSec() * capped;
    state.xianCrystal = (state.xianCrystal || 0) + manor;
    state.xianManorAcc = (state.xianManorAcc || 0) + manor;
    if (state.xianManorAcc >= XIAN_MANOR_SOUL_PER) {
      soul = Math.floor(state.xianManorAcc / XIAN_MANOR_SOUL_PER);
      state.xianSoul = (state.xianSoul || 0) + soul;
      state.xianManorAcc -= soul * XIAN_MANOR_SOUL_PER;
    }
  }
  // 离线同样结算精力恢复与心魔衰减
  if (state.heartDemon > 0) state.heartDemon = Math.max(0, state.heartDemon - 0.05 * capped);
  if (state.energy < state.energyMax) state.energy = Math.min(state.energyMax, state.energy + capped * ENERGY_REGEN);
  state.lastTick = Date.now();
  return { seconds: capped, cult: c, stones: s, manor, soul };
}

/* ================= 存档 / 读档 ================= */
// 云端玩家身份：浏览器本地持久 ID，用于云端存档按人分文件
function playerId() {
  let id = null;
  try { id = localStorage.getItem(PLAYER_KEY); } catch (e) {}
  if (!id) {
    id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    try { localStorage.setItem(PLAYER_KEY, id); } catch (e) {}
  }
  return id;
}

let _cloudTimer = null;     // 云端上传防抖定时器
let _cloudSending = false;  // 是否正在上传
let _cloudDirty = false;    // 上传期间又有新存档等待补传
let cloudOk = null;         // null=尚未同步 true=成功 false=失败（用于状态提示）

function pushCloudSave() {
  if (_cloudSending) {
    _cloudDirty = true;
    return;
  }
  _cloudSending = true;
  fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({}, state, { _pid: playerId(), _v: SAVE_VERSION })),
  }).then(r => {
    cloudOk = r.ok ? true : false;
    _cloudSending = false;
    if (_cloudDirty) { _cloudDirty = false; pushCloudSave(); }
  }).catch(() => {
    cloudOk = false;
    _cloudSending = false;
  });
}

function saveGame() {
  if (!state) return;
  state.lastTick = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  // 云端备份防抖合并：3 秒内多次操作只上传一次
  if (_cloudTimer) clearTimeout(_cloudTimer);
  _cloudTimer = setTimeout(() => {
    _cloudTimer = null;
    pushCloudSave();
  }, 3000);
}

// 本地无存档时尝试从云端取回本玩家备份（校验后落盘）
async function tryCloudRestore() {
  try {
    const res = await fetch('/api/save?pid=' + encodeURIComponent(playerId()));
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data === 'object' && !Array.isArray(data) && typeof data.realm === 'number') {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    }
  } catch (e) { /* 网络不可用则忽略 */ }
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    state = defaultState();
    state.rootId = rollRoot();
    state.physiqueId = rollPhysique();
    return false;
  }
  try {
    const data = JSON.parse(raw);
    state = Object.assign(defaultState(), data);
    migrateState();
    return true;
  } catch (e) {
    state = defaultState();
    state.rootId = rollRoot();
    state.physiqueId = rollPhysique();
    return false;
  }
}

function saveNumber(value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
}

function migrateState() {
  state.realm = Math.floor(saveNumber(state.realm, 0, 0, REALMS.length - 1));
  state.xianStage = Math.floor(saveNumber(state.xianStage, 0, 0, XIAN_REALMS.length));
  state.cultivation = saveNumber(state.cultivation, 0);
  state.spiritStones = saveNumber(state.spiritStones, 20);
  state.heartDemon = saveNumber(state.heartDemon, 0, 0, 100);
  state.methodLevel = Math.floor(saveNumber(state.methodLevel, 1, 1, 10000));
  state.lifetimeCultivation = saveNumber(state.lifetimeCultivation, 0);
  state.lifetimeStones = saveNumber(state.lifetimeStones, 0);
  state.pills = Object.assign({ jq: 0, pz: 0, as: 0, ningshen: 0, xidi: 0, wudao: 0, dutian: 0 }, state.pills || {});
  for (const id of Object.keys(PILLS)) state.pills[id] = Math.floor(saveNumber(state.pills[id], 0, 0, PILLS[id].max));
  state.stats = Object.assign({ breakthroughs: 0, fails: 0, pillsUsed: 0, events: 0, meditations: 0, captures: 0, trials: 0, donates: 0, harvests: 0, crafts: 0, travels: 0, forges: 0, tribulations: 0, tower: 0, bossKills: 0, dual: 0, breeds: 0, spirits: 0, defends: 0 }, state.stats || {});
  for (const id of Object.keys(state.stats)) state.stats[id] = Math.floor(saveNumber(state.stats[id], 0));
  state.herbs = Object.assign({ zicao: 0, qingyang: 0, longxian: 0 }, state.herbs || {});
  for (const id of Object.keys(state.herbs)) state.herbs[id] = Math.floor(saveNumber(state.herbs[id], 0));
  state.ores = Math.floor(saveNumber(state.ores, 0));
  state.energyMax = saveNumber(state.energyMax, ENERGY_MAX, 1, 1000);
  state.energy = saveNumber(state.energy, state.energyMax, 0, state.energyMax);
  state.rootId = Math.floor(saveNumber(state.rootId, 0, 0, SPIRIT_ROOTS.length - 1));
  state.physiqueId = Math.floor(saveNumber(state.physiqueId, 0, 0, PHYSIQUES.length - 1));
  state.treasures = Object.assign({ sword: 0, armor: 0, pendant: 0 }, state.treasures || {});
  for (const id of Object.keys(TREASURES)) state.treasures[id] = Math.floor(saveNumber(state.treasures[id], 0, 0, TREASURES[id].max));
  if (!Array.isArray(state.fields) || !state.fields.length) {
    state.fields = [{ herbId: null, plantedAt: 0 }, { herbId: null, plantedAt: 0 }];
  }
  state.forge = state.forge || {};
  for (const slot of Object.keys(TREASURES)) {
    if (!state.forge[slot]) state.forge[slot] = { tier: 0, affixes: [], quality: 0 };
    else state.forge[slot].quality = state.forge[slot].quality || 0;
  }
  if (state.energy == null) state.energy = state.energyMax;
  if (!Array.isArray(state.legacyRunes)) state.legacyRunes = [];
  if (!state.auction) state.auction = { list: [], until: 0 };
  if (!Array.isArray(state.auction.list)) state.auction.list = [];
  // 旧存档：为既有灵宠补随机资质
  if (state.pet && state.pet.talent == null) state.pet.talent = weightedPick(PET_TALENTS);
  // 旧档安全兜底：境界索引不得超过境界表上限，避免渲染期崩溃
  if (state.realm > REALMS.length - 1) state.realm = REALMS.length - 1;
  state.talismans = Object.assign({ juling: 0, pozhen: 0, huti: 0, jucai: 0 }, state.talismans || {});
  state.talismanBuffs = Object.assign({ juling: 0, pozhen: 0, huti: 0, jucai: 0 }, state.talismanBuffs || {});
  state.formations = Object.assign({ jyj: 0, xjz: 0, jcz: 0, tyz: 0 }, state.formations || {});
  if (!Array.isArray(state.disciples)) state.disciples = [];
  if (!Array.isArray(state.xianPets)) state.xianPets = [];
  // 旧档兜底：法宝器灵 / 灵宠繁育 / 天劫 / 驻地赛季
  if (!state.spirits || typeof state.spirits !== 'object') state.spirits = { sword: 0, armor: 0, pendant: 0 };
  for (const slot of Object.keys(TREASURES)) if (state.spirits[slot] == null) state.spirits[slot] = 0;
  if (state.petMate === undefined) state.petMate = null;
  if (!state.petBreedAt) state.petBreedAt = 0;
  if (!state.tribDone) state.tribDone = 0;
  if (!state.seasonScore) state.seasonScore = 0;
  if (!state.seasonDefendAt) state.seasonDefendAt = 0;
  if (!state.seasonClaimed) state.seasonClaimed = '';
  // 旧档兜底：丹道熟练度
  if (!state.alchemy || typeof state.alchemy !== 'object') state.alchemy = { level: 1, xp: 0 };
  if (!state.alchemy.level) state.alchemy.level = 1;
  if (!state.alchemy.xp) state.alchemy.xp = 0;
  if (state.alchemy.level > ALCHEMY_MAX_LEVEL) state.alchemy.level = ALCHEMY_MAX_LEVEL;
  state._v = SAVE_VERSION;
}

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  state.rootId = rollRoot();
  state.physiqueId = rollPhysique();
  clearLog();
  log(`你心念一动，轮回重启，重入尘世修行…… 此世灵根【${SPIRIT_ROOTS[state.rootId].name}】、体质【${PHYSIQUES[state.physiqueId].name}】`, 'important');
  saveGame();
}

/* ================= 工具 ================= */
const CN_UNITS = [[1e48, '极'], [1e44, '载'], [1e40, '正'], [1e36, '涧'], [1e32, '沟'], [1e28, '穰'], [1e24, '秭'], [1e20, '垓'], [1e16, '京'], [1e12, '兆'], [1e8, '亿'], [1e4, '万']];

function fmtUnit(n) {
  for (let i = 0; i < CN_UNITS.length; i++) {
    if (n >= CN_UNITS[i][0]) {
      const v = n / CN_UNITS[i][0];
      // 数值过大时 toFixed 会退化为指数计数法，改用 toExponential 保证可读
      return (v >= 1e21 ? v.toExponential(2) : v.toFixed(2)) + CN_UNITS[i][1];
    }
  }
  return null;
}

function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  const u = fmtUnit(n);
  if (u) return u;
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  if (n >= 100) return Math.floor(n).toString();
  if (n >= 10) return n.toFixed(1);
  return Math.max(0, n).toFixed(1);
}

function fmtInt(n) {
  const u = fmtUnit(n);
  return u ? u : Math.floor(n).toString();
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

/* ================= 炼体境界 ================= */
const BODY_REALMS = [
  { name: '不入流' },
  { name: '炼皮',   req: 60,    chance: 0.95 },
  { name: '锻骨',   req: 180,   chance: 0.88 },
  { name: '淬筋',   req: 500,   chance: 0.80 },
  { name: '洗髓',   req: 1200,  chance: 0.72 },
  { name: '金身',   req: 3000,  chance: 0.64 },
  { name: '不灭金刚', req: 8000, chance: 0.56 },
];
const BODY_TRAIN_STONE = [10, 25, 60, 150, 400, 1000, 2500];
function bodyRealmObj() { return BODY_REALMS[Math.min(state.bodyRealm || 0, BODY_REALMS.length - 1)]; }
function bodyNextRealm() { const i = (state.bodyRealm || 0) + 1; return i < BODY_REALMS.length ? BODY_REALMS[i] : null; }
function bodyTrainCost() { return BODY_TRAIN_STONE[Math.min(state.bodyRealm || 0, BODY_TRAIN_STONE.length - 1)]; }
function bodyRealmChance() { return (state.bodyRealm || 0) * 0.01; }
function bodyTrain() {
  const cost = bodyTrainCost();
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  const gain = Math.round((2 + (state.realm || 0)) * (1 + (state.bodyRealm || 0) * 0.3));
  state.bodyCult = (state.bodyCult || 0) + gain;
  log(`你以灵石淬炼肉身，骨骼轰鸣，体魄渐强（体修 +${gain}）。`, '');
  saveGame(); return true;
}
function bodyBreak() {
  const next = bodyNextRealm();
  if (!next) { toast('肉身已臻不灭金刚，无可再进', 'danger'); return false; }
  if ((state.bodyCult || 0) < next.req) { toast('体修不足，难以突破', 'danger'); return false; }
  if (Math.random() < next.chance) {
    state.bodyRealm = (state.bodyRealm || 0) + 1;
    state.bodyCult = 0;
    log(`体破功成！你肉身大进，臻至【${bodyRealmObj().name}】，一股浩瀚气血冲霄而起！`, 'important');
    toast(`肉身进阶 ${bodyRealmObj().name}`, '');
  } else {
    state.bodyCult *= 0.6;
    log('肉身淬炼冲关失败，气机紊乱，体修折损……', 'danger');
    shakePanel();
  }
  saveGame(); return true;
}

/* ================= 符箓与阵法 ================= */
const TALISMANS = [
  { id: 'juling', name: '聚灵符', herbs: { zicao: 2 },           ore: 0, stone: 30,  key: 'cult',   val: 0.30, dur: 60,   desc: '修炼速度 +30%（60 秒）' },
  { id: 'pozhen', name: '破境符', herbs: { qingyang: 2 },        ore: 1, stone: 60,  key: 'chance', val: 0.10, times: 3, desc: '突破成功率 +10%（3 次）' },
  { id: 'huti',   name: '护体符', herbs: { zicao: 3, qingyang: 1 }, ore: 2, stone: 120, key: 'combat', val: 0.20, dur: 120,  desc: '战力 +20%（120 秒）' },
  { id: 'jucai',  name: '聚财符', herbs: { zicao: 1, longxian: 1 }, ore: 0, stone: 90,  key: 'stones', val: 0.30, dur: 90,   desc: '灵石产出 +30%（90 秒）' },
];
function talismanAfford(t) {
  if (state.spiritStones < t.stone) return false;
  for (const [h, n] of Object.entries(t.herbs)) if ((state.herbs[h] || 0) < n) return false;
  if ((state.ores || 0) < t.ore) return false;
  return true;
}
function craftTalisman(id) {
  const t = TALISMANS.find(x => x.id === id); if (!t) return false;
  if (!talismanAfford(t)) { toast('炼制材料不足', 'danger'); return false; }
  state.spiritStones -= t.stone;
  for (const [h, n] of Object.entries(t.herbs)) state.herbs[h] -= n;
  state.ores -= t.ore;
  state.talismans[t.id] = (state.talismans[t.id] || 0) + 1;
  log(`你以灵材炼制【${t.name}】，符光流转，灵纹自成。`, 'success');
  saveGame(); return true;
}
function activateTalisman(id) {
  const t = TALISMANS.find(x => x.id === id); if (!t) return false;
  if ((state.talismans[t.id] || 0) <= 0) { toast('符箓不足', 'danger'); return false; }
  state.talismans[t.id]--;
  const b = state.talismanBuffs;
  if (t.dur) b[t.id] = Date.now() + t.dur * 1000;
  else if (t.times) b[t.id] = t.times;
  log(`你祭出【${t.name}】：${t.desc}。`, 'important');
  toast(`激活 ${t.name}`, '');
  saveGame(); return true;
}
function talismanFactor(key) {
  const b = state.talismanBuffs || {}; let sum = 0;
  for (const t of TALISMANS) {
    if (t.key !== key) continue;
    const v = b[t.id]; if (v == null) continue;
    if (t.dur) { if (v > Date.now()) sum += t.val; }
    else if (t.times) { if (v > 0) sum += t.val; }
  }
  return sum;
}

const FORMATIONS = [
  { id: 'jyj', name: '聚灵阵', key: 'cult',   per: 0.03, stone: 300, grow: 1.7, desc: '修炼速度 +3%/级' },
  { id: 'jcz', name: '聚财阵', key: 'stones', per: 0.03, stone: 300, grow: 1.7, desc: '灵石产出 +3%/级' },
  { id: 'xjz', name: '玄甲阵', key: 'chance', per: 0.01, stone: 400, grow: 1.8, desc: '突破成功率 +1%/级' },
  { id: 'tyz', name: '天罡阵', key: 'combat', per: 0.04, stone: 500, grow: 1.8, desc: '战力 +4%/级' },
];
const FORM_MAX = 10;
function formationCost(f) { const lv = state.formations[f.id] || 0; return Math.floor(f.stone * Math.pow(f.grow, lv)); }
function upgradeFormation(id) {
  const f = FORMATIONS.find(x => x.id === id); if (!f) return false;
  if ((state.formations[id] || 0) >= FORM_MAX) { toast('阵法已至圆满', 'danger'); return false; }
  const cost = formationCost(f);
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  state.formations[id] = (state.formations[id] || 0) + 1;
  log(`你扩筑【${f.name}】至 ${state.formations[id]} 阶：${f.desc}。`, 'success');
  saveGame(); return true;
}
function formationFactor(key) {
  let sum = 0;
  for (const f of FORMATIONS) if (f.key === key) sum += (state.formations[f.id] || 0) * f.per;
  return sum;
}

/* ================= 收徒传道 ================= */
const DISCIPLE_POOL = ['青云', '霁月', '沉璧', '竹隐', '霜华', '鹤龄', '孤松', '照雪'];
const DISCIPLE_QUALITIES = [
  { name: '凡资', cult: 0.02, combat: 20, weight: 50 },
  { name: '良材', cult: 0.05, combat: 45, weight: 30 },
  { name: '上慧', cult: 0.09, combat: 80, weight: 15 },
  { name: '天纵', cult: 0.15, combat: 140, weight: 5 },
];
const DISCIPLE_SLOTS = 2;
const DISCIPLE_COST = 1500;
const DISCIPLE_TRAIN_CD = 20;
function takeDisciple() {
  if ((state.disciples || []).length >= DISCIPLE_SLOTS) { toast('门人已满', 'danger'); return false; }
  if (state.spiritStones < DISCIPLE_COST) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= DISCIPLE_COST;
  const q = weightedPick(DISCIPLE_QUALITIES);
  const qidx = DISCIPLE_QUALITIES.indexOf(q);
  state.disciples = state.disciples || [];
  state.disciples.push({ name: DISCIPLE_POOL[Math.floor(Math.random() * DISCIPLE_POOL.length)], quality: qidx, level: 1, trainAt: 0 });
  log(`你于坊市偶遇根骨不凡的少年【${state.disciples[state.disciples.length - 1].name}】，收于门下，资质【${q.name}】。`, 'important');
  toast('收徒成功', '');
  saveGame(); return true;
}
function discipleQuality(d) { return DISCIPLE_QUALITIES[d.quality]; }
function discipleTrainCost(d) { return Math.floor(200 * Math.pow(1.5, d.level - 1)); }
function discipleTrainLeft(d) { return d ? Math.max(0, (d.trainAt - Date.now()) / 1000) : 0; }
function discipleTrain(i) {
  const d = state.disciples[i];
  if (!d) { toast('弟子不存在', 'danger'); return false; }
  if (discipleTrainLeft(d) > 0) { toast('弟子尚在闭关', 'danger'); return false; }
  const q = discipleQuality(d);
  const cost = discipleTrainCost(d);
  if (state.spiritStones < cost) { toast('灵石不足', 'danger'); return false; }
  state.spiritStones -= cost;
  d.level++;
  d.trainAt = Date.now() + DISCIPLE_TRAIN_CD * 1000;
  log(`你授【${d.name}】真传，其修为精进至 ${d.level} 级（${q.name}）。`, 'success');
  saveGame(); return true;
}
function discipleRelease(i) {
  const d = state.disciples[i];
  if (!d) return false;
  const q = discipleQuality(d);
  const reward = Math.floor(600 + d.level * q.combat * 0.6);
  state.spiritStones += reward; state.lifetimeStones += reward;
  log(`【${d.name}】出师远行，临别敬献灵石 ${fmtInt(reward)}，此为善缘。`, '');
  state.disciples.splice(i, 1);
  saveGame(); return true;
}
function discipleCultBonus() {
  let sum = 0;
  for (const d of (state.disciples || [])) { const q = discipleQuality(d); sum += q.cult * d.level; }
  return sum;
}
function discipleCombatBonus() {
  let sum = 0;
  for (const d of (state.disciples || [])) { const q = discipleQuality(d); sum += q.combat * d.level; }
  return sum;
}

/* ================= 宗门大比 · 敌宗 ================= */
const ENEMY_SECTS = [
  { name: '黑风寨',   desc: '蛮横散修聚众为祸', mult: 0.90 },
  { name: '血刀门',   desc: '嗜血狂徒盘踞一方', mult: 1.05 },
  { name: '鬼修联盟', desc: '阴诡之辈结党祸世', mult: 1.20 },
];
const SECT_PRES_MAX = 10;
const SECT_TOURNEY_CD = 600;
function sectPrestigeFactor(key) { return Math.min(state.sectPrestige || 0, SECT_PRES_MAX) * 0.02; }
function raidEnemy(idx) {
  if (state.sectId == null) { toast('需先入宗门，方可出战', 'danger'); return false; }
  const e = ENEMY_SECTS[idx]; if (!e) return false;
  if ((state.energy || 0) < 5) { toast('精力不足', 'danger'); return false; }
  state.energy -= 5;
  const cs = combatStats();
  const r = simBattle(cs.atk, cs.hp, Math.round(cs.atk * e.mult), Math.round(cs.hp * e.mult * 1.15));
  if (r.win) {
    const stones = Math.round((300 + state.realm * 260) * e.mult);
    let oreText = '';
    if (Math.random() < 0.5) { const o = 1 + Math.floor(Math.random() * 2); state.ores = (state.ores || 0) + o; oreText = `精铁 +${o} · `; }
    const contrib = Math.round(120 + state.realm * 80);
    state.spiritStones += stones; state.lifetimeStones += stones;
    state.sectContribution = (state.sectContribution || 0) + contrib;
    state.sectPrestige = Math.min(SECT_PRES_MAX, (state.sectPrestige || 0) + 1);
    let crystalText = '';
    if ((state.xianStage || 0) > 0) {
      const c = 3 + Math.floor(Math.random() * 4);
      state.xianCrystal = (state.xianCrystal || 0) + c;
      crystalText = `仙晶 +${c} · `;
    }
    log(`讨伐【${e.name}】得胜！${crystalText}${oreText}灵石 +${fmtInt(stones)}，宗门贡献 +${contrib}，威望 +1。`, 'success');
  } else {
    state.cultivation = Math.max(0, state.cultivation * 0.85);
    log(`讨伐【${e.name}】失利，你负伤而退，修为折损默许……`, 'danger');
    shakePanel();
  }
  saveGame(); return true;
}
function tourneyLeft() { return Math.max(0, (state.tourneyAt || 0) - Date.now()) / 1000; }
function sectTourney() {
  if (state.sectId == null) { toast('需先入宗门', 'danger'); return false; }
  if (tourneyLeft() > 0) { toast('宗门大比尚在休整', 'danger'); return false; }
  if ((state.sectContribution || 0) < 500) { toast('需 500 宗门贡献报名', 'danger'); return false; }
  state.sectContribution -= 500;
  state.tourneyAt = Date.now() + SECT_TOURNEY_CD * 1000;
  const cs = combatStats();
  const mult = 1.15;
  const r = simBattle(cs.atk, cs.hp, Math.round(cs.atk * mult), Math.round(cs.hp * mult * 1.1));
  if (r.win) {
    const stones = Math.round((1000 + state.realm * 500) * mult);
    const contrib = Math.round(800 + state.realm * 300);
    state.spiritStones += stones; state.lifetimeStones += stones;
    state.sectContribution += contrib;
    state.sectPrestige = Math.min(SECT_PRES_MAX, (state.sectPrestige || 0) + 2);
    log(`宗门大比夺魁！为宗门挣得荣光，灵石 +${fmtInt(stones)}，贡献 +${contrib}，威望 +2。`, 'important');
  } else {
    log('宗门大比惜败，你知耻而后勇，回山苦修……', 'danger');
  }
  saveGame(); return true;
}

/* ================= 宗门驻地 · 季赛 ================= */
const SEASON_SECONDS = 43200;   // 赛季时长（秒）：12 小时
const SEASON_DEFEND_CD = 600;   // 驻地防御冷却（秒）：10 分钟
const SEASON_ENERGY = 3;        // 每次驻守消耗精力
function seasonIndex() { return Math.floor(Date.now() / (SEASON_SECONDS * 1000)); }
function seasonEndLeft() { const t = (seasonIndex() + 1) * SEASON_SECONDS * 1000; return Math.max(0, (t - Date.now()) / 1000); }
function seasonDefendLeft() { return Math.max(0, ((state.seasonDefendAt || 0) - Date.now()) / 1000); }

// 上一季战功是否可结算（本赛季已开启且未领取过）
function seasonClaimablePrev() {
  const prev = seasonIndex() - 1;
  return prev >= 1 && state.seasonClaimed !== String(prev);
}
function seasonReward() {
  const s = (state.seasonScore || 0);
  if (s <= 0) return null;
  if (s >= 30) return { stones: 3000 + state.realm * 800, contrib: 900, prest: 3, label: '威震一域' };
  if (s >= 15) return { stones: 1800 + state.realm * 500, contrib: 600, prest: 2, label: '名动一方' };
  if (s >= 6)  return { stones: 900 + state.realm * 300, contrib: 300, prest: 1, label: '崭露头角' };
  return { stones: 400 + state.realm * 120, contrib: 150, prest: 0, label: '初入战局' };
}

// 驻守宗门驻地，抵御来犯之敌，积累赛季战功
function defendSect() {
  if (state.sectId == null) { toast('需先入宗门，方可驻守', 'danger'); return false; }
  if ((state.energy || 0) < SEASON_ENERGY) { toast('精力不足', 'danger'); return false; }
  if (seasonDefendLeft() > 0) { toast('驻地尚需休整', 'danger'); return false; }
  state.energy -= SEASON_ENERGY;
  state.seasonDefendAt = Date.now() + SEASON_DEFEND_CD * 1000;
  const cs = combatStats();
  const grow = Math.min(0.8, (state.seasonScore || 0) * 0.03); // 来犯之敌随战功渐强
  const mult = 0.95 + grow;
  const r = simBattle(cs.atk, cs.hp, Math.round(cs.atk * mult), Math.round(cs.hp * mult * 1.12));
  if (r.win) {
    state.seasonScore = (state.seasonScore || 0) + 1 + Math.floor(state.realm / 2);
    state.stats.defends = (state.stats.defends || 0) + 1;
    const contrib = Math.round(40 + state.realm * 30);
    state.sectContribution = (state.sectContribution || 0) + contrib;
    state.sectPrestige = Math.min(SECT_PRES_MAX, (state.sectPrestige || 0) + 1);
    log(`驻地惊退来犯之敌！战功 +1，宗门贡献 +${contrib}，威望 +1。本赛季已积 ${state.seasonScore} 战功。`, 'success');
  } else {
    state.cultivation = Math.max(0, state.cultivation * 0.95);
    log('来犯之敌势大，驻地险些失守，你负伤而退，修为略损……', 'danger');
    shakePanel();
  }
  saveGame(); return true;
}

// 结算上一赛季：按战功发放灵石 / 贡献 / 威望
function claimSeason() {
  if (!seasonClaimablePrev()) { toast('本赛季尚无战功可结，或已结算', 'danger'); return false; }
  const r = seasonReward();
  if (!r) { toast('上季战功不足，入不了捷报', 'danger'); return false; }
  state.spiritStones += r.stones;
  state.lifetimeStones += r.stones;
  state.sectContribution += r.contrib;
  state.sectPrestige = Math.min(SECT_PRES_MAX, (state.sectPrestige || 0) + r.prest);
  state.seasonClaimed = String(seasonIndex() - 1);
  log(`上一赛季捷报传来：战功结算【${r.label}】，灵石 +${fmtInt(r.stones)}，贡献 +${r.contrib}，威望 +${r.prest}！`, 'important');
  toast('赛季捷报已领！', '');
  saveGame(); return true;
}
