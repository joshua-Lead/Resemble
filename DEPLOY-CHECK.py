import os, urllib.request, json, sys
base=os.getenv('RESEMBLE_URL','http://127.0.0.1:8787').rstrip('/')
checks=['/health','/api/products','/']
failed=[]
for path in checks:
    try:
        with urllib.request.urlopen(base+path, timeout=10) as r:
            body=r.read().decode('utf-8','ignore')[:200]
            print(f'PASS {r.status:3} {path} {body}')
            if not (200 <= r.status < 400): failed.append(path)
    except Exception as e:
        print(f'FAIL     {path} {e}')
        failed.append(path)
print('RESULT:', 'PASS' if not failed else 'FAIL')
sys.exit(1 if failed else 0)
