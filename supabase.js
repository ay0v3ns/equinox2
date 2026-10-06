/* Equinox Phase 4 — Supabase integration
 * Browser-safe: uses only the publishable/anon key. Never put a service-role key here.
 */
const EQUINOX_SUPABASE_URL = 'https://kguzdgrlhgbaaksjclnx.supabase.co';
const EQUINOX_SUPABASE_KEY = 'sb_publishable_SvoHzlKpD0olE8ZjZR7CBg_vkNei7N5';
const EQUINOX_SUPABASE = window.supabase.createClient(EQUINOX_SUPABASE_URL, EQUINOX_SUPABASE_KEY);

const AUTH_UI = {
  root: null,
  mode: 'login',
  busy: false,
  hydrating: false
};

function authEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showAuthGate(message='') {
  if (!AUTH_UI.root) {
    AUTH_UI.root = document.createElement('div');
    AUTH_UI.root.id = 'equinox-auth-gate';
    document.body.appendChild(AUTH_UI.root);
  }
  AUTH_UI.root.style.display = 'grid';
  renderAuthGate(message);
}

function hideAuthGate() {
  if (AUTH_UI.root) AUTH_UI.root.style.display = 'none';
}

function equinoxReloadLocalState(){
  try {
    if (typeof state === 'undefined' || typeof load !== 'function') return;
    state = load();
  } catch (e) {
    console.warn('Equinox local state reload failed:', e);
  }
}

function renderAuthGate(message='') {
  if (!AUTH_UI.root) return;
  const signup = AUTH_UI.mode === 'signup';
  AUTH_UI.root.innerHTML = '<div class="auth-card">' +
    '<div class="auth-brand"><span class="auth-orb">☯</span><div><div class="section-title">EQUINOX</div><h1>' + (signup?'Create Account':'Welcome Back') + '</h1></div></div>' +
    '<p class="muted">' + (signup?'Create your Equinox account to save your progress and join the global world.':'Welcome back to Equinox.') + '</p>' +
    (message?'<div class="auth-message">'+authEscape(message)+'</div>':'') +
    (signup?'<label>Username<input id="auth-username" maxlength="20" autocomplete="username" placeholder="3–20 letters, numbers, _"></label>':'') +
    '<label>Email<input id="auth-email" type="email" autocomplete="email" placeholder="you@example.com"></label>' +
    '<label>Password<input id="auth-password" type="password" autocomplete="'+(signup?'new-password':'current-password')+'" placeholder="At least 6 characters"></label>' +
    '<button class="primary auth-submit" onclick="equinoxAuthSubmit()">'+(signup?'Create Account':'Sign In')+'</button>' +
    '<button class="auth-switch" onclick="equinoxAuthToggle()">'+(signup?'Already have an account? Sign in':'New to Equinox? Create an account')+'</button>' +
    '</div>';
}

function equinoxAuthToggle() {
  AUTH_UI.mode = AUTH_UI.mode === 'login' ? 'signup' : 'login';
  renderAuthGate();
}

async function equinoxAuthSubmit() {
  if (AUTH_UI.busy) return;
  AUTH_UI.busy = true;
  const submitButton = document.querySelector('.auth-submit');
  if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Signing in…'; }
  try {
  const email = document.getElementById('auth-email')?.value.trim();
  const password = document.getElementById('auth-password')?.value || '';
  const username = document.getElementById('auth-username')?.value.trim() || '';
  if (!email || !password) return renderAuthGate('Email and password are required.');
  if (AUTH_UI.mode === 'signup') {
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return renderAuthGate('Username must be 3–20 letters, numbers, or underscores.');
    const { data: taken, error: takenError } = await EQUINOX_SUPABASE.from('profiles').select('id').ilike('username', username).limit(1);
    if (takenError) return renderAuthGate(takenError.message);
    if (taken?.length) return renderAuthGate('That username is already taken.');
    const { data, error } = await EQUINOX_SUPABASE.auth.signUp({
      email, password, options: { data: { username } }
    });
    if (error) return renderAuthGate(error.message);
    if (!data.session) {
      AUTH_UI.mode = 'login';
      return renderAuthGate('Account created. Check your email to confirm the account, then sign in.');
    }
  } else {
    const { error } = await EQUINOX_SUPABASE.auth.signInWithPassword({email, password});
    if (error) return renderAuthGate(error.message);
  }
  await equinoxHydrate();
  } catch (e) {
    console.error('Equinox authentication failed', e);
    renderAuthGate(e?.message || 'Unable to sign in right now. Please try again.');
  } finally {
    const button = document.querySelector('.auth-submit');
    AUTH_UI.busy = false;
    if (button) { button.disabled = false; button.textContent = AUTH_UI.mode === 'signup' ? 'Create Account' : 'Sign In'; }
  }
}

