'use strict';
// 修仙问道 · 界面渲染与交互

const $ = id => document.getElementById(id);

const el = {
  realmBadge: $('realmBadge'),
  realmDesc: $('realmDesc'),
  realmPanel: $('realmPanel'),
  statStones: $('statStones'),
  statStoneRate: $('statStoneRate'),
  cultText: $('cultText'),
  cultBar: $('cultBar'),
  demonText: $('demonText'),
  demonBar: $('demonBar'),
  cultRate: $('cultRate'),
  stoneRate: $('stoneRate'),
  breakChance: $('breakChance'),
  methodName: $('methodName'),
  methodLevel: $('methodLevel'),
  methodBonus: $('methodBonus'),
  methodCost: $('methodCost'),
  methodList: $('methodList'),
  divinePoints: $('divinePoints'),
  divineList: $('divineList'),
  market: $('market'),
  codexCount: $('codexCount'),
  codexModal: $('codexModal'),
  codexGrid: $('codexGrid'),
  codexProgress: $('codexProgress'),
  guideModal: $('guideModal'),
  guideGrid: $('guideGrid'),
  log: $('log'),
  pills: $('pills'),
  toast: $('toast'),
  saveState: $('saveState'),
  saveFileInput: $('saveFileInput'),
  eventModal: $('eventModal'),
  eventTitle: $('eventTitle'),
  eventText: $('eventText'),
  eventChoices: $('eventChoices'),
  offlineModal: $('offlineModal'),
  offlineText: $('offlineText'),
  ascendModal: $('ascendModal'),
  ascendText: $('ascendText'),
  achvModal: $('achvModal'),
  achvGrid: $('achvGrid'),
  achvCount: $('achvCount'),
  achvProgress: $('achvProgress'),
  achvToast: $('achvToast'),
  achvToastIcon: $('achvToastIcon'),
  achvToastName: $('achvToastName'),
  rootBadge: $('rootBadge'),
  physiqueBadge: $('physiqueBadge'),
  dwellingLevel: $('dwellingLevel'),
  dwellingBonus: $('dwellingBonus'),
  dwellingCost: $('dwellingCost'),
  treasures: $('treasures'),
  signStreak: $('signStreak'),
  reincBonus: $('reincBonus'),
  quests: $('quests'),
  questDone: $('questDone'),
  pet: $('pet'),
  sect: $('sect'),
  energyText: $('energyText'),
  energyBar: $('energyBar'),
  dungeons: $('dungeons'),
  oreCount: $('oreCount'),
  fields: $('fields'),
  btnFieldUnlock: $('btnFieldUnlock'),
  fieldUnlockCost: $('fieldUnlockCost'),
  recipes: $('recipes'),
  travel: $('travel'),
  tower: $('tower'),
  boss: $('boss'),
  spouse: $('spouse'),
  combatPower: $('combatPower'),
  legacy: $('legacy'),
  legacyPoints: $('legacyPoints'),
  auction: $('auction'),
  auctionTimer: $('auctionTimer'),
  bodyBadge: $('bodyBadge'),
  bodyText: $('bodyText'),
  bodyBar: $('bodyBar'),
  bodyTrainCost: $('bodyTrainCost'),
  bodyBreakChance: $('bodyBreakChance'),
  talismans: $('talismans'),
  formations: $('formations'),
  war: $('war'),
  presText: $('presText'),
  presBonus: $('presBonus'),
  tourneyCd: $('tourneyCd'),
  disciples: $('disciples'),
  discipleCost: $('discipleCost'),
  xianCrystalText: $('xianCrystalText'),
  xianSeekCost: $('xianSeekCost'),
  xianTreasures: $('xianTreasures'),
  xianPets: $('xianPets'),
  xianOdds: $('xianOdds'),
  btnXianExchange: $('btnXianExchange'),
  xianBuyStep: $('xianBuyStep'),
  xianExchangeCost: $('xianExchangeCost'),
  celestialLine: $('celestialLine'),
  celestialCult: $('celestialCult'),
  celestialPet: $('celestialPet'),
  celestialPetCbt: $('celestialPetCbt'),
  xianArts: $('xianArts'),
  xianCodex: $('xianCodex'),
  btnXianTrial: $('btnXianTrial'),
  xianTrialInfo: $('xianTrialInfo'),
  xianTrialEnergy: $('xianTrialEnergy'),
  soulText: $('soulText'),
  btnBuySoul: $('btnBuySoul'),
  soulCost: $('soulCost'),
  chaosStatus: $('chaosStatus'),
  btnSummonChaos: $('btnSummonChaos'),
  chaosCostSoul: $('chaosCostSoul'),
  chaosCostXian: $('chaosCostXian'),
  chaosCostSoul2: $('chaosCostSoul2'),
  chaosCostXian2: $('chaosCostXian2'),
  xianSets: $('xianSets'),
  xianTower: $('xianTower'),
  xianTowerFloor: $('xianTowerFloor'),
  xianSpouse: $('xianSpouse'),
  xianSpouseBond: $('xianSpouseBond'),
  manorText: $('manorText'),
  manorStatus: $('manorStatus'),
  manorCost: $('manorCost'),
  manorCost2: $('manorCost2'),
  btnBuildManor: $('btnBuildManor'),
  petTrialInfo: $('petTrialInfo'),
  xianPetTrials: $('xianPetTrials'),
  rankTitleText: $('rankTitleText'),
  rankBoard: $('rankBoard'),
};

let lastRealmRendered = -1;
let prevXianUnlocked = -1;
let lastCodexSig = null;
let lastSetSig = null;
let lastTrialSig = null;
let lastFrame = performance.now();
let lastDomUpdate = 0;
const DOM_UPDATE_INTERVAL = 200;
let lastSaveAt = Date.now();
let lastAchieveCheck = 0;
let lastQuestDate = '';
let lastMarketDate = '';

let achvToastQueue = [];
let achvToastTimer = null;

/* ================= 日志 / Toast ================= */
function clearLog() {
  el.log.innerHTML = '';
}

function log(msg, cls = '') {
  const item = document.createElement('div');
  item.className = 'log-item' + (cls ? ' ' + cls : '');
  const now = new Date();
  const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  item.innerHTML = `<span class="t">[${ts}]</span>${escapeHtml(msg)}`;
  el.log.prepend(item);
  while (el.log.children.length > 60) el.log.removeChild(el.log.lastChild);
}

let toastTimer = null;
function toast(msg, cls = '') {
  el.toast.textContent = msg;
  el.toast.className = 'toast' + (cls ? ' ' + cls : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 2600);
}

/* ================= 成就提示 ================= */
function queueAchievementToast(icon, name) {
  achvToastQueue.push({ icon, name });
  if (!achvToastTimer) showNextAchievementToast();
}

function showNextAchievementToast() {
  const item = achvToastQueue.shift();
  if (!item) { achvToastTimer = null; return; }
  el.achvToastIcon.textContent = item.icon;
  el.achvToastName.textContent = item.name;
  el.achvToast.classList.remove('hidden', 'achv-toast-out');
  void el.achvToast.offsetWidth;
  clearTimeout(achvToastTimer);
  achvToastTimer = setTimeout(() => {
    el.achvToast.classList.add('achv-toast-out');
    setTimeout(() => {
      el.achvToast.classList.add('hidden');
      showNextAchievementToast();
    }, 420);
  }, 2600);
}

