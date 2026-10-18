const p4=await figma.getNodeByIdAsync('890:7684');await figma.setCurrentPageAsync(p4);
const skullC=await figma.getNodeByIdAsync('890:7694');const crowC=await figma.getNodeByIdAsync('117:27');const detC=await figma.getNodeByIdAsync('890:7710');
const SEC=(name,x,y,w,h)=>{const s=figma.createSection();s.name=name;p4.appendChild(s);s.x=x;s.y=y;s.resizeWithoutConstraints(w,h);s.fills=[S({r:.18,g:.18,b:.18})];return s;};
const out={};
// 10 Dossier
{const sec=SEC('10 · Dossier',0,23880,2319,2526);
 const root=FR(2079,2286,C.k,{name:'Dossier / Katerini Crypto (2026-10) — Arrest Dossier (rotten)'});sec.appendChild(root);root.x=120;root.y=120;
 CASCADE(root,2,1420,20,30,30,i=>D({title:'ERROR',msg:'PROFIT NOT FOUND',icon:'x',buttons:['RETRY','CANCEL'],theme:i?'white':'blue',w:480}));
 const w=W({w:1900,h:2060,title:'ARREST DOSSIER',theme:'inv',help:true,status:['by tips@clubs.news','CLUBS OS  v0.1   [x] pixel  [x] os  [ ] gradients'],name:'Window / Dossier'});root.appendChild(w.win);w.win.x=90;w.win.y=90;const b=w.body;
 const ar=AL('HORIZONTAL',{name:'Address bar',gap:12});['<-','->','RELOAD'].forEach(l=>ar.appendChild(BTN(l,'white',{sz:14})));ar.appendChild(FIELD('','clubs://dossier/gr-katerini-crypto-17_',1160,'white',{sz:30}));ar.appendChild(BTN('FIND','white',{sz:14}));ar.appendChild(BTN('COPY','white',{sz:14}));b.appendChild(ar);ar.x=24;ar.y=14;
 const hero=PHOTO(1852,520,'eeb09191249fd3a9866d20c2b5d1773b06924e59',{name:'Hero — REPLACE HERE (fill)'});b.appendChild(hero);hero.x=24;hero.y=88;hero.strokes=[S(C.k)];hero.strokeWeight=4;hero.strokeAlign='INSIDE';
 const nm=T('MARCUS REYES, 34','px',60,C.k);b.appendChild(nm);nm.x=40;nm.y=650;
 const a1=T('Alias BLACKHAT  ·  Founder & CEO, NovaFi Exchange','body',40,C.k);b.appendChild(a1);a1.x=40;a1.y=740;
 const a2=T('Case 1:26-cr-00913  ·  U.S. District Court, S.D.N.Y.','body',40,C.k);b.appendChild(a2);a2.x=40;a2.y=790;
 const fc=T('Federal charges filed 2026-09-13','px',14,C.k);b.appendChild(fc);fc.x=40;fc.y=850;
 [['CHARGES','Wire fraud  ·  Money laundering  ·  Securities fraud'],['AMOUNT','$340,000,000  ·  ~48,000 victims'],['ARRESTED','2026-09-12  ·  Lisbon, Portugal'],['STATUS','In custody  ·  Extradition pending'],['MAX SENTENCE','20 years']].forEach(([l,v],i)=>{const row=AL('HORIZONTAL',{name:'Row / '+l,gap:20});row.appendChild(T(l,'px',16,C.k,{w:260}));row.appendChild(FIELD('',v,960,'white',{sz:32}));b.appendChild(row);row.x=40;row.y=890+i*78;});
 const mg=PHOTO(500,640,'58911643ac09be58a5de4a94a4af220331d2ead4',{name:'Mugshot — REPLACE HERE (fill)'});b.appendChild(mg);mg.x=1376;mg.y=650;mg.strokes=[S(C.k)];mg.strokeWeight=4;mg.strokeAlign='INSIDE';
 const mt=TAG('MUGSHOT','white');b.appendChild(mt);mt.x=1376;mt.y=650;
 const cbs=AL('HORIZONTAL',{name:'Checks',gap:40});[['ARRESTED',1],['CHARGED',1],['REMANDED',1],['CONVICTED',0]].forEach(([l,o])=>cbs.appendChild(CB(l,!!o,'white',{sz:16})));b.appendChild(cbs);cbs.x=40;cbs.y=1310;
 const tw=W({w:1000,h:470,title:'C:\\CASES\\BLACKHAT.LOG',theme:'black',name:'Window / Terminal',shd:6});b.appendChild(tw.win);tw.win.x=40;tw.win.y=1380;
 const tt=T('> ERROR 404: profit not found_\n> 2X RETURNS PROMISED IN 50 DAYS.\n> BONUSES PAID FOR NEW RECRUITS.\n> WITHDRAWALS BLOCKED IN RECENT WEEKS.\n> LEADERS DENY ALL, SAY THEY LOST TOO.','body',30,C.w,{name:'Log',lh:140});tw.body.appendChild(tt);tt.x=20;tt.y=16;
 const dv=detC.createInstance();dv.resize(300,225);tw.body.appendChild(dv);dv.x=680;dv.y=160;
 const ds=T('This dossier may be shared freely and may be quoted without fee by any individual for non-commercial use and by any Telegram channel. Sources: DOJ press release 26-913, SEC complaint 3:26-cv-04471. POC: <tips@clubs.news>\n\nVictims’ claims must be coordinated with the court-appointed receiver: NovaFi Recovery Trust, 1 Broadway, New York, NY, 10004, (212)-555-0134. E-mail <claims@novafi-trust.com>.','body',30,C.k,{name:'Disclaimer',w:780,lh:130});b.appendChild(ds);ds.x=1096;ds.y=1385;
 const br=AL('HORIZONTAL',{name:'Actions',gap:24});br.appendChild(BTN('BLOCK','white',{sz:20,w:378}));br.appendChild(BTN('+ ADD','black',{sz:20,w:378}));b.appendChild(br);br.x=1096;br.y=1780;
 const er=D({title:'ERROR',msg:'CASE FILE CORRUPTED. EXTRADITION PENDING.',icon:'x',buttons:['RETRY','CANCEL'],theme:'blue',w:560});root.appendChild(er);er.x=640;er.y=1960;
 const tk=TASKBAR(2079,'Arrest Dossier',crowC);root.appendChild(tk);tk.x=0;tk.y=2214;out.dossier=root.id;}
