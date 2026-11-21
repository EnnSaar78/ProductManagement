# Rakenduse arhitektuur

**Staatus:** v0.2, 2026-11-21 (Cloudflare Workers + D1)

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

## 5. Kogumise torujuhe (järgmine etapp)

Allikad → kogumine (fetch + tekstikoopia) → struktureerimine LLM-iga ühtsesse skeemi (kindluse hinne igal väljal) → inimese kinnitus → salvestus päritoluga → analüüs. Esimeses versioonis on sisestus käsitsi ja impordi kaudu; automaatne kogumine lisatakse eraldi tööna (`jobs/`), mis kirjutab samasse andmebaasi.

## 6. Juurutus

- **Cloudflare Workers Builds:** Worker `productmanagement` on seotud GitHubi repoga; iga push harusse käivitab build'i käsuga `npx opennextjs-cloudflare build` ja juurutuse käsuga `npx opennextjs-cloudflare deploy`.
- **Konfiguratsioon:** `wrangler.jsonc` (Workeri nimi, D1 sidumine `DB`, staatilised failid, `nodejs_compat`).
- **Andmebaas:** D1 `productmanagement-db`; migratsioonid kaustas `drizzle/`, rakendatakse käsuga `npx wrangler d1 migrations apply DB --remote`.
- **Kohalik arendus:** `npm run db:migrate:local` ja `npm run dev` (Next dev koos kohaliku D1-ga) või `npm run preview` (ehitab Workeri ja käivitab selle `wrangler dev` all, lähim toodangule).
- **Soovitus:** lisada Workeri ette Cloudflare Access (Zero Trust) täiendava kaitsekihina, kuna sait on ainult piiratud ringile.
