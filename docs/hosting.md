# Hosting innenfor startbudsjettet

Dato: 2026-11-06. Status: Driftsretning og prioriteringer er avtalt;
leverandør og konkret pakke undersøkes.
Ingenting er bestilt. Brukeren aksepterer vedlikehold som del av læringen.
Rammen er vedtatt i [ADR 003](adr/003-backend-database-og-drift.md): maks
140 NOK per måned inkludert mva og nødvendig drift, uten eksisterende domene.
Rammen er økt fra 100 NOK etter brukerens avklaring. Omtaler av support,
stabilitet og fakturering skal inngå i leverandørvurderingen.

## Aktuelle spor

| Alternativ | Offentlig oppgitt pris | Vurdering |
| --- | --- | --- |
| DigitalOcean Basic Regular | USD 6/mnd for 1 GiB RAM og 25 GiB disk. Daglig backup på Basic-plan legger til 30 %, totalt USD 7,80 før avgifter. 2 GiB-planen koster USD 12 før backup. | Aktuell liten testserver, men minne til app og database må måles. Brukeren kjenner allerede leverandøren. |
| Hetzner Cloud CX23 | 2 vCPU, 4 GB RAM og 40 GB disk. Komplett aktuell pris er ikke bekreftet; IPv4 og backup må medregnes. | Aktuell alternativ konfigurasjon. Den offentlige siden viste modellen som utilgjengelig; sjekk konsollen før valg. |
| OVHcloud VPS-1 | Fra EUR 3,81/mnd ekskl. mva; 2 vCPU, 4 GB RAM, 40 GB disk og daglig backup oppgis inkludert. | Aktuell kandidat. Sluttpris for norsk kunde, binding, fornyelse og region er ikke verifisert i bestilling. |
| netcup VPS Lite 1 G12.5s | Fra EUR 5,86/mnd, siden oppgir 19 % mva og seks måneders binding; 4 GB RAM og 80 GB disk. | Alternativ, men separat backup, eventuell IPv4-kostnad og norsk sluttpris må avklares. Snapshots er ikke dokumentasjon på en uavhengig backup. |
| Render med betalt app og PostgreSQL | Oppgitte startpriser er USD 7 + USD 6/mnd, før lagring og eventuell avgift. | Administrert alternativ, men komplett total er ikke bekreftet innenfor 140 NOK. Egen drift er valgt. |

