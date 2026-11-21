# Telekomi ja IT ärimudelite kaardistuse struktuur

**Roll:** äriarenduse juht / toote- ja teenusearenduse partner
**Eesmärk:** ühtne raamistik, mille alusel kaardistada telekommunikatsiooni- ja IT-ettevõtteid, nende tooteid ja ärimudeleid arenenud riikides ning sõeluda välja olulised signaalid ja trendid.
**Staatus:** kinnitatud struktuur (v0.2), 2026-11-21

---

## 1. Juhtmõte: kaardistus toimub viiel tasandil

Kogu info seotakse viie tasandi hierarhiasse. Iga kirje säilitab viite algallikale.

| Tasand | Küsimus, millele vastab | Näide |
|---|---|---|
| **1. Turg (riik)** | Millises keskkonnas ettevõte tegutseb? | Soome, Holland, Jaapan |
| **2. Ettevõte** | Kes on tegija ja milline on tema positsioon? | Elisa, KPN, Rakuten Mobile |
| **3. Tootekategooria** | Millist tüüpi teenus see on? (ühtne taksonoomia) | B2C mobiil, B2B SD-WAN, B2B küberturve |
| **4. Toode / teenus (pakkumine)** | Mida täpselt pakutakse ja kellele? | "Elisa Saunalahti Huoleton", "KPN Zakelijk SD-WAN" |
| **5. Pakett / hinnatase + lisateenused** | Mis on sees, mis on juurde ostetav, mis maksab? | S/M/L paketid, roaming, Netflix, turvapakett |

Lisaks kaks läbivat objektitüüpi:

- **Signaal** – ajaline sündmus (uudis, turuletulek, hinnamuutus, M&A, regulatsioon, analüütiku järeldus), mis on seotud mõne ülaltoodud tasandiga ja märgistatud trenditeemadega.
- **Allikas** – iga kirje päritolu: URL, dokumendi tüüp, kuupäev, kogumise aeg, tekstikoopia, usaldusväärsus.

---

## 2. Tasand 1: Turg (riik)

Eesmärk: anda ettevõtte ja toote kaardile kontekst, ilma milleta võrdlus riikide vahel eksitab.

| Väli | Sisu | Allikas |
|---|---|---|
| Üldnäitajad | rahvaarv, leibkonnad, SKP/elaniku kohta, valuuta, PPP-koefitsient | Eurostat, OECD, Maailmapank |
| Turustruktuur | operaatorite arv (MNO/MVNO), turuosad mobiilis/fikses/TV-s, HHI | regulaator, GSMA Intelligence |
| Penetratsioon | SIM/elanik, 5G osakaal, fiiber (homes passed / connected), FMC-osakaal | regulaator, FTTH Council, Ericsson Mobility Report |
| Hinnatase | ARPU mobiil/fiks, hind 1 GB kohta, hind 100 Mbit/s kohta | regulaator, Rewheel, cable.co.uk |
| Regulatsioon | sagedusoksjonid, netineutraalsus, rändlus, hulgimüügi kohustused, ühinemiste kontroll | regulaator (TTJA, Traficom, PTS, Ofcom, BNetzA, ARCEP, CNMC, ACM, AGCOM jt), BEREC |
| Turudünaamika | ühinemised, uued sisenejad, hinnasõjad, konsolideerumine | uudised, analüütikud |

**Sihtriikide ettepanek (prioriteedi järjekorras):**

1. **Põhjala ja Baltikum** – Soome, Rootsi, Norra, Taani, Läti, Leedu (meile kõige otsesem võrdlusbaas)
2. **Lääne-Euroopa liidrid** – Holland, Belgia, Saksamaa, Austria, Šveits, Suurbritannia, Iirimaa
3. **Lõuna-Euroopa** – Hispaania, Portugal, Itaalia, Prantsusmaa (tugevad challengerid: Digi, Iliad/Free, MasOrange)
4. **Kesk-Euroopa** – Poola, Tšehhi
5. **Väljaspool Euroopat** – USA, Jaapan, Lõuna-Korea, Singapur, Austraalia, Kanada (trendide varajased signaalid)

---

## 3. Tasand 2: Ettevõte

### 3.1 Profiil

