# ADR 003 — Backend, database og driftsretning

Dato: 2026-11-06
Status: Valgt på brukerens delegerte mandat. Planlagt, ikke implementert.

## Kontekst

Én person skal kunne utvikle og drifte openNote. Sikkerhet, lite vedlikehold og
forutsigbare kostnader prioriteres. Løsningen skal kunne vokse gradvis og bevare
den avtalte separasjonen mellom React-frontend og backend.

## Beslutning

- Behold React og TypeScript i frontend.
- Bruk Python med Django og Django REST Framework for backend og JSON-API.
  Start med Django 5.2 LTS og siste tilgjengelige sikkerhetsoppdatering.
  Serien har utvidet støtte til april 2028; oppgradering planlegges før støtteutløp.
  [Djangos støtteoversikt](https://www.djangoproject.com/download/).
- Bruk PostgreSQL i en støttet versjon, med Django-migrasjoner. Fastsett konkrete,
  kompatible pakkeversjoner og databaseversjon ved implementering.
- Bruk django-allauth for Google/GitHub, med headless-støtten for React.
  [Headless-støtte](https://docs.allauth.org/en/latest/headless/introduction.html).
- Bygg backend som en modulær monolitt: én deploybar applikasjon med egne
  moduler for kontoer, Notater og Easy Work. Modulene eier sine regler og
  datamodeller; koblinger mellom dem skal være eksplisitte.
- Bruk én database. Stjerner og forbindelser modelleres som relasjoner;
  stjernekartet krever ikke i seg selv en egen grafdatabase.

Frontend og backend har separate kodebaser og bygg i samme repository.
I produksjon eksponeres de under samme HTTPS-origin: frontend på vanlige ruter,
API og innlogging på egne reserverte ruter. En proxy ruter forespørslene.
Dette forenkler cookies og nettlesertilgang uten å blande ansvarsområdene.
Frontend får aldri direkte databasetilgang.

## Sikkerhet og dataminimering

Innlogging følger [ADR 001](001-innlogging-og-dataminimering.md). Bruk
serverlagrede Django-økter i PostgreSQL, sikker øktcookie og CSRF-beskyttelse.
Eierskap kontrolleres i backend ved hver endring, også ved kobling til andre
objekter. Bibliotekene erstatter ikke appens egne tilgangsregler og tester.

allauth må tilpasses dataminimeringen; standardoppsett er ikke tilstrekkelig.
Bruk en egen brukermodell uten e-postkrav og uten egne passordflyter. Begrens
scopes, deaktiver varig tokenlagring og automatisk kontokobling via e-post.
Filtrer bort ekstra profildata og e-postadresser før de kan havne i brukermodell,
leverandørprofil, økt eller logger. Kontroller dette både ved første og senere
innlogging; faktisk datalagring må testes før løsningen tas i bruk.
[allauth-konfigurasjon](https://docs.allauth.org/en/latest/socialaccount/configuration.html),
[tilpasset brukermodell](https://docs.allauth.org/en/latest/account/advanced.html).

Før offentlig drift skal implementeringen også ha:

- Trygg Markdown- og mattevisning: ingen kjøring av brukerlevert HTML eller
  skript, og begrensning av lenkeprotokoller og ressursbruk.
- Validering, størrelsesgrenser, paginering og begrensning av forespørselsrate,
  særlig for innlogging og skriving. Konkrete grenser settes i funksjonenes specs.
- Tester som forsøker å endre andre brukeres innhold, omgå innlogging og CSRF,
  og lagre innhold som kan angripe andre lesere.
- Låste avhengigheter, rutine for sikkerhetsoppdateringer, hemmeligheter utenfor
  repositoryet og separate utviklings- og produksjonsinnstillinger.
- Begrensede logger, sikkerhetskopier med avklart oppbevaring og testet
  gjenoppretting. Personvern- og sletteavklaringer fra ADR 001 gjelder fortsatt.

## Økonomi, drift og vekst

Egen drift på en liten VPS er valgt for starten, med EØS-region som preferanse.
Brukeren aksepterer vedlikeholdsansvaret og ønsker å lære serverdrift.
Dette erstatter den opprinnelige preferansen for administrert drift.
Brukeren har avklart et samlet
startbudsjett på maksimalt **140 NOK per måned**, inkludert mva og nødvendige
driftskostnader. Eksisterende domene holdes utenfor budsjettet.

Leverandør, avtaler, sikkerhetskopier og samlet pris vurderes før bestilling.
App og database skal i starten dele én VPS, med helst 4 GB RAM som avtalt
startpreferanse. Faktisk ressursbehov må testes. Hetzner undersøkes først og
OVHcloud er alternativet, forutsatt bekreftet total innenfor budsjettet.
Vi håndterer operativsystem,
database, oppdateringer og gjenoppretting selv. Administrert drift kan vurderes
senere hvis budsjett eller behov endres. Se
[foreløpig hostingvurdering](../hosting.md). Ingen leverandør er valgt.

Start med én liten backend-instans og én database. Frontend bygges til statiske
filer. Hold totalen innenfor 140 NOK med margin for valuta og betalingsgebyrer,
og avklar kostnader for lagring, trafikk og sikkerhetskopier. Pris etter
introduksjonstilbud, bindingstid, forskuddsbetaling og etablering må også vurderes.
Sett kostnadsvarsler; varsler er ikke en hard kostnadsgrense. Unngå
automatisk kapasitetsøkning uten avtalte grenser; ingen kapasitet bestilles nå.
Inntekter skal utforskes senere, men er ikke en forutsetning for startbudsjettet.
Ingen betalingsmodell eller betalte produktfunksjoner er vedtatt.

Driftsoppsettet skal ha en kort veiledning for oppsett, utrulling, tilbakeføring
og gjenoppretting. Dokumenter rutiner for sikkerhetsoppdateringer, kontroll av
backup og oppfølging av diskplass, tilgjengelighet og kostnader. Automatiser
gjentakende oppgaver der det er praktisk; ansvaret for oppfølging består.
App og database på samme maskin innebærer at serverfeil kan stoppe begge.
Backup utenfor serveren og testet gjenoppretting er derfor del av første drift.

Bruk databaseindekser, avgrensede spørringer og PostgreSQL-søk før egne
søketjenester vurderes. Mål belastning før kapasitetsøkning. Først kan instans
og database oppgraderes; senere kan flere backend-instanser dele database og
serverøkter. Kø, cache og separate tjenester innføres først ved påvist behov.
Antall brukere alene er ikke et kapasitetsmål; bruksmønster og datamengde teller.

Dersom aktivitetsstyrt lysstyrke innføres, bør den beregnes fra lagret aktivitet
og tidspunkt ved behov, fremfor at hver stjerne oppdateres kontinuerlig i
databasen. Dette avgjør ikke læringsalgoritmen eller produktkravene.

## Avveininger

Django samler mange backend-behov i ett rammeverk. Vurderingen er at dette
passer prosjektets innhold, eierskap og relasjoner, og begrenser hvor mye
infrastruktur vi må sette sammen selv. Vi får samtidig to språk å vedlikeholde:
Python og TypeScript. API-kontrakten må dokumenteres og kontrolleres mellom dem.

En TypeScript-backend ville gitt ett språk, men er ikke valgt i denne omgang.
En backend-tjeneste som også håndterer autentisering kan redusere driftsarbeidet,
men krever egen vurdering av datamodell, dataminimering og kostnader ved vekst.
En egen virtuell server kan ha lavere direkte leiepris, men gir mer ansvar for
oppdateringer, database, overvåking og gjenoppretting. Administrert drift fjerner
ikke vårt ansvar for appens sikkerhet.

## Neste steg

Skriv innloggingsspec og konkretiser datamodell og API for første Notater-leveranse.
Prototyp innloggingsflyten og verifiser dataminimeringen før ekte brukerdata tas
i bruk. Easy Work får egen funksjonsspec før implementering. Denne ADR-en
bestiller ikke implementering av hele backend eller offentlig publisering.
