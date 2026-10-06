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

  window.EQUINOX_SHARED_DATA=window.EQUINOX_SHARED_DATA||{
    hour:'',
    quests:[],
    shop:[],
    questProgress:[],
    loaded:false,
    loading:false,
    errors:[]
  };
  function eq4SharedHour(){return hourIso();}
  async function eq4RefreshSharedSystems(force){
    if(typeof EQUINOX_SUPABASE==='undefined')return false;
    const sd=window.EQUINOX_SHARED_DATA;
    const hour=eq4SharedHour();
    if(sd.loading)return false;
    if(!force&&sd.loaded&&sd.hour===hour)return true;
    sd.loading=true;sd.errors=[];
    try{
      const results=await Promise.all([
        EQUINOX_SUPABASE.from('global_quests').select('quest_id,hour_key,quest_index,quest_data').eq('hour_key',hour).order('quest_index',{ascending:true}),
        EQUINOX_SUPABASE.from('shop_stock').select('item_id,item_name,rarity,stock,max_stock,hour_key').eq('hour_key',hour).order('item_id',{ascending:true})
      ]);
      const q=results[0],s=results[1];
      if(q.error)sd.errors.push('Quests: '+q.error.message);
      else sd.quests=(q.data||[]).map(function(row){
        return Object.assign({},row.quest_data||{},{serverId:row.quest_id});
      });
      if(s.error)sd.errors.push('Shop: '+s.error.message);
      else sd.shop=s.data||[];
      sd.questProgress=[];
      try{
        const session=await EQUINOX_SUPABASE.auth.getSession();
        const uid=session?.data?.session?.user?.id;
        if(uid&&sd.quests.length){
          const ids=sd.quests.map(function(q){return q.serverId});
          const qp=await EQUINOX_SUPABASE.from('quest_progress').select('quest_id,progress,completed,completed_at').eq('user_id',uid).in('quest_id',ids);
          if(qp.error)sd.errors.push('Quest Progress: '+qp.error.message);
          else sd.questProgress=qp.data||[];
        }
      }catch(err){sd.errors.push('Quest Progress: '+String(err?.message||err))}
      sd.hour=hour;sd.loaded=true;
      if(typeof state!=='undefined'&&state){
        const localHour=Math.floor(Date.now()/3600000);
        if(state.questState&&state.questState.hour===localHour){
          const qpMap=new Map(sd.questProgress.map(function(p){return [p.quest_id,p]}));
          sd.quests.forEach(function(q){
            const p=qpMap.get(q.serverId);
            if(!p)return;
            state.questState.progress=state.questState.progress||{};
            state.questState.progress[q.id]=Math.max(Number(state.questState.progress[q.id]||0),Number(p.progress||0));
            if(p.completed&&!state.questState.completed.includes(q.id))state.questState.completed.push(q.id);
          });
        }
      }
      return sd.errors.length===0;
    }catch(err){
      sd.errors.push(String(err?.message||err));
      sd.loaded=true;
      sd.hour=hour;
      return false;
    }finally{
      sd.loading=false;
      if(typeof render==='function'&&typeof state!=='undefined'&&state.activeTab==='NPCs')render();
    }
  }
  window.eq4RefreshSharedSystems=eq4RefreshSharedSystems;
  window.eq4LoadSharedShop=function(){return eq4RefreshSharedSystems(true);};
  window.eq4RecordQuestProgress=async function(q,progress,completed){
    if(typeof EQUINOX_SUPABASE==='undefined'||!q?.serverId)return false;
    const session=await EQUINOX_SUPABASE.auth.getSession();
    const uid=session?.data?.session?.user?.id;
    if(!uid)return false;
    const payload={
      user_id:uid,
      quest_id:String(q.serverId),
      progress:Math.max(0,Math.floor(Number(progress||0))),
      completed:!!completed,
      completed_at:completed?new Date().toISOString():null
    };
    const {error}=await EQUINOX_SUPABASE.from('quest_progress').upsert(payload,{onConflict:'user_id,quest_id'});
    if(error){console.warn('Shared quest progress write failed:',error);return false;}
    return true;
  };

  const localQuestBoard=questBoard;
  window.questBoard=function(){
    const sd=window.EQUINOX_SHARED_DATA;
    if(sd&&sd.loaded&&sd.hour===eq4SharedHour()&&sd.quests.length){
      return sd.quests.map(function(q){return Object.assign({},q)});
    }
    return localQuestBoard();
  };
  const localShopStock=shopStock;
  window.shopStock=function(){
    const sd=window.EQUINOX_SHARED_DATA;
    if(sd&&sd.loaded&&sd.hour===eq4SharedHour()&&sd.shop.length){
      return {
        hour:Math.floor(Date.now()/3600000),
        items:sd.shop.map(function(row){
          const parts=String(row.item_id||'Item::'+row.item_name).split('::');
          return {
            type:parts[0]||'Item',
            name:row.item_name,
            stock:Number(row.stock||0),
            initialStock:Number(row.max_stock||row.stock||0),
            bought:false,
            weight:0,
            itemId:String(row.item_id||'')
          };
        })
      };
    }
    return localShopStock();
  };
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
    const shared=window.EQUINOX_SHARED_DATA;
    if(!shared?.loaded||!shared?.shop?.length){
      if(typeof window.eq4RefreshSharedSystems==='function')await window.eq4RefreshSharedSystems(true);
    }
    if(typeof EQUINOX_SUPABASE==='undefined'){
      if(typeof localBuyShopItem==='function')return localBuyShopItem(i);
      toast('Global Shop is unavailable.'); return;
    }
    const local=typeof window.shopStock==='function'?window.shopStock():null;
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
    if(typeof window.eq4LoadSharedShop==='function')await window.eq4LoadSharedShop();
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
    if(typeof window.eq4RefreshSharedSystems==='function')void window.eq4RefreshSharedSystems(true);
    refreshProfileRank();
    setInterval(refreshProfileRank,60000);
    setInterval(async()=>{if(typeof eq4Presence==='function')await eq4Presence();},20000);
  }
  setTimeout(boot,2500);
})();
