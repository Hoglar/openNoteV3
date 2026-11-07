# Spec 003 — Innlogging og lokal backend

Status: Implementert lokalt. Brukeren har bekreftet vellykket ekte Google-innlogging
og retur til appen. GitHub krever fortsatt egne leverandørnøkler. ADR 001 og 003 gjelder.

[Oppsett og kontrolliste](../google-login-local.md) beskriver registrering og
testing. Manuell bekreftelse av oppfriskning, utlogging og gjentatt innlogging
med samme konto og innhold gjenstår; disse flytene er dekket av automatiserte tester.

## Formål og omfang

Erstatt demo-innlogging med en backend-verifisert konto og økt, og etabler
Django og PostgreSQL for videre utvikling. Notater og Easy Work bygger på dette
grunnlaget i Spec 002 og 004. Ingen hosting eller betalte tjenester opprettes.

## Oppførsel

- Alle kan fortsatt besøke sidene uten innlogging. `/login` tilbyr Google og
  GitHub. En ukonfigurert leverandør vises deaktivert med forklaring.
- OAuth startes med CSRF-beskyttet POST, med `state` og PKCE via allauth.
  Returen går alltid til `/login`; ingen vilkårlig videresendingsadresse støttes.
- Første godkjente leverandørinnlogging oppretter en lokal konto. Brukeren velger
  deretter et offentlig visningsnavn på 2–40 tegn. Navnet trimmes, kan endres og
  trenger ikke være unikt. Kontrolltegn tillates ikke. Identitet følger intern
  ID, aldri visningsnavn. En konto uten visningsnavn er ikke klar for publisering.
- Google og GitHub gir separate kontoer. Kontokobling, passord, e-postinnlogging,
  passkeys og gjenoppretting uten leverandøren inngår ikke i denne leveransen.
- Brukeren identifiseres med leverandør og stabil ID. Ingen e-post, profilnavn,
  profilbilder, komplette leverandørprofiler eller leverandørtokens lagres varig.
  Filtrering skjer før allauth kan oppdatere en eksisterende konto.
- Økten lagres i PostgreSQL og varer maksimalt sju dager fra innlogging.
  Sideoppfriskning bevarer en gyldig økt. Cookie er HttpOnly og SameSite=Lax;
  Secure og HTTPS kreves i produksjon. Lokal HTTP tillates bare i lokal modus.
- Utlogging krever CSRF-beskyttet POST og avslutter serverøkten før frontend
  viser utlogget tilstand. Ved feil beholdes tilstanden og en feilmelding vises.
- Nettverksfeil gir en forståelig melding og mulighet til å prøve igjen.
  Avbrutt/feilet leverandørinnlogging gir ingen lokal innlogging.
- Ingen ekte innlogging simuleres i appen. Tester kan bruke isolerte testkontoer.

## API og lokal kjøring

- `GET /api/health/`: sjekker databaseforbindelse; 200 eller 503 uten feildetaljer.
- `GET /api/auth/session/`: konto eller null, tilgjengelige leverandører og
  CSRF-token. Svar skal ikke mellomlagres.
- `POST /api/auth/profile/`: innlogget bruker endrer bare eget visningsnavn.
- `POST /api/auth/logout/`: avslutter økten, også trygt når allerede utlogget.
- `POST /_allauth/browser/v1/auth/provider/redirect`: starter valgt leverandør.
- `/accounts/google/login/callback/` og `/accounts/github/login/callback/`
  håndteres av allauth. Andre allauth-kontofunksjoner eksponeres ikke.
- Vite videresender backend-ruter lokalt. PostgreSQL 17 kjøres med Docker Compose
  eller separat installasjon. Databaseporten bindes kun til loopback i Compose.
  Tilkobling, hemmeligheter og OAuth-nøkler settes lokalt via `.env`.

## Akseptansekriterier

1. Migrasjoner og backend-tester kjører mot PostgreSQL.
2. Anonyme API-svar røper ikke provider-ID, e-post eller token.
3. Første og gjentatt innlogging testes med leverandørsvar som inneholder
   ekstra persondata; bare tillatte felter blir liggende i database/økt.
4. CSRF mangler/er feil, ugyldig OAuth-state og ukjent leverandør avvises.
5. Profilendring uten innlogging avvises; andre brukeres navn kan ikke endres.
6. Økt varer over sideoppfriskning; utlogging ugyldiggjør gammel serverøkt.
7. Visningsnavn valideres i backend, og frontend viser validerings- og nettverksfeil.
8. Innloggingssiden og menyen kontrolleres på mobil og desktop, inkludert
   manglende konfigurasjon, navnevalg, bevart økt og feil ved utlogging.

## Før offentlig drift

Live OAuth med begge leverandører og produksjons-HTTPS må testes separat.
Rutine for sletting av utløpte økter (`clearsessions`), sikkerhetsoppdateringer,
backup og gjenoppretting må settes opp. Personvern, kontosletting, innsyn og
misbruksvern for offentlig registrering må være avklart før offentlig åpning.

## Verifikasjon av lokal leveranse

- Django-systemkontroll, migrasjoner og sju backend-tester mot PostgreSQL 17.11
  består. Testene dekker begge leverandørers callback-flyt med erstattede eksterne
  svar, dataminimering ved gjentatt innlogging, separate kontoer, CSRF, OAuth-state,
  profilvalidering og ugyldiggjøring av økt. Ingen migrasjoner mangler.
- TypeScript-kontroll, produksjonsbygg og 14 Playwright-tester består.
  Nettlesertestene isolerer API-svar og dekker mobil og desktop.
- Ekte lokal kjede fra Vite til Django og PostgreSQL er kontrollert i nettleser:
  helsesjekk, anonym økt, avvist POST uten CSRF og godkjent POST med CSRF.
  Innloggingssiden er visuelt kontrollert på mobil uten horisontal overløp.
- Docker manglet i arbeidsmiljøet. PostgreSQL og Chromium-biblioteker ble hentet
  til `/tmp` for kontrollene; Compose-filen er ikke kjørt her.
- Google-nøkler er nå lagt i lokal, Git-ignorert `.env`. Database, innloggingsside
  og videresending med riktig callback, `openid`, state og PKCE er kontrollert.
  Brukeren har bekreftet ekte Google-innlogging og retur til appen. Dette bekrefter
  ikke alene alle økt- og personvernkontrollene. GitHub er ikke konfigurert.

allauths kontroll `account.W001` er eksplisitt stilnet: den sammenligner
passordinnlogging med registreringsfelter selv om bare sosial innlogging er
aktivert. Ingen passord-, e-post- eller kontokoblingsruter er eksponert.