function renderAchievements() {
  el.achvGrid.innerHTML = '';
  const catOrder = ['境界', '修为', '财富', '功法', '历练'];
  for (const cat of catOrder) {
    const group = document.createElement('div');
    group.className = 'achv-cat';
    const header = document.createElement('div');
    header.className = 'achv-cat-title';
    header.textContent = cat;
    group.appendChild(header);
    const cards = document.createElement('div');
    cards.className = 'achv-cat-grid';
    ACHIEVEMENTS.filter(a => a.cat === cat).forEach(a => {
      const unlocked = state.achievementsUnlocked.includes(a.id);
      const card = document.createElement('div');
      card.className = 'achv-card' + (unlocked ? ' unlocked' : ' locked');
      card.innerHTML = `
        <div class="achv-icon">${a.icon}</div>
        <div class="achv-name">${a.name}</div>
        <div class="achv-desc">${unlocked ? a.desc : '尚未达成'}</div>`;
      cards.appendChild(card);
    });
    group.appendChild(cards);
    el.achvGrid.appendChild(group);
  }
  el.achvProgress.textContent = `${state.achievementsUnlocked.length} / ${ACHIEVEMENTS.length}`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function shakePanel() {
  el.realmPanel.classList.remove('shake');
  void el.realmPanel.offsetWidth; // 触发重排以重启动画
  el.realmPanel.classList.add('shake');
}

/* ================= 界面渲染 ================= */
function renderPills() {
  el.pills.innerHTML = '';
  for (const key of Object.keys(PILLS)) {
    const pill = PILLS[key];
    const card = document.createElement('div');
    card.className = 'pill-card';
    card.innerHTML = `
      <div class="pill-info">
        <div class="pill-name">${pill.name} <span class="pill-count">x${state.pills[key]}</span></div>
        <div class="pill-desc">${pill.desc}</div>
      </div>
      <div class="pill-actions">
        <button class="btn btn-secondary" data-use="${key}">服用</button>
        ${pill.craftOnly ? '' : `<button class="btn btn-ghost" data-buy="${key}">购买 <span data-cost="${key}"></span>灵石</button>`}
      </div>`;
    card.querySelector(`[data-use="${key}"]`).addEventListener('click', () => usePill(key));
    const buyBtn = card.querySelector(`[data-buy="${key}"]`);
    if (buyBtn) buyBtn.addEventListener('click', () => buyPill(key));
    el.pills.appendChild(card);
  }
  updatePillCosts();
}

function updatePillCosts() {
  for (const key of Object.keys(PILLS)) {
    const node = el.pills.querySelector(`[data-cost="${key}"]`);
    if (node) node.textContent = fmtInt(PILLS[key].cost(state.realm));
  }
}

function updatePillCounts() {
  const cards = el.pills.querySelectorAll('.pill-card');
  Object.keys(PILLS).forEach((key, i) => {
    if (cards[i]) {
      const count = cards[i].querySelector('.pill-count');
      count.textContent = 'x' + state.pills[key];
    }
  });
}

function rarityClass(rarity) {
  return { '凡品': 'rarity-fan', '中品': 'rarity-zhong', '上品': 'rarity-shang', '极品': 'rarity-ji', '仙品': 'rarity-xian' }[rarity] || '';
}

function renderTreasures() {
  el.treasures.innerHTML = '';
  for (const slot of Object.keys(TREASURES)) {
    const t = TREASURES[slot];
    const info = forgeInfo(slot);
    const slv = spiritLevel(slot);
    const card = document.createElement('div');
    card.className = 'treasure-card';
    card.innerHTML = `
      <div class="treasure-info">
        <div class="treasure-head">
          <span class="treasure-name">${t.name}</span>
          <span class="treasure-slot">${t.slot}</span>
          <span class="treasure-lv" data-lv="${slot}">未拥有</span>
        </div>
        <div class="treasure-desc">${t.desc}</div>
        <div class="treasure-affix" data-affix="${slot}">${info.affixes.length ? '词条 · ' + forgeAffixText(slot) : '尚未铭刻词条'}</div>
        <div class="treasure-quality" data-quality="${slot}">${forgeQuality(slot) > 0 ? `品阶 ${forgeQuality(slot)} 品 · 全属性 +${Math.round(forgeQuality(slot) * REFORGE_QUALITY * 100)}%` : '凡品法器'}</div>
      </div>
      <div class="treasure-actions">
        <button class="btn btn-secondary" data-treasure="${slot}"><span data-tbtn="${slot}">祭炼</span>（<span data-tcost="${slot}"></span> 灵石）</button>
        <button class="btn btn-ghost" data-forge="${slot}"><span data-fbtn="${slot}">淬炼</span>（精铁 <span data-fcost="${slot}"></span> · <span data-fscost="${slot}"></span> 灵石）</button>
      </div>
      <div class="treasure-actions refine-actions">
        <button class="btn btn-ghost" data-wash="${slot}">洗练（<span data-wcost="${slot}"></span> 灵石 · 精铁 ${WASH_COST_ORE}）</button>
        <button class="btn btn-ghost" data-reforge="${slot}"><span data-rbtn="${slot}">重铸</span>（<span data-rcost="${slot}"></span> 灵石）</button>
      </div>
      <div class="treasure-actions spirit-actions">
        <button class="btn btn-ghost" data-spirit="${slot}" ${slv >= SPIRIT_MAX ? 'disabled' : ''}>${slv > 0 ? `<span data-sbtn="${slot}">器灵 ${slv} 层</span>` : '<span data-sbtn="">器灵觉醒</span>'}（精铁 <span data-sore="${slot}">${spiritOreCost(slv)}</span> · <span data-sstone="${slot}">${spiritStoneCost(slv)}</span> 灵石）</button>
      </div>`;
    card.querySelector(`[data-treasure="${slot}"]`).addEventListener('click', () => upgradeTreasure(slot));
    card.querySelector(`[data-forge="${slot}"]`).addEventListener('click', () => {
      forgeTreasure(slot);
      renderTreasures();
      updateDOM();
    });
    card.querySelector(`[data-wash="${slot}"]`).addEventListener('click', () => {
      washTreasure(slot);
      renderTreasures();
      updateDOM();
    });
    card.querySelector(`[data-reforge="${slot}"]`).addEventListener('click', () => {
      reforgeTreasure(slot);
      renderTreasures();
      updateDOM();
    });
    const spiritBtn = card.querySelector(`[data-spirit="${slot}"]`);
    if (spiritBtn) {
      spiritBtn.disabled = info.tier < SPIRIT_AWAKEN_TIER || slv >= SPIRIT_MAX;
      spiritBtn.addEventListener('click', () => {
        awakenSpirit(slot);
        renderTreasures();
        updateDOM();
      });
    }
    el.treasures.appendChild(card);
  }
}

function hideReincButton() {
  $('btnReinc').classList.add('hidden');
}

/* ================= 每日任务 ================= */
function renderQuests() {
  ensureDaily();
  el.quests.innerHTML = '';
  let done = 0;
  for (const q of DAILY_QUESTS) {
    const prog = questProgress(q);
    const claimed = questClaimed(q);
    const complete = prog >= q.target;
    if (claimed) done++;
    const rewardText = [];
    if (q.reward.stones) rewardText.push(`${fmtInt(Math.floor(q.reward.stones * questStoneMult()))} 灵石`);
    for (const k of ['jq', 'pz', 'as']) {
      if (q.reward[k]) rewardText.push(`${PILLS[k].name} x${q.reward[k]}`);
    }
    const card = document.createElement('div');
    card.className = 'quest-card' + (complete ? ' complete' : '') + (claimed ? ' claimed' : '');
    card.setAttribute('data-qcard', q.id);
    card.innerHTML = `
      <div class="quest-info">
        <div class="quest-name">${q.name}<span class="quest-reward">奖励 ${rewardText.join('、')}</span></div>
        <div class="quest-desc" data-qtext="${q.id}">${q.desc.replace('{n}', q.target)}（${prog}/${q.target}）</div>
        <div class="bar track quest-track"><div class="bar fill quest-fill" data-qbar="${q.id}" style="width:${Math.round(prog / q.target * 100)}%"></div></div>
      </div>
      <button class="btn btn-secondary quest-btn" data-claim="${q.id}" ${!complete || claimed ? 'disabled' : ''}>${claimed ? '已领取' : '领取'}</button>`;
    card.querySelector(`[data-claim="${q.id}"]`).addEventListener('click', () => {
      claimQuest(q.id);
      renderQuests();
      updateDOM();
    });
    el.quests.appendChild(card);
  }
  el.questDone.textContent = `${done}/${DAILY_QUESTS.length}`;
}

/* ================= 灵宠 ================= */
function renderPet() {
  el.pet.innerHTML = '';
  if (!state.pet) {
    const wrap = document.createElement('div');
    wrap.className = 'pet-none';
    wrap.innerHTML = `
      <div class="pet-desc">仙途寂寥，可驯一只灵宠相伴。灵宠可为修炼增速，亦可在秘境中偶得。</div>
      <button class="btn btn-secondary pet-feed" data-capture>驯兽（${fmtInt(PET_CAPTURE_COST)} 灵石）</button>`;
    wrap.querySelector('[data-capture]').addEventListener('click', () => {
      capturePet();
      renderPet();
      updateDOM();
    });
    el.pet.appendChild(wrap);
    return;
  }
  const sp = PET_SPECIES[state.pet.speciesId];
  const need = petExpToNext();
  const talent = petTalent();
  const tier = petTier(state.pet.level);
  const maxed = state.pet.level >= petMaxLevel();
  const card = document.createElement('div');
  card.className = 'pet-card';
  card.innerHTML = `
    <div class="pet-head">
      <span class="pet-name ${rarityClass(sp.rarity)}">${sp.name}</span>
      <span class="pet-stage">${tier.name}</span>
      <span class="pet-lv">Lv.${state.pet.level}<span class="pet-max">/${petMaxLevel()}</span></span>
    </div>
    <div class="pet-talent">资质 · ${talent.name}　修炼加成 +${Math.round(petLevelBonus() * 100)}%/级</div>
    <div class="pet-desc">${sp.desc}</div>
    <div class="bar-label"><span>成长</span><span data-ptext>${state.pet.exp}/${need}</span></div>
    <div class="bar track pet-track"><div class="bar fill pet-fill" data-pbar style="width:${Math.min(100, state.pet.exp / need * 100)}%"></div></div>
    <button class="btn btn-secondary pet-feed" data-feed ${maxed ? 'disabled' : ''}>${maxed ? '已达资质极限' : '喂养（<span data-feedcost></span> 灵石）'}</button>
    <button class="btn btn-ghost pet-release" data-release>放生</button>
    <div class="pet-breed">
      <div class="sect-sub-title">血脉传承</div>
      ${state.petMate
        ? `<div class="pet-desc">伴侣 · ${PET_SPECIES[state.petMate.speciesId].name}（${PET_TALENTS[state.petMate.talent].name}），两情相悦，可孕育下一代。</div>
           <button class="btn btn-secondary pet-breed-btn" data-breed ${(state.spiritStones < PET_BREED_COST || petBreedLeft() > 0) ? 'disabled' : ''}>${petBreedLeft() > 0 ? `血脉调和（${petBreedLeft().toFixed(0)}s）` : `繁育后代（${fmtInt(PET_BREED_COST)} 灵石）`}</button>`
        : `<div class="pet-desc">仙宠孤身，可为其寻一位同属伴侣，共续血脉。</div>
           <button class="btn btn-secondary pet-breed-btn" data-seek ${state.spiritStones < PET_SEEK_COST ? 'disabled' : ''}>寻伴侣（${fmtInt(PET_SEEK_COST)} 灵石）</button>`}
    </div>`;
  card.querySelector('[data-feed]').addEventListener('click', () => {
    feedPet();
    renderPet();
    updateDOM();
  });
  card.querySelector('[data-release]').addEventListener('click', () => {
    if (confirm(`放生当前灵宠【${sp.name}】，将清空其成长，以便重新捕捉？确定放生吗？`)) {
      releasePet();
      renderPet();
      updateDOM();
    }
  });
  card.querySelector('[data-seek]')?.addEventListener('click', () => {
    seekPetMate();
    renderPet();
    updateDOM();
  });
  card.querySelector('[data-breed]')?.addEventListener('click', () => {
    breedPets();
    renderPet();
    updateDOM();
  });
  el.pet.appendChild(card);
}

/* ================= 宗门 ================= */
function renderSect() {
  el.sect.innerHTML = '';
  if (state.sectId == null) {
    const wrap = document.createElement('div');
    wrap.className = 'sect-join';
    const tip = document.createElement('div');
    tip.className = 'pet-desc';
    tip.textContent = '仙路漫漫，择一宗门栖身，可得宗门庇护。';
    wrap.appendChild(tip);
    for (const s of SECTS) {
      const b = document.createElement('button');
      b.className = 'btn btn-secondary sect-join-btn';
      b.setAttribute('data-join', SECTS.indexOf(s));
      b.innerHTML = `<b>${s.name}</b> — ${s.desc}（入宗费 ${fmtInt(s.joinCost)} 灵石）`;
      b.disabled = state.spiritStones < s.joinCost;
      b.addEventListener('click', () => {
        joinSect(SECTS.indexOf(s));
        renderSect();
        updateDOM();
      });
      wrap.appendChild(b);
    }
    el.sect.appendChild(wrap);
    return;
  }
  const s = SECTS[state.sectId];
  const next = sectRankNext();
  const card = document.createElement('div');
  card.className = 'sect-card';
  card.innerHTML = `
    <div class="sect-head">
      <span class="sect-name">${s.name}</span>
      <span class="sect-rank" data-rank>${sectRank()}</span>
    </div>
    <div class="sect-desc">${s.desc}</div>
    <div class="sect-row">宗门贡献 <b class="gold" data-contrib>${fmtInt(state.sectContribution)}</b>
      <span class="sect-rank-next">${next ? `距「${next.name}」还差 ${fmtInt(next.need - state.sectContribution)}` : '已达至高'}</span>
    </div>
    <div class="sect-row">宗门功法 <b class="gold">Lv.${state.sectTech}</b>
      <span class="sect-rank-next">+${Math.round(state.sectTech * 3)}% 修为 · +${Math.round(state.sectTech * 1.5)}% 灵石</span>
    </div>
    <div class="sect-actions">
      <button class="btn btn-secondary" data-donate="500">捐献 500 灵石</button>
      <button class="btn btn-secondary" data-donate="max">捐献最多</button>
      <button class="btn btn-secondary" data-tech>参悟功法（<span data-techcost>${fmtInt(sectTechCost())}</span> 贡献）</button>
    </div>`;
  card.querySelector('[data-donate="500"]').addEventListener('click', () => {
    donateSect(500);
    renderSect();
    updateDOM();
  });
  card.querySelector('[data-donate="max"]').addEventListener('click', () => {
    donateSect(state.spiritStones);
    renderSect();
    updateDOM();
  });
  card.querySelector('[data-tech]').addEventListener('click', () => {
    upgradeSectTech();
    renderSect();
    updateDOM();
  });
  el.sect.appendChild(card);

  // 职位晋升
  const posWrap = document.createElement('div');
  posWrap.className = 'sect-sub';
  const posObj = sectPositionObj();
  const posNext = sectPositionNext();
  posWrap.innerHTML = `<div class="sect-sub-title">职位 · ${posObj.name}</div>
    <div class="sect-desc">${posObj.desc}</div>
    <div class="sect-desc">职位加成 · 修炼+${Math.round(posObj.cult * 100)}% · 灵石+${Math.round(posObj.stones * 100)}% · 战力+${Math.round(posObj.combat * 100)}%</div>`;
  if (posNext) {
    const has = state.sectContribution >= posNext.cost;
    const realmOK = posNext.realm != null ? state.realm >= posNext.realm : true;
    const xianOK = posNext.xian != null ? (state.xianStage || 0) >= posNext.xian : true;
    const reqTxt = [];
    if (posNext.realm != null) reqTxt.push(`需 ${REALMS[posNext.realm].name}期`);
    if (posNext.xian != null) reqTxt.push(`需飞升仙${XIAN_REALMS[posNext.xian - 1].name}`);
    const b = document.createElement('button');
    b.className = 'btn btn-secondary sect-ex-btn';
    b.setAttribute('data-promote', '1');
    b.textContent = `晋升「${posNext.name}」（${fmtInt(posNext.cost)} 贡献）${reqTxt.length ? ' · ' + reqTxt.join(' + ') : ''}`;
    b.disabled = !has || !realmOK || !xianOK;
    b.addEventListener('click', () => {
      promoteSect();
      renderSect();
      updateDOM();
    });
    posWrap.appendChild(b);
  } else {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '已位居掌门，执掌宗门。';
    posWrap.appendChild(tip);
  }
  el.sect.appendChild(posWrap);

  // 宗门秘技
  const skWrap = document.createElement('div');
  skWrap.className = 'sect-sub';
  skWrap.innerHTML = `<div class="sect-sub-title">宗门秘技</div><div class="sect-skills"></div>`;
  const skList = skWrap.querySelector('.sect-skills');
  for (const sk of SECT_SKILLS) {
    const owned = (state.sectSkills || []).includes(sk.id);
    const b = document.createElement('button');
    b.className = 'btn btn-secondary sect-skill-btn' + (owned ? ' owned' : '');
    b.textContent = owned ? `✓ ${sk.name}` : `${sk.name}（${fmtInt(sk.cost)}）`;
    b.disabled = owned || state.sectContribution < sk.cost;
    b.title = sk.desc;
    b.addEventListener('click', () => {
      learnSectSkill(sk.id);
      renderSect();
      updateDOM();
    });
    skList.appendChild(b);
  }
  el.sect.appendChild(skWrap);

  // 贡献兑换
  const exWrap = document.createElement('div');
  exWrap.className = 'sect-sub';
  exWrap.innerHTML = `<div class="sect-sub-title">贡献兑换</div><div class="sect-exchanges"></div>`;
  const exList = exWrap.querySelector('.sect-exchanges');
  for (const ex of SECT_EXCHANGES) {
    const b = document.createElement('button');
    b.className = 'btn btn-secondary sect-ex-btn';
    b.textContent = `${ex.name}（${fmtInt(ex.cost)}）`;
    b.title = ex.desc;
    b.disabled = state.sectContribution < ex.cost;
    b.addEventListener('click', () => {
      exchangeSect(ex.id);
      renderSect();
      updateDOM();
    });
    exList.appendChild(b);
  }
  el.sect.appendChild(exWrap);

  // 宗门驻地 · 季赛
  const seaWrap = document.createElement('div');
  seaWrap.className = 'sect-sub';
  const prevReward = seasonReward();
  const claimable = seasonClaimablePrev();
  const defLeft = seasonDefendLeft();
  seaWrap.innerHTML = `<div class="sect-sub-title">宗门驻地 · 季赛</div>
    <div class="sect-desc">宗门驻地每逢季至，四方来犯。驻守御敌可积战功，季末按战功阶位结算灵石、贡献与威望。</div>
    <div class="sect-row">本赛季战功 <b class="gold">${fmtInt(state.seasonScore || 0)}</b>
      <span class="sect-rank-next">距「名动一方」还差 ${state.seasonScore >= 15 ? 0 : 15 - (state.seasonScore || 0)} 战功</span>
    </div>
    <div class="sect-row">本赛季剩余 <b id="seasonRemain">${fmtInt(seasonEndLeft())}</b> 秒
      <span class="sect-rank-next">上季战功${prevReward ? ' · 按「' + prevReward.label + '」结算' : ''}</span>
    </div>
    <div class="sect-actions" data-season-actions>
      <button class="btn btn-secondary" data-defend ${(state.energy || 0) < SEASON_ENERGY || defLeft > 0 ? 'disabled' : ''}>${defLeft > 0 ? `驻守休整（${defLeft.toFixed(0)}s）` : `驻守御敌（耗${SEASON_ENERGY}精力）`}</button>
      <button class="btn btn-warning" data-claim ${claimable ? '' : 'disabled'}>${claimable ? `结算上季捷报` : '本赛季无捷报可领'}</button>
    </div>`;
  const seaActions = seaWrap.querySelector('[data-season-actions]');
  const defBtn = seaActions.querySelector('[data-defend]');
  defBtn.addEventListener('click', () => {
    defendSect();
    renderSect();
    updateDOM();
  });
  seaActions.querySelector('[data-claim]').addEventListener('click', () => {
    claimSeason();
    renderSect();
    updateDOM();
  });
  // 赛季倒计时由主循环刷新
  seaWrap.querySelector('#seasonRemain').setAttribute('data-season-remain', '1');
  el.sect.appendChild(seaWrap);
}

/* ================= 战斗历练 ================= */
function renderTower() {
  el.tower.innerHTML = '';
  const floor = state.towerFloor || 1;
  const top = floor > TOWER_MAX;
  const title = towerTitle(floor - 1);
  const card = document.createElement('div');
  card.className = 'tower-card';
  card.innerHTML = `
    <div class="tower-head">
      <span class="tower-name">镇妖塔</span>
      <span class="tower-title">${title}</span>
    </div>
    <div class="tower-info">${top ? '已登峙塔顶，威震三界！' : `当前第 ${floor}/${TOWER_MAX} 层 · 击败守护妖兽可再上一层`}</div>
    <button class="btn btn-secondary tower-btn" data-tower ${top ? 'disabled' : ''}>${top ? '已登顶' : `挑战第 ${floor} 层`}</button>`;
  card.querySelector('[data-tower]').addEventListener('click', () => {
    challengeTower();
    renderTower();
    updateDOM();
  });
  el.tower.appendChild(card);
}

function renderBoss() {
  el.boss.innerHTML = '';
  const left = bossLeft();
  const card = document.createElement('div');
  card.className = 'boss-card';
  card.innerHTML = `
    <div class="boss-head">
      <span class="boss-name">周天妖王</span>
      <span class="boss-req">${left > 0 ? `休整 ${Math.ceil(left)}s` : '可挑战'}</span>
    </div>
    <div class="boss-info">妖王凶威盖世，击败可得大量灵石与宗门贡献 · 冷却 ${BOSS_CD}s</div>
    <button class="btn btn-secondary boss-btn" data-boss ${left > 0 ? 'disabled' : ''}>挑战妖王</button>`;
  card.querySelector('[data-boss]').addEventListener('click', () => {
    fightBoss();
    renderBoss();
    updateDOM();
  });
  el.boss.appendChild(card);
}

/* ================= 道侣双修 ================= */
function renderSpouse() {
  el.spouse.innerHTML = '';
  if (state.spouse == null) {
    const card = document.createElement('div');
    card.className = 'spouse-card';
    card.innerHTML = `
      <div class="spouse-desc">仙路漫漫，孑然一身。觅一道侣，双修益增。</div>
      <div class="spouse-list">${SPAUSES.map(s => `<div class="spouse-opt">${s.name} · 双修 +${Math.round(s.cult * 100)}%</div>`).join('')}</div>
      <button class="btn btn-secondary spouse-btn" data-adopt ${state.spiritStones < SPOUSE_COST ? 'disabled' : ''}>觅觅良缘（${fmtInt(SPOUSE_COST)} 灵石）</button>`;
    card.querySelector('[data-adopt]').addEventListener('click', () => {
      adoptSpouse();
      renderSpouse();
      updateDOM();
    });
    el.spouse.appendChild(card);
    return;
  }
  const s = SPAUSES[state.spouse];
  const left = dualLeft();
  const card = document.createElement('div');
  card.className = 'spouse-card';
  card.innerHTML = `
    <div class="spouse-head">
      <span class="spouse-name">${s.name}</span>
      <span class="spouse-req">${left > 0 ? `温养 ${Math.ceil(left)}s` : '可双修'}</span>
    </div>
    <div class="spouse-desc">${s.desc} · 修炼速度 +${Math.round(s.cult * 100)}%</div>
    <button class="btn btn-secondary spouse-btn" data-dual ${left > 0 ? 'disabled' : ''}>双修（冷却 ${SPOUSE_CD}s）</button>`;
  card.querySelector('[data-dual]').addEventListener('click', () => {
    dualCultivate();
    renderSpouse();
    updateDOM();
  });
  el.spouse.appendChild(card);
}

/* ================= 传承道统 ================= */
function renderLegacy() {
  el.legacy.innerHTML = '';
  el.legacyPoints.textContent = `传承点 ${state.legacyPoints || 0}`;
  const owned = state.legacyRunes || [];
  const grid = document.createElement('div');
  grid.className = 'legacy-grid';
  for (const r of LEGACY_RUNES) {
    const has = owned.includes(r.id);
    const b = document.createElement('button');
    b.className = 'legacy-rune' + (has ? ' lit' : '');
    b.title = r.desc;
    b.disabled = has || (state.legacyPoints || 0) < r.cost;
    b.innerHTML = `${has ? '✦' : '·'} ${r.name}<br><span class="legacy-sub">${r.cost} 传承点 · ${has ? '已亮' : r.desc.replace(/永久 · /, '')}</span>`;
    b.addEventListener('click', () => {
      lightRune(r.id);
      renderLegacy();
      updateDOM();
    });
    grid.appendChild(b);
  }
  el.legacy.appendChild(grid);
}

/* ================= 拍卖行 ================= */
function renderAuction() {
  ensureAuction();
  el.auction.innerHTML = '';
  const left = auctionLeft();
  el.auctionTimer.textContent = left > 0 ? `${Math.ceil(left)}s 刷新` : '结算中';
  const list = state.auction.list || [];
  if (!list.length) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '本轮拍品已售罄，静待下一轮。';
    el.auction.appendChild(tip);
    return;
  }
  list.forEach((item, idx) => {
    const def = AUCTION_POOL.find(x => x.key === item.key);
    const card = document.createElement('div');
    card.className = 'auction-card';
    card.innerHTML = `
      <div class="auction-head">
        <span class="auction-name">${def ? def.name : item.key}</span>
        <span class="auction-price">${fmtInt(item.price)} 灵石</span>
      </div>
      <button class="btn btn-secondary auction-btn" data-auction="${idx}" ${state.spiritStones < item.price ? 'disabled' : ''}>竞拍</button>`;
    card.querySelector(`[data-auction="${idx}"]`).addEventListener('click', () => {
      auctionBuy(idx);
      renderAuction();
      updateDOM();
    });
    el.auction.appendChild(card);
  });
}

