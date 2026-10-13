/* Equinox cinematic cutscene engine v2.0.0
 * Directed choreography engine.
 * Document tier rules remain authoritative; this engine changes presentation, not requirements.
 */
(function(){
'use strict';

var VERSION='2.0.0';
var booted=false,active=null,pendingRoll=null,originalRoll=null,originalResolve=null,originalStorage=null,originalRender=null;

var css=`
.eq-cutscene{position:fixed;inset:0;z-index:99999;background:#000;color:#fff;overflow:hidden;isolation:isolate;perspective:1000px}
.eq-camera,.eq-world{position:absolute;inset:0;transform-origin:50% 50%;will-change:transform,filter}
.eq-world{overflow:hidden}
.eq-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:7}
.eq-backdrop{position:absolute;inset:-12%;z-index:0;background:
 radial-gradient(circle at 50% 50%,color-mix(in srgb,var(--aura-main) 18%,transparent),transparent 32%),
 radial-gradient(ellipse at 50% -10%,color-mix(in srgb,var(--aura-a1) 16%,transparent),transparent 45%),
 radial-gradient(ellipse at 50% 110%,color-mix(in srgb,var(--aura-a2) 16%,transparent),transparent 45%);
 opacity:0;filter:blur(30px);will-change:opacity,filter,transform}
.eq-vignette{position:absolute;inset:0;z-index:30;pointer-events:none;box-shadow:inset 0 0 18vw #000;background:radial-gradient(circle at 50% 50%,transparent 28%,rgba(0,0,0,.22) 70%,rgba(0,0,0,.8) 118%)}
.eq-top-energy,.eq-bottom-energy{position:absolute;left:-10%;width:120%;height:45%;z-index:3;opacity:0;filter:blur(18px);will-change:opacity,transform,filter}
.eq-top-energy{top:-26%;background:radial-gradient(ellipse at 50% 100%,var(--aura-main),color-mix(in srgb,var(--aura-a1) 42%,transparent) 28%,transparent 68%)}
.eq-bottom-energy{bottom:-26%;background:radial-gradient(ellipse at 50% 0,var(--aura-main),color-mix(in srgb,var(--aura-a2) 42%,transparent) 28%,transparent 68%)}

.eq-star4,.eq-star8{position:absolute;left:50%;top:50%;z-index:11;width:min(23vw,235px);height:min(23vw,235px);opacity:0;will-change:transform,opacity,filter}
.eq-star4:before,.eq-star4:after,.eq-star8:before,.eq-star8:after{content:"";position:absolute;inset:6%;background:
 linear-gradient(90deg,transparent 43%,#fff 49.2%,#fff 50.8%,transparent 57%),
 linear-gradient(0deg,transparent 43%,#fff 49.2%,#fff 50.8%,transparent 57%);
 clip-path:polygon(50% 0,57% 42%,100% 50%,57% 58%,50% 100%,43% 58%,0 50%,43% 42%);
 mix-blend-mode:screen;filter:drop-shadow(0 0 10px var(--aura-main))}
.eq-star4:after{transform:scale(.76);background-color:var(--aura-main);opacity:.8}
.eq-star8{z-index:10;width:min(31vw,315px);height:min(31vw,315px)}
.eq-star8:before{transform:rotate(22.5deg);background-color:var(--aura-a1)}
.eq-star8:after{transform:rotate(67.5deg);background-color:var(--aura-a2);opacity:.72}

.eq-centerpiece{position:absolute;left:50%;top:50%;z-index:12;opacity:0;pointer-events:none;will-change:opacity,transform,filter}
.eq-centerpiece .eqv-wrap{transform:translateZ(0)}
.eq-mini-field{position:absolute;inset:0;z-index:9;pointer-events:none}
.eq-mini-star{position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px;opacity:0;will-change:transform,left,top,opacity}
.eq-mini-star:before{content:"";position:absolute;inset:0;background:var(--aura-a1);clip-path:polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%);filter:drop-shadow(0 0 8px var(--aura-a1))}

.eq-rune-field{position:absolute;left:50%;top:50%;z-index:5;width:min(78vw,780px);height:min(78vw,780px);transform:translate(-50%,-50%);opacity:0;pointer-events:none;will-change:opacity,transform}
.eq-rune-ring{position:absolute;inset:7%;border:1px solid color-mix(in srgb,var(--aura-a1) 58%,transparent);border-radius:50%;box-shadow:0 0 26px color-mix(in srgb,var(--aura-main) 22%,transparent)}
.eq-rune-ring.r2{inset:20%;border-style:dashed;border-color:color-mix(in srgb,var(--aura-a2) 62%,transparent)}
.eq-rune-ring.r3{inset:34%;border-width:2px}
.eq-rune-text{position:absolute;inset:0;display:grid;place-items:center;font-size:clamp(14px,2vw,28px);letter-spacing:1em;color:var(--aura-a1);text-shadow:0 0 15px var(--aura-a1);white-space:nowrap}
.eq-rune-text.r2{transform:rotate(90deg);color:var(--aura-a2);font-size:clamp(11px,1.5vw,22px)}

.eq-narrative{position:absolute;left:50%;z-index:21;width:min(92vw,1000px);transform:translateX(-50%);text-align:center;opacity:0;
 font:600 clamp(12px,1.4vw,21px)/1.65 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;
 text-shadow:0 0 12px currentColor,0 0 30px color-mix(in srgb,var(--aura-main) 45%,transparent);will-change:opacity,transform,filter}
.eq-narrative.top{top:11%}.eq-narrative.bottom{bottom:10%}

.eq-slice-field{position:absolute;inset:0;z-index:24;opacity:0;pointer-events:none}
.eq-slice-piece{position:absolute;inset:-8%;background:linear-gradient(100deg,var(--aura-a2),var(--aura-main),var(--aura-a1));mix-blend-mode:screen;filter:brightness(1.3)}
.eq-slice-piece.s1{clip-path:polygon(0 0,100% 0,100% 43%,0 51%)}
.eq-slice-piece.s2{clip-path:polygon(0 51%,100% 43%,100% 58%,0 66%)}
.eq-slice-piece.s3{clip-path:polygon(0 66%,100% 58%,100% 100%,0 100%)}

.eq-shock{position:absolute;left:50%;top:50%;z-index:18;width:20px;height:20px;border-radius:50%;border:2px solid #fff;opacity:0;transform:translate(-50%,-50%) scale(.1);box-shadow:0 0 30px var(--aura-main),inset 0 0 24px var(--aura-main);pointer-events:none}
.eq-flash{position:absolute;inset:0;z-index:50;background:#fff;opacity:0;mix-blend-mode:screen;pointer-events:none}
.eq-letterbox:before,.eq-letterbox:after{content:"";position:absolute;left:0;width:100%;height:0;background:#000;z-index:35;transition:none}
.eq-letterbox:before{top:0}.eq-letterbox:after{bottom:0}
.eq-info{position:absolute;left:20px;bottom:18px;z-index:60;font-size:10px;letter-spacing:.14em;text-transform:uppercase;opacity:.35}
.eq-stop{position:absolute;right:24px;top:50%;transform:translateY(-50%);z-index:70;border:1px solid rgba(255,255,255,.38);background:rgba(8,8,10,.7);color:#fff;padding:9px 14px;border-radius:7px;letter-spacing:.12em;font-weight:700;cursor:pointer}
.eq-stop:hover{background:rgba(255,255,255,.1)}
.eq-aura-design-panel{position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.66);backdrop-filter:blur(10px);display:grid;place-items:center;padding:24px}
.eq-aura-design-card{width:min(720px,92vw);max-height:86vh;overflow:auto;border:1px solid color-mix(in srgb,var(--aura-main) 50%,#fff 10%);border-radius:18px;background:linear-gradient(160deg,#0b0d12,#141821);box-shadow:0 0 80px color-mix(in srgb,var(--aura-main) 30%,transparent);padding:28px;position:relative}
.eq-aura-close{position:absolute;right:16px;top:12px;border:0;background:transparent;color:#fff;font-size:28px;cursor:pointer}
.eq-aura-swatch{height:96px;border-radius:14px;background:radial-gradient(circle at 50% 50%,var(--aura-main),transparent 28%),linear-gradient(120deg,var(--aura-a1),var(--aura-a2));margin-bottom:18px;box-shadow:0 0 60px color-mix(in srgb,var(--aura-main) 55%,transparent)}
.eq-aura-meta{opacity:.65;text-transform:uppercase;letter-spacing:.12em;font-size:12px;margin-bottom:18px}
.eq-aura-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.eq-aura-grid>div,.eq-aura-stages,.eq-aura-parent{padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:rgba(255,255,255,.025)}
.eq-aura-grid b,.eq-aura-stages b{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.55;margin-bottom:5px}.eq-aura-grid span,.eq-aura-stages div{font-size:13px;line-height:1.5}.eq-aura-stages{margin-top:10px}.eq-aura-parent{margin-top:10px;font-size:13px}

@media(max-width:700px){.eq-stop{right:10px}.eq-rune-field{width:90vw;height:90vw}.eq-star4{width:180px;height:180px}.eq-star8{width:225px;height:225px}.eq-narrative{font-size:11px}.eq-aura-grid{grid-template-columns:1fr}}
.reduced-motion .eq-camera,.reduced-motion .eq-world,.reduced-motion .eq-star4,.reduced-motion .eq-star8,.reduced-motion .eq-centerpiece{transition:none!important}
.reduced-motion .eq-backdrop{filter:blur(16px)!important}
`;
var style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

function esc(v){return String(v==null?'':v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
function settings(){return (window.state&&window.state.settings)||{};}
function cinematicEnabled(){return String(settings().rareRollDisplay||'Enhanced')==='Cinematic';}
function quality(){var q=settings().particleQuality||'High',n=q==='High'?1:(q==='Medium'?0.7:(q==='Low'?0.42:0));if(settings().performanceMode||settings().lowDetailMode)n*=.45;return Math.max(0,Math.min(1,n));}
function shakeMode(){return settings().reducedMotion?'Off':String(settings().screenShake||'Full');}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function phase(p,a,b){return clamp((p-a)/(b-a),0,1);}
function smooth(v){v=clamp(v,0,1);return v*v*(3-2*v);}
function easeOut(v){v=clamp(v,0,1);return 1-Math.pow(1-v,3);}
function pulse(p,c,w){return Math.max(0,1-Math.abs(p-c)/w);}
function hash(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0;}
function rnd(seed,i){var x=Math.sin((seed+i*374761393)*.000001)*43758.5453123;return x-Math.floor(x);}
function finalFlashTime(type){return type==='Unique'?0.2:(type==='Mythic'?0.5:(type==='Glorious'?0.6:(type==='Transcendent'?0.8:(type==='Apotheotic'?1:(type==='Equinox'?1.2:(type==='Epic'?0.16:0.4))))));}
function eligible(record){if(!record||record.skipped||record.cinematicEligible===false)return false;var d=window.getAuraCutsceneProfile&&window.getAuraCutsceneProfile(record.name);return !!d&&d.cutsceneType!=='None'&&d.cutsceneDuration>0;}

function tierRank(t){return {Epic:1,Unique:2,Mythic:3,Exalted:4,Glorious:5,Transcendent:6,Apotheotic:7,Equinox:8}[t]||0;}
function choreography(type){
 var r=tierRank(type);
 return {
  rank:r,
  star4:r>=2,
  glow:r>=3,
  star8:r>=4,
  minis:r>=4,
  runes:r>=5,
  slices:r>=5,
  narrative:r>=6,
  violent:r>=6,
  longform:r>=7
 };
}
function makeOverlay(d,replay){
 var o=document.createElement('div'),vs=window.getAuraVisualSpec&&window.getAuraVisualSpec(d.name);
 var pal=vs&&vs.palette||[d.mainColor,d.accentColors[0],d.accentColors[1]],c=choreography(d.cutsceneType);
 o.className='eq-cutscene eq-letterbox';
 o.style.setProperty('--aura-main',pal[0]);o.style.setProperty('--aura-a1',pal[1]);o.style.setProperty('--aura-a2',pal[2]);
 var centerpiece=window.renderAuraVisual?window.renderAuraVisual(d.name,{size:Math.min(380,Math.max(220,window.innerWidth*.28))}):'';
 o.innerHTML='<div class="eq-camera"><div class="eq-world">'+
  '<div class="eq-backdrop"></div><div class="eq-top-energy"></div><div class="eq-bottom-energy"></div>'+
  '<div class="eq-rune-field"><div class="eq-rune-ring"></div><div class="eq-rune-ring r2"></div><div class="eq-rune-ring r3"></div><div class="eq-rune-text">✦ · ◇ · ○ · ⟡ · ✧ · ◌</div><div class="eq-rune-text r2">◇ · ✧ · ◌ · ○ · ✦ · ⟡</div></div>'+
  '<canvas class="eq-canvas"></canvas><div class="eq-mini-field"></div><div class="eq-star8"></div><div class="eq-star4"></div>'+
  '<div class="eq-centerpiece">'+centerpiece+'</div><div class="eq-shock"></div>'+
  '<div class="eq-narrative top"></div><div class="eq-narrative bottom"></div>'+
  '<div class="eq-slice-field"><div class="eq-slice-piece s1"></div><div class="eq-slice-piece s2"></div><div class="eq-slice-piece s3"></div></div>'+
  '</div></div><div class="eq-vignette"></div><div class="eq-flash"></div>'+
  '<div class="eq-info">AURA CINEMATIC · '+esc(d.cutsceneType)+'</div>'+
  (replay?'<button class="eq-stop" aria-label="Stop cutscene">STOP</button>':'');
 document.body.appendChild(o);
 if(c.minis){
  var mf=o.querySelector('.eq-mini-field'),count=Math.min(10,Math.max(4,Math.floor(4+quality()*6)));
  for(var i=0;i<count;i++){var m=document.createElement('div');m.className='eq-mini-star';m.dataset.i=i;mf.appendChild(m);}
 }
 return o;
}

function cue(key,freq,dur,vol){
 if(!active||active.cues[key])return;
 active.cues[key]=1;
 audioTone(freq,dur,vol);
}
function audioTone(freq,dur,vol){
 try{
  var s=settings();if(s.muted||Number(s.sfxVolume||80)<=0||!window.AudioContext)return;
  window.__eqAudio=window.__eqAudio||new AudioContext();
  var c=window.__eqAudio,o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.value=Number(freq)||220;
  g.gain.value=Math.min(.045,(Number(s.masterVolume||70)/100)*(Number(s.sfxVolume||80)/100)*(vol||.5));
  o.connect(g);g.connect(c.destination);o.start();
  g.gain.exponentialRampToValueAtTime(.001,c.currentTime+Math.max(.05,dur||.2));
  o.stop(c.currentTime+Math.max(.05,dur||.2));
 }catch(_){}
}

function particleShape(ctx,x,y,r,c,kind,alpha,rot){
 ctx.save();ctx.translate(x,y);ctx.rotate(rot||0);ctx.globalAlpha=alpha;ctx.fillStyle=c;ctx.strokeStyle=c;
 if(kind==='pixel'||kind==='tech'||kind==='glitch'){ctx.fillRect(-r,-r,r*2,r*2);}
 else if(kind==='moon-shard'||kind==='ice-star'||kind==='glass'||kind==='metal'){ctx.beginPath();ctx.moveTo(0,-r*1.7);ctx.lineTo(r*.9,r*.55);ctx.lineTo(-r*.7,r*.9);ctx.closePath();ctx.fill();}
 else if(kind==='bubble'){ctx.lineWidth=Math.max(.6,r*.2);ctx.beginPath();ctx.arc(0,0,r*1.2,0,Math.PI*2);ctx.stroke();}
 else if(kind==='ember'||kind==='ray'){ctx.scale(.42,1.9);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();}
 else if(kind==='petal'){ctx.beginPath();ctx.ellipse(0,0,r*.65,r*1.5,.5,0,Math.PI*2);ctx.fill();}
 else if(/star|spark|pinpoint|crown/.test(kind)){ctx.beginPath();for(var j=0;j<8;j++){var a=j*Math.PI/4,rr=j%2?r*.32:r*1.5;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();}
 else{ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}

function particleMode(d,p){
 var r=tierRank(d.cutsceneType);
 if(r===1)return p<.44?'drift':p<.74?'snap':'fade';
 if(r===2)return p<.20?'silence':p<.70?'orbit':'compress';
 if(r===3)return p<.12?'silence':p<.62?'converge':p<.88?'orbit':'burst';
 if(r===4)return p<.10?'silence':p<.48?'converge':p<.86?'multi-orbit':'burst';
 if(r===5)return p<.08?'silence':p<.36?'converge':p<.76?'multi-orbit':p<.91?'storm':'recede';
 if(r===6)return p<.06?'silence':p<.28?'converge':p<.63?'multi-orbit':p<.82?'storm':p<.93?'collapse':'burst';
 return p<.04?'silence':p<.18?'converge':p<.45?'multi-orbit':p<.72?'storm':p<.90?'collapse':'burst';
}
function startParticles(canvas,d){
 var ctx=canvas.getContext('2d'),q=quality(),vs=window.getAuraVisualSpec&&window.getAuraVisualSpec(d.name),kind=vs&&vs.particle||d.sceneKind||d.theme||'spark';
 var seed=hash(d.name),rank=tierRank(d.cutsceneType),count=Math.floor((rank===1?28:rank===2?42:rank===3?72:rank===4?100:rank===5?125:rank===6?155:185)*(.42+.58*q));
 var parts=[];
 for(var i=0;i<count;i++)parts.push({
  a:rnd(seed,i*7)*Math.PI*2,r:.10+rnd(seed,i*7+1)*.64,s:.7+rnd(seed,i*7+2)*3.8,
  spin:(rnd(seed,i*7+3)-.5)*2.8,band:i%3,side:rnd(seed,i*7+4),phase:rnd(seed,i*7+5)*Math.PI*2
 });
 function frame(ts){
  if(!active||!document.body.contains(canvas))return;
  var dpr=Math.min(window.devicePixelRatio||1,2),cw=canvas.clientWidth,ch=canvas.clientHeight;
  if(canvas.width!==Math.floor(cw*dpr)||canvas.height!==Math.floor(ch*dpr)){canvas.width=Math.floor(cw*dpr);canvas.height=Math.floor(ch*dpr);}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cw,ch);
  var p=active.progress,mode=particleMode(d,p),cx=cw/2,cy=ch/2,base=Math.min(cw,ch),pal=(vs&&vs.palette)||[d.mainColor,d.accentColors[0],d.accentColors[1]];
  ctx.globalCompositeOperation='lighter';
  parts.forEach(function(x,i){
   var ang=x.a+ts*.00012*(.35+x.band*.2)*(d.motionProfile==='counter-rotation'?-1:1),rad=x.r*base,xx,yy,alpha=.15+.44*q,sz=x.s,rot=ang+x.spin*p;
   if(mode==='silence'){alpha*=phase(p,.015,.07)*.08;xx=cx+Math.cos(ang)*rad*1.45;yy=cy+Math.sin(ang)*rad*1.45;}
   else if(mode==='drift'){xx=cx+(x.side-.5)*cw*.92;yy=(x.phase%(Math.PI*2))/(Math.PI*2)*ch+Math.sin(ts*.0007+x.phase)*22;alpha*=.7;}
   else if(mode==='snap'){var k=easeOut(phase(p,.44,.74));xx=cx+(x.side-.5)*cw*(1-k*.72);yy=cy+Math.sin(ang)*rad*(1-k*.35);alpha*=.85;}
   else if(mode==='fade'){xx=cx+Math.cos(ang)*rad;yy=cy+Math.sin(ang)*rad;alpha*=1-phase(p,.75,1);}
   else if(mode==='converge'){var k=smooth(phase(p,.08,rank>=5?0.38:0.60));var sr=rad*(1.45-k*.95);xx=cx+Math.cos(ang+10*k)*sr;yy=cy+Math.sin(ang+10*k)*sr;sz*=.7+1.1*k;}
   else if(mode==='orbit'||mode==='multi-orbit'){var rr=base*(mode==='multi-orbit'?(.12+x.band*.095):.20);xx=cx+Math.cos(ang+p*(5+x.band*2))*rr;yy=cy+Math.sin(ang+p*(5+x.band*2))*rr;alpha*=.9;}
   else if(mode==='storm'){var rr=base*(.12+x.band*.13)+Math.sin(ts*.002+x.phase)*18;xx=cx+Math.cos(ang+p*14)*rr;yy=cy+Math.sin(ang+p*14)*rr;sz*=1.25;alpha*=1.1;}
   else if(mode==='collapse'){var k=smooth(phase(p,rank===6?0.82:0.72,rank===6?0.93:0.90));var rr=rad*(1-k)+base*.025*k;xx=cx+Math.cos(ang+p*18)*rr;yy=cy+Math.sin(ang+p*18)*rr;sz*=1.2+k*1.8;alpha*=1.2;}
   else if(mode==='compress'){var k=smooth(phase(p,.70,.96));var rr=rad*(1-k*.82);xx=cx+Math.cos(ang+p*8)*rr;yy=cy+Math.sin(ang+p*8)*rr;alpha*=.9;}
   else if(mode==='recede'){var k=phase(p,.91,1);var rr=rad*(.8+2.4*k);xx=cx+Math.cos(ang)*rr;yy=cy+Math.sin(ang)*rr;alpha*=1-k;sz*=1+2*k;}
   else{var k=easeOut(phase(p,rank===3?.88:rank===4?.86:rank===6?0.93:0.90,1));var rr=base*(.04+k*(.55+x.r*.7));xx=cx+Math.cos(x.a)*rr;yy=cy+Math.sin(x.a)*rr;alpha*=1-k*.72;sz*=1+2.4*k;}
   particleShape(ctx,xx,yy,Math.max(.7,sz),pal[i%3],kind,Math.max(0,alpha),rot);
  });
  // Directed shock rings replace constant decorative starfield.
  if((rank>=3&&p>.84)||(rank>=6&&p>.78)){
   var start=rank>=6?0.79:0.86,k=phase(p,start,1);
   ctx.globalAlpha=(1-k)*.45;ctx.strokeStyle=pal[1];ctx.lineWidth=1.4+2*q;
   ctx.beginPath();ctx.arc(cx,cy,base*(.03+.58*easeOut(k)),0,Math.PI*2);ctx.stroke();
  }
  ctx.globalCompositeOperation='source-over';
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}

function setNarrative(o,d,p){
 var top=o.querySelector('.eq-narrative.top'),bottom=o.querySelector('.eq-narrative.bottom'),lines=d.cutsceneText||[];
 if(tierRank(d.cutsceneType)<6||!lines.length){top.style.opacity=bottom.style.opacity='0';return;}
 var begin=d.cutsceneType==='Equinox'?0.20:(d.cutsceneType==='Apotheotic'?0.18:0.24),end=d.cutsceneType==='Equinox'?0.83:0.76;
 var local=phase(p,begin,end),all=lines.join('\n'),chars=Math.floor(all.length*clamp(local*1.42,0,1)),shown=all.slice(0,chars).split('\n');
 top.textContent=shown[0]||'';bottom.textContent=shown.slice(1).join('   ')||'';
 var enter=smooth(phase(local,.02,.12)),leave=1-smooth(phase(local,.86,1)),a=enter*leave;
 top.style.opacity=String(a);bottom.style.opacity=String(a*.92);
 top.style.transform='translateX(-50%) translateY('+((1-enter)*-18)+'px)';
 bottom.style.transform='translateX(-50%) translateY('+((1-enter)*18)+'px)';
}

function animateScene(o,d,p){
 var c=choreography(d.cutsceneType),rank=c.rank,world=o.querySelector('.eq-world'),camera=o.querySelector('.eq-camera'),back=o.querySelector('.eq-backdrop');
 var star=o.querySelector('.eq-star4'),star8=o.querySelector('.eq-star8'),cp=o.querySelector('.eq-centerpiece');
 var top=o.querySelector('.eq-top-energy'),bottom=o.querySelector('.eq-bottom-energy'),runes=o.querySelector('.eq-rune-field'),slice=o.querySelector('.eq-slice-field'),shock=o.querySelector('.eq-shock');
 var reduced=settings().reducedMotion,rotSign=d.motionProfile==='counter-rotation'?-1:1;

 // CINEMATOGRAPHY: darkness -> formation -> acceleration -> impact. Never leave every layer "on".
 var ambient=rank===1?smooth(phase(p,0,.22))*(1-smooth(phase(p,.72,1))):smooth(phase(p,.02,.18));
 back.style.opacity=String((.05+rank*.025)*ambient);
 back.style.transform='scale('+(1.14-.10*smooth(p))+') rotate('+(rotSign*p*3)+'deg)';

 if(rank===1){
  var eIn=easeOut(phase(p,.02,.30)),eOut=1-smooth(phase(p,.62,1));
  cp.style.opacity=String(eIn*eOut);cp.style.transform='translate(-50%,-50%) scale('+(1.22-.20*eIn)+')';
  cp.style.filter='saturate(1.65) brightness('+(1.55-.35*eIn)+')';
  star.style.opacity=star8.style.opacity='0';
  if(p>.10)cue('epic-hit',260,.10,.48);
 }else{
  // Required 4-point star: enters alone, starts slow, then accelerates.
  var starEnter=smooth(phase(p,.08,.24)),starExit=1-smooth(phase(p,.94,.995));
  var accel=Math.pow(phase(p,.10,.94),2.25),rot=(18*p+1220*accel)*rotSign;
  star.style.opacity=String(starEnter*starExit*(rank>=4?0.88:1));
  star.style.transform='translate(-50%,-50%) rotate('+rot+'deg) scale('+(0.70+.30*easeOut(starEnter)+.055*Math.sin(p*Math.PI*5))+')';
  star.style.filter='drop-shadow(0 0 '+(10+26*phase(p,.35,.92))+'px var(--aura-main)) brightness('+(1+.85*phase(p,.68,.95))+')';
  if(p>.09)cue('star-enter',105+rank*14,.35,.24);

  // Aura identity is revealed after the required star establishes the shot.
  var cpStart=rank===2?0.38:(rank===3?0.34:(rank===4?0.30:0.27));
  var cpIn=smooth(phase(p,cpStart,cpStart+.16)),cpOut=1-smooth(phase(p,.90,.98));
  cp.style.opacity=String(cpIn*cpOut*(rank===2?0.58:0.82));
  cp.style.transform='translate(-50%,-50%) scale('+(0.62+.42*easeOut(cpIn)+.025*Math.sin(p*Math.PI*8))+') rotate('+(rotSign*-12*phase(p,cpStart,.9))+'deg)';
  cp.style.filter='saturate('+(1.05+.75*phase(p,.45,.9))+') brightness('+(0.8+.45*phase(p,.25,.86))+')';

  if(c.glow){
   var gIn=smooth(phase(p,.16,.34)),gOut=1-smooth(phase(p,.89,.98)),energy=gIn*gOut;
   top.style.opacity=bottom.style.opacity=String(.22+.58*energy);
   var push=(1-energy)*38;
   top.style.transform='translateY('+(-push)+'px) scaleY('+(0.76+.30*energy)+')';
   bottom.style.transform='translateY('+(push)+'px) scaleY('+(0.76+.30*energy)+')';
  }else top.style.opacity=bottom.style.opacity='0';

  if(c.star8){
   var e8=smooth(phase(p,.28,.48))*(1-smooth(phase(p,.91,.985)));
   star8.style.opacity=String(.78*e8);
   star8.style.transform='translate(-50%,-50%) rotate('+(-rotSign*(25+720*Math.pow(phase(p,.30,.94),1.7)))+'deg) scale('+(1.18-.18*easeOut(e8))+')';
   if(p>.30)cue('eight-point',155+rank*18,.42,.22);
   o.querySelectorAll('.eq-mini-star').forEach(function(m,i){
    var n=o.querySelectorAll('.eq-mini-star').length,a=i/n*Math.PI*2+rotSign*p*(2.5+i%2),rr=(14+(i%3)*5)*smooth(phase(p,.34,.54));
    var ma=smooth(phase(p,.36,.52))*(1-smooth(phase(p,.88,.98)));
    m.style.left=(50+Math.cos(a)*rr)+'%';m.style.top=(50+Math.sin(a)*rr)+'%';
    m.style.opacity=String(ma*(.55+(i%2)*.28));m.style.transform='rotate('+(rotSign*(i%2?-1:1)*p*900)+'deg) scale('+(0.55+.4*ma)+')';
   });
  }else star8.style.opacity='0';

  if(c.runes){
   var ri=smooth(phase(p,.38,.56)),ro=1-smooth(phase(p,.83,.95)),ra=ri*ro;
   runes.style.opacity=String(.62*ra);
   runes.style.transform='translate(-50%,-50%) rotate('+(rotSign*(p*160))+'deg) scale('+(1.16-.16*ri+.18*phase(p,.68,.9))+')';
  }else runes.style.opacity='0';

  if(c.slices){
   var sp=pulse(p,.91,.032);
   slice.style.opacity=String(Math.min(1,sp*1.4));
   var pcs=slice.querySelectorAll('.eq-slice-piece'),away=phase(p,.91,.98);
   pcs[0].style.transform='translateY('+(-away*12)+'%) translateX('+(away*3)+'%)';
   pcs[1].style.transform='translateX('+(-away*7)+'%) scale('+(1+away*.08)+')';
   pcs[2].style.transform='translateY('+(away*12)+'%) translateX('+(away*3)+'%)';
   if(p>.895)cue('slice',330,.16,.48);
  }else slice.style.opacity='0';
 }

 // Impact ring appears only during an impact window.
 var impactCenter=rank===1?0.32:(rank===2?0.955:(rank===3?0.90:(rank===4?0.89:(rank===5?0.91:(rank===6?0.90:0.92)))));
 var imp=pulse(p,impactCenter,rank===1?0.12:0.035);
 shock.style.opacity=String(clamp(imp*1.35,0,1));
 shock.style.transform='translate(-50%,-50%) scale('+(0.2+(1-imp)*7.5)+')';
 shock.style.borderColor=rank>=5?'var(--aura-a1)':'#fff';

 // Tier-specific camera language. Motion is brief and motivated, not constant.
 var zoom=1;
 if(rank===1)zoom=1+.045*pulse(p,.30,.20);
 else zoom=1-.035*smooth(phase(p,.06,.30))+.075*smooth(phase(p,.64,.91));
 var tx=0,ty=0,shake=shakeMode();
 if(c.violent&&p>.78&&p<.94&&shake!=='Off'){
  var envelope=Math.sin(phase(p,.78,.94)*Math.PI),amp=(shake==='Reduced'?2.2:rank>=7?12:8)*envelope;
  tx=Math.sin(p*997)*amp;ty=Math.cos(p*811)*amp*.72;
 }
 camera.style.transform='translate('+tx+'px,'+ty+'px) scale('+zoom+')';
 var contrast=c.violent?1+1.15*pulse(p,.895,.065):1,sat=c.violent?1+1.55*pulse(p,.895,.07):1;
 world.style.filter='contrast('+contrast+') saturate('+sat+')';

 // Glorious fire-like edge energy: energetic only in its stage, not entire cutscene.
 if(rank>=5){
  var fire=smooth(phase(p,.46,.61))*(1-smooth(phase(p,.79,.91)));
  top.style.filter='blur('+(18-7*fire)+'px) saturate('+(1+1.2*fire)+')';
  bottom.style.filter=top.style.filter;
  top.style.opacity=String(Math.max(Number(top.style.opacity)||0,.30+.58*fire));
  bottom.style.opacity=top.style.opacity;
 }

 setNarrative(o,d,p);

 if(c.violent&&p>.80)cue('transcendent-rise',70+rank*10,.7,.32);
 if(p>.87)cue('final-build',180+rank*20,.36,.32);
}

function finish(){
 if(!active)return;
 var a=active;active=null;
 var o=a.overlay,flash=o.querySelector('.eq-flash'),styleName=a.d.revealStyle||'white';
 var fc=styleName==='void'?'#000':styleName==='water'?'linear-gradient(180deg,'+a.d.accentColors[1]+','+a.d.mainColor+')':
  styleName==='gold'?'#fff3b0':styleName==='crimson'||styleName==='red'?'#ff2648':
  styleName==='chromatic'?'linear-gradient(90deg,'+a.d.accentColors[1]+','+a.d.mainColor+','+a.d.accentColors[0]+')':
  styleName==='violet'?'#e8c8ff':'#fff';
 flash.style.background=fc;flash.style.transition='opacity '+a.flashDuration+'s linear';
 flash.style.opacity=settings().reducedFlash?'0.35':'1';
 audioTone(a.d.audioFrequency||(a.d.cutsceneType==='Equinox'?90:220),a.flashDuration,.85);
 setTimeout(function(){
  o.remove();
  if(window.state)window.state.cutsceneActive=false;
  if(pendingRoll){var next=pendingRoll;pendingRoll=null;try{originalRoll.call(window,next.isAuto);}catch(_){}}
  try{render();}catch(_){}
 },Math.max(120,a.flashDuration*1000));
}
function runCutscene(record,replay){
 if(active)return;
 var d=window.getAuraCutsceneProfile&&window.getAuraCutsceneProfile(record.name);if(!d)return;
 if(window.state)window.state.cutsceneActive=true;
 var o=makeOverlay(d,replay),start=performance.now(),totalDuration=Math.max(1,d.cutsceneDuration*1000),flashDuration=finalFlashTime(d.cutsceneType);
 var duration=Math.max(120,totalDuration-flashDuration*1000);
 active={overlay:o,d:d,start:start,duration:duration,totalDuration:totalDuration,flashDuration:flashDuration,progress:0,replay:!!replay,cues:{}};
 if(replay){
  var stop=o.querySelector('.eq-stop');
  if(stop)stop.onclick=function(){if(active&&active.overlay===o)finish();};
 }
 startParticles(o.querySelector('.eq-canvas'),d);
 function tick(now){
  if(!active||active.overlay!==o)return;
  var p=clamp((now-start)/duration,0,1);active.progress=p;
  animateScene(o,d,p);
  if(p>=1){finish();return;}
  requestAnimationFrame(tick);
 }
 requestAnimationFrame(tick);
}

function historyMeta(record,meta){
 try{
  var req=indexedDB.open('equinox-history-v1',2);
  req.onupgradeneeded=function(){var db=req.result,store;if(!db.objectStoreNames.contains('rolls'))store=db.createObjectStore('rolls',{keyPath:'key'});else store=req.transaction.objectStore('rolls');if(!store.indexNames.contains('roll'))store.createIndex('roll','roll',{unique:false});};
  req.onsuccess=function(){var db=req.result,tx=db.transaction('rolls','readwrite'),st=tx.objectStore('rolls'),k=String(record.roll||''),q=st.get(k);q.onsuccess=function(){if(q.result){var v=q.result;Object.assign(v,meta);st.put(v);}}};
 }catch(_){}
}
function patchHistoryRows(){
 var rows=document.querySelectorAll('.history-row');if(!rows.length)return;
 rows.forEach(function(row){
  if(row.querySelector('.eq-view-cutscene'))return;
  var spans=row.children;if(!spans||spans.length<2)return;
  var name=String(spans[1].textContent||'').trim(),d=window.getAuraCutsceneProfile&&window.getAuraCutsceneProfile(name);if(!d)return;
  var b=document.createElement('button');b.className='eq-view-cutscene';b.textContent='View Cutscene';
  b.onclick=function(){var roll=Number(String(spans[0].textContent||'').replace(/[^0-9]/g,''));runCutscene({name:name,roll:roll},true);};
  row.insertBefore(b,row.children[2]||null);
 });
}
function decorateAuraCards(){
 document.querySelectorAll('.aura-card').forEach(function(card){
  var b=card.querySelector('.eq-aura-title,.aura-main b');if(!b)return;
  var name=b.textContent.trim(),d=window.getAuraPresentation&&window.getAuraPresentation(name);if(!d)return;
  card.style.setProperty('--aura-main',d.mainColor);card.style.setProperty('--aura-a1',d.accentColors[0]);card.style.setProperty('--aura-a2',d.accentColors[1]);
  if(card.dataset.eqAuraDecorated)return;card.dataset.eqAuraDecorated='1';
  var btn=document.createElement('button');btn.textContent='Aura Design';btn.className='eq-aura-design-btn';btn.onclick=function(){window.equinoxOpenAuraDesign(name);};
  var actions=card.querySelector('.aura-actions');if(actions&&!actions.querySelector('.eq-aura-design-btn'))actions.appendChild(btn);
 });
}
function patchUI(){
 if(window.__eqCinematicUI)return;window.__eqCinematicUI=true;
 var obs=new MutationObserver(function(){decorateAuraCards();patchHistoryRows();});obs.observe(document.body,{childList:true,subtree:true});
 decorateAuraCards();patchHistoryRows();
}
function wrap(){
 if(booted)return;booted=true;
 if(typeof window.roll==='function'){
  originalRoll=window.roll;
  window.roll=function(isAuto){if(window.state&&window.state.cutsceneActive){pendingRoll={isAuto:!!isAuto};return false}return originalRoll.apply(this,arguments);};
 }
 if(typeof window.resolveRoll==='function'){
  originalResolve=window.resolveRoll;
  window.resolveRoll=function(){
   var out=originalResolve.apply(this,arguments);
   try{
    var r=(window.state&&window.state.recent&&window.state.recent[0])||{};
    if(r&&r.roll&&!r.skipped){
     var pending=window.state.pendingStorageDecision;
     historyMeta(r,{accepted:!pending,skipped:!!r.skipped,pendingStorage:!!pending,rerolled:!!window.state.__eqRerollPending});
     if(window.state.__eqRerollPending){window.state.__eqRerollPending=false;return out;}
     if(!pending&&cinematicEnabled()&&eligible(r))runCutscene(r,false);
    }
   }catch(e){console.warn('Cutscene resolve hook failed',e)}
   return out;
  };
 }
 if(typeof window.potionSpecialPostRoll==='function'&&!window.__eqPotionWrapped){
  var oldPS=window.potionSpecialPostRoll;window.__eqPotionWrapped=true;
  window.potionSpecialPostRoll=function(){var x=oldPS.apply(this,arguments);if(x&&x.requestReroll&&window.state)window.state.__eqRerollPending=true;return x;};
 }
 if(typeof window.resolveStorageDecision==='function'&&!window.__eqStorageWrapped){
  originalStorage=window.resolveStorageDecision;window.__eqStorageWrapped=true;
  window.resolveStorageDecision=function(action){
   var p=window.state&&window.state.pendingStorageDecision,out=originalStorage.apply(this,arguments);
   try{if(p&&p.rollRecord){historyMeta(p.rollRecord,{accepted:action==='keep',skipped:action!=='keep',pendingStorage:false});if(action==='keep'&&cinematicEnabled()&&eligible(p.rollRecord))runCutscene(p.rollRecord,false);}}catch(e){console.warn('Cutscene storage hook failed',e)}
   return out;
  };
 }
 if(typeof window.render==='function'){
  originalRender=window.render;
  window.render=function(){var r=originalRender.apply(this,arguments);setTimeout(patchUI,25);return r;};
 }
}
function boot(){
 try{if(typeof window.getAuraPresentation!=='function'){setTimeout(boot,500);return;}wrap();patchUI();window.EQUINOX_CUTSCENE_ENGINE_VERSION=VERSION;}catch(e){console.warn('Equinox cinematic boot failed',e);}
}
setTimeout(boot,4200);
window.equinoxPreviewCutscene=function(name){var d=window.getAuraCutsceneProfile&&window.getAuraCutsceneProfile(name);if(d)runCutscene({name:name,roll:-1},true);};
window.addEventListener('equinox:aura-presentations-ready',boot);
})();
