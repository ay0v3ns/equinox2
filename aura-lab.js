(function(){
'use strict';
var V=window.EQUINOX_AURA_VISUAL_IDENTITIES||{},all=Object.entries(V).filter(function(x){return x[0]!=='Shorelace';});
var state={q:'',tier:'',page:1,size:48,motion:'visible',stress:false};
var grid=document.getElementById('grid'),io=null;

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
function fmt(n){n=Number(n||0);return n?('1/'+n.toLocaleString()):'Special';}
function pts(cx,cy,r,n,rot){var a=[];for(var i=0;i<n;i++){var t=rot+i*Math.PI*2/n;a.push((cx+Math.cos(t)*r).toFixed(1)+','+(cy+Math.sin(t)*r).toFixed(1))}return a.join(' ')}
function accent(id){
 var m=id.mark||{},s=Math.max(3,Math.min(12,Number(m.sides||6))),inn=Math.max(.18,Math.min(.72,Number(m.inner||.42))),tw=Number(m.twist||0)*Math.PI/180,st=[];
 for(var i=0;i<s;i++){var a=-Math.PI/2+i*Math.PI*2/s+tw,b=a+Math.PI/s;st.push((50+Math.cos(a)*34).toFixed(1)+','+(50+Math.sin(a)*34).toFixed(1),(50+Math.cos(b)*34*inn).toFixed(1)+','+(50+Math.sin(b)*34*inn).toFixed(1))}
 var out='<polygon class="accent" points="'+st.join(' ')+'"/>';
 var nodes=Math.max(2,Math.min(9,Number(m.nodes||4)));for(var j=0;j<nodes;j++){var t=j*Math.PI*2/nodes+tw*1.6,rr=18+((j+Number(m.phase||0))%3)*7;out+='<circle class="node" cx="'+(50+Math.cos(t)*rr).toFixed(1)+'" cy="'+(50+Math.sin(t)*rr).toFixed(1)+'" r="'+(1.4+(j%3)*.6)+'"/>'}
 return out;
}
function core(id){
 var k=String(id.kind||'');
 if(k==='common-orb')return '<circle class="line" cx="50" cy="50" r="20"/><circle class="main" cx="50" cy="50" r="6"/>';
 if(k==='split-diamond')return '<polygon class="main" points="50,14 78,50 50,86 22,50"/><path class="line" d="M50 14V86"/>';
 if(k==='up-spark')return '<path class="main" d="M50 12L59 40L84 50L59 60L50 88L41 60L16 50L41 40Z"/>';
 if(k==='leaf')return '<path class="main" d="M21 68Q28 23 79 21Q74 72 30 80Z"/><path class="line" d="M29 73Q48 52 73 28M42 60L34 46M54 48L63 38"/>';
 if(k==='rare-star')return '<polygon class="main" points="'+pts(50,50,33,5,-Math.PI/2)+'"/>';
 if(k==='halo')return '<ellipse class="line" cx="50" cy="28" rx="27" ry="10"/><path class="main" d="M31 39Q50 78 69 39Q65 76 50 86Q35 76 31 39Z"/>';
 if(k==='gem')return '<polygon class="main" points="50,12 74,37 65,76 50,90 35,76 26,37"/><path class="line" d="M50 12V90M26 37H74M35 76H65"/>';
 if(k==='spiral')return '<path class="line" d="M74 50C74 27 42 20 28 40C13 62 39 84 61 72C79 62 72 39 55 37C42 36 34 48 39 58C44 67 58 65 61 55"/>';
 if(k==='flame')return '<path class="main" d="M50 12C65 34 75 44 69 63C63 82 40 88 29 70C20 54 39 36 40 18C47 24 49 32 50 40C58 31 58 22 50 12Z"/>';
 if(k==='crest')return '<path class="main" d="M21 30L37 45L50 21L63 45L79 30L73 73H27Z"/>';
 if(k==='wind')return '<path class="line" d="M16 38Q38 25 58 39Q67 46 59 51Q53 55 46 49M13 54H69Q81 54 81 63Q81 73 67 72M23 67H55"/>';
 if(k==='wave-gem')return '<polygon class="main" points="50,14 74,38 64,73 50,87 36,73 26,38"/><path class="line" d="M29 58Q42 45 54 57T72 53"/>';
 if(k==='rain-cloud')return '<path class="main" d="M27 50Q26 34 42 34Q49 20 62 31Q76 31 76 46Q85 49 81 59H23Q17 53 27 50Z"/><path class="line" d="M31 68L26 80M49 68L44 83M67 68L62 80"/>';
 if(/moon|eclipse/.test(k))return '<circle class="main" cx="47" cy="50" r="27"/><circle cx="61" cy="41" r="23" fill="#070910"/>';
 if(/wave|ocean|leviathan/.test(k))return '<path class="main" d="M10 61Q28 34 48 58T90 54Q73 82 51 66T10 61Z"/>';
 if(/pixel|glitch|zero|meta/.test(k))return '<rect class="main" x="24" y="24" width="20" height="20"/><rect class="main" x="54" y="18" width="22" height="22"/><rect class="main" x="42" y="52" width="30" height="30"/>';
 if(/crown|royal/.test(k))return '<path class="main" d="M20 67L17 34L38 49L50 23L62 49L83 34L80 67Z"/>';
 if(/eye/.test(k))return '<path class="line" d="M12 50Q50 15 88 50Q50 85 12 50Z"/><circle class="main" cx="50" cy="50" r="12"/>';
 if(/sun|solar/.test(k))return '<circle class="main" cx="50" cy="50" r="20"/>';
 if(/crystal|shard/.test(k))return '<polygon class="main" points="50,11 74,36 64,77 50,90 34,77 26,36"/>';
 if(/rune|arcane/.test(k))return '<circle class="line" cx="50" cy="50" r="29"/><polygon class="line" points="'+pts(50,50,25,6,-Math.PI/2)+'"/>';
 return '';
}
function motes(id){
 var seed=Number(id.mark&&id.mark.variant||1),out='<span class="motes">';
 for(var i=0;i<5;i++){var x=9+((seed+i*29)%82),y=10+((seed*3+i*41)%78),dx=((seed+i*7)%13)-6,dy=-4-((seed+i*11)%9);out+='<i class="mote" style="--x:'+x+'%;--y:'+y+'%;--dx:'+dx+'px;--dy:'+dy+'px;--dur:'+(2.6+(i%4)*.6)+'s;animation-delay:'+(-i*.45)+'s"></i>'}
 return out+'</span>';
}
function card(name,id){
 var p=id.palette||['#8aa4ff','#d8e2ff','#28344f'],turn=Math.max(8,24-Math.abs(Number(id.spin||.03))*70),spin=Number(id.spin||0)<0?'-360deg':'360deg';
 return '<article class="aura" data-name="'+esc(name)+'" data-font="'+esc(id.font||'')+'" style="--main:'+esc(p[0])+';--a1:'+esc(p[1])+';--a2:'+esc(p[2])+';--turn:'+turn+'s;--spin:'+spin+'">'+
 '<h3>'+esc(name)+'</h3><div class="rarity">'+fmt(id.rarity)+' · '+esc(id.tier||'')+'</div>'+
 '<div class="meta">'+esc(id.kind||'')+' · '+esc(id.particle||'')+' · '+esc(id.backdrop||'')+'<br>'+esc(id.id||'')+'</div>'+
 '<div class="symbol"><svg viewBox="0 0 100 100" aria-hidden="true"><g>'+core(id)+accent(id)+'</g></svg></div>'+motes(id)+'</article>';
}
function filtered(){return all.filter(function(x){var n=x[0],id=x[1];return(!state.q||n.toLowerCase().includes(state.q))&&(!state.tier||id.tier===state.tier)})}
function render(){
 if(io){io.disconnect();io=null}
 var list=filtered(),pageCount=Math.max(1,Math.ceil(list.length/state.size)),slice;
 state.page=Math.min(state.page,pageCount);
 if(state.stress)slice=list;else slice=list.slice((state.page-1)*state.size,state.page*state.size);
 grid.innerHTML=slice.map(function(x){return card(x[0],x[1])}).join('');
 document.getElementById('count').textContent=list.length;document.getElementById('rendered').textContent=slice.length;document.getElementById('page').textContent=state.stress?'Stress mode · all '+slice.length:'Page '+state.page+' / '+pageCount;document.getElementById('mode').textContent=state.stress?'STRESS':'SAFE';
 document.getElementById('stress').classList.toggle('active',state.stress);
 document.getElementById('prev').disabled=state.stress||state.page<=1;document.getElementById('next').disabled=state.stress||state.page>=pageCount;
 applyMotion();setTimeout(updateNodes,30);
}
function applyMotion(){
 document.querySelectorAll('.aura').forEach(function(el){el.classList.remove('animate')});
 if(state.motion==='off')return;
 if(state.motion==='all'){document.querySelectorAll('.aura').forEach(function(el){el.classList.add('animate')});return}
 io=new IntersectionObserver(function(entries){entries.forEach(function(e){e.target.classList.toggle('animate',e.isIntersecting)})},{rootMargin:'80px'});
 document.querySelectorAll('.aura').forEach(function(el){io.observe(el)});
}
function updateNodes(){document.getElementById('nodes').textContent=document.getElementsByTagName('*').length.toLocaleString()}
function audit(){
 var sig=new Set(),pal=new Set(),dupe=0;
 all.forEach(function(x){var id=x[1],m=id.mark||{},s=[id.kind,m.family,m.sides,m.inner,m.twist,m.nodes,m.cut,m.stroke,m.mirror,m.phase,m.variant].join('|');if(sig.has(s))dupe++;sig.add(s);pal.add((id.palette||[]).join('|'))});
 document.getElementById('audit').innerHTML='<pre>Rollable identities: '+all.length+'\nUnique geometry signatures: '+sig.size+'\nUnique palette signatures: '+pal.size+'\nDuplicate geometry signatures: '+dupe+'\n\nThis lab is isolated from production Equinox.</pre>';
}
function tiers(){var set=new Set(all.map(function(x){return x[1].tier||'Unknown'}));Array.from(set).sort().forEach(function(t){var o=document.createElement('option');o.value=t;o.textContent=t;document.getElementById('tier').appendChild(o)})}
document.getElementById('search').oninput=function(){state.q=this.value.trim().toLowerCase();state.page=1;render()};
document.getElementById('tier').onchange=function(){state.tier=this.value;state.page=1;render()};
document.getElementById('pageSize').onchange=function(){state.size=Number(this.value);state.page=1;state.stress=false;render()};
document.getElementById('motion').onchange=function(){state.motion=this.value;applyMotion()};
document.getElementById('stress').onclick=function(){state.stress=!state.stress;state.page=1;render()};
document.getElementById('reset').onclick=function(){state={q:'',tier:'',page:1,size:48,motion:'visible',stress:false};document.getElementById('search').value='';document.getElementById('tier').value='';document.getElementById('pageSize').value='48';document.getElementById('motion').value='visible';render()};
document.getElementById('prev').onclick=function(){state.page=Math.max(1,state.page-1);render();scrollTo(0,0)};
document.getElementById('next').onclick=function(){state.page++;render();scrollTo(0,0)};
var frames=0,last=performance.now();function fps(t){frames++;if(t-last>1000){document.getElementById('fps').textContent=Math.round(frames*1000/(t-last));frames=0;last=t}requestAnimationFrame(fps)}requestAnimationFrame(fps);
tiers();audit();render();
})();