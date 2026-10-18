// ===== ROTTEN OS KIT =====
const C={k:{r:0,g:0,b:0},w:{r:1,g:1,b:1},b:{r:1/255,g:18/255,b:253/255}};
const S=(c,o)=>({type:'SOLID',color:c,opacity:o==null?1:o});
const F={body:{family:'VT323',style:'Regular'},px:{family:'Press Start 2P',style:'Regular'},big:{family:'Doto',style:'Black'},mono:{family:'IBM Plex Mono',style:'Regular'},silk:{family:'Silkscreen',style:'Bold'},goth:{family:'Jacquard 12',style:'Regular'}};
await Promise.all(Object.values(F).map(f=>figma.loadFontAsync(f)));
const TH={blue:{bg:C.b,fg:C.w,bar:C.b,barFg:C.w,sh:C.w},white:{bg:C.w,fg:C.k,bar:C.w,barFg:C.k,sh:C.k},black:{bg:C.k,fg:C.w,bar:C.k,barFg:C.w,sh:C.w},mixed:{bg:C.w,fg:C.k,bar:C.b,barFg:C.w,sh:C.k},inv:{bg:C.w,fg:C.k,bar:C.k,barFg:C.w,sh:C.k}};
const IDS={};
function T(s,f,sz,c,o={}){const t=figma.createText();t.fontName=F[f];t.characters=s;t.fontSize=sz;t.fills=[S(c)];t.name=o.name||s.slice(0,24);if(o.lh)t.lineHeight={unit:'PERCENT',value:o.lh};if(o.w){t.textAutoResize='HEIGHT';t.resize(o.w,t.height);}if(o.al)t.textAlignHorizontal=o.al;return t;}
function R(w,h,c,o={}){const r=figma.createRectangle();r.resize(w,h);r.fills=c?[S(c)]:[];if(o.stroke){r.strokes=[S(o.stroke)];r.strokeWeight=o.sw||3;r.strokeAlign='INSIDE';}r.name=o.name||'Rect';if(o.dash)r.dashPattern=o.dash;if(o.r)r.cornerRadius=o.r;return r;}
function E(w,h,c,o={}){const e=figma.createEllipse();e.resize(w,h);e.fills=c?[S(c)]:[];if(o.stroke){e.strokes=[S(o.stroke)];e.strokeWeight=o.sw||3;e.strokeAlign='INSIDE';}e.name=o.name||'Ellipse';return e;}
function V(d,c,sw,o={}){const v=figma.createVector();v.vectorPaths=[{windingRule:'NONZERO',data:d}];v.strokes=[S(c)];v.strokeWeight=sw||3;v.strokeCap='SQUARE';v.fills=o.fill?[S(o.fill)]:[];v.name=o.name||'Vector';return v;}
function AL(dir,o={}){const f=figma.createAutoLayout(dir,{name:o.name||'Row',itemSpacing:o.gap||0});const p=o.pad||[0,0,0,0];f.paddingTop=p[0];f.paddingRight=p[1];f.paddingBottom=p[2];f.paddingLeft=p[3];f.counterAxisAlignItems=o.cross||'CENTER';f.primaryAxisAlignItems=o.main||'MIN';f.fills=o.fill?[S(o.fill)]:[];if(o.stroke){f.strokes=[S(o.stroke)];f.strokeWeight=o.sw||3;f.strokeAlign='INSIDE';}f.clipsContent=!!o.clip;return f;}
function FR(w,h,c,o={}){const f=figma.createFrame();f.name=o.name||'Frame';f.resize(w,h);f.fills=c?[S(c)]:[];f.clipsContent=o.clip!==false;if(o.stroke){f.strokes=[S(o.stroke)];f.strokeWeight=o.sw||3;f.strokeAlign='INSIDE';}return f;}
function put(p,ch,h,v){p.appendChild(ch);if(h)ch.layoutSizingHorizontal=h;if(v)ch.layoutSizingVertical=v;return ch;}
function abs(p,ch,x,y){p.appendChild(ch);if(p.layoutMode&&p.layoutMode!=='NONE')ch.layoutPositioning='ABSOLUTE';ch.x=x;ch.y=y;return ch;}
function fixW(f,w){f.resize(w,f.height);if(f.layoutMode==='VERTICAL')f.primaryAxisSizingMode='AUTO';else f.counterAxisSizingMode='AUTO';}
function shadow(n,c,d){n.effects=[{type:'DROP_SHADOW',color:{r:c.r,g:c.g,b:c.b,a:1},offset:{x:d||10,y:d||10},radius:0,spread:0,visible:true,blendMode:'NORMAL'}];}
function line(p,where,c,t){const r=R(p.width,t||4,c,{name:'Line'});p.appendChild(r);if(p.layoutMode&&p.layoutMode!=='NONE')r.layoutPositioning='ABSOLUTE';r.x=0;r.y=where==='MAX'?p.height-r.height:0;r.constraints={horizontal:'STRETCH',vertical:where==='MAX'?'MAX':'MIN'};return r;}
function box(th,size,glyph){const b=AL('HORIZONTAL',{name:'Box '+(glyph||'X'),stroke:th.barFg,sw:3,main:'CENTER',cross:'CENTER'});b.appendChild(T(glyph||'X','px',Math.round(size*0.42),th.barFg));b.resize(size,size);return b;}
function W(o){const th=TH[o.theme||'blue'];const sw=o.sw||4;
 const win=AL('VERTICAL',{name:o.name||('Window / '+o.title),fill:th.bg,stroke:th.fg,sw,clip:true,cross:'MIN'});
 const bh=o.barH||64;const bar=AL('HORIZONTAL',{name:'Title bar',fill:th.bar,pad:[0,12,0,16],gap:14,cross:'CENTER'});
 if(o.closeLeft)bar.appendChild(box(th,bh-20));
 const ttl=T(o.title,o.titleFont||'px',o.titleSize||20,th.barFg,{name:'Title'});bar.appendChild(ttl);
 const sp=FR(10,10,null,{name:'Spacer'});bar.appendChild(sp);
 if(o.help)bar.appendChild(box(th,bh-20,'?'));
 if(!o.closeLeft&&o.close!==false)bar.appendChild(box(th,bh-20));
 win.appendChild(bar);bar.resize(bar.width,bh);bar.layoutSizingHorizontal='FILL';bar.layoutSizingVertical='FIXED';sp.layoutSizingHorizontal='FILL';sp.layoutSizingVertical='FILL';line(bar,'MAX',th.barFg,sw);
 if(o.menu){const m=AL('HORIZONTAL',{name:'Menu',pad:[4,16,4,16],gap:36});for(const s of o.menu)m.appendChild(T(s,'body',30,th.fg));win.appendChild(m);m.layoutSizingHorizontal='FILL';line(m,'MAX',th.fg,sw-1);}
 const body=FR(100,100,null,{name:'Content'});win.appendChild(body);body.layoutSizingHorizontal='FILL';body.layoutSizingVertical='FILL';
 let st=null;if(o.status){st=AL('HORIZONTAL',{name:'Status bar',pad:[8,12,8,12],gap:10});o.status.forEach((s,i)=>{const c=AL('HORIZONTAL',{name:'Cell',stroke:th.fg,sw:2,pad:[4,12,4,12]});c.appendChild(T(s,'body',26,th.fg));st.appendChild(c);if(i===0)c.layoutSizingHorizontal='FILL';});win.appendChild(st);st.layoutSizingHorizontal='FILL';line(st,'MIN',th.fg,sw-1);}
 win.resize(o.w,o.h);if(o.shadow!==false)shadow(win,th.sh,o.shd||10);return {win,bar,body,ttl,st};}
