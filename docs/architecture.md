# Arkitekturvalg

## Frontend og backend er egne applikasjoner

Vi ønsker tydelige ansvarsområder og å lære API-basert utvikling. Frontend viser
innhold og sender forespørsler; backend validerer data, håndhever
eierskap og lagrer i en relasjonsdatabase. Bare backend skal ha databasetilgang.
Avveiningen er mer oppsett og koordinering enn med én samlet applikasjon.

Begge bor i dette repositoryet. React ligger i `src/`, og Django med Django
REST Framework ligger i `backend/`. PostgreSQL 17 brukes også i backend-testene.
Backend er en modulær monolitt med implementerte moduler for `accounts`,
`notes` og `easywork`. ADR 003 beskriver teknologivalg og driftsretning.

## Backend og videre drift

- django-allauth håndterer Google/GitHub, tilpasset dataminimeringen i ADR 001.
- Egen brukermodell lagrer UUID og selvvalgt visningsnavn uten e-postfelt.
  Provider-tilpasninger fjerner ekstra profildata før allauth gjør databaseoppslag
  og oppdatering. Kun innloggingsstart og callback-ruter eksponeres fra allauth.
  Serverøkt og profil-API er beskrevet i [Spec 003](specs/003-auth.md).
- Backend håndhever eierskap og validering, og bruker serverlagrede økter.
- Separate frontend- og backend-bygg eksponeres på samme HTTPS-origin via en
  proxy i planlagt produksjon, med reserverte ruter for API og innlogging.
  Lokalt gjør Vite denne videresendingen til Django på port 8000.
- Én PostgreSQL-database lagrer innhold, relasjoner og økter. Vi starter uten
  egen grafdatabase, kø eller cachetjeneste.
- `compose.yaml` starter bare lokal PostgreSQL med vedvarende volum og
  loopback-port. Python kjøres i eget virtuelt miljø. Pakker er låst i
  `backend/requirements.txt`; `.env` og virtuelle miljøer er ignorert av Git.
- Startbudsjettet er maksimalt 140 NOK per måned inkludert mva og nødvendig
  drift, uten eksisterende domene. Egen drift på én VPS med app og database
  er valgt for starten. Leverandør er ikke valgt. Oppsett og vedlikehold skal
  dokumenteres, inkludert backup utenfor serveren og testet gjenoppretting.
  Se [hostingvurderingen](hosting.md). Kapasitet økes etter målt behov og innenfor
  avtalt budsjett.

## Frontend

- React og TypeScript for komponenter og typer, Vite for utvikling og bygg.
- React Router i nettleseren for URL-er, historikk og bytte uten full sideinnlasting.
- `src/app` eier ruter og felles layout.
- `src/features` samler funksjonsområdene `notes`, `easy-work` og `auth`.
- `src/shared` inneholder små komponenter som brukes på tvers.
- `src/styles.css` inneholder felles stil og responsiv layout.

`SessionProvider` henter innloggingsstatus fra backend. Demo-innlogging er
fjernet; serverøkten bevares ved oppfriskning. Manglende leverandørnøkler og
nettverksfeil vises på innloggingssiden. Skjulte knapper er aldri tilgangskontroll.

## ADR-er

- [ADR 001 — Innlogging og dataminimering](adr/001-innlogging-og-dataminimering.md)
  vedtar Google/GitHub-innlogging, selvvalgt visningsnavn og minst mulig
  lagret profildata. Ekte Google-innlogging lokalt er bekreftet av brukeren;
  GitHub, produksjonsinnlogging og personvernavklaringer før offentlig drift gjenstår.
- [ADR 002 — Eierskap og sletting av stjerner](adr/002-eierskap-og-sletting-av-stjerner.md)
  skiller sletting av originalen fra fjerning i eget kart. Lånte forekomster
  forsvinner ved sletting av originalen; selvstendige nabostjerner består.
  Beslutningen er implementert og testet mot PostgreSQL.
- [ADR 003 — Backend, database og driftsretning](adr/003-backend-database-og-drift.md)
  velger Django, Django REST Framework, django-allauth og PostgreSQL, med
  sikkerhet, lite driftsarbeid og forutsigbare kostnader som prioriteringer.
  Lokalt backend-grunnlag er implementert. Produksjonsdrift gjenstår.

