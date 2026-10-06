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
    state = typeof normalizeState === 'function' ? normalizeState(load()) : load();
    window.state = state;
    if (typeof bankTick === 'function') bankTick();
    if (typeof save === 'function') save();
    if (typeof window.render === 'function') window.render();
  } catch (e) {
    console.warn('Equinox local state reload failed:', e);
  }
}

function renderAuthGate(message='') {
  if (!AUTH_UI.root) return;
  const signup = AUTH_UI.mode === 'signup';
  AUTH_UI.root.innerHTML = '<div class="auth-card">' +
    '<div class="auth-brand"><span class="auth-orb">☯</span><div><div class="section-title">EQUINOX</div><h1>' + (signup?'Create Account':'Welcome Back') + '</h1></div></div>' +
    '<p class="muted">' + (signup?'Create your account to join the others.':'Welcome back to Equinox.') + '</p>' +
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

function equinoxSaveScore(data){
  if(!data||typeof data!=='object')return -1;
  const auras=Array.isArray(data.auras)?data.auras:[];
  const recent=Array.isArray(data.recent)?data.recent:[];
  const inventory=data.inventory&&typeof data.inventory==='object'&&!Array.isArray(data.inventory)?data.inventory:{};
  const itemCount=Object.values(inventory).reduce((sum,v)=>sum+(Number(v)||0),0);
  return Math.max(0,Number(data.rolls)||0)+auras.length*1000+recent.length*25+
    (data.lastRollResult?5000:0)+(itemCount>0?500:0)+
    (Array.isArray(data.activePotions)&&data.activePotions.length?250:0);
}
function equinoxSaveIsIncomplete(data){
  if(!data||typeof data!=='object')return false;
  const auras=Array.isArray(data.auras)?data.auras:[];
  const recent=Array.isArray(data.recent)?data.recent:[];
  const inventory=data.inventory&&typeof data.inventory==='object'&&!Array.isArray(data.inventory)?data.inventory:{};
  const hasInventory=Object.values(inventory).some(v=>Number(v||0)>0);
  return Number(data.rolls||0)>0&&auras.length===0&&recent.length===0&&!data.lastRollResult&&!hasInventory;
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
    console.warn('Equinox profile load failed; continuing with account metadata:', profileError);
    const fallbackUsername = session.user.user_metadata?.username || (session.user.email || 'Player').split('@')[0].replace(/[^A-Za-z0-9_]/g,'').slice(0,20) || 'Player';
    profile = { id: uid, username: fallbackUsername };
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
  const { data: cloudSave, error: cloudSaveError } = await EQUINOX_SUPABASE.from('game_saves').select('save_data,updated_at').eq('user_id', uid).maybeSingle();
  if (cloudSaveError) console.warn('Equinox cloud save load failed; continuing with local save:', cloudSaveError);
  let cloudData = cloudSave?.save_data && typeof cloudSave.save_data === 'object' ? cloudSave.save_data : null;
  if(cloudData&&typeof window.normalizeState==='function'){
    try{
      cloudData=window.normalizeState(cloudData);
      if(cloudData.recoveredInterruptedRoll||cloudData.recoveredIncompleteSave){
        delete cloudData.recoveredInterruptedRoll;
        delete cloudData.recoveredIncompleteSave;
      }
    }catch(e){console.warn('Equinox cloud snapshot normalization failed:',e)}
  }
  const cloudWasIncomplete=equinoxSaveIsIncomplete(cloudData);
  if(cloudWasIncomplete){
    cloudData=Object.assign({},cloudData,{rolls:0,recent:[],lastRollResult:null,rarestRoll:0});
    try{
      await EQUINOX_SUPABASE.from('game_saves').upsert({user_id:uid,save_data:cloudData,updated_at:new Date().toISOString()});
      console.warn('Equinox repaired an incomplete cloud save by clearing unsynced roll counters while preserving inventory.');
    }catch(e){console.warn('Equinox could not repair incomplete cloud save:',e)}
  }
  const hasCloudSave = !!(cloudData && Object.keys(cloudData).length);
  let localSave = null;
  try {
    const localRaw = localStorage.getItem('equinox-save-v1');
    localSave = localRaw ? JSON.parse(localRaw) : null;
  } catch (_) {}
  const cloudScore=equinoxSaveScore(cloudData);
  const localScore=equinoxSaveScore(localSave);
  const cloudIncomplete=equinoxSaveIsIncomplete(cloudData);
  const localIncomplete=equinoxSaveIsIncomplete(localSave);
  const cloudUpdatedAt=cloudSave?.updated_at?Date.parse(cloudSave.updated_at):0;
  const localUpdatedAt=Number(localSave?.saveUpdatedAt||0);
  const newerLocal=localUpdatedAt>0&&cloudUpdatedAt>0&&localUpdatedAt>cloudUpdatedAt;
  const newerCloud=cloudUpdatedAt>0&&localUpdatedAt>0&&cloudUpdatedAt>localUpdatedAt;
  const preserveLocal=!!(localSave&&(!cloudData||(cloudIncomplete&&!localIncomplete)||newerLocal||(!newerCloud&&localScore>cloudScore)));
  if(hasCloudSave&&!preserveLocal){
    try{
      localStorage.setItem('equinox-save-v1',JSON.stringify(cloudData));
      if(typeof window.equinoxReloadLocalState==='function')window.equinoxReloadLocalState();
    }catch(e){console.warn('Equinox cloud save was invalid; keeping the local save:',e);}
  }else if(preserveLocal&&hasCloudSave){
    console.warn('Equinox kept the healthier local save instead of replacing it with an incomplete or older cloud snapshot.');
  }
  const analyticsUser = {id:uid,email:session.user.email,username:profile?.username || session.user.user_metadata?.username || ''};
  if (typeof window.state === 'object' && window.state) window.state.username = analyticsUser.username || window.state.username || 'Player';
  localStorage.setItem('equinox-user', JSON.stringify(analyticsUser));
  if (window.posthog?.identify) window.posthog.identify(uid, { username: analyticsUser.username });
  if (window.equinoxAnalytics?.capture) window.equinoxAnalytics.capture('equinox_session_started', { has_cloud_save: !!hasCloudSave });
  if (typeof window.render !== 'function') {
    const bootError=window.__equinoxBootError;
    const detail=bootError?.message || 'The renderer script did not finish loading.';
    console.error('Equinox renderer boot failure:',bootError||detail);
    showAuthGate('Equinox startup error: '+detail);
    return;
  }
  window.render();
  hideAuthGate();
  if (typeof eq4InstallSharedWrappers === 'function') void eq4InstallSharedWrappers();
  if (hasCloudSave && !preserveLocal) void equinoxSyncProfile(); else void equinoxCloudSave();
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
    scheduleEquinoxCloudSave(!!state?.autoRoll===false);
    return result;
  };
}
let equinoxCloudSaveTimer=0;
let equinoxCloudSaveRunning=false;
let equinoxCloudSaveDirty=false;
async function equinoxCloudSave(){
  if(equinoxCloudSaveRunning){
    equinoxCloudSaveDirty=true;
    return;
  }
  equinoxCloudSaveRunning=true;
  try{
    do{
      equinoxCloudSaveDirty=false;
      const {data:sessionData}=await EQUINOX_SUPABASE.auth.getSession();
      const user=sessionData?.session?.user;
      if(!user)return;
      const raw=localStorage.getItem('equinox-save-v1');
      if(!raw)return;
      const saveData=JSON.parse(raw);
      const {data:existing}=await EQUINOX_SUPABASE.from('game_saves').select('save_data,updated_at').eq('user_id',user.id).maybeSingle();
      const localScore=equinoxSaveScore(saveData);
      const existingScore=equinoxSaveScore(existing?.save_data);
      const localIncomplete=equinoxSaveIsIncomplete(saveData);
      const existingIncomplete=equinoxSaveIsIncomplete(existing?.save_data);
      const localUpdatedAt=Number(saveData.saveUpdatedAt||0);
      const existingUpdatedAt=existing?.updated_at?Date.parse(existing.updated_at):0;
      const localIsNewer=localUpdatedAt>0&&existingUpdatedAt>0&&localUpdatedAt>existingUpdatedAt;
      const existingIsNewer=existingUpdatedAt>0&&localUpdatedAt>0&&existingUpdatedAt>localUpdatedAt;
      if(existing?.save_data&&((existingIsNewer&&!localIsNewer)||(!existingIsNewer&&existingScore>localScore)&&!(existingIncomplete&&!localIncomplete))){
        console.warn('Equinox skipped cloud save because the server already has a newer or healthier snapshot.');
      }else{
        const {error:saveError}=await EQUINOX_SUPABASE.from('game_saves').upsert({user_id:user.id,save_data:saveData,updated_at:new Date().toISOString()});
        if(saveError)console.warn('Equinox game save failed',saveError);
        else await equinoxSyncProfile();
      }
    }while(equinoxCloudSaveDirty);
  }catch(e){console.warn('Equinox cloud save failed',e)}
  finally{equinoxCloudSaveRunning=false}
}
function scheduleEquinoxCloudSave(immediate=false){
  equinoxCloudSaveDirty=true;
  if(immediate){
    if(equinoxCloudSaveTimer){clearTimeout(equinoxCloudSaveTimer);equinoxCloudSaveTimer=0;}
    void equinoxCloudSave();
    return;
  }
  if(equinoxCloudSaveTimer)return;
  equinoxCloudSaveTimer=setTimeout(function(){
    equinoxCloudSaveTimer=0;
    void equinoxCloudSave();
  },3000);
}