async function equinoxHydrate() {
  if (AUTH_UI.hydrating) return;
  AUTH_UI.hydrating = true;
  try {
  const { data: sessionData } = await EQUINOX_SUPABASE.auth.getSession();
  const session = sessionData?.session;
  if (!session?.user) {
    showAuthGate();
    return;
  }
  const uid = session.user.id;
  let { data: profile, error: profileError } = await EQUINOX_SUPABASE.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (profileError) {
    showAuthGate(profileError.message || 'Unable to load your profile.');
    return;
  }
  if (!profile) {
    const fallbackUsername = session.user.user_metadata?.username || (session.user.email || 'Player').split('@')[0].replace(/[^A-Za-z0-9_]/g,'').slice(0,20) || 'Player';
    const { data: createdProfile, error: createProfileError } = await EQUINOX_SUPABASE.from('profiles')
      .insert({ id: uid, username: fallbackUsername })
      .select('*').maybeSingle();
    if (createProfileError) {
      showAuthGate(createProfileError.message || 'Unable to create your player profile.');
      return;
    }
    profile = createdProfile;
  }
  const { data: cloudSave, error: cloudSaveError } = await EQUINOX_SUPABASE.from('game_saves').select('save_data').eq('user_id', uid).maybeSingle();
  if (cloudSaveError) console.warn('Equinox cloud save load failed; continuing with local save:', cloudSaveError);
  const hasCloudSave = cloudSave?.save_data && typeof cloudSave.save_data === 'object' && Object.keys(cloudSave.save_data).length;
  if (hasCloudSave) {
    try {
      localStorage.setItem('equinox-save-v1', JSON.stringify(cloudSave.save_data));
      if (typeof window.equinoxReloadLocalState === 'function') window.equinoxReloadLocalState();
    } catch (e) {
      console.warn('Equinox cloud save was invalid; keeping the local save:', e);
    }
  }
  const analyticsUser = {id:uid,email:session.user.email,username:profile?.username || session.user.user_metadata?.username || ''};
  localStorage.setItem('equinox-user', JSON.stringify(analyticsUser));
  if (window.posthog?.identify) window.posthog.identify(uid, { username: analyticsUser.username });
  if (window.equinoxAnalytics?.capture) window.equinoxAnalytics.capture('equinox_session_started', { has_cloud_save: !!hasCloudSave });
  if (typeof window.render !== 'function') {
    await new Promise((resolve,reject)=>{
      const started=Date.now();
      const wait=()=>{
        if(typeof window.render==='function') return resolve();
        if(Date.now()-started>=10000) return reject(new Error('Equinox game renderer failed to initialize.'));
        setTimeout(wait,50);
      };
      wait();
    });
  }
  window.render();
  hideAuthGate();
  if (hasCloudSave) void equinoxSyncProfile(); else void equinoxCloudSave();
  } catch (e) {
    console.error('Equinox hydration failed', e);
    showAuthGate(e?.message || 'Equinox could not finish loading your game. Please try again.');
  } finally {
    AUTH_UI.hydrating = false;
  }
}

