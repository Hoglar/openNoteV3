bind = '0.0.0.0:8000'
workers = 2
threads = 2
timeout = 30
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 100
# Container lifecycle is managed by Compose; the filesystem is read-only.
control_socket_disable = True
# Django explicitly trusts X-Forwarded-Proto only in the private proxy setup.
secure_scheme_headers = {}
forwarded_allow_ips = ''
# OAuth callbacks contain short-lived codes in their URLs.
accesslog = None
errorlog = '-'
