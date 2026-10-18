const p4=await figma.getNodeByIdAsync('890:7684');await figma.setCurrentPageAsync(p4);
const skullC=await figma.getNodeByIdAsync('890:7694');const crowC=await figma.getNodeByIdAsync('117:27');
const SEC=(name,x,y,w,h)=>{const s=figma.createSection();s.name=name;p4.appendChild(s);s.x=x;s.y=y;s.resizeWithoutConstraints(w,h);s.fills=[S({r:.18,g:.18,b:.18})];return s;};
const NOTE=(w,h,text)=>{const n=W({w,h,title:'UNTITLED - NOTEPAD',theme:'white',menu:['File','Edit','Search','Help'],name:'Window / Notepad',shd:8});const t=T(text,'body',28,C.k,{w:w-40,lh:120});n.body.appendChild(t);t.x=16;t.y=12;return n.win;};
const out={};
// 06 One Image Post
{const sec=SEC('06 · One Image Post',0,13500,1694,1814);
 const root=FR(1454,1454,C.k,{name:'One Image Post / Paint — arrest (rotten, 1454×1454)'});sec.appendChild(root);root.x=120;root.y=120;
 CASCADE(root,2,980,-10,30,30,i=>D({title:'ERROR',msg:'NO SMILE',icon:'x',buttons:['RETRY','CANCEL'],theme:i?'white':'blue',w:420}));
 const w=W({w:1380,h:1290,title:'NEWS_0913.BMP - CLUBS',theme:'inv',menu:['File','Edit','View','Image','Options','Help'],status:['Another crypto founder has been arrested  ·  clubs://news/arrest-0913  ·  tips@clubs.news','1454, 1454','CLUBS ZONE'],name:'Window / Paint'});
 root.appendChild(w.win);w.win.x=37;w.win.y=40;const b=w.body;
 const tb=TOOLBOX();b.appendChild(tb);tb.x=12;tb.y=12;
 const pal=AL('HORIZONTAL',{name:'Palette',gap:0});pal.appendChild(R(40,40,C.k,{stroke:C.k,sw:3}));pal.appendChild(R(40,40,C.b,{stroke:C.k,sw:3}));pal.appendChild(R(40,40,C.w,{stroke:C.k,sw:3}));b.appendChild(pal);pal.x=12;pal.y=500;
 const ph=PHOTO(1200,1000,'15dee76b5fe969de7118023110ae8d92e74b1203',{name:'Canvas — REPLACE IMAGE HERE (fill)'});b.appendChild(ph);ph.x=150;ph.y=12;
 const sel=FR(340,340,null,{name:'Selection',clip:false});sel.appendChild(R(340,340,null,{stroke:C.w,sw:3,dash:[10,8],name:'Marquee'}));[[0,0],[328,0],[0,328],[328,328]].forEach(([x,y])=>{const h=R(12,12,C.w,{stroke:C.k,sw:2,name:'Handle'});sel.appendChild(h);h.x=x;h.y=y;});b.appendChild(sel);sel.x=560;sel.y=120;
 const sb=FR(16,1000,C.w,{name:'Scrollbar',stroke:C.k,sw:2});b.appendChild(sb);sb.x=1350;sb.y=12;const th=R(12,120,C.k);sb.appendChild(th);th.x=2;th.y=20;
 const ld=D({title:'PROCESSING...',msg:'PARSING DATABASE.DB',icon:'none',extra:PROG(18,7,22,'blue','3 HOURS REMAINING'),buttons:['CANCEL'],btnAlign:'MAX',theme:'blue',w:560});root.appendChild(ld);ld.x=850;ld.y=1090;
 const nt=NOTE(520,250,'destiny can be changed only in the present\n\n-CLUBS');root.appendChild(nt);nt.x=50;nt.y=1110;
 const tk=TASKBAR(1454,'news_0913.bmp - Paint',crowC);root.appendChild(tk);tk.x=0;tk.y=1382;out.one=root.id;}
