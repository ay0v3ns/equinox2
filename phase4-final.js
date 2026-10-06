/* Equinox Phase 4 final client bridge.
 * Keeps the existing Phase 4 implementation, but closes the remaining
 * shared-shop, leaderboard, moderation, and account-control gaps.
 */
(function(){
  function currentUserId(){
    try { return JSON.parse(localStorage.getItem('equinox-user')||'{}').id || null; } catch(e){ return null; }
  }
  function currentAccount(){
    try { return JSON.parse(localStorage.getItem('equinox-user')||'{}'); } catch(e){ return {}; }
  }
  function hourIso(){
    const d=new Date(); d.setMinutes(0,0,0); return d.toISOString();
  }
  function targetingLanguage(text){
    const s=String(text||'').toLowerCase();
    return /(^|\\s)(you|u|ur|your|youre|you're)\\s+(are|r|is)|@\\w+|kill\\s+(yourself|urself)|go\\s+die|nobody\\s+wants\\s+you|hate\\s+you|shut\\s+up/i.test(s);
  }
  function blockedLanguage(text){
    const s=String(text||'').toLowerCase();
    return /\\b(nigg(?:er|a)|fagg(?:ot)?|trann(?:y|ie)|kys)\\b/i.test(s);
  }

  window.equinoxResetAccount = async function(){
    if(typeof EQUINOX_SUPABASE==='undefined') return;
    if(!confirm('Reset your Equinox account? This removes all progression and saved game data, but keeps the account.')) return;
    const {error}=await EQUINOX_SUPABASE.rpc('reset_my_account');
    if(error){ toast(error.message); return; }
    localStorage.removeItem('equinox-save-v1');
    localStorage.removeItem('equinox-user');
    location.reload();
  };

  window.equinoxDeleteAccount = async function(){
    if(typeof EQUINOX_SUPABASE==='undefined') return;
    if(!confirm('Delete your Equinox account permanently? This cannot be undone.')) return;
    if(!confirm('Final confirmation: permanently delete this account and all of its data?')) return;
    const {error}=await EQUINOX_SUPABASE.rpc('delete_my_account');
    if(error){ toast(error.message); return; }
    localStorage.removeItem('equinox-save-v1');
    localStorage.removeItem('equinox-user');
    location.reload();
  };

  window.equinoxAccountPanel = function(){
    const a=currentAccount();
    return '<div class="panel" style="margin-top:18px"><div class="section-title">Account</div>'+
      '<div class="setting-row"><div><b>Username</b><small>'+eq4escape(a.username||'Player')+'</small></div></div>'+
      '<div class="setting-row"><div><b>Email</b><small>'+eq4escape(a.email||'')+'</small></div></div>'+
      '<div class="setting-actions"><button onclick="equinoxResetAccount()">Reset Account</button><button class="danger" onclick="equinoxDeleteAccount()">Delete Account</button></div></div>';
  };

  async function refreshProfileRank(){
    if(typeof EQUINOX_SUPABASE==='undefined') return;
    const uid=currentUserId(); if(!uid) return;
    const {data:rows}=await EQUINOX_SUPABASE.from('profiles').select('id,auras_collected,collective_rarity,rarest_roll_rarity,roll_count');
    if(!rows) return;
    const rankBy=(field)=>{
      const sorted=rows.slice().sort((a,b)=>Number(b[field]||0)-Number(a[field]||0));
      const i=sorted.findIndex(x=>x.id===uid); return i<0?'Unranked':'#'+(i+1);
    };
    const stateObj=window.state;
    if(stateObj){
      stateObj.globalRank=rankBy('collective_rarity');
      if(typeof save==='function') save();
    }
  }

  window.buyShopItem = async function(i){
    if(typeof EQUINOX_SUPABASE==='undefined'){ toast('Global Shop is unavailable.'); return; }
    const local=typeof shopStock==='function'?shopStock():null;
    const item=local?.items?.[i];
    if(!item) return;
    if(settingEnabled && settingEnabled('confirmShopPurchase') && !confirm('Buy '+item.name+' for '+fmt(shopPrice(item.name))+' Coins?')) return;
    const price=shopPrice(item.name);
    if((state.inventory.Coins||0)<price){ toast('Need '+fmt(price)+' Coins.'); return; }
    const itemId=String(item.type)+'::'+String(item.name);
    const {data,error}=await EQUINOX_SUPABASE.rpc('purchase_shop_item',{p_item_id:itemId,p_hour_key:hourIso()});
    if(error){ toast(error.message); return; }
    takeItem('Coins',price);
    addItem(item.name,1);
    await eq4LoadSharedShop();
    save(); render();
    toast('Bought '+item.name+' • shared stock: '+Number(data.stock||0));
  };

  window.eq4SendChat = async function(){
    if(typeof EQUINOX_SUPABASE==='undefined') return;
    const input=document.getElementById('globalChatInput');
    const message=(input?.value||'').trim().slice(0,150);
    if(!message)return;
    if(blockedLanguage(message)){toast('That message contains prohibited language.');return;}
    const {data:sessionData}=await EQUINOX_SUPABASE.auth.getSession();
    const user=sessionData?.session?.user; if(!user)return;
    const ban=await EQUINOX_SUPABASE.from('chat_bans').select('banned_until').eq('user_id',user.id).maybeSingle();
    if(ban.data?.banned_until&&new Date(ban.data.banned_until)>new Date()){toast('You are banned from Global Chat until '+new Date(ban.data.banned_until).toLocaleString()+'.');return;}
    const account=currentAccount();
    const aura=state.auras.find(a=>a.equipped);
    const {error}=await EQUINOX_SUPABASE.from('chat_messages').insert({
      user_id:user.id,username:account.username||state.username||'Player',
      global_rank:state.globalRank||'Unranked',equipped_aura_id:aura?.id||null,
      equipped_aura_name:aura?.name||null,equipped_aura_rarity:aura?.rarity||null,message
    });
    if(error){toast(error.message);return;}
    input.value=''; await eq4RefreshGlobal(true); render();
  };

  window.eq4FlagChat = async function(messageId){
    if(typeof EQUINOX_SUPABASE==='undefined')return;
    const {data:sessionData}=await EQUINOX_SUPABASE.auth.getSession();
    const user=sessionData?.session?.user; if(!user)return;
    const msg=(window.EQUINOX_GLOBAL_DATA.chat||[]).find(x=>Number(x.id)===Number(messageId));
    if(!msg || !targetingLanguage(msg.message)){toast('This message is not currently flaggable.');return;}
    const {error}=await EQUINOX_SUPABASE.from('chat_flags').insert({message_id:messageId,flagger_id:user.id,reason:'Targeting language'});
    if(error){toast(error.code==='23505'?'You already flagged this message.':'Unable to flag this message.');return;}
    toast('Anonymous flag submitted.');
  };

  function wrapGlobalView(){
    if(typeof window.eq4GlobalView!=='function' || window.__eq4FinalGlobalWrapped)return;
    window.__eq4FinalGlobalWrapped=true;
    window.globalView=function(){
      const g=globalStats();
      const all=window.EQUINOX_GLOBAL_DATA.profiles||[];
      const online=window.EQUINOX_GLOBAL_DATA.presence||[];
      const rankRows=(field,source)=>{
        const rows=(source||all).slice().sort((a,b)=>Number(b[field]||0)-Number(a[field]||0)).slice(0,10);
        return rows.length?rows.map((x,i)=>'<div class="leader-row"><span>#'+(i+1)+' '+eq4escape(x.username)+'</span><b>'+fmt(Number(x[field]||0))+'</b></div>').join(''):'<div class="empty">No players yet.</div>';
      };
      const boards=[['Auras Collected','auras_collected'],['Collective Rarity','collective_rarity'],['Rarest Roll','rarest_roll_rarity'],['Roll Count','roll_count']].map(p=>
        '<div class="global-board panel"><div class="section-title">Global · '+p[0]+'</div>'+rankRows(p[1],all)+'</div>'+
        '<div class="global-board panel"><div class="section-title">Online · '+p[0]+'</div>'+rankRows(p[1],online)+'</div>'
      ).join('');
      const onlineRows=online.map(x=>'<div class="online-row"><b>'+eq4escape(x.username)+'</b><span>'+eq4escape(x.global_rank||'Unranked')+'</span><span>'+eq4escape(x.equipped_aura_name||'None')+(x.equipped_aura_rarity?' • 1/'+fmt(x.equipped_aura_rarity):'')+'</span></div>').join('')||'<div class="empty">No players online.</div>';
      const chat=(window.EQUINOX_GLOBAL_DATA.chat||[]).filter(m=>{
        const banned=targetingLanguage(m.message); return !m.hidden;
      }).map(m=>'<div class="chat-msg"><b>'+eq4escape(m.username)+'</b><small>'+eq4escape(m.global_rank||'Unranked')+' • '+eq4escape(m.equipped_aura_name||'None')+(m.equipped_aura_rarity?' • 1/'+fmt(m.equipped_aura_rarity):'')+(targetingLanguage(m.message)?' <button class="chat-flag" onclick="eq4FlagChat('+m.id+')">Flag</button>':'')+'</small><span>'+eq4escape(m.message)+'</span></div>').join('')||'<div class="empty">No messages yet.</div>';
      return '<div class="global-page"><div class="panel global-profile"><div><div class="section-title">Player Rank</div><h1>'+eq4escape(g.username)+'</h1><p class="muted">Equipped Aura: '+eq4escape(g.equipped)+(g.title?' • Title: ['+eq4escape(g.title)+']':'')+'</p></div><div class="global-metrics"><span>Unique Auras <b>'+fmt(g.aurasCollected)+'</b></span><span>Rarest Roll <b>1/'+fmt(g.rarestRoll||0)+'</b></span><span>Rolls <b>'+fmt(g.rollCount)+'</b></span></div></div><div class="global-boards">'+boards+'</div><div class="panel online-panel"><div class="section-title">Online Players</div>'+onlineRows+'</div><div class="panel chat-panel"><div class="section-title">Global Chat · 150 messages max</div><div class="chat-log">'+chat+'</div><div class="chat-compose"><input id="globalChatInput" maxlength="150" placeholder="Message Global Chat…"><button onclick="eq4SendChat()">Send</button></div></div><p class="muted global-note">Live global data • leaderboard snapshots update hourly • Supabase connected</p></div>';
    };
  }

  function wrapSettings(){
    if(typeof window.settingsView!=='function' || window.__eq4SettingsWrapped)return;
    const original=window.settingsView; window.__eq4SettingsWrapped=true;
    window.settingsView=function(){
      const base=original.apply(this,arguments);
      return String(base).replace(/<\/div>\s*$/,'')+window.equinoxAccountPanel()+'</div>';
    };
  }

  async function boot(){
    wrapGlobalView();
    wrapSettings();
    refreshProfileRank();
    setInterval(refreshProfileRank,60000);
    setInterval(async()=>{if(typeof eq4Presence==='function')await eq4Presence();},20000);
  }
  setTimeout(boot,2500);
})();