function ICON(kind,th){if(kind==='warn'){const f=FR(64,60,null,{name:'Icon warn',clip:false});const p=figma.createPolygon();p.pointCount=3;p.resize(64,56);p.fills=[];p.strokes=[S(th.fg)];p.strokeWeight=4;f.appendChild(p);const t=T('!','px',22,th.fg);f.appendChild(t);t.x=32-t.width/2;t.y=22;return f;}
 if(kind==='clock'){const f=FR(60,60,null,{name:'Icon clock',clip:false});f.appendChild(E(60,60,null,{stroke:th.fg,sw:4}));f.appendChild(V('M 30 12 L 30 32 L 44 32',th.fg,4));return f;}
 const b=AL('HORIZONTAL',{name:'Icon x',fill:th.fg,main:'CENTER',cross:'CENTER'});b.appendChild(T('X','px',24,th.bg));b.resize(60,60);b.cornerRadius=30;return b;}
function BTN(label,theme,o={}){const th=TH[theme||'white'];const b=AL('HORIZONTAL',{name:'Button / '+label,fill:th.bg,stroke:th.fg,sw:3,pad:[10,22,10,22],main:'CENTER'});b.appendChild(T(label,'px',o.sz||16,th.fg,{name:'Label'}));if(o.w){b.resize(o.w,b.height);b.counterAxisSizingMode='AUTO';}shadow(b,th.fg,4);return b;}
function TAG(label,theme,o={}){const th=TH[theme||'white'];const t=AL('HORIZONTAL',{name:'Tag / '+label,fill:th.fg,pad:[6,12,6,12]});t.appendChild(T(label,'px',o.sz||14,th.bg,{name:'Label'}));return t;}
function CB(label,on,theme,o={}){const th=TH[theme||'white'];const r=AL('HORIZONTAL',{name:'Checkbox / '+label,gap:12});const bx=AL('HORIZONTAL',{name:on?'Box on':'Box off',fill:th.bg,stroke:th.fg,sw:3,main:'CENTER',cross:'CENTER'});if(on)bx.appendChild(R(12,12,th.fg,{name:'Mark'}));bx.resize(28,28);r.appendChild(bx);r.appendChild(T(label,o.font||'px',o.sz||14,th.fg,{name:'Label'}));return r;}
function FIELD(label,value,w,theme,o={}){const th=TH[theme||'white'];const f=AL('VERTICAL',{name:'Field / '+label,gap:8,cross:'MIN'});if(label)f.appendChild(T(label,'px',o.lsz||14,th.fg,{name:'Label'}));const bx=AL('HORIZONTAL',{name:'Value box',fill:th.bg,stroke:th.fg,sw:3,pad:[6,14,6,14]});bx.appendChild(T(value,o.font||'body',o.sz||30,th.fg,{name:'Value'}));f.appendChild(bx);bx.resize(w,bx.height);bx.counterAxisSizingMode='AUTO';return f;}
function PROG(n,filled,size,theme,label){const th=TH[theme||'white'];const f=AL('VERTICAL',{name:'Progress',gap:10,cross:'MIN'});const row=AL('HORIZONTAL',{name:'Blocks',gap:6});for(let i=0;i<n;i++)row.appendChild(i<filled?R(size,size,th.fg,{name:'On'}):R(size,size,null,{stroke:th.fg,sw:2,name:'Off'}));f.appendChild(row);if(label)f.appendChild(T(label,'body',24,th.fg));return f;}
function D(o){const th=TH[o.theme||'white'];const sw=4;const win=AL('VERTICAL',{name:o.name||('Dialog / '+o.title),fill:th.bg,stroke:th.fg,sw,clip:true,cross:'MIN'});
 const bar=AL('HORIZONTAL',{name:'Title bar',fill:th.bar,pad:[0,10,0,14],gap:12,cross:'CENTER'});if(o.closeLeft)bar.appendChild(box(th,36));bar.appendChild(T(o.title,'px',18,th.barFg,{name:'Title'}));const sp=FR(10,10,null,{name:'Spacer'});bar.appendChild(sp);if(!o.closeLeft)bar.appendChild(box(th,36));
 win.appendChild(bar);bar.resize(bar.width,56);bar.layoutSizingHorizontal='FILL';bar.layoutSizingVertical='FIXED';sp.layoutSizingHorizontal='FILL';sp.layoutSizingVertical='FILL';line(bar,'MAX',th.barFg,sw);
 const ct=AL('VERTICAL',{name:'Content',pad:[24,24,24,24],gap:22,cross:'MIN'});const w=o.w||520;
 if(o.msg){const row=AL('HORIZONTAL',{name:'Message',gap:20,cross:'CENTER'});let iw=0;if(o.icon&&o.icon!=='none'){row.appendChild(ICON(o.icon,th));iw=84;}row.appendChild(T(o.msg,o.msgFont||'px',o.msgSize||18,th.fg,{name:'Message',w:w-48-iw-8,lh:o.lh||170}));ct.appendChild(row);row.layoutSizingHorizontal='FILL';}
 if(o.extra){ct.appendChild(o.extra);}
 if(o.buttons&&o.buttons.length){const br=AL('HORIZONTAL',{name:'Buttons',gap:16,main:o.btnAlign||'CENTER'});for(const b of o.buttons)br.appendChild(BTN(b,o.theme||'white'));ct.appendChild(br);br.layoutSizingHorizontal='FILL';}
 win.appendChild(ct);ct.layoutSizingHorizontal='FILL';win.resize(w,win.height);win.primaryAxisSizingMode='AUTO';shadow(win,th.sh,8);return win;}
