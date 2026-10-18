const main3=await figma.getNodeByIdAsync('686:19705');await figma.setCurrentPageAsync(main3);
const log=[];
let p4=figma.root.children.find(p=>p.name==='CLUBS /  MAIN 4');
if(!p4){p4=figma.createPage();p4.name='CLUBS /  MAIN 4';figma.root.insertChild(figma.root.children.indexOf(main3)+1,p4);}
IDS.page=p4.id;
const mkComp=(node,name)=>{const c=figma.createComponentFromNode(node);if(name)c.name=name;return c;};
const sec=figma.createSection();sec.name='00 · KIT — Rotten OS';p4.appendChild(sec);sec.x=6600;sec.y=0;sec.resizeWithoutConstraints(3600,2000);sec.fills=[S({r:.1,g:.1,b:.1})];
let cx=80,cy=80,rowH=0;const place=(n,name,w)=>{if(cx+n.width>3500){cx=80;cy+=rowH+80;rowH=0;}sec.appendChild(n);n.x=cx;n.y=cy;cx+=n.width+80;rowH=Math.max(rowH,n.height);const c=name?mkComp(n,name):n;IDS[name||n.name]=c.id;return c;};
const nl=()=>{cx=80;cy+=rowH+80;rowH=0;};
let skullC=null;try{const skull=(await figma.getNodeByIdAsync('822:6418')).clone();recolor(skull,(L)=>L<0.2?C.k:(L>0.75?C.w:C.b));skull.resize(240,327);skullC=place(skull,'Asset / Skull (1-bit)');}catch(e){log.push('skull: '+e.message);}
try{const mac=(await figma.getNodeByIdAsync('788:6209')).clone();recolor(mac,(L)=>L<0.3?C.k:(L>0.7?C.w:C.b));place(mac,'Asset / Mac 5000 (1-bit)');}catch(e){log.push('mac: '+e.message);}
try{const det=(await figma.getNodeByIdAsync('832:6418')).clone();recolor(det,(L)=>L>0.5?C.b:C.w);det.resize(600,450);place(det,'Asset / Detective at PC (1-bit)');}catch(e){log.push('det: '+e.message);}
const dt=FR(8,8,null,{name:'Dither tile'});dt.appendChild(R(4,4,C.k));const r2=R(4,4,C.k);dt.appendChild(r2);r2.x=4;r2.y=4;place(dt,'Asset / Dither tile');IDS.dither=IDS['Asset / Dither tile'];
let crowC=null;try{crowC=await figma.getNodeByIdAsync('117:27');const cr=crowC.createInstance();cr.resize(120,120);place(cr,null);}catch(e){log.push('crow: '+e.message);}
nl();
for(const th of ['blue','white','black','mixed','inv']){const w=W({w:560,h:360,title:'WINDOW / '+th.toUpperCase(),theme:th,help:true,status:['STATUS','CLUBS']});place(w.win,'Window / '+th);}
nl();
place(D({title:'ERROR',msg:'NO SMILE',icon:'x',buttons:['RETRY','CANCEL'],theme:'blue',w:480}),'Dialog / Error (blue)');
place(D({title:'ERROR',msg:'CLICK "FIX" TO FIX ERROR',icon:'x',buttons:['FIX'],theme:'white',w:480}),'Dialog / Error (white)');
place(D({title:'ERROR',msg:'FUCK YOU!',icon:'none',buttons:['OK'],theme:'black',w:420}),'Dialog / Error (black)');
place(D({title:'WARNING',msg:'ACCESS TO C:/ WAS DENIED',icon:'warn',buttons:['OK'],theme:'white',w:480}),'Dialog / Warning');
place(D({title:'COPYING...',msg:'FILE.EXE  "C:/" TO "DOCUMENTS"',icon:'none',extra:PROG(22,13,22,'blue','3 HOURS REMAINING'),buttons:['CANCEL'],btnAlign:'MAX',theme:'blue',w:720}),'Dialog / Loading');
nl();
const lg=AL('VERTICAL',{name:'Login',gap:14,cross:'MIN'});const l1=AL('HORIZONTAL',{gap:20});l1.appendChild(T('USER','px',16,C.k));l1.appendChild(R(360,40,null,{stroke:C.k,sw:3}));lg.appendChild(l1);const l2=AL('HORIZONTAL',{gap:20});l2.appendChild(T('PASSWORD','px',16,C.k));l2.appendChild(R(300,40,null,{stroke:C.k,sw:3}));lg.appendChild(l2);
place(D({title:'LOGIN',msg:'TYPE YOUR NAME AND PASSWORD',icon:'none',extra:lg,buttons:['OK','CANCEL'],btnAlign:'MAX',theme:'white',w:640}),'Dialog / Login');
place(TOOLBOX(),'Toolbox');
const ic=AL('HORIZONTAL',{name:'Icons',gap:40,cross:'MIN'});for(const [l,k] of [['wallet.dat','floppy'],['rug pulls','trash'],['wallet_check.exe','exe'],['decrypt.bat','bat'],['Leaks','folder'],['clusbs.exe','exe'],['KYC_scan.jpg','jpg'],['virus.dat','skull'],['key.dat','key'],['readme.txt','doc']])ic.appendChild(DICON(l,k,skullC));place(ic,null);
nl();
const ctl=AL('HORIZONTAL',{name:'Controls',gap:40});ctl.appendChild(BTN('RETRY','white'));ctl.appendChild(BTN('CANCEL','blue'));ctl.appendChild(BTN('OK','black'));ctl.appendChild(TAG('FUNDED BY RAILGUN','white'));ctl.appendChild(TAG('18 TXNS','blue'));ctl.appendChild(CB('CONFIRMED',true,'white'));ctl.appendChild(CB('PENDING',false,'white'));ctl.appendChild(FIELD('ADDRESS','0x0dC2c5D64f1e9b7c2a8d3e6f5b0a1c9a5dfe9b66',760,'white'));ctl.appendChild(PROG(16,9,24,'white','LOADING...'));
sec.appendChild(ctl);ctl.x=80;ctl.y=cy;ctl.fills=[S(C.w)];ctl.paddingTop=ctl.paddingBottom=20;ctl.paddingLeft=ctl.paddingRight=20;
for(const ch of [...ctl.children]){const nm=ch.name;const c=mkComp(ch);IDS[nm]=c.id;}
cy+=ctl.height+80;rowH=0;cx=80;
place(TASKBAR(1800,'Clubs Scan',crowC),'Taskbar');
nl();
const ph=PHOTO(600,400,'15dee76b5fe969de7118023110ae8d92e74b1203',{name:'Photo sample — duotone + dither'});place(ph,null);
sec.resizeWithoutConstraints(3600,cy+rowH+120);
// README
const rd=figma.createSection();rd.name='00 · README';p4.appendChild(rd);rd.x=0;rd.y=0;rd.resizeWithoutConstraints(6300,1250);rd.fills=[S({r:.18,g:.18,b:.18})];
const txt=['CLUBS SCAN — MAIN 4  ·  стиль «ROTTEN OS» (1-bit error windows, по референсу)','',
'Перенос MAIN 3 в стиль референса: три цвета, пиксельные шрифты, стопки окон-ошибок, дизеринг. Секции повторяют MAIN 3: 01–05 сети, 06 One Image, 07 Cover, 08 Carousel, 09 Video, 10 Dossier, 11 Twitter, 13 Assistant, 14 Crow Run.',
'12 Transactions Finding (черновики на MAIN 3) не переносились — их итог и есть экраны 01–05.','',
'Палитра       чёрный #000000  ·  белый #FFFFFF  ·  синий #0112FD. Серых нет: полутон = паттерн «Dither tile» (8×8, два чёрных квадрата) поверх слоя.',
'Фото          ч/б (saturation −100, contrast +45) + прямоугольник синий blend LIGHTEN (дуотон белый/синий) + Dither 35 %. Слой «Photo — REPLACE HERE»: менять только image fill.',
'Шрифты        Press Start 2P — заголовки окон, кнопки, теги, лейблы (не меньше 14 px на холсте 2079).  VT323 — текст, таблицы, меню, статус-бары (не меньше 24 px).',
'              Doto Black — суммы.  IBM Plex Mono — README.  PP Mondwest / PP NeueBit с MAIN 3 здесь не используются: их нет в сборке Figma MCP.',
'Окна          Window / blue (синее, белая рамка) · white (белое, чёрная рамка) · black (чёрное, белая рамка) · mixed (белое тело, синий тайтл) · inv (белое тело, чёрный тайтл).',
'              Рамка 4 px INSIDE, углы 0, жёсткая тень 10 px без блюра (белая на чёрном столе, чёрная на белом). Тайтл-бар 64 px, Press Start 2P 20, боксы ? и X — 44 px. Меню 30 px VT323.',
'Ошибки        Dialog / Error (RETRY · CANCEL), Dialog / Warning, Dialog / Loading (прогресс из квадратов), Dialog / Login. Кладутся стопками со сдвигом 24–30 px поверх и позади окон.',
'Рабочий стол  чёрный; иконки слева колонкой (плитка 96 px, белая рамка 4 px, глиф из прямоугольников); Taskbar 72 px снизу: CLUBS · € # @ · задача · 12:00.',
'Сети          одна палитра на все сети; сеть читается по тикеру, адресу и подписи в тайтле: (EVM) (SOL) (POLYGON) (BTC) (TRON).',
'Иллюстрации   Asset / Skull (1-bit) — окно «VIRUS DETECTED»; Asset / Mac 5000 (1-bit) — отправитель/получатель; Asset / Detective at PC (1-bit) — фон; Mascot (CGA) с MAIN 3 перекрашен в синий/белый.',
'Кит           секция 00 · KIT: все элементы выше — локальные компоненты. Экраны собраны хелперами того же кода, инстансы — Taskbar, Button, Tag, Checkbox, Dialog, Skull.'].join('\n');
const rt=T(txt,'mono',28,C.w,{name:'README',w:6000,lh:150});rd.appendChild(rt);rt.x=120;rt.y=100;
return {IDS,log,sec:sec.id,readme:rd.id};
