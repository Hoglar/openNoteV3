# Fagområder i openNote

Prosjektroten er vårt overordnede arbeidsområde for utvikling og produktvalg.
Disse mappene samler instrukser og dokumentasjon når vi vil arbeide med ett
fagområde. Vi bruker samme prosjekt og kan undersøke relevant kode og
dokumentasjon på tvers av mapper.

| Mappe | Fokus |
| --- | --- |
| [finance](finance/README.md) | Budsjett, kostnader og mulige inntekter. |
| [legal](legal/README.md) | Juss, personvern, lisenser og avtaler. |
| [marketing](marketing/README.md) | Målgruppe, budskap og plan for å nå brukere. |
| [review](review/README.md) | Samsvar med spec, feil og kvalitet på testdekning. |
| [security](security/README.md) | Teknisk sikkerhet og beskyttelse av data. |
| [operations](operations/README.md) | Utrulling, oppdatering, backup og drift. |

Hver mappe har en `AGENTS.md` med fagmandat og en README som peker til relevant
grunnlag og åpne spørsmål. [Felles fagregler](AGENTS.md) gjelder sammen med
[rotens arbeidsavtale](../AGENTS.md). Egne vurderingsnotater legges til ved behov.

## Slik bruker du mappene

Du kan bli i prosjektroten og si:

> Vi skal jobbe med finance. Les fagmappens instrukser og vurder kostnadene
> for hosting ut fra hele prosjektet.

Du kan også starte en ny Codex-sesjon med for eksempel `business/finance` som
arbeidsmappe. Behold hele repositoryet tilgjengelig i arbeidsmiljøet. Codex
leser normalt instrukser fra prosjektroten ned til arbeidsmappen ved oppstart;
et mappeklikk eller `cd` i en allerede startet sesjon er ikke en garanti for
at nye instrukser lastes. Ved fortsatt sesjon ber du eksplisitt om fagfokuset.
Se [OpenAI-dokumentasjon om AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

Filene gir instrukser, ikke tekniske rettigheter. Hvis miljøet bare gir tilgang
til en undermappe, må prosjektet gjøres tilgjengelig gjennom miljøets oppsett.
Kommandoer fra prosjektets README kjøres fra prosjektroten med mindre annet er sagt.

## Ett hjem for felles fakta

Specs i `docs/specs/` beskriver avtalt oppførsel. ADR-er og arkitekturdokumentet
beskriver valg og begrunnelser. Hosting- og driftsdokumentene beholder sine
eksisterende plasseringer. Fagmappene peker til disse og samler analyser og
forslag; de oppretter ikke konkurrerende krav eller kopier av budsjettet.

Strukturen er beskrevet i [Spec 007](../docs/specs/007-workspaces.md).
Dette er fagmapper, uten egne kjørende agenter eller automatisk delegering.