function TASKBAR(w,task,crowC){const th=TH.black;const tb=AL('HORIZONTAL',{name:'Taskbar',fill:C.k,pad:[10,16,10,16],gap:14});
 const st=AL('HORIZONTAL',{name:'Start',stroke:C.w,sw:3,pad:[6,14,6,10],gap:10});if(crowC){const cr=crowC.createInstance();cr.resize(34,34);st.appendChild(cr);}st.appendChild(T('CLUBS','px',18,C.w));tb.appendChild(st);
 for(const ch of ['€','#','@']){const b=AL('HORIZONTAL',{name:'Quick '+ch,stroke:C.w,sw:3,main:'CENTER',cross:'CENTER'});b.appendChild(T(ch,'body',34,C.w));b.resize(48,48);tb.appendChild(b);}
 const tk=AL('HORIZONTAL',{name:'Task',stroke:C.w,sw:3,pad:[6,16,6,16],gap:10});tk.appendChild(R(22,22,C.w,{name:'App'}));tk.appendChild(T(task,'px',14,C.w));tb.appendChild(tk);tk.resize(380,tk.height);tk.counterAxisSizingMode='AUTO';
 const sp=FR(10,10,null,{name:'Spacer'});tb.appendChild(sp);sp.layoutSizingHorizontal='FILL';
 const ck=AL('HORIZONTAL',{name:'Clock',stroke:C.w,sw:3,pad:[4,16,4,16],gap:12});ck.appendChild(V('M 2 2 L 14 10 L 2 18 Z',C.w,3,{fill:C.w,name:'Sound'}));ck.appendChild(T('12:00','body',30,C.w));tb.appendChild(ck);
 tb.resize(w,72);line(tb,'MIN',C.w,4);return tb;}
