"""Only synthetic/local HTTPS: exercise the production proxy without real OAuth keys."""
import http.cookiejar
import json
import os
import re
import ssl
import time
import urllib.error
import urllib.request


# The smoke stack uses Caddy's local CA, never a public deployment URL.
port = int(os.environ.get('OPENNOTE_SMOKE_PORT', '443'))
BASE = 'https://localhost' + (f':{port}' if port != 443 else '')
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(
    urllib.request.HTTPSHandler(context=ssl._create_unverified_context()),
    urllib.request.HTTPCookieProcessor(jar),
)


def request(path, data=None, headers=None):
    req = urllib.request.Request(BASE + path, data=data, headers=headers or {})
    try:
        response = opener.open(req, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    return response.status, response.headers, response.read()


for attempt in range(60):
    try:
        status, _, body = request('/api/health/')
        if status == 200 and json.loads(body) == {'status': 'ok'}:
            break
    except (OSError, ValueError):
        pass
    time.sleep(1)
else:
    raise SystemExit('HTTPS/proxy/database ble ikke klar.')

status, headers, home = request('/')
assert status == 200 and b'<div id="root">' in home
assert 'no-cache' in headers['Cache-Control']
assert headers['X-Frame-Options'] == 'DENY'
assert headers['X-Content-Type-Options'] == 'nosniff'
assert headers['Strict-Transport-Security']
for path in ('/notes', '/easy-work', '/login'):
    assert request(path)[2] == home, path
asset = re.search(rb'src="(/assets/[^\"]+\.js)"', home).group(1).decode()
status, headers, _ = request(asset)
assert status == 200 and 'immutable' in headers['Cache-Control']
assert request('/assets/missing.js')[0] == 404
for path in ('/api/missing/', '/accounts/missing/', '/_allauth/missing/'):
    status, _, body = request(path)
    assert status == 404 and body != home, path

# A forged client header must be overwritten by Caddy, avoiding redirect loops.
status, headers, body = request('/api/auth/session/', headers={'X-Forwarded-Proto': 'http'})
assert status == 200 and 'no-store' in headers['Cache-Control']
session = json.loads(body)
assert session['user'] is None and not any(p['enabled'] for p in session['providers'])
csrf_cookie = next(c for c in jar if c.name == 'csrftoken')
assert csrf_cookie.secure and csrf_cookie.has_nonstandard_attr('HttpOnly')
assert request('/api/auth/logout/', data=b'')[0] == 403
csrf_headers = {'X-CSRFToken': session['csrfToken'], 'Origin': BASE}
assert request('/api/auth/logout/', data=b'', headers=csrf_headers)[0] == 200
assert request('/api/auth/logout/', data=b'', headers={**csrf_headers, 'Origin': 'https://evil.example'})[0] == 403
print('HTTPS, frontendruter, statiske filer, proxy, sikre cookies og CSRF bestod.')
