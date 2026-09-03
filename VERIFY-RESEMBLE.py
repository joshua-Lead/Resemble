from pathlib import Path
import re, sys
root = Path(__file__).resolve().parent
html = list(root.glob("*.html"))
errors=[]
for p in html:
    s=p.read_text(encoding="utf-8", errors="ignore")
    mains=len(re.findall(r'<script\s+src=["\']main\.js["\']',s,re.I))
    if mains != 1: errors.append(f"{p.name}: expected 1 main.js, found {mains}")
    for href in re.findall(r'(?:href|src)=["\']([^"\']+)["\']',s,re.I):
        if href.startswith(('http://','https://','#','mailto:','javascript:','data:')): continue
        target=(root/href.split('?')[0].split('#')[0]).resolve()
        if not target.exists(): errors.append(f"{p.name}: missing {href}")
if errors:
    print("RESEMBLE VERIFY: FAILED")
    print("\n".join(errors))
    sys.exit(1)
print(f"RESEMBLE VERIFY: PASS — {len(html)} HTML pages checked")