/* ================= 炼体境界 ================= */
function renderBody() {
  const cur = bodyRealmObj();
  const next = bodyNextRealm();
  el.bodyBadge.textContent = cur.name;
  const req = next ? next.req : cur.req;
  el.bodyText.textContent = next ? `${fmtInt(state.bodyCult || 0)} / ${fmtInt(next.req)}` : `${fmtInt(state.bodyCult)} · 已圆满`;
  el.bodyBar.style.width = next ? Math.min(100, (state.bodyCult || 0) / next.req * 100) + '%' : '100%';
  el.bodyBar.classList.toggle('full', next ? (state.bodyCult || 0) >= next.req : true);
  el.bodyTrainCost.textContent = fmtInt(bodyTrainCost());
  $('btnBodyTrain').disabled = state.spiritStones < bodyTrainCost();
  const canBreak = next && (state.bodyCult || 0) >= next.req;
  $('btnBodyBreak').disabled = !canBreak;
  el.bodyBreakChance.textContent = canBreak && next ? `（${Math.round(bodyBreakChance())}% · 需 ${fmtInt(next.req)}）` : (next ? `（需 ${fmtInt(next.req)}）` : '');
}
function bodyBreakChance() { return BODY_REALMS[(state.bodyRealm || 0) + 1] ? BODY_REALMS[(state.bodyRealm || 0) + 1].chance : 0; }

/* ================= 符箓 ================= */
function renderTalismans() {
  el.talismans.innerHTML = '';
  for (const t of TALISMANS) {
    const card = document.createElement('div');
    card.className = 'talisman-card';
    const mat = Object.entries(t.herbs).map(([h, n]) => `${HERBS.find(x => x.id === h).name} x${n}`).join(' + ') + (t.ore ? ` + 精铁 ${t.ore}` : '');
    const afford = talismanAfford(t);
    const owned = state.talismans[t.id] || 0;
    const b = state.talismanBuffs[t.id];
    let active = '';
    if (t.dur) active = (b && b > Date.now()) ? '· 生效中' : '';
    else if (t.times) active = (b && b > 0) ? `· 剩${b}次` : '';
    card.innerHTML = `
      <div class="talisman-head">
        <span class="talisman-name">${t.name}</span>
        <span class="talisman-held x${owned}">持有 x${owned}</span>
      </div>
      <div class="talisman-desc">${t.desc}${active}</div>
      <div class="talisman-actions">
        <button class="btn btn-secondary" data-tcraft="${t.id}" ${afford ? '' : 'disabled'}>炼制（${fmtInt(t.stone)} 灵石）</button>
        <button class="btn btn-ghost" data-tact="${t.id}" ${owned > 0 ? '' : 'disabled'}>祭出</button>
      </div>`;
    card.querySelector(`[data-tcraft="${t.id}"]`).addEventListener('click', () => { craftTalisman(t.id); renderTalismans(); updateDOM(); });
    card.querySelector(`[data-tact="${t.id}"]`).addEventListener('click', () => { activateTalisman(t.id); renderTalismans(); updateDOM(); });
    el.talismans.appendChild(card);
  }
}

/* ================= 阵法 ================= */
function renderFormations() {
  el.formations.innerHTML = '';
  for (const f of FORMATIONS) {
    const lv = state.formations[f.id] || 0;
    const cost = formationCost(f);
    const card = document.createElement('div');
    card.className = 'formation-card';
    card.innerHTML = `
      <div class="formation-head">
        <span class="formation-name">${f.name}</span>
        <span class="formation-lv">${lv}/${FORM_MAX} 阶</span>
      </div>
      <div class="formation-desc">${f.desc} · 当前 ${Math.round(lv * f.per * 100)}%</div>
      <button class="btn btn-secondary" data-up="${f.id}" ${lv >= FORM_MAX || state.spiritStones < cost ? 'disabled' : ''}>升级（${fmtInt(cost)} 灵石）</button>`;
    card.querySelector(`[data-up="${f.id}"]`).addEventListener('click', () => { upgradeFormation(f.id); renderFormations(); updateDOM(); });
    el.formations.appendChild(card);
  }
}

/* ================= 收徒 ================= */
function renderDisciples() {
  el.disciples.innerHTML = '';
  const arr = state.disciples || [];
  if (!arr.length) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '门下尚无弟子，可去坊市访觅良才。';
    el.disciples.appendChild(tip);
  }
  arr.forEach((d, i) => {
    const q = discipleQuality(d);
    const left = discipleTrainLeft(d);
    const cost = discipleTrainCost(d);
    const card = document.createElement('div');
    card.className = 'disciple-card';
    card.innerHTML = `
      <div class="disciple-head">
        <span class="disciple-name">${d.name}</span>
        <span class="disciple-q">${q.name} Lv.${d.level}</span>
      </div>
      <div class="disciple-desc">修炼 +${Math.round(q.cult * d.level * 100)}% · 战力 +${Math.round(q.combat * d.level)}</div>
      <div class="disciple-actions">
        <button class="btn btn-secondary" data-dtrain="${i}" ${left > 0 || state.spiritStones < cost ? 'disabled' : ''}>授业（${fmtInt(cost)} 灵石）</button>
        <button class="btn btn-ghost" data-drel="${i}">出师 <span class="disciple-cd">${left > 0 ? `${Math.ceil(left)}s` : ''}</span></button>
      </div>`;
    card.querySelector(`[data-dtrain="${i}"]`).addEventListener('click', () => { discipleTrain(i); renderDisciples(); updateDOM(); });
    card.querySelector(`[data-drel="${i}"]`).addEventListener('click', () => { discipleRelease(i); renderDisciples(); updateDOM(); });
    el.disciples.appendChild(card);
  });
  el.discipleCost.textContent = fmtInt(DISCIPLE_COST);
  $('btnDisciple').disabled = arr.length >= DISCIPLE_SLOTS || state.spiritStones < DISCIPLE_COST;
}

/* ================= 宗门大比 · 敌宗 ================= */
function renderWar() {
  el.war.innerHTML = '';
  for (const e of ENEMY_SECTS) {
    const card = document.createElement('div');
    card.className = 'war-card';
    card.innerHTML = `
      <div class="war-head">
        <span class="war-name">${e.name}</span>
        <span class="war-req">敌势 ${Math.round(e.mult * 100)}%</span>
      </div>
      <div class="war-desc">${e.desc} · 耗时 5 精力</div>
      <button class="btn btn-secondary" data-raid="${ENEMY_SECTS.indexOf(e)}" ${state.sectId != null && (state.energy || 0) >= 5 ? '' : 'disabled'}>讨伐</button>`;
    card.querySelector(`[data-raid="${ENEMY_SECTS.indexOf(e)}"]`).addEventListener('click', () => { raidEnemy(ENEMY_SECTS.indexOf(e)); renderWar(); updateDOM(); });
    el.war.appendChild(card);
  }
  const pres = Math.min(state.sectPrestige || 0, SECT_PRES_MAX);
  el.presText.textContent = pres + ' / ' + SECT_PRES_MAX;
  el.presBonus.textContent = '+' + Math.round(pres * 2) + '%';
  $('btnTourney').disabled = state.sectId == null || tourneyLeft() > 0 || (state.sectContribution || 0) < 500;
  el.tourneyCd.textContent = tourneyLeft() > 0 ? ` · ${Math.ceil(tourneyLeft())}s` : '';
}

/* ================= 仙器 & 仙宠（仙界专属） ================= */
function renderXianTreasures() {
  const unlocked = xianUnlocked();
  el.xianCrystalText.textContent = '仙晶 ' + fmtInt(state.xianCrystal || 0);
  el.xianTreasures.innerHTML = '';
  if (!unlocked) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '尚未飞升仙界，仙器阁尘封未启。';
    el.xianTreasures.appendChild(tip);
    return;
  }
  const mastery = xianTreasureMastery();
  const masterCard = document.createElement('div');
  masterCard.className = 'talisman-card' + (mastery === XIAN_TREASURES.length ? ' mastery' : '');
  masterCard.innerHTML = `
    <div class="talisman-head">
      <span class="talisman-name">仙器之威</span>
      <span class="talisman-held">大成 ${mastery}/${XIAN_TREASURES.length}</span>
    </div>
    <div class="talisman-desc">每件仙器满阶：修炼 +5%、战力 +8%（累计）${mastery > 0 ? ` · 当前修炼 +${mastery * 5}% / 战力 +${mastery * 8}%` : ''}</div>`;
  el.xianTreasures.appendChild(masterCard);
  for (const t of XIAN_TREASURES) {
    const lv = state.xianTreasures[t.id] || 0;
    const cost = xianTreasureCost(t);
    const reqOK = (state.xianStage || 0) >= t.xian;
    const full = lv >= t.max;
    const shen = state.xianShen && state.xianShen[t.id] ? state.xianShen[t.id] : 0;
    const eff = Math.round(lv * t.per * (1 + shen * XIAN_SHEN_POWER) * 100);
    const shenFull = full && shen >= XIAN_SHEN_MAX;
    const shenCost = shenForgeCost(t.id);
    const card = document.createElement('div');
    card.className = 'talisman-card' + (full ? ' mastery' : '');
    card.innerHTML = `
      <div class="talisman-head">
        <span class="talisman-name">${t.name}${shen > 0 ? `<i class="shen-badge">仙品${shen}</i>` : ''}</span>
        <span class="talisman-held">${lv}/${t.max} 阶</span>
      </div>
      <div class="talisman-desc">${t.desc} · 当前 ${eff}%${reqOK ? '' : ` · 需${XIAN_REALMS[t.xian - 1].name}`}</div>
      <div class="disciple-actions">
        <button class="btn btn-secondary" data-xforge="${t.id}" ${full || !reqOK || state.xianCrystal < cost ? 'disabled' : ''}>锻造（${fmtInt(cost)} 仙晶）</button>
        ${full && !shenFull ? `<button class="btn btn-warning" data-xshen="${t.id}" ${state.xianSoul < shenCost.soul || state.xianCrystal < shenCost.xian ? 'disabled' : ''}>神铸（${shenCost.xian}仙晶+${shenCost.soul}精魄）</button>` : ''}
      </div>`;
    card.querySelector(`[data-xforge="${t.id}"]`).addEventListener('click', () => { forgeXianTreasure(t.id); renderXianTreasures(); updateDOM(); });
    const sb = card.querySelector(`[data-xshen="${t.id}"]`);
    if (sb) sb.addEventListener('click', () => { shenForgeArtifact(t.id); renderXianTreasures(); renderXianSoul(); updateDOM(); });
    el.xianTreasures.appendChild(card);
  }
}