Kilder: [OVHcloud](https://www.ovhcloud.com/en-ie/vps/),
[netcup](https://www.netcup.com/en/server/vps-lite),
[Render-priser](https://render.com/pricing),
[Render PostgreSQL](https://render.com/articles/managed-postgresql-pricing-2026).
Nye kandidater: [DigitalOcean-priser](https://www.digitalocean.com/pricing/droplets),
[DigitalOcean-backup](https://docs.digitalocean.com/products/backups/details/pricing/),
[Hetzner CX](https://www.hetzner.com/cloud/cost-optimized/),
[Hetzner IPv4](https://docs.hetzner.com/general/infrastructure-and-availability/ipv4-pricing/).
Prisene er øyeblikksbilder, ikke bindende tilbud. Enkelte priser vises bare i
dynamiske konfiguratorer; ingen av alternativene har en bekreftet norsk totalpris.

## Kundeomtaler

Kontrollert 2026-11-06. Trustpilot-tallene gjelder hele leverandøren på tvers
av produkter, ikke bare den aktuelle VPS-planen.

| Leverandør | TrustScore | Antall omtaler | Temaer i det leste utvalget |
| --- | --- | --- | --- |
| [DigitalOcean](https://www.trustpilot.com/review/digitalocean.com) | 4,6/5 | 2 630 | Mange positive beskrivelser av support og enkel administrasjon; også kritikk av kontoverifisering og begrensninger. |
| [OVHcloud](https://www.trustpilot.com/review/ovhcloud.com) | 3,8/5 | 9 150 | Både rask hjelp og lange ventetider omtales. Klager om fornyelse og oppsigelse forekommer. Enkelte omtaler gjelder helt andre tjenester, som telefoni. |
| [Hetzner](https://www.trustpilot.com/review/hetzner.com) | 2,9/5 | 3 028 | Ros for pris og stabil drift, blandet support og klager om fakturering, kontoer og prisendringer. |

DigitalOcean har også 8,5/10 fra 138 vurderinger på
[TrustRadius](https://www.trustradius.com/products/digitalocean/reviews), der
dokumentasjon og utviklerverktøy fremheves. Som motvekt til Hetzners lave
TrustScore finnes positive langtidserfaringer, blant annet en
[bruker med over ti års erfaring](https://www.reddit.com/r/hetzner/comments/1x1x6t3/using_hetzner_for_over_10_years_now_should_i_be/).
Dette er enkeltberetninger, ikke verifiserte oppetidsmålinger.

Utvalget er begrenset og selvselektivt. Ulike produkter, innsamling av omtaler
og kundegrupper gjør at stjernene alene ikke avgjør hvilken server vi velger.
Omtalene gir ikke grunnlag for å rangere faktisk oppetid eller sikkerhet.

## Avtalt retning

Velg ut fra samlet driftskostnad, kapasitet, backup og mulighet til å flytte.
Kundeomtaler er støtteinformasjon, ikke grunnlag alene for leverandørrekkefølgen.
Vi sikter mot én liten VPS i EØS med helst 4 GB RAM, som margin for både
operativsystem, Django og PostgreSQL. Dette er avtalt som foretrukket
startstørrelse, ikke et målt minimum. Faktisk behov må testes.

Undersøk en tilgjengelig Hetzner-konfigurasjon med 4 GB først, forutsatt at
server, IPv4, backup og avgifter gir rom for reserve innenfor 140 NOK.
OVHcloud er alternativet hvis Hetzners pris eller tilgjengelighet ikke passer.
DigitalOcean er fortsatt aktuelt på grunn av brukerens erfaring, men vi bør
ikke velge 1 GiB utelukkende for å få plass til en leverandør med høyere
TrustScore. En slik løsning må først demonstrere tilstrekkelig minnemargin.
Brukeren har sluttet seg til denne retningen. Ingen leverandør eller konkret
pakke er endelig valgt.

Bygg frontend utenfor serveren. Gjør oppsett og utrulling repeterbart, hold
konfigurasjon og hemmeligheter adskilt fra kode, og dokumenter flytting og
gjenoppretting. Start offentlig testing når en liten, fungerende leveranse er
klar; kjøpstidspunktet er ikke besluttet. Ved vekst måler vi først flaskehalser,
og vurderer større server eller separat database når behov og budsjett tilsier det.

App og PostgreSQL kan dele maskin, mens React serveres som statiske filer.
Egen drift er valgt: ansvaret for operativsystem,
database og sikkerhetsoppdateringer blir vårt. Kapasitet må måles med appen;
det gis ingen garanti om antall samtidige brukere.

Som regneeksempel blir DigitalOcean USD 7,80 til omtrent 107 NOK med 25 % mva
og en **budsjetteringskurs** på 11 NOK/USD. Da gjenstår omtrent 33 NOK til
eventuell ekstra databasebackup, valutautslag og gebyrer. Dette er ikke dagens
valutakurs eller et verifisert totaltilbud. En 2 GiB-plan med daglig Basic-backup
ville koste omtrent 215 NOK med samme forutsetninger og passer ikke rammen.
For OVHcloud tilsvarer fra-prisen EUR 3,81 omtrent 57 NOK ved 25 % mva og
budsjetteringskurs 12 NOK/EUR; binding og sluttpris er fortsatt uavklart.

Før bestilling må vi kontrollere tilgjengelighet for norsk kunde, EØS-region,
fakturert total inkl. avgifter og gebyrer, binding/forskuddsbetaling, IPv4,
trafikkvilkår og fornyelsespris. Ingen automatisk oppskalering eller betalte
tillegg utenfor rammen. Et varselsystem garanterer ikke et kostnadstak.

OVHcloud oppgir daglig backup, men siden beskriver både siste døgn og en
syvdagersordning. Inkludert oppbevaring må derfor verifiseres for valgt plan.
Databasekonsistent backup, kopi utenfor serveren og testet gjenoppretting må
inngå i driftsopplegget før ekte brukerdata. Dersom nødvendig backup og trygg
drift ikke får plass i budsjettet, fortsetter lokal testing mens hostingvalget
avklares; sikkerhetskravene senkes ikke for å få en lavere annonsert pris.
