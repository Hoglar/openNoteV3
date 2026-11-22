FROM python:3.13-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PYTHON_DOTENV_DISABLED=1
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && pip check \
    && groupadd --gid 10001 app && useradd --uid 10001 --gid app --no-create-home app
COPY backend/ ./
COPY deploy/gunicorn.conf.py ./gunicorn.conf.py
USER 10001:10001
CMD ["gunicorn", "--config", "gunicorn.conf.py", "config.wsgi:application"]
