/* Equinox Aura Visual Renderer v2.0.0
 * Aura identity owns the centerpiece. Tier only controls presentation intensity.
 */
(function(){
'use strict';
var VERSION='2.0.0';

var CURATED={
'Fragments of the Crimson Moon':{kind:'shattered-moon',palette:['#8b0a1d','#ff2948','#1b0005'],particle:'moon-shard',backdrop:'eclipse',font:'serif-sharp',spin:-.10},
'Calamity of the Crimson Moon':{kind:'blood-eclipse',palette:['#360006','#ff1738','#a8001d'],particle:'moon-shard',backdrop:'crimson-storm',font:'serif-sharp',spin:-.06},
'Dream Catcher':{kind:'dreamcatcher',palette:['#ff7fd4','#9c7cff','#7fe8ff'],particle:'thread-star',backdrop:'dream-web',font:'serif-dream',spin:.08},
'Leviathan':{kind:'leviathan',palette:['#09293c','#2cc7d6','#9ae9ff'],particle:'bubble',backdrop:'deep-water',font:'serif-heavy',spin:.04},
'Borealis':{kind:'aurora',palette:['#9af7ff','#bba7ff','#58ffc8'],particle:'ice-star',backdrop:'aurora',font:'serif-light',spin:.03},
'Glitch':{kind:'glitch-core',palette:['#00ff9d','#ff38d1','#56b8ff'],particle:'pixel',backdrop:'scanline',font:'mono',spin:.16},
'ZERO':{kind:'zero-ring',palette:['#d7f4ff','#62d3ff','#ff5ec8'],particle:'pixel',backdrop:'null-grid',font:'mono',spin:-.14},
'OBLIVION':{kind:'void-eye',palette:['#09070d','#763cff','#d32d7d'],particle:'void-mote',backdrop:'void',font:'serif-thin',spin:.02},
'Point':{kind:'singularity',palette:['#ffffff','#70a8ff','#8f7dff'],particle:'pinpoint',backdrop:'vector-grid',font:'mono-light',spin:.12},
'Projection':{kind:'projection',palette:['#d7b6ff','#78d8ff','#ff9fdd'],particle:'glass',backdrop:'projection',font:'sans-wide',spin:-.08},
'Astraios':{kind:'astral-crown',palette:['#fff0a8','#7fe8ff','#a994ff'],particle:'star',backdrop:'constellation',font:'serif-royal',spin:.05},
'Monarch':{kind:'crown',palette:['#ffd76c','#ba83ff','#fff1b8'],particle:'crown-spark',backdrop:'royal-halo',font:'serif-royal',spin:.02},
'EQUILLIBRIUM':{kind:'balance',palette:['#9be6d0','#c4b7ff','#ffe3a0'],particle:'balance-mote',backdrop:'dual-halo',font:'serif-royal',spin:.03},
'Equinox':{kind:'equinox',palette:['#f4efe1','#b5b8ff','#8fd7c4'],particle:'equilibrium',backdrop:'reality-seam',font:'serif-royal',spin:.015},
'Sandworm':{kind:'sandworm',palette:['#d6a75a','#8b5a2b','#f4d49a'],particle:'sand',backdrop:'dune',font:'serif-heavy',spin:.07},
'Meta':{kind:'meta-cube',palette:['#73f7ff','#a36cff','#ffffff'],particle:'pixel',backdrop:'grid',font:'mono',spin:.12},
'Neferkhaf':{kind:'scarab',palette:['#e5b34f','#4c2b12','#fff0a3'],particle:'sand',backdrop:'sun-disk',font:'serif-royal',spin:.03},
'Eden':{kind:'flower',palette:['#80ffb5','#f6e88c','#8fd7ff'],particle:'petal',backdrop:'garden-halo',font:'serif-light',spin:.03},
'Illusionary':{kind:'mirror-eye',palette:['#b6a1ff','#ff8ad8','#78e8e0'],particle:'glass',backdrop:'mirror',font:'serif-dream',spin:-.08},
'Oppression':{kind:'black-crown',palette:['#b32a3f','#2a050b','#d0c6cc'],particle:'ash',backdrop:'pressure',font:'serif-heavy',spin:-.02},
'SUPERNOVA':{kind:'supernova',palette:['#fff4a8','#ff7c48','#a855ff'],particle:'star',backdrop:'nova',font:'sans-wide',spin:.09},
'EXCALIBUR':{kind:'sword',palette:['#f9f0c5','#87c8ff','#ffffff'],particle:'spark',backdrop:'holy-rays',font:'serif-royal',spin:.02},
'RAGNAROK':{kind:'broken-rune',palette:['#ff4a35','#2b0806','#ffbd67'],particle:'ember',backdrop:'firestorm',font:'serif-heavy',spin:-.09},
'[ LUMINOSITY ]':{kind:'sun',palette:['#fff9cc','#f9d76f','#ffffff'],particle:'ray',backdrop:'solar',font:'sans-wide',spin:.03},
'Nyctophobia':{kind:'fear-eye',palette:['#15101f','#6c3cff','#c52867'],particle:'void-mote',backdrop:'darkness',font:'serif-thin',spin:-.03},
'▣ PIXELATION ▣':{kind:'pixel-core',palette:['#72fff1','#ff72e6','#7a8dff'],particle:'pixel',backdrop:'scanline',font:'mono',spin:.16},
'AMARANTHINE: END OF TIME':{kind:'clock',palette:['#e76cff','#6843ff','#ffe8ff'],particle:'glass',backdrop:'time-fracture',font:'serif-sharp',spin:-.06},
'Master-Hand':{kind:'hand',palette:['#f0d9ff','#a76dff','#fff'],particle:'arcane-spark',backdrop:'hand-void',font:'serif-sharp',spin:.035},
'Compass?':{kind:'compass',palette:['#e9d8a6','#6fd6ff','#fff8dc'],particle:'spark',backdrop:'navigation',font:'serif-royal',spin:.05}
};

function hash(s){var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function semantic(name,theme){
 var n=String(name||'').toLowerCase(),rules=[
 [/crimson|blood|moon|lunar|eclipse/,'moon'],[/sun|solar|lumen|radiant/,'sun'],[/crown|king|queen|royal|monarch|sovereign/,'crown'],
 [/eye|vision|watch|omniscient/,'eye'],[/sword|blade|excalibur/,'sword'],[/ocean|sea|wave|tidal|leviathan|maelstrom|aqua/,'wave'],
 [/ice|frost|snow|blizzard|glacier/,'snowflake'],[/fire|flame|ember|inferno|ash|pyre/,'flame'],[/flower|lotus|flora|eden|leaf|nature/,'flower'],
 [/crystal|quartz|gem|ruby|sapphire|topaz|obsidian/,'crystal'],[/pixel|glitch|byte|code|matrix|null|zero|virtual/,'pixel'],
 [/rune|arcane|mage|wizard|sorcer|magic|apotheosis/,'rune'],[/music|melod|symph|song|jazz|rhythm|overture/,'note'],
 [/dream|illusion|memory|thought|alice/,'dream'],[/void|oblivion|abyss|nothing|dark/,'void'],[/hand/,'hand'],[/compass/,'compass'],
 [/door|gate|portal/,'door'],[/clock|time|second|tomorrow/,'clock'],[/star|nova|astral|cosmic|celestial|stellar|orion|vega/,'star'],
 [/atom|nucleus|atomic/,'atom'],[/storm|thunder|lightning|tempest/,'lightning'],[/heart|love/,'heart'],[/angel|divine|holy|faith|savior|spirit|soul/,'halo']
 ];
 for(var i=0;i<rules.length;i++)if(rules[i][0].test(n))return rules[i][1];
 return ({aquatic:'wave',frost:'snowflake',cosmic:'star',solar:'sun',shadow:'void',nature:'flower',arcane:'rune',tech:'pixel',royal:'crown',musical:'note',dream:'dream',fire:'flame',metal:'crystal',spiritual:'halo',glitch:'pixel'})[theme]||'sigil';
}
function fontFor(kind,seed){
 if(/pixel|zero|meta|projection/.test(kind))return'mono';
 if(/crown|halo|sun|astral|sword|scarab|compass/.test(kind))return'serif-royal';
 if(/void|eye|blood|fear|hand/.test(kind))return'serif-sharp';
 if(/dream|flower|moon/.test(kind))return'serif-dream';
 return ['serif-light','sans-wide','serif-heavy','mono-light'][seed%4];
}
function particleFor(kind,theme){
 if(/moon|crimson|blood/.test(kind))return'moon-shard';
 if(/pixel|zero|meta/.test(kind))return'pixel';
 if(/wave|leviathan/.test(kind))return'bubble';
 if(/fire|flame|ragnarok|lightning/.test(kind))return'ember';
 if(/snow|ice/.test(kind))return'ice-star';
 if(/flower|eden/.test(kind))return'petal';
 if(/crystal|glass|projection|mirror/.test(kind))return'glass';
 if(/rune|arcane/.test(kind))return'rune';
 if(/star|nova|astral|sun/.test(kind))return'star';
 if(/void|eye/.test(kind))return'void-mote';
 return theme==='aquatic'?'bubble':theme==='fire'?'ember':theme==='glitch'?'pixel':'spark';
}
function specFor(name){
 var d=window.getAuraPresentation&&window.getAuraPresentation(name),seed=hash(name),theme=d&&d.theme||'prismatic',c=CURATED[name];
 if(c)return Object.assign({name:name,seed:seed,variant:seed%19,rings:2+seed%4,satellites:2+(seed>>>4)%7},c);
 var kind=semantic(name,theme),p=d&&d.accentColors||['#fff','#8aa4ff','#b79cff'];
 return {name:name,seed:seed,kind:kind,palette:[d&&d.mainColor||p[0],p[0],p[1]||p[0]],particle:particleFor(kind,theme),backdrop:theme,font:fontFor(kind,seed),spin:((seed%21)-10)/100,variant:seed%19,rings:1+(seed%4),satellites:2+((seed>>>5)%8)};
}
function pts(cx,cy,r,n,rot){var a=[];for(var i=0;i<n;i++){var t=rot+i*Math.PI*2/n;a.push((cx+Math.cos(t)*r).toFixed(1)+','+(cy+Math.sin(t)*r).toFixed(1))}return a.join(' ')}
function lineSigil(seed){var s='';for(var i=0;i<5;i++){var a=((seed>>(i*3))%360)*Math.PI/180,r1=15+(seed>>(i+2))%15,r2=40+(seed>>(i+5))%22;s+='<line x1="'+(50+Math.cos(a)*r1).toFixed(1)+'" y1="'+(50+Math.sin(a)*r1).toFixed(1)+'" x2="'+(50+Math.cos(a+1.7)*r2).toFixed(1)+'" y2="'+(50+Math.sin(a+1.7)*r2).toFixed(1)+'"/>'}return s}
function core(spec){
 var k=spec.kind,v=spec.variant;
 if(/shattered-moon|blood-eclipse|moon/.test(k))return '<circle class="eqv-fill" cx="50" cy="50" r="27"/><circle class="eqv-cut" cx="'+(64+v%4)+'" cy="'+(40-v%3)+'" r="23"/><path class="eqv-line" d="M45 25 L51 38 L44 49 L52 58 L47 75 M33 40 L46 48 M52 58 L67 64"/><polygon class="eqv-fill" points="25,67 37,59 33,75"/><polygon class="eqv-fill" points="71,27 83,20 79,36"/>';
 if(/crown/.test(k))return '<path class="eqv-fill" d="M22 67 L18 35 L38 49 L50 25 L62 49 L82 35 L78 67 Z"/><path class="eqv-line" d="M27 74 H73"/>';
 if(/eye/.test(k))return '<path class="eqv-line" d="M13 50 Q50 16 87 50 Q50 84 13 50Z"/><circle class="eqv-fill" cx="50" cy="50" r="'+(10+v%5)+'"/><circle class="eqv-cut" cx="54" cy="46" r="4"/>';
 if(/sword/.test(k))return '<path class="eqv-fill" d="M47 14 H53 L56 58 L64 64 H36 L44 58 Z"/><rect class="eqv-fill" x="29" y="61" width="42" height="7" rx="2"/><path class="eqv-fill" d="M47 68 H53 L57 83 L50 89 L43 83Z"/>';
 if(/wave|leviathan/.test(k))return '<path class="eqv-fill" d="M12 60 Q29 35 47 58 T88 54 Q72 79 52 65 T12 60Z"/><path class="eqv-line" d="M19 44 Q38 22 57 47 T84 41"/>';
 if(/snowflake/.test(k))return '<g class="eqv-line">'+[0,30,60,90,120,150].map(function(a){return'<line x1="50" y1="17" x2="50" y2="83" transform="rotate('+a+' 50 50)"/>'}).join('')+'</g>';
 if(/flame/.test(k))return '<path class="eqv-fill" d="M50 13 C63 34 73 43 69 61 C65 78 53 86 41 81 C24 75 24 58 34 45 C39 38 42 28 40 18 C47 24 49 31 50 39 C57 31 57 22 50 13Z"/>';
 if(/flower/.test(k))return '<g class="eqv-fill">'+[0,60,120,180,240,300].map(function(a){return'<ellipse cx="50" cy="30" rx="10" ry="20" transform="rotate('+a+' 50 50)"/>'}).join('')+'</g><circle class="eqv-cut" cx="50" cy="50" r="9"/>';
 if(/crystal/.test(k))return '<polygon class="eqv-fill" points="50,13 73,36 64,76 50,89 34,76 27,36"/><path class="eqv-line" d="M50 13 L50 89 M27 36 L73 36 M34 76 L64 76"/>';
 if(/pixel|glitch-core|meta-cube|zero-ring/.test(k))return '<rect class="eqv-fill" x="24" y="25" width="19" height="19"/><rect class="eqv-fill" x="53" y="18" width="23" height="23"/><rect class="eqv-fill" x="42" y="51" width="30" height="30"/><rect class="eqv-cut" x="51" y="60" width="9" height="9"/>';
 if(/rune|broken-rune/.test(k))return '<circle class="eqv-line" cx="50" cy="50" r="29"/><polygon class="eqv-line" points="'+pts(50,50,25,5,-Math.PI/2)+'"/><g class="eqv-line">'+lineSigil(spec.seed)+'</g>';
 if(/note/.test(k))return '<path class="eqv-fill" d="M41 23 V66 Q30 59 26 68 Q23 79 37 79 Q48 78 48 66 V39 L69 32 V58 Q58 51 54 61 Q51 71 63 72 Q75 71 75 59 V20Z"/>';
 if(/dreamcatcher/.test(k))return '<circle class="eqv-line" cx="50" cy="45" r="29"/><circle class="eqv-line" cx="50" cy="45" r="18"/><path class="eqv-line" d="M28 30 L72 61 M72 30 L28 61 M50 16 V74 M21 45 H79 M37 74 L34 91 M50 74 L50 94 M63 74 L67 91"/>';
 if(/dream/.test(k))return '<circle class="eqv-fill" cx="41" cy="48" r="23"/><circle class="eqv-cut" cx="53" cy="41" r="23"/><path class="eqv-line" d="M19 73 Q50 59 81 73"/>';
 if(/void/.test(k))return '<circle class="eqv-fill" cx="50" cy="50" r="28"/><circle class="eqv-cut" cx="50" cy="50" r="18"/><circle class="eqv-fill" cx="50" cy="50" r="5"/>';
 if(k==='hand')return '<path class="eqv-fill" d="M31 78 V47 Q31 39 37 39 Q42 39 42 46 V28 Q42 20 48 20 Q53 20 53 28 V45 V23 Q53 16 59 16 Q65 16 65 24 V47 V30 Q65 23 71 23 Q77 23 77 31 V57 Q77 79 58 87 Q43 91 31 78Z"/>';
 if(k==='compass')return '<circle class="eqv-line" cx="50" cy="50" r="32"/><polygon class="eqv-fill" points="50,14 58,45 50,50 42,45"/><polygon class="eqv-fill" points="50,86 42,55 50,50 58,55"/><circle class="eqv-cut" cx="50" cy="50" r="5"/>';
 if(k==='clock')return '<circle class="eqv-line" cx="50" cy="50" r="31"/><path class="eqv-line" d="M50 50 L50 28 M50 50 L66 59"/><g class="eqv-line">'+[0,30,60,90,120,150,180,210,240,270,300,330].map(function(a){var t=a*Math.PI/180;return'<line x1="'+(50+Math.cos(t)*25).toFixed(1)+'" y1="'+(50+Math.sin(t)*25).toFixed(1)+'" x2="'+(50+Math.cos(t)*29).toFixed(1)+'" y2="'+(50+Math.sin(t)*29).toFixed(1)+'"/>'}).join('')+'</g>';
 if(/star|supernova/.test(k))return '<polygon class="eqv-fill" points="'+pts(50,50,32,8,-Math.PI/2)+'"/><circle class="eqv-cut" cx="50" cy="50" r="8"/>';
 if(/sun/.test(k))return '<circle class="eqv-fill" cx="50" cy="50" r="20"/><g class="eqv-line">'+[0,45,90,135,180,225,270,315].map(function(a){var t=a*Math.PI/180;return'<line x1="'+(50+Math.cos(t)*27).toFixed(1)+'" y1="'+(50+Math.sin(t)*27).toFixed(1)+'" x2="'+(50+Math.cos(t)*39).toFixed(1)+'" y2="'+(50+Math.sin(t)*39).toFixed(1)+'"/>'}).join('')+'</g>';
 if(/atom/.test(k))return '<circle class="eqv-fill" cx="50" cy="50" r="5"/><ellipse class="eqv-line" cx="50" cy="50" rx="34" ry="13"/><ellipse class="eqv-line" cx="50" cy="50" rx="34" ry="13" transform="rotate(60 50 50)"/><ellipse class="eqv-line" cx="50" cy="50" rx="34" ry="13" transform="rotate(120 50 50)"/>';
 if(/halo/.test(k))return '<circle class="eqv-line" cx="50" cy="42" r="25"/><ellipse class="eqv-line" cx="50" cy="18" rx="20" ry="6"/><path class="eqv-line" d="M33 59 Q50 81 67 59"/>';
 if(/lightning/.test(k))return '<polygon class="eqv-fill" points="55,11 31,53 48,53 40,89 71,43 53,43"/>';
 if(/door/.test(k))return '<path class="eqv-line" d="M29 82 V22 H71 V82"/><rect class="eqv-fill" x="38" y="31" width="25" height="51"/><circle class="eqv-cut" cx="57" cy="58" r="2.5"/>';
 if(/balance|equinox/.test(k))return '<circle class="eqv-line" cx="50" cy="50" r="30"/><path class="eqv-line" d="M50 18 V80 M28 34 H72 M33 34 L25 52 H41 Z M67 34 L59 52 H75 Z"/><circle class="eqv-fill" cx="50" cy="18" r="5"/>';
 return '<circle class="eqv-line" cx="50" cy="50" r="31"/><polygon class="eqv-line" points="'+pts(50,50,26,6,-Math.PI/2)+'"/><g class="eqv-line">'+lineSigil(spec.seed)+'</g>';
}
function render(name,opts){
 var s=specFor(name),o=opts||{},size=Number(o.size||280),id='eqv'+s.seed.toString(36)+(s.variant||0),p=s.palette;
 return '<div class="eqv-wrap eqv-'+s.font+'" data-eqv-kind="'+s.kind+'" data-eqv-particle="'+s.particle+'" data-eqv-backdrop="'+s.backdrop+'" style="--eqv-main:'+p[0]+';--eqv-a1:'+p[1]+';--eqv-a2:'+p[2]+';--eqv-spin:'+s.spin+';--eqv-size:'+size+'px"><svg class="eqv-svg" viewBox="0 0 100 100" role="img" aria-label="'+String(name).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+' visual"><defs><filter id="'+id+'g"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="'+id+'r"><stop offset="0" stop-color="'+p[1]+'"/><stop offset=".55" stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[2]+'"/></radialGradient></defs><g filter="url(#'+id+'g)" class="eqv-core">'+core(s)+'</g></svg><span class="eqv-orbit eqv-o1"></span><span class="eqv-orbit eqv-o2"></span><span class="eqv-orbit eqv-o3"></span></div>';
}
window.EQUINOX_AURA_VISUAL_VERSION=VERSION;
window.getAuraVisualSpec=specFor;
window.renderAuraVisual=render;
})();