// 07 Carousel Cover
{const sec=SEC('07 · Carousel Cover',0,15634,2415,2415);
 const root=FR(2175,2175,C.k,{name:'Carousel Cover / Rotten Alert — Tectonic (2175×2175)'});sec.appendChild(root);root.x=120;root.y=120;
 CASCADE(root,3,1400,10,34,34,i=>D({title:'ERROR',msg:'FUNDS NOT FOUND',icon:'x',buttons:['RETRY','CANCEL'],theme:i%2?'white':'blue',w:520}));
 const w=W({w:2000,h:1880,title:'TECTONIC.EXE',theme:'blue',help:true,barH:80,titleSize:28,name:'Window / Tectonic'});root.appendChild(w.win);w.win.x=87;w.win.y=130;const b=w.body;
 const scr=FR(1920,1180,C.k,{name:'Screen',stroke:C.w,sw:4});b.appendChild(scr);scr.x=40;scr.y=40;
 const t=T('TECTONIC\nEXPLOIT\n$75M','px',200,C.w,{name:'Headline',lh:120});scr.appendChild(t);t.x=70;t.y=90;
 const sk=skullC.createInstance();sk.resize(420,573);scr.appendChild(sk);sk.x=1420;sk.y=300;
 const dz=DITHER(1920,1180,0.18);scr.appendChild(dz);dz.x=0;dz.y=0;
 const l1=T('TECTONIC:','px',44,C.w);b.appendChild(l1);l1.x=40;l1.y=1270;
 const l2=T('cover / carousel, 4 photos  ·  clubs','body',60,C.w);b.appendChild(l2);l2.x=40;l2.y=1340;
 const br=AL('HORIZONTAL',{name:'Nav',gap:40});['<< PREV','01 / 04','NEXT >>'].forEach(l=>br.appendChild(BTN(l,'blue',{sz:36,w:600})));b.appendChild(br);br.x=40;br.y=1470;
 const tk=TASKBAR(2175,'Tectonic.exe',crowC);root.appendChild(tk);tk.x=0;tk.y=2103;out.cover=root.id;}
// 09 Video Post
{const sec=SEC('09 · Video Post — заглушка под видео',0,22030,2103,1530);
 const root=FR(1863,1290,C.k,{name:'Video Post / Rotten Media Player (1863×1290)'});sec.appendChild(root);root.x=120;root.y=120;
 const w=W({w:1800,h:1150,title:'CLUBS.WMV - MEDIA PLAYER',theme:'black',menu:['File','View','Play','Tools','Help'],status:['Playing  ·  clubs.wmv  ·  00:42 / 03:17','1280×720','CLUBS'],name:'Window / Media Player'});root.appendChild(w.win);w.win.x=31;w.win.y=30;const b=w.body;
 const ph=PHOTO(1760,820,'77113bb73a981ee2321ce1b39235f96717cd838d',{name:'Video frame — REPLACE HERE (fill)'});b.appendChild(ph);ph.x=20;ph.y=16;
 const ctr=AL('HORIZONTAL',{name:'Controls',gap:12});['<<','PLAY','PAUSE','STOP','>>'].forEach(l=>ctr.appendChild(BTN(l,'black')));b.appendChild(ctr);ctr.x=20;ctr.y=858;
 const pg=PROG(34,9,18,'black',null);b.appendChild(pg);pg.x=640;pg.y=870;
 const vol=AL('HORIZONTAL',{name:'Volume',gap:10});vol.appendChild(T('VOL','px',14,C.w));vol.appendChild(PROG(8,6,14,'black',null));b.appendChild(vol);vol.x=1520;vol.y=872;
 const bf=D({title:'BUFFERING...',msg:'CLUBS.WMV  STREAM 2/3',icon:'none',extra:PROG(20,5,22,'blue','ESTIMATED: FOREVER'),buttons:['CANCEL'],btnAlign:'MAX',theme:'blue',w:620});root.appendChild(bf);bf.x=1160;bf.y=640;
 const er=D({title:'ERROR',msg:'CODEC NOT FOUND',icon:'x',buttons:['RETRY','CANCEL'],theme:'white',w:440});root.appendChild(er);er.x=80;er.y=820;
 const tk=TASKBAR(1863,'clubs.wmv - Media Player',crowC);root.appendChild(tk);tk.x=0;tk.y=1218;out.video=root.id;}
return out;
