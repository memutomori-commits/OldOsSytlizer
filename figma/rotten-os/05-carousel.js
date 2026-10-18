const p4=await figma.getNodeByIdAsync('890:7684');await figma.setCurrentPageAsync(p4);
const skullC=await figma.getNodeByIdAsync('890:7694');const crowC=await figma.getNodeByIdAsync('117:27');
const sec=figma.createSection();sec.name='08 · Carousel Post';p4.appendChild(sec);sec.x=0;sec.y=18369;sec.resizeWithoutConstraints(6536,3341);sec.fills=[S({r:.18,g:.18,b:.18})];
const H=['48665acbef1b26b225f330f210c552be67c3356b','1d85ab78c7e9ad582a2d9eae3034ef643b6c8bbd','7f666026fbf261f69347a32283d88de8c40e4bde','b6fbc5f849e4bc1fb5901d77090b77d2029a37e7'];
const NOTE=(w,h,text)=>{const n=W({w,h,title:'UNTITLED - NOTEPAD',theme:'white',menu:['File','Edit','Search','Help'],name:'Window / Notepad',shd:8});const t=T(text,'body',26,C.k,{w:w-40,lh:120});n.body.appendChild(t);t.x=16;t.y=12;return n.win;};
const out={ex:[],ht:[]};
for(let i=0;i<4;i++){const n='0'+(i+1);
 const root=FR(1365,1367,C.k,{name:'Carousel Post / Explorer — '+n+' (rotten)'});sec.appendChild(root);root.x=120+i*1574;root.y=120;
 CASCADE(root,2,900,-6,30,30,k=>D({title:'ERROR',msg:'NO SMILE',icon:'x',buttons:['RETRY','CANCEL'],theme:k?'blue':'white',w:420}));
 const w=W({w:1240,h:1130,title:'@CLUBS - CLUBS EXPLORER',theme:'mixed',menu:['File','Edit','View','Go','Favorites','Help'],status:['CLUBS ZONE  ·  clubs://@clubs/post/tectonic-'+n,n+' / 04'],name:'Window / Explorer'});root.appendChild(w.win);w.win.x=60;w.win.y=50;const b=w.body;
 const tbr=AL('HORIZONTAL',{name:'Toolbar',gap:10});['BACK','FORWARD','STOP','REFRESH','HOME','SEARCH'].forEach(l=>tbr.appendChild(BTN(l,'white',{sz:12})));b.appendChild(tbr);tbr.x=16;tbr.y=12;
 const ad=AL('HORIZONTAL',{name:'Address',gap:14});ad.appendChild(T('ADDRESS','px',14,C.k));const fv=FIELD('','clubs://@clubs/post/tectonic-'+n,980,'white',{sz:28});ad.appendChild(fv);ad.appendChild(BTN('GO','white',{sz:12}));b.appendChild(ad);ad.x=16;ad.y=74;
 const ph=PHOTO(1190,760,H[i],{name:'Photo — REPLACE HERE (fill)'});b.appendChild(ph);ph.x=16;ph.y=140;
 const ld=D({title:'PROCESSING...',msg:'PARSING EVIDENCE.DB',icon:'none',extra:PROG(16,4+i*3,22,'blue','3 HOURS REMAINING'),buttons:['CANCEL'],btnAlign:'MAX',theme:'blue',w:520});root.appendChild(ld);ld.x=800;ld.y=930;
 const nt=NOTE(480,230,'destiny can be changed only in the present\n\n-CLUBS');root.appendChild(nt);nt.x=40;nt.y=1010;
 const tk=TASKBAR(1365,'@clubs - Clubs Explorer',crowC);root.appendChild(tk);tk.x=0;tk.y=1295;out.ex.push(root.id);}
for(let i=0;i<4;i++){const n='0'+(i+1);
 const root=FR(1454,1454,C.k,{name:'Carousel Post / Help Topics — '+n+' (rotten)'});sec.appendChild(root);root.x=120+i*1574;root.y=1620;
 CASCADE(root,2,960,-6,30,30,k=>D({title:'WARNING',msg:'ACCESS TO C:/ WAS DENIED',icon:'warn',buttons:['OK'],theme:k?'white':'blue',w:440}));
 const w=W({w:1340,h:1270,title:'CLUBS SYSTEM IMAGE VIEW',theme:'inv',help:true,name:'Window / Image view'});root.appendChild(w.win);w.win.x=57;w.win.y=50;const b=w.body;
 const tabs=AL('HORIZONTAL',{name:'Tabs',gap:0});['CONTENTS','INDEX','FIND'].forEach((l,k)=>{const t=AL('HORIZONTAL',{name:'Tab / '+l,fill:k?C.w:C.k,stroke:C.k,sw:3,pad:[10,20,10,20]});t.appendChild(T(l,'px',14,k?C.k:C.w));tabs.appendChild(t);});b.appendChild(tabs);tabs.x=16;tabs.y=12;
 const cnt=TAG(n+' / 04','white');b.appendChild(cnt);cnt.x=1340-32-cnt.width;cnt.y=16;
 const cap=T('Another crypto founder has been arrested','body',34,C.k);b.appendChild(cap);cap.x=20;cap.y=76;
 const ph=PHOTO(1300,880,H[i],{name:'Photo — REPLACE HERE (fill)'});b.appendChild(ph);ph.x=16;ph.y=124;
 const br=AL('HORIZONTAL',{name:'Buttons',gap:16});['OPEN','PRINT...','CANCEL'].forEach(l=>br.appendChild(BTN(l,'white')));b.appendChild(br);br.x=1340-32-br.width;br.y=1030;
 const er=D({title:'ERROR',msg:'CLICK "FIX" TO FIX ERROR',icon:'x',buttons:['FIX'],theme:'white',w:440});root.appendChild(er);er.x=40;er.y=1150;
 const tk=TASKBAR(1454,'clubs system image view',crowC);root.appendChild(tk);tk.x=0;tk.y=1382;out.ht.push(root.id);}
return out;
