/* Equinox Phase 4 final client bridge.
 * Keeps the existing Phase 4 implementation, but closes the remaining
 * shared-shop, leaderboard, moderation, and account-control gaps.
 */
(function(){
  window.EQUINOX_GLOBAL_DATA=window.EQUINOX_GLOBAL_DATA||{profiles:[],presence:[],chat:[],loaded:false,lastRefresh:0};
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
    const stateObj=window.state||null;
    if(stateObj){
      stateObj.globalRank=rankBy('collective_rarity');
      if(typeof save==='function') save();
    }
  }

  const localBuyShopItem=window.buyShopItem;
  window.buyShopItem = async function(i){
    if(!window.EQ4_SHARED?.shopServerBacked){
      if(typeof localBuyShopItem==='function')return localBuyShopItem(i);
      toast('Global Shop is unavailable.'); return;
    }
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
    // The base app owns the canonical Global renderer. Phase 4 only supplies
    // server data, moderation, presence, and account controls.
    if(typeof window.globalView==='function') return;
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
