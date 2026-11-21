# Telco Intel – telekomi ja IT ärimudelite kaardistus

Sisemine tööriist telekommunikatsiooni- ja IT-ettevõtete, nende toodete ja ärimudelite kaardistamiseks ning võrdlemiseks üle arenenud riikide. Ligipääs on piiratud (e-post + parool), sait ei ole kunagi avalik.

- Kaardistusstruktuur ja metoodika: [`docs/01-kaardistusstruktuur.md`](docs/01-kaardistusstruktuur.md)
- Arhitektuur ja andmemudel: [`docs/02-arhitektuur.md`](docs/02-arhitektuur.md)

## Mida rakendus sisaldab

| Vaade | Sisu |
|---|---|
| Turud | 24 riiki (prioriteedi järgi), regulaator, valuuta |
| Ettevõtted | 81 operaatorit ja IT-haru alusandmetena; profiil, KPI-d ajareas, ettevõtte Business Model Canvas, allikad |
| Tooted | ühtne tootekaart + paketid ja lisateenused + Business Model Canvas + Pain–Gain maatriks + SWOT + väärtussõnumid + KPI-d + "mida see meile tähendab" + allikad |
| Võrdle | 2–6 sama kategooria toodet kõrvuti ühtses struktuuris |
| Signaalid | uudised, turuletulekud, hinnamuutused jm, hinnatud uudsuse/mõju/kindluse järgi, trenditeemad ja trendiradar |
| Allikad | iga kirje päritolu: URL, tüüp, kuupäev, usaldusväärsus |
| Kasutajad | admin / toimetaja / lugeja; kasutajaid lisab ainult admin |

Kasutajaliides on eesti ja inglise keeles (vahetus külgribal). Sisu (tootekaardid) on eesti keeles.

## Käivitamine

Eeldused: Node.js 22.

```bash
npm install
npm run db:migrate
npm run db:seed
npm run user:create -- sinu@email.ee "turvaline-parool-10+" "Sinu Nimi" admin
npm run dev
```

Ava http://localhost:3000 ja logi sisse.

Toodangus:

```bash
npm run build
npm run start
```

Andmebaas on üks SQLite-fail `data/app.db` (varundus = faili koopia). Asukohta saab muuta muutujaga `DATABASE_PATH`. Toodangus tuleb rakendus panna HTTPS-iga pöördproksi (Caddy, nginx) taha, sest sessiooniküpsis on `Secure`.

## Käsud

| Käsk | Mida teeb |
|---|---|
| `npm run dev` | arendusserver |
| `npm run build` / `npm run start` | toodanguehitus ja käivitus |
| `npm run typecheck` | TypeScripti kontroll |
| `npm run db:generate` | genereerib uue migratsiooni pärast `src/db/schema.ts` muutmist |
| `npm run db:migrate` | rakendab migratsioonid |
| `npm run db:seed` | lisab alusandmed (turud, ettevõtted, taksonoomia, arhetüübid, trenditeemad); idempotentne |
| `npm run db:reset` | kustutab andmebaasi ja teeb migratsiooni + seemne uuesti |
| `npm run user:create -- <email> <parool> "<Nimi>" [admin\|editor\|viewer]` | loob või uuendab kasutaja käsurealt |

## Rollid

- **admin** – kõik, sh kasutajate haldus ja toodete kustutamine
- **editor** – sisu lisamine ja muutmine
- **viewer** – ainult lugemine

## Struktuur

```
docs/                 metoodika ja arhitektuur
drizzle/              SQL-migratsioonid
src/db/               skeem, ühendus, seed, migratsioon, kasutaja loomine
src/lib/auth.ts       sessioonid ja rollid
src/lib/actions/      server actions (sisselogimine, sisu muutmine)
src/lib/queries.ts    päringud
src/messages/         UI tõlked (et, en)
src/components/       taaskasutatavad komponendid (canvas, allikad, tabid)
src/app/(app)/        kaitstud lehed
src/app/login/        sisselogimine
```

## Järgmised etapid

1. Automaatne allikate kogumine ja struktureerimine (tootelehed, aastaaruanded, regulaatorid, analüütikud) koos inimese kinnitusega.
2. Nädalane signaalide kokkuvõte.
3. Sisu tõlkimine inglise keelde jagamiseks.
4. B2C kategooriate kaardistus.
