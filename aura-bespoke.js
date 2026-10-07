/* Equinox bespoke Aura cinematic overrides v2.0.1 */
(function(){
'use strict';
var P=window.EQUINOX_AURA_PRESENTATIONS||{};
var B={
'[ LUMINOSITY ]':['#fff4b8','#fffef0','#f3c65f','light','radial pulse',['compressed sun-disc','vertical light columns','afterimage halo'],['THE LIGHT ARRIVED BEFORE THE ROLL DID. . .','DO NOT LOOK AWAY FROM THE CENTER. . .'],'gold'],
'Nyctophobia':['#120e19','#6e49b8','#d8b8ff','fear','slow drift',['closing iris','black stars','moonless horizon'],['THE DARKNESS IS NOT EMPTY. . .','SOMETHING IN IT NOTICES YOU. . .'],'void'],
'EQUILLIBRIUM':['#8ee9d0','#c6bcff','#ffe29d','balance','counter-rotation',['balance sigil','split halo','twin orbit'],['THE EQUINOX GRANTS YOU ITS PRIMARY DESCENDANT. . .','ARE YOU REALLY SERIOUS. . .'],'white'],
'▣ PIXELATION ▣':['#d7f7ff','#57d9ff','#ff53c8','pixel','fracture-and-reform',['pixel lattice','scan tears','missing frames'],['THE IMAGE IS LOSING ITS SHAPE. . .','FRAME BY FRAME, IT REMEMBERS YOU. . .'],'chromatic'],
'AMARANTHINE: END OF TIME':['#7b143d','#ff5ca8','#ffd1ec','time','counter-rotation',['broken clockwork','frozen second hand','amaranth petals'],['TIME HAS STOPPED COUNTING. . .','ONLY THE LAST SECOND REMAINS. . .'],'crimson'],
'SUPERNOVA':['#ffe6a3','#fff','#ff7b39','supernova','orbital spiral',['stellar core','orbiting fragments','expanding shock ring'],['THE STAR IS ALREADY DYING. . .','YOU JUST ARRIVED FOR THE EXPLOSION. . .'],'white'],
'EXCALIBUR':['#f6e4a2','#e7f4ff','#8ba7ff','holy-blade','rising stream',['descending sword','crest halo','blade ray'],['THE BLADE CHOSE A MOMENT. . .','AND THE MOMENT CHOSE YOU. . .'],'gold'],
'RAGNAROK':['#351018','#ff5a44','#ffd35a','fire','rising stream',['ember sky','world-tree fracture','black sun'],['THE END HAS STARTED EARLY. . .','THE SKY IS ONLY THE FIRST THING TO BURN. . .'],'red'],
'LEVIATHAN':['#062f43','#2fe8db','#8cecff','leviathan','rising stream',['leviathan spine','deep-sea rays','tidal crown'],['SOMETHING LARGE HAS PASSED BELOW. . .','THE OCEAN HAS A MEMORY OF ITS OWN. . .'],'water'],
'Void Struck':['#09070d','#7538d9','#d7d0ff','void','fracture-and-reform',['erased center','black starfield','void fracture'],['THE SCREEN HAS A HOLE IN IT. . .','AND THE HOLE IS LOOKING BACK. . .'],'void'],
'OMNISCIENT':['#f2f0dc','#7de5ff','#9b7cff','omniscience','radial pulse',['all-seeing iris','orbiting viewpoints','prediction lattice'],['YOU HAVE BEEN OBSERVED FROM EVERY ANGLE. . .','SOMEONE ALREADY KNEW THIS WOULD HAPPEN. . .'],'white'],
'The Shape of Nothing':['#05070a','#7b8794','#e7eef5','emptiness','counter-rotation',['negative-space polyhedron','missing edges','hollow star'],['THE EMPTY SPACE HAS A GEOMETRY. . .','NOW IT HAS FOUND A NAME FOR ITSELF. . .'],'void'],
'The Unanswerable Question':['#0f1220','#ffdc72','#8cc8ff','question','slow drift',['question mark orbit','locked answer box','endless cursor'],['THE QUESTION WAS NOT ASKED BY YOU. . .','IT WAS ASKED ABOUT YOU. . .'],'gold'],
'A Memory of Tomorrow':['#201834','#e9a2ff','#79cfff','memory','orbital spiral',['rewinding photographs','future echoes','memory ribbon'],['YOU REMEMBER THIS MOMENT WRONG. . .','YET IT HAS NOT HAPPENED YET. . .'],'violet'],
'The Place Between Seconds':['#090e18','#82f0d9','#a78cff','seconds','radial pulse',['split clock-face','frozen particles','seam of light'],['THERE IS A PLACE WHERE TIME MISSES A BEAT. . .','YOU ARE STANDING IN IT. . .'],'white'],
'Nothing Personal':['#101010','#ff6f6f','#e7e7e7','personal','slow drift',['isolated dot','empty room','vanishing nameplate'],['THIS WAS NEVER ABOUT YOU. . .','THAT IS WHAT MAKES IT WORSE. . .'],'crimson'],
'The Last Thought':['#191426','#ff9ed8','#9f8cff','thought','orbital spiral',['neural constellation','closing halo','single fading spark'],['HOLD ONTO THE THOUGHT. . .','IT IS THE LAST ONE YOU GET. . .'],'violet'],
"A Door That Wasn't There":['#151a2c','#dcb7ff','#74e6ff','door','rising stream',['doorway outline','hall beyond','hinge of light'],['THERE WAS NO DOOR HERE. . .','UNTIL YOU NEEDED SOMEWHERE TO GO. . .'],'chromatic'],
'Worldstorm: Eye of Creation':['#0b2540','#4cf6ff','#fff36b','storm','rising stream',['storm eye','world fragments','creation lightning'],['THE STORM REMEMBERS THE FIRST SKY. . .','SOMETHING WAS CREATED INSIDE IT. . .'],'water'],
"Empyrean: Heaven's Ceiling":['#fff1a8','#fff','#9ad5ff','heaven','radial pulse',['heavenly vault','sun columns','feather rain'],['THE CEILING OF HEAVEN IS CLOSER THAN IT LOOKS. . .','DO NOT MISTAKE HEIGHT FOR DISTANCE. . .'],'gold'],
'Oceanus: First Ocean':['#062d55','#39e6ff','#9feaff','ocean','rising stream',['primordial sea','first tide','underwater stars'],['BEFORE THE ISLANDS, THERE WAS WATER. . .','BEFORE THE WATER, THERE WAS THIS. . .'],'water'],
"Ocean's End: No Shore":['#003b55','#4ff3e7','#d6fbff','ocean-end','counter-rotation',['last shoreline','backward wave','horizon collapse'],['THERE IS A SHORE PAST THE END OF THE SEA. . .','YOU CANNOT REACH IT. . .'],'water'],
'Dream Catcher':['#241536','#ff8ed8','#78ddff','dream-catcher','slow drift',['thread lattice','sleeping stars','dream snare'],['SOMETHING IS CATCHING THE DREAMS. . .','MAKE SURE YOURS IS NOT THE LAST ONE. . .'],'violet'],
'Astraios':['#17153b','#f0cf73','#8c7cff','astraios','fracture-and-reform',['constellation body','astral crown','star map'],['THE CONSTELLATIONS HAVE SHIFTED INTO FORM. . .','THE SKY REMEMBERS ITS ARCHITECT. . .'],'gold'],
'Monarch':['#17321d','#d8ef6d','#ffb1a7','monarch','falling cascade',['leaf crown','wing lattice','pollen throne'],['THE KINGDOM GREW A WING. . .','NOW IT HAS SOMETHING TO PROTECT. . .'],'green'],
'Equinox':['#f4efe1','#b5b8ff','#8fd7c4','equilibrium','counter-rotation',['four-point star','eight-point star','balance rings','Isles fragments','Equinox sigil','dimensional seams'],['THE EQUINOX HAS FOUND YOU. . .','THE BALANCE HOLDS. . .'],'white']
};
Object.keys(B).forEach(function(n){var d=P[n],b=B[n];if(!d)return;d.mainColor=b[0];d.accentColors=[b[1],b[2]];d.sceneKind=b[3];d.motionProfile=b[4];d.visualMotifs=b[5];d.cutsceneText=b[6];d.revealStyle=b[7];d.bespoke=true;if(n==='Equinox'){d.cutsceneType='Equinox';d.cutsceneDuration=300;d.cutsceneOverride='EQUINOX_FIVE_MINUTE';}else if(d.tier==='Special Acquisition'){d.cutsceneType='None';d.cutsceneDuration=0;d.cinematicEligible=false;}});
window.EQUINOX_BESPOKE_PRESENTATION_VERSION='2.0.1';
})();