function renderXianPets() {
  const unlocked = xianUnlocked();
  $('btnSeekXianPet').disabled = !unlocked || (state.xianPets || []).length >= XIAN_PET_MAX || (state.xianCrystal || 0) < XIAN_PET_CAPTURE;
  el.xianSeekCost.textContent = fmtInt(XIAN_PET_CAPTURE);
  el.xianPets.innerHTML = '';
  const totalW = XIAN_PET_SPECIES.reduce((s, sp) => s + sp.weight, 0);
  el.xianOdds.textContent = '寻访概率：' + XIAN_PET_SPECIES.map(sp => `${sp.name}${Math.round(sp.weight / totalW * 100)}%`).join(' / ');
  if (!unlocked) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '仙兽谷隐于云端，待你飞升后访寻。';
    el.xianPets.appendChild(tip);
    return;
  }
  const arr = state.xianPets || [];
  if (!arr.length) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '谷中尚无灵兽，且去访寻一番。';
    el.xianPets.appendChild(tip);
  }
  arr.forEach((p, i) => {
    const sp = p.chaos ? XIAN_CHAOS : XIAN_PET_SPECIES[p.species];
    const cost = xianPetFeedCost(p);
    const lv = p.level || 1;
    const refund = Math.floor(XIAN_PET_FEED * (lv - 1) * lv / 2 * 0.4);
    const maxLv = xianPetMaxLevel(p);
    const canEvolve = !p.chaos && !p.evolved && lv >= XIAN_PET_MAX_LEVEL && (state.xianSoul || 0) >= XIAN_EVOLVE_SOUL && (state.xianCrystal || 0) >= XIAN_EVOLVE_XIAN;
    const card = document.createElement('div');
    card.className = 'disciple-card' + (p.chaos ? ' chaos' : '') + (p.evolved ? ' evolved' : '');
    card.innerHTML = `
      <div class="disciple-head">
        <span class="disciple-name">${sp.name}${p.evolved ? '<i class="shen-badge">觉醒</i>' : ''}</span>
        <span class="disciple-q">${p.chaos ? '上古神兽' : '传说'} Lv.${p.level}</span>
      </div>
      <div class="disciple-desc">修炼 +${Math.round((p.chaos ? sp.cult : sp.cult * (p.evolved ? XIAN_EVOLVE_MULT : 1)) * lv * 100)}% · 战力 +${Math.floor((p.chaos ? sp.combat : sp.combat * (p.evolved ? XIAN_EVOLVE_MULT : 1)) * lv)}</div>
      <div class="disciple-actions">
        ${p.chaos ? '' : `<button class="btn btn-secondary" data-xfeed="${i}" ${p.level >= maxLv || state.xianCrystal < cost ? 'disabled' : ''}>滋养（${fmtInt(cost)} 仙晶）</button>`}
        ${p.chaos ? '' : `<button class="btn btn-warning" data-xevo="${i}" ${!canEvolve ? 'disabled' : ''}>血脉觉醒（${XIAN_EVOLVE_XIAN}仙晶+${XIAN_EVOLVE_SOUL}精魄）</button>`}
        ${p.chaos ? '' : `<button class="btn btn-ghost" data-xrel="${i}" title="${refund > 0 ? `放归可回还 ${refund} 仙晶` : ''}">放归${refund > 0 ? ` +${fmtInt(refund)}` : ''}</button>`}
      </div>`;
    const feedBtn = card.querySelector(`[data-xfeed="${i}"]`);
    if (feedBtn) feedBtn.addEventListener('click', () => { feedXianPet(i); renderXianPets(); renderXianSoul(); updateDOM(); });
    const evoBtn = card.querySelector(`[data-xevo="${i}"]`);
    if (evoBtn) evoBtn.addEventListener('click', () => { evolveXianPet(i); renderXianPets(); renderXianSoul(); updateDOM(); });
    const relBtn = card.querySelector(`[data-xrel="${i}"]`);
    if (relBtn) relBtn.addEventListener('click', () => { releaseXianPet(i); renderXianPets(); renderXianSoul(); updateDOM(); });
    el.xianPets.appendChild(card);
  });
}

function renderXianExchange() {
  const need = XIAN_CRYSTAL_RATE * XIAN_CRYSTAL_BUY_STEP;
  el.xianBuyStep.textContent = XIAN_CRYSTAL_BUY_STEP;
  el.xianExchangeCost.textContent = fmtInt(need);
  el.btnXianExchange.disabled = !xianUnlocked() || (state.spiritStones || 0) < need;
}

function renderXianSoul() {
  el.soulText.textContent = '精魄 ' + fmtInt(state.xianSoul || 0);
  el.soulCost.textContent = XIAN_SOUL_RATE;
  el.btnBuySoul.disabled = !xianUnlocked() || (state.xianCrystal || 0) < XIAN_SOUL_RATE;
  const chaos = chaosOwned();
  el.chaosCostSoul.textContent = XIAN_CHAOS_SOUL;
  el.chaosCostXian.textContent = fmtInt(XIAN_CHAOS_XIAN);
  el.chaosCostSoul2.textContent = XIAN_CHAOS_SOUL;
  el.chaosCostXian2.textContent = fmtInt(XIAN_CHAOS_XIAN);
  el.chaosStatus.innerHTML = chaos
    ? '已契约 · 混沌威临，修炼 +' + Math.round(XIAN_CHAOS.cult * 100) + '% · 战力 +' + XIAN_CHAOS.combat
    : `未契约 · 需 <b>${XIAN_CHAOS_SOUL}</b> 精魄 + <b>${fmtInt(XIAN_CHAOS_XIAN)}</b> 仙晶`;
  el.btnSummonChaos.disabled = !xianUnlocked() || chaos || (state.xianSoul || 0) < XIAN_CHAOS_SOUL || (state.xianCrystal || 0) < XIAN_CHAOS_XIAN || (state.xianPets || []).length >= XIAN_PET_MAX;
}

function renderXianSets() {
  el.xianSets.innerHTML = '';
  if (!xianUnlocked()) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '仙器套装之秘，需飞升仙界后方可参悟。';
    el.xianSets.appendChild(tip);
    return;
  }
  for (const s of XIAN_SETS) {
    const active = xianSetActive(s.id);
    const details = s.members.map(m => {
      const shen = state.xianShen && state.xianShen[m] ? state.xianShen[m] : 0;
      const t = XIAN_TREASURES.find(x => x.id === m);
      return `<span class="${shen >= s.minShen ? 'ok' : 'dim'}">${t.name}·仙品${shen}/${s.minShen}</span>`;
    }).join('　');
    const card = document.createElement('div');
    card.className = 'talisman-card' + (active ? ' mastery' : '');
    card.innerHTML = `
      <div class="talisman-head">
        <span class="talisman-name">${s.name}${active ? '<i class="shen-badge">已激活</i>' : ''}</span>
        <span class="talisman-held">${active ? '威能齐发' : '未激活'}</span>
      </div>
      <div class="talisman-desc">${details}</div>
      <div class="talisman-desc">${s.desc}</div>`;
    el.xianSets.appendChild(card);
  }
}

function renderXianTower() {
  const floor = state.xianTowerFloor || 1;
  el.xianTowerFloor.textContent = floor > XIAN_TOWER_MAX ? '已登顶' : `${floor}/${XIAN_TOWER_MAX} 重`;
  el.xianTower.innerHTML = '';
  if (!xianUnlocked()) {
    el.xianTower.innerHTML = '<div class="auction-none">飞升仙界后方可踏入镇界塔。</div>';
    return;
  }
  if (floor > XIAN_TOWER_MAX) {
    el.xianTower.innerHTML = `<div class="talisman-card mastery"><div class="talisman-head"><span class="talisman-name">镇界之主</span><span class="talisman-held">三十重登顶</span></div><div class="talisman-desc">你已镇压三十重守界者，俯瞰诸天。</div></div>`;
    return;
  }
  const enemy = xianTowerEnemy(floor);
  const left = state.energy || 0;
  const can = left >= XIAN_TOWER_ENERGY;
  const card = document.createElement('div');
  card.className = 'talisman-card';
  card.innerHTML = `<div class="talisman-head"><span class="talisman-name">第 ${floor} 重 · ${xianTowerTitle(floor)}</span><span class="talisman-held">精力 ${left}/${ENERGY_MAX}</span></div><div class="talisman-desc">守界者战力约 ${fmtInt(enemy.atk)} · 生命 ${fmtInt(enemy.hp)}</div><div class="talisman-desc">胜利：仙晶 ${fmtInt(60 + floor * 30 + (state.xianStage || 1) * 20)}、精魄 ${Math.floor(1 + floor / 10)}；失败仍可得少量仙晶</div><button class="btn btn-secondary" data-xian-tower ${can ? '' : 'disabled'}>挑战镇界塔（耗 ${XIAN_TOWER_ENERGY} 精力）</button>`;
  card.querySelector('[data-xian-tower]').addEventListener('click', () => { challengeXianTower(); renderXianTower(); renderXianPets(); renderXianSoul(); updateDOM(); });
  el.xianTower.appendChild(card);
}

function renderXianSpouse() {
  const sp = xianSpouse();
  el.xianSpouse.innerHTML = '';
  el.xianSpouseBond.textContent = sp ? `情缘 ${state.xianBond || 0}/${XIAN_BOND_MAX}` : '';
  if (!xianUnlocked()) {
    el.xianSpouse.innerHTML = '<div class="auction-none">飞升仙界后方可结缘仙侣。</div>';
    return;
  }
  if (sp) {
    const left = xianDualLeft();
    const card = document.createElement('div');
    card.className = 'talisman-card mastery';
    card.innerHTML = `<div class="talisman-head"><span class="talisman-name">${sp.name}</span><span class="talisman-held">已结缘</span></div><div class="talisman-desc">${sp.desc} · 当前修炼 +${Math.round((xianSpouseFactor() - 1) * 100)}%</div><div class="talisman-desc">情缘 ${state.xianBond || 0}/${XIAN_BOND_MAX} · 双修获得当前境界修为 35%</div><button class="btn btn-secondary" data-xian-dual ${left > 0 || (state.energy || 0) < XIAN_DUAL_ENERGY ? 'disabled' : ''}>${left > 0 ? `双修冷却 ${left}s` : `双修（耗 ${XIAN_DUAL_ENERGY} 精力）`}</button>`;
    card.querySelector('[data-xian-dual]').addEventListener('click', () => { xianDualCultivate(); renderXianSpouse(); updateDOM(); });
    el.xianSpouse.appendChild(card);
    return;
  }
  for (const item of XIAN_SPOUSES) {
    const card = document.createElement('div');
    const can = (state.xianCrystal || 0) >= item.xian && (state.xianSoul || 0) >= item.soul;
    card.className = 'talisman-card';
    card.innerHTML = `<div class="talisman-head"><span class="talisman-name">${item.name}</span><span class="talisman-held">修炼 +${Math.round(item.cult * 100)}%</span></div><div class="talisman-desc">${item.desc}</div><div class="talisman-desc">结缘：${fmtInt(item.xian)} 仙晶 + ${item.soul} 精魄</div><button class="btn btn-secondary" data-xian-spouse="${item.id}" ${can ? '' : 'disabled'}>结缘</button>`;
    card.querySelector('[data-xian-spouse]').addEventListener('click', () => { bondXianSpouse(item.id); renderXianSpouse(); renderXianSoul(); updateDOM(); });
    el.xianSpouse.appendChild(card);
  }
}

function renderXianManor() {
  const lv = state.xianManor || 0;
  el.manorText.textContent = `仙府 ${lv}/${XIAN_MANOR_MAX} 层`;
  el.manorCost.textContent = fmtInt(xianManorCost());
  el.manorCost2.textContent = fmtInt(xianManorCost());
  if (lv >= XIAN_MANOR_MAX) {
    el.manorStatus.textContent = `仙府已臻极致 · 产出 ${xianManorRate()}/时 仙晶`;
    el.btnBuildManor.disabled = true;
    return;
  }
  el.manorStatus.textContent = lv === 0
    ? `未开辟 · 需 ${fmtInt(xianManorCost())} 仙晶，开辟后产出 ${xianManorRate()} 仙晶/时`
    : `已辟 ${lv} 层 · 产出 ${xianManorRate()} 仙晶/时（积攒 ${fmtInt(XIAN_MANOR_SOUL_PER)} 仙晶凝 1 精魄）`;
  el.btnBuildManor.disabled = !xianUnlocked() || (state.xianCrystal || 0) < xianManorCost();
}

function renderXianPetTrials() {
  xianPetTrialDaily();
  el.petTrialInfo.textContent = `今日 ${state.xianPetTrialCount}/${XIAN_PET_TRIAL_DAILY}`;
  el.xianPetTrials.innerHTML = '';
  if (!xianUnlocked()) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '仙兽试炼场隐于云端，飞升仙界后方可令仙兽出战。';
    el.xianPetTrials.appendChild(tip);
    return;
  }
  const arr = state.xianPets || [];
  if (!arr.length) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '谷中尚无仙兽，且去仙兽谷访寻一番。';
    el.xianPetTrials.appendChild(tip);
  }
  arr.forEach((p, i) => {
    const sp = p.chaos ? XIAN_CHAOS : XIAN_PET_SPECIES[p.species];
    const left = xianPetTrialLeft(i);
    const power = xianPetPower(p);
    const canGo = left <= 0 && state.xianPetTrialCount < XIAN_PET_TRIAL_DAILY && (state.energy || 0) >= XIAN_PET_TRIAL_ENERGY;
    const card = document.createElement('div');
    card.className = 'disciple-card';
    card.innerHTML = `
      <div class="disciple-head">
        <span class="disciple-name">${sp.name}</span>
        <span class="disciple-q">战力 ${fmtInt(power)}</span>
      </div>
      <div class="disciple-desc">胜者得 ${XIAN_PET_TRIAL_CRYSTAL + (p.level || 1) * 15}~ 仙晶、${XIAN_PET_TRIAL_SOUL + Math.floor((p.level || 1) / 15)} 精魄</div>
      <div class="disciple-actions">
        <button class="btn btn-secondary" data-xtrial="${i}" ${canGo ? '' : 'disabled'}>出战试炼（耗 ${XIAN_PET_TRIAL_ENERGY} 精力）</button>
        ${left > 0 ? `<span class="disciple-q">休整 ${left}s</span>` : ''}
      </div>`;
    card.querySelector(`[data-xtrial="${i}"]`).addEventListener('click', () => { xianPetTrial(i); renderXianPetTrials(); renderXianSoul(); renderXianPets(); updateDOM(); });
    el.xianPetTrials.appendChild(card);
  });
}

