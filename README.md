# openNote

En læringsportal med React-frontend og Django/PostgreSQL-backend. Appens ramme
og serverstyrt innlogging, Notater og Easy Work er implementert for lokal testing. Google/GitHub krever egne OAuth-nøkler;
leverandørene vises deaktivert til de er konfigurert.

## Kjør lokalt

Krever Node.js 20.19+ eller 22.12+, Python 3.13 og Docker med Compose
(eller en separat PostgreSQL 17-installasjon). Kommandoene er for Linux/macOS.

Første oppsett, fra prosjektroten:

```sh
python3 scripts/init_local.py
python3 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
docker compose up -d --wait db
backend/.venv/bin/python backend/manage.py migrate
npm ci
```

Start backend i én terminal og frontend i en annen:

```sh
backend/.venv/bin/python backend/manage.py runserver 127.0.0.1:8000
```

```sh
npm run dev
```

Åpne http://127.0.0.1:5173. Vite videresender API og innlogging til backend.
Bruk samme vertsnavn gjennom hele OAuth-flyten; ikke bytt mellom localhost
og 127.0.0.1. API-status finnes på `/api/health/` gjennom Vite.

`.env` er ignorert av Git. Oppstartsskriptet lager tilfeldige lokale hemmeligheter
og overskriver aldri en eksisterende fil. Med separat PostgreSQL tilpasses
`POSTGRES_*` i `.env`; databasen og brukeren må opprettes på forhånd.
`docker compose stop` stopper databasen uten å fjerne data.

## Google og GitHub lokalt

Vi begynner med Google. Følg [stegvis oppsett av lokal Google-innlogging](docs/google-login-local.md).

Registrer en Google OAuth-klient av typen webapplikasjon og en GitHub OAuth App.
Bruk separate leverandørapper/nøkler for lokal testing og senere produksjon.
Callback-adresser for lokal utvikling er:

- Google: `http://127.0.0.1:5173/accounts/google/login/callback/`
- GitHub: `http://127.0.0.1:5173/accounts/github/login/callback/`

GitHub Homepage URL og eventuell Google JavaScript origin settes til
`http://127.0.0.1:5173`. Fyll inn `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GITHUB_CLIENT_ID` og `GITHUB_CLIENT_SECRET` i `.env`, og start backend på nytt.
Behold Google-prosjektet i testmodus under lokal utvikling; se veiledningen over.
Nøklene skal aldri settes i `VITE_*` eller deles i chat/Git.

Appen ber om Google `openid` og ingen ekstra GitHub-scopes. Etter første
innlogging velger brukeren et visningsnavn. Profilnavn og e-post importeres ikke.
Innlogging kan testes uten nøklene med backend-testene, som erstatter svarene
fra eksterne leverandører. Brukeren har bekreftet ekte Google-innlogging lokalt.
GitHub og innlogging på produksjonsdomenet er ennå ikke verifisert.

## Prøv Notater og Easy Work

Kjør `backend/.venv/bin/python backend/manage.py migrate` etter oppdateringen.
Åpne **Notater** for å skrive Markdown med matte, etiketter og kommentarer.
Lagring gjør innholdet offentlig umiddelbart. **Easy Work** starter med et tomt
kart; opprett en stjerne med teori og oppgaver, eller lån en fra biblioteket.
Alle kart er lesbare uten konto. Skriving krever Google/GitHub og valgt visningsnavn.

Stjerneeditoren tilbyr [en nedlastbar JSON-mal](public/templates/star-v1.json).
Den inneholder `version: 1`, `title`, `theory` og `exercises` med `id`, `prompt`
og `answer`. Teori, oppgavetekst og fasit er Markdown. Bruk stabile, unike
oppgave-ID-er når du oppdaterer eksisterende innhold. I JSON må bakstreker
skrives dobbelt, for eksempel `\\int`, og linjeskift som `\n`. Import fyller
editoren; kontroller og lagre. Eksport bruker samme format og kan importeres igjen.

Bruk `$...$` for inline-matte og `$$` på separate linjer før og etter en formelblokk.
En stjerne viser én oppgave om gangen; «Gjort – neste» registrerer egen øving.
«Start ny runde» bevarer antall og siste tidspunkt. Adaptiv lysstyrke,
repetisjonsalgoritme og AI i appen er ikke implementert.

## Kontroller

```sh
backend/.venv/bin/python backend/manage.py check
backend/.venv/bin/python backend/manage.py test accounts notes easywork
npm run build
npx playwright install chromium
npm run test:e2e
```