| Väli | Sisu |
|---|---|
| Identiteet | nimi, brändid ja alambrändid (nt Telia / Halebop, Telefónica / O2 / Movistar), kontsern, omanikud, börsinimekiri |
| Positsioon turul | turuliider / challenger / nišš / MVNO / kaabel / digi-alambränd / IT-integraator |
| Tegevusala | mobiil, fiks, TV, IT-teenused, pilv, andmekeskused, IoT, hulgimüük, energia, fintech |
| Segmendid | B2C, SOHO, SME, suurettevõte, avalik sektor, hulgimüük |
| Strateegia | avaldatud strateegiaperiood, prioriteedid, "equity story" sõnumid, suurimad investeeringud |
| Organisatsioon | IT/ICT üksus (nt T-Systems, Orange Business, Telia Cygate, Elisa Santa Monica), partnerid |

### 3.2 Ettevõtte KPI-d (ajareas, kvartali- või aastapõhiselt)

| KPI-grupp | Mõõdikud |
|---|---|
| Finants | käive kokku, teenusekäive, käive riigiti ja segmenditi (B2C / B2B / hulgimüük / IT), EBITDA(aL) ja marginaal, capex ja capex/käive, vaba rahavoog, netovõlg/EBITDA |
| Kliendid | mobiiliklientide arv (postpaid / prepaid / M2M eraldi), fiksvõrgu kliendid (DSL/kaabel/fiiber), TV-kliendid, FMC-kliendid, B2B-kliendid |
| Ühikumajandus | ARPU mobiil, ARPU fiks, ARPA (B2B kontode kohta), ARPU-muutus a/a |
| Kvaliteet | churn (postpaid), NPS, võrgu kvaliteedi auhinnad (Opensignal, Ookla, umlaut) |
| Võrk | 5G katvus (rahvastikust), 5G SA olemasolu, fiibrimajapidamised passed/connected, vaskvõrgu sulgemise ajakava |
| B2B/IT | ICT-käibe osakaal, pilve/turbe käive, suurimad verticalid |
| Töötajad | töötajate arv, käive töötaja kohta |

Iga KPI väärtus kannab: periood, valuuta, kas see on raporteeritud või tuletatud, ja allikaviide (aastaaruande lehekülg või IR-esitluse slaid).

### 3.3 Ettevõtte tasandi Business Model Canvas

Ettevõtte canvas koostatakse aastaaruande ja strateegiasõnumite põhjal ning on toote canvas'te "vanem": toote canvas pärib ettevõtte blokid vaikimisi ja täpsustab neid.

---

## 4. Tasand 3: Tootekategooriate taksonoomia

Ühtne taksonoomia on kogu võrdluse selgroog. Ilma selleta ei saa "Elisa kodupaketti" KPN-i omaga kõrvutada.

### 4.1 B2C

| Kood | Kategooria | Alamkategooriad |
|---|---|---|
| C-MOB | Mobiilside | postpaid, prepaid, noorte-/perepaketid, andmeside-only, digi-alambränd |
| C-FIX | Kodune internet | fiiber, kaabel, DSL, FWA (5G koduinternet) |
| C-TV | TV ja meelelahutus | IPTV, OTT-rakendus, sisupaketid, partnerstriimingud (Netflix, Disney+, HBO, sport) |
| C-FMC | Konvergentsipaketid | mobiil + fiks + TV kombod, perekonto, lojaalsussoodustused |
| C-DEV | Seadmed ja rahastus | seadmete järelmaks, Device-as-a-Service, vahetusprogrammid, kindlustus |
| C-VAS | Lisateenused | turvalisus (viirusetõrje, ID-kaitse), pilvesalvestus, e-SIM/reisi-SIM, nutikodu, laste kaitse |
| C-DIV | Diversifikatsioon | energia, kindlustus, fintech/pangandus, tervis, lojaalsusprogramm |

### 4.2 B2B