function GLYPH(kind,tile,skullC){const k=C.k,w=C.w,b=C.b;const add=(n,x,y)=>{tile.appendChild(n);n.x=x;n.y=y;return n;};
 if(kind==='floppy'){add(R(56,56,w),20,20);add(R(32,18,k),32,24);add(R(40,14,k),28,58);}
 else if(kind==='folder'){add(R(28,10,w),18,22);add(R(60,44,w),18,32);add(R(52,30,k),22,42);add(R(52,26,w),22,46);}
 else if(kind==='doc'){add(R(48,60,w),24,18);add(R(28,4,k),34,34);add(R(28,4,k),34,46);add(R(20,4,k),34,58);}
 else if(kind==='key'){add(E(30,30,null,{stroke:w,sw:7}),16,33);add(R(36,8,w),44,44);add(R(8,14,w),70,50);add(R(8,10,w),58,50);}
 else if(kind==='exe'){add(R(60,52,w),18,22);add(R(52,10,b),22,26);add(R(8,8,k),66,27);}
 else if(kind==='bat'){add(R(60,52,w),18,22);add(T('C:\\','px',14,k),28,42);}
 else if(kind==='jpg'){add(R(60,52,w),18,22);const p=figma.createPolygon();p.pointCount=3;p.resize(36,24);p.fills=[S(k)];add(p,30,44);add(E(10,10,k),58,30);}
 else if(kind==='trash'){add(R(56,8,w),20,20);add(R(20,6,w),38,14);add(R(44,56,w),26,30);add(R(6,36,k),38,40);add(R(6,36,k),52,40);}
 else if(kind==='skull'&&skullC){const s=skullC.createInstance();s.resize(52,71);add(s,22,12);}
 else {add(T('?','px',40,w),28,28);}
 return tile;}
function DICON(label,kind,skullC){const f=AL('VERTICAL',{name:'Desktop icon / '+label,gap:10,cross:'CENTER'});const tile=FR(96,96,C.k,{name:'Tile',stroke:C.w,sw:4});GLYPH(kind,tile,skullC);f.appendChild(tile);f.appendChild(T(label,'body',26,C.w,{name:'Label'}));return f;}
function DITHER(w,h,op){const f=FR(w,h,null,{name:'Dither (hatch)'});const a=V('M 0 0 L '+w+' 0',C.k,h);a.dashPattern=[3,5];a.strokeCap='NONE';f.appendChild(a);a.x=0;a.y=h/2;const b=V('M 0 0 L 0 '+h,C.k,w);b.dashPattern=[3,5];b.strokeCap='NONE';f.appendChild(b);b.x=w/2;b.y=0;f.opacity=op==null?0.28:op;return f;}
function PHOTO(w,h,hash,o={}){const f=FR(w,h,null,{name:o.name||'Photo — REPLACE HERE (fill)'});f.fills=[{type:'IMAGE',imageHash:hash,scaleMode:'FILL',filters:{exposure:0,contrast:o.contrast==null?0.45:o.contrast,saturation:-1,temperature:0,tint:0,highlights:0,shadows:0}}];
 if(!o.noTint){const ov=R(w,h,C.b,{name:'Duotone — blue (lighten)'});ov.blendMode='LIGHTEN';f.appendChild(ov);ov.constraints={horizontal:'STRETCH',vertical:'STRETCH'};}
 if(o.dither!==false){try{const d=DITHER(w,h,o.dither);f.appendChild(d);d.constraints={horizontal:'STRETCH',vertical:'STRETCH'};}catch(e){}}
 return f;}
