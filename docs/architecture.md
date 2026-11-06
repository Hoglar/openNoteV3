# Arkitekturvalg

## Frontend og backend er egne applikasjoner

Vi ønsker tydelige ansvarsområder og å lære API-basert utvikling. Frontend viser
innhold og sender forespørsler; den fremtidige backend validerer data, håndhever
eierskap og lagrer i en relasjonsdatabase. Bare backend skal ha databasetilgang.
Avveiningen er mer oppsett og koordinering enn med én samlet applikasjon.

Begge skal bo i dette repositoryet. Foreløpig finnes bare frontend. Django med
Django REST Framework og PostgreSQL er valgt for backend, som en modulær
monolitt med egne moduler for kontoer, Notater og Easy Work. Valget og
driftsretningen er beskrevet i ADR 003 og er ikke implementert.

## Backend og drift (planlagt)

- django-allauth håndterer Google/GitHub, tilpasset dataminimeringen i ADR 001.
- Backend håndhever eierskap og validering, og bruker serverlagrede økter.
- Separate frontend- og backend-bygg eksponeres på samme HTTPS-origin via en
  proxy, med reserverte ruter for API og innlogging.
- Én PostgreSQL-database lagrer innhold, relasjoner og økter. Vi starter uten
  egen grafdatabase, kø eller cachetjeneste.
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

Innlogging er eksplisitt simulert i `DemoSessionProvider`. Den lagres bare i
React-tilstand og må erstattes av reell serververifisert autentisering senere.
Skjulte knapper i frontend er aldri tilgangskontroll.

## ADR-er

- [ADR 001 — Innlogging og dataminimering](adr/001-innlogging-og-dataminimering.md)
  vedtar Google/GitHub-innlogging, selvvalgt visningsnavn og minst mulig
  lagret profildata. Beslutningen er ikke implementert.
- [ADR 002 — Eierskap og sletting av stjerner](adr/002-eierskap-og-sletting-av-stjerner.md)
  skiller sletting av originalen fra fjerning i eget kart. Lånte forekomster
  forsvinner ved sletting av originalen; selvstendige nabostjerner består.
  Beslutningen er ikke implementert.
- [ADR 003 — Backend, database og driftsretning](adr/003-backend-database-og-drift.md)
  velger Django, Django REST Framework, django-allauth og PostgreSQL, med
  sikkerhet, lite driftsarbeid og forutsigbare kostnader som prioriteringer.
  Beslutningen er ikke implementert.

## Videre produktretning (ikke implementert)

- Notater med direkte Markdown-redigering og forhåndsvisning, kommentarer fra
  første funksjonelle versjon og filtrering etter tema. Avklarte valg samles i
  [Spec 002 — Notater](specs/002-notes.md).
- Easy Work med personlige kunnskapskart og opplastede Markdown-sider med
  matematikkformler, forklaringer, overkommelige øvelser og fasit.
- Notater skal kunne referere til stjerner i Easy Work. Den konkrete koblingen
  mellom funksjonsområdene og datamodellen avklares før implementering.
- AI kan brukes utenfor portalen for å lage innhold; ingen integrert AI i første versjon.
- Alle, også besøkende uten konto, kan lese innhold. Bare eiere kan endre eget
  innhold og egne kart. Innlogging kreves for å opprette innhold og kommentere.

Disse områdene avklares i egne spesifikasjoner før implementering.

Ideer til senere vurdering: [Easy Work som en stjernehimmel](ideas/easy-work-stjernehimmel.md),
med aktivitetsvisning, innholdsmal og lånte stjerner som følger eierens oppdateringer.
Dette er et idénotat, ikke et nytt implementeringskrav.

Foreslått modell for lånte stjerner (ikke besluttet eller implementert): Skill
mellom innholdet som eies og oppdateres av forfatteren, og hver brukers referanse
til det i kartet. Plassering, kartkoblinger og personlig progresjon holdes adskilt
fra det delte innholdet. Sletting av originalinnhold og fjerning fra eget kart
følger ADR 002; konkret datamodell og håndtering av historikk gjenstår.