| Kood | Kategooria | Alamkategooriad |
|---|---|---|
| B-MOB | Ärimobiil | paketid, pool/jagatud andmemaht, MDM, rahvusvahelised paketid |
| B-CON | Ühenduvus | ärifiiber, Ethernet, MPLS, SD-WAN, SASE, internet-VPN, dedikeeritud juurdepääs |
| B-P5G | Privaatvõrgud ja IoT | privaat-5G/LTE, IoT-ühenduvus (NB-IoT, LTE-M), IoT-platvormid, M2M-SIM-haldus |
| B-UCC | Kommunikatsioon | pilv-PBX, Teams/Webex-integratsioon, kontaktikeskus (CCaaS), SIP-trunk, CPaaS/SMS-API |
| B-CLD | Pilv ja andmekeskus | IaaS, private cloud, colocation, suveräänne pilv, hübriidpilve haldus, edge |
| B-SEC | Küberturve | hallatud turve (MDR/SOC), tulemüür, DDoS-kaitse, identiteet, turvakonsultatsioon |
| B-WRK | Hallatud IT ja töökoht | Modern Workplace, hallatud seadmed, helpdesk, M365 teenused, litsentsid |
| B-DIG | Digiteenused ja AI | andmeanalüütika, AI-lahendused, IoT-rakendused, vertikaalsed lahendused (tervishoid, logistika, tööstus) |
| B-WHS | Hulgimüük | MVNO-majutus, rahvusvaheline transiit, torn-/fiibrijagamine, rändlus |

Iga kategooria kohta hoitakse **kategooria kaarti**: turu suurus, kasvutempo, tüüpilised ärimudelid, peamised trendid ja analüütikute hinnangud (Gartner Magic Quadrant / Hype Cycle, IDC, Analysys Mason, Omdia).

---

## 5. Tasand 4: Toote / teenuse kaart (ühtne struktuur)

See on süsteemi põhiobjekt. Iga toode kaardistatakse täpselt samade plokkidega, et neid saaks avada kõrvuti.

### 5.1 Kirjeldavad plokid (kaardistusest)

| Plokk | Väljad |
|---|---|
| **A. Identiteet** | nimi, bränd, ettevõte, riik, kategooria (taksonoomia kood), elutsükli staatus (uus / aktiivne / lõpetatud), turuletuleku kuupäev, toote URL |
| **B. Sihtklient** | segment (B2C / SOHO / SME / suurettevõte), persona, ettevõtte suurus, vertikaal, kasutusjuht |
| **C. Pakkumise sisu** | põhikomponendid (mis on sees), lisateenused (mida saab juurde osta), tasemed/paketid (viide tasand 5), teenustaseme lubadused (SLA, kiirus, katvus) |
| **D. Hinnastus ja ärimudel** | hinnamudel (kuutasu / kasutuspõhine / tasuta+tasuline / ühekordne / tulujagamine), hinnapunktid (kohalik valuuta + EUR + PPP-korrigeeritud), lepingu pikkus, liitumistasu, soodustused (pere, kombo, lojaalsus), hinnatõusu mehhanism (CPI-indekseerimine) |
| **E. Kanal ja müük** | veebis / äpis / poes / partnerite kaudu / otsemüük; self-service tase; aktiveerimise kiirus (eSIM, sama päev) |
| **F. Tehnoloogilised võimaldajad** | 5G SA, fiiber, SD-WAN tehnoloogia, pilvepartner (Azure/AWS/Google/kohalik), sisupartner, platvorm |
| **G. Partnerid** | sisupartnerid, tehnoloogiapartnerid, edasimüüjad, hulgimüügipartnerid |
| **H. Ärimudeli arhetüübid** | sildid (vt ptk 7): konvergents, "more-for-more", digi-only, DaaS, ökosüsteem, B2B2C jne |
| **I. Allikad** | kõik kirje aluseks olevad allikad koos kuupäeva ja usaldusväärsuse hinnanguga |

### 5.2 Analüütilised plokid (kaardistuse + oma täienduste põhjal)

Need on viis komponenti, mida kindlasti soovitakse, pluss kaks soovitatavat lisa. Igal väljal on märge **päritolu**: `allikast` (automaatselt tuletatud, viitega) või `käsitsi` (kasutaja täiendus) ning versiooniajalugu.

#### 5.2.1 Business Model Canvas (Osterwalder, 9 plokki)

