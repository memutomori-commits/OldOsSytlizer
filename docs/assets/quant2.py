import numpy as np, colorsys, json
from collections import Counter
samp=np.load('samp.npy'); R,C,_=samp.shape
PAL={0:'#000000',1:'#FFFFFF',2:'#FF00FF',3:'#00E0FF',4:'#FFFF00',5:'#FF2000',6:'#FF9000'}
def cls(rgb):
    r,g,b=[v/255 for v in rgb]; h,s,v=colorsys.rgb_to_hsv(r,g,b)
    if s<0.35 or v<0.18: return 1 if v>0.5 else 0
    h*=360
    if h<18 or h>=335: return 5 if v>0.5 else 2
    if h<45: return 6
    if h<75: return 4
    if h<105: return 4
    if h<215: return 3
    return 2
idx=np.zeros((R,C),int)
for j in range(R):
    for i in range(C): idx[j,i]=cls(samp[j,i])
print('counts', sorted(Counter(idx.ravel()).items()))
# speck removal: cell with no same-colour 8-neighbour -> most common neighbour colour
def fix(idx):
    out=idx.copy(); n=0
    for j in range(R):
        for i in range(C):
            nb=[idx[y,x] for y in range(max(j-1,0),min(j+2,R)) for x in range(max(i-1,0),min(i+2,C)) if (y,x)!=(j,i)]
            if idx[j,i] not in nb:
                out[j,i]=Counter(nb).most_common(1)[0][0]; n+=1
    return out,n
idx,n=fix(idx); print('specks fixed',n)
np.save('idx.npy',idx)
rows=[''.join(str(v) for v in idx[j]) for j in range(R)]
json.dump({'pal':PAL,'rows':rows},open('idx.json','w'))
# preview
pal=np.array([[int(PAL[k][1:3],16),int(PAL[k][3:5],16),int(PAL[k][5:7],16)] for k in range(7)],np.uint8)
from PIL import Image
Image.fromarray(pal[idx]).resize((C*8,R*8),Image.NEAREST).save('preview2.png')
