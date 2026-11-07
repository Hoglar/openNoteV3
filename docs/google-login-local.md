# Google-innlogging lokalt

Status: Begge Google-feltene er satt lokalt. Database, innloggingsside og
videresending til Google med riktig callback, `openid`, state og PKCE er kontrollert.
Brukeren har også bekreftet vellykket ekte innlogging og retur fra Google.
GitHub og produksjonsoppsett tas senere.

## 1. Registrer appen hos Google

Åpne [Google Cloud Console](https://console.cloud.google.com/) med din egen
Google-konto. Opprett og velg prosjektet `openNote-local`, og åpne
**Google Auth Platform** (bruk søkefeltet i konsollen).

Konfigurer appinformasjonen via **Get started / Branding**:

- Appnavn: `openNote lokal`.
- Support og kontaktadresse: en e-postadresse du selv har tilgang til.
- Målgruppe (**Audience**): **External**. Behold **Testing** for lokal utvikling.
- Legg gjerne egen Google-konto til under **Test users**.
- Under **Data Access** bruker vi bare `openid`; ingen ekstra API-tilganger.
  Det er backendens forespørsel som bestemmer hvilke scopes som faktisk brukes.

Gå til **Clients → Create client**:

| Felt | Verdi |
| --- | --- |
| Application type | Web application |
| Name | openNote local web |
| Authorized redirect URIs | `http://127.0.0.1:5173/accounts/google/login/callback/` |

**Authorized JavaScript origins** kan stå tomt: innloggingen starter i Django
med en serverstyrt redirect, uten Googles JavaScript-SDK.
Bevar hele callback-adressen, inkludert avsluttende `/`.

Ta vare på **Client ID** og **Client secret** når klienten opprettes.
Google kan vise hemmeligheten bare ved opprettelsen. Eventuell nedlastet
klientfil oppbevares utenfor repositoryet.

## 2. Legg nøklene i lokal konfigurasjon

Fyll inn de eksisterende feltene i `.env` i prosjektroten:

```dotenv
GOOGLE_CLIENT_ID=din-klient-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=din-klienthemmelighet
```

Bytt ut eksempelverdiene, og behold de andre innstillingene. `.env` er ignorert
av Git. Nøklene skal ikke inn i chat, skjermbilder, `.env.example` eller `VITE_*`.

## 3. Start og prøv

PostgreSQL må kjøre med innstillingene fra `.env`. Bruk lokal Compose eller en
egen PostgreSQL-installasjon som beskrevet i [README](../README.md#kjør-lokalt).

Kjør migrasjoner og start backend:

```sh
backend/.venv/bin/python backend/manage.py migrate
backend/.venv/bin/python backend/manage.py runserver 127.0.0.1:8000
```

Start frontend i en annen terminal på den registrerte porten:

```sh
npm run dev -- --port 5173 --strictPort
```

Åpne `http://127.0.0.1:5173/login`, velg **Fortsett med Google** og logg inn.
Velg et visningsnavn når du kommer tilbake. Ved endring av nøkler må backend
startes på nytt. Bruk `127.0.0.1` gjennom hele flyten, ikke bytt til `localhost`.

### Klargjort arbeidsmiljø uten Docker

I dette arbeidsmiljøet er PostgreSQL 17.11 pakket ut under `.local/postgres/runtime`.
Databasen ligger i `.local/postgres/data`, og migrasjonene er kjørt. Hele `.local/`
er ignorert av Git. Behold mappen for å beholde lokale kontoer og notater.
Dette er et lokalt utviklingsoppsett; det erstatter ikke et produksjonsoppsett.

Ved senere oppstart, kjør fra prosjektroten før backend:

```sh
LD_LIBRARY_PATH="$PWD/.local/postgres/runtime/usr/lib/x86_64-linux-gnu" \
  .local/postgres/runtime/usr/lib/postgresql/17/bin/pg_ctl \
  -D .local/postgres/data -l .local/postgres/server.log \
  -o "-h 127.0.0.1 -k $PWD/.local/postgres -p 5432" start
```

Bruk enten denne databasen eller Compose på port 5432, ikke begge samtidig.
Mappen finnes bare i dette klargjorte arbeidsmiljøet; en ny checkout følger
det ordinære databaseoppsettet i README.

## 4. Kontroll av hele innloggingsflyten

- Google-knappen er aktiv, og avbrutt innlogging gir forståelig tilbakemelding.
- Ekte innlogging returnerer til appen og lar en ny bruker velge visningsnavn.
- Oppfriskning bevarer økten, og et notat eller en stjerne kan lagres.
- Utlogging avslutter økten. Ny Google-innlogging finner samme konto og innhold.
- Backend beholder bare avtalte kontodata etter Spec 003; klienthemmelighet,
  leverandørtokens og øvrige Google-profildata eksponeres ikke i offentlige svar.

Ekte Google-innlogging og retur til appen er bekreftet av brukeren. De øvrige
punktene er ikke særskilt bekreftet manuelt. Automatiserte tester dekker økter,
eierskap og dataminimering med simulerte leverandørsvar.

## Vanlige feil

- Deaktivert knapp: kontroller at begge Google-feltene er fylt ut og start backend på nytt.
- `redirect_uri_mismatch`: sammenlign callback-adressen med tabellen, særlig vert,
  port og avsluttende skråstrek. Bruk port 5173 også i nettleseren.
- `invalid_client`: kontroller at ID og secret tilhører samme webklient.
- Manglende tilgang hos Google: kontroller valgt prosjekt, Audience og eventuelle
  testbrukere; en administrert skolekonto kan ha egne begrensninger.
- API eller innlogging kan ikke hentes: kontroller at både PostgreSQL og Django kjører.

Kilder: [Googles OpenID Connect-oppsett](https://developers.google.com/identity/openid-connect/openid-connect),
[OAuth for webservere](https://developers.google.com/identity/protocols/oauth2/web-server#creatingcred).
Produksjon får et separat Google-prosjekt og HTTPS-adresser etter
[Googles krav om separate miljøer](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance).
