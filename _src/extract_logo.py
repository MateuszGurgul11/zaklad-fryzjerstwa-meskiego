import re,os
BS=chr(92)
s=open('_src/js/pages/_app-4972d390190da4b5.js',encoding='utf-8',errors='replace').read()
i=s.find('viewBox:"0 0 32 35"')
end=s.find('"defs"',i)
seg=s[i:end]

def scan_string(src,pos):
    q=src[pos]; j=pos+1; buf=[]
    while j<len(src):
        c=src[j]
        if c==BS: buf.append(src[j+1]); j+=2; continue
        if c==q: return ''.join(buf), j+1
        buf.append(c); j+=1
    raise ValueError('unterminated')

def parse_props(src,pos):
    depth=0; j=pos
    while j<len(src):
        c=src[j]
        if c=='"' or c=="'":
            _,j=scan_string(src,j); continue
        if c=='{': depth+=1
        elif c=='}':
            depth-=1
            if depth==0: return src[pos:j+1]
        j+=1
    return None

def get_attr(obj,key):
    m=re.search(r'(?:^|[{,\s])'+key+r':',obj)
    if not m: return None
    p=m.end()
    while p<len(obj) and obj[p]==' ': p+=1
    if p<len(obj) and (obj[p]=='"' or obj[p]=="'"):
        v,_=scan_string(obj,p); return v
    return None

paths=[]
for m in re.finditer(re.escape('createElement("path",'),seg):
    p=seg.index('{',m.end()-1)
    obj=parse_props(seg,p)
    attrs={}
    d=get_attr(obj,'d')
    if not d: continue
    for k,out_k in (('fill','fill'),('stroke','stroke'),('fillRule','fill-rule'),('clipRule','clip-rule'),('opacity','opacity'),('strokeWidth','stroke-width')):
        v=get_attr(obj,k)
        if v: attrs[out_k]=v
    attrs['d']=d
    paths.append(attrs)

print("paths:",len(paths),"total d chars:",sum(len(p['d']) for p in paths))
out=['<svg xmlns="http://www.w3.org/2000/svg" width="32" height="35" viewBox="0 0 32 35">',
     '<g style="mix-blend-mode:difference" clip-path="url(#headerLogo_clip0)">']
for p in paths:
    a=' '.join('%s="%s"'%(k,v) for k,v in p.items() if k!='d')
    out.append(('<path %s d="%s"/>'%(a,p['d'])) if a else ('<path d="%s"/>'%p['d']))
out += ['</g>','<defs><clipPath id="headerLogo_clip0"><rect width="31.5854" height="35"/></clipPath></defs>','</svg>']
os.makedirs('svg',exist_ok=True)
open('svg/header-logo.svg','w',encoding='utf-8',newline='').write('\n'.join(out))
print("written bytes:",os.path.getsize('svg/header-logo.svg'))
