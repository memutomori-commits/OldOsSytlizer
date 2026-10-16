from PIL import Image; import numpy as np
src='/tmp/claude-0/-home-user-OldOsSytlizer/56a0bb85-253e-5cd6-8c50-01b0635eade1/images/23.webp'
g=np.array(Image.open(src).convert('L')).astype(int); H,W=g.shape
cell=12.5; ox=11.75-cell; oy=8.25-cell
cols=160; rows=120
bm=np.zeros((rows,cols),np.uint8)  # 1 = black
cover=np.zeros((rows,cols),bool)
for j in range(rows):
    for i in range(cols):
        cx=ox+cell*i+cell/2; cy=oy+cell*j+cell/2
        x0=min(max(int(round(cx-2)),0),W-5); y0=min(max(int(round(cy-2)),0),H-5)
        patch=g[max(y0,0):min(y0+5,H), max(x0,0):min(x0+5,W)]
        if patch.size==0: continue
        cover[j,i]=True
        bm[j,i]= 1 if np.median(patch)<128 else 0
print('grid',cols,rows, 'black%',bm.mean().round(3))
# speck removal: pixel with zero same-colour 8-neighbours -> flip
def neigh_same(b):
    p=np.pad(b,1,constant_values=2)
    cnt=np.zeros_like(b,int)
    for dy in (-1,0,1):
        for dx in (-1,0,1):
            if dy==0 and dx==0: continue
            cnt+= (p[1+dy:1+dy+b.shape[0],1+dx:1+dx+b.shape[1]]==b)
    return cnt
passes=0
while True:
    c=neigh_same(bm); specks=(c==0)
    n=specks.sum(); passes+=1
    if n==0 or passes>3: break
    bm[specks]=1-bm[specks]
    print('removed specks',n)
np.save('bm.npy',bm)
Image.fromarray(((1-bm)*255).astype(np.uint8)).resize((cols*8,rows*8),Image.NEAREST).save('preview.png')
