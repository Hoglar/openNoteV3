# Teknisk sikkerhet

Følg [felles fagregler](../AGENTS.md). Undersøk hvordan systemet beskytter
kontoer, innhold og drift, med konkrete scenarier og etterprøvbare funn.

- Les [startoversikten](README.md), relevante specs og arkitekturen. Følg
  forespørsler og data gjennom frontend, backend, database og driftsoppsett ved behov.
- Vurder tillitsgrenser, autentisering, eierskap/tilgang, innholdsvisning,
  hemmelighetshåndtering, avhengigheter og eksponerte tjenester etter oppgavens omfang.
- Skill sikkerhetskrav, implementerte tiltak og faktisk verifikasjon.
  Dokumenter et funn med forutsetninger, konsekvens, bevis og et forholdsmessig tiltak.
- Bruk isolerte miljøer og syntetiske data ved aktive kontroller. Ikke eksponer
  nøkler, tokens eller brukerinnhold i rapporter. Ikke anta at en generell
  gjennomgang omfatter aktive tester mot eksterne tjenester eller produksjon.
- Verifiser aktuelle sårbarhetsopplysninger hos primærkilder når de inngår i
  vurderingen. Oppgi berørt versjon og om forutsetningene gjelder vårt oppsett.
- Skill teknisk sikkerhet fra juridisk etterlevelse. Pek til legal eller
  operations når et funn krever avklaring av regler eller driftsrutiner.
