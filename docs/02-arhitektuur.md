# Rakenduse arhitektuur

**Staatus:** v0.3, 2026-11-21 (Cloudflare Workers + D1 + kaardistusmoodul)

## 1. Eesmärk ja põhimõtted

- Sisemine, piiratud ringile mõeldud analüüsitööriist. Mitte kunagi avalik.
- Iga andmeväärtus kannab päritolu: allikas (URL, kuupäev) või käsitsi sisestus (autor, kuupäev).
- Ühtne struktuur üle kõigi toodete, et võrdlus oleks üks päring, mitte käsitöö.
- Lihtne käitada: serverivaba Cloudflare Workers + D1 (SQLite pilves), juurutus otse GitHubi harust.

## 2. Tehnoloogiavalik

| Kiht | Valik | Põhjendus |
|---|---|---|
| Raamistik | Next.js 15 (App Router, React 19, TypeScript) OpenNext Cloudflare adapteriga | serveripoolne renderdus, server actions vormidele, jookseb Cloudflare Workers'is |
| Andmebaas | Cloudflare D1 (SQLite) + Drizzle ORM | serverivaba, varundus ja ajas tagasi kerimine (Time Travel) sisse ehitatud; sama skeem töötab kohalikus D1-s arenduses |
| Autentimine | oma lahendus: e-post + parool (PBKDF2-SHA256, WebCrypto), serveripoolsed sessioonid küpsises | ei sõltu välisteenustest; iseregistreerimist ei ole, kasutajaid lisab admin; esimene admin luuakse `/setup` lehel, mis töötab ainult tühja kasutajate tabeliga |
| Mitmekeelsus | next-intl ilma URL-i prefiksita, keel küpsises | UI-stringid `messages/et.json` ja `messages/en.json`; lisakeel = üks fail |
| Stiil | Tailwind CSS 4 | kiire, ühtne, ilma komponenditeekide lukustuseta |

## 3. Andmemudel (tabelid)

Vastab dokumendile 01 (tasandid 1–5 + signaalid + allikad).

| Tabel | Sisu |
|---|---|
| `users`, `sessions` | kasutajad (roll: admin / editor / viewer), sessioonid |
| `markets` | riigid: kood, nimi, valuuta, regulaator, makronäitajad |
| `companies` | operaatorid ja IT-harud: positsioon, kontsern, veebileht, strateegia; `parent_id` seob IT-haru emaettevõttega |
| `company_kpis` | KPI ajarida: mõõdik, periood, väärtus, ühik, valuuta, allikas |
| `categories` | tootekategooriate taksonoomia (kood, segment B2B/B2C, nimi) |
| `products` | tootekaart: identiteet, sihtklient, sisu, hinnamudel, kanal, tehnoloogia, partnerid, staatus, URL |
| `product_plans` | paketid/tasemed: normaliseeritud väljad (hind, ühik, SLA, kasutajate arv, sisu) + `attributes` JSON kategooriaspetsiifilisteks väljadeks |
| `product_addons` | lisateenuste kataloog |
| `archetypes`, `product_archetypes` | ärimudeli arhetüübid ja sidumine |
| `canvas_blocks` | Business Model Canvas: 9 plokki × kirjed, igal kirjel `origin` (source/manual), autor, allikas |
| `pain_gain_items` | valud/kasud/tööd + leevendaja/kasulooja + sobivuse hinne 0–3 |
| `swot_items` | kvadrant + väide + allikas |
| `value_messages` | sõnumitüüp (headline/supporting/proof/differentiator), tekst eesti keeles, originaaltekst, toon |
| `product_kpis` | toote KPI-d perioodiga |
| `insights` | "mida see meile tähendab": asjakohasus 1–5, hüpotees, järgmine samm |
| `sources` | allikaregister: URL, tüüp, pealkiri, kuupäev, kogumise aeg, usaldusväärsus, väljavõte |
| `entity_sources` | mis tahes kirje ↔ allikas (päritolu) |
| `signals`, `signal_tags`, `trend_tags` | signaalid, hinnangud (uudsus/mõju/kindlus/horisont), trenditeemad |
| `audit_log` | kes mida muutis |

Kõik vabatekstid on eesti keeles. Väljad `*_original` hoiavad originaalkeelset teksti seal, kus see on analüüsiks oluline.

## 4. Turvamudel

- Kogu sait on `proxy`/middleware'i taga: ilma kehtiva sessioonita suunatakse `/login` lehele.
- Paroolid PBKDF2-SHA256 räsiga (100 000 iteratsiooni, juhuslik sool), sessioonitoken juhuslik 32 baiti (salvestatakse SHA-256 räsina), küpsis `HttpOnly; Secure; SameSite=Lax`, aegumine 30 päeva.
- Rollid: `admin` (kasutajate haldus), `editor` (sisu muutmine), `viewer` (ainult lugemine).
- Esimene admin luuakse `/setup` lehel (ainult kui kasutajaid pole), iseregistreerimist ei ole.
- Rate-limit sisselogimisele (5 katset / 15 min / e-post).

## 5. Kaardistusmoodul (kodulehtede kaardistus)

### 5.1 Põhimõte

Kaardistus laadib ettevõtte kodulehed alla **Workeris endas** (tavaline `fetch`), teisendab HTML-i puhastatud tekstiks ja laseb Claude'il teksti ühtsesse skeemi lugeda. Iga lehe tekstikoopia, räsi ja väljavõte salvestatakse (`mapping_pages`), igast lehest tekib allikas (`sources`), ja iga toote kirje viitab allikale. Nii säilib päritolu ja kordusjooksul saab muutumatu sisu väljavõtte taaskasutada ilma uue mudelikutseta.

