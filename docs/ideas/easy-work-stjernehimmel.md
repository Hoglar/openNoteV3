# Idé — Easy Work som en stjernehimmel

Status: Notert idé for videre utforsking. Ikke implementert eller ferdig spesifisert.

## Visuell retning

Kunnskapskartet kan vises som en personlig stjernehimmel som vokser etter hvert
som brukeren legger til temaer.

- Hvert tema representeres av en stjerne.
- Et nytt kart starter som en tom himmel. Flere temaer gir flere stjerner.
- Stjernene plasseres delvis tilfeldig, slik at ulike brukere får ulike
  stjernehimler også når de har de samme temaene. Kartet skal ikke ha én felles,
  fast plassering for hvert tema.
- Avklart: Himmelen er permanent. Hver stjerne får en plassering ved opprettelse,
  og plasseringen lagres som del av kartet. Den trekkes ikke på nytt ved besøk
  eller oppfriskning. Nye stjerner legges til uten å flytte eksisterende stjerner.
- Når man ikke peker på en stjerne, ser man bare stjernehimmelen, uten temanavn
  eller synlige forbindelseslinjer.
- Når musepekeren holdes over en stjerne, vises temaets navn og forbindelsene
  til relaterte temaer. Koblingene danner noe som ligner stjernebilder.
- Et søkefelt gjør det mulig å finne temaet man leter etter, også når kartet vokser.

Eksempel: Fourier-rekker er én stjerne med en forbindelse til integrasjon.
Integrasjon kan igjen være koblet til derivasjon.

Forslag til videre avklaring: Tilfeldigheten ved plassering av nye stjerner kan
kombineres med regler som hindrer overlapp og gjør forbindelser lette å følge.
Algoritmen er ikke valgt; permanent plassering er avklart.

## Idé — aktivitet, repetisjon og lysstyrke

Kartet kan også vise hvor mye og hvor ofte brukeren har jobbet med et tema,
og hvor lenge det er siden sist.

- **Størrelse:** Stjernen vokser etter hvert som temaet vokser. Hva som teller
  som vekst, er ikke bestemt ennå.
- **Lysstyrke:** Stjernen lyser sterkere når brukeren jobber med temaet, og
  dempes gradvis etter tid uten aktivitet.
- **Varighet:** Når brukeren holder et tema ved like gjennom repetisjon over
  lengre tid, skal lysstyrken avta langsommere. Tanken er at godt vedlikeholdt
  kunnskap etter hvert trenger sjeldnere repetisjon.
- **Nabostjerner:** Arbeid med ett tema kan gi en mindre økning i lysstyrken
  til beslektede temaer i samme stjernebilde. Eksempel: Fourier-oppgaver som
  bruker integrasjon kan også bidra til integrasjonsstjernens lysstyrke.

Algoritme, vekter, intervaller og måling av aktivitet er ikke bestemt. Dette
er en mulig visualisering av vedlikehold, ikke en validert måling av mestring.

### Faglig grunnlag og hypoteser

Ideen har tilknytning til *spaced repetition* (repetisjon fordelt over tid)
og aktiv gjenhenting av kunnskap. Forskning støtter fordelt repetisjon, men gir
ikke ett universelt intervall for alle temaer og brukere. Passende mellomrom
avhenger blant annet av hvor lenge kunnskapen skal bevares:
[Cepeda mfl. (2008)](https://digitalcommons.usf.edu/psy_facpub/1766/).
Aktiv gjenhenting har også støtte som læringsaktivitet:
[Karpicke og Blunt (2011)](https://pubmed.ncbi.nlm.nih.gov/21252317/).

Størrelse, lysstyrke, langsommere dimming og bonus til nabostjerner er våre
produktideer, ikke konkrete regler etablert av disse studiene. En forbindelse
i kartet alene dokumenterer ikke at nabotemaet faktisk er repetert. Før vi lager
algoritmen, bør vi vurdere hvordan faktisk bruk av relaterte ferdigheter kan
skilles fra bare det å ha en kobling.

## Idé — en felles mal for stjerneinnhold

Når en stjerne åpnes, kan innholdet ha to deler:

- **Teori:** En enkel forklaring som hjelper brukeren å repetere temaet.
- **Oppgaver:** Én oppgave om gangen, med mulighet til å bla gjennom oppgavene.
  Brukeren markerer en oppgave som gjort og får deretter en ny fra samlingen.
  Markeringen er egenrapportert fullføring; automatisk retting er ikke bestemt.

Teori og oppgaver kan lages utenfor appen, gjerne med AI-hjelp, etter en felles
mal og deretter importeres. Appen står for visning og navigasjon. Det innebærer
ikke AI-generering av neste oppgave inne i appen.

Malen skal støtte eksisterende idé om Markdown og matematikkformler, og skille
teori fra de enkelte oppgavene. Nøyaktig filformat og importregler avklares senere.

## Idé — låne stjerner med løpende oppdateringer

- En bruker kan legge en annen brukers stjerne til i sitt eget kart.
- Den opprinnelige eieren beholder eierskapet og redigerer teori og oppgaver.
- Den lånte stjernen viser samme innhold og følger eierens oppdateringer.
  Den er en referanse til originalen, ikke en uavhengig kopi.
- Brukeren kan slutte å følge stjernen ved å fjerne den fra sitt eget kart,
  for eksempel hvis innholdet utvikler seg i en uønsket retning.
- Egne stjerner skal også kunne fjernes fra eget kart.

Foreslått modell: Skill mellom delt stjerneinnhold og brukerens kartoppføring.
Kartoppføringen refererer til innholdet og har egen permanent plassering og egne
koblinger. Aktivitet, oppgaveprogresjon og lysstyrke tilhører den enkelte brukeren,
slik at andres arbeid ikke teller som brukerens egen repetisjon.

Å fjerne en stjerne fra eget kart bør ikke slette originalinnholdet eller fjerne
den fra andres kart. Dette skillet, og eventuell sletting eller arkivering av
selve originalen, må avklares før implementering.

## Avklaringer før implementering

- Hvordan man åpner temasider fra stjernene.
- Hvordan et søkeresultat vises og leder brukeren til riktig stjerne.
- Tilsvarende betjening på berøringsskjerm og med tastatur.
- Hvor mye den første plasseringen styres av tilfeldighet og temakoblinger,
  og hvordan nye stjerner får plass uten å flytte de eksisterende.
- Eventuell zoom og flytting rundt i større kart.
- Hva som registreres som arbeid: øvelser, egenrapportering, tidsbruk eller annet.
- Hva som bestemmer størrelse, og om repetisjonsresultat skal påvirke lysstyrken.
- Hvordan repetisjonshistorikk påvirker dimming, og hvordan indirekte aktivitet
  på nabotemaer skal vektes uten å erstatte direkte repetisjon.
- Importformat for teori, oppgaver og eventuell fasit, og hvordan oppgaver får
  stabile identiteter når eieren oppdaterer innholdet.
- Rekkefølge på oppgaver, gjentatt øving og hva som skjer når alle er gjennomført.
- Hvordan fullføring påvirker aktivitetsloggen og lysstyrken.
- Hvordan innholdsendringer påvirker tidligere fullføringer og en pågående økt.
- Om fjerning fra kartet bevarer historikk og plassering ved senere gjeninnlegging.
- Hva som skjer med lånte stjerner hvis eieren sletter eller arkiverer originalen.

Dette notatet endrer ikke omfanget i Spec 001. Når vi bestemmer oss for å bygge
kartet, avklarer vi oppførselen og lager en egen spec med akseptansekriterier.
