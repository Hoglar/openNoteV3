# ADR 002 — Eierskap og sletting av stjerner

Dato: 2026-11-06
Status: Vedtatt og implementert i første lokale versjon (Spec 004).

## Kontekst

En stjerne kan lånes inn i flere brukeres kart. Lånte forekomster refererer til
samme originalinnhold og følger eierens oppdateringer. Kartene kan også ha
faglige forbindelser mellom selvstendige stjerner, som Fourier og integrasjon.
Disse forbindelsene må skilles fra referanser til en lånt original.

## Beslutning

- Når eieren sletter originalstjernen, fjernes den også fra alle kart som har
  lånt den. Forbindelsene til de fjernede forekomstene fjernes også.
- Når en bruker fjerner en lånt stjerne fra eget kart, påvirkes bare den
  forekomsten og dens kartforbindelser. Originalen og andres kart består.
- En selvstendig nabostjerne slettes ikke fordi den har en faglig forbindelse
  til den slettede stjernen. Bare forbindelsen fjernes.
- «Fjern fra mitt kart» og «Slett originalstjernen» er forskjellige handlinger.
  Eieren kan også fjerne sin egen stjerne fra eget kart uten å slette originalen.
  Bare originalens eier kan slette originalinnholdet.

Eksempel: Eieren sletter en integrasjonsstjerne som andre har lånt. Stjernen
forsvinner fra disse kartene, men deres selvstendige Fourier-stjerner består.

## Begrunnelse og konsekvenser

Lån betyr tilgang til eierens innhold mens det eksisterer. Dette gir en enkel
modell der vi ikke beholder uavhengige kopier etter at originalen slettes.
Avveiningen er at brukere kan miste en stjerne de har arbeidet med når eieren
sletter den. Brukergrensesnittet må gjøre omfanget av de to handlingene tydelig.

Automatisk kopiering eller arkivering av slettet originalinnhold er ikke valgt
som første løsning. Det ville kreve egne regler for eierskap og videre bruk.

## Konkretisering i Spec 004

Fjerning fra eget kart bevarer plassering og personlig øving, men fjerner
forbindelsene. Gjeninnlegging bruker samme plassering. Sletting av originalen
sletter også tilknyttet øving. Notater beholdes, men koblingen til stjernen fjernes.

Kontosletting, sikkerhetskopier og lagringsfrister avklares separat. Denne
beslutningen fastsetter ikke et produktløfte om håndtering av kontosletting.
