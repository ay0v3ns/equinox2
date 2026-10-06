/* Equinox Phase 5 */
(function(){
  var D={
    autoRoll:false,autoEquip:false,autoSkip:false,rollConfirmation:false,potionConfirmation:true,craftingConfirmation:true,confirmShopPurchase:true,rollResultBehavior:"Full",
    auraNames:true,auraRarities:true,rollEffects:"Full",auraAnimations:"Full",biomeEffects:"Full",weatherEffects:"Full",damageScreenEffects:"Full",rareRollDisplay:"Enhanced",biomeTransitionEffects:"Full",
    notifications:true,notifyCrafting:true,notifyAuras:true,notifyBreakthroughs:true,notifyGlobalPlacement:true,notifyBiome:true,notifyDayNight:true,notifyWarnings:true,notifyQuests:true,notifyItems:true,notifyJester:true,notifyBank:true,notifyPotionExpiration:true,notifyShop:true,
    masterVolume:70,musicVolume:60,sfxVolume:80,uiVolume:80,muted:false,compactInterface:false,showClock:true,showRecentRolls:true,showRightPanel:true,
    reducedMotion:false,reducedFlash:false,screenShake:"Full",highContrast:false,colorblind:false,particleQuality:"High",auraQuality:"High",biomeQuality:"High",maximumEffects:100,fpsLimit:60,performanceMode:false,lowDetailMode:false,
    globalChatDisplay:true,globalLeaderboardDisplay:true,onlineLeaderboardDisplay:true,showOtherTitles:true,showGlobalRank:true,rollHistory:true,statistics:true,loreMode:true
  };
  var O={
    rollResultBehavior:["Full","Compact","Minimal","Instant"],rollEffects:["Full","Reduced","Off"],auraAnimations:["Full","Reduced","Minimal","Off"],
    biomeEffects:["Full","Reduced","Minimal","Off"],weatherEffects:["Full","Reduced","Off"],damageScreenEffects:["Full","Reduced","Off"],rareRollDisplay:["Normal","Enhanced","Cinematic","Minimal"],
    biomeTransitionEffects:["Full","Reduced","Instant"],screenShake:["Full","Reduced","Off"],particleQuality:["High","Medium","Low","Off"],auraQuality:["High","Medium","Low"],biomeQuality:["High","Medium","Low"]
  };
  function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function init(){state.settings=Object.assign({},D,state.settings||{});}
  function save5(){localStorage.setItem("equinox-save-v1",JSON.stringify(state));apply();}
  function apply(){var s=state.settings||D,r=document.documentElement;r.classList.toggle("reduced-motion",!!s.reducedMotion);r.classList.toggle("high-contrast",!!s.highContrast);r.classList.toggle("colorblind-mode",!!s.colorblind);r.classList.toggle("compact-interface",!!s.compactInterface);r.classList.toggle("performance-mode",!!s.performanceMode||!!s.lowDetailMode);}
  window.phase5Toggle=function(k){init();state.settings[k]=!state.settings[k];save5();render();};
  window.phase5SetSetting=function(k,v){init();state.settings[k]=v;save5();render();};
  window.phase5ResetSettings=function(){if(!confirm("Reset Settings to defaults? Your progress will remain."))return;state.settings=Object.assign({},D);save5();toast("Settings reset.");render();};
  function t(k,n,d){var on=!!state.settings[k];return '<div class="setting-row"><div><b>'+esc(n)+'</b><small>'+esc(d)+'</small></div><button class="setting-toggle '+(on?"on":"")+'" onclick="phase5Toggle(\''+k+'\')">'+(on?"ON":"OFF")+'</button></div>';}
  function s(k,n,d){var a=O[k]||[],x=a.map(function(v){return '<option value="'+esc(v)+'" '+(state.settings[k]===v?"selected":"")+'>'+esc(v)+'</option>';}).join("");return '<div class="setting-row"><div><b>'+esc(n)+'</b><small>'+esc(d)+'</small></div><select class="settings-select" onchange="phase5SetSetting(\''+k+'\',this.value)">'+x+'</select></div>';}
  function r(k,n,d,min,max,step){return '<div class="setting-row"><div><b>'+esc(n)+'</b><small>'+esc(d)+'</small></div><input class="setting-range" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+Number(state.settings[k])+'" oninput="phase5SetSetting(\''+k+'\',Number(this.value))"><b class="setting-value">'+Number(state.settings[k])+'</b></div>';}
  function sec(n,b){return '<section class="panel settings-section"><div class="section-title">'+n+'</div>'+b+'</section>';}
  window.settingsView=function(){
    init();var h='<div class="settings-page"><div class="panel settings-hero"><div class="section-title">Player Configuration</div><h1>Settings</h1><p class="muted">Control Equinox presentation, automation, accessibility, performance, social display, data, lore, and account behavior.</p></div><div class="settings-grid">';
    h+=sec("Gameplay",t("autoRoll","Auto Roll","Continuously roll after it is unlocked.")+t("autoEquip","Auto Equip","Respect per-Aura Auto Equip rules.")+t("autoSkip","Auto Skip","Respect per-Aura Auto Skip rules.")+t("rollConfirmation","Roll Confirmation","Confirm manual rolling actions.")+t("potionConfirmation","Potion Confirmation","Confirm before using Potions.")+t("craftingConfirmation","Crafting Confirmation","Confirm before crafting.")+t("confirmShopPurchase","Shop Purchase Confirmation","Confirm before spending Coins in Mari's Shop.")+s("rollResultBehavior","Roll Result Behavior","Full, Compact, Minimal, or Instant."));
    h+=sec("Display",t("auraNames","Aura Names","Show Aura names.")+t("auraRarities","Aura Rarities","Show rarity denominators.")+s("rollEffects","Roll Effects","Visual roll effects.")+s("auraAnimations","Aura Animations","Aura animation intensity.")+s("biomeEffects","Biome Effects","Biome visuals.")+s("weatherEffects","Weather Effects","Weather visuals.")+s("damageScreenEffects","Damage/Screen Effects","Temporary screen effects.")+s("rareRollDisplay","Rare Roll Display","Normal, Enhanced, Cinematic, or Minimal.")+s("biomeTransitionEffects","Biome Transition Effects","Biome change presentation."));
    h+=sec("Notifications",t("notifications","Notifications","Master notification switch.")+t("notifyCrafting","Crafting Recipes Ready","Crafting notifications.")+t("notifyAuras","Aura Rarity Notifications","Aura notifications.")+t("notifyBreakthroughs","Breakthroughs","Breakthrough notifications.")+t("notifyGlobalPlacement","Leaderboard Placement","Top-ten notifications.")+t("notifyBiome","Biome Changes","Biome notifications.")+t("notifyDayNight","Day/Night Changes","Day/Night notifications.")+t("notifyWarnings","Warnings / Confirmations","Warning notifications.")+t("notifyQuests","Quest Resets / Completions","Quest notifications.")+t("notifyItems","Items Collected","Item notifications.")+t("notifyJester","Jester's Gamble Rewards","Gamble notifications.")+t("notifyBank","Bank Ready","Bank notifications.")+t("notifyPotionExpiration","Potion Expiration","Potion expiration notifications.")+t("notifyShop","Shop Reset","Shop notifications."));
    h+=sec("Audio",t("muted","Mute All Audio","Disable Equinox audio.")+r("masterVolume","Master Volume","All audio.",0,100,1)+r("musicVolume","Music Volume","Music.",0,100,1)+r("sfxVolume","SFX Volume","Roll and rare-event sounds.",0,100,1)+r("uiVolume","UI Volume","Interface sounds.",0,100,1));
    h+=sec("Interface",t("compactInterface","Compact Interface","Reduce spacing.")+t("showClock","Show Clock","Display Day/Night time.")+t("showRecentRolls","Show Recent Rolls","Display recent rolls.")+t("showRightPanel","Show World Panel","Display world state."));
    h+=sec("Accessibility",t("reducedMotion","Reduced Motion","Reduce movement.")+t("reducedFlash","Reduced Flash","Reduce flashing.")+s("screenShake","Screen Shake","Full, Reduced, or Off.")+t("highContrast","High Contrast","Increase interface contrast.")+t("colorblind","Colorblind Options","Add stronger non-color cues."));
    h+=sec("Performance",s("particleQuality","Particle Quality","Particle workload.")+s("auraQuality","Aura Quality","Aura visual complexity.")+s("biomeQuality","Biome Quality","Biome visual complexity.")+r("maximumEffects","Maximum Effects","Maximum simultaneous effects.",0,100,5)+r("fpsLimit","FPS Limit","Client frame-rate target.",30,240,30)+t("performanceMode","Performance Mode","Broad performance reductions.")+t("lowDetailMode","Low Detail Mode","Reduce particles, glow, effects, and animation."));
    h+=sec("Privacy & Social",t("globalChatDisplay","Global Chat Display","Show Global Chat.")+t("globalLeaderboardDisplay","Global Leaderboard Display","Show global leaderboards.")+t("onlineLeaderboardDisplay","Online Leaderboard Display","Show online leaderboards.")+t("showOtherTitles","Show Other Players' Achievement Titles","Show other players' titles.")+t("showGlobalRank","Show Global Rank","Show rank in chat."));
    h+=sec("Data",t("rollHistory","Roll History","Store up to 1,000,000 rolls.")+t("statistics","Statistics","Show accumulated statistics.")+'<div class="setting-row"><div><b>Roll History</b><small>Search by roll number, rarity, or Aura.</small></div><button class="setting-action" onclick="phase5OpenHistory()">Open History</button></div><div class="setting-row"><div><b>Settings Reset</b><small>Reset settings only.</small></div><button class="setting-action" onclick="phase5ResetSettings()">Reset Settings</button></div>');
    h+=sec("Lore",t("loreMode","Lore Mode","Show optional lore-focused presentation."));
    var a=JSON.parse(localStorage.getItem("equinox-user")||"{}");
    h+=sec("Account",'<div class="setting-row"><div><b>Username</b><small>'+esc(a.username||"Player")+'</small></div></div><div class="setting-row"><div><b>Email</b><small>'+esc(a.email||"")+'</small></div></div><div class="setting-row"><div><b>Achievement Titles</b><small>Manage equipped Achievement Titles.</small></div><button class="setting-action" onclick="tab(\'Achievements\')">Manage</button></div><div class="setting-row"><div><b>Session</b><small>Sign out of this account.</small></div><button class="setting-action" onclick="equinoxLogout()">Sign Out</button></div>');
    return h+"</div></div>";
  };
  function db(){return new Promise(function(ok,no){var q=indexedDB.open("equinox-history-v1",1);q.onupgradeneeded=function(){if(!q.result.objectStoreNames.contains("rolls"))q.result.createObjectStore("rolls",{keyPath:"key"});};q.onsuccess=function(){ok(q.result);};q.onerror=function(){no(q.error);};});}
  function record(e){if(!state.settings.rollHistory)return;db().then(function(x){var tx=x.transaction("rolls","readwrite");tx.objectStore("rolls").put(e);});}
  window.__phase5HistoryOpen=false;window.phase5HistorySearch="";
  window.phase5OpenHistory=function(){window.__phase5HistoryOpen=true;render();};
  window.phase5HistoryClear=function(){window.phase5HistorySearch="";render();};
  function history(){
    return db().then(function(x){return new Promise(function(ok){var a=[],tx=x.transaction("rolls","readonly"),q=tx.objectStore("rolls").openCursor(null,"prev");q.onsuccess=function(){var c=q.result;if(!c||a.length>=1000000){ok(a);return;}a.push(c.value);c.continue();};});}).catch(function(){return [];});
  }
  function historyView(){
    return history().then(function(rows){
      var q=String(window.phase5HistorySearch||"").toLowerCase(),f=rows.filter(function(x){return !q||String(x.roll).indexOf(q)>=0||String(x.rarity).indexOf(q)>=0||String(x.aura||"").toLowerCase().indexOf(q)>=0;});
      var list=f.slice(0,100).map(function(x){return '<div class="history-row"><b>#'+fmt(x.roll)+'</b><span>'+esc(x.aura||"None")+'</span><span>1/'+fmt(x.rarity||0)+'</span><span>Luck '+fmt(x.luck||1)+'</span><span>Speed '+fmt(x.speed||1)+'</span><span>'+esc(x.biome||"Normal")+'</span><span>'+esc(x.time||"Day")+'</span><span>'+(x.breakthrough?"BREAKTHROUGH ":"")+(x.bonus?"BONUS":"")+'</span></div>';}).join("");
      return '<div class="history-page"><div class="panel"><button class="back-btn" onclick="window.__phase5HistoryOpen=false;render()">← Back</button><div class="section-title">Data · Roll History</div><h1>Roll History</h1><p class="muted">Newest entries first. Up to 1,000,000 rolls are retained.</p><div class="history-search"><input value="'+esc(q)+'" placeholder="Search roll number, rarity, or Aura…" oninput="phase5HistorySearch=this.value;clearTimeout(window.__eq5t);window.__eq5t=setTimeout(render,150)"><button onclick="phase5HistoryClear()">Clear</button></div><div class="history-list">'+(list||'<div class="empty">No stored rolls match this search.</div>')+'</div></div></div>';
    });
  }
  function rare(e){
    var m=state.settings.rareRollDisplay;if(m==="Normal"||m==="Minimal")return;
    var o=document.createElement("div");o.className="rare-overlay "+String(m).toLowerCase();o.innerHTML='<div class="rare-card"><div class="section-title">RARE ROLL</div><h1>'+esc(e.aura)+'</h1><div>1/'+fmt(e.rarity)+'</div><small>Roll #'+fmt(e.roll)+(e.breakthrough?" • BREAKTHROUGH":"")+(e.bonus?" • BONUS ROLL":"")+'</small><button>Continue</button></div>';o.querySelector("button").onclick=function(){o.remove();};document.body.appendChild(o);
  }
  function wrapRoll(){
    if(window.__eq5ResolveWrapped||typeof window.resolveRoll!=="function")return;
    window.__eq5ResolveWrapped=true;
    var oldResolve=window.resolveRoll;
    window.resolveRoll=function(){
      var out=oldResolve.apply(this,arguments);
      try{
        var a=(window.state&&window.state.recent&&window.state.recent[0])||{};
        if(a&&Number(a.roll||0)>0){
          var d=auraDef(a.name);
          var e={
            key:String(a.roll),roll:Number(a.roll),aura:a.name||"Nothing",
            rarity:Number(a.rolledRarity||a.rarity||(d?d.rarity:0)),
            luck:Number(a.luck||totalLuck()),speed:Number(a.speed||totalSpeed()),
            biome:a.biome||window.state.biome,time:a.time||window.state.dayNight,
            breakthrough:!!a.breakthrough,bonus:!!a.bonus
          };
          record(e);
          if(e.rarity>=1000000)rare(e);
        }
      }catch(err){console.warn("Equinox roll history/rare display failed:",err)}
      return out;
    };
  }
  function patchRender(){
    if(window.__eq5render||typeof window.render!=="function")return;window.__eq5render=true;var old=window.render;
    window.render=function(){init();apply();if(window.__phase5HistoryOpen){historyView().then(function(h){document.getElementById("app").innerHTML=h;});return;}return old.apply(this,arguments);};
  }
  function boot(){init();apply();wrapRoll();patchRender();}
  setTimeout(boot,3200);
})();
