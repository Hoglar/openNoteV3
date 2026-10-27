# Arkitekturvalg

## Frontend og backend er egne applikasjoner

Vi ønsker tydelige ansvarsområder og å lære API-basert utvikling. Frontend viser
innhold og sender forespørsler; den fremtidige backend validerer data, håndhever
eierskap og lagrer i en relasjonsdatabase. Bare backend skal ha databasetilgang.
Avveiningen er mer oppsett og koordinering enn med én samlet applikasjon.

Begge kan bo i dette repositoryet. Foreløpig finnes bare frontend. Backend og
databaseteknologi er ikke valgt. Backend er tenkt som en modulær monolitt, ikke
separate tjenester for hver funksjon.

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

## Videre produktretning (ikke implementert)

- Notater med kommentarer fra første funksjonelle versjon og filtrering etter tema.
- Easy Work med personlige kunnskapskart og opplastede Markdown-sider med
  matematikkformler, forklaringer, overkommelige øvelser og fasit.
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
fra det delte innholdet. Sletting av originalinnhold må avklares separat fra
fjerning av en stjerne fra eget kart.
