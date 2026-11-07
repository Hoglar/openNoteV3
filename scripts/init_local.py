"""Create local secrets once, without displaying or overwriting them."""
from pathlib import Path
import os
import secrets

root = Path(__file__).resolve().parent.parent
target = root / '.env'
content = (root / '.env.example').read_text()
content = content.replace('DJANGO_SECRET_KEY=\n', f'DJANGO_SECRET_KEY={secrets.token_urlsafe(64)}\n')
content = content.replace('POSTGRES_PASSWORD=\n', f'POSTGRES_PASSWORD={secrets.token_urlsafe(32)}\n')
try:
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
except FileExistsError:
    print('.env finnes allerede og ble ikke endret.')
else:
    with os.fdopen(fd, 'w') as stream:
        stream.write(content)
    print('.env er opprettet med lokale hemmeligheter. OAuth-nøkler kan fylles inn senere.')