async function equinoxLogout() {
  if (window.equinoxAnalytics?.capture) window.equinoxAnalytics.capture('equinox_logout');
  if (window.posthog?.reset) window.posthog.reset();
  await EQUINOX_SUPABASE.auth.signOut();
  localStorage.removeItem('equinox-user');
  showAuthGate('Signed out.');
}

async function equinoxAuthBoot() {
  // Keep a visible auth surface while an existing session and the game renderer initialize.
  // This prevents an authenticated startup race from leaving the page visually blank.
  showAuthGate();
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

/* Compatibility adapter.
 * Phase 4 owns the shared hourly Quest Board + Mari Shop bridge. This file
 * must not redefine those globals because doing so can replace the canonical
 * server-backed implementation after page load.
 */
const __eq4Phase4RefreshSharedSystems=window.eq4RefreshSharedSystems;
const __eq4Phase4LoadSharedShop=window.eq4LoadSharedShop;
var eq4InstallSharedWrappers=(window.eq4InstallSharedWrappers=async function(){
  if(typeof __eq4Phase4RefreshSharedSystems==='function'){
    return __eq4Phase4RefreshSharedSystems.apply(this,arguments);
  }
  return false;
});
document.addEventListener('DOMContentLoaded', equinoxAuthBoot);
setTimeout(function(){
  if(typeof window.eq4InstallSharedWrappers==='function')void window.eq4InstallSharedWrappers();
},1500);