function renderXianRank() {
  const title = rankTitle();
  el.rankTitleText.textContent = title.name;
  const boards = [
    { key: 'power', label: '战力榜', player: combatPower(), fmt: v => fmt(v) },
    { key: 'realm', label: '境界榜', player: xianRealmScore(), fmt: v => fmt(Math.round(v)) },
    { key: 'collect', label: '收藏榜', player: xianCollectScore(), fmt: v => fmt(Math.round(v)) },
  ];
  el.rankBoard.innerHTML = '';
  for (const b of boards) {
    const rows = rankBoard(b.key, b.player);
    const head = document.createElement('div');
    head.className = 'panel-subtitle';
    head.textContent = b.label;
    el.rankBoard.appendChild(head);
    rows.slice(0, 10).forEach((r, idx) => {
      const row = document.createElement('div');
      row.className = 'rank-row' + (r.me ? ' me' : '');
      row.innerHTML = `
        <span class="rank-no ${idx < 3 ? 'top' : ''}">${idx + 1}</span>
        <span class="rank-name">${r.name}</span>
        <span class="rank-val">${b.fmt(r.val)}</span>`;
      el.rankBoard.appendChild(row);
    });
  }
  const tt = RANK_TITLES.find(t => t.name === title.name);
  if (tt) {
    const tip = document.createElement('div');
    tip.className = 'divine-tip';
    tip.textContent = '当前称号：' + title.name + '（' + tt.desc + '）';
    el.rankBoard.appendChild(tip);
  }
}

function renderXianLine() {
  if (!xianUnlocked()) { el.celestialLine.classList.add('hidden'); return; }
  el.celestialLine.classList.remove('hidden');
  const cultT = Math.round((xianTreasureFactor('cult') + xianArtFactor('cult')) * 100)
    + xianTreasureMastery() * XIAN_MASTERY_CULT * 100
    + xianCodexAbil() * XIAN_CODEX_CULT * 100;
  el.celestialCult.textContent = '+' + cultT + '%';
  el.celestialPet.textContent = '+' + Math.round(xianPetCultBonus() * 100) + '%';
  el.celestialPetCbt.textContent = '+' + fmtInt(xianPetCombat());
}

function renderXianArts() {
  el.xianArts.innerHTML = '';
  if (!xianUnlocked()) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '参悟道藏需先飞升仙界。';
    el.xianArts.appendChild(tip);
    return;
  }
  for (const a of XIAN_ARTS) {
    const owned = xianArtOwned(a.id);
    const reqOK = (state.xianStage || 0) >= a.xian;
    const card = document.createElement('div');
    card.className = 'talisman-card' + (owned ? ' mastery' : '');
    card.innerHTML = `
      <div class="talisman-head">
        <span class="talisman-name">${a.name}</span>
        <span class="talisman-held">${owned ? '已参悟' : '未参悟'}</span>
      </div>
      <div class="talisman-desc">${a.desc}${reqOK ? '' : ` · 需${XIAN_REALMS[a.xian - 1].name}`}</div>
      <button class="btn btn-secondary" data-xart="${a.id}" ${owned || !reqOK || state.xianCrystal < a.cost ? 'disabled' : ''}>参悟（${fmtInt(a.cost)} 仙晶）</button>`;
    card.querySelector(`[data-xart="${a.id}"]`).addEventListener('click', () => { buyXianArt(a.id); renderXianArts(); updateDOM(); });
    el.xianArts.appendChild(card);
  }
}

function renderXianCodex() {
  el.xianCodex.innerHTML = '';
  if (!xianUnlocked()) {
    const tip = document.createElement('div');
    tip.className = 'auction-none';
    tip.textContent = '仙缘图鉴随飞升而启。';
    el.xianCodex.appendChild(tip);
    return;
  }
  const petOK = xianCodexPets();
  const treOK = xianTreasureMastery() >= XIAN_TREASURES.length;
  const done = petOK && treOK;
  const petsCard = document.createElement('div');
  petsCard.className = 'talisman-card' + (petOK ? ' mastery' : '');
  petsCard.innerHTML = `
    <div class="talisman-head"><span class="talisman-name">四象仙兽</span><span class="talisman-held">${petOK ? '已集齐' : '未集齐'}</span></div>
    <div class="talisman-desc">${XIAN_PET_SPECIES.map(sp => sp.name).join('、')} · 需各得其一${petOK ? ' ✓' : ''}</div>`;
  el.xianCodex.appendChild(petsCard);
  const treCard = document.createElement('div');
  treCard.className = 'talisman-card' + (treOK ? ' mastery' : '');
  treCard.innerHTML = `
    <div class="talisman-head"><span class="talisman-name">三器大圆满</span><span class="talisman-held">${treOK ? '已达' : '未达'}</span></div>
    <div class="talisman-desc">诛仙剑、玄元甲、入道佩皆臻大圆满${treOK ? ' ✓' : ''}</div>`;
  el.xianCodex.appendChild(treCard);
  const titleCard = document.createElement('div');
  titleCard.className = 'talisman-card' + (done ? ' mastery' : '');
  titleCard.innerHTML = `
    <div class="talisman-head"><span class="talisman-name">${XIAN_TITLE.name}</span><span class="talisman-held">${done ? '已加封' : '未加封'}</span></div>
    <div class="talisman-desc">${XIAN_TITLE.desc}。${done ? '修炼 +10%、战力 +15%（已生效）' : '修炼 +10%、战力 +15%'}</div>`;
  el.xianCodex.appendChild(titleCard);
}

function renderXianTrial() {
  xianTrialDaily();
  el.xianTrialEnergy.textContent = XIAN_TRIAL_ENERGY;
  const left = Math.max(0, XIAN_TRIAL_MAX_DAILY - state.xianTrialCount);
  el.xianTrialInfo.textContent = `今日 ${left}/${XIAN_TRIAL_MAX_DAILY}`;
  el.btnXianTrial.disabled = !xianUnlocked() || left <= 0 || (state.energy || 0) < XIAN_TRIAL_ENERGY;
}

/* ================= 秘境试炼 ================= */
function renderDungeons() {
  el.dungeons.innerHTML = '';
  for (const d of DUNGEONS) {
    const locked = state.realm < d.minRealm;
    const card = document.createElement('div');
    card.className = 'dungeon-card' + (locked ? ' locked' : '');
    card.innerHTML = `
      <div class="dungeon-head">
        <span class="dungeon-name">${d.name}</span>
        <span class="dungeon-req">${locked ? `需 ${REALMS[d.minRealm].name}期` : '可探索'}</span>
      </div>
      <div class="dungeon-desc">${d.desc} · 消耗精力 ${d.energy}</div>
      <button class="btn btn-secondary dungeon-btn" data-dungeon="${d.name}" ${locked || state.energy < d.energy ? 'disabled' : ''}>探索（精力 ${d.energy}）</button>`;
    card.querySelector(`[data-dungeon="${d.name}"]`).addEventListener('click', () => {
      challengeDungeon(DUNGEONS.indexOf(d));
      renderDungeons();
      updateDOM();
    });
    el.dungeons.appendChild(card);
  }
}

/* ================= 灵田 ================= */
function renderFields() {
  el.fields.innerHTML = '';
  state.fields.forEach((f, i) => {
    const card = document.createElement('div');
    card.className = 'field-card';
    card.setAttribute('data-idx', i);
    if (f.herbId == null) {
      const head = document.createElement('div');
      head.className = 'field-head';
      head.innerHTML = `<span class="field-name">灵田 · ${i + 1}</span><span class="field-state">空闲</span>`;
      card.appendChild(head);
      const sel = document.createElement('select');
      sel.className = 'field-select';
      for (const herb of HERBS) {
        const opt = document.createElement('option');
        opt.value = herb.id;
        opt.textContent = `${herb.name}（种子 ${fmtInt(herb.seedCost)} 灵石 · ${herb.grow}s）`;
        sel.appendChild(opt);
      }
      card.appendChild(sel);
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary field-plant';
      btn.textContent = '播种';
      btn.disabled = state.spiritStones < HERBS[0].seedCost;
      btn.addEventListener('click', () => {
        plantHerb(i, sel.value);
        renderFields();
        updateDOM();
      });
      card.appendChild(btn);
    } else {
      const herb = herbById(f.herbId);
      const g = fieldGrowText(f);
      card.innerHTML = `
        <div class="field-head">
          <span class="field-name">灵田 · ${i + 1}</span>
          <span class="field-state">${g.ready ? '已成熟' : '生长中'}</span>
        </div>
        <div class="field-herb">${herb.name} · <span data-ftime="${i}">${Math.floor((Date.now() - f.plantedAt) / 1000)}/${herb.grow}s</span></div>
        <div class="bar track field-track"><div class="bar fill field-fill" data-fbar="${i}" style="width:${g.pct}%"></div></div>
        <button class="btn btn-secondary field-harvest" data-harvest="${i}" ${g.ready ? '' : 'disabled'}>收获</button>`;
      card.querySelector(`[data-harvest="${i}"]`).addEventListener('click', () => {
        harvestField(i);
        renderFields();
        updateDOM();
      });
    }
    el.fields.appendChild(card);
  });
  const slot = state.fields.length;
  const cost = fieldUnlockCost(slot);
  el.btnFieldUnlock.classList.toggle('hidden', !cost);
  if (cost) {
    el.fieldUnlockCost.textContent = fmtInt(cost);
    el.btnFieldUnlock.disabled = state.spiritStones < cost;
  }
}

/* ================= 炼丹 ================= */
function renderRecipes() {
  el.recipes.innerHTML = '';
  // 丹道熟练度横幅
  const lv = alchemyLevel();
  const xp = alchemyXp();
  const need = alchemyXpNeed();
  const save = alchemySave();
  const banner = document.createElement('div');
  banner.className = 'alchemy-master';
  banner.innerHTML = `
    <div class="alchemy-head">
      <span>炼丹师 <b class="gold">Lv.${lv}</b></span>
      <span class="alchemy-bonus">出丹几率 +${Math.round(alchemyExtraChance() * 100)}%${save > 0 ? ` · 省药 ${save}` : ''}</span>
    </div>
    <div class="bar-label"><span>丹道悟性</span><span>${fmtInt(Math.min(xp, need))} / ${fmtInt(need)}</span></div>
    <div class="bar track alchemy-track"><div class="bar fill alchemy-fill" style="width:${Math.min(100, (xp / need) * 100)}%"></div></div>`;
  el.recipes.appendChild(banner);
  for (const r of RECIPES) {
    const pill = PILLS[r.id];
    const can = recipeCanMake(r);
    const costTxt = save > 0 ? alchemyCostText(r) : r.desc;
    const card = document.createElement('div');
    card.className = 'recipe-card' + (can ? ' can' : '');
    card.innerHTML = `
      <div class="recipe-head">
        <span class="recipe-name">${pill.name}</span>
        <span class="recipe-own">持有 x${state.pills[r.id]}</span>
      </div>
      <div class="recipe-desc">${pill.desc}</div>
      <div class="recipe-herbs">${costTxt}</div>
      <div class="recipe-actions">
        <button class="btn btn-secondary recipe-btn" data-craft="${r.id}" ${can ? '' : 'disabled'}>炼制</button>
        <button class="btn btn-ghost recipe-btn" data-craftx="${r.id}" ${can ? '' : 'disabled'}>连炼×5</button>
      </div>`;
    const doCraft = (batch) => {
      if (batch) {
        const n = craftPillBatch(r.id, 5);
        if (n < 1 && !recipeCanMake(r)) return;
      } else {
        craftPill(r.id);
      }
      renderRecipes();
      renderPills();
      updateDOM();
    };
    card.querySelector(`[data-craft="${r.id}"]`).addEventListener('click', () => doCraft(false));
    card.querySelector(`[data-craftx="${r.id}"]`).addEventListener('click', () => doCraft(true));
    el.recipes.appendChild(card);
  }
}

/* ================= 云游历练 ================= */
function renderTravel() {
  el.travel.innerHTML = '';
  for (const m of TRAVEL_MAPS) {
    const locked = state.realm < m.minRealm;
    const left = travelCooldownLeft(m);
    const card = document.createElement('div');
    card.className = 'travel-card' + (locked ? ' locked' : '');
    card.innerHTML = `
      <div class="travel-head">
        <span class="travel-name">${m.name}</span>
        <span class="travel-req" data-treq="${m.id}">${locked ? `需 ${REALMS[m.minRealm].name}期` : (left > 0 ? `休整 ${Math.ceil(left)}s` : '可前往')}</span>
      </div>
      <div class="travel-desc">${m.desc} · 冷却 ${Math.round(m.cooldown / 60) || 1} 分钟</div>
      <button class="btn btn-secondary travel-btn" data-travel="${m.id}" ${locked || left > 0 ? 'disabled' : ''}>云游</button>`;
    card.querySelector(`[data-travel="${m.id}"]`).addEventListener('click', () => {
      travelMap(m);
      renderTravel();
      updateDOM();
    });
    el.travel.appendChild(card);
  }
}

