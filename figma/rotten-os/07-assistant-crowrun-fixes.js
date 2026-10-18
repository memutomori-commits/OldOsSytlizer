const p4=await figma.getNodeByIdAsync('890:7684');await figma.setCurrentPageAsync(p4);
const crowC=await figma.getNodeByIdAsync('117:27');const mascotC=await figma.getNodeByIdAsync('847:7026');
const SEC=(name,x,y,w,h)=>{const s=figma.createSection();s.name=name;p4.appendChild(s);s.x=x;s.y=y;s.resizeWithoutConstraints(w,h);s.fills=[S({r:.18,g:.18,b:.18})];return s;};
const out={as:[],cr:[],fix:[]};
// 13 Assistant
{const sec=SEC('13 · Assistant — помощник',0,31433,6400,1300);
 const V7=[['Транзакция','Welcome back, anon!','Clubs Scan 2.6 (12 chains)\nClubs Zone\n~/cases/address-poisoning','> trace 499,000 USDT from TR8hs…TvqQ and flag the bait address','Following the money...','[+] 2 hops / bait: 1.001 USDT / 1 exchange'],
 ['Кошелёк','Welcome back, anon!','Clubs Scan 2.6 (12 chains)\nClubs Zone\n~/wallets/0x0f19…83EE','> scan 0x0f19…83EE: balance, last 10 tx, mixer hits','Clustering wallets...','[+] 41.08 POL / 10 tx / 0 mixer hits'],
 ['Эксплойт','Session restored. Funds not.','Clubs Scan 2.6 (12 chains)\nClubs Zone\n~/cases/tectonic-exploit','> summarize the Tectonic exploit: how much, how, where it went','Counting zeros...','[+] $75M / 1 exploit / funds on the move'],
 ['Досье','Case reopened, V.','Clubs OS v0.1 (case files)\nClearance: Level 3\n~/dossiers/blackhat','> open dossier BLACKHAT: charges, amount, status','Extraditing...','[+] in custody / $340,000,000 / ~48,000 victims'],
 ['Карусель','Welcome back, investigator.','Clubs OS v0.1 (case files)\nClubs Zone\n~/cases/katerini-raid','> list everything seized in the Katerini raid','Subpoenaing...','[+] laptops / phones / cash / 1 pistol'],
 ['Twitter','Welcome back, anon!','Clubs OS v0.1 (feed: X)\nClubs Zone\n~/leaks/zerobytes','> translate @ZeroBytes thread and check it against on-chain data','Decoding the mempool...','[+] 2 posts / translated from French'],
 ['Видео','Welcome back, anon!','Clubs OS v0.1 (case files)\nClubs Zone\n~/cases/arrest-footage','> timestamp the arrest video','Rolling tape...','[+] 6 scenes / 1 arrest']];
 V7.forEach(([nm,hello,info,prompt,status,result],i)=>{
  const lbl=T(nm,'mono',28,C.w);sec.appendChild(lbl);lbl.x=120+i*880;lbl.y=60;
  const root=FR(760,980,C.k,{name:'Assistant · '+nm+' (rotten)'});sec.appendChild(root);root.x=120+i*880;root.y=120;
  const w=W({w:700,h:900,title:'CLUBS CODE - C:\\CASES',theme:'black',help:true,name:'Window / Clubs Code'});root.appendChild(w.win);w.win.x=30;w.win.y=30;w.bar.fills=[S(C.b)];const b=w.body;
  const pn=FR(660,430,C.k,{name:'Panel',stroke:C.b,sw:4});b.appendChild(pn);pn.x=20;pn.y=16;
  const h=T(hello,'body',36,C.w,{al:'CENTER',w:620});pn.appendChild(h);h.x=20;h.y=18;
  const m=mascotC.createInstance();m.resize(230,230);pn.appendChild(m);m.x=215;m.y=68;
  for(const n of m.findAll(q=>'fills' in q&&Array.isArray(q.fills)&&q.fills.length&&q.fills[0].type==='SOLID')){const c=q=>Math.round(q*255);const col=n.fills[0].color;const r=c(col.r),g=c(col.g),bl=c(col.b);let nc=C.w;if(r<40&&g<40&&bl<40)nc=C.k;else if(r>200&&g>200&&bl>200)nc=C.w;else if(r>200&&g<120)nc=C.b;else if(g>200&&bl<100)nc=C.w;else nc=C.b;n.fills=[S(nc)];}
  const inf=T(info,'body',26,C.w,{al:'CENTER',w:620,lh:130});pn.appendChild(inf);inf.x=20;inf.y=316;
  const pr=AL('HORIZONTAL',{name:'Prompt',stroke:C.w,sw:3,pad:[12,16,12,16]});pr.appendChild(T(prompt,'body',26,C.w,{w:628,lh:125}));b.appendChild(pr);pr.x=20;pr.y=466;pr.resize(660,pr.height);pr.counterAxisSizingMode='AUTO';
  const st=AL('HORIZONTAL',{name:'Status',gap:12});st.appendChild(R(14,14,C.b));st.appendChild(T(status,'body',26,C.b));b.appendChild(st);st.x=20;st.y=466+pr.height+24;
  const rs=T(result,'body',26,C.w,{w:660});b.appendChild(rs);rs.x=20;rs.y=st.y+44;
  const ft=T('^ for evidence     esc to flee     paranoid mode on','body',22,C.w);b.appendChild(ft);ft.x=20;ft.y=836-40;
  const er=D({title:'ERROR',msg:'NO SMILE',icon:'x',buttons:['RETRY'],theme:'blue',w:360});root.appendChild(er);er.x=400;er.y=760;
  out.as.push(root.id);});}
