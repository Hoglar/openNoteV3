# Spec 007 — Fagmapper og overordnet utviklingsarbeid

Status: Implementert som dokumentasjon og instrukser. Ingen nye produktfunksjoner.

## Formål

Gi fagarbeid et tydelig fokus og et sted å lagre informasjon, samtidig som
prosjektroten er det overordnede arbeidsområdet for utvikling og produktvalg.

## Forventet arbeidsmåte

- `business/` inneholder `finance`, `legal`, `marketing`, `review`, `security`
  og `operations`. Hver mappe har en kort `AGENTS.md` og en README med grunnlag
  og mulige neste oppgaver. Vurderingsnotater opprettes ved behov.
- Rotens `AGENTS.md` er den felles arbeidsavtalen. `business/AGENTS.md` samler
  faglige arbeidsregler, og den enkelte fagmappe gir sitt mandat.
- Fagarbeid skal undersøke relevante deler av hele prosjektet. Tilgang gis av
  arbeidsmiljøet, ikke av instruksjonsfilene; hele repositoryet må være tilgjengelig.
- Brukeren kan starte en sesjon i fagmappen eller be om fagfokus fra roten.
  I sistnevnte tilfelle leses felles fagregler og det aktuelle mandatet eksplisitt.
- Specs, ADR-er og eksisterende arkitektur-/driftsdokumenter beholder sine
  roller og plasseringer. Fagnotater lenker til felles fakta og skiller forslag fra vedtak.

## Avgrensning

Ingen separate agentprosesser, automatisk delegering eller nye tilganger
opprettes. Ingen obligatoriske faglige godkjenningsrunder innføres. Mappene
innebærer ikke at faglige kontroller er gjennomført eller at åpne spørsmål er løst.

## Akseptansekriterier

1. Roten beskrives som overordnet utviklingsområde i arbeidsavtalen og oversikten.
2. Alle seks fagmapper har mandat og en startside med relevante dokumentlenker.
3. Mandatene støtter lesing på tvers av prosjektet uten å love nye rettigheter.
4. Oversikten forklarer både ny sesjon i fagmappe og fagfokus fra prosjektroten.
5. Ingen konkurrerende kopier av specs, vedtak eller gjeldende budsjett opprettes.
6. Lokale dokumentlenker og formatering kontrolleres. App-tester er ikke nødvendige
   for denne rene dokumentasjonsendringen.