/* ================= 功法秘典 ================= */
function renderMethodList() {
  el.methodList.innerHTML = '';
  for (const m of METHODS) {
    const unlocked = state.unlockedMethods.includes(m.id);
    const isCurrent = state.methodId === m.id;
    const canUnlock = state.realm >= m.unlockRealm;
    const card = document.createElement('div');
    card.className = 'method-card' + (isCurrent ? ' current' : '') + (unlocked ? '' : ' locked');
    card.innerHTML = `
      <div class="method-card-head">
        <span class="method-card-name">${m.name}</span>
        <span class="method-card-req">${m.unlockRealm ? `需 ${REALMS[m.unlockRealm].name}期` : '初始功法'}</span>
      </div>
      <div class="method-card-desc">${m.desc}</div>
      <div class="method-card-foot">${isCurrent
        ? '<span class="method-card-state">修炼中</span>'
        : unlocked
          ? '<button class="btn btn-secondary method-card-btn" data-mid="' + m.id + '">改修</button>'
          : '<button class="btn btn-secondary method-card-btn" data-mid="' + m.id + '"' + (canUnlock ? '' : ' disabled') + '>解锁（' + fmtInt(m.cost) + ' 灵石）</button>'}</div>`;
    const btn = card.querySelector(`[data-mid="${m.id}"]`);
    if (btn) btn.addEventListener('click', () => {
      unlockMethod(m);
      renderMethodList();
      updateDOM();
    });
    el.methodList.appendChild(card);
  }
}

/* ================= 悟道神通 ================= */
function renderDivine() {
  el.divineList.innerHTML = '';
  for (const sk of DIVINE_SKILLS) {
    const lv = state.divine[sk.id] || 0;
    const maxed = lv >= sk.max;
    const card = document.createElement('div');
    card.className = 'divine-card' + (maxed ? ' maxed' : '');
    card.innerHTML = `
      <div class="divine-icon">${sk.icon}</div>
      <div class="divine-info">
        <div class="divine-name">${sk.name} <span class="divine-lv">Lv.${lv}/${sk.max}</span></div>
        <div class="divine-desc">${sk.desc}</div>
      </div>
      <button class="btn btn-secondary divine-btn" data-dv="${sk.id}" ${maxed || (state.divinePoints || 0) <= 0 ? 'disabled' : ''}>顿悟</button>`;
    card.querySelector(`[data-dv="${sk.id}"]`).addEventListener('click', () => {
      upgradeDivine(sk.id);
      renderDivine();
      updateDOM();
    });
    el.divineList.appendChild(card);
  }
}

/* ================= 坊市 ================= */
function renderMarket() {
  ensureMarket();
  el.market.innerHTML = '';
  for (const item of MARKET_ITEMS) {
    const factor = marketFactor(item);
    const stock = marketStock(item);
    const card = document.createElement('div');
    card.className = 'market-card';
    const flag = factor < 1
      ? `<span class="market-flag sale">${Math.round(factor * 10)} 折</span>`
      : factor > 1
        ? `<span class="market-flag hot">${Math.round(factor * 100)}% 价</span>`
        : '';
    card.innerHTML = `
      <div class="market-head">
        <span class="market-name">${item.name}</span>
        ${flag}
        <span class="market-stock">持有 x${fmtInt(stock)}</span>
      </div>
      <div class="market-actions">
        <button class="btn btn-secondary" data-buy="${item.id}">买入 ${fmtInt(marketBuyPrice(item))}</button>
        ${item.sellable ? `<button class="btn btn-ghost" data-sell="${item.id}" ${stock <= 0 ? 'disabled' : ''}>卖出 ${fmtInt(marketSellPrice(item))}</button>` : ''}
      </div>`;
    card.querySelector(`[data-buy="${item.id}"]`).addEventListener('click', () => {
      marketBuy(item);
      renderMarket();
      updateDOM();
    });
    const sellBtn = card.querySelector(`[data-sell="${item.id}"]`);
    if (sellBtn) sellBtn.addEventListener('click', () => {
      marketSell(item);
      renderMarket();
      updateDOM();
    });
    el.market.appendChild(card);
  }
}

/* ================= 图鉴 ================= */
function renderCodex() {
  el.codexGrid.innerHTML = '';
  const p = codexProgress();
  for (const g of CODEX_GROUPS) {
    const group = document.createElement('div');
    group.className = 'codex-cat';
    const header = document.createElement('div');
    header.className = 'codex-cat-title';
    const gcount = g.items.filter(it => codexUnlocked(g.id, it.id)).length;
    header.innerHTML = `${g.name} <span class="codex-cat-count">${gcount}/${g.items.length}</span>`;
    group.appendChild(header);
    const cards = document.createElement('div');
    cards.className = 'codex-cat-grid';
    for (const it of g.items) {
      const unlocked = codexUnlocked(g.id, it.id);
      const card = document.createElement('div');
      card.className = 'codex-card' + (unlocked ? ' unlocked' : ' locked');
      card.innerHTML = unlocked
        ? `<div class="codex-name">${it.name}</div>${it.rarity ? `<div class="codex-rarity ${rarityClass(it.rarity)}">${it.rarity}</div>` : '<div class="codex-rarity">已收录</div>'}`
        : '<div class="codex-name">？？？</div><div class="codex-rarity">未探明</div>';
      cards.appendChild(card);
    }
    group.appendChild(cards);
    el.codexGrid.appendChild(group);
  }
  el.codexProgress.textContent = `${p.got} / ${p.total}`;
}

/* ================= 玩法速览（新手引导） ================= */
function renderGuide() {
  el.guideGrid.innerHTML = '';
  for (const g of GUIDE) {
    const card = document.createElement('div');
    card.className = 'guide-card';
    card.innerHTML = `
      <div class="guide-icon">${g.icon}</div>
      <div class="guide-body">
        <div class="guide-head"><span class="guide-name">${g.name}</span><span class="guide-unlock">解锁 · ${g.unlock}</span></div>
        <div class="guide-desc">${g.desc}</div>
      </div>`;
    el.guideGrid.appendChild(card);
  }
}

/* 根据当前持有物回填图鉴（兼容旧存档与新开局） */
function backfillCodex() {
  for (const [hid, n] of Object.entries(state.herbs)) {
    if (n > 0) codexAdd('herbs', hid);
  }
  for (const [pk, n] of Object.entries(state.pills)) {
    if (n > 0) codexAdd('pills', pk);
  }
  for (const slot of Object.keys(TREASURES)) {
    if (state.treasures[slot] > 0) codexAdd('treasures', slot);
  }
  if (state.pet) codexAdd('pets', 'pet' + state.pet.speciesId);
  for (const m of METHODS) {
    if (state.unlockedMethods.includes(m.id)) codexAdd('methods', m.id);
  }
}