Bygget kjører TypeScript-kontroll og lager `dist/`. Nettlesertestene starter selv
en produksjonsforhåndsvisning på port 4173 og tester desktop og mobil.
`npm run typecheck` kjører bare typekontrollen.
Nettlesertestene isolerer API-svar for å teste grensesnittet. Backend-testene
kjører migrasjoner og innloggingsflyten mot en ekte PostgreSQL-testdatabase,
med simulerte eksterne OAuth-svar. Databasebrukeren trenger `CREATEDB` for testene;
brukeren i det lokale Compose-oppsettet har dette. Ikke gi appens produksjonsbruker
slike rettigheter.

På Linux kan Chromium også trenge systembiblioteker. Installer dem ved behov med
`npx playwright install-deps chromium` (krever administratortilgang).

## CI på GitHub

[CI-workflowen](.github/workflows/ci.yml) kjører ved push til `main` og pull
requests mot `main`. Under repositoryets **Actions → CI** vises to jobber:
**Frontend** (bygg og nettlesertester) og **Backend** (Django, migrasjoner og
PostgreSQL-tester). Kjøringen kan også startes manuelt når workflowen ligger
på standardgrenen. Ingen Google-/GitHub-nøkler må legges inn som Actions-secrets.

Ved feil: åpne den røde jobben og det feilede steget. Feilede nettlesertester
gir en nedlastbar rapport med spor og skjermbilder, oppbevart i sju dager.
Grønn status betyr at disse kontrollene består; appen blir ikke publisert.
GitHubs branch-regler må konfigureres separat dersom grønn CI skal være et
krav før fletting. Se [Spec 005](docs/specs/005-ci.md) for omfang og begrensninger.

Workflowen må pushes sammen med appkoden, migrasjonene og testene den bruker.
Første kjøring på GitHub gjenstår til dette er gjort.

## Spesifikasjon og struktur

- [Arbeidsavtale for AI-agenter](AGENTS.md)
- [Spec 001: applikasjonsramme](docs/specs/001-app-shell.md)
- [Spec 002: Notater](docs/specs/002-notes.md)
- [Spec 003: innlogging og lokal backend](docs/specs/003-auth.md)
- [Spec 004: Easy Work](docs/specs/004-easy-work.md)
- [Spec 005: kontinuerlig integrasjon](docs/specs/005-ci.md)
- [Arkitektur og videre produktretning](docs/architecture.md)
- [ADR 001: innlogging og dataminimering (vedtatt)](docs/adr/001-innlogging-og-dataminimering.md)
- [ADR 002: eierskap og sletting av stjerner (vedtatt)](docs/adr/002-eierskap-og-sletting-av-stjerner.md)
- [ADR 003: backend, database og driftsretning (lokalt grunnlag implementert)](docs/adr/003-backend-database-og-drift.md)
- `src/app`: ruter og fast layout.
- `src/features`: separate funksjonsområder for notater, Easy Work og innlogging.
- `src/shared`: felles komponenter.
- `backend/config`: Django-oppsett og ruter.
- `backend/accounts`: brukermodell, innlogging, profildata og tester.
- `backend/notes`: notater, etiketter, kommentarer og koblinger til stjerner.
- `backend/easywork`: stjerner, kart, forbindelser og personlig øving.
- `backend/common`: felles API-validering og tilgangskontroll.

Vi jobber spec-anchored: oppdater forventet oppførsel i specen når vi avtaler
endringer, implementer, kontroller og evaluer resultatet.

## Hosting senere

Dette arbeidet publiserer ikke nettstedet. `dist/` kan senere serveres statisk,
men verten må sende ukjente frontendruter til `index.html` slik at direkte lenker
som `/easy-work` fungerer. Bevar vanlig servering av statiske filer. Vite dev og
preview håndterer denne SPA-reserven lokalt.

Backend-rutene `/api/`, `/accounts/` og `/_allauth/` må gå til Django før
SPA-reserven. Compose-filen og Djangos utviklingsserver er kun for lokal testing.
Produksjon trenger HTTPS-proxy, produksjonsserver, begrenset databasebruker,
backup, oppdateringsrutiner og personvernavklaringene i ADR 001.

Sett `DJANGO_ENV=production`, eget `DJANGO_SECRET_KEY` og eksplisitte
`DJANGO_ALLOWED_HOSTS` ved produksjonsoppsett. Secure-cookies og HTTPS-redirect
er da aktivert. Konfigurasjon for TLS-terminering må tilpasses en betrodd proxy;
videresendte sikkerhetsheadere stoles ikke blindt på i dette grunnoppsettet.
Kjør `manage.py clearsessions` regelmessig for å slette utløpte serverøkter.
