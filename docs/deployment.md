# Klargjøring og drift på én VPS

Brukeren har bekreftet serverkjøp. Ubuntu 26.04.1 LTS, brukeren `administrator`
med full passordfri sudo og ny SSH-innlogging med nøkkel uten passordfallback
er bekreftet gjennom brukerens terminalutdata og innloggingstest 2026-11-22.
Brukeren rapporterer at SSH-endringene (nøkkelinnlogging, deaktivert passord og
direkte root-innlogging) fungerer, og at ny innlogging etter systemoppdatering
og omstart lykkes. UFW er aktiv og starter ved oppstart, med innkommende
standardpolicy `deny`, utgående `allow` og TCP 22/80/443 tillatt for IPv4/IPv6.
Brukeren har bekreftet ny SSH-innlogging etter aktivering. Leverandørens
brannmur og Docker-porteksponering er ennå ikke kontrollert. Docker har kjørt
`hello-world` på serveren (amd64), og Compose v5.8.0 er bekreftet gjennom
brukerens terminalutdata. Appens containerkjede og faktisk utrulling gjenstår.
Lokal utvikling bruker fortsatt
`compose.yaml`; serveroppsettet bruker `compose.production.yaml` gjennom
`scripts/production.sh`. [Spec 006](specs/006-production.md) beskriver omfanget.

## Kontroll før hosting

Når workflowen er pushet til standardgrenen: velg
**Actions → Production check → Run workflow**. Den bygger
containerne, kjører migrasjoner, kontrollerer HTTPS med et lokalt testsertifikat,
tester databasebrukeren og prøver backup/gjenoppretting. Ingen secrets eller
server kreves. Vanlig **CI** må også være grønn før en versjon skal brukes.
Testworkflowens oppryddingskommandoer må aldri kjøres mot produksjonsdata.

## Konfigurasjon og bygg

Krever Docker Engine med Compose v2.24+ og Bash. Bygg på en utviklings-/byggemaskin
med samme CPU-arkitektur som VPS-en, eller bygg eksplisitt for VPS-ens plattform.
Bruk et rent, committet checkout som har bestått CI. Bygg utenfor VPS-en sparer minne.

```sh
umask 077
cp deploy/production.env.example .env.production
chmod 600 .env.production
```

Fyll filen uten å dele innholdet i chat, logger eller Git:

- `SITE_DOMAIN`: ett vertsnavn, uten protokoll, port, sti eller wildcard.
- `OPENNOTE_RELEASE`: commit-ID eller annen unik versjon. Begge bilder bruker
  samme tag. Gjenbruk aldri en tag til endrede bilder.
- Tre forskjellige hemmeligheter: Django-nøkkel, databaseadministratorens
  passord og appens databasepassord. Generer hver med
  `python3 -c 'import secrets; print(secrets.token_urlsafe(64))'`.
- Egne OAuth-klienter for produksjon. Google-callback er
  `https://DITT-DOMENE/accounts/google/login/callback/`; GitHub bruker
  `/accounts/github/login/callback/`. Leverandør uten nøkler forblir deaktivert.

```sh
bash scripts/production.sh config --quiet
bash scripts/production.sh build --pull
mkdir -p .local/releases
set -o pipefail
# Erstatt VERSJON med samme verdi som OPENNOTE_RELEASE.
docker image save opennote-backend:VERSJON opennote-web:VERSJON | gzip > .local/releases/VERSJON.tar.gz
sha256sum .local/releases/VERSJON.tar.gz
```

Byggkonteksten har en tillatelsesliste som utelater lokale hemmeligheter og
databaser. Node/Python-basebilder følger sin hoved-/underversjon ved nybygg;
byggene er ikke bitidentiske. Caddy/PostgreSQL er låst til konkrete versjoner.
Behold forrige versjons bilder til den nye er verifisert.

## Første utrulling — når serveren er valgt