function updateDOM() {
  const realm = REALMS[state.realm];
  const xianStage = state.xianStage || 0;
  // 本帧公共计算缓存，避免重复调用昂贵数值函数
  const cultRateVal = cultRate();
  const stoneRateVal = stoneRate();
  const combatVal = combatPower();
  const breakVal = breakthroughChance();
  const req = reqCultivation();

  // 境界（凡界 / 仙界）
  if (xianStage > 0) {
    const x = XIAN_REALMS[xianStage - 1];
    el.realmBadge.textContent = XIAN_REALMS.length ? x.name : '不朽';
    el.realmDesc.textContent = `${x.desc}（突破成功率 ${Math.round(breakVal * 100)}%）`;
  } else {
    el.realmBadge.textContent = realm.name + '期';
    el.realmDesc.textContent = realm.desc + `（突破成功率 ${Math.round(breakVal * 100)}%）`;
  }

  // 灵石
  el.statStones.textContent = fmtInt(state.spiritStones);
  el.statStoneRate.textContent = '+' + fmt(stoneRateVal) + '/秒';

  // 修为条
  const pct = clamp((state.cultivation / req) * 100, 0, 100);
  el.cultText.textContent = `${fmtInt(state.cultivation)} / ${fmtInt(req)}`;
  el.cultBar.style.width = pct + '%';
  el.cultBar.classList.toggle('full', state.cultivation >= req);

  // 心魔条
  el.demonText.textContent = fmtInt(state.heartDemon) + ' / 100';
  el.demonBar.style.width = state.heartDemon + '%';

  // 速率（飞升仙界后仍可修炼）
  el.cultRate.textContent = fmt(cultRateVal);
  el.stoneRate.textContent = fmt(stoneRateVal);

  // 战力
  el.combatPower.textContent = fmt(combatVal);

  // 突破按钮
  const canBreak = state.cultivation >= req;
  $('btnBreak').disabled = !canBreak;
  const shield = state.tribulationShield || 0;
  const tribProg = !xianStage && state.realm === REALMS.length - 1 && (state.tribDone || 0) > 0;
  el.breakChance.textContent = canBreak
    ? `（${Math.round(breakVal * 100)}%）${!xianStage && state.realm >= 2 ? (state.realm === REALMS.length - 1 ? ' · 渡天劫' : ' · 引天劫') : ''}${tribProg ? ` ${state.tribDone}/${TRIB_WAVES}` : ''}${shield > 0 ? ` · 护体x${shield}` : ''}`
    : '';

  // 打坐按钮（飞升仙界后仍可打坐）
  const medBtn = $('btnMeditate');
  medBtn.disabled = false;
  medBtn.textContent = '打坐修炼';

  // 灵根进阶
  const step = ROOT_ADVANCE.find(s => s.from === state.rootId);
  $('btnRootAdvance').classList.toggle('hidden', !step);
  if (step) {
    $('btnRootAdvance').textContent = `灵根进阶（${SPIRIT_ROOTS[step.to].name}）`;
    $('btnRootAdvance').disabled = state.realm < step.realm || state.spiritStones < step.cost;
  }

  // 功法
  const cm = currentMethod();
  el.methodName.textContent = cm.name;
  el.methodLevel.textContent = 'Lv.' + state.methodLevel;
  const mParts = [];
  if (methodCultBonus() > 0) mParts.push(`修炼 +${Math.round(methodCultBonus() * 100)}%`);
  if (methodStoneBonus() > 0) mParts.push(`灵石 +${Math.round(methodStoneBonus() * 100)}%`);
  if (methodChanceBonus() > 0) mParts.push(`突破 +${Math.round(methodChanceBonus() * 100)}%`);
  el.methodBonus.textContent = mParts.length ? mParts.join(' · ') : '暂无明显增幅';
  el.methodCost.textContent = fmtInt(methodCost());
  $('btnMethod').disabled = state.spiritStones < methodCost();
  for (const m of METHODS) {
    const btn = el.methodList.querySelector(`[data-mid="${m.id}"]`);
    if (btn) {
      const unlocked = state.unlockedMethods.includes(m.id);
      const isCurrent = state.methodId === m.id;
      if (!isCurrent && unlocked) btn.disabled = false;
      else if (!isCurrent && !unlocked) btn.disabled = state.realm < m.unlockRealm || state.spiritStones < m.cost;
    }
  }

  // 悟道神通
  el.divinePoints.textContent = `悟道点 ${state.divinePoints || 0}`;
  for (const sk of DIVINE_SKILLS) {
    const lv = state.divine[sk.id] || 0;
    const btn = el.divineList.querySelector(`[data-dv="${sk.id}"]`);
    if (btn) btn.disabled = lv >= sk.max || (state.divinePoints || 0) <= 0;
  }

  // 坊市
  if (lastMarketDate !== todayStr()) {
    lastMarketDate = todayStr();
    renderMarket();
  }
  for (const item of MARKET_ITEMS) {
    const buyBtn = el.market.querySelector(`[data-buy="${item.id}"]`);
    if (buyBtn) buyBtn.disabled = state.spiritStones < marketBuyPrice(item);
    const sellBtn = el.market.querySelector(`[data-sell="${item.id}"]`);
    if (sellBtn) sellBtn.disabled = marketStock(item) <= 0;
  }

  // 图鉴
  const cp = codexProgress();
  el.codexCount.textContent = `${cp.got}/${cp.total}`;

  // 丹药
  updatePillCounts();
  if (state.realm !== lastRealmRendered) {
    lastRealmRendered = state.realm;
    updatePillCosts();
  }

  // 丹药购买按钮可用性
  for (const key of Object.keys(PILLS)) {
    const buyBtn = el.pills.querySelector(`[data-buy="${key}"]`);
    if (buyBtn) buyBtn.disabled = state.spiritStones < PILLS[key].cost(state.realm) || state.pills[key] >= PILLS[key].max;
    const useBtn = el.pills.querySelector(`[data-use="${key}"]`);
    if (useBtn) useBtn.disabled = state.pills[key] <= 0;
  }

  // 成就
  el.achvCount.textContent = `${state.achievementsUnlocked.length}/${ACHIEVEMENTS.length}`;

  // 灵根 / 体质
  const root = SPIRIT_ROOTS[state.rootId];
  const phys = PHYSIQUES[state.physiqueId];
  el.rootBadge.textContent = `灵根 · ${root.name}`;
  el.rootBadge.className = 'fate-badge ' + rarityClass(root.rarity);
  el.physiqueBadge.textContent = `体质 · ${phys.name}`;
  el.physiqueBadge.className = 'fate-badge ' + rarityClass(phys.rarity);

  // 洞府
  el.dwellingLevel.textContent = 'Lv.' + state.dwelling;
  el.dwellingBonus.textContent = '产出 +' + Math.round((state.dwelling - 1) * 10) + '%';
  el.dwellingCost.textContent = fmtInt(dwellingCost());
  $('btnDwelling').disabled = state.dwelling >= DWELLING_MAX || state.spiritStones < dwellingCost();

  // 法宝
  for (const slot of Object.keys(TREASURES)) {
    const lv = state.treasures[slot];
    const lvNode = el.treasures.querySelector(`[data-lv="${slot}"]`);
    const btn = el.treasures.querySelector(`[data-treasure="${slot}"]`);
    const tbtn = el.treasures.querySelector(`[data-tbtn="${slot}"]`);
    const tcost = el.treasures.querySelector(`[data-tcost="${slot}"]`);
    if (!lvNode || !btn) continue;
    if (lv === 0) {
      lvNode.textContent = '未拥有';
      tbtn.textContent = '祭炼';
    } else {
      lvNode.textContent = `+${lv} 阶 · ${treasureBonusText(slot)}`;
      tbtn.textContent = lv >= TREASURES[slot].max ? '已至极限' : '强化';
    }
    tcost.textContent = fmtInt(treasureCost(slot));
    btn.disabled = lv >= TREASURES[slot].max || state.spiritStones < treasureCost(slot);
  }

  // 炼器
  el.oreCount.textContent = '精铁 ' + fmtInt(state.ores);
  for (const slot of Object.keys(TREASURES)) {
    const info = forgeInfo(slot);
    const fbtn = el.treasures.querySelector(`[data-forge="${slot}"]`);
    const fbtnText = el.treasures.querySelector(`[data-fbtn="${slot}"]`);
    const fcost = el.treasures.querySelector(`[data-fcost="${slot}"]`);
    const fscost = el.treasures.querySelector(`[data-fscost="${slot}"]`);
    const affix = el.treasures.querySelector(`[data-affix="${slot}"]`);
    if (!fbtn) continue;
    const has = state.treasures[slot] > 0;
    fcost.textContent = fmtInt(forgeOreCost(slot));
    fscost.textContent = fmtInt(forgeStoneCost(slot));
    fbtnText.textContent = info.tier >= FORGE_MAX ? '已至极限' : `淬炼 +${info.tier}`;
    fbtn.disabled = !has || info.tier >= FORGE_MAX || (state.ores || 0) < forgeOreCost(slot) || state.spiritStones < forgeStoneCost(slot);
    if (affix) affix.textContent = info.affixes.length ? `词条 · ${forgeAffixText(slot)}（+${info.tier}）` : '尚未铭刻词条';
    // 洗练 / 重铸
    const wash = el.treasures.querySelector(`[data-wash="${slot}"]`);
    const reforge = el.treasures.querySelector(`[data-reforge="${slot}"]`);
    const rbtnText = el.treasures.querySelector(`[data-rbtn="${slot}"]`);
    const rcost = el.treasures.querySelector(`[data-rcost="${slot}"]`);
    const wcost = el.treasures.querySelector(`[data-wcost="${slot}"]`);
    const quality = el.treasures.querySelector(`[data-quality="${slot}"]`);
    if (wash) { wcost.textContent = fmtInt(washCost()); wash.disabled = !has || !(info.affixes || []).length || state.spiritStones < WASH_COST_STONE || (state.ores || 0) < WASH_COST_ORE; }
    if (reforge) {
      rcost.textContent = fmtInt(reforgeCost(slot));
      rbtnText.textContent = `重铸 ${forgeQuality(slot)}品`;
      reforge.disabled = !has || !(info.affixes || []).length || state.spiritStones < reforgeCost(slot);
    }
    if (quality) quality.textContent = forgeQuality(slot) > 0 ? `品阶 ${forgeQuality(slot)} 品 · 全属性 +${Math.round(forgeQuality(slot) * REFORGE_QUALITY * 100)}%` : '凡品法器';
  }

  // 签到
  const signedToday = state.signInDate === todayStr();
  const signBtn = $('btnSign');
  signBtn.disabled = signedToday;
  signBtn.textContent = signedToday ? '今日已签到' : '签到';
  el.signStreak.textContent = state.signInStreak > 0 ? `连续${state.signInStreak}天` : '';

  // 轮回
  $('btnReinc').classList.toggle('hidden', !state.ascended);
  el.reincBonus.textContent = state.reincarnations > 0 ? `+${state.reincarnations * 10}%` : '0';

  // 每日任务
  if (lastQuestDate !== todayStr()) {
    lastQuestDate = todayStr();
    renderQuests();
  }
  let qdone = 0;
  for (const q of DAILY_QUESTS) {
    const prog = questProgress(q);
    const claimed = questClaimed(q);
    const complete = prog >= q.target;
    if (claimed) qdone++;
    const card = el.quests.querySelector(`[data-qcard="${q.id}"]`);
    const txt = el.quests.querySelector(`[data-qtext="${q.id}"]`);
    const bar = el.quests.querySelector(`[data-qbar="${q.id}"]`);
    const btn = el.quests.querySelector(`[data-claim="${q.id}"]`);
    if (card) {
      card.classList.toggle('complete', complete);
      card.classList.toggle('claimed', claimed);
    }
    if (txt) txt.textContent = `${q.desc.replace('{n}', q.target)}（${prog}/${q.target}）`;
    if (bar) bar.style.width = Math.round(prog / q.target * 100) + '%';
    if (btn) {
      btn.disabled = !complete || claimed;
      btn.textContent = claimed ? '已领取' : '领取';
    }
  }
  el.questDone.textContent = `${qdone}/${DAILY_QUESTS.length}`;

  // 灵宠
  if (state.pet) {
    const need = petExpToNext();
    const pbar = el.pet.querySelector('[data-pbar]');
    const ptext = el.pet.querySelector('[data-ptext]');
    const feed = el.pet.querySelector('[data-feed]');
    const fcost = el.pet.querySelector('[data-feedcost]');
    if (pbar) pbar.style.width = Math.min(100, state.pet.exp / need * 100) + '%';
    if (ptext) ptext.textContent = `${state.pet.exp}/${need}`;
    if (fcost) fcost.textContent = fmtInt(petFeedCost());
    if (feed) feed.disabled = state.pet.level >= petMaxLevel() || state.spiritStones < petFeedCost();
  } else {
    const captureBtn = el.pet.querySelector('[data-capture]');
    if (captureBtn) captureBtn.disabled = state.spiritStones < PET_CAPTURE_COST;
  }

  // 宗门
  if (state.sectId != null) {
    const contrib = el.sect.querySelector('[data-contrib]');
    if (contrib) contrib.textContent = fmtInt(state.sectContribution);
    const rank = el.sect.querySelector('[data-rank]');
    if (rank) rank.textContent = sectRank();
    const tcost = el.sect.querySelector('[data-techcost]');
    if (tcost) tcost.textContent = fmtInt(sectTechCost());
    const tbtn = el.sect.querySelector('[data-tech]');
    if (tbtn) tbtn.disabled = state.sectContribution < sectTechCost() || state.sectTech >= SECT_TECH_MAX;
    const d500 = el.sect.querySelector('[data-donate="500"]');
    if (d500) d500.disabled = state.spiritStones < 500;
    const dmax = el.sect.querySelector('[data-donate="max"]');
    if (dmax) dmax.disabled = state.spiritStones <= 0;
  } else {
    for (const s of SECTS) {
      const jb = el.sect.querySelector(`[data-join="${SECTS.indexOf(s)}"]`);
      if (jb) jb.disabled = state.spiritStones < s.joinCost;
    }
  }

  // 秘境试炼
  el.energyText.textContent = `${fmt(state.energy)} / ${state.energyMax}`;
  el.energyBar.style.width = (state.energy / state.energyMax * 100) + '%';
  for (const d of DUNGEONS) {
    const btn = el.dungeons.querySelector(`[data-dungeon="${d.name}"]`);
    if (btn) btn.disabled = state.realm < d.minRealm || state.energy < d.energy;
  }

  // 灵田实时状态
  state.fields.forEach((f, i) => {
    const card = el.fields.querySelector(`[data-idx="${i}"]`);
    if (!card) return;
    if (f.herbId == null) {
      const sEl = card.querySelector('.field-state');
      if (sEl) sEl.textContent = '空闲';
      const plantBtn = card.querySelector('.field-plant');
      if (plantBtn) plantBtn.disabled = state.spiritStones < HERBS[0].seedCost;
      return;
    }
    const herb = herbById(f.herbId);
    const g = fieldGrowText(f);
    const bar = card.querySelector(`[data-fbar="${i}"]`);
    if (bar) bar.style.width = g.pct + '%';
    const sEl = card.querySelector('.field-state');
    if (sEl) sEl.textContent = g.ready ? '已成熟' : '生长中';
    const hbtn = card.querySelector(`[data-harvest="${i}"]`);
    if (hbtn) hbtn.disabled = !g.ready;
    const timeEl = card.querySelector(`[data-ftime="${i}"]`);
    if (timeEl) timeEl.textContent = `${Math.floor((Date.now() - f.plantedAt) / 1000)}/${herb.grow}s`;
  });
  const fslot = state.fields.length;
  const fcost = fieldUnlockCost(fslot);
  el.btnFieldUnlock.classList.toggle('hidden', !fcost);
  if (fcost) {
    el.fieldUnlockCost.textContent = fmtInt(fcost);
    el.btnFieldUnlock.disabled = state.spiritStones < fcost;
  }

  // 云游实时状态
  for (const m of TRAVEL_MAPS) {
    const btn = el.travel.querySelector(`[data-travel="${m.id}"]`);
    const req = el.travel.querySelector(`[data-treq="${m.id}"]`);
    if (!btn || !req) continue;
    const left = travelCooldownLeft(m);
    btn.disabled = state.realm < m.minRealm || left > 0;
    req.textContent = state.realm < m.minRealm
      ? `需 ${REALMS[m.minRealm].name}期`
      : (left > 0 ? `休整 ${Math.ceil(left)}s` : '可前往');
  }

  // 炼丹可制状态
  for (const r of RECIPES) {
    const btn = el.recipes.querySelector(`[data-craft="${r.id}"]`);
    if (btn) btn.disabled = !recipeCanMake(r);
  }

  // 战斗历练实时状态
  const tp = state.towerFloor || 1;
  const tBtn = el.tower.querySelector('[data-tower]');
  if (tBtn) tBtn.disabled = tp > TOWER_MAX;
  const bossBtn = el.boss.querySelector('[data-boss]');
  if (bossBtn) {
    const bl = bossLeft();
    bossBtn.disabled = bl > 0;
    const reqNode = el.boss.querySelector('.boss-req');
    if (reqNode) reqNode.textContent = bl > 0 ? `休整 ${Math.ceil(bl)}s` : '可挑战';
  }

  // 道侣实时状态
  if (state.spouse != null) {
    const dBtn = el.spouse.querySelector('[data-dual]');
    const dl = dualLeft();
    if (dBtn) dBtn.disabled = dl > 0;
    const reqNode = el.spouse.querySelector('.spouse-req');
    if (reqNode) reqNode.textContent = dl > 0 ? `温养 ${Math.ceil(dl)}s` : '可双修';
  } else {
    const aBtn = el.spouse.querySelector('[data-adopt]');
    if (aBtn) aBtn.disabled = state.spiritStones < SPOUSE_COST;
  }

  // 传承道统实时状态
  el.legacyPoints.textContent = `传承点 ${state.legacyPoints || 0}`;

  // 拍卖行实时状态
  const aLeft = auctionLeft();
  el.auctionTimer.textContent = aLeft > 0 ? `${Math.ceil(aLeft)}s 刷新` : '结算中';
  if (aLeft <= 0 && el.auction.childElementCount > 0) {
    renderAuction();
  }
  const aBtns = el.auction.querySelectorAll('[data-auction]');
  aBtns.forEach(btn => {
    const idx = +btn.getAttribute('data-auction');
    const item = state.auction.list[idx];
    if (item) btn.disabled = state.spiritStones < item.price;
  });

  // 宗门职位实时状态
  if (state.sectId != null) {
    const promoteBtn = el.sect.querySelector('[data-promote]');
    if (promoteBtn) {
      const next = sectPositionNext();
      const has = next ? state.sectContribution >= next.cost : false;
      const realmOK = next && next.realm != null ? state.realm >= next.realm : true;
      const xianOK = next && next.xian != null ? (state.xianStage || 0) >= next.xian : true;
      promoteBtn.disabled = !has || !realmOK || !xianOK;
    }
  }

  // 炼体实时状态
  renderBody();

  // 符箓实时状态
  for (const t of TALISMANS) {
    const craftBtn = el.talismans.querySelector(`[data-tcraft="${t.id}"]`);
    if (craftBtn) craftBtn.disabled = !talismanAfford(t);
    const actBtn = el.talismans.querySelector(`[data-tact="${t.id}"]`);
    if (actBtn) actBtn.disabled = (state.talismans[t.id] || 0) <= 0;
    const activeNode = el.talismans.querySelector(`[data-tactive="${t.id}"]`);
    if (activeNode) {
      const b = state.talismanBuffs[t.id];
      activeNode.textContent = t.dur ? (b && b > Date.now() ? '· 生效中' : '') : (t.times ? (b && b > 0 ? ` · 剩${Math.floor(b)}次` : '') : '');
    }
  }

  // 阵法实时状态
  for (const f of FORMATIONS) {
    const up = el.formations.querySelector(`[data-up="${f.id}"]`);
    if (up) up.disabled = (state.formations[f.id] || 0) >= FORM_MAX || state.spiritStones < formationCost(f);
  }

  // 收徒实时状态
  $('btnDisciple').disabled = (state.disciples || []).length >= DISCIPLE_SLOTS || state.spiritStones < DISCIPLE_COST;
  (state.disciples || []).forEach((d, i) => {
    const trainBtn = el.disciples.querySelector(`[data-dtrain="${i}"]`);
    if (trainBtn) trainBtn.disabled = discipleTrainLeft(d) > 0 || state.spiritStones < discipleTrainCost(d);
    const cdNode = el.disciples.querySelector(`[data-dcd="${i}"]`);
    if (cdNode) cdNode.textContent = discipleTrainLeft(d) > 0 ? `${Math.ceil(discipleTrainLeft(d))}s` : '';
  });

  // 宗门大比 · 敌宗实时状态
  for (const e of ENEMY_SECTS) {
    const raidBtn = el.war.querySelector(`[data-raid="${ENEMY_SECTS.indexOf(e)}"]`);
    if (raidBtn) raidBtn.disabled = state.sectId == null || (state.energy || 0) < 5;
  }
  const pres = Math.min(state.sectPrestige || 0, SECT_PRES_MAX);
  el.presText.textContent = pres + ' / ' + SECT_PRES_MAX;
  el.presBonus.textContent = '+' + Math.round(pres * 2) + '%';
  $('btnTourney').disabled = state.sectId == null || tourneyLeft() > 0 || (state.sectContribution || 0) < 500;
  el.tourneyCd.textContent = tourneyLeft() > 0 ? ` · ${Math.ceil(tourneyLeft())}s` : '';

  // 仙器 & 仙宠实时状态
  if (prevXianUnlocked !== xianUnlocked()) {
    prevXianUnlocked = xianUnlocked();
    renderXianTreasures();
    renderXianPets();
    renderXianExchange();
    renderXianArts();
    renderXianCodex();
    renderXianSets();
    renderXianTower();
    renderXianSpouse();
    renderXianPetTrials();
  }
  renderXianLine();
  renderXianTrial();
  renderXianSoul();
  renderXianTower();
  renderXianSpouse();
  renderXianManor();
  renderXianRank();
  // 仙缘图鉴实时刷新：仙器大成/仙兽集齐变化即更新称号状态
  const codexSig = xianTreasureMastery() + '|' + (state.xianPets || []).map(p => p.species).sort().join(',');
  if (codexSig !== lastCodexSig) { lastCodexSig = codexSig; renderXianCodex(); }
  // 套装/试炼实时刷新：神铸、精魄、仙兽、精力变化即更新
  const setSig = JSON.stringify(state.xianShen || {});
  if (setSig !== lastSetSig) { lastSetSig = setSig; renderXianSets(); }
  const trialSig = (state.xianPetTrialCount || 0) + '|' + (state.energy || 0) + '|' + (state.xianPets || []).map(p => Math.max(0, ((p.trialAt || 0) + XIAN_PET_TRIAL_CD * 1000 - Date.now()) / 1000 | 0)).join(',');
  if (trialSig !== lastTrialSig) { lastTrialSig = trialSig; renderXianPetTrials(); }
  el.xianCrystalText.textContent = '仙晶 ' + fmtInt(state.xianCrystal || 0);
  $('btnSeekXianPet').disabled = !xianUnlocked() || (state.xianPets || []).length >= XIAN_PET_MAX || (state.xianCrystal || 0) < XIAN_PET_CAPTURE;
  const exNeed = XIAN_CRYSTAL_RATE * XIAN_CRYSTAL_BUY_STEP;
  el.btnXianExchange.disabled = !xianUnlocked() || (state.spiritStones || 0) < exNeed;
  for (const t of XIAN_TREASURES) {
    const b = el.xianTreasures.querySelector(`[data-xforge="${t.id}"]`);
    if (b) b.disabled = (state.xianTreasures[t.id] || 0) >= t.max || (state.xianStage || 0) < t.xian || (state.xianCrystal || 0) < xianTreasureCost(t);
    const sb = el.xianTreasures.querySelector(`[data-xshen="${t.id}"]`);
    if (sb) { const c = shenForgeCost(t.id); sb.disabled = (state.xianSoul || 0) < c.soul || (state.xianCrystal || 0) < c.xian; }
  }
  (state.xianPets || []).forEach((p, i) => {
    const fb = el.xianPets.querySelector(`[data-xfeed="${i}"]`);
    if (fb) fb.disabled = (p.level || 1) >= xianPetMaxLevel(p) || (state.xianCrystal || 0) < xianPetFeedCost(p);
    const eb = el.xianPets.querySelector(`[data-xevo="${i}"]`);
    if (eb) eb.disabled = p.chaos || p.evolved || (p.level || 1) < XIAN_PET_MAX_LEVEL || (state.xianSoul || 0) < XIAN_EVOLVE_SOUL || (state.xianCrystal || 0) < XIAN_EVOLVE_XIAN;
  });
  el.btnBuySoul.disabled = !xianUnlocked() || (state.xianCrystal || 0) < XIAN_SOUL_RATE;
  el.btnSummonChaos.disabled = !xianUnlocked() || chaosOwned() || (state.xianSoul || 0) < XIAN_CHAOS_SOUL || (state.xianCrystal || 0) < XIAN_CHAOS_XIAN || (state.xianPets || []).length >= XIAN_PET_MAX;

  // 宗门驻地季赛倒计时实时刷新
  const remainEl = el.sect.querySelector('[data-season-remain]');
  if (remainEl) remainEl.textContent = fmtInt(seasonEndLeft());

  // 存档状态（本地位已存 = 绿；云端同步失败 = 红并提示）
  const elapsed = Date.now() - lastSaveAt;
  el.saveState.classList.toggle('save-warn', cloudOk === false);
  if (cloudOk === false) {
    el.saveState.textContent = lastSaveAt > 0 && elapsed < 5000 ? '已存档 · 云端同步失败' : '云端同步失败';
  } else {
    el.saveState.textContent = lastSaveAt > 0 && elapsed < 5000 ? '已存档' : '';
  }
}

