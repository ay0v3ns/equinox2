/* Equinox cinematic history fixes v1.0.1 */
(function(){
'use strict';
function db(){return new Promise(function(ok,no){var q=indexedDB.open('equinox-history-v1',1);q.onsuccess=function(){ok(q.result)};q.onerror=function(){no(q.error)}})}
function getRoll(n){return db().then(function(x){return new Promise(function(ok){var q=x.transaction('rolls','readonly').objectStore('rolls').get(String(n));q.onsuccess=function(){ok(q.result||null)};q.onerror=function(){ok(null)}})}).catch(function(){return null})}
function putMeta(r,m){return db().then(function(x){return new Promise(function(ok){var st=x.transaction('rolls','readwrite').objectStore('rolls'),q=st.get(String(r.roll||''));q.onsuccess=function(){var v=q.result||Object.assign({},r);Object.assign(v,m);st.put(v);ok()};q.onerror=function(){ok()}})}).catch(function(){})}
function decorate(){
 document.querySelectorAll('.eq-view-cutscene').forEach(function(btn){
   if(btn.dataset.eqBound)return;
   btn.dataset.eqBound='1';
   var row=btn.closest('.history-row');if(!row)return;
   var head=row.children[0],name=row.children[1];if(!head||!name)return;
   var roll=Number(String(head.textContent||'').replace(/[^0-9]/g,'')),aura=String(name.textContent||'').trim();
   btn.onclick=function(){
     getRoll(roll).then(function(rec){
       if(rec&&(rec.skipped||rec.accepted===false||rec.pendingStorage)){if(typeof toast==='function')toast('This roll has no replayable Aura cutscene.');return}
       if(window.equinoxPreviewCutscene)window.equinoxPreviewCutscene(aura);
     })
   };
   getRoll(roll).then(function(rec){if(rec&&(rec.skipped||rec.accepted===false||rec.pendingStorage||rec.rerolled))btn.style.display='none';});
 });
}
function wrap(){
 if(window.__eqHistoryFixWrapped||typeof window.resolveRoll!=='function')return;
 window.__eqHistoryFixWrapped=true;
 var old=window.resolveRoll;
 window.resolveRoll=function(){
   var out=old.apply(this,arguments);
   try{
     var r=window.state&&window.state.recent&&window.state.recent[0];
     if(r&&r.roll)putMeta(r,{skipped:!!r.skipped,pendingStorage:!!(window.state&&window.state.pendingStorageDecision),accepted:!r.skipped&&!window.state.pendingStorageDecision});
   }catch(_){}
   setTimeout(decorate,50);
   return out;
 };
}
function boot(){wrap();decorate();if(!window.__eqHistoryFixTimer){window.__eqHistoryFixTimer=setInterval(function(){wrap();decorate()},750)}}
setTimeout(boot,4800);
})();