| Plokk | Mida telekomi/IT kontekstis kirja panna |
|---|---|
| Kliendisegmendid | kellele toode on mõeldud; massturg vs nišš; B2C persona või B2B ettevõtte profiil |
| Väärtuspakkumine | peamine lubadus (vt 5.2.4), funktsionaalne / emotsionaalne / majanduslik väärtus |
| Kanalid | veeb, äpp, pood, partnerid, otsemüük; omnikanali aste |
| Kliendisuhted | self-service, dedikeeritud haldur, kogukond, automatiseeritud; lojaalsusprogramm |
| Tuluvood | kuutasu, kasutustasu, seadmete müük/rahastus, lisateenused, ühekordsed tasud, hulgimüük |
| Võtmeressursid | võrk, sagedused, bränd, kliendibaas, IT-platvormid, andmed, partnerlepingud |
| Võtmetegevused | võrgu ehitus ja haldus, klienditeenindus, tootearendus, sisuhange, integratsioon |
| Võtmepartnerid | sisupakkujad, seadmetootjad, pilvepakkujad, võrgujagamise partnerid, edasimüüjad |
| Kulustruktuur | capex (võrk), opex (teenindus, turundus), sisu- ja litsentsikulud, hulgimüügikulud, seadmete subsiidiumid |

Canvas täidetakse esmalt automaatselt (allikast tuletatud väljad on nähtavalt märgistatud) ja kasutaja saab iga plokki täiendada, iga täiendus säilitab autori ja kuupäeva.

#### 5.2.2 Pain–Gain maatriks (Value Proposition Canvase kliendipool × tootepool)

| Dimensioon | Sisu |
|---|---|
| Kliendi tööd (jobs) | mida klient püüab saavutada (nt "olla ühenduses välismaal ilma üllatusarveta", "hallata 200 töötaja seadmeid ühest kohast") |
| Valud (pains) | takistused, riskid, frustratsioonid (hinna läbipaistmatus, lepingu lukustus, aeglane tugi, turvarisk) |
| Kasud (gains) | soovitud tulemused (lihtsus, kokkuhoid, kontroll, staatus, kindlus) |
| Valuleevendajad | millised toote omadused leevendavad milliseid valusid |
| Kasuloojad | millised omadused loovad milliseid kasusid |
| Sobivuse hinne | 0–3 iga valu/kasu kohta: kui hästi toode seda katab; tühjad kohad = võimalused |

Maatriks kuvatakse tabelina: read = valud/kasud, veerud = toote komponendid, lahtris sobivuse hinne. Võrdlusvaade: sama valu veerg üle mitme riigi toote.

#### 5.2.3 SWOT turu kontekstis

| Kvadrant | Sisemine/väline | Sisendid |
|---|---|---|
| Tugevused | sisemine | ettevõtte ressursid ja toote omadused, mis annavad eelise (võrk, bränd, hind, kombo) |
| Nõrkused | sisemine | puuduvad komponendid, kõrgem hind, keerukus, sõltuvus partnerist |
| Võimalused | väline (turg) | regulatsioon, konkurentide nõrkused, tehnoloogiamuutus, klientide muutuvad vajadused |
| Ohud | väline (turg) | uued sisenejad, hinnasurve, OTT-asendus, regulatiivsed piirangud |

SWOT tuletatakse turu kaardist (ptk 2) ja konkurentide toodete võrdlusest; iga väide kannab viidet.

#### 5.2.4 Väärtuspakkumise sõnumid

| Väli | Sisu |
|---|---|
| Peasõnum (headline) | tootelehe peamine lubadus sõna-sõnalt originaalkeeles + tõlge |
| Toetavad sõnumid | 3–5 alam-lubadust |
| Tõendid (proof points) | numbrid, auhinnad, garantiid, mida sõnumite toetuseks kasutatakse |
| Eristusväide | mille poolest väidetakse olevat parem konkurentidest |
| Toon ja raamistus | lihtsus / vabadus / turvalisus / hind / kvaliteet / jätkusuutlikkus |
| Sõnumi tüüp | funktsionaalne / emotsionaalne / majanduslik / sotsiaalne |

Sõnumid klassifitseeritakse, et leida mustreid: nt "kui suur osa Euroopa liidritest raamistab mobiilipaketi 'muretu' kaudu vs 'kiireim võrk' kaudu".

#### 5.2.5 Toote KPI-d

| KPI | Täpsustus |
|---|---|
| Kasutajate arv / klientide arv | kui avaldatud; muidu hinnang koos meetodiga |
| ARPU / ARPA | toote või segmendi tasandil |
| Hinnapunktid | sisenemishind, keskmine, premium; hind ühiku kohta (€/GB, €/Mbit/s, €/kasutaja/kuu) |
| Osakaal kliendibaasist | nt FMC-klientide osakaal, 5G-pakettide osakaal |
| Attach rate | lisateenuste osakaal põhitoote klientide seas |
| Kasvutempo | klientide ja käibe muutus a/a |
| Churn / NPS | kui toote tasandil avaldatud |