1. Bekreft total innen 140 NOK inkl. nødvendige sikkerhetskopier og mva.
   Installer støttet Linux og Docker etter
   [offisiell veiledning](https://docs.docker.com/engine/install/). Bruk SSH-nøkkel
   og begrens Docker-tilgang til driftsbrukeren. Åpne bare SSH og TCP 80/443;
   kontroller også Docker-portene mot leverandørens brannmur.
2. Pek domenets DNS mot serveren. Fjern feil AAAA-record hvis IPv6 ikke brukes.
   Caddy håndterer sertifikater når domenet og portene er tilgjengelige.
3. Legg samme checkout på VPS-en og opprett `.env.production` der med modus 600.
   Overfør bildefilen via SSH og sammenlign SHA256 før innlasting:

```sh
docker image load --input /sti/til/VERSJON.tar.gz
bash scripts/production.sh pull db
bash scripts/release.sh
```

Bare Caddy publiserer porter. Appens databaserolle er ikke administrator.
Oppstarts-SQL kjører bare på tomt databasevolum. **Passordendring i miljøfilen
endrer ikke et eksisterende databasepassord**; rotasjon må også utføres i PostgreSQL.
Ikke del `compose config` uten `--quiet`, ettersom utdata kan inneholde hemmeligheter.

Kontroller HTTPS, `/api/health/`, direkte frontendlenker, Google-innlogging,
lagring, oppfriskning og utlogging. Backend-porten må aldri eksponeres offentlig:
den stoler eksplisitt på HTTPS-headeren som Caddy overskriver. Tilgangslogger
med OAuth-URL-er er av. Driftslogger roteres.
HSTS gjelder bare appens vertsnavn; vi har ikke bundet andre underdomener til
HTTPS eller valgt preload. Derfor stilnes Django-varslene `security.W005`/`W021`.
Øvrige produksjonskontroller kjøres med varsel som feil.

## Oppdatering og tilbakeføring

Etter grønn CI og Production check: bygg med ny tag utenfor VPS-en, overfør
og last inn bildene. Noter gammel versjon og oppdater checkout og
`OPENNOTE_RELEASE` på serveren. Les migrasjonene og planlegg et kort avbrudd.

`bash scripts/release.sh` sjekker konfigurasjon/bilder, stopper appen, tar backup,
kjører migrasjoner og starter valgt versjon. Feil avbryter videre steg; appen
kan forbli stoppet. Kontroller HTTPS og brukerflytene etterpå, og kopier backupen
utenfor serveren. Ikke kjør flere oppdateringer samtidig.

Før migrasjoner kan gammel konfigurasjon/versjon startes igjen med
`bash scripts/production.sh up -d --no-build --wait backend web`. Etter
migrasjoner må gammel kode først bekreftes kompatibel med ny databasestruktur.
Å bytte bilder ruller ikke databasen tilbake. Ved nødvendig gjenoppretting:
behold appen stoppet, prøv backupen i en ny database/et nytt volum og verifiser
før bytte. Behold gammel database til resultatet er kontrollert. Dette er et
eget inngrep og kan miste endringer etter backup-tidspunktet.

## Backup og vedlikehold

```sh
backup=$(bash scripts/backup.sh)
bash scripts/restore-check.sh "$backup"
```

Backup bruker PostgreSQLs konsistente snapshot, en midlertidig fil og deretter
`.dump` ved suksess. Mappe får modus 700 og fil 600. Dumpen inneholder også
konto-/øktdata, er ikke kryptert av skriptet og skal behandles privat.
Gamle filer slettes ikke automatisk. Gjenopprettingstesten bruker egen container
uten nettverk/publiserte porter og sletter bare sitt midlertidige volum etterpå.
Kjør store tester på separat maskin med nok disk. Bruk bare egne, betrodde dumper.

**Før ekte brukerdata:** velg rimelig lagring utenfor VPS-en, krypter kopiene,
sett daglig kjøring, avklar oppbevaring/sletting og prøv gjenoppretting fra ekstern
kopi. Oppbevar gjenopprettingsnøkler separat fra serveren. Dette er planlagt;
en lokal dump og backup før oppdatering oppfyller ikke alene backupkravet.

- Daglig: sjekk backup, helse og ledig disk. Slett utløpte økter med
  `bash scripts/production.sh exec -T backend python manage.py clearsessions`.
  Automatiser med cron/systemd på valgt server, med varsling ved feil.
- Ukentlig: vurder sikkerhetsoppdateringer og logger. Test nye bilder før
  utrulling; håndter kritiske sikkerhetsoppdateringer raskt.
- Månedlig: prøv ekstern gjenoppretting og kontroller faktura mot budsjettet.
  Kostnadsvarsler er ikke et hardt tak; ingen automatisk kapasitetsøkning.
- PostgreSQL-hovedoppgradering krever egen plan. Ikke bytt hovedversjon over
  eksisterende datavolum, og ikke bruk `down --volumes` i produksjon.

Før offentlig registrering gjenstår også ratebegrensning, kontosletting,
personvern/avtaler og gjennomgang av OAuth etter ADR 001/003. Overvåking og
ressursbehov må kontrolleres på valgt server. Serverkjøp alene åpner ikke appen.

Grunnlag: [Djangos produksjonskontroll](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/),
[proxy-krav](https://docs.djangoproject.com/en/5.2/ref/settings/#secure-proxy-ssl-header),
[Caddys SPA-mønster](https://caddyserver.com/docs/caddyfile/patterns#single-page-apps-spas)
og [Compose-oppstartsrekkefølge](https://docs.docker.com/compose/how-tos/startup-order/).
