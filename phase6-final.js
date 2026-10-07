/* Equinox Phase 6 — stabilization / release hardening
 * Final client-side safety layer for the Phase 4/5 systems.
 */
(function(){
  let saveTimer=null;
  let syncing=false;
  let queued=false;
  let boundaryTimer=null;
  let hydrateLock=false;

  function scheduleCloudSave(){
    if(typeof window.equinoxCloudSave!=='function') return;
    clearTimeout(saveTimer);
    saveTimer=setTimeout(async function(){
      if(syncing){ queued=true; return; }
      syncing=true;
      try { await window.equinoxCloudSave(); }
      catch(e){ console.warn('Equinox cloud save failed:',e); }
      finally{
        syncing=false;
        if(queued){ queued=false; scheduleCloudSave(); }
      }
    },1500);
  }

  function installSaveThrottle(){
    if(typeof window.save!=='function'||window.__eq6SaveWrapped)return;
    const original=window.save;
    window.__eq6SaveWrapped=true;
    window.save=function(){
      const result=original.apply(this,arguments);
      scheduleCloudSave();
      return result;
    };
  }

  function syncGameplaySettings(){
    if(typeof state==='undefined'||!state.settings)return;
    /* Auto Roll is controlled from the Roll page, never by Settings. */
  }

  function installSettingsBridge(){
    if(typeof window.phase5Toggle!=='function'||window.__eq6SettingsWrapped)return;
    const originalToggle=window.phase5Toggle;
    window.__eq6SettingsWrapped=true;
    window.phase5Toggle=function(key){
      originalToggle(key);
      syncGameplaySettings();
      if(typeof save==='function')save();
      if(typeof render==='function')render();
    };
  }

  let lastHour='';
  let refreshing=false;
  async function refreshSharedAtBoundary(force){
    if(typeof window.eq4RefreshSharedSystems!=='function')return;
    const d=new Date();
    d.setMinutes(0,0,0);
    const hour=d.toISOString();
    if(!force&&hour===lastHour)return;
    if(refreshing)return;
    lastHour=hour;
    refreshing=true;
    try{await window.eq4RefreshSharedSystems();}
    catch(e){console.warn('Equinox shared-system refresh failed:',e);}
    finally{refreshing=false;}
  }

  function startBoundaryLoop(){
    refreshSharedAtBoundary(true);
    clearInterval(boundaryTimer);
    boundaryTimer=setInterval(function(){refreshSharedAtBoundary(false);},15000);
  }

  function protectVisibility(){
    document.addEventListener('visibilitychange',function(){
      if(!document.hidden){
        scheduleCloudSave();
        refreshSharedAtBoundary(true);
      }
    });
    window.addEventListener('beforeunload',function(){scheduleCloudSave();});
  }

  function installHydrationGuard(){
    if(typeof window.equinoxHydrate!=='function'||window.__eq6HydrateWrapped)return;
    const original=window.equinoxHydrate;
    window.__eq6HydrateWrapped=true;
    window.equinoxHydrate=async function(){
      if(hydrateLock)return;
      hydrateLock=true;
      try{return await original.apply(this,arguments);}
      catch(e){
        console.warn('Equinox cloud hydration failed:',e);
        if(typeof window.showAuthGate==='function') window.showAuthGate(e?.message || 'Equinox could not finish loading your game. Please try again.');
      }
      finally{hydrateLock=false;}
    };
  }

  function installGlobalErrorReporter(){
    if(window.__eq6ErrorsInstalled)return;
    window.__eq6ErrorsInstalled=true;
    window.addEventListener('unhandledrejection',function(event){
      console.warn('Equinox unhandled promise rejection:',event.reason);
      event.preventDefault();
    });
    window.addEventListener('error',function(event){
      if(event&&event.error)console.warn('Equinox runtime error:',event.error);
    });
  }

  function healthCheck(){
    const checks={
      state:typeof state!=='undefined',
      render:typeof window.render==='function',
      save:typeof window.save==='function',
      supabase:typeof window.EQUINOX_SUPABASE!=='undefined',
      phase4:typeof window.eq4RefreshSharedSystems==='function',
      phase5:typeof window.phase5Toggle==='function'
    };
    const failed=Object.keys(checks).filter(k=>!checks[k]);
    window.equinoxHealth={ok:failed.length===0,checks,failed,checkedAt:new Date().toISOString()};
    if(failed.length)console.warn('Equinox health check:',failed.join(', '));
    return window.equinoxHealth;
  }

  function boot(){
    syncGameplaySettings();
    installSaveThrottle();
    installSettingsBridge();
    installHydrationGuard();
    installGlobalErrorReporter();
    startBoundaryLoop();
    protectVisibility();
    healthCheck();
  }

  window.equinoxHealthCheck=healthCheck;
  setTimeout(boot,3000);
})();