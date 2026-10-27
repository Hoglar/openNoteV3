# Arbeidsavtale for openNote

## Spec-anchored utvikling

Vi utvikler prosjektet i små steg. Spesifikasjonene er et levende holdepunkt
for avtalt oppførsel, og skal holdes i samsvar med implementasjonen.

- Les relevant spec i `docs/specs/` før endringer. Les `docs/architecture.md`
  når arbeidet berører arkitektur eller grensene mellom funksjonsområder.
- Når brukeren ber om eller avtaler en endring i utseende, funksjonalitet eller
  oppførsel, oppdater relevant spec før eller sammen med implementasjonen i
  samme oppgave. Brukeren skal ikke måtte be separat om dokumentasjonsendringen.
- Oppdater berørte beskrivelser, akseptansekriterier og avgrensninger. Fjern
  utdaterte eller motstridende formuleringer, slik at specen beskriver den nye
  avtalte løsningen.
- Skill mellom diskusjon og beslutninger. Spørsmål, forslag og løse ideer er
  ikke automatisk nye krav. Avklar vesentlig usikkerhet før den gjøres til et krav.
- En tydelig endringsbestilling er tilstrekkelig grunnlag for å oppdatere spec
  og kode; det kreves ingen ekstra godkjenningsrunde for små, avklarte endringer.
- Ved ren planlegging oppdateres bare dokumentasjon innenfor avtalt omfang.
  Marker planlagt funksjonalitet som planlagt, ikke som implementert.
- Nye funksjonsområder får egne, korte spesifikasjoner i `docs/specs/` med
  formål, forventet oppførsel, avgrensning og akseptansekriterier. Små justeringer
  gjøres i den eksisterende specen.
- Dokumenter endrede arkitekturvalg og begrunnelsen i `docs/architecture.md`.
- Feilrettinger som gjenoppretter spesifisert oppførsel og interne refaktoreringer
  uten endret oppførsel trenger ikke en kunstig spec-endring. Ikke omskriv krav
  for å legitimere en feil i implementasjonen.

## Kontroll og overlevering

- Tilpass eksisterende tester når forventet oppførsel endres. Kjør kontroller
  som er relevante for endringen; dokumentasjonsendringer alene krever ikke app-tester.
- `npm run build` kontrollerer TypeScript og produksjonsbygg.
  `npm run test:e2e` kjører nettlesertestene mot et ferdig bygg.
- Hold dokumentasjonen kort og på norsk. Beskriv avtalt resultat, ikke hele
  samtalehistorikken.
- Oppsummer hva som ble endret, hvilken spec som ble oppdatert og hva som er
  kontrollert. Oppgi eventuelle gjenstående begrensninger ærlig.
