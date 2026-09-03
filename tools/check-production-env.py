import os, sys
from pathlib import Path

required = ["NODE_ENV", "SESSION_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]
optional = ["DATABASE_URL", "RAZORPAY_WEBHOOK_SECRET", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "PUBLIC_BASE_URL"]

env_file = Path('.env.production')
if env_file.exists():
    for line in env_file.read_text(encoding='utf-8').splitlines():
        line=line.strip()
        if not line or line.startswith('#') or '=' not in line: continue
        k,v=line.split('=',1)
        os.environ.setdefault(k.strip(), v.strip())

missing=[]
weak=[]
for k in required:
    v=os.environ.get(k,'')
    if not v:
        missing.append(k)
    if k == 'SESSION_SECRET' and v and len(v) < 32:
        weak.append('SESSION_SECRET (<32 chars)')

print('RESEMBLE production environment check')
print('-'*42)
for k in required+optional:
    print(f"{k}: {'SET' if os.environ.get(k) else 'NOT SET'}")

if missing:
    print('\nMISSING REQUIRED:', ', '.join(missing))
    sys.exit(2)
if weak:
    print('\nWEAK SETTINGS:', ', '.join(weak))
    sys.exit(3)
print('\nPASS: required production secrets are present.')
