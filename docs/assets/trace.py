import numpy as np, json
bm=np.load('bm.npy'); R,C=bm.shape
B=lambda i,j: 0<=i<C and 0<=j<R and bm[j,i]==1
# directed edges, clockwise around black cells (screen coords)
out={}  # start vertex -> list of end vertices
def add(a,b): out.setdefault(a,[]).append(b)
for j in range(R):
    for i in range(C):
        if not bm[j,i]: continue
        if not B(i,j-1): add((i,j),(i+1,j))
        if not B(i+1,j): add((i+1,j),(i+1,j+1))
        if not B(i,j+1): add((i+1,j+1),(i,j+1))
        if not B(i-1,j): add((i,j+1),(i,j))
loops=[]
while out:
    start=next(iter(out)); cur=start; prev_dir=None; loop=[cur]
    while True:
        nxts=out[cur]
        if len(nxts)==1: nxt=nxts[0]
        else:
            # prefer right turn relative to incoming direction (keeps hugging the cell)
            dx,dy=prev_dir
            right=(-dy,dx)  # rotate 90° clockwise in screen coords
            nxt=None
            for n in nxts:
                if (n[0]-cur[0],n[1]-cur[1])==right: nxt=n
            if nxt is None: nxt=nxts[0]
        nxts.remove(nxt)
        if not nxts: del out[cur]
        prev_dir=(nxt[0]-cur[0],nxt[1]-cur[1]); cur=nxt
        if cur==start: break
        loop.append(cur)
    loops.append(loop)
# merge collinear
def simplify(loop):
    pts=[]
    n=len(loop)
    for k in range(n):
        a=loop[k-1]; b=loop[k]; c=loop[(k+1)%n]
        if (b[0]-a[0],b[1]-a[1])!=(c[0]-b[0],c[1]-b[1]): pts.append(b)
    return pts
parts=[]
for lp in loops:
    p=simplify(lp)
    s=f'M{p[0][0]} {p[0][1]}'
    for k in range(1,len(p)):
        dx=p[k][0]-p[k-1][0]; dy=p[k][1]-p[k-1][1]
        s+= f'h{dx}' if dy==0 else f'v{dy}'
    s+='z'
    parts.append(s)
d=''.join(parts)
print('loops',len(loops),'chars',len(d))
json.dump({'cols':C,'rows':R,'parts':parts},open('path.json','w'))
svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {C} {R}" width="{C*12.5}" height="{R*12.5}" shape-rendering="crispEdges"><rect width="{C}" height="{R}" fill="#fff"/><path d="{d}" fill="#000" fill-rule="nonzero"/></svg>'
open('detective.svg','w').write(svg)
