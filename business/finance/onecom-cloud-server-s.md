# Vurdering av One.com Cloud Server S

Dato: 2026-11-08. Status: Foreløpig positiv vurdering, ikke kjøpsbeslutning eller
verifisert drift. Brukeren opplyser at aktuelle Hetzner-/OVH-tilbud ikke var
tilgjengelige, og ønsker One.com vurdert med backup på eksisterende hjemmeserver.

## Pris og budsjett

Brukeren har gjengitt tilbudet: 29 NOK første måned, deretter 59 NOK per måned,
månedlig fakturering. Teksten oppgir ikke om mva er inkludert. Norsk pris lastes
ikke inn i den tilgjengelige nettleseruthentingen; tilbudet er derfor oppgitt
av brukeren, ikke selvstendig bekreftet i kassen.

| Scenario | Første måned | Senere måneder | Første 12 måneder |
| --- | ---: | ---: | ---: |
| Oppgitte priser inkluderer mva | 29,00 NOK | 59,00 NOK | 678,00 NOK |
| Oppgitte priser er uten mva, med 25 % lagt til | 36,25 NOK | 73,75 NOK | 847,50 NOK |

Beregning: én måned til intropris og elleve til ordinær pris, uten tillegg eller
prisendringer. Mot rammen i [ADR 003](../../docs/adr/003-backend-database-og-drift.md)
gjenstår henholdsvis 81,00 eller 66,25 NOK per ordinær måned til annen drift.
Hjemmebackupens ekstra strøm-/lagringskostnad er ikke beregnet. Eksisterende
maskinvare gir ikke nødvendigvis null merkostnad; behov for ny disk må også vurderes.

## Hva som er kontrollert

- Produktsiden oppgir 2 vCPU, 4 GB RAM, 100 GB NVMe, 1 Gbit/s, ubegrenset trafikk,
  root-tilgang, Docker-støtte og europeiske datasentre. Tabellen oppgir 5 000 IOPS,
  inkludert IPv4/IPv6, null etableringsgebyr, én måneds kontrakt og 15 dagers oppsigelse.
  [Norsk produktside](https://www.one.com/nb-no/vps/).
- Dette er egen drift. Oppdateringer, programvare, overvåking og backup er kundens ansvar;
  support overtar ikke serveradministrasjonen.
  [Oppstartsveiledning](https://help.one.com/hc/en-us/articles/39749383046033-Getting-Started-with-your-VPS-at-one-com).
- Leverandørbackup er et tillegg med daglige kopier og fire dagers oppbevaring.
  Manuelle snapshots varer 24 timer.
  [Backup og snapshots](https://help.one.com/hc/en-us/articles/33435509055761-Make-your-VPS-more-secure-with-Backups-add-on).
- Hjelpesiden beskriver oppgradering, men sier at nedgradering ikke er tilgjengelig.
  [Endring av VPS-plan](https://help.one.com/hc/en-us/articles/26410277928593-How-to-manage-and-adjust-VPS-resources-and-plans).
- Trustpilot viser omtrent 4,4/5 fra over 25 000 omtaler. Dette gjelder hele selskapet,
  med mange omtaler av support/domener/webhotell, ikke en egen VPS-ytelsestest.
  [Kundeomtaler](https://www.trustpilot.com/review/www.one.com).

## Vurdering og forslag

Konfigurasjonen er et rimelig utgangspunkt for vår modulære monolitt med
bygg utenfor VPS-en. Prisnivået alene gir ikke grunn til å forkaste tilbudet.
Faktisk responstid, diskytelse og minnebehov må måles før vi hevder kapasitet.
Start med Linux og vårt eksisterende Docker-oppsett; Plesk er ikke nødvendig.

Backup hjemme kan gi en separat kopi utenfor leverandøren. Forslag til løsning:

1. Lag konsistent databasekopi med eksisterende `pg_dump`-verktøy. En rå kopi
   av en kjørende PostgreSQL-datakatalog erstatter ikke en planlagt databasebackup.
   [PostgreSQL om SQL-dump](https://www.postgresql.org/docs/17/backup-dump.html).
2. La hjemmeserveren hente ferdige dumper via SSH med begrenset tilgang.
   VPS-en skal ikke ha legitimasjon som kan slette tidligere hjemmekopier.
   Hentingen alene beskytter ikke mot at en kompromittert VPS leverer dårlige nye data.
3. Behold flere daterte generasjoner, krypter lagringen, og oppbevar
   gjenopprettingsnøkkel separat. Restic er et mulig verktøy, ikke et vedtatt valg.
   [Restic-lagring](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html).
4. Varsle ved manglende/ferskhetsoverskredet backup og test faktisk gjenoppretting
   fra hjemmekopien. Daglig kjøring gir normalt opptil ett døgns datatap; ved feil
   kan gapet bli større. Oppbevaring og akseptabelt datatap må avklares.
5. Sikre også nødvendige konfigurasjoner og hemmeligheter for gjenoppretting,
   separat og kryptert. Git-kode og databasekopi alene erstatter ikke disse.

Dette er et forslag, ikke implementert backup. Hjemmenett, strøm, diskfeil og
sikkerhet på hjemmeserveren må inngå i vurderingen. En ekstra frakoblet eller
uavhengig kopi kan vurderes når innholdet får større verdi.

## Før kjøp og første drift

Bekreft sluttpris inkl. mva og tillegg, ordinær pris, konkret datasenter,
IPv4 og oppsigelsesvilkår i bestillingen. Produktsidens VPS-vilkår er brukt her;
generelle webhotellvilkår er ikke uten videre lagt til grunn for VPS-avtalen.
Leverandøravtaler/personvern er ikke ferdig juridisk vurdert. Kjør Production check
og prøv gjenoppretting før ekte brukerdata. Ingen issue lukkes på grunnlag av
denne foreløpige vurderingen.
