# Spec 001 — Applikasjonsramme og startside

Status: Implementert prototype, klar for visuell evaluering.

## Formål

En klikkbar prototype av en læringsportal med **Notater** og **Easy Work**.
Første leveranse skal gjøre det mulig å vurdere utseende, navigasjon og plassbruk
før funksjonene og backend bygges.

## Utseende og oppførsel

- Fast, vertikal venstremeny og ett stort arbeidsområde til høyre.
- Mørk, EVE-inspirert stil: mørke flater, tynne panelkanter og diskrete lysende
  aksenter. Ingen flyttbare eller skalerbare vinduer.
- Startsiden viser bare **ACTION**, sentrert vannrett og loddrett i arbeidsområdet.
  Teksten har en diskret strek under seg. Ingen app er valgt.
- Når musepekeren beveges over ACTION, lysner teksten lokalt rundt pekeren med
  en svak cyan glød. Effekten forsvinner når pekeren forlater teksten. På
  berøringsskjermer vises teksten med streken, uten pekereffekten.
- Menyen er 56 px bred og viser bare ikoner på både desktop og mobil. Valgt app
  markeres. Dette gjelder også startsiden og inn-/utlogging.
- Kontrollene har tilgjengelige navn. Ved musepeker eller tastaturfokus vises
  navnet i en liten etikett til høyre for ikonet, over arbeidsområdet. Etiketten
  forsvinner når peker/fokus flyttes bort. Menyen utvides ikke og innholdet flyttes ikke.
- **Logg inn** ligger nederst når brukeren er utlogget. **Logg ut** vises på samme
  plass når brukeren er innlogget.
- Appbytte oppdaterer URL og arbeidsområde uten full sideinnlasting. Menyen blir
  stående. Lange sider ruller i arbeidsområdet uten å flytte menyen.
- Logoen øverst i menyen gir en vei tilbake til startsiden.

## Sider og tekniske rammer

React, TypeScript og Vite, med React Router for navigasjon. Backend blir senere
en separat applikasjon. Prototypen trenger ingen backend eller database.

| URL | Innhold |
| --- | --- |
| `/` | Bare ACTION i arbeidsområdet. |
| `/notes` | Overskriften Notater og kort plassholdertekst om notater, temafiltrering og kommentarer. |
| `/easy-work` | Overskriften Easy Work og kort plassholdertekst om kunnskapskart, temasider og øvelser. |
| `/login` | Tydelig merket demonstrasjon med «Simuler innlogging». Ingen passord samles inn. |
| Ukjent URL | «Siden finnes ikke» i arbeidsområdet med lenke til startsiden. |

- Simulert innlogging sender brukeren til `/` og bytter menyknappen til Logg ut.
- Utlogging nullstiller demonstrasjonstilstanden og sender brukeren til `/`.
- Innlogging holdes kun i minnet og nullstilles ved full sideinnlasting.
- Alle sider kan åpnes uten innlogging. Demonstrasjonen gir ingen reelle rettigheter.
- Direkte lenker og nettleserens frem- og tilbakeknapper fungerer. Hosting må sende
  frontendruter til `index.html`.
- Ingen backend-API-er eller datamodeller innføres.
- Felles layout, sideinnhold og simulert innlogging holdes adskilt. Notater og
  Easy Work har egne funksjonsmapper.

## Akseptansekriterier

1. `/` viser venstremenyen og ACTION sentrert i høyrepanelet, med en diskret
   understrek og lokal lysning som følger musepekeren over teksten.
2. Appvalg viser riktig plassholderside, URL og aktiv markering uten full sideinnlasting.
3. Direkte URL-er, oppfriskning og frem/tilbake viser riktig side.
4. Simulert innlogging og utlogging følger reglene over; oppfriskning gjenoppretter utlogget tilstand.
5. Ikonmenyen er 56 px bred på desktop og mobil, uten horisontal rulling ved
   360 px. Navn vises ved peker/fokus uten å flytte arbeidsområdet.
6. Navigasjonen kan brukes med tastatur og har synlig fokus. Tekst og kontroller har lesbar kontrast.
7. Ukjente URL-er viser feilsiden innenfor den samme rammen.
8. Typekontroll og produksjonsbygg passerer. Navigasjon og simulert innlogging
   kontrolleres med nettlesertester; utseendet vurderes på mobil og desktop.

## Avgrensning og designvalg

Ingen ekte kontoer, notatredigering, kommentarer, filtrering, opplasting eller
kunnskapskart bygges i denne leveransen. Det endelige produktet får offentlig
lesetilgang og personlig eierskap; prototypen implementerer ikke tilgangskontroll.

Utgangspunktet er nesten svart bakgrunn, mørkegrå paneler, lys tekst, dempet cyan,
systemfont og 56 px venstremeny på både desktop og mobil. Innholdets avstander
tilpasses under 640 px. Disse verdiene kan justeres etter visuell evaluering.

Vi jobber spec-anchored: avklar ønsket oppførsel, oppdater specen, implementer,
kontroller og evaluer. Avtalte endringer i oppførsel skal følges av endringer i
specen og relevante tester. Nye funksjonsområder får egne spesifikasjoner.

## Verifikasjon av første implementasjon

- TypeScript-kontroll og produksjonsbygg bestått.
- Åtte Playwright-tester bestått: fire scenarier på både 1440 × 900 og 360 × 800.
- Startside og plassholderside visuelt kontrollert med skjermbilder.
- Testmiljøets manglende Chromium-biblioteker ble hentet til `/tmp` og lastet via
  `LD_LIBRARY_PATH`; ingen endring av systeminstallasjonen eller appens kjøremiljø.
- Brukeren har godkjent den visuelle retningen. Understrek og lokal pekerglød
  er lagt til som første lille justering.
