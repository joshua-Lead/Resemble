import json, os, re, subprocess, sys
from pathlib import Path
html=list(Path('.').glob('*.html'))
missing=[]
for p in html:
    text=p.read_text(errors='ignore')
    refs=re.findall(r'(?:href|src)=[\"\']([^\"\']+)',text)
    for ref in refs:
        if ref.startswith(('http://','https://','#','mailto:','javascript:')): continue
        ref=ref.split('?')[0].split('#')[0]
        if ref and not (p.parent/ref).exists(): missing.append(f'{p}: {ref}')
print(f'HTML_PAGES={len(html)}')
print('MISSING_LOCAL_REFERENCES=',len(missing))
for x in missing: print(x)
for f in ['server.js','main.js','assets/checkout.js','assets/api.js']:
    r=subprocess.run(['node','--check',f],capture_output=True,text=True)
    print(f'NODE_CHECK_{f}=', 'PASS' if r.returncode==0 else 'FAIL')
    if r.returncode: print(r.stderr)
