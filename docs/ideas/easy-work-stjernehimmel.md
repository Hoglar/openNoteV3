# Idé — videreutvikling av stjernehimmelen

Status: Kart, permanent plassering, lån, innholdsmal, notatkoblinger og enkel
registrering av øving er konkretisert og implementert i
[Spec 004](../specs/004-easy-work.md). Dette notatet beholder ideene som gjenstår.

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

## Gjenstående utforsking

- Hva som teller som vekst og aktivitet utover fullførte oppgaver.
- Algoritme, intervaller og vekting av indirekte aktivitet på nabotemaer.
- Zoom, manuell plassering og større kart enn første versjons grense.
- Eventuelle anbefalinger om neste tema, uten å gjøre vedlikeholdsøving krevende.

Nye regler avtales og tas inn i en spec før implementering.