async function equinoxSyncProfile() {
  const { data: sessionData } = await EQUINOX_SUPABASE.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return;
  const raw = localStorage.getItem('equinox-save-v1');
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    const username = JSON.parse(localStorage.getItem('equinox-user') || '{}').username || s.username || 'Player';
    let { data: profile } = await EQUINOX_SUPABASE.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!profile) {
      const { data: created } = await EQUINOX_SUPABASE.from('profiles')
        .insert({ id:user.id, username:username })
        .select('*').maybeSingle();
      profile = created;
    }

    const auras = Array.isArray(s.auras) ? s.auras : [];
    const unique = new Map();
    auras.forEach(a => {
      if (!a?.name) return;
      const old = unique.get(a.name);
      if (!old || Number(a.rarity || 0) > Number(old.rarity || 0)) unique.set(a.name, a);
    });
    const uniqueAuras = [...unique.values()];
    const collectiveRarity = uniqueAuras.reduce((sum,a)=>sum+Number(a.rarity||0),0);
    const equipped = auras.find(a=>a.id===s.equippedAuraId) || auras.find(a=>a.equipped);

    await EQUINOX_SUPABASE.from('profiles').update({
      auras_collected: uniqueAuras.length,
      collective_rarity: collectiveRarity,
      roll_count: Number(s.rolls || 0),
      rarest_roll_rarity: Number(s.rarestRoll || 0),
      equipped_aura_id: equipped?.id || null,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    // The existing database uses an identity primary key for aura_collection,
    // so sync by the local aura_id instead of assuming a composite primary key.
    for (const a of auras) {
      if (!a?.name) continue;
      const auraId = String(a.id || (a.name + '-' + String(a.rolledAt || '')));
      const row = {
        user_id:user.id, aura_id:auraId, aura_name:a.name,
        rarity:Number(a.rarity||0), tier:a.tier||null,
        rolled_at:new Date(a.rolledAt || Date.now()).toISOString(),
        favorite:!!a.favorite, auto_skip:!!a.autoSkip,
        auto_equip:!!a.autoEquip, equipped:!!a.equipped
      };
      const { data: existing } = await EQUINOX_SUPABASE.from('aura_collection')
        .select('id').eq('user_id',user.id).eq('aura_id',auraId).limit(1).maybeSingle();
      if (existing?.id) {
        await EQUINOX_SUPABASE.from('aura_collection').update(row).eq('id',existing.id);
      } else {
        await EQUINOX_SUPABASE.from('aura_collection').insert(row);
      }
    }

    const recent = Array.isArray(s.recent) ? s.recent : [];
    const newest = recent.find(r=>Number(r.roll)===Number(s.rolls));
    if (newest && Number(newest.roll)>0) {
      const row = {
        user_id:user.id, roll_number:Number(newest.roll),
        aura_id:newest.name ? String(newest.name) : null,
        aura_name:newest.name || null,
        rarity:Number(newest.rolledRarity || newest.rarity || 0),
        luck:Number(newest.luck || 1), roll_speed:Number(newest.speed || 1),
        biome:newest.biome || s.biome || null, day_night:newest.time || s.dayNight || null,
        breakthrough:!!newest.breakthrough, bonus_roll:!!newest.bonus,
        rolled_at:new Date().toISOString()
      };
      const { data: existing } = await EQUINOX_SUPABASE.from('roll_history')
        .select('id').eq('user_id',user.id).eq('roll_number',Number(newest.roll)).limit(1).maybeSingle();
      if (existing?.id) {
        await EQUINOX_SUPABASE.from('roll_history').update(row).eq('id',existing.id);
      } else {
        await EQUINOX_SUPABASE.from('roll_history').insert(row);
      }
    }

    if (s.settings) {
      await EQUINOX_SUPABASE.from('user_settings').upsert({
        user_id:user.id, settings:s.settings, updated_at:new Date().toISOString()
      });
    }

    if (s.achievements?.unlocked?.length) {
      const rows=s.achievements.unlocked.map(id=>({user_id:user.id,achievement_id:String(id)}));
      await EQUINOX_SUPABASE.from('achievement_unlocks').upsert(rows,{onConflict:'user_id,achievement_id'});
    }
  } catch (e) {
    console.warn('Equinox profile sync failed',e);
  }
}
let equinoxOriginalSave = null;
function installEquinoxSaveSync() {
  if (typeof window.save !== 'function' || equinoxOriginalSave) return;
  equinoxOriginalSave = window.save;
  window.save = function(...args) {
    const result = equinoxOriginalSave.apply(this, args);
    equinoxCloudSave();
    return result;
  };
}
async function equinoxCloudSave() {
  const { data: sessionData } = await EQUINOX_SUPABASE.auth.getSession();
  const user = sessionData?.session?.user;
  if (!user) return;
  const raw = localStorage.getItem('equinox-save-v1');
  if (!raw) return;
  try {
    const saveData = JSON.parse(raw);
    await EQUINOX_SUPABASE.from('game_saves').upsert({
      user_id: user.id,
      save_data: saveData,
      updated_at: new Date().toISOString()
    });
    await equinoxSyncProfile();
  } catch (e) {
    console.warn('Equinox cloud save failed', e);
  }
}

