/* Equinox Safe Aura Visual Enhancer v1.0.0
 * Non-critical progressive enhancement.
 * Never participates in core boot/render/save/auth/cutscene logic.
 */
(function(){
'use strict';
var VERSION='1.1.1', disabled=false, observer=null, io=null, queued=false;
var seen=new WeakMap();
var STYLE_ID='eqsafe-aura-style';
var SCRIPT_ID='eqsafe-aura-identities-script';

function fail(stage,err){
  console.warn('[AuraSafe] disabled at '+stage,err||'');
  window.__equinoxAuraSafeError={stage:stage,message:String(err&&err.message||err||''),time:Date.now()};
  disabled=true;
  window.EQUINOX_AURA_SAFE_STATUS='disabled';
  document.documentElement.classList.remove('eqsafe-ready');
  try{if(observer)observer.disconnect();if(io)io.disconnect();}catch(_){}
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
function cssEsc(s){return String(s==null?'':s).replace(/[^#(),.% a-zA-Z0-9_-]/g,'');}
function num(v,d){v=Number(v);return Number.isFinite(v)?v:d;}
function loadIdentities(){
  return new Promise(function(resolve,reject){
    try{
      if(window.getAuraVisualIdentity)return resolve(true);
      var old=document.getElementById(SCRIPT_ID);
      if(old){
        var start=Date.now();
        (function wait(){if(window.getAuraVisualIdentity)return resolve(true);if(Date.now()-start>12000)return reject(new Error('identity registry timeout'));setTimeout(wait,60)})();
        return;
      }
      var s=document.createElement('script');s.id=SCRIPT_ID;s.async=true;
      s.src='aura-visual-identities.js?v=20261013-safe1';
      var timer=setTimeout(function(){s.onload=s.onerror=null;reject(new Error('identity registry timeout'));},12000);
      s.onload=function(){clearTimeout(timer);window.getAuraVisualIdentity?resolve(true):reject(new Error('identity registry missing API'));};
      s.onerror=function(){clearTimeout(timer);reject(new Error('identity registry failed to load'));};
      document.head.appendChild(s);
    }catch(e){reject(e);}
  });
}
function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  var st=document.createElement('style');st.id=STYLE_ID;
  st.textContent=`
  .eqsafe-host{position:relative!important;overflow:hidden!important;isolation:isolate}
  .eqsafe-host>*:not(.eqsafe-aura-art){position:relative;z-index:2}
  .eqsafe-host > .eqv-wrap,.eqsafe-host > .eq-aura-core{display:none!important}
  html.eqsafe-ready .aura-card > .eqv-wrap,
  html.eqsafe-ready .recent-row > .eqv-wrap,
  html.eqsafe-ready .roll-result > .eqv-wrap,
  html.eqsafe-ready .aura-card > .eq-aura-core,
  html.eqsafe-ready .recent-row > .eq-aura-core,
  html.eqsafe-ready .roll-result > .eq-aura-core{display:none!important}
  .eqsafe-aura-art{position:absolute;right:6px;top:50%;width:78px;height:78px;transform:translateY(-50%);z-index:1;pointer-events:none;opacity:.42;filter:drop-shadow(0 0 7px var(--eqsafe-main));contain:layout paint style}
  .eqsafe-aura-art svg{display:block;width:100%;height:100%;overflow:visible}
  .eqsafe-host.eqsafe-visible .eqsafe-aura-art svg{animation:eqsafeVisibleTurn var(--eqsafe-turn,18s) linear infinite}
  .eqsafe-host.eqsafe-visible .eqsafe-aura-art{filter:drop-shadow(0 0 9px var(--eqsafe-main))}
  .eqsafe-motes{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}
  .eqsafe-mote{position:absolute;width:3px;height:3px;border-radius:50%;background:var(--eqsafe-a1);box-shadow:0 0 5px var(--eqsafe-main);opacity:.34;animation:eqsafeMote 3.4s ease-in-out infinite alternate}
  @keyframes eqsafeVisibleTurn{from{transform:rotate(0deg)}to{transform:rotate(var(--eqsafe-spin,360deg))}}
  @keyframes eqsafeMote{from{translate:0 0;opacity:.16}to{translate:4px -7px;opacity:.55}}
  .eqsafe-aura-art .main{fill:var(--eqsafe-main);stroke:var(--eqsafe-a1);stroke-width:1.4}
  .eqsafe-aura-art .line{fill:none;stroke:var(--eqsafe-a1);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .eqsafe-aura-art .accent{fill:none;stroke:var(--eqsafe-a2);stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round;opacity:.78}
  .eqsafe-aura-art .node{fill:var(--eqsafe-a1);stroke:var(--eqsafe-main);stroke-width:.5}
  .eqsafe-host{border-color:color-mix(in srgb,var(--eqsafe-main) 42%,#252d3e)!important;background:
   radial-gradient(circle at 90% 50%,color-mix(in srgb,var(--eqsafe-main) 18%,transparent),transparent 34%),
   #101520!important}
  .roll-result.eqsafe-host .eqsafe-aura-art{width:118px;height:118px;right:18px;opacity:.34}
  .recent-row.eqsafe-host .eqsafe-aura-art{width:64px;height:64px;opacity:.28}
  .performance-mode .eqsafe-aura-art{filter:none}
  .reduced-motion .eqsafe-aura-art{animation:none!important}
  .eqsafe-cutscene-art{position:absolute!important;left:50%!important;right:auto!important;top:50%!important;width:min(34vw,390px)!important;height:min(34vw,390px)!important;transform:translate(-50%,-50%)!important;opacity:.92!important;z-index:13!important;filter:drop-shadow(0 0 14px var(--eqsafe-main)) drop-shadow(0 0 34px var(--eqsafe-a1))!important}
  html.eqsafe-ready .eq-cutscene .eq-centerpiece > .eqv-wrap{visibility:hidden!important}
  @media(max-width:700px){.eqsafe-aura-art{width:62px;height:62px;opacity:.30}.eqsafe-cutscene-art{width:230px!important;height:230px!important}}
  `;
  document.head.appendChild(st);
}
function pointList(cx,cy,r,n,rot){
  var a=[];n=Math.max(3,Math.min(12,Math.round(n||6)));
  for(var i=0;i<n;i++){var t=rot+i*Math.PI*2/n;a.push((cx+Math.cos(t)*r).toFixed(1)+','+(cy+Math.sin(t)*r).toFixed(1));}
  return a.join(' ');
}
function identityAccent(id){
  var m=id&&id.mark||{},s=Math.max(3,Math.min(12,num(m.sides,6))),inn=Math.max(.18,Math.min(.72,num(m.inner,.42))),tw=num(m.twist,0)*Math.PI/180;
  var outer=[],star=[],r1=34,r2=34*inn;
  for(var i=0;i<s;i++){
    var a=-Math.PI/2+i*Math.PI*2/s+tw,b=a+Math.PI/s;
    var o=(50+Math.cos(a)*r1).toFixed(1)+','+(50+Math.sin(a)*r1).toFixed(1);
    var n=(50+Math.cos(b)*r2).toFixed(1)+','+(50+Math.sin(b)*r2).toFixed(1);
    outer.push(o);star.push(o,n);
  }
  var out='<polygon class="accent" points="'+star.join(' ')+'"/>';
  var nodes=Math.max(2,Math.min(9,Math.round(num(m.nodes,4))));
  for(var j=0;j<nodes;j++){
    var t=j*Math.PI*2/nodes+tw*1.6,rr=18+((j+num(m.phase,0))%3)*7;
    out+='<circle class="node" cx="'+(50+Math.cos(t)*rr).toFixed(1)+'" cy="'+(50+Math.sin(t)*rr).toFixed(1)+'" r="'+(1.4+(j%3)*.6).toFixed(1)+'"/>';
  }
  return out;
}
function semanticCore(id){
  var k=String(id&&id.kind||'');
  if(k==='common-orb')return '<circle class="line" cx="50" cy="50" r="20"/><circle class="main" cx="50" cy="50" r="6"/>';
  if(k==='split-diamond')return '<polygon class="main" points="50,14 78,50 50,86 22,50"/><path class="line" d="M50 14V86"/>';
  if(k==='up-spark')return '<path class="main" d="M50 12L59 40L84 50L59 60L50 88L41 60L16 50L41 40Z"/>';
  if(k==='leaf')return '<path class="main" d="M21 68Q28 23 79 21Q74 72 30 80Z"/><path class="line" d="M29 73Q48 52 73 28M42 60L34 46M54 48L63 38"/>';
  if(k==='rare-star')return '<polygon class="main" points="'+pointList(50,50,33,5,-Math.PI/2)+'"/><circle cx="50" cy="50" r="8" fill="#070910"/>';
  if(k==='halo')return '<ellipse class="line" cx="50" cy="28" rx="27" ry="10"/><path class="main" d="M31 39Q50 78 69 39Q65 76 50 86Q35 76 31 39Z"/>';
  if(k==='gem')return '<polygon class="main" points="50,12 74,37 65,76 50,90 35,76 26,37"/><path class="line" d="M50 12V90M26 37H74M35 76H65"/>';
  if(k==='spiral')return '<path class="line" d="M74 50C74 27 42 20 28 40C13 62 39 84 61 72C79 62 72 39 55 37C42 36 34 48 39 58C44 67 58 65 61 55"/>';
  if(k==='flame')return '<path class="main" d="M50 12C65 34 75 44 69 63C63 82 40 88 29 70C20 54 39 36 40 18C47 24 49 32 50 40C58 31 58 22 50 12Z"/>';
  if(k==='barred-rune')return '<circle class="line" cx="50" cy="50" r="28"/><path class="line" d="M30 30L70 70M70 30L30 70"/>';
  if(k==='crest')return '<path class="main" d="M21 30L37 45L50 21L63 45L79 30L73 73H27Z"/>';
  if(k==='ink-drop')return '<path class="main" d="M50 14C63 36 73 50 67 66C61 84 38 87 29 70C20 54 38 34 50 14Z"/>';
  if(k==='seven')return '<path class="line" d="M27 27H74L44 79" style="stroke-width:9"/>';
  if(k==='wind')return '<path class="line" d="M16 38Q38 25 58 39Q67 46 59 51Q53 55 46 49M13 54H69Q81 54 81 63Q81 73 67 72M23 67H55"/>';
  if(k==='wave-gem')return '<polygon class="main" points="50,14 74,38 64,73 50,87 36,73 26,38"/><path class="line" d="M29 58Q42 45 54 57T72 53"/>';
  if(k==='rain-cloud')return '<path class="main" d="M27 50Q26 34 42 34Q49 20 62 31Q76 31 76 46Q85 49 81 59H23Q17 53 27 50Z"/><path class="line" d="M31 68L26 80M49 68L44 83M67 68L62 80"/>';
  if(k==='shore-lace')return '<path class="line" d="M14 48Q27 34 40 48T66 48T90 48M14 61Q27 47 40 61T66 61T90 61"/><circle class="line" cx="50" cy="50" r="29"/>';
  if(/moon|eclipse/.test(k))return '<circle class="main" cx="47" cy="50" r="27"/><circle cx="61" cy="41" r="23" fill="#070910"/>';
  if(/wave|ocean|leviathan/.test(k))return '<path class="main" d="M10 61Q28 34 48 58T90 54Q73 82 51 66T10 61Z"/>';
  if(/pixel|glitch|zero|meta/.test(k))return '<rect class="main" x="24" y="24" width="20" height="20"/><rect class="main" x="54" y="18" width="22" height="22"/><rect class="main" x="42" y="52" width="30" height="30"/>';
  if(/crown|royal/.test(k))return '<path class="main" d="M20 67L17 34L38 49L50 23L62 49L83 34L80 67Z"/>';
  if(/eye/.test(k))return '<path class="line" d="M12 50Q50 15 88 50Q50 85 12 50Z"/><circle class="main" cx="50" cy="50" r="12"/>';
  if(/sun|solar/.test(k))return '<circle class="main" cx="50" cy="50" r="20"/><polygon class="accent" points="'+pointList(50,50,40,12,-Math.PI/2)+'"/>';
  if(/flower|nature/.test(k))return '<g class="main">'+[0,60,120,180,240,300].map(function(a){return'<ellipse cx="50" cy="30" rx="10" ry="20" transform="rotate('+a+' 50 50)"/>'}).join('')+'</g>';
  if(/crystal|shard/.test(k))return '<polygon class="main" points="50,11 74,36 64,77 50,90 34,77 26,36"/>';
  if(/rune|arcane/.test(k))return '<circle class="line" cx="50" cy="50" r="29"/><polygon class="line" points="'+pointList(50,50,25,6,-Math.PI/2)+'"/>';
  return '';
}
function artFor(name,id,mode){
  var p=Array.isArray(id.palette)&&id.palette.length>=3?id.palette:['#8aa4ff','#d8e2ff','#28344f'];
  var svg='<svg viewBox="0 0 100 100" aria-hidden="true"><g>'+semanticCore(id)+identityAccent(id)+'</g></svg>';
  var div=document.createElement('div');div.className='eqsafe-aura-art'+(mode==='cutscene'?' eqsafe-cutscene-art':'');
  div.style.setProperty('--eqsafe-main',cssEsc(p[0]||'#8aa4ff'));
  div.style.setProperty('--eqsafe-a1',cssEsc(p[1]||'#d8e2ff'));
  div.style.setProperty('--eqsafe-a2',cssEsc(p[2]||'#28344f'));
  var sp=num(id.spin,.03);
  div.style.setProperty('--eqsafe-turn',(Math.max(12,24-Math.abs(sp)*60)).toFixed(1)+'s');
  div.style.setProperty('--eqsafe-spin',sp<0?'-360deg':'360deg');
  div.innerHTML=svg;div.dataset.aura=name;div.dataset.identity=id.id||'';
  return div;
}
function decorateCutscene(el){
  if(disabled||!el||el.nodeType!==1)return;
  try{
    if(el.dataset.eqsafeCutscene==='1')return;
    var legacy=el.querySelector('.eq-centerpiece svg[aria-label]');
    var name=legacy&&legacy.getAttribute('aria-label')||'';
    if(!name)return;
    var id=window.getAuraVisualIdentity&&window.getAuraVisualIdentity(name);if(!id)return;
    var center=el.querySelector('.eq-centerpiece');if(!center)return;
    var p=id.palette||[];
    el.style.setProperty('--aura-main',cssEsc(p[0]||'#8aa4ff'));
    el.style.setProperty('--aura-a1',cssEsc(p[1]||'#d8e2ff'));
    el.style.setProperty('--aura-a2',cssEsc(p[2]||'#28344f'));
    center.appendChild(artFor(name,id,'cutscene'));
    el.dataset.eqsafeCutscene='1';
  }catch(e){console.warn('[AuraSafe] cutscene decoration skipped',e);}
}
function auraNameFor(el){
  try{
    var n=el.querySelector('.eq-aura-title,.aura-main b,h2');
    if(n&&n.textContent.trim())return n.textContent.trim();
    if(el.classList.contains('recent-row')){var b=el.querySelector('b');if(b)return b.textContent.trim();}
  }catch(_){}
  return '';
}
function decorate(el){
  if(disabled||!el||el.nodeType!==1)return;
  try{
    var name=auraNameFor(el);if(!name)return;
    var id=window.getAuraVisualIdentity&&window.getAuraVisualIdentity(name);if(!id)return;
    var old=seen.get(el);
    if(old===name&&el.querySelector(':scope > .eqsafe-aura-art'))return;
    var prior=el.querySelector(':scope > .eqsafe-aura-art');if(prior)prior.remove();
    var p=id.palette||[];
    el.classList.add('eqsafe-host');
    el.style.setProperty('--eqsafe-main',cssEsc(p[0]||'#8aa4ff'));
    el.style.setProperty('--eqsafe-a1',cssEsc(p[1]||'#d8e2ff'));
    el.style.setProperty('--eqsafe-a2',cssEsc(p[2]||'#28344f'));
    el.appendChild(artFor(name,id));seen.set(el,name);
  }catch(e){
    // One Aura/card is never allowed to disable Equinox or the other cards.
    console.warn('[AuraSafe] skipped card',e);
  }
}
var visibleDetailed=new Set(),MAX_DETAILED=18;
function addVisibleDetails(el){
  if(disabled||!el||visibleDetailed.has(el)||visibleDetailed.size>=MAX_DETAILED)return;
  try{
    var art=el.querySelector(':scope > .eqsafe-aura-art');if(!art)return;
    el.classList.add('eqsafe-visible');
    var motes=document.createElement('span');motes.className='eqsafe-motes';motes.setAttribute('aria-hidden','true');
    for(var i=0;i<4;i++){
      var m=document.createElement('i');m.className='eqsafe-mote';
      m.style.left=(12+((i*23+17)%74))+'%';m.style.top=(14+((i*31+9)%68))+'%';
      m.style.animationDelay=(-i*.55)+'s';motes.appendChild(m);
    }
    el.appendChild(motes);visibleDetailed.add(el);
  }catch(e){console.warn('[AuraSafe] visible detail skipped',e);}
}
function removeVisibleDetails(el){
  if(!el)return;
  try{el.classList.remove('eqsafe-visible');var m=el.querySelector(':scope > .eqsafe-motes');if(m)m.remove();}catch(_){}
  visibleDetailed.delete(el);
}
function candidates(root){
  try{return Array.prototype.slice.call((root||document).querySelectorAll('.aura-card,.recent-row,.roll-result'));}catch(_){return[];}
}
function queueScan(){
  if(disabled||queued)return;queued=true;
  var run=function(){queued=false;if(disabled)return;try{candidates(document).forEach(function(el){io?io.observe(el):decorate(el);});}catch(e){console.warn('[AuraSafe] scan skipped',e);}};
  if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:600});else setTimeout(run,60);
}
function install(){
  if(disabled)return;
  try{
    window.EQUINOX_AURA_SAFE_STATUS='installing';
    if('IntersectionObserver' in window){
      io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){decorate(e.target);addVisibleDetails(e.target);}
          else removeVisibleDetails(e.target);
        });
      },{rootMargin:'100px'});
    }
    observer=new MutationObserver(function(muts){
      if(disabled)return;
      try{
        muts.forEach(function(m){
          Array.prototype.forEach.call(m.addedNodes||[],function(node){
            if(!node||node.nodeType!==1)return;
            if(node.matches&&node.matches('.eq-cutscene'))decorateCutscene(node);
            if(node.matches&&node.matches('.aura-card,.recent-row,.roll-result')){decorate(node);if(io)io.observe(node);}
            if(node.querySelectorAll){
              node.querySelectorAll('.eq-cutscene').forEach(decorateCutscene);
              node.querySelectorAll('.aura-card,.recent-row,.roll-result').forEach(function(el){decorate(el);if(io)io.observe(el);});
            }
          });
        });
      }catch(e){console.warn('[AuraSafe] mutation decoration skipped',e);}
    });
    observer.observe(document.body,{childList:true,subtree:true});
    document.documentElement.classList.add('eqsafe-ready');
    candidates(document).forEach(function(el){decorate(el);if(io)io.observe(el);});
    document.querySelectorAll('.eq-cutscene').forEach(decorateCutscene);
    window.EQUINOX_AURA_SAFE_VERSION=VERSION;
    window.EQUINOX_AURA_SAFE_STATUS='ready';
    window.equinoxAuraSafeRefresh=queueScan;
    window.equinoxAuraSafeDisable=function(){disabled=true;document.documentElement.classList.remove('eqsafe-ready');try{observer&&observer.disconnect();io&&io.disconnect();}catch(_){}document.querySelectorAll('.eqsafe-motes').forEach(function(x){x.remove();});visibleDetailed.clear();document.querySelectorAll('.eqsafe-aura-art').forEach(function(x){x.remove();});document.querySelectorAll('.eq-cutscene[data-eqsafe-cutscene]').forEach(function(x){delete x.dataset.eqsafeCutscene;});};
  }catch(e){fail('install',e);}
}
function boot(){
  // Core game gets the first chance to become interactive.
  try{installStyle();window.EQUINOX_AURA_SAFE_STATUS='waiting';}catch(e){fail('style-install',e);return;}
  setTimeout(function(){
    if(disabled)return;
    window.EQUINOX_AURA_SAFE_STATUS='loading-identities';
    loadIdentities().then(install).catch(function(e){fail('identity-load',e);});
  },1800);
}
if(document.readyState==='complete')boot();else window.addEventListener('load',boot,{once:true});
})();