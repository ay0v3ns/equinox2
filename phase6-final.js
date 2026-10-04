/* Equinox Phase 6 — stabilization / release hardening
 * Keeps Phase 4/5 behavior intact while reducing cloud-save churn,
 * synchronizing settings with gameplay state, and refreshing shared systems
 * safely around hourly boundaries.
 */
(function(){
  let saveTimer = null;
  let syncing = false;
  let queued = false;

  function scheduleCloudSave(){
    if(typeof window.equinoxCloudSave!=='function') return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(async function(){
      if(syncing){ queued=true; return; }
      syncing=true;
      try { await window.equinoxCloudSave(); }
      finally {
        syncing=false;
        if(queued){ queued=false; scheduleCloudSave(); }
      }
    },1500);
  }

  function installSaveThrottle(){
    if(typeof window.save!=='function' || window.__eq6SaveWrapped) return;
    const original=window.save;
    window.__eq6SaveWrapped=true;
    window.save=function(){
      const result=original.apply(this,arguments);
      scheduleCloudSave();
      return result;
    };
  }

  function syncGameplaySettings(){
    if(typeof state==='undefined' || !state.settings) return;
    if(typeof state.autoRoll==='boolean' && state.settings.autoRoll!==state.autoRoll){
      state.autoRoll=!!state.settings.autoRoll;
    }
    if(typeof state.autoRoll==='boolean' && state.settings.autoRoll===true && state.tutorialSkipped===false){
      state.autoRoll=false;
    }
  }

  function installSettingsBridge(){
    if(typeof window.phase5Toggle!=='function' || window.__eq6SettingsWrapped) return;
    const originalToggle=window.phase5Toggle;
    window.__eq6SettingsWrapped=true;
    window.phase5Toggle=function(key){
      originalToggle(key);
      syncGameplaySettings();
      if(typeof save==='function') save();
      if(typeof render==='function') render();
    };
  }

  let lastHour='';
  async function refreshSharedAtBoundary(){
    if(typeof window.eq4RefreshSharedSystems!=='function') return;
    const d=new Date();
    d.setMinutes(0,0,0);
    const hour=d.toISOString();
    if(hour===lastHour) return;
    lastHour=hour;
    try { await window.eq4RefreshSharedSystems(); }
    catch(e){ console.warn('Equinox shared-system refresh failed',e); }
  }

  function startBoundaryLoop(){
    refreshSharedAtBoundary();
    setInterval(refreshSharedAtBoundary,15000);
  }

  function protectVisibility(){
    document.addEventListener('visibilitychange',function(){
      if(!document.hidden){
        if(typeof window.equinoxCloudSave==='function') window.equinoxCloudSave();
        refreshSharedAtBoundary();
      }
    });
    window.addEventListener('beforeunload',function(){
      if(typeof window.equinoxCloudSave==='function') window.equinoxCloudSave();
    });
  }

  function boot(){
    syncGameplaySettings();
    installSaveThrottle();
    installSettingsBridge();
    startBoundaryLoop();
    protectVisibility();
  }

  setTimeout(boot,3000);
})();