async function equinoxLogout() {
  if (window.equinoxAnalytics?.capture) window.equinoxAnalytics.capture('equinox_logout');
  if (window.posthog?.reset) window.posthog.reset();
  await EQUINOX_SUPABASE.auth.signOut();
  localStorage.removeItem('equinox-user');
  showAuthGate('Signed out.');
}

async function equinoxAuthBoot() {
  installEquinoxSaveSync();
  EQUINOX_SUPABASE.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      if (!AUTH_UI.busy) setTimeout(equinoxHydrate, 0);
    } else if (!AUTH_UI.busy) {
      showAuthGate();
    }
  });
  await equinoxHydrate();
}

window.equinoxAuthSubmit = equinoxAuthSubmit;
window.equinoxAuthToggle = equinoxAuthToggle;
window.equinoxLogout = equinoxLogout;
window.equinoxCloudSave = equinoxCloudSave;

/* Shared hourly Quest Board + Mari Shop bridge.
 * The existing database schema stores quest definitions as JSONB and shop rows
 * by item_id, so the browser adapts the local game objects to that shape.
 */
const EQ4_SHARED={questRows:[],shopRows:[],hourIso:null,ready:false};

function eq4CurrentHourIso(){
  const d=new Date();
  d.setMinutes(0,0,0);
  return d.toISOString();
}

async function eq4LoadSharedQuestBoard(){
  if(typeof EQUINOX_SUPABASE==='undefined')return;
  const hourIso=eq4CurrentHourIso();
  let {data,error}=await EQUINOX_SUPABASE.from('global_quests')
    .select('quest_id,hour_key,quest_index,quest_data')
    .eq('hour_key',hourIso)
    .order('quest_index',{ascending:true});
  if(error) console.warn('Equinox quest sync failed:',error);
  if(!data?.length && typeof window.questBoard==='function'){
    const local=window.questBoard();
    const rows=local.slice(0,15).map((q,i)=>({
      quest_id:hourIso+'-'+String(q.id),
      hour_key:hourIso,
      quest_index:i,
      quest_data:q
    }));
    // global_quests is server-owned/read-only from the browser.
    if(rows.length) data=rows;
  }
  EQ4_SHARED.questRows=data||[];
  EQ4_SHARED.hourIso=hourIso;
  EQ4_SHARED.ready=EQ4_SHARED.questRows.length>0;
  if(EQ4_SHARED.ready && typeof window.questBoard==='function' && !window.__eq4QuestWrapped){
    const localQuestBoard=window.questBoard;
    window.questBoard=function(){
      if(!EQ4_SHARED.ready)return localQuestBoard();
      return EQ4_SHARED.questRows.map(r=>{
        const q=Object.assign({},r.quest_data||{});
        q.id=q.id ?? r.quest_index;
        q.__globalId=r.quest_id;
        return q;
      });
    };
    window.__eq4QuestWrapped=true;
  }
}