// 11 Twitter Reposts
{const sec=SEC('11 · Twitter Reposts',0,26726,5513,1722);
 const T1='This government seems far more responsive when it comes to getting my accounts taken down than to protecting its data — they just had my Telegram account deleted while I was in the middle of a conversation. I\'ll set up a new way to get in touch later today.';
 const T2='@education_gouv Hey o/ I just absorbed 346 million lines from you (raw) a few weeks ago. You detected me, but you didn\'t cut me off. So I stayed infiltrated right under your nose. Got anything to say about that?';
 const Q='The DGFiP has taken note of the publication relaying a screenshot of a message that was allegedly sent to a user who had requested its services following the data breaches.';
 const VARS=[{name:'01 Single repost',st:'x.com/ZeroBytesG  ·  1 post',blocks:[{meta:'1h  ·  # Translated from French',text:T1,stats:'RE 32   RT 65   LIKE 591   VIEW 32K'}]},
 {name:'02 Thread',st:'x.com/ZeroBytesG  ·  thread  ·  2 posts',blocks:[{meta:'1/2  ·  15h  ·  # Translated from French',text:T2,stats:'RE 26   RT 85   LIKE 430   VIEW 83K'},{meta:'2/2  ·  15h  ·  # Translated from French',text:T1,stats:'RE 32   RT 65   LIKE 591   VIEW 32K'}]},
 {name:'03 Repost + comment',st:'x.com/ZeroBytesG  ·  quote  ·  1 comment',blocks:[{meta:'14h  ·  replying to @dgfip_official',text:'XD',big:true,quote:{who:'Direction générale des Finances publiques  [verified]  ·  @dgfip_official  ·  15h  ·  # Translated from French',text:Q,stats:'RE 47   RT 36   LIKE 178   VIEW 240K'},stats:'RE 8   RT 8   LIKE 16   VIEW 1.7K'}]}];
 out.tw=[];
 VARS.forEach((v,i)=>{const root=FR(1651,1414,C.k,{name:'Twitter_Repost (rotten) / '+v.name});sec.appendChild(root);root.x=120+i*1771;root.y=120;
  [['wallet.dat','floppy'],['KYC_scan.jpg','jpg'],['decrypt.bat','bat'],['Leaks','folder']].forEach(([l,k],j)=>{const d=DICON(l,k,skullC);root.appendChild(d);d.x=Math.round(1480+(150-d.width)/2);d.y=90+j*190;});
  CASCADE(root,2,40,20,30,30,k=>D({title:'ERROR',msg:'ACCOUNT DELETED',icon:'x',buttons:['RETRY','CANCEL'],theme:k?'white':'blue',w:440}));
  const w=W({w:1380,h:1150,title:'TWITTER.EXE',theme:'inv',help:true,menu:['File','Edit','View','Options','Help'],status:[v.st,'CLUBS'],name:'Window / Twitter'});root.appendChild(w.win);w.win.x=80;w.win.y=110;const b=w.body;
  const av=FR(110,110,C.k,{name:'Avatar',stroke:C.k,sw:4});av.appendChild(E(44,44,C.w));av.children[0].x=33;av.children[0].y=16;const bd=R(80,44,C.w);av.appendChild(bd);bd.x=15;bd.y=66;b.appendChild(av);av.x=24;av.y=20;
  const nm=T('ZeroBytes','px',22,C.k);b.appendChild(nm);nm.x=160;nm.y=34;const hd=T('@ZeroBytesG','body',28,C.k);b.appendChild(hd);hd.x=160;hd.y=72;
  const fb=AL('HORIZONTAL',{name:'Follow',gap:8});fb.appendChild(BTN('+ FOLLOW','white',{sz:14}));fb.appendChild(BTN('v','white',{sz:14}));b.appendChild(fb);fb.x=1380-32-fb.width;fb.y=30;
  let y=160;
  v.blocks.forEach(bl=>{const m=T(bl.meta,'body',24,C.k);b.appendChild(m);m.x=24;m.y=y;y+=36;
   if(bl.big){const t=T(bl.text,'px',72,C.k);b.appendChild(t);t.x=24;t.y=y;y+=110;}else{const t=T(bl.text,'body',38,C.k,{w:1300,lh:125});b.appendChild(t);t.x=24;t.y=y;y+=t.height+20;}
   if(bl.quote){const q=AL('VERTICAL',{name:'Quote',stroke:C.k,sw:3,pad:[18,22,18,22],gap:12,cross:'MIN'});q.appendChild(T(bl.quote.who,'body',24,C.k,{w:1250}));q.appendChild(T(bl.quote.text,'body',32,C.k,{w:1250,lh:125}));q.appendChild(T(bl.quote.stats,'body',24,C.k));b.appendChild(q);q.x=24;q.y=y;q.resize(1300,q.height);q.primaryAxisSizingMode='AUTO';y+=q.height+20;}
   const s=T(bl.stats,'body',26,C.k);b.appendChild(s);s.x=24;s.y=y;y+=40;
   const rl=R(1300,3,C.k,{name:'Rule'});b.appendChild(rl);rl.x=24;rl.y=y+6;y+=30;});
  const br=AL('HORIZONTAL',{name:'Actions',gap:20});['REPLY','REPOST','LIKE','SHARE'].forEach(l=>br.appendChild(BTN(l,'white',{w:310})));b.appendChild(br);br.x=24;br.y=996-82;
  const wn=D({title:'WARNING',msg:'YOU CAN SHUT DOWN THE SYSTEM, BUT TBH WE WILL BE HERE WAITING FOR YOU',icon:'warn',buttons:['PLEAD FOR MERCY'],theme:'white',w:560});root.appendChild(wn);wn.x=1040;wn.y=1060;
  const tk=TASKBAR(1651,'Twitter.exe',crowC);root.appendChild(tk);tk.x=0;tk.y=1342;out.tw.push(root.id);});}
return out;
