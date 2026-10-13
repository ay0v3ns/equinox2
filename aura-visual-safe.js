/* Equinox Safe Aura Visual Enhancer v1.0.0
 * Non-critical progressive enhancement.
 * Never participates in core boot/render/save/auth/cutscene logic.
 */
(function(){
'use strict';
var VERSION='1.2.0', disabled=false, observer=null, io=null, queued=false;
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
  .eqsafe-aura-art .main{fill:var(--eqsafe-main);stroke:var(--eqsafe-a1);stroke-width:1.4}
  .eqsafe-aura-art .line{fill:none;stroke:var(--eqsafe-a1);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .eqsafe-aura-art .accent{fill:none;stroke:var(--eqsafe-a2);stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round;opacity:.78}
  .eqsafe-aura-art .node{fill:var(--eqsafe-a1);stroke:var(--eqsafe-main);stroke-width:.5}
  .eqsafe-aura-art svg{transform-origin:50% 50%;animation:eqsafeEmblem var(--eqsafe-turn,14s) linear infinite}
  .eqsafe-particles{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}
  .eqsafe-particle{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);opacity:.42;background:var(--eqsafe-a1);border-radius:50%;box-shadow:0 0 6px var(--eqsafe-main);animation:eqsafeDrift var(--d) ease-in-out infinite alternate;animation-delay:var(--delay)}
  .eqsafe-host[data-eqsafe-particle*="pixel"] .eqsafe-particle,.eqsafe-host[data-eqsafe-particle*="chip"] .eqsafe-particle{border-radius:1px;transform:rotate(45deg)}
  .eqsafe-host[data-eqsafe-particle*="shard"] .eqsafe-particle,.eqsafe-host[data-eqsafe-particle*="glass"] .eqsafe-particle{border-radius:0;clip-path:polygon(50% 0,100% 100%,0 74%)}
  .eqsafe-host[data-eqsafe-particle*="ember"] .eqsafe-particle,.eqsafe-host[data-eqsafe-particle*="streak"] .eqsafe-particle,.eqsafe-host[data-eqsafe-particle*="rain"] .eqsafe-particle{width:2px;height:10px;border-radius:999px}
  .eqsafe-host[data-eqsafe-particle*="bubble"] .eqsafe-particle,.eqsafe-host[data-eqsafe-particle*="ring"] .eqsafe-particle{background:transparent;border:1px solid var(--eqsafe-a1);box-shadow:0 0 5px var(--eqsafe-main)}
  .eqsafe-host[data-eqsafe-particle*="thread"] .eqsafe-particle,.eqsafe-host[data-eqsafe-particle*="air"] .eqsafe-particle{width:12px;height:1px;border-radius:999px}
  .eqsafe-host[data-eqsafe-particle*="leaf"] .eqsafe-particle,.eqsafe-host[data-eqsafe-particle*="petal"] .eqsafe-particle{border-radius:80% 0 80% 0}
  .eqsafe-host[data-eqsafe-backdrop*="grid"],.eqsafe-host[data-eqsafe-backdrop*="pixel"],.eqsafe-host[data-eqsafe-backdrop*="circuit"]{background-image:linear-gradient(color-mix(in srgb,var(--eqsafe-main) 9%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--eqsafe-main) 9%,transparent) 1px,transparent 1px)!important;background-size:14px 14px!important}
  .eqsafe-host[data-eqsafe-backdrop*="wave"],.eqsafe-host[data-eqsafe-backdrop*="ocean"],.eqsafe-host[data-eqsafe-backdrop*="shore"]{background-image:radial-gradient(ellipse at 80% 115%,transparent 42%,color-mix(in srgb,var(--eqsafe-main) 17%,transparent) 44%,transparent 47%)!important}
  .eqsafe-host[data-eqsafe-backdrop*="void"],.eqsafe-host[data-eqsafe-backdrop*="absence"]{background:radial-gradient(circle at 88% 50%,#020205 0 13%,color-mix(in srgb,var(--eqsafe-main) 18%,#05070c) 32%,#101520 72%)!important}
  .eqsafe-host[data-eqsafe-backdrop*="gem"],.eqsafe-host[data-eqsafe-backdrop*="crystal"]{background-image:linear-gradient(120deg,transparent 0 44%,color-mix(in srgb,var(--eqsafe-a1) 10%,transparent) 45% 47%,transparent 48% 100%)!important}
  .eqsafe-host[data-eqsafe-font="mono"] .eq-aura-title,.eqsafe-host[data-eqsafe-font="mono"] .aura-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.065em}
  .eqsafe-host[data-eqsafe-font="mono-light"] .eq-aura-title,.eqsafe-host[data-eqsafe-font="mono-light"] .aura-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:500;letter-spacing:.09em}
  .eqsafe-host[data-eqsafe-font="serif-light"] .eq-aura-title,.eqsafe-host[data-eqsafe-font="serif-light"] .aura-name{font-family:Lora,Georgia,serif;font-weight:500}
  .eqsafe-host[data-eqsafe-font="serif-heavy"] .eq-aura-title,.eqsafe-host[data-eqsafe-font="serif-heavy"] .aura-name{font-family:"Noto Serif TC",Georgia,serif;font-weight:900}
  .eqsafe-host[data-eqsafe-font="serif-sharp"] .eq-aura-title,.eqsafe-host[data-eqsafe-font="serif-sharp"] .aura-name{font-family:Georgia,"Times New Roman",serif;font-style:italic;letter-spacing:.035em}
  .eqsafe-host[data-eqsafe-font="serif-dream"] .eq-aura-title,.eqsafe-host[data-eqsafe-font="serif-dream"] .aura-name{font-family:Lora,Georgia,serif;font-style:italic;letter-spacing:.045em}
  .eqsafe-host[data-eqsafe-font="serif-royal"] .eq-aura-title,.eqsafe-host[data-eqsafe-font="serif-royal"] .aura-name{font-family:Georgia,"Times New Roman",serif;font-weight:700;letter-spacing:.04em}
  .eqsafe-host[data-eqsafe-font="sans-wide"] .eq-aura-title,.eqsafe-host[data-eqsafe-font="sans-wide"] .aura-name{font-family:Figtree,system-ui,sans-serif;font-weight:900;letter-spacing:.075em}
  .eq-cutscene[data-eqsafe-font="mono"] .eq-narrative,.eq-cutscene[data-eqsafe-font="mono-light"] .eq-narrative{font-family:ui-monospace,SFMono-Regular,Menlo,monospace!important}
  .eq-cutscene[data-eqsafe-font="serif-light"] .eq-narrative,.eq-cutscene[data-eqsafe-font="serif-dream"] .eq-narrative{font-family:Lora,Georgia,serif!important}
  .eq-cutscene[data-eqsafe-font="serif-heavy"] .eq-narrative,.eq-cutscene[data-eqsafe-font="serif-royal"] .eq-narrative,.eq-cutscene[data-eqsafe-font="serif-sharp"] .eq-narrative{font-family:Georgia,"Times New Roman",serif!important}
  .eq-cutscene[data-eqsafe-font="sans-wide"] .eq-narrative{font-family:Figtree,system-ui,sans-serif!important}
  @keyframes eqsafeEmblem{from{transform:rotate(var(--eqsafe-start,0deg))}to{transform:rotate(calc(var(--eqsafe-start,0deg) + var(--eqsafe-spin-angle,360deg)))}}
  @keyframes eqsafeDrift{from{translate:0 0;opacity:.18}to{translate:var(--dx,5px) var(--dy,-7px);opacity:.62}}
  .eqsafe-host{border-color:color-mix(in srgb,var(--eqsafe-main) 42%,#252d3e)!important;background:
   radial-gradient(circle at 90% 50%,color-mix(in srgb,var(--eqsafe-main) 18%,transparent),transparent 34%),
   #101520!important}
  .roll-result.eqsafe-host .eqsafe-aura-art{width:118px;height:118px;right:18px;opacity:.34}
  .recent-row.eqsafe-host .eqsafe-aura-art{width:64px;height:64px;opacity:.28}
  .performance-mode .eqsafe-aura-art{filter:none}
  .reduced-motion .eqsafe-aura-art,.reduced-motion .eqsafe-aura-art svg,.reduced-motion .eqsafe-particle{animation:none!important}
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
  if(k==='aurora')return '<path class="line" d="M8 63Q25 28 46 48T92 30M9 74Q32 42 55 62T91 47"/><path class="accent" d="M13 24Q36 44 59 21T88 26"/>';
  if(k==='dreamcatcher')return '<circle class="line" cx="50" cy="43" r="28"/><circle class="accent" cx="50" cy="43" r="17"/><path class="line" d="M29 29L71 57M71 29L29 57M50 15V71M22 43H78M37 70L34 91M50 71V94M63 70L67 91"/>';
  if(k==='scarab')return '<ellipse class="main" cx="50" cy="53" rx="15" ry="25"/><path class="line" d="M50 28V78M35 40L19 31M65 40L81 31M35 55L16 55M65 55L84 55M36 69L21 82M64 69L79 82"/><circle class="accent" cx="50" cy="25" r="7"/>';
  if(k==='singularity')return '<circle class="line" cx="50" cy="50" r="30"/><circle class="accent" cx="50" cy="50" r="20"/><circle class="main" cx="50" cy="50" r="6"/><path class="line" d="M50 7V25M50 75V93M7 50H25M75 50H93"/>';
  if(k==='projection')return '<polygon class="line" points="50,14 80,32 80,68 50,86 20,68 20,32"/><polygon class="accent" points="50,26 69,38 69,62 50,74 31,62 31,38"/><path class="main" d="M50 14V86M20 32L80 68M80 32L20 68"/>';
  if(k==='astral-crown')return '<path class="main" d="M20 66L17 36L38 49L50 20L62 49L83 36L80 66Z"/><polygon class="accent" points="'+pointList(50,50,40,8,-Math.PI/2)+'"/>';
  if(k==='mirror-eye')return '<path class="line" d="M11 50Q50 17 89 50Q50 83 11 50Z"/><circle class="main" cx="50" cy="50" r="11"/><path class="accent" d="M30 22L21 36M70 22L79 36M30 78L21 64M70 78L79 64"/>';
  if(k==='zero-ring')return '<circle class="line" cx="50" cy="50" r="30"/><circle class="accent" cx="50" cy="50" r="18"/><path class="line" d="M27 73L73 27"/>';
  if(k==='equinox')return '<circle class="line" cx="50" cy="50" r="31"/><path class="line" d="M50 14V86M18 50H82"/><path class="main" d="M50 14L56 42L82 50L56 58L50 86L44 58L18 50L44 42Z"/><circle cx="50" cy="50" r="7" fill="#070910"/>';
  if(k==='fear-eye')return '<path class="line" d="M12 50Q50 13 88 50Q50 87 12 50Z"/><circle class="main" cx="50" cy="50" r="15"/><circle cx="54" cy="46" r="5" fill="#070910"/>';
  if(k==='clock')return '<circle class="line" cx="50" cy="50" r="31"/><path class="line" d="M50 50V27M50 50L67 60"/><path class="accent" d="M50 15V21M50 79V85M15 50H21M79 50H85"/>';
  if(k==='supernova')return '<circle class="main" cx="50" cy="50" r="12"/><polygon class="accent" points="'+pointList(50,50,38,12,-Math.PI/2)+'"/><circle class="line" cx="50" cy="50" r="29"/>';
  if(k==='sword')return '<path class="main" d="M47 13H53L56 58L64 64H36L44 58Z"/><rect class="main" x="29" y="61" width="42" height="7" rx="2"/><path class="main" d="M47 68H53L57 83L50 89L43 83Z"/>';
  if(k==='broken-rune')return '<circle class="line" cx="50" cy="50" r="29"/><path class="line" d="M32 28L45 42L37 54L52 68L44 80M68 28L55 42L63 54L48 68L56 80"/>';
  if(k==='hand')return '<path class="main" d="M31 78V47Q31 39 37 39Q42 39 42 46V28Q42 20 48 20Q53 20 53 28V45V23Q53 16 59 16Q65 16 65 24V47V30Q65 23 71 23Q77 23 77 31V57Q77 79 58 87Q43 91 31 78Z"/>';
  if(k==='compass')return '<circle class="line" cx="50" cy="50" r="32"/><polygon class="main" points="50,14 58,45 50,50 42,45"/><polygon class="accent" points="50,86 42,55 50,50 58,55"/><circle cx="50" cy="50" r="5" fill="#070910"/>';
  if(k==='memory')return '<path class="line" d="M25 32Q50 14 75 32V68Q50 86 25 68Z"/><path class="accent" d="M35 38Q50 26 65 38V62Q50 74 35 62Z"/>';
  if(k==='meta-cube')return '<polygon class="line" points="50,12 79,29 79,63 50,80 21,63 21,29"/><path class="accent" d="M50 12V46M21 29L50 46L79 29M50 46V80"/>';
  if(k==='dreammetric')return '<circle class="line" cx="50" cy="50" r="29"/><polygon class="accent" points="'+pointList(50,50,24,7,-Math.PI/2)+'"/><path class="line" d="M21 50Q50 24 79 50Q50 76 21 50Z"/>';
  if(k==='sandworm')return '<path class="main" d="M13 66Q25 39 43 49Q56 57 51 68Q46 80 61 78Q74 77 84 58Q82 83 61 88Q38 93 31 77Q26 66 13 66Z"/><path class="line" d="M21 65L15 54M30 59L25 47M40 55L37 42"/>';
  if(k==='black-crown')return '<path class="main" d="M20 67L17 34L38 49L50 23L62 49L83 34L80 67Z"/><path class="accent" d="M27 73H73M33 43L50 59L67 43"/>';
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
function particlesFor(id,mode){
  try{
    var m=id&&id.mark||{},seed=num(m.variant,1)*97+num(m.phase,0)*17,count=mode==='cutscene'?16:6+(seed%4),html='<span class="eqsafe-particles" aria-hidden="true">';
    for(var i=0;i<count;i++){
      var x=7+((seed+i*37)%87),y=8+((seed*3+i*53)%83),sz=2+((seed+i*11)%5),dur=(2.8+((seed+i*19)%40)/10).toFixed(1),delay=(-((seed+i*7)%30)/10).toFixed(1);
      var dx=((seed+i*13)%17)-8,dy=((seed+i*29)%19)-12;
      html+='<i class="eqsafe-particle" style="--x:'+x+'%;--y:'+y+'%;--s:'+sz+'px;--d:'+dur+'s;--delay:'+delay+'s;--dx:'+dx+'px;--dy:'+dy+'px"></i>';
    }
    return html+'</span>';
  }catch(_){return'';}
}
function artFor(name,id,mode){
  var p=Array.isArray(id.palette)&&id.palette.length>=3?id.palette:['#8aa4ff','#d8e2ff','#28344f'];
  var svg='<svg viewBox="0 0 100 100" aria-hidden="true"><g>'+semanticCore(id)+identityAccent(id)+'</g></svg>';
  var div=document.createElement('div');div.className='eqsafe-aura-art'+(mode==='cutscene'?' eqsafe-cutscene-art':'');
  var sp=num(id.spin,.04),turn=Math.max(7,22-Math.abs(sp)*70);
  div.style.setProperty('--eqsafe-main',cssEsc(p[0]||'#8aa4ff'));
  div.style.setProperty('--eqsafe-turn',turn.toFixed(1)+'s');
  div.style.setProperty('--eqsafe-spin-angle',(sp<0?-360:360)+'deg');
  div.style.setProperty('--eqsafe-start',((num(id.mark&&id.mark.twist,0))%360)+'deg');
  div.style.setProperty('--eqsafe-a1',cssEsc(p[1]||'#d8e2ff'));
  div.style.setProperty('--eqsafe-a2',cssEsc(p[2]||'#28344f'));
  div.innerHTML=svg+particlesFor(id,mode);div.dataset.aura=name;div.dataset.identity=id.id||'';
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
    var p=id.palette||[],dir=window.getAuraCinematicDirection&&window.getAuraCinematicDirection(name)||{};
    el.dataset.eqsafeFont=String(id.font||'');
    el.dataset.eqsafeParticle=String(id.particle||'');
    el.dataset.eqsafeBackdrop=String(id.backdrop||'');
    el.dataset.eqsafeKind=String(id.kind||'');
    el.style.setProperty('--eqsafe-angle',num(dir.angle,0)+'deg');
    el.style.setProperty('--eqsafe-tempo',num(dir.tempo,1));
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
    el.dataset.eqsafeFont=String(id.font||'');
    el.dataset.eqsafeParticle=String(id.particle||'');
    el.dataset.eqsafeBackdrop=String(id.backdrop||'');
    el.dataset.eqsafeKind=String(id.kind||'');
    el.style.setProperty('--eqsafe-main',cssEsc(p[0]||'#8aa4ff'));
    el.style.setProperty('--eqsafe-a1',cssEsc(p[1]||'#d8e2ff'));
    el.style.setProperty('--eqsafe-a2',cssEsc(p[2]||'#28344f'));
    el.appendChild(artFor(name,id));seen.set(el,name);
  }catch(e){
    // One Aura/card is never allowed to disable Equinox or the other cards.
    console.warn('[AuraSafe] skipped card',e);
  }
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
      io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){decorate(e.target);io.unobserve(e.target);}});},{rootMargin:'180px'});
    }
    observer=new MutationObserver(function(muts){
      if(disabled)return;
      try{
        muts.forEach(function(m){
          Array.prototype.forEach.call(m.addedNodes||[],function(node){
            if(!node||node.nodeType!==1)return;
            if(node.matches&&node.matches('.eq-cutscene'))decorateCutscene(node);
            if(node.matches&&node.matches('.aura-card,.recent-row,.roll-result'))decorate(node);
            if(node.querySelectorAll){
              node.querySelectorAll('.eq-cutscene').forEach(decorateCutscene);
              node.querySelectorAll('.aura-card,.recent-row,.roll-result').forEach(decorate);
            }
          });
        });
      }catch(e){console.warn('[AuraSafe] mutation decoration skipped',e);}
    });
    observer.observe(document.body,{childList:true,subtree:true});
    document.documentElement.classList.add('eqsafe-ready');
    candidates(document).forEach(decorate);
    document.querySelectorAll('.eq-cutscene').forEach(decorateCutscene);
    window.EQUINOX_AURA_SAFE_VERSION=VERSION;
    window.EQUINOX_AURA_SAFE_STATUS='ready';
    window.equinoxAuraSafeRefresh=queueScan;
    window.equinoxAuraSafeDisable=function(){disabled=true;document.documentElement.classList.remove('eqsafe-ready');try{observer&&observer.disconnect();io&&io.disconnect();}catch(_){}document.querySelectorAll('.eqsafe-aura-art').forEach(function(x){x.remove();});document.querySelectorAll('.eq-cutscene[data-eqsafe-cutscene]').forEach(function(x){delete x.dataset.eqsafeCutscene;});};
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