import re,os
BS=chr(92)
def scan_string(src,pos):
    q=src[pos]; j=pos+1; buf=[]
    while j<len(src):
        c=src[j]
        if c==BS: buf.append(src[j+1]); j+=2; continue
        if c==q: return ''.join(buf), j+1
        buf.append(c); j+=1
    raise ValueError
def parse_props(src,pos):
    depth=0;j=pos
    while j<len(src):
        c=src[j]
        if c=='"' or c=="'":
            _,j=scan_string(src,j); continue
        if c=='{': depth+=1
        elif c=='}':
            depth-=1
            if depth==0: return src[pos:j+1]
        j+=1
def get_attr(obj,key):
    m=re.search(r'(?:^|[{,\s])'+re.escape(key)+r':',obj)
    if not m: return None
    p=m.end()
    while p<len(obj) and obj[p]==' ': p+=1
    if p<len(obj) and obj[p] in '"\'':
        return scan_string(obj,p)[0]
    m2=re.match(r'([\d.]+)',obj[p:])
    return m2.group(1) if m2 else None

s=open('_src/js/pages/index-11827f0de4a914d9.js',encoding='utf-8',errors='replace').read()
os.makedirs('svg/icons',exist_ok=True)
ATTRMAP={'fillRule':'fill-rule','clipRule':'clip-rule','strokeWidth':'stroke-width','strokeLinecap':'stroke-linecap','strokeLinejoin':'stroke-linejoin','strokeMiterlimit':'stroke-miterlimit'}
n=0
for m in re.finditer(r'viewBox:"([^"]+)"',s):
    vb=m.group(1)
    # find the enclosing createElement("svg" before
    start=s.rfind('createElement("svg"',max(0,m.start()-400),m.start())
    if start<0: start=m.start()-300
    seg=s[start:m.start()+9000]
    # gather child elements until component end heuristics
    parts=[]
    for em in re.finditer(r'createElement\("(path|circle|rect|g|line|polyline|polygon|ellipse|mask|defs|clipPath)",',seg):
        tag=em.group(1)
        try:
            p=seg.index('{',em.end()-1)
        except ValueError: continue
        if p-em.end()>3: continue
        obj=parse_props(seg,p)
        if not obj: continue
        attrs={}
        for k in ('d','fill','stroke','fillRule','clipRule','opacity','strokeWidth','strokeLinecap','strokeLinejoin','cx','cy','r','x','y','width','height','x1','y1','x2','y2','points','transform','id'):
            v=get_attr(obj,k)
            if v is not None: attrs[ATTRMAP.get(k,k)]=v
        if attrs: parts.append((tag,attrs))
    if not parts: continue
    n+=1
    w,h=vb.split()[2],vb.split()[3]
    out=['<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="%s" fill="none">'%(w,h,vb)]
    for tag,a in parts[:12]:
        out.append('<%s %s/>'%(tag,' '.join('%s="%s"'%(k,v) for k,v in a.items())))
    out.append('</svg>')
    fn='svg/icons/icon-%02d-%s.svg'%(n,vb.replace(' ','_'))
    open(fn,'w',encoding='utf-8',newline='').write('\n'.join(out))
print("icons written:",n)