// 14 Crow Run
{const sec=SEC('14 · Crow Run — мини-игра',0,34439,2279,1526);
 const scene=(root,W0,ground,hudY)=>{
  const hud1=T('CROW RUN','px',18,C.w);root.appendChild(hud1);hud1.x=24;hud1.y=hudY;
  const hud2=T('NEWS 07   HI 00499   00075','px',16,C.w);root.appendChild(hud2);hud2.x=W0-24-hud2.width;hud2.y=hudY;
  const gl=R(W0-40,4,C.w,{name:'Ground'});root.appendChild(gl);gl.x=20;gl.y=ground;
  [[120,ground-260],[380,ground-320],[W0-300,ground-290]].forEach(([x,y],k)=>{const c=AL('HORIZONTAL',{name:'Cloud'});c.appendChild(R(16,8,C.w));c.appendChild(R(40,16,C.w));c.appendChild(R(16,8,C.w));root.appendChild(c);c.x=x;c.y=y;});
  [0.25,0.5,1].forEach((op,k)=>{const cr=crowC.createInstance();cr.resize(110,110);root.appendChild(cr);cr.x=140+k*70;cr.y=ground-150-k*30;cr.opacity=op;});
  const obs=(x,kind)=>{const f=FR(90,90,C.k,{name:'Obstacle / '+kind,stroke:C.w,sw:4,clip:false});root.appendChild(f);f.x=x;f.y=ground-90;
   if(kind==='JAIL'){for(let j=0;j<4;j++){const bar=R(8,70,C.w);f.appendChild(bar);bar.x=14+j*20;bar.y=10;}}
   else if(kind==='DOXX'){const e=E(70,40,null,{stroke:C.w,sw:5});f.appendChild(e);e.x=10;e.y=25;const p=E(22,22,C.b);f.appendChild(p);p.x=34;p.y=34;}
   else{const r=R(60,36,C.w);f.appendChild(r);r.x=15;r.y=44;for(let j=0;j<3;j++){const fl=figma.createPolygon();fl.pointCount=3;fl.resize(18,30);fl.fills=[S(C.b)];f.appendChild(fl);fl.x=18+j*20;fl.y=10;}}
   const l=T(kind,'px',11,C.b);root.appendChild(l);l.x=x+45-l.width/2;l.y=ground+10;};
  obs(W0*0.42,'RUG PULL');obs(W0*0.62,'JAIL');obs(W0*0.8,'DOXX');obs(W0*0.92,'JAIL');
  [[W0*0.35,ground-300],[W0*0.55,ground-220],[W0*0.75,ground-330]].forEach(([x,y])=>{const d=FR(40,48,C.w,{name:'News'});root.appendChild(d);d.x=x;d.y=y;[0,1,2].forEach(j=>{const ln=R(24,4,C.k);d.appendChild(ln);ln.x=8;ln.y=10+j*12;});});
  const pl=T('+1 NEWS','px',12,C.b);root.appendChild(pl);pl.x=W0*0.35+50;pl.y=ground-300;
  const dots=T('. . . . . . .','body',26,C.b);root.appendChild(dots);dots.x=W0*0.3;dots.y=ground-200;};
 const sq=FR(760,760,C.k,{name:'Crow Run — Квадрат (rotten)',stroke:C.w,sw:4});sec.appendChild(sq);sq.x=120;sq.y=120;scene(sq,760,560,22);
 const pr=AL('HORIZONTAL',{name:'Prompt',stroke:C.w,sw:3,pad:[8,14,8,14]});pr.appendChild(T('> crow run --dodge jail,doxx,rugpull --collect news','body',24,C.w));sq.appendChild(pr);pr.x=24;pr.y=600;
 const s1=AL('HORIZONTAL',{name:'Status',gap:10});s1.appendChild(R(12,12,C.b));s1.appendChild(T('Dodging the feds...','body',24,C.b));sq.appendChild(s1);s1.x=24;s1.y=660;
 const s2=T('[+] 7 news collected / 0 arrests / 0 doxxed','body',22,C.w);sq.appendChild(s2);s2.x=24;s2.y=700;
 out.cr.push(sq.id);
 const st=FR(2039,210,C.k,{name:'Crow Run — Полоса (rotten)',stroke:C.w,sw:4});sec.appendChild(st);st.x=120;st.y=1000;scene(st,2039,165,16);out.cr.push(st.id);
 const crawl=T('> crow run --dodge jail,doxx,rugpull --collect news','body',22,C.w);st.appendChild(crawl);crawl.x=24;crawl.y=130;
 sec.resizeWithoutConstraints(2279,1330);}