#### 5.2.6 Soovitatav lisa: hinnaarhitektuur

Hinnaredel (tasemed ja mille eest hüpe), hinnaankrud, "head-better-best" loogika, perekonto loogika, ühikuhind, hinnatõusu praktikad. Just siin tekivad kõige kiiremini kopeeritavad mustrid.

#### 5.2.7 Soovitatav lisa: "Mida see meile tähendab"

Vaba tekstiga plokk, kus kasutaja (või süsteem ettepanekuna) märgib: asjakohasus meie turule (1–5), hüpotees, järgmine samm, omanik. See teeb süsteemist partneri, mitte arhiivi.

---

## 6. Tasand 5: Paketid ja lisateenused (normaliseeritud võrdluseks)

Et vastata küsimusele "võrdle EL-i turuliidrite mobiilipakette", tuleb iga pakett normaliseerida samadesse väljadesse.

### 6.1 B2C mobiilipakett

| Väli | Tüüp | Näide |
|---|---|---|
| Paketi nimi ja tase | tekst, S/M/L/XL | "Huoleton L" |
| Kuutasu | number + valuuta + EUR + PPP | 29,90 € |
| Andmemaht | GB või piiramatu | piiramatu |
| Kiiruspiirang | Mbit/s või puudub | 300 Mbit/s |
| 5G | sees / lisatasu / puudub | sees |
| Kõned ja SMS | piiramatu / minutid | piiramatu |
| EL-rändlus | GB piirang (FUP) | 40 GB |
| Rahvusvahelised kõned | sees / lisatasu | lisatasu |
| Sisupartnerid | loend | Netflix Standard sees |
| Turva- ja lisateenused | loend | viirusetõrje sees |
| Lepingu pikkus | kuud | 0 / 24 |
| Peresoodustus | % või € lisaliini kohta | -5 €/liin |
| eSIM, mitu seadet | jah/ei, lisa-SIM hind | jah, 5 €/kuu |
| Lisateenuste kataloog | loend koos hindadega | reisi-SIM, lisa-GB, sisupaketid |

### 6.2 B2C koduinternet ja FMC

kiirus alla/üles, tehnoloogia, ruuter sees, TV-pakett, mobiiliga kombineerimise soodustus, paigaldustasu, lepingu pikkus.

### 6.3 B2B pakett

kasutajate/liinide arv, jagatud andmemaht, SLA (saadavus, reageerimisaeg), hind kasutaja või saidi kohta, minimaalne lepingu pikkus, haldusportaal, integratsioonid (Teams, M365), lisamoodulid.

---

## 7. Ärimudeli arhetüübid (sildid mustrite leidmiseks)

Iga toode märgistatakse ühe või mitme arhetüübiga. Mustrid tekivad, kui vaadata arhetüüpide levikut riigiti ja ajas.

| Arhetüüp | Kirjeldus | Näited |
|---|---|---|
| Konvergents (FMC) | mobiil + fiks + TV ühes lepingus, soodustus kombineerimisel | Orange Love, Telia Kaikki, Proximus Flex |
| More-for-more | iga tase annab rohkem (kiirus, 5G, sisu) kõrgema hinna eest | DT MagentaMobil, Vodafone GigaMobil |
| Lihtsustamine | 1–3 paketti, piiramatu kõik, läbipaistvus | T-Mobile US, Odido, Elisa |
| Digi-only alambränd | odav, ainult äpis, ilma teeninduseta | giffgaff, Smarty, Voxi, Halebop, Yettel |
| Seade teenusena (DaaS) | seade kuutasuga, vahetusprogramm, kindlustus | Telia Byt, Swisscom |
| Ökosüsteem / platvorm | operaator kui mitme teenuse koondaja (sisu, pangandus, energia) | Rakuten, Telefónica Miravia, KT |
| B2B2C | partner müüb operaatori teenust oma klientidele | kaubamärgistatud MVNO-d, pangad |
| Hulgimüügi-first | võrk kui platvorm teistele | Open Fiber, Cellnex-mudel, torn-spinoffid |
| Kasutuspõhine / tarbimine | maksad kasutatu eest, eriti B2B pilv/IoT | NaaS, IoT-ühenduvus |
| Hallatud teenus | operaator võtab vastutuse kogu lahenduse eest (SLA) | SD-WAN managed, MDR |
| Suveräänne / kohalik pilv | andmed riigis, regulatiivne eelis | DT T-Systems, Orange Bleu, Telia |
| AI-teenused | AI-lisandid B2C-s (abiline) ja B2B-s (lahendused) | SKT A., Docomo, Verizon |
| Lojaalsus ja kogukond | preemiad, kogukonnaboonused, eelised partnerite juures | Vodafone VeryMe, O2 Priority |

