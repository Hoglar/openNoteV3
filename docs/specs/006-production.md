# Spec 006 — Forberedelse til serverdrift

Status: Oppsett og verktøy er implementert og kontrollert delvis lokalt.
Brukeren har bekreftet serverkjøp. Full Docker-kjøring av appen og faktisk appdrift
gjenstår. Brukeren har bekreftet Ubuntu 26.04.1 LTS, sudo-tilgang og
SSH-nøkkelinnlogging. Brukeren rapporterer også vellykket SSH-innstramming og
innlogging etter oppdatering/omstart. UFW med TCP 22/80/443 for IPv4/IPv6 og
ny SSH-innlogging er bekreftet. Docker `hello-world` på serveren og Compose
v5.8.0 er bekreftet. Leverandørbrannmur, appens containerkjede og utrulling gjenstår.

## Formål

Gjør oppsett, oppdatering og gjenoppretting repeterbart før vi velger hosting.
Behold én VPS og kostnadsrammen i ADR 003. Lokal utvikling skal fortsatt fungere
med sitt eksisterende oppsett.

## Oppførsel

- Et eget produksjonsoppsett bruker Docker Compose med Caddy, Django/Gunicorn
  og PostgreSQL. Bare Caddys HTTP/HTTPS-porter publiseres. Data og sertifikater
  har egne varige volumer.
- Caddy serverer ferdigbygget React og sender reserverte API-/innloggingsruter
  til backend før SPA-reserven. Direkte lenker virker. Manglende byggefiler
  under `/assets/` skal gi 404, ikke HTML. HTML må sjekkes på nytt etter oppdatering.
- HTTPS og sikre cookies gjelder i produksjon. Tillit til proxyens HTTPS-header
  aktiveres eksplisitt; Caddy overskriver den, og backend er ikke offentlig eksponert.
  Tilgangslogger med OAuth-koder skal ikke lagres.
- Hemmeligheter ligger i en separat, Git-ignorert produksjonsfil og tas ikke
  med i containerbygg. Appens databasebruker er ikke superbruker og kan ikke
  opprette databaser eller roller.
- Frontend og backend pakkes utenfor VPS-en med samme versjonstag. Utrulling
  er manuell etter grønn CI. Ingen automatisk publisering eller betalt tjeneste.
- Oppdateringsrutinen stopper skriving, tar databasebackup, kjører migrasjoner,
  starter valgt versjon og kontrollerer helse. Tilbakeføring av kode krever
  kompatibel databasestruktur; databasen rulles ikke automatisk tilbake.
- Backupverktøy skriver en privat, konsistent PostgreSQL-dump og avviser
  ufullstendige arkiver. Et eget verktøy prøver gjenoppretting i en midlertidig
  database uten publiserte porter, adskilt fra utvikling og produksjon.
- En manuelt startet GitHub-workflow bygger og kontrollerer hele containerkjeden
  med syntetiske data, inkludert backup/gjenoppretting. Den endrer ingen server.

## Akseptansekriterier

1. Konfigurasjon uten nødvendige hemmeligheter/versjon avvises.
2. Backend får HTTPS-status gjennom proxyen, uten redirect-løkke. Cookies,
   CSRF og ukjente API-ruter oppfører seg riktig gjennom serveroppsettet.
3. Bare webserveren har publiserte porter; appen bruker en begrenset databaserolle.
4. Bygg inneholder ikke `.env`, utviklingsdatabase, Git-historikk eller lokale backupfiler.
5. Helsesjekk, direkte frontendlenker, statiske filer og reell backup/gjenoppretting
   er dekket av kontrollverktøyet. Feil gjør workflowen rød.
6. Driftsveiledningen beskriver første oppsett, oppdatering, tilbakeføring,
   backup og vedlikehold, med tydelig skille mellom ferdige verktøy og utestet drift.

## Avgrensning

Leverandør, domene, produksjonsnøkler, brannmur og faktisk utrulling gjenstår.
Planlagt backup utenfor serveren, automatisering/oppbevaring, overvåking og
gjenoppretting på valgt server må etableres før ekte brukerdata. En lokal dump
alene oppfyller ikke backupkravet. Offentlig åpning krever også misbruksvern,
kontosletting og personvernavklaringene i ADR 001/003. Ingen garanti om kapasitet
eller tilgjengelighet gis før måling på serveren.

## Verifikasjon

- TypeScript/produksjonsbygg og alle 25 backend-tester består, inkludert
  eksplisitt proxy-tillit, sikre cookies, HTTPS-redirect og CSRF.
- Django `check --deploy --fail-level WARNING` og Gunicorn-konfigurasjonskontroll
  består. HSTS gjelder bare appens vertsnavn; W005/W021 er bevisst stilnet.
- Compose 5.7.0 godkjenner konfigurasjonen. Privat backend/database og internt
  databasenettverk er kontrollert i den normaliserte konfigurasjonen.
- Caddy 2.11.9 godkjenner konfigurasjonen, og actionlint 1.7.12 godkjenner begge
  workflows. Bash-syntaks og whitespace er kontrollert.
- Hele HTTPS-kjeden er prøvd med native Caddy/Gunicorn/PostgreSQL på separate
  lokale testporter. Samme Caddy-ruting ble brukt med justerte filstier/porter:
  frontendlenker, filer, ukjente API-ruter, forfalsket proxy-header, cookies og
  CSRF bestod. Testsertifikatet ble ikke installert som systembetrodd.
- Oppstarts-SQL, migrasjoner med begrenset approlle og faktisk dump/gjenoppretting
  av et testnotat består i isolert PostgreSQL 17.11. Appens data ble ikke brukt.
- Docker mangler i arbeidsmiljøet. Containerbygg, Compose-utrulling og de
  Docker-baserte backupskriptene er derfor ikke kjørt her. Kjør **Production check**
  etter push før første utrulling. Det er ikke en test av offentlig DNS, ekte
  OAuth eller backup utenfor serveren.