async function eq4LoadSharedQuestProgress(){
  if(!EQ4_SHARED.ready)return;
  const {data:sessionData}=await EQUINOX_SUPABASE.auth.getSession();
  const uid=sessionData?.session?.user?.id;
  if(!uid)return;
  const {data}=await EQUINOX_SUPABASE.from('quest_progress')
    .select('quest_id,progress,completed,completed_at')
    .eq('user_id',uid);
  if(!data||typeof window.questState!=='function')return;
  const qs=window.questState();
  qs.progress=qs.progress||{};
  qs.completed=Array.isArray(qs.completed)?qs.completed:[];
  for(const row of data){
    const q=EQ4_SHARED.questRows.find(x=>x.quest_id===row.quest_id);
    if(!q)continue;
    const localId=q.quest_data?.id ?? q.quest_index;
    qs.progress[localId]=Number(row.progress||0);
    if(row.completed&&!qs.completed.includes(localId))qs.completed.push(localId);
  }
  if(typeof window.save==='function')window.save();
}

async function eq4SyncSharedQuestProgress(){
  if(!EQ4_SHARED.ready||typeof window.questState!=='function')return;
  const {data:sessionData}=await EQUINOX_SUPABASE.auth.getSession();
  const uid=sessionData?.session?.user?.id;
  if(!uid)return;
  const qs=window.questState();
  for(const row of EQ4_SHARED.questRows){
    const localId=row.quest_data?.id ?? row.quest_index;
    const progress=Number(qs.progress?.[localId]||0);
    const completed=!!qs.completed?.includes(localId);
    await EQUINOX_SUPABASE.from('quest_progress').upsert({
      user_id:uid,quest_id:row.quest_id,progress,completed,
      completed_at:completed?new Date().toISOString():null
    },{onConflict:'user_id,quest_id'});
  }
}

async function eq4LoadSharedShop(){
  if(typeof EQUINOX_SUPABASE==='undefined')return;
  const hourIso=eq4CurrentHourIso();
  let {data,error}=await EQUINOX_SUPABASE.from('shop_stock')
    .select('item_id,item_name,rarity,stock,max_stock,hour_key,updated_at')
    .eq('hour_key',hourIso);
  if(error) console.warn('Equinox shop sync failed:',error);
  if(!data?.length && typeof window.shopStock==='function'){
    const local=window.shopStock();
    const rows=local.items.map((x,i)=>({
      item_id:String(x.type)+'::'+String(x.name),
      item_name:x.name,
      rarity:String(x.weight||''),
      stock:Number(x.initialStock ?? x.stock ?? 0),
      max_stock:Number(x.initialStock ?? x.stock ?? 0),
      hour_key:hourIso
    }));
    // shop_stock is server-owned/read-only from the browser.
    if(rows.length) data=rows;
  }
  EQ4_SHARED.shopRows=data||[];
  EQ4_SHARED.hourIso=hourIso;
  if(EQ4_SHARED.shopRows.length && typeof window.shopStock==='function' && !window.__eq4ShopWrapped){
    const localShopStock=window.shopStock;
    window.shopStock=function(){
      const local=localShopStock();
      const map=new Map(EQ4_SHARED.shopRows.map(x=>[x.item_name,x]));
      local.items=local.items.map(x=>{
        const row=map.get(x.name);
        return row?Object.assign({},x,{stock:Number(row.stock||0),initialStock:Number(row.max_stock||x.initialStock||0),bought:false}):x;
      });
      return local;
    };
    window.__eq4ShopWrapped=true;
  }
}

async function eq4RefreshSharedSystems(){
  await eq4LoadSharedQuestBoard();
  await eq4LoadSharedQuestProgress();
  await eq4LoadSharedShop();
  if(state?.activeTab==='NPCs')render();
}

async function eq4InstallSharedWrappers(){
  if(typeof EQUINOX_SUPABASE==='undefined')return;
  if(typeof window.completeQuest==='function'&&!window.__eq4CompleteWrapped){
    const localComplete=window.completeQuest;
    window.completeQuest=async function(id){
      localComplete(id);
      await eq4SyncSharedQuestProgress();
    };
    window.__eq4CompleteWrapped=true;
  }
  await eq4RefreshSharedSystems();
}

document.addEventListener('DOMContentLoaded', equinoxAuthBoot);

setTimeout(eq4InstallSharedWrappers, 1500);