// Fixes: TD error dialogs, cover layout
for(const id of ['893:200','893:514','893:828','893:1142','893:1456']){const f=await figma.getNodeByIdAsync(id);if(!f)continue;const er=f.children.find(c=>c.name==='Dialog / ERROR'&&c.y>1000);if(er){er.x=1400;er.y=780;out.fix.push(id);}}
{const cov=await figma.getNodeByIdAsync('894:669');if(cov){const win=cov.children.find(c=>c.name==='Window / Tectonic');if(win){win.resize(2000,1720);const scr=win.findOne(c=>c.name==='Screen');if(scr){const sk=scr.findOne(c=>c.type==='INSTANCE');if(sk){sk.x=1440;sk.y=590;}const dz=scr.findOne(c=>c.name==='Dither (hatch)');if(dz)scr.appendChild(dz);}}
 const ld=D({title:'DOWNLOADING...',msg:'EVIDENCE.ZIP  "C:/" TO "DOCUMENTS"',icon:'none',extra:PROG(22,9,22,'blue','3 HOURS REMAINING'),buttons:['CANCEL'],btnAlign:'MAX',theme:'blue',w:720});cov.appendChild(ld);ld.x=1300;ld.y=1760;const tk=cov.children.find(c=>c.name==='Taskbar');if(tk)cov.appendChild(tk);out.fix.push('cover');}}
for(const id of ['896:805','896:957','896:1113']){const f=await figma.getNodeByIdAsync(id);if(!f)continue;const win=f.children.find(c=>c.name==='Window / Twitter');if(!win)continue;const body=win.children.find(c=>c.name==='Content');const act=body.children.find(c=>c.name==='Actions');let mb=0;for(const c of body.children)if(c!==act)mb=Math.max(mb,c.y+c.height);act.y=mb+40;const nh=64+38+act.y+act.height+28+52;win.resize(1380,nh);out.fix.push('tw '+Math.round(nh));}
return out;