---

## 8. Signaalid ja trendid

### 8.1 Signaali struktuur

| Väli | Sisu |
|---|---|
| Pealkiri ja kokkuvõte | 1–3 lauset |
| Tüüp | uus toode / hinnamuutus / toote lõpetamine / partnerlus / M&A / regulatsioon / tehnoloogia / finantsraport / analüütiku järeldus |
| Seotud objektid | ettevõte, toode, kategooria, riik |
| Trenditeemad | sildid (vt 8.2) |
| Hinnangud | uudsus (1–5), mõju meie turule (1–5), kindlus (1–5), horisont (praegu / 1–2 a / 3+ a) |
| "So what" | lühike järeldus meie vaatest, hüpotees |
| Allikas | URL, kuupäev, tüüp |

### 8.2 Trenditeemade esialgne loend

Konvergents ja kombod · hinnalihtsustamine · CPI-indekseeritud hinnatõusud · 5G SA ja võrguviilutamine (slicing) · FWA · fiibrikonsolideerumine ja vaskvõrgu sulgemine · satelliit-mobiil (D2D) · eSIM ja digi-onboarding · AI klienditeeninduses ja võrgus · AI-teenused müügiks · küberturve massturule · suveräänne pilv · privaat-5G tööstusele · IoT platvormid · B2B ICT-käibe kasv · sisupartnerlused · energia ja fintech diversifikatsioon · jätkusuutlikkus · torn- ja fiibrivarade eraldamine · MVNO ja digi-alambrändid · regulatiivne konsolideerumine (4→3 ühinemised).

### 8.3 Trendiradar

Signaalid koondatakse radariks: teema × küpsus (eksperiment / varased liidrid / laialt levinud) × meie asjakohasus. Radar uueneb iga uue signaaliga.

---

## 9. Allikad ja kogumisprotsess

### 9.1 Allikaregister ettevõtte kohta

| Allikatüüp | Mida sealt võtta | Sagedus |
|---|---|---|
| Tootelehed (B2C ja B2B) | paketid, hinnad, komponendid, sõnumid | kuu, hinnamuutused kohe |
| Pressiteated / uudised | turuletulekud, partnerlused, muudatused | nädal |
| Investorsuhted: aastaaruanne, kvartaliraport, kapitaliturgude päev | KPI-d, strateegia, segmentide käive, canvas'e sisend | kvartal |
| Regulaatorid | turuosad, hinnad, penetratsioon, regulatsioon | kvartal / aasta |
| Analüütikud (Gartner, McKinsey, BCG, Analysys Mason, Omdia, IDC, GSMA Intelligence, Ericsson Mobility Report, Deloitte, PwC, Arthur D. Little) | kategooriate trendid, turuprognoosid, benchmark'id | avaldamisel |
| Erialameedia (Telecoms.com, Light Reading, Capacity, Fierce, Telecompaper, Mobile Europe) | signaalid, challengerite liikumised | päev/nädal |
| Erialaliidud (ETNO, GSMA, FTTH Council, BEREC aruanded) | turuülevaated, regulatiivne kontekst | avaldamisel |

### 9.2 Töövoog signaalist struktuurini

1. **Avastus** – allikaregistri jälgimine (RSS, lehe muutuste tuvastus, otsing).
2. **Kogumine** – tekst ja tekstikoopia (snapshot) salvestatakse koos URL-i ja ajatempliga.
3. **Struktureerimine** – sisu kaardistatakse ühtsesse skeemi (tasandid 1–5, signaali väljad); iga tuletatud väli saab kindluse hinde.
4. **Kontroll** – madala kindlusega väljad lähevad inimese kinnitusele; kasutaja täiendused märgitakse eraldi.
5. **Salvestus** – andmebaasi koos päritoluga: iga väärtus → allikas → dokumendi lõik.
6. **Analüüs** – võrdlused, mustrid, trendiradar, canvas'te ja SWOT-ide uuendamine.
7. **Edastus** – nädalakokkuvõte: 5–10 olulisimat signaali "so what" järeldusega.

