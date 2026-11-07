# Spec 004 — Easy Work

Status: Første funksjonelle, lokale versjon. Produksjonsdrift er ikke inkludert.

## Formål og innhold

Et offentlig kunnskapskart for enkel repetisjon i alle fag. Hver stjerne har
tittel, teori i Markdown og inntil 50 oppgaver med stabile ID-er, Markdown-tekst
og valgfri fasit. Alle kan lese. Innlogging og valgt visningsnavn kreves for å
skrive. Bare originalens eier kan redigere eller slette den.

Innhold kan skrives i appen eller importeres som en versjonert JSON-fil med
Markdown-felt. Malen i `public/templates/star-v1.json` kan fylles ut utenfor
appen, for eksempel med AI. Import fyller editoren; eksplisitt lagring gjør
innholdet offentlig. Eksport bruker samme format. Ingen AI kjøres i appen.
Notater, teori, oppgaver og fasit bruker samme trygge Markdown-/mattevisning;
HTML, bilder og vedlegg støttes ikke. Teori har maks 50 000 tegn, tittel 120,
hver oppgave/fasit 10 000 og alle oppgaver samlet 150 kB.

## Kart og lån

- Hver bruker har ett kart, som starter tomt. Andres kart kan søkes opp og leses.
- Nye stjerner får halvtilfeldige koordinater med forsøk på avstand til naboer.
  Koordinatene lagres i databasen og endres ikke ved omlasting eller nye stjerner.
- Stjerner vises som lysende punkter. Peker eller tastaturfokus viser tittel og
  forbindelser. Trykk/klikk velger stjernen og viser en lenke til innholdet.
  Tekstsøk viser treff i kartet og som tilgjengelige lenker i en liste.
- Kartet kan rulles på små skjermer. Første versjon har inntil 200 aktive stjerner
  per kart; stor graf-layout og manuell flytting kommer eventuelt senere.
- En offentlig stjerne kan legges i eget kart som en referanse, ikke en kopi.
  Eiers lagrede oppdateringer vises ved neste henting; ingen sanntidssynkronisering.
- Brukeren kan koble to forskjellige stjerner i eget kart og fjerne forbindelser.
- «Fjern fra mitt kart» fjerner bare egen forekomst og dens forbindelser.
  Plassering og egen øving beholdes ved gjeninnlegging; forbindelser må lages på nytt.
- «Slett originalstjernen» krever bekreftelse og fjerner originalen fra alle kart,
  med forbindelser og øvingsdata. Selvstendige naboer og notater beholdes;
  notatenes kobling til den slettede stjernen fjernes. Dette følger ADR 002.

## Øving

Teori vises først, deretter én oppgave av gangen med forrige/neste, skjult fasit
og «Gjort – neste». Registrering krever at stjernen finnes i eget kart.
Egen øving lagres på serveren og deles ikke som offentlig progresjon.
Vi viser antall registrerte fullføringer og siste øving, uten å hevde mestring.
Samme oppgave telles én gang per runde. «Start ny runde» nullstiller markeringene,
men beholder antall og tidspunkt. Endret oppgave/fasit må gjøres på nytt;
stabile ID-er gjør at uendrede oppgaver beholder markeringen. Registrering fra
en foreldet stjerneversjon avvises med beskjed om å laste siden på nytt.

## Akseptansekriterier

1. En bruker kan opprette, lese, redigere og slette en stjerne med matematikk.
2. Import/eksport følger malen, avviser feil og bevarer oppgave-ID-er ved redigering.
3. Plassering overlever omlasting og gjeninnlegging. Lån viser originalens oppdateringer.
4. Kart, søk, valg og forbindelser fungerer med mus, tastatur og mobil.
5. Backend avviser endring av andres innhold, kart og øving, også ved direkte API-kall.
6. Original-sletting og kart-fjerning har forskjellig, testet effekt etter ADR 002.
7. Én oppgave vises om gangen; fullføring, ny runde og siste øving lagres per bruker.
8. Notater knyttet til en stjerne kan åpnes fra stjernen; sletting sletter ikke notatene.
9. Feil ved henting/lagring vises med mulighet til å prøve igjen; ulagret tekst beholdes.

## Avgrensning

Adaptiv lysstyrke, størrelse etter aktivitetsnivå, repetisjonsintervaller og
naboeffekt er fortsatt ideer i [idénotatet](../ideas/easy-work-stjernehimmel.md).
Første versjon bruker fast lysstyrke/størrelse og enkel registrering av øving.
Ingen automatisk retting, kontosletting, sanntidssamarbeid eller privat innhold.
Google/GitHub må konfigureres for manuell skrivetesting; det finnes ingen demo-login.

## Verifikasjon av lokal leveranse

TypeScript og produksjonsbygg består. Samlet består 22 backend-tester mot
PostgreSQL og 24 nettlesertester på mobil/desktop. Kartvisningen er kontrollert
på nytt etter siste stiljustering. En ekstra nettleserkontroll med to isolerte
brukere mot ekte Vite/Django/PostgreSQL verifiserte opprettelse, notatkobling,
kommentar, lån, oppdatering, øving, kartfjerning og sletting av originalen.
Testkontoer og testinnhold ble ryddet bort. Live Google/GitHub krever egne nøkler.