## Innholdsmodulene

- `notes` eier notater, temaetiketter og flate kommentarer. Et notat har en
  valgfri mange-til-mange-relasjon til delt stjerneinnhold i `easywork`.
  Sletting av en stjerne fjerner bare denne relasjonen, ikke notatet.
- `easywork` eier `Star` (delt innhold), `Placement` (brukerens permanente
  koordinater og aktiv-status), `Connection` (brukerens forbindelser) og
  `Practice` (egen øving). En stjerne kan brukes i mange kart uten kopiering.
- `common` inneholder felles API-validering, forfattervisning, paginering og
  lesetilgang/eierskapskontroll. Innlogging og visningsnavn kreves for skriving.
  Øving kontrolleres mot innlogget bruker, ikke eieren av den lånte stjernen.
  JSON-parseren begrenser forespørsler til 512 kB og avviser tegn som databasen
  ikke kan lagre; innholdsfeltene har egne, strengere grenser.
- Databasebegrensninger hindrer duplikate kartforekomster og forbindelser.
  Kartendringer og øving bruker transaksjoner med lås per bruker. Opprettelse
  av stjerne og kartforekomst er atomisk. Sletting følger relasjonenes kaskader.
- Oppgaver lagres som en liten, validert JSON-samling med stabile ID-er i
  stjernen. Dette passer en enkel innholdsmal uten egen oppgavetjeneste.
  Øving har en innholdshash som gjør endrede oppgaver ugjort; tidspunktet på
  stjernen avviser registrering fra en foreldet visning.
- Notatsøk bruker tittel/tekst og JSON-etiketter i PostgreSQL. Oversikter
  pagineres med 20 resultater. Dedikert søkemotor og søkeindekser kan vurderes
  etter målt datamengde. Første kartgrense er 200 aktive stjerner per bruker.
- API-et returnerer privat/no-store også på offentlige innholdsruter, slik at
  brukeravhengige kart og øvingsdata ikke havner i delte mellomlagre.

Frontend bruker felles Markdown-editor, renderer og API-hjelpere i `src/shared`.
`react-markdown`, GFM, remark-math og KaTeX viser tekst, kode og formler uten
rå HTML, bilder eller betrodde KaTeX-kommandoer. React Router bruker dataruter
for å kunne varsle om ulagrede endringer. Innholdsmodulene lastes ved behov,
slik at startsiden ikke trenger å laste matematikkrendereren.

Stjernens notatlenke åpner filtrert Notater-oversikt. Easy Work trenger dermed
ikke importere Notaters backend-kode. Felles offentlig innhold holdes adskilt
fra personlig øving. Samtidig redigering er ikke samarbeid i sanntid: sist
vellykkede lagring vinner; brukeren bør unngå å redigere samme innhold i flere faner.

Funksjonell oppførsel er beskrevet i [Spec 002](specs/002-notes.md) og
[Spec 004](specs/004-easy-work.md). JSON-malen finnes i
[star-v1.json](../public/templates/star-v1.json).

## Automatiske kontroller

GitHub Actions bygger og tester frontend og backend i separate jobber etter
[Spec 005](specs/005-ci.md). Backend får en midlertidig PostgreSQL-tjeneste;
nettlesertestene bruker isolerte API-svar. Låste avhengigheter installeres fra
repositoryet. Ingen produksjonsnøkler eller lokale `.env`-filer brukes i CI.
Jobbene gir hver sin status i GitHub og publiserer ikke appen. Slik kan senere
utrulling bygges på verifiserte endringer uten å blande drift inn i testene.

## Videre produktretning

Adaptiv lysstyrke, stjernestørrelse, repetisjonsintervaller og naboeffekt er
fortsatt ideer i [idénotatet](ideas/easy-work-stjernehimmel.md), ikke implementert
læringsteori. AI kan brukes utenfor portalen; ingen integrert AI er innført.
Offentlig drift, ratebegrensning, kontosletting og øvrige personvernavklaringer
følger fortsatt ADR 001 og 003 før lansering.
