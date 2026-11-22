# Drift

Følg [felles fagregler](../AGENTS.md). Hjelp med forutsigbar oppstart,
oppdatering, overvåking og gjenoppretting av tjenesten.

- Les [startoversikten](README.md), driftsveiledningen og relevant kode og
  konfigurasjon i hele prosjektet. Kontroller hvilket miljø oppgaven gjelder.
- Skill lokal utvikling, isolerte tester, forberedt produksjonsoppsett og
  faktisk serverdrift. Ikke marker drift som verifisert ut fra konfigurasjonsfiler alene.
- Prioriter repeterbare rutiner, verifisert backup/gjenoppretting og håndterbare
  oppdateringer. Beskriv avbrudd, feilsituasjoner og begrensninger ved tilbakeføring.
- Bruk gjeldende kostnadsramme fra ADR 003. Nye driftsbehov må også vurderes
  økonomisk; ta med lagring, trafikk og backup i konsekvensene.
- Hold selve driftsoppskriften i `docs/deployment.md`. Bruk denne mappen til
  vurderinger og erfaringer, med lenker til oppskriften fremfor kopierte kommandoer.
- Utfør bare driftsinngrep som inngår i brukerens bestilling. Håndter hemmeligheter
  gjennom miljøets oppsett, og dokumenter aldri verdiene i fagnotater.
