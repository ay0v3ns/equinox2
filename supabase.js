/* Equinox Phase 4 — Supabase integration
 * Browser-safe: uses only the publishable/anon key. Never put a service-role key here.
 */
const EQUINOX_SUPABASE_URL = 'https://kguzdgrlhgbaaksjclnx.supabase.co';
const EQUINOX_SUPABASE_KEY = 'sb_publishable_SvoHzlKpD0olE8ZjZR7CBg_vkNei7N5';
const EQUINOX_SUPABASE = window.supabase.createClient(EQUINOX_SUPABASE_URL, EQUINOX_SUPABASE_KEY);

const AUTH_UI = {
  root: null,
  mode: 'login'
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

function renderAuthGate(message='') {
  if (!AUTH_UI.root) return;
  const signup = AUTH_UI.mode === 'signup';
  AUTH_UI.root.innerHTML = '<div class="auth-card">' +
    '<div class="auth-brand"><span class="auth-orb">✦</span><div><div class="section-title">EQUINOX</div><h1>' + (signup?'Create Account':'Welcome Back') + '</h1></div></div>' +
    '<p class="muted">' + (signup?'Create your Equinox account to save your progress and join the global world.':'Sign in to continue to your Equinox world.') + '</p>' +
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
}

async function equinoxHydrate() {
  const { data: sessionData } = await EQUINOX_SUPABASE.auth.getSession();
  const session = sessionData?.session;
  if (!session?.user) {
    showAuthGate();
    return;
  }
  const uid = session.user.id;
  const { data: profile, error: profileError } = await EQUINOX_SUPABASE.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (profileError) {
    showAuthGate(profileError.message);
    return;
  }
  const { data: cloudSave } = await EQUINOX_SUPABASE.from('game_saves').select('save_data').eq('user_id', uid).maybeSingle();
  const hasCloudSave = cloudSave?.save_data && typeof cloudSave.save_data === 'object' && Object.keys(cloudSave.save_data).length;
  if (hasCloudSave) {
    localStorage.setItem('equinox-save-v1', JSON.stringify(cloudSave.save_data));
  }
  localStorage.setItem('equinox-user', JSON.stringify({id:uid,email:session.user.email,username:profile?.username || session.user.user_metadata?.username || ''}));
  hideAuthGate();
  if (typeof window.render === 'function') window.render();
  if (hasCloudSave) await equinoxSyncProfile(); else await equinoxCloudSave();
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
  await EQUINOX_SUPABASE.auth.signOut();
  localStorage.removeItem('equinox-user');
  showAuthGate('Signed out.');
}

async function equinoxAuthBoot() {
  installEquinoxSaveSync();
  EQUINOX_SUPABASE.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      hideAuthGate();
      setTimeout(equinoxHydrate, 0);
    } else {
      showAuthGate();
    }
  });
  await equinoxHydrate();
}

window.equinoxAuthSubmit = equinoxAuthSubmit;
window.equinoxAuthToggle = equinoxAuthToggle;
window.equinoxLogout = equinoxLogout;
window.equinoxCloudSave = equinoxCloudSave;

document.addEventListener('DOMContentLoaded', equinoxAuthBoot);