### 5.2 Miks mitte Claude'i enda veebitööriist

Claude'i `web_fetch` server-tööriist oleks lihtsam, aga siis puuduks meil lehe tekstikoopia ja räsi (päritolu nõue), raskem oleks kontrollida mahtu ja kulu ning pole võimalik kordusjooksul muutumatuid lehti vahele jätta. Omaenda fetch + Claude struktureeritud väljund annab mõlemad.

### 5.3 Mudelid

| Samm | Vaikemudel | Effort | Põhjendus |
|---|---|---|---|
| URL-ide valik | `claude-opus-5-5` | low | odav klassifitseerimine, kvaliteet oluline õigete lehtede leidmiseks |
| Lehe väljavõte (tooted, paketid, hinnad, tingimused) | `claude-opus-5-5` | medium | struktureeritud väljund Zod-skeemi järgi; täpsus hindade ja tingimuste puhul |
| Toodete ühendamine üle lehtede | `claude-opus-5-5` | medium | dubleerimise vältimine, kategooria ja arhetüüpide määramine |
| Süntees: canvas, pain–gain, SWOT | `claude-opus-5-5` | high | sisuline analüüs, kus mudeli võimekus on otsustav |

Mudelid on ettevõtte seadistuses valitavad (`claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`). Kõik kutsed kasutavad adaptiivset mõtlemist (vaikimisi), `fallbacks: "default"` (turvaklassifikaatori keeldumise korral teine mudel) ja süsteemiprompti vahemälu.

Kulu suurusjärk: keskmise lehe väljavõte ~15–30k sisendtokenit ja ~2–4k väljundtokenit; 30 lehe ja 10 toote kaardistus Opus 5.5-ga jääb tüüpiliselt 2–5 USD vahemikku. Töö lehel kuvatakse tokenite arv ja hinnang.

### 5.4 Töövoog (Cloudflare Workflows)

`MapCompanyWorkflow` sammud, igaüks kordustega ja ajalimiidiga:

1. **discover** – seemne-URL-id, nende lingid (2 taset vihjete järgi), `sitemap.xml`; eelfilter; Claude valib kuni *max lehte*.
2. **page:<id>** – iga leht: fetch → tekst → räsi; kui sama räsi on juba varem loetud, taaskasutatakse väljavõte; muidu Claude ekstraheerib tooted; luuakse allikas.
3. **merge** – Claude ühendab lehtede leiud kanooniliseks tooteloendiks; tooted salvestatakse (`source_key` järgi uuendus või uus), paketid ja lisateenused asendatakse, väärtussõnumid (`origin=source`) asendatakse, arhetüübid seotakse, allikad seotakse toote külge. Toode märgitakse **ülevaatust vajavaks**.
4. **synthesize:<id>** – iga toote kohta Claude koostab Business Model Canvase, Pain–Gain maatriksi ja SWOT-i; `origin=source` kirjed asendatakse, käsitsi lisatud kirjed jäävad alles.
5. **finish** – töö staatus, ajastuse järgmine aeg.

Käivitus: käsitsi ettevõtte kaardilt (nupp) või cron (`17 3 * * *` UTC), mis käivitab kõik seadistused, mille `next_run_at` on käes. Ühel ettevõttel saab korraga käia üks töö. Tööd saab katkestada (Workflow terminate).

### 5.5 Tabelid

- `mapping_configs` – seemne-URL-id, vihjed, välistused, segment, lehtede piir, regulaarsus päevades (0 = käsitsi), mudelid, keel, lubatud, viimane/järgmine aeg.
- `mapping_jobs` – staatus, faas, Workflow-instants, seadistuse hetkkoopia, loendurid, tokenid, logi, viga.
- `mapping_pages` – URL, staatus, HTTP, räsi, tekst, väljavõte (JSON), leitud toodete arv, allikas.
- `products` sai väljad `source_key`, `review_status`, `last_mapped_at`.

### 5.6 Saladused ja piirangud

- `ANTHROPIC_API_KEY` on Workeri saladus (`npx wrangler secret put ANTHROPIC_API_KEY` või dashboard). Ilma selleta kaardistus ebaõnnestub selge veateatega.
- `LLM_MOCK=1` (ainult arenduses) asendab mudeli deterministliku mockiga; `ALLOW_PRIVATE_FETCH=1` lubab testiks localhosti.
- Töötab ainult serveripoolselt renderdatud HTML-iga. JavaScriptiga renderdatud lehtede jaoks on järgmine samm Cloudflare Browser Rendering.
- Lehe tekst kärbitakse 60 000 märgini; kandidaat-URL-e antakse mudelile kuni 400.

## 6. Juurutus

- **Cloudflare Workers Builds:** Worker `productmanagement` on seotud GitHubi repoga; iga push harusse käivitab build'i käsuga `npx opennextjs-cloudflare build` ja juurutuse käsuga `npx opennextjs-cloudflare deploy`.
- **Konfiguratsioon:** `wrangler.jsonc` (Workeri nimi, D1 sidumine `DB`, staatilised failid, `nodejs_compat`).
- **Andmebaas:** D1 `productmanagement-db`; migratsioonid kaustas `drizzle/`, rakendatakse käsuga `npx wrangler d1 migrations apply DB --remote`.
- **Kohalik arendus:** `npm run db:migrate:local` ja `npm run dev` (Next dev koos kohaliku D1-ga) või `npm run preview` (ehitab Workeri ja käivitab selle `wrangler dev` all, lähim toodangule).
- **Soovitus:** lisada Workeri ette Cloudflare Access (Zero Trust) täiendava kaitsekihina, kuna sait on ainult piiratud ringile.
