# Sikkerhetsarbeid

Mandat: [AGENTS.md](AGENTS.md). Her lagres avgrensede sikkerhetsvurderinger.
Opprettelsen av mappen er ikke en sikkerhetsgodkjenning av appen.

## Grunnlag

- [Arkitektur](../../docs/architecture.md): dataløp og modulgrenser.
- [Innlogging](../../docs/specs/003-auth.md): økter, CSRF og dataminimering.
- [Notater](../../docs/specs/002-notes.md) og [Easy Work](../../docs/specs/004-easy-work.md): eierskap og brukerinnhold.
- [Produksjonsforberedelse](../../docs/specs/006-production.md): eksponering, verifikasjon og gjenstående tiltak.

## Neste mulige oppgaver

- Vurdere tilgangskontroll og datalagring i en konkret versjon.
- Konkretisere misbruksvern før offentlig registrering, som allerede er omtalt i ADR 003.
- Gjennomgå serveroppsettet når leverandør og faktisk konfigurasjon er kjent.