function TOOLBOX(){const f=AL('VERTICAL',{name:'Toolbox',fill:C.w,stroke:C.k,sw:4,pad:[6,6,6,6],cross:'MIN'});const items=['star','dashed','eraser','bucket','dropper','magnifier','pencil','brush','spray','A','line','curve','rect','L','ellipse','rounded'];
 for(let r=0;r<8;r++){const row=AL('HORIZONTAL',{name:'Row'});for(let c=0;c<2;c++){const kind=items[r*2+c];const cell=FR(56,56,C.w,{name:'Tool / '+kind,stroke:C.k,sw:2});const g=(n,x,y)=>{cell.appendChild(n);n.x=x;n.y=y;};
  if(kind==='star'){const s=figma.createStar();s.resize(36,36);s.fills=[];s.strokes=[S(C.k)];s.strokeWeight=3;g(s,10,10);}
  else if(kind==='dashed')g(R(36,26,null,{stroke:C.k,sw:3,dash:[5,4]}),10,15);
  else if(kind==='eraser')g(V('M 6 26 L 22 10 L 36 24 L 20 40 Z M 12 20 L 28 34',C.k,3),7,3);
  else if(kind==='bucket')g(V('M 10 22 L 24 8 L 40 24 L 26 38 Z M 24 8 L 24 2 M 42 26 L 46 34 L 42 38 L 38 34 Z',C.k,3),4,8);
  else if(kind==='dropper')g(V('M 8 38 L 26 20 M 22 16 L 30 24 M 28 10 L 36 18 M 24 14 L 32 22',C.k,4),8,6);
  else if(kind==='magnifier'){g(E(26,26,null,{stroke:C.k,sw:4}),8,8);g(V('M 2 2 L 16 16',C.k,5),30,30);}
  else if(kind==='pencil')g(V('M 8 36 L 30 14 L 38 22 L 16 44 Z M 8 36 L 6 46 L 16 44',C.k,3),6,2);
  else if(kind==='brush')g(V('M 26 4 L 26 22 M 16 22 L 36 22 L 34 42 L 18 42 Z M 20 30 L 32 30',C.k,3),4,6);
  else if(kind==='spray'){g(R(18,26,null,{stroke:C.k,sw:3}),16,22);g(E(6,6,C.k),12,8);g(E(6,6,C.k),24,6);g(E(6,6,C.k),34,12);g(R(6,8,C.k),22,14);}
  else if(kind==='A')g(T('A','px',30,C.k),13,12);
  else if(kind==='line')g(V('M 4 40 L 40 4',C.k,4),6,6);
  else if(kind==='curve')g(V('M 4 40 C 34 40 10 4 40 4',C.k,4),6,6);
  else if(kind==='rect')g(R(36,26,null,{stroke:C.k,sw:3}),10,15);
  else if(kind==='L')g(V('M 6 6 L 6 40 L 40 40 L 40 26 L 20 26 L 20 6 Z',C.k,3),5,5);
  else if(kind==='ellipse')g(E(36,26,null,{stroke:C.k,sw:3}),10,15);
  else if(kind==='rounded')g(R(36,26,null,{stroke:C.k,sw:3,r:10}),10,15);
  row.appendChild(cell);}f.appendChild(row);}
 return f;}
function CASCADE(parent,n,x,y,dx,dy,mk){const ids=[];for(let i=0;i<n;i++){const d=mk(i);parent.appendChild(d);d.x=x+dx*i;d.y=y+dy*i;ids.push(d.id);}return ids;}
function recolor(node,map){for(const n of node.findAll(m=>'fills' in m&&Array.isArray(m.fills)&&m.fills.length&&m.fills[0].type==='SOLID')){const c=n.fills[0].color;const L=0.2126*c.r+0.7152*c.g+0.0722*c.b;n.fills=[S(map(L,c,n))];}}
function px(node){node.x=Math.round(node.x);node.y=Math.round(node.y);}
// ===== END KIT =====
