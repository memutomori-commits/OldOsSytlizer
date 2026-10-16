from PIL import Image; import numpy as np, json
from collections import Counter
src='../../images/24.webp'
a=np.array(Image.open(src).convert('RGB')).astype(int); H,W,_=a.shape
N=90; cell=W/N; ox=14.25-cell; oy=11.25-cell
cols=rows=N
samp=np.zeros((rows,cols,3),int)
for j in range(rows):
    for i in range(cols):
        cx=ox+cell*i+cell/2; cy=oy+cell*j+cell/2
        x0=min(max(int(round(cx-3)),0),W-7); y0=min(max(int(round(cy-3)),0),H-7)
        samp[j,i]=np.median(a[y0:y0+7,x0:x0+7].reshape(-1,3),axis=0)
# cluster: round to coarse bins and count
flat=samp.reshape(-1,3)
bins=Counter(tuple((c//32*32+16)) for c in flat)
print('coarse bins:', [(k,v) for k,v in bins.most_common(14)])
np.save('samp.npy',samp)
Image.fromarray(samp.astype(np.uint8)).resize((cols*8,rows*8),Image.NEAREST).save('preview2_raw.png')