### 9.3 Päritolu ja usaldusväärsus

- Esmane allikas (ettevõtte enda leht, aruanne, regulaator) > teisene (analüütik) > kolmandane (meedia).
- Iga väärtus kannab allikat, kogumise kuupäeva ja kindluse hinnet; vastuolulised väärtused säilitatakse mõlemad.
- Hinnad normaliseeritakse EUR-i (ECB kurss kogumise kuupäeval) ja PPP-korrigeerituna; algne valuuta jääb alles.

---

## 10. Milliseid küsimusi süsteem peab oskama vastata

Näidispäringud, mis määravad andmemudeli nõuded:

| Küsimus | Mida eeldab |
|---|---|
| Kuva kõigi EL-riikide suurimate mobiilioperaatorite käibed riigiti | ettevõtte KPI "käive riigiti" perioodiga; turuosa määrab "suurima" |
| Võrdle EL-i turuliidrite mobiilipakette: mis on sees ja mis lisatav | normaliseeritud paketistruktuur (6.1) + lisateenuste kataloog |
| Millised operaatorid pakuvad Netflixi paketi sees ja millise hinnaga | sisupartnerite väli paketil |
| Kuidas on viimase 12 kuu jooksul muutunud hind GB kohta Põhjalas | paketi ajalugu (versioonid) ja ühikuhind |
| Millised B2B küberturbe teenused on Põhjala operaatoritel ja millise ärimudeliga | B-SEC kategooria tootekaardid + arhetüübid |
| Millised uued trendid on viimase kvartali signaalides kõige sagedamini | signaalide trendisildid ajas |
| Ava Elisa ja KPN-i kodupaketi canvas'ed kõrvuti | toote canvas ühtse struktuuriga |
| Milliseid valusid keegi Euroopas veel ei lahenda | pain–gain maatriksite koondvaade: valud, mille sobivuse hinne on kõikjal madal |

---

## 11. Esimese etapi ulatus (kinnitatud)

| Dimensioon | Esimene etapp |
|---|---|
| Segment | **B2B.** B2C kategooriad jäävad taksonoomiasse olemas, kuid kaardistus algab B2B-st; B2C lisatakse hiljem |
| Ettevõtted | **Telekommunikatsiooni operaatorid ja nende IT-harud** (nt Telia Cygate, Elisa Santa Monica, T-Systems, Orange Business). Puhtad IT-integraatorid jäävad hilisemaks võrdlusbaasiks |
| Riigid | Soome, Rootsi, Norra, Taani, Holland, Saksamaa, Suurbritannia, Eesti võrdlusbaasina; laieneb hiljem |
| Kategooriad | B-MOB, B-CON, B-P5G, B-UCC, B-CLD, B-SEC, B-WRK, B-DIG, B-WHS |
| Analüüsiplokid | canvas, pain–gain, SWOT, väärtussõnumid, KPI-d, hinnaarhitektuur, "mida see meile tähendab" |
| Allikad | tootelehed, viimane aastaaruanne, regulaatori turuülevaade, analüütikuraportid kategooria kohta |

## 12. Kinnitatud otsused

1. **Fookus:** esimeses etapis B2B, B2C lisatakse hiljem.
2. **Ettevõtete ring:** esmalt telekommunikatsiooni operaatorid, nende IT-harud ja tooted.
3. **Keel:** tootekaardid koostatakse **eesti keeles**, et sisu oleks kiiresti haaratav. Väärtuspakkumise peasõnum säilitatakse lisaks originaalkeeles, et sõnumianalüüs ei kaotaks nüansse.
4. **Ligipääs:** sait ei ole kunagi avalik. Ligipääs on piiratud e-posti ja parooliga, kasutajaid lisab administraator (iseregistreerimist ei ole).
5. **Mitmekeelsus:** kasutajaliides on mitmekeelne (alguses eesti ja inglise), et tulevikus jagada süsteemi ka inimestega, kes eesti keelt ei räägi. Sisu (tootekaardid) on eesti keeles; sisu tõlkimine on hilisem etapp.
