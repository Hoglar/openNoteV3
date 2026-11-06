# ADR 001 — Innlogging og dataminimering

Dato: 2026-11-06
Status: Vedtatt 2026-11-06. Ikke implementert. Åpne detaljer står under neste avklaringer.

## Kontekst

openNote skal ha offentlig lesetilgang og kreve innlogging for å opprette og
endre eget innhold. Vi ønsker enkel bruk, begrenset driftsarbeid og minst mulig
innsamling og lagring av personopplysninger. Google og GitHub er valgte
innloggingsleverandører. Foreløpig finnes bare simulert innlogging.

## Beslutning

Bruk Google og GitHub for innlogging, uten egne passord i første versjon.
Integrer via et vedlikeholdt autentiseringsbibliotek i den separate backend-en.
django-allauth er valgt sammen med Django i
[ADR 003](003-backend-database-og-drift.md). Leverandørene kan kobles på én
om gangen under utvikling; produktet skal støtte begge.

Google tilbyr OpenID Connect. For Google brukes leverandørens stabile `sub`
til identifikasjon, ikke e-post. GitHub tilbyr en OAuth-flyt der backend henter
den autentiserte brukeren. Bruk leverandør og stabil bruker-ID som identitet,
ikke visningsnavn eller GitHub-brukernavn, som kan endres.
[Google](https://developers.google.com/identity/openid-connect/openid-connect),
[GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

Backend verifiserer innloggingen og oppretter en egen økt. Brukeren velger et
offentlig visningsnavn, gjerne et pseudonym. Profilnavn og profilbilde fra
leverandøren publiseres ikke automatisk.

## Hvilke data vi beholder

| Data | Formål |
| --- | --- |
| Intern bruker-ID | Eierskap til innhold og personlig progresjon. |
| Leverandør + stabil ekstern bruker-ID | Gjenkjenne brukeren ved neste innlogging; holdes utenfor offentlige API-svar. |
| Selvvalgt offentlig visningsnavn | Vise forfatter på notater, kommentarer og stjerner. |
| Nødvendige kontotidspunkter | For eksempel opprettelsestid, med dokumentert formål. |
| Begrensede øktdata med utløp | Holde brukeren innlogget og kunne avslutte økter. |
| Brukerens innhold og nødvendig øvingshistorikk | Levere Notater og Easy Work; avgrenses i funksjonenes specs. |

Ingen egen lagring av passord, e-post, fullt navn, profilbilder, fødselsdato,
kontaktlister eller komplette leverandørprofiler inngår i første versjon. Ekstra data som
likevel følger med et leverandørsvar, filtreres bort og logges ikke.
Dette er dataminimering, ikke anonymitet.

Be om minste nødvendige tilgang. Ingen tilgang til private kodearkiver,
Google Drive, kalender eller kontakter. GitHub dokumenterer at uten ekstra
scopes gis tilgang til offentlig informasjon; privat e-post krever særskilt
tilgang. Bibliotekets standard-scopes og faktiske svar må derfor kontrolleres.
Google-scopes begrenses til nødvendig identifikasjon; `email` skal ikke bes
om uten et konkret behov.
[GitHub-scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps),
[Google-claims og scopes](https://developers.google.com/identity/openid-connect/openid-connect).

Leverandørtokens brukes bare så lenge innloggingsflyten trenger dem og lagres
ikke varig. Ingen offline-tilgang eller refresh tokens skal brukes. Appens egne
økter skal ha utløp, en ugjennomsiktig økt-ID i en `HttpOnly`/`Secure`-cookie,
egnet `SameSite`-innstilling og beskyttelse mot CSRF. Callback-validering,
`state`, PKCE og eventuell OIDC-`nonce` håndteres etter valgt bibliotek og
leverandørs støttede flyt. Hemmeligheter og tokens skal aldri til frontendlogger.

## Konsekvenser og alternativer

- Vi slipper å bygge passordlagring, passordtilbakestilling og tilhørende e-post.
  Oppsett av to leverandørapper, callback-adresser, hemmeligheter, økter og
  autorisasjon i backend gjenstår. Dette er håndterbart, men ikke vedlikeholdsfritt.
- Brukerne trenger en støttet leverandørkonto. Leverandørfeil eller tap av
  kontotilgang kan hindre innlogging. Leverandøren får informasjon om innloggingen.
- To leverandører kan gi to lokale kontoer. Ikke slå sammen brukere automatisk
  etter lik e-post eller navn. Eventuell kontokobling må kreve verifisert kontroll
  over begge identitetene; kobling og gjenoppretting er åpne produktvalg.
- E-post og passord gir uavhengighet fra Google/GitHub, men mer sikkerhets- og
  driftsarbeid. E-postlenker krever e-postlagring og en e-posttjeneste.
- En administrert autentiseringstjeneste kan redusere implementeringsarbeidet,
  men tilfører en leverandør, kostnader og egen vurdering av databehandling.

### Passkeys — utsatt til senere vurdering

Avklart 2026-11-06: Passkeys er utenfor første versjon. Vi beholder Google og
GitHub som vedtatt innlogging og vurderer passkeys senere, uten å love innføring.

Passkeys kan brukes direkte til innlogging i openNote med WebAuthn. Brukeren
godkjenner på sin enhet, for eksempel med fingeravtrykk, ansiktsgjenkjenning
eller PIN. Appen mottar ikke biometrien eller PIN-koden. Serveren lagrer en
offentlig nøkkel, credential-ID og tilknytning til brukeren; privatnøkkelen
håndteres av brukerens autentikator/passkey-leverandør. Noen passkeys
synkroniseres mellom enheter, andre er bundet til én enhet.
[FIDO Alliance](https://fidoalliance.org/passkeys/).

Dette passer ønsket om få lagrede personopplysninger. Direkte passkey-innlogging
krever ikke i seg selv at openNote samler inn e-post eller bruker sosial
innlogging. Vi trenger likevel registrering og verifisering i backend, valg
av domene/RP ID, administrasjon av nøkler og en plan for tap av tilgang.
[Teknisk oversikt](https://developers.google.com/identity/passkeys/developer-guides),
[Brukerflyt og gjenoppretting](https://developers.google.com/identity/passkeys/ux/user-journeys).

Et mulig senere steg er å la en bruker som allerede er logget inn med Google
eller GitHub, legge til en passkey på den samme kontoen. Dette er et forslag,
ikke en utvidelse av vedtatt omfang. Bruk av passkey hos Google/GitHub er også
forskjellig fra at openNote selv tilbyr direkte passkey-innlogging.

## Personvern og GDPR

Innloggingsvalg alene avgjør ikke om tjenesten etterlever GDPR. Vi må beskrive
formål, behandlingsgrunnlag, nødvendige data og lagringstid. Å holde e-post ute
fjerner ikke ansvaret for de andre personopplysningene.
[Datatilsynets personvernprinsipper](https://www.datatilsynet.no/rettigheter-og-plikter/personvernprinsippene/).

Interne ID-er og pseudonymer kan fortsatt knyttes til personer. Notater,
kommentarer og øvingshistorikk kan også inneholde personopplysninger.
Brukerskrevet tekst kan inneholde særlige kategorier av opplysninger selv om
innloggingsskjemaet ikke ber om dem. Pseudonymisering gjør ikke data anonyme.
[Datatilsynet om anonymisering](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/informasjonssikkerhet-internkontroll/hvordan-anonymisere-personopplysninger/).

Før tjenesten åpnes for andre, må vi konkretisere:

- Hvem som er behandlingsansvarlig, hvem målgruppen er, og behandlingsgrunnlag
  for konto, offentlig innhold og øvingshistorikk. Leverandørens OAuth-godkjenning
  er ikke i seg selv et GDPR-samtykke til all behandling i openNote.
- En kort personvernerklæring og tydelig informasjon om at «Lagre» gjør innhold
  offentlig. Offentlig innhold betyr ikke offentlig e-post, innloggings-ID eller
  detaljert øvingshistorikk; synlighet av sistnevnte må avklares separat.
- Praktiske rutiner for innsyn, retting og sletting, inkludert hva som skjer med
  publiserte notater, kommentarer og stjerner andre låner når en konto slettes.
  Bare å fjerne forfatternavnet er ikke alltid tilstrekkelig anonymisering.
  [Rettigheter](https://www.datatilsynet.no/rettigheter-og-plikter/den-registrertes-rettigheter/).
  Sletting av enkeltstjerner er en separat beslutning i
  [ADR 002](002-eierskap-og-sletting-av-stjerner.md); kontosletting er fortsatt åpen.
- Begrunnede frister og sletting for økter, øvingshistorikk, logger og sikkerhetskopier.
  Unngå logging av tokens, innhold og hele profiler. Behov for IP-adresser i
  sikkerhetslogger må vurderes og begrenses.
- Hosting, underleverandører og deres roller. Databehandleravtaler kreves når
  en leverandør behandler data på våre vegne. Innloggingsleverandørenes roller
  må vurderes etter vilkårene; de er ikke automatisk våre databehandlere.
  [Databehandleravtaler](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/hvordan-lage-en-databehandleravtale/).
- Eventuelle overføringer utenfor EØS. EØS-hosting er et mulig utgangspunkt,
  men er ikke alene garanti for etterlevelse eller fravær av overføringer.
  [Overføringer](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/overforing-av-personopplysninger-ut-av-eos/).

Vi skal bruke bare nødvendige innloggingscookies og ingen analyse- eller
markedsføringssporing i første versjon. Endelig personvernvurdering avhenger av
de faktiske leverandørene, databehandlingen og målgruppen.

## Neste avklaringer

Innloggingsmetodene og prinsippene for dataminimering er vedtatt av brukeren.
Django og django-allauth er valgt i ADR 003. Avklar hosting og håndtering av
kontoer, og skriv en
egen innloggingsspec med akseptansekriterier. ADR-en forklarer retningen og
avveiningene; den erstatter ikke en ferdig implementeringsspec.
