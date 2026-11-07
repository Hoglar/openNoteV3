# Spec 002 — Notater

Status: Første funksjonelle, lokale versjon. Innlogging følger Spec 003.

## Formål

Brukerne skal kunne skrive læringsnotater, lese hverandres notater, kommentere
og finne innhold etter tema.

## Avklart oppførsel

- Notater skrives direkte i Markdown, med forhåndsvisning av det formaterte
  innholdet. Brukeren kan skrive selv eller lime inn Markdown laget utenfor appen.
- På større skjermer vises skrivefeltet til venstre og forhåndsvisningen til
  høyre. På mobil bytter brukeren mellom «Skriv» og «Forhåndsvis».
- Visningen støtter overskrifter, fet og kursiv tekst, lister, lenker, kodeblokker
  og matematikkformler med LaTeX-syntaks.
- Første versjon har tekstbasert innhold, inkludert kode og matematikk, uten
  bilder eller vedlegg. Dette gjelder både notater og kommentarer.
- Matematikk skal vises tydelig både inne i tekst med `$...$` og på egne linjer
  med `$$...$$`. Brøker, potenser, indekser, greske bokstaver, integraler,
  summer og likninger over flere linjer skal støttes i forhåndsvisning og lesing.
- Alle kan lese notater og kommentarer uten konto. Innlogging kreves for å
  opprette innhold og kommentere. Bare eieren kan endre eller slette eget innhold.
- Brukeren lagrer eksplisitt med «Lagre». Når lagringen lykkes, er notatet
  offentlig tilgjengelig. Det finnes ingen privat utkaststatus eller eget
  publiseringssteg.
- Eieren kan åpne et lagret notat, redigere det og lagre på nytt. Andre ser
  den sist lagrede versjonen frem til endringene er lagret.
- Kommentarer og filtrering etter tema inngår i første funksjonelle notatversjon.
- Et notat kan ha flere temaetiketter, for eksempel `matematikk`, `Fourier`
  og `integrasjon`. Notater er ikke begrenset til én kategori eller mappe.
- Notatoversikten skal ha tekstsøk og filtrering etter temaetiketter. Et valg
  av en etikett gir tilgang til notater med dette temaet. Søk og temafilter
  skal kunne brukes sammen.
- Temaetikettene fungerer uavhengig av stjerner. Kobling til en stjerne er
  valgfri, og det skal være mulig å skrive og organisere notater uten et kart.
- Notater skal kunne kobles til stjerner i Easy Work. For eksempel kan et
  refleksjonsnotat om Fourier-rekker knyttes til Fourier-stjernen. Notatet kan kobles til inntil ti delte stjerner. Koblingen peker på
  originalinnholdet, uavhengig av hvilke kart stjernen ligger i.

## Kommentarer

- Kommentarene vises i én flat liste under notatet, med forfatterens navn og
  tidspunkt. Svartråder inngår ikke i første versjon.
- Kommentarer skrives i Markdown og vises formatert, med støtte for kode og
  matematikkformler som i notatene.
- Hver kommentar har «Kopier Markdown», som kopierer den opprinnelige teksten
  med formateringstegn, kode og formelsyntaks bevart.
- Innloggede brukere kan legge til kommentarer. Forfatteren kan redigere og
  slette sine egne kommentarer. Alle kan lese og kopiere kommentarene.

## Akseptansekriterier

1. Markdown-tekst vises formatert i forhåndsvisningen, inkludert kode og matte.
2. Brukeren kan endre teksten og se endringene i forhåndsvisningen.
3. Bytte mellom skriving og forhåndsvisning på mobil bevarer teksten.
4. Ved senere redigering er den opprinnelige Markdown-teksten tilgjengelig.
5. Et notat kan merkes med flere temaetiketter og finnes via hver av dem.
6. Notatoversikten lar brukeren søke og filtrere på tema, også i kombinasjon.
7. Et notat kan opprettes og organiseres med etiketter uten kobling til en stjerne.
8. Etter vellykket lagring kan notatet leses uten innlogging, uten et separat
   publiseringssteg.
9. Eieren kan redigere et eksisterende notat. Ulagrede endringer erstatter ikke
   den offentlige versjonen; vellykket lagring gjør den oppdaterte versjonen tilgjengelig.
10. Kommentarer vises under notatet med navn og tidspunkt, uten svartråder.
11. Markdown, kode og matematikk vises formatert i kommentarer. «Kopier Markdown»
    kopierer Markdown-kilden, slik at den kan limes inn og brukes videre.
12. Kommentarforfatteren kan redigere og slette egne kommentarer; andre brukere
    har ikke denne tilgangen.
13. Inline-formler og egne formelblokker gjengis riktig i både notater og
    kommentarer. Kontrollen inkluderer brøker, integraler, summer og likninger
    over flere linjer, for eksempel uttrykk fra Fourier-rekker.
14. Brede formelblokker kan leses på mobil, med lokal horisontal rulling ved
    behov, uten at hele siden blir bredere enn skjermen.

## Konkret oppførsel og avgrensning

- Søk dekker tittel og Markdown-tekst, uten forskjell på store/små bokstaver.
  Flere valgte etiketter krever treff på alle. Søk og filtre ligger i URL-en.
- Brukeren skriver etiketter separert med komma; mellomrom normaliseres,
  navn lagres med små bokstaver og duplikater fjernes. Maks ti etiketter,
  40 tegn per etikett. Tittel har maks 160 tegn, tekst 50 000 og kommentar 10 000.
- Oversikter og kommentarer har paginering med 20 resultater per side.
- Editor viser at lagring gjør innhold offentlig. Lagringsfeil bevarer teksten.
  Ulagrede redigeringer varsles ved navigasjon og lukking av fanen så langt
  nettleseren støtter dette. Ingen lokal automatisk utkastlagring.
- Et notat kan lenke til flere offentlige stjerner, også uten at de er i eget kart.
  Stjernens side lenker til filtrert notatoversikt. Fjerning fra et kart påvirker
  ikke notatet; sletting av originalstjernen fjerner bare koblingen.
- Sletting av et notat krever bekreftelse og sletter også kommentarene.
- HTML og bilder gjengis ikke. Lenker valideres, og matematikk kjøres uten
  tillit til HTML/eksterne ressurser. Brede kodeblokker, tabeller og formler ruller lokalt.
- Kopiering viser kvittering eller feil dersom nettleseren nekter utklippstavlen.
- Import av Markdown-fil, vedlegg, svartråder og private notater inngår ikke.
  Markdown kan limes direkte inn i editoren.

[Spec 004](004-easy-work.md) beskriver stjerner og kart. Backend håndhever
innlogging, valgt visningsnavn og eierskap; skjulte knapper er ikke tilgangskontroll.

## Verifikasjon av lokal leveranse

TypeScript og produksjonsbygg består. Samlet består 22 backend-tester mot
PostgreSQL og 24 nettlesertester på mobil/desktop. Kartvisningen er kontrollert
på nytt etter siste stiljustering. En ekstra nettleserkontroll med to isolerte
brukere mot ekte Vite/Django/PostgreSQL verifiserte opprettelse, notatkobling,
kommentar, lån, oppdatering, øving, kartfjerning og sletting av originalen.
Testkontoer og testinnhold ble ryddet bort. Live Google/GitHub krever egne nøkler.
