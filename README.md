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
| Kaardistus | ettevõtte kodulehe automaatne kaardistus Claude'iga: tooted, paketid, hinnad, tingimused, lisateenused + canvas, pain–gain, SWOT; käsitsi või regulaarselt |
| Kasutajad | admin / toimetaja / lugeja; kasutajaid lisab ainult admin |

Kasutajaliides on eesti ja inglise keeles (vahetus külgribal). Sisu (tootekaardid) on eesti keeles.

## Kus sait töötab

Rakendus jookseb Cloudflare Workers'is (Worker `productmanagement`) koos D1 andmebaasiga `productmanagement-db`. Iga push harusse `claude/friendly-hamilton-wlug4d` käivitab Cloudflare'is build'i ja juurutuse.

**Claude API võti:** kaardistusmoodul vajab Workeri saladust `ANTHROPIC_API_KEY` (Cloudflare dashboard → Workers → productmanagement → Settings → Variables and Secrets, või `npx wrangler secret put ANTHROPIC_API_KEY`).

**Esmakäivitus:** ava saidi aadress. Kui kasutajaid veel ei ole, suunatakse sind lehele `/setup`, kus lood esimese administraatori ja laed alusandmed. Pärast seda töötab ainult `/login`.

## Kohalik arendus

Eeldused: Node.js 22.

```bash
npm install
```

```bash
npm run db:migrate:local
```

```bash
npm run dev
```

Ava http://localhost:3000. Kohalik D1 elab kaustas `.wrangler/` (ei lähe git'i). Kopeeri `.dev.vars.example` → `.dev.vars` ja täida (`LLM_MOCK=1` võimaldab kaardistust testida ilma API võtmeta). Toodangulähedane eelvaade Workeri käitusajal:

```bash
npm run preview
```

## Käsud

| Käsk | Mida teeb |
|---|---|
| `npm run dev` | Next.js arendusserver kohaliku D1-ga |
| `npm run preview` | ehitab Workeri ja käivitab `wrangler dev` all |
| `npm run deploy` | ehitab ja juurutab käsitsi Cloudflare'i (tavaliselt teeb seda GitHubi push) |
| `npm run typecheck` | TypeScripti kontroll |
| `npm run db:generate` | genereerib uue migratsiooni pärast `src/db/schema.ts` muutmist |
| `npm run db:migrate:local` | rakendab migratsioonid kohalikule D1-le |
| `npm run db:migrate:remote` | rakendab migratsioonid toodangu D1-le |

Alusandmed (turud, ettevõtted, taksonoomia, arhetüübid, trenditeemad) laetakse `/setup` lehel või hiljem admini vaates nupuga "Lisa puuduvad alusandmed". Laadimine on idempotentne.

## Rollid

- **admin** – kõik, sh kasutajate haldus ja toodete kustutamine
- **editor** – sisu lisamine ja muutmine
- **viewer** – ainult lugemine

## Struktuur

```
docs/                 metoodika ja arhitektuur
drizzle/              SQL-migratsioonid (D1)
wrangler.jsonc        Cloudflare Workeri ja D1 seadistus
open-next.config.ts   OpenNext Cloudflare adapter
src/db/               skeem, D1 ühendus, alusandmete seed
src/mapping/          kaardistusmoodul: HTML→tekst, fetch, Claude kutsed, torujuhe, Workflow, ajastus
worker.ts             Workeri sisendpunkt: Next.js + cron + Workflow
src/lib/auth.ts       sessioonid ja rollid
src/lib/actions/      server actions (sisselogimine, esmakäivitus, sisu muutmine)
src/lib/queries.ts    päringud
src/messages/         UI tõlked (et, en)
src/components/       taaskasutatavad komponendid (canvas, allikad, tabid)
src/app/(app)/        kaitstud lehed
src/app/login/        sisselogimine
src/app/setup/        esmakäivitus (ainult tühja kasutajate tabeliga)
```

## Kaardistusmoodul

Ettevõtte kaardil on plokk "Kodulehe kaardistus": määra alguslehed, vihjed, välistused, lehtede piir, regulaarsus ja mudelid, salvesta ning vajuta "Käivita kaardistus". Töö kulgu näeb töö lehel (logi, lehed, tokenid, kulu). Tulemuseks on tootekaardid staatusega "vajab ülevaatust"; allikast pärit kirjed on märgitud eraldi ja käsitsi lisatud kirjed jäävad kordusjooksul alles. Ajastatud kaardistused käivitab cron iga päev 03:17 UTC. Täpsem kirjeldus: `docs/02-arhitektuur.md` ptk 5.

## Järgmised etapid

1. Aastaaruannete, regulaatorite ja analüütikute allikate kaardistus (teine moodul).
2. JavaScriptiga renderdatud kodulehtede tugi (Cloudflare Browser Rendering).
3. Nädalane signaalide kokkuvõte.
3. Sisu tõlkimine inglise keelde jagamiseks.
4. B2C kategooriate kaardistus.
