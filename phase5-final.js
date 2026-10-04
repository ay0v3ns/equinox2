/* Equinox Phase 5 — settings, presentation, accessibility, performance, and roll history. */
(function(){
  const S={
    autoRoll:false,autoEquip:false,autoSkip:false,rollConfirmation:false,potionConfirmation:true,
    craftingConfirmation:true,confirmShopPurchase:true,rollResultBehavior:'Full',
    auraNames:true,auraRarities:true,rollEffects:'Full',auraAnimations:'Full',biomeEffects:'Full',
    weatherEffects:'Full',damageScreenEffects:'Full',rareRollDisplay:'Enhanced',biomeTransitionEffects:'Full',
    notifications:true,notifyCrafting:true,notifyAuras:true,notifyBreakthroughs:true,notifyGlobalPlacement:true,
    notifyBiome:true,notifyDayNight:true,notifyWarnings:true,notifyQuests:true,notifyItems:true,
    notifyJester:true,notifyBank:true,notifyPotionExpiration:true,notifyShop:true,
    masterVolume:70,musicVolume:60,sfxVolume:80,uiVolume:80,muted:false,
    compactInterface:false,showClock:true,showRecentRolls:true,showRightPanel:true,
    reducedMotion:false,reducedFlash:false,screenShake:'Full',highContrast:false,colorblind:false,
    particleQuality:'High',auraQuality:'High',biomeQuality:'High',maximumEffects:100,fpsLimit:60,
    performanceMode:false,lowDetailMode:false,
    globalChatDisplay:true,globalLeaderboardDisplay:true,onlineLeaderboardDisplay:true,showOtherTitles:true,showGlobalRank:true,
    rollHistory:true,statistics:true,loreMode:true
  };
  const CATS=['Gameplay','Display','Notifications','Audio','Interface','Accessibility','Performance','Privacy & Social','Data','Lore','Account'];
  const OPTIONS={
    rollResultBehavior:['Full','Compact','Minimal','Instant'],rollEffects:['Full','Reduced','Off'],auraAnimations:['Full','Reduced','Minimal','Off'],
    biomeEffects:['Full','Reduced','Minimal','Off'],weatherEffects:['Full','Reduced','Off'],damageScreenEffects:['Full','Reduced','Off'],
    rareRollDisplay:['Normal','Enhanced','Cinematic','Minimal'],biomeTransitionEffects:['Full','Reduced','Instant'],
    screenShake:['Full','Reduced','Off'],particleQuality:['High','Medium','Low','Off'],auraQuality:['High','Medium','Low'],
    biomeQuality:['High','Medium','Low']
  };
  function init(){
    state.settings=Object.assign({},S,state.settings||{});
    applyVisualSettings();
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function saveSettings(){state.settings=Object.assign({},S,state.settings||{});localStorage.setItem('equinox-save-v1',JSON.stringify(state));applyVisualSettings();}
  window.phase5SetSetting=function(k,v){init();state.settings[k]=v;saveSettings();render();};
  window.phase5Toggle=function(k){init();state.settings[k]=!state.settings[k];saveSettings();render();};
  window.phase5ResetSettings=function(){
    if(!confirm('Reset all Settings to their default values? Your Auras, Coins, Gear, Potions, quests, and other progress will remain.'))return;
    state.settings=Object.assign({},S);saveSettings();toast('Settings reset to defaults.');render();
  };
  function toggle(k,label,desc){
    const on=!!state.settings[k];
    return '<div class="setting-row"><div><b>'+esc(label)+'</b><small>'+esc(desc)+'</small></div><button class="setting-toggle '+(on?'on':'')+'" onclick="phase5Toggle(\''+k+'\')">'+(on?'ON':'OFF')+'</button></div>';
  }
  function select(k,label,desc){
    const opts=(OPTIONS[k]||[]).map(x=>'<option value="'+esc(x)+'" '+(state.settings[k]===x?'selected':'')+'>'+esc(x)+'</option>').join('');
    return '<div class="setting-row"><div><b>'+esc(label)+'</b><small>'+esc(desc)+'</small></div><select class="setting-select" onchange="phase5SetSetting(\''+k+'\',this.value)">'+opts+'</select></div>';
  }
  function range(k,label,desc,min,max,step){
    return '<div class="setting-row"><div><b>'+esc(label)+'</b><small>'+esc(desc)+'</small></div><input class="setting-range" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+Number(state.settings[k])+'" oninput="phase5SetSetting(\''+k+'\',Number(this.value))"><b class="setting-value">'+Number(state.settings[k])+'</b></div>';
  }
  function section(title,body){return '<section class="panel settings-section"><div class="section-title">'+title+'</div>'+body+'</section>';}
  function settingsView(){
    init();
    const s=state.settings;
    let html='<div class="settings-page"><div class="panel settings-hero"><div class="section-title">Player Configuration</div><h1>Settings</h1><p class="muted">Control how Equinox looks, sounds, rolls, saves, and presents information. Cosmetic, accessibility, audio, interface, and performance settings never change progression.</p></div><div class="settings-grid">';
    html+=section('Gameplay',
      toggle('autoRoll','Auto Roll','Continuously roll after Auto Roll is unlocked.')+
      toggle('autoEquip','Auto Equip','Respect per-Aura Auto Equip rules.')+
      toggle('autoSkip','Auto Skip','Respect per-Aura Auto Skip rules.')+
      toggle('rollConfirmation','Roll Confirmation','Confirm manual actions that can interrupt rolling.')+
      toggle('potionConfirmation','Potion Confirmation','Confirm before using Potions.')+
      toggle('craftingConfirmation','Crafting Confirmation','Confirm before crafting items, Gear, or Potions.')+
      toggle('confirmShopPurchase','Shop Purchase Confirmation','Confirm before spending Coins in Mari\'s Shop.')+
      select('rollResultBehavior','Roll Result Behavior','Choose how much information is shown after a roll.'));
    html+=section('Display',
      toggle('auraNames','Aura Names','Show Aura names in result and inventory displays.')+
      toggle('auraRarities','Aura Rarities','Show rarity denominators where normally displayed.')+
      select('rollEffects','Roll Effects','Control roll-result visual effects.')+
      select('auraAnimations','Aura Animations','Control Aura animation intensity.')+
      select('biomeEffects','Biome Effects','Control biome visual effects.')+
      select('weatherEffects','Weather Effects','Control weather and atmospheric effects.')+
      select('damageScreenEffects','Damage/Screen Effects','Control temporary screen presentation effects.')+
      select('rareRollDisplay','Rare Roll Display','Choose the presentation for rare results.')+
      select('biomeTransitionEffects','Biome Transition Effects','Control biome-change presentation.'));
    html+=section('Notifications',
      toggle('notifications','Notifications','Master notification switch.')+
      toggle('notifyCrafting','Crafting Recipes Ready','Show crafting notifications.')+
      toggle('notifyAuras','Aura Rarity Notifications','Show Aura-related notifications.')+
      toggle('notifyBreakthroughs','Breakthroughs','Show Breakthrough notifications.')+
      toggle('notifyGlobalPlacement','Leaderboard Placement','Show Top-ten leaderboard notifications.')+
      toggle('notifyBiome','Biome Changes','Show biome change notifications.')+
      toggle('notifyDayNight','Day/Night Changes','Show Day/Night notifications.')+
      toggle('notifyWarnings','Warnings / Confirmations','Show warning and confirmation notifications.')+
      toggle('notifyQuests','Quest Resets / Completions','Show quest notifications.')+
      toggle('notifyItems','Items Collected','Show item collection notifications.')+
      toggle('notifyJester','Jester\'s Gamble Rewards','Show Gamble reward notifications.')+
      toggle('notifyBank','Bank Ready','Show Bank deposit/withdrawal notifications.')+
      toggle('notifyPotionExpiration','Potion Expiration','Show Potion expiration notifications.')+
      toggle('notifyShop','Shop Reset','Show hourly Shop reset notifications.'));
    html+=section('Audio',
      toggle('muted','Mute All Audio','Disable all Equinox audio.')+
      range('masterVolume','Master Volume','Controls all Equinox audio.',0,100,1)+
      range('musicVolume','Music Volume','Reserved for background music.',0,100,1)+
      range('sfxVolume','SFX Volume','Roll and rare-event sounds.',0,100,1)+
      range('uiVolume','UI Volume','Interface and notification sounds.',0,100,1));
    html+=section('Interface',
      toggle('compactInterface','Compact Interface','Reduce nonessential spacing.')+
      toggle('showClock','Show Clock','Display the current Day/Night time.')+
      toggle('showRecentRolls','Show Recent Rolls','Display the recent-roll panel.')+
      toggle('showRightPanel','Show World Panel','Display the right-side world state panel.'));
    html+=section('Accessibility',
      toggle('reducedMotion','Reduced Motion','Reduce or disable nonessential movement.')+
      toggle('reducedFlash','Reduced Flash','Reduce rapid flashing effects.')+
      select('screenShake','Screen Shake','Full / Reduced / Off.')+
      toggle('highContrast','High Contrast','Increase contrast between important UI elements.')+
      toggle('colorblind','Colorblind Options','Add stronger non-color UI cues.'));
    html+=section('Performance',
      select('particleQuality','Particle Quality','Control particle workload.')+
      select('auraQuality','Aura Quality','Control Aura visual complexity.')+
      select('biomeQuality','Biome Quality','Control biome visual complexity.')+
      range('maximumEffects','Maximum Effects','Maximum simultaneous visual effects.',0,100,5)+
      range('fpsLimit','FPS Limit','Client frame-rate target.',30,240,30)+
      toggle('performanceMode','Performance Mode','Apply broad visual performance reductions.')+
      toggle('lowDetailMode','Low Detail Mode','Reduce particles, effects, glow, and some animations.'));
    html+=section('Privacy & Social',
      toggle('globalChatDisplay','Global Chat Display','Show the Global Chat panel.')+
      toggle('globalLeaderboardDisplay','Global Leaderboard Display','Show global leaderboards.')+
      toggle('onlineLeaderboardDisplay','Online Leaderboard Display','Show online leaderboards.')+
      toggle('showOtherTitles','Show Other Players\' Achievement Titles','Show equipped Achievement Titles in chat.')+
      toggle('showGlobalRank','Show Global Rank','Show rank beside players in chat.'));
    html+=section('Data',
      toggle('rollHistory','Roll History','Store and review up to 1,000,000 rolls.')+
      toggle('statistics','Statistics','Show accumulated account statistics.')+
      '<div class="setting-row"><div><b>Roll History</b><small>Search by roll number, rarity, or Aura. Aura and rarity cannot be searched together.</small></div><button class="setting-action" onclick="phase5OpenHistory()">Open History</button></div>'+
      '<div class="setting-row"><div><b>Settings Reset</b><small>Reset settings only. Progress is preserved.</small></div><button class="setting-action" onclick="phase5ResetSettings()">Reset Settings</button></div>');
    html+=section('Lore',
      toggle('loreMode','Lore Mode','Show optional lore-focused presentation. Turning this off never deletes unlocked Lore.'));
    const account=JSON.parse(localStorage.getItem('equinox-user')||'{}');
    html+=section('Account',
      '<div class="setting-row"><div><b>Username</b><small>'+esc(account.username||'Player')+'</small></div></div>'+
      '<div class="setting-row"><div><b>Email</b><small>'+esc(account.email||'')+'</small></div></div>'+
      '<div class="setting-row"><div><b>Achievement Titles</b><small>Equip titles from the Achievements tab. Only one may be equipped.</small></div><button class="setting-action" onclick="tab(\'Achievements\')">Manage</button></div>'+
      '<div class="setting-row"><div><b>Session</b><small>Sign out of this Equinox account.</small></div><button class="setting-action" onclick="equinoxLogout()">Sign Out</button></div>');
    html+='</div></div>';
    return html;
  }
  function applyVisualSettings(){
    if(!state?.settings)return;
    const s=state.settings,root=document.documentElement;
    root.classList.toggle('reduced-motion',!!s.reducedMotion);
    root.classList.toggle('high-contrast',!!s.highContrast);
    root.classList.toggle('colorblind-mode',!!s.colorblind);
    root.classList.toggle('compact-interface',!!s.compactInterface);
    root.classList.toggle('performance-mode',!!s.performanceMode||!!s.lowDetailMode);
  }
  function historyDB(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open('equinox-history-v1',1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('rolls'))db.createObjectStore('rolls',{keyPath:'key'});};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
    });
  }
  async function recordHistory(entry){
    if(!state.settings.rollHistory)return;
    try{
      const db=await historyDB();
      await new Promise((resolve,reject)=>{const tx=db.transaction('rolls','readwrite');tx.objectStore('rolls').put(entry);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      const cutoff=Math.max(0,Number(state.rolls||0)-1000000);
      const tx=db.transaction('rolls','readwrite'),store=tx.objectStore('rolls'),req=store.openCursor();
      req.onsuccess=()=>{const c=req.result;if(!c){return;}if(Number(c.value.roll)<cutoff)store.delete(c.key);c.continue();};
    }catch(e){console.warn('Roll History storage unavailable',e);}
  }
  async function historyAll(){
    try{const db=await historyDB();return await new Promise((resolve,reject)=>{const a=[],tx=db.transaction('rolls','readonly'),req=tx.objectStore('rolls').openCursor(null,'prev');req.onsuccess=()=>{const c=req.result;if(!c||a.length>=500){resolve(a);return;}a.push(c.value);c.continue();};req.onerror=()=>reject(req.error);});}
    catch(e){return [];}
  }
  function phase5OpenHistory(){window.__phase5HistoryOpen=true;render();}
  window.phase5OpenHistory=phase5OpenHistory;
  window.phase5HistorySearch='';
  async function historyView(){
    const rows=await historyAll(),q=String(window.phase5HistorySearch||'').trim().toLowerCase();
    const filtered=rows.filter(r=>{
      if(!q)return true;
      const rarity=String(r.rarity||'');
      return String(r.roll).includes(q)||String(r.aura||'').toLowerCase().includes(q)||rarity.includes(q);
    }).slice(0,100);
    return '<div class="history-page"><div class="panel"><button class="back-btn" onclick="window.__phase5HistoryOpen=false;render()">← Back</button><div class="section-title">Data · Roll History</div><h1>Roll History</h1><p class="muted">Showing up to 100 matching entries from the newest 500 stored locally. The game retains up to 1,000,000 entries.</p><div class="history-search"><input value="'+esc(q)+'" placeholder="Search roll number, rarity, or Aura…" oninput="phase5HistorySearch=this.value;phase5DebouncedHistory()"><button onclick="phase5HistorySearch='';render()">Clear</button></div><div class="history-list">'+(filtered.length?filtered.map(r=>'<div class="history-row"><b>#'+fmt(r.roll)+'</b><span>'+esc(r.aura||'None')+'</span><span>1/'+fmt(r.rarity||0)+'</span><span>Luck '+fmt(r.luck||1)+'</span><span>Speed '+fmt(r.speed||1)+'</span><span>'+esc(r.biome||'Normal')+'</span><span>'+esc(r.time||'Day')+'</span><span>'+((r.breakthrough)?'BREAKTHROUGH':'')+(r.bonus?' BONUS':'')+'</span></div>').join(''):'<div class="empty">No stored rolls match this search.</div>')+'</div></div></div>';
  }
  let historyTimer;
  window.phase5DebouncedHistory=function(){clearTimeout(historyTimer);historyTimer=setTimeout(render,150);};
  function beep(freq,duration,volume){
    try{
      if(state.settings.muted||!volume||!state.settings.masterVolume)return;
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      const ctx=window.__eq5audio||(window.__eq5audio=new Ctx()),o=ctx.createOscillator(),g=ctx.createGain();
      o.frequency.value=freq;o.type='sine';g.gain.value=Math.max(.0001,(volume/100)*(state.settings.masterVolume/100)*.04);
      o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+duration);
    }catch(e){}
  }
  function rarePresentation(entry){
    const mode=state.settings.rareRollDisplay||'Enhanced';
    if(mode==='Minimal'||mode==='Normal')return;
    const overlay=document.createElement('div');overlay.className='rare-overlay '+mode.toLowerCase();
    overlay.innerHTML='<div class="rare-card"><div class="section-title">RARE ROLL</div><h1>'+esc(entry.aura)+'</h1><div>1/'+fmt(entry.rarity)+'</div><small>Roll #'+fmt(entry.roll)+(entry.breakthrough?' • BREAKTHROUGH':'')+(entry.bonus?' • BONUS ROLL':'')+'</small><button>Continue</button></div>';
    overlay.querySelector('button').onclick=()=>overlay.remove();document.body.appendChild(overlay);
    beep(880,.16,state.settings.sfxVolume);setTimeout(()=>beep(1320,.22,state.settings.sfxVolume),100);
  }
  function wrapRoll(){
    if(window.__eq5RollWrapped||typeof window.roll!=='function')return;
    const original=window.roll;window.__eq5RollWrapped=true;
    window.roll=function(){
      const before=Number(state.rolls||0),result=original.apply(this,arguments),after=Number(state.rolls||0);
      const aura=state.recent?.[0]||{};
      const def=auraDef(aura.name);
      const entry={key:String(after),roll:after,aura:aura.name||'Nothing',rarity:Number(aura.rolledRarity||aura.rarity||def?.rarity||0),
        luck:Number(aura.luck||totalLuck()),speed:Number(aura.speed||totalSpeed()),biome:aura.biome||state.biome,time:aura.time||state.dayNight,
        breakthrough:!!aura.breakthrough,bonus:!!aura.bonus,createdAt:Date.now()};
      if(after>before)recordHistory(entry);
      if(entry.rarity>=1000000)rarePresentation(entry);else beep(440,.035,state.settings.sfxVolume);
      return result;
    };
  }
  function wrapGlobal(){
    if(typeof window.globalView!=='function'||window.__eq5GlobalWrapped)return;
    const original=window.globalView;window.__eq5GlobalWrapped=true;
    window.globalView=function(){
      const html=String(original.apply(this,arguments)),s=state.settings;
      let out=html;
      if(!s.globalChatDisplay){const a=out.indexOf('<div class="panel chat-panel">');const b=out.indexOf('<p class="muted global-note">',a);if(a>=0&&b>=0)out=out.slice(0,a)+out.slice(b);}
      if(!s.globalLeaderboardDisplay){const a=out.indexOf('<div class="global-boards">');const b=out.indexOf('<div class="panel online-panel">',a);if(a>=0&&b>=0)out=out.slice(0,a)+out.slice(b);}
      if(!s.onlineLeaderboardDisplay){const a=out.indexOf('<div class="panel online-panel">');const b=out.indexOf('<div class="panel chat-panel">',a);if(a>=0&&b>=0)out=out.slice(0,a)+out.slice(b);}
      return out;
    };
  }
  const originalToast=window.toast;
  window.toast=function(msg){
    const s=state.settings||S;
    if(!s.notifications)return;
    const t=String(msg||'').toLowerCase();
    let key='notifyWarnings';
    if(/breakthrough/.test(t))key='notifyBreakthroughs';
    else if(/biome/.test(t))key='notifyBiome';
    else if(/day|night/.test(t))key='notifyDayNight';
    else if(/quest/.test(t))key='notifyQuests';
    else if(/item|collected/.test(t))key='notifyItems';
    else if(/potion.*expired|expired/.test(t))key='notifyPotionExpiration';
    else if(/shop/.test(t))key='notifyShop';
    else if(/bank|withdraw|deposit/.test(t))key='notifyBank';
    else if(/jester|gamble/.test(t))key='notifyJester';
    else if(/craft|recipe/.test(t))key='notifyCrafting';
    else if(/rarity|aura/.test(t))key='notifyAuras';
    if(s[key]===false)return;
    if(typeof originalToast==='function')return originalToast(msg);
  };
  function patchRender(){
    if(window.__eq5RenderWrapped||typeof window.render!=='function')return;
    const original=window.render;window.__eq5RenderWrapped=true;
    window.render=function(){
      init();applyVisualSettings();
      if(window.__phase5HistoryOpen){
        Promise.resolve(historyView()).then(html=>{document.getElementById('app').innerHTML=html;});
        return;
      }
      const r=original.apply(this,arguments);
      setTimeout(()=>applyVisualSettings(),0);
      return r;
    };
  }
  function boot(){init();wrapRoll();wrapGlobal();patchRender();render();}
  setTimeout(boot,3200);
})();
