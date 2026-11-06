# openNote

En læringsportal med notater og Easy Work. Foreløpig er dette en lokal, klikkbar
prototype av appens ramme, med plassholdersider og simulert innlogging.

## Kjør lokalt

Krever Node.js 20.19+ eller 22.12+ (en støttet LTS-versjon anbefales).

```sh
npm ci
npm run dev
```

Åpne adressen Vite skriver ut, normalt http://127.0.0.1:5173.

## Kontroller

```sh
npm run build
npx playwright install chromium
npm run test:e2e
```

Bygget kjører TypeScript-kontroll og lager `dist/`. Nettlesertestene starter selv
en produksjonsforhåndsvisning på port 4173 og tester desktop og mobil.
`npm run typecheck` kjører bare typekontrollen.

På Linux kan Chromium også trenge systembiblioteker. Installer dem ved behov med
`npx playwright install-deps chromium` (krever administratortilgang).

## Spesifikasjon og struktur

- [Arbeidsavtale for AI-agenter](AGENTS.md)
- [Spec 001: applikasjonsramme](docs/specs/001-app-shell.md)
- [Spec 002: Notater (under avklaring)](docs/specs/002-notes.md)
- [Arkitektur og videre produktretning](docs/architecture.md)
- [ADR 001: innlogging og dataminimering (vedtatt)](docs/adr/001-innlogging-og-dataminimering.md)
- [ADR 002: eierskap og sletting av stjerner (vedtatt)](docs/adr/002-eierskap-og-sletting-av-stjerner.md)
- [ADR 003: backend, database og driftsretning (valgt, ikke implementert)](docs/adr/003-backend-database-og-drift.md)
- `src/app`: ruter og fast layout.
- `src/features`: separate funksjonsområder for notater, Easy Work og demo-innlogging.
- `src/shared`: felles komponenter.

Vi jobber spec-anchored: oppdater forventet oppførsel i specen når vi avtaler
endringer, implementer, kontroller og evaluer resultatet.

## Hosting senere

Dette arbeidet publiserer ikke nettstedet. `dist/` kan senere serveres statisk,
men verten må sende ukjente frontendruter til `index.html` slik at direkte lenker
som `/easy-work` fungerer. Bevar vanlig servering av statiske filer. Vite dev og
preview håndterer denne SPA-reserven lokalt.

Ingen ekte kontoer eller brukerdata lagres. Simulert innlogging nullstilles når
siden lastes helt på nytt.
