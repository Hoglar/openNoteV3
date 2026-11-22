# Arbeidsavtale for openNote

## Overordnet arbeidsområde og fagmapper

Prosjektroten er det overordnede arbeidsområdet for utvikling, arkitektur,
produktvalg og koordinering. Behold helheten her; utvikling flyttes ikke til en fagmappe.

- `business/` samler fagarbeid for økonomi, juss/personvern, markedsføring,
  kvalitetssjekk, sikkerhet og drift. Se [oversikten](business/README.md).
- Ved arbeid med et bestemt fagområde, les `business/AGENTS.md` og den aktuelle
  mappens `AGENTS.md`, også når sesjonen startet i prosjektroten. Les bare
  relevante fagmandater; vanlige utviklingsoppgaver krever ikke alle fagområdene.
- Fagarbeid skal kunne bygge på relevant kode og dokumentasjon i hele prosjektet,
  innenfor arbeidsmiljøets faktiske tillatelser. Fagmappen avgrenser fokus, ikke lesebehov.
- Fagmappene er dokumentasjon og instrukser. De starter ikke egne agenter eller
  gir nye tekniske tilganger. Ingen automatisk delegering innføres med denne strukturen.
- Faglige forslag blir avtalte krav gjennom samme spec-anchored arbeidsflyt som øvrig arbeid.

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