/* ================= 主循环 ================= */
function loop(now) {
  const dt = Math.min(now - lastFrame, 1000);
  lastFrame = now;

  tick(dt);
  rollEvent();

  // DOM 更新节流：数值与界面每 ~200ms 刷新一次，逻辑仍每帧运算
  if (now - lastDomUpdate >= DOM_UPDATE_INTERVAL) {
    lastDomUpdate = now;
    updateDOM();
  }

  // 成就检测（每秒一次）
  if (now - lastAchieveCheck > 1000) {
    lastAchieveCheck = now;
    checkAchievements().forEach(a => queueAchievementToast(a.icon, a.name));
  }

  if (now - lastSaveAt > SAVE_INTERVAL) {
    saveGame();
    lastSaveAt = now;
  }

  requestAnimationFrame(loop);
}

/* ================= 弹窗 ================= */
function showEvent(ev) {
  el.eventTitle.textContent = '奇遇 · ' + ev.title;
  el.eventText.textContent = ev.text;
  el.eventChoices.innerHTML = '';
  ev.choices.forEach((choice, i) => {
    const b = document.createElement('button');
    b.className = 'btn btn-secondary' + (i === 0 ? ' btn-primary' : '');
    b.textContent = choice.label;
    b.addEventListener('click', () => {
      el.eventModal.classList.add('hidden');
      resolveChoice(ev, choice);
    });
    el.eventChoices.appendChild(b);
  });
  el.eventModal.classList.remove('hidden');
}

function showAscend() {
  const s = state.stats;
  el.ascendText.innerHTML =
    `历经 <b>${s.breakthroughs}</b> 次突破，<b>${s.fails}</b> 次失败，<b>${fmtInt(state.lifetimeCultivation)}</b> 修为，` +
    `<b>${fmtInt(state.lifetimeStones)}</b> 灵石，<b>${s.events}</b> 次奇遇。<br/>你终于超脱凡尘，位列仙班！`;
  el.ascendModal.classList.remove('hidden');
  saveGame();
}

function showOffline(offline) {
  const h = Math.floor(offline.seconds / 3600);
  const m = Math.floor((offline.seconds % 3600) / 60);
  const timeStr = h > 0 ? `${h} 小时 ${m} 分` : `${m} 分`;
  let ext = '';
  if (offline.manor > 0) ext += `，仙府产出仙晶 +<b>${fmtInt(offline.manor)}</b>${offline.soul > 0 ? `（含精魄 +<b>${offline.soul}</b>）` : ''}`;
  el.offlineText.innerHTML =
    `你离开的这段时日，肉身闭关潜修 <b>${timeStr}</b>，<br/>修为 +<b>${fmtInt(offline.cult)}</b>，灵石 +<b>${fmtInt(offline.stones)}</b>${ext}。`;
  el.offlineModal.classList.remove('hidden');
}

/* ================= 标签记忆 ================= */
function restoreLastTab() {
  let tab = null;
  try { tab = localStorage.getItem(SAVE_KEY + '_tab'); } catch (e) {}
  if (!tab) return;
  const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
}

/* ================= 存档导出 / 导入 ================= */
function exportSave() {
  if (!state) return;
  const json = JSON.stringify(Object.assign({}, state, { _v: SAVE_VERSION, _pid: playerId() }), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  a.href = url;
  a.download = `xiuxian_save_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('存档已导出，请妥善保存该文件');
}

function importSave(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.realm !== 'number') {
        throw new Error('bad save');
      }
      // 导入前先备份当前存档，防误操作丢失
      const cur = localStorage.getItem(SAVE_KEY);
      if (cur) localStorage.setItem(SAVE_KEY + '_bk', cur);
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      toast('存档已导入，正在重建修行世界……');
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      toast('导入失败：存档文件格式不正确', 'danger');
    }
  };
  reader.onerror = () => toast('导入失败：文件读取错误', 'danger');
  reader.readAsText(file);
}

/* ================= 初始化 ================= */
function init() {
  const hasSave = loadGame();

  renderPills();
  renderTreasures();
  lastQuestDate = todayStr();
  renderQuests();
  renderPet();
  renderSect();
  renderDungeons();
  renderFields();
  renderRecipes();
  renderTravel();
  lastMarketDate = todayStr();
  renderTower();
  renderBoss();
  renderSpouse();
  renderLegacy();
  renderAuction();
  renderMethodList();
  renderDivine();
  renderMarket();
  renderBody();
  renderTalismans();
  renderFormations();
  renderDisciples();
  renderWar();
  renderXianTreasures();
  renderXianPets();
  renderXianExchange();
  renderXianLine();
  renderXianArts();
  renderXianCodex();
  renderXianTrial();
  renderXianSoul();
  renderXianSets();
  renderXianTower();
  renderXianSpouse();
  renderXianManor();
  renderXianPetTrials();
  renderXianRank();
  prevXianUnlocked = xianUnlocked();
  clearLog();
  backfillCodex();

  // 离线收益
  const offline = computeOffline();
  if (offline) {
    log(`闭关归来：修为 +${fmtInt(offline.cult)}，灵石 +${fmtInt(offline.stones)}`, 'important');
    showOffline(offline);
  } else if (!hasSave) {
    log(`你睁开双眼，发现自己身处一间简朴洞府，此世灵根【${SPIRIT_ROOTS[state.rootId].name}】、体质【${PHYSIQUES[state.physiqueId].name}】，仙途自此而始……`, 'important');
    log('点击「打坐修炼」获取修为，修为圆满后「突破境界」！', '');
    // 新玩家自动打开玩法速览
    renderGuide();
    el.guideModal.classList.remove('hidden');
  } else {
    log('你从入定中醒来，继续修行。', '');
  }

  // 成就补解锁（旧存档按当前进度静默结算，仅记入日志不弹提示）
  checkAchievements();

  // 按钮事件
  $('btnMeditate').addEventListener('click', () => {
    meditate();
    lastSaveAt = Date.now();
    saveGame();
  });
  $('btnBreak').addEventListener('click', breakthrough);
  $('btnMethod').addEventListener('click', upgradeMethod);
  $('btnDwelling').addEventListener('click', upgradeDwelling);
  $('btnBodyTrain').addEventListener('click', () => { bodyTrain(); renderBody(); updateDOM(); });
  $('btnBodyBreak').addEventListener('click', () => { bodyBreak(); renderBody(); updateDOM(); });
  $('btnDisciple').addEventListener('click', () => { takeDisciple(); renderDisciples(); updateDOM(); });
  $('btnTourney').addEventListener('click', () => { sectTourney(); renderWar(); updateDOM(); });
  $('btnSeekXianPet').addEventListener('click', () => { seekXianPet(); renderXianPets(); updateDOM(); });
  $('btnXianExchange').addEventListener('click', () => { buyXianCrystal(); renderXianExchange(); renderXianTreasures(); updateDOM(); });
  $('btnXianTrial').addEventListener('click', () => { xianTrialChallenge(); renderXianTrial(); renderXianTreasures(); updateDOM(); });
  $('btnBuildManor').addEventListener('click', () => { buildXianManor(); renderXianManor(); renderXianSoul(); updateDOM(); });
  $('btnBuySoul').addEventListener('click', () => { buyXianSoul(); renderXianSoul(); renderXianTreasures(); renderXianPets(); updateDOM(); });
  $('btnSummonChaos').addEventListener('click', () => { summonChaos(); renderXianPets(); renderXianSoul(); updateDOM(); });
  $('btnRootAdvance').addEventListener('click', () => {
    rootAdvance();
    updateDOM();
  });
  el.btnFieldUnlock.addEventListener('click', () => {
    unlockField();
    renderFields();
    updateDOM();
  });
  $('btnSign').addEventListener('click', signIn);
  $('btnReinc').addEventListener('click', () => {
    if (confirm(`轮回转世将重置当前境界与洞府，但获得永久加成（当前 ${state.reincarnations} 世 → ${state.reincarnations + 1} 世），并重掷灵根体质。确定转世吗？`)) {
      reincarnate();
      updateDOM();
    }
  });
  $('btnSave').addEventListener('click', () => {
    lastSaveAt = Date.now();
    saveGame();
    toast('已存档');
  });
  $('btnReset').addEventListener('click', () => {
    if (confirm('确定要重置全部进度吗？包括境界、灵根、轮回世数、成就与签到，均将清空！')) {
      resetGame();
      lastRealmRendered = -1;
      renderPills();
      renderTreasures();
      renderQuests();
      renderPet();
      renderSect();
      renderDungeons();
      renderFields();
      renderRecipes();
      renderTravel();
      lastMarketDate = todayStr();
      renderTower();
      renderBoss();
      renderSpouse();
      renderLegacy();
      renderAuction();
      renderMethodList();
      renderDivine();
      renderMarket();
      renderBody();
      renderTalismans();
      renderFormations();
      renderDisciples();
      renderWar();
      renderXianTreasures();
      renderXianPets();
      updateDOM();
      toast('已重置');
    }
  });
  $('btnOffline').addEventListener('click', () => el.offlineModal.classList.add('hidden'));
  $('btnAscend').addEventListener('click', () => el.ascendModal.classList.add('hidden'));
  $('btnAchv').addEventListener('click', () => {
    renderAchievements();
    el.achvModal.classList.remove('hidden');
  });
  $('btnAchvClose').addEventListener('click', () => el.achvModal.classList.add('hidden'));
  el.achvModal.addEventListener('click', e => {
    if (e.target === el.achvModal) el.achvModal.classList.add('hidden');
  });
  $('btnCodex').addEventListener('click', () => {
    renderCodex();
    el.codexModal.classList.remove('hidden');
  });
  $('btnCodexClose').addEventListener('click', () => el.codexModal.classList.add('hidden'));
  el.codexModal.addEventListener('click', e => {
    if (e.target === el.codexModal) el.codexModal.classList.add('hidden');
  });
  $('btnGuide').addEventListener('click', () => {
    renderGuide();
    el.guideModal.classList.remove('hidden');
  });
  $('btnGuideClose').addEventListener('click', () => el.guideModal.classList.add('hidden'));
  el.guideModal.addEventListener('click', e => {
    if (e.target === el.guideModal) el.guideModal.classList.add('hidden');
  });

  // 标签导航：按系统分组切换显示（记录上次标签，刷新后还原）
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === tab));
      try { localStorage.setItem(SAVE_KEY + '_tab', tab); } catch (e) {}
    });
  });
  restoreLastTab();

  // 导出 / 导入存档
  $('btnExport').addEventListener('click', exportSave);
  $('btnImport').addEventListener('click', () => el.saveFileInput && el.saveFileInput.click());
  if (el.saveFileInput) {
    el.saveFileInput.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) importSave(e.target.files[0]);
      e.target.value = '';
    });
  }

  window.addEventListener('beforeunload', saveGame);

  lastSaveAt = Date.now();
  requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', async () => {
  // 本地无存档时先尝试从云端取回本玩家备份，再初始化界面
  if (localStorage && !localStorage.getItem(SAVE_KEY)) await tryCloudRestore();
  init();
});
