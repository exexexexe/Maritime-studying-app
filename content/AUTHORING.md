# Innehållsförfattande — riktlinjer

Hur frågor skrivs för Plugga Sjöexamen. Kör `npm run check:content` efter varje
ändring — fel bryter bygget, varningar ska åtgärdas innan `authorReviewed: true`.

## Grundregler

1. **Korrekthet ligger på alternativet, aldrig på positionen.** Varje alternativ
   har `isCorrect: true/false`. Appen blandar ordningen vid varje försök —
   skriv aldrig innehåll som antar att rätt svar står först.
2. **Exakt ett rätt svar.** Inga "alla ovanstående" eller "både A och B".
3. **Förklaringen är lektionen.** `explanationSv` ska förklara *varför* rätt
   svar är rätt och gärna varför den vanligaste felläsningen är fel — inte
   bara upprepa svaret.
4. **`authorReviewed: false` tills en människa granskat.** AI-utkast och
   ogranskade frågor får aldrig sättas till `true` i förbifarten.

## Distraktorer (fel svar)

En bra distraktor är ett svar som en student med en *vanlig missuppfattning*
skulle välja. En dålig distraktor är utfyllnad som ingen väljer.

- **Bygg på verkliga förväxlingar.** Sektorgrader förväxlas med varandra
  (112,5° / 135° / 225°), lanternkombinationer med närliggande betydelser
  (rött över vitt = fiske, vitt över rött = lots), styrbord med babord.
- **Parallell struktur.** Alternativen ska ha samma form och detaljnivå, så
  att formen inte avslöjar svaret. Ändra nyckelordet (siffran, färgen,
  ordningen) — inte meningsbyggnaden.
- **Längdparitet.** Rätt svar får inte vara det längsta/mest kvalificerade
  alternativet. Lintern varnar för längdavvikare.
- **Inget avslöjande ordval.** Undvik att rätt svar ensamt innehåller
  facktermen från frågan, absoluta ord ("alltid", "aldrig") i fel svar, eller
  tvekord ("kan möjligen") i rätt svar.
- **Tre distraktorer** är målet (fyra alternativ totalt). Färre ger varning.

## Bra kontra dåligt — tre exempel

### 1. Sektorfråga

**Bra** — alla alternativ är trovärdiga grader ur samma regelverk:

> Över hur stor båge lyser ett toppljus?
> - 225°, riktat förut ✓
> - 135°, riktat förut
> - 112,5°, riktat förut
> - 360°, synligt runtom

**Dåligt** — distraktorerna är omöjliga påhitt, rätt svar är längst och mest
kvalificerat:

> Över hur stor båge lyser ett toppljus?
> - 225°, från rätt förut till 22,5° akter om tvärs på vardera sidan ✓
> - 100°
> - 300°
> - Det beror på fartygets längd

### 2. Ljusbildsfråga

**Bra** — varje distraktor är en granne i regelverket som *nästan* stämmer:

> Rött ljus över vitt ljus, båda synliga runtom. Vad ser du?
> - Ett fiskefartyg som fiskar med annat redskap än trål ✓
> - Ett fiskefartyg som trålar          *(grönt över vitt — närliggande regel)*
> - Ett lotsfartyg i tjänst             *(vitt över rött — omvänd ordning)*
> - Ett ej manöverfärdigt fartyg som gör fart   *(rött över rött — närliggande)*

**Dåligt** — distraktorer från fel domän som ingen med grundkunskap väljer:

> Rött ljus över vitt ljus. Vad ser du?
> - Ett fiskefartyg som fiskar med annat redskap än trål ✓
> - En fyr
> - Ett flygplan
> - En bil på en strandväg

### 3. Regelfråga

**Bra** — distraktorerna är verkliga missuppfattningar om när regeln gäller:

> När ska ett fartyg föra lanternor?
> - Från solnedgång till soluppgång, samt vid nedsatt sikt ✓
> - Endast mellan klockan 22 och 06      *(tro att klockslag styr)*
> - Endast när andra fartyg finns i närheten   *(tro att det är situationsstyrt)*
> - Endast utanför skyddade farvatten    *(tro att det är områdesstyrt)*

**Dåligt** — avslöjande ordval: absolutord i distraktorerna, tvekord saknas
bara i rätt svar, och rätt svar återanvänder frågans formulering:

> När ska ett fartyg föra lanternor?
> - Fartyg för lanternor från solnedgång till soluppgång ✓
> - Aldrig på sommaren
> - Bara om kaptenen vill
> - Alltid, utan undantag

## Bild- och diagramfrågor

- `lantern`-frågor: ljusbilden definieras i `payload.scene` (positioner i ett
  100×60-fält). Kontrollera spegelbilden: ett fartyg *mot* betraktaren visar
  sitt gröna ljus till *vänster* i bilden.
- `chart_question` / `radar_question`: kräver `imageAsset` (relativ sökväg
  under `assets/content-images/`). Optimera för mobilskärm; inga
  fullupplösta scanningar. Fotograferat läromedel under `questions/` är
  **endast lokal referens** — upphovsrättsskyddat, får inte paketeras i appen
  eller pushas till repot.

## Lanternors sektordata (`lightSectors`, orbit-tränaren)

`payload.scene.lightSectors` driver orbit-tränaren (`src/app/orbit/
lantern.tsx`) — dra-runt-fartyget-övningen som tänder/släcker lanternor
efter deras verkliga COLREG-sektorer i stället för en förberäknad bild.
Frivilligt fält: de allra flesta `lantern`-frågor saknar det helt och
fungerar som vanligt (statisk bild, ingen orbit-koppling). Bara ett urval
fartygskonfigurationer är seedade hittills (`lan-maskin-014`, `lan-segel-
009`, `lan-sar-027` till `lan-sar-030`) — det här mönstret finns för att
du ska kunna bygga ut täckningen till fler av de ~100 återstående
lanternfrågorna.

**Struktur** — varje ljus i `payload.scene.lights[]` som ska styras av
orbit-tränaren behöver ett unikt `id` (bara inom det itemet, precis som
`radio_procedure`s blockid). `lightSectors[]` pekar på de id:na:

```json
{
  "lights": [
    { "id": "masthead", "color": "white", "x": 50, "y": 16 },
    { "id": "sidelight-stbd", "color": "green", "x": 60, "y": 30 },
    { "id": "sidelight-port", "color": "red", "x": 40, "y": 30 },
    { "id": "sternlight", "color": "white", "x": 50, "y": 38 }
  ],
  "hull": "silhouette",
  "captionSv": "Maskindrivet fartyg, i gång",
  "lightSectors": [
    { "lightId": "masthead", "startDeg": -112.5, "endDeg": 112.5 },
    { "lightId": "sidelight-stbd", "startDeg": 0, "endDeg": 112.5 },
    { "lightId": "sidelight-port", "startDeg": -112.5, "endDeg": 0 },
    { "lightId": "sternlight", "startDeg": 112.5, "endDeg": 247.5 }
  ]
}
```

- **Gradtal är relativ bäring, medurs från rätt förut (0°)** — samma
  konvention som resten av appen. `startDeg`/`endDeg` får skrivas åt
  vilket håll som helst (negativt tal, eller ett par som passerar 0°/360°
  om man vill) — `src/lantern/sectors.ts` normaliserar oavsett. Skriv det
  som läses naturligast för just den lanternan (toppljuset ovan som
  -112,5–112,5, akterljuset som 112,5–247,5).
- **Standardsektorer (Regel 21)**: toppljus 225° (-112,5 till 112,5),
  sidoljus 112,5° vardera (styrbord 0–112,5, babord -112,5–0), akterljus
  135° (112,5–247,5). Runtlysande ljus (ankarljus, fiskeljus,
  nödsignalljus): `startDeg: 0, endDeg: 360`.
- **Varje styrt ljus behöver en `lightSectors`-post** — ett ljus med `id`
  men utan matchande sektor blir permanent osynligt i tränaren;
  `check:content` varnar för det.
- **Osäker på en specifik konfigurations exakta regel** (t.ex. exakt
  gränslängd för bogseringens extra lanternor, eller fiskefartygets
  regler vid utstående redskap) — flagga `needsReview: true` med en
  konkret not i stället för att gissa. De seedade exemplen har redan
  gjort det där det var relevant.
- Bilden i `payload.scene` visar av nödvändighet **hela fartygets
  lanternuppsättning på en gång** (toppljus + båda sidoljus + akterljus
  samtidigt) — inte en enda realistisk betraktningsvinkel (ingen ser
  akterljuset och sidoljusen samtidigt i verkligheten). Formulera
  `questionSv` därefter, t.ex. "Vilket fartyg/status hör denna
  fullständiga lanternuppsättning till?" i stället för "vad ser du" —
  se de seedade exemplen.

## Fysiska sjökortsfrågor (`map_question`)

Vissa provrelevanta frågor kräver ett riktigt sjökort på papper och riktiga
plottinstrument (transportör, passare) för att lösas — precis som på det
riktiga provet, där kortarbetet sker på papper. Referenskorten är **SE61**
och **SE93** (standardiserade svenska övningssjökort).

**Upphovsrätt — följ exakt:** Sjökortsbilden i sig får **aldrig** paketeras,
scannas, beskäras eller på annat sätt återges i appen eller pushas till
repot — SE61/SE93 är upphovsrättsskyddade Sjöfartsverket-publikationer,
samma riskkategori som kursbokstexten (som redan hanteras genom
omskrivning till egna formuleringar). Att referera till ett korts egna
tryckta beteckningar — ett fyrnamn, en punkts nummer, en djupsiffra — som
vanlig text i en fråga är däremot en saklig hänvisning och helt okej, på
samma sätt som att nämna ett verkligt landmärke vid namn är okej.

**Struktur** — `map_question` har ingen `payload`; frågetexten ligger i
`instructions` på toppnivå, och `options` är tom (`[]`) om `answerMode` är
`"numeric_tolerance"`:

```json
{
  "type": "map_question",
  "chartRef": { "chart": "SE61", "edition": null },
  "instructions": "Bestäm bäringen från fyren vid X till bojen vid Y.",
  "answerMode": "numeric_tolerance",
  "answer": { "kind": "bearing", "expected": 134, "unit": "degrees", "tolerance": 2 },
  "options": []
}
```

- **`answerMode: "numeric_tolerance"`** — fritt siffersvar med tolerans.
  `answer.kind` styr både inmatningsformuläret och den enhet som visas:
  `bearing` (grader), `distance` (nautiska mil), `depth` (meter) tar ett
  enda tal i `answer.expected` + `answer.tolerance`; `position` tar
  `answer.expected: {lat, lon}` i decimalgrader och en `answer.tolerance`
  i meter (avstånd mellan svaret och rätt position, storcirkel).
  Bäringssvar hanterar 0°/360°-gränsen korrekt (359° och 2° ligger 3° ifrån
  varandra, inte 357°) — inget särskilt att tänka på vid författandet.
- **`answerMode: "mcq"`** — vanlig flervalsfråga, samma regler som alla
  andra `options`-baserade frågetyper (exakt ett rätt svar, tre
  distraktorer). Välj det här läget när flera rimliga diskreta svar gör
  sig bättre pedagogiskt än ett exakt tal (t.ex. "vilken typ av märke är
  detta").
- Skriv `instructions` så att en elev med kortet i handen och ingen annan
  kontext kan lösa uppgiften — referera kortets egna tryckta
  beteckningar/nummer för de punkter frågan gäller.
- `check:content` validerar `chartRef.chart` (måste vara `SE61`/`SE93`),
  att `instructions` finns, och att `answer`-formen matchar `answer.kind`.

**Bannern.** `ChartRequiredBanner` (samma komponent i drill- och
provläget) visas automatiskt före frågan för varje `map_question` — inget
extra att koppla in per skärm.

## Begreppskort (`term_card`)

Ett lättviktigt flashcard-format för terminologi — skiljer sig från
`mcq` genom att det inte är en flervalsfråga: eleven vänder kortet,
läser definitionen och bedömer själv om hen kunde det. Precis som alla
andra frågetyper går det in i samma SM-2-schema; det är bara
självrättningen (`recordAnswer` med ett självskattat sant/falskt) som
skiljer det åt.

**Struktur** — `term_card` har ingen `payload`; termen ligger i
`termSv`/`termEn` på toppnivå, och definitionen återanvänder
`explanationSv`/`explanationEn` (samma fält alla andra frågetyper redan
har) i stället för att duplicera ett eget definitionsfält. `options` är
tom (`[]`):

```json
{
  "type": "term_card",
  "termSv": "Babord",
  "termEn": "Port",
  "options": [],
  "explanationSv": "Vänster sida om fartyget, sett i färdriktningen framåt.",
  "explanationEn": "The left side of the vessel when facing forward.",
  "authorReviewed": false
}
```

- `termSv` är obligatoriskt. `termEn` är valfritt — om det saknas visas
  inte Sv/En-växlaren alls för det kortet (inget att växla till).
- `explanationSv`/`explanationEn` fungerar som kortets baksida — skriv
  dem som en kort, självständig definition (samma stil som en ordboks-
  förklaring), inte som facit till en fråga.
- Uteslutet från provläget automatiskt (en flashcard är inget riktiga
  provet ger) — bara drillbart.
- `check:content` validerar att `termSv` finns.

## Radioanrop, ordna byggblock (`radio_procedure`)

Testar strukturen och fullständigheten i ett VHF-anrop genom att eleven
trycker fram fraserna i rätt ordning, i stället för att svara på en
flervalsfråga om proceduren. Ingen fritext, inget drag-och-släpp — eleven
trycker på en fras i poolen för att lägga den sist i "Ditt anrop", och
trycker på en redan placerad fras för att ta bort den och försöka igen.
Se `IDEAS.md` (punkt 5) för ursprungsidén — det här bygger bara
"ordna byggblock"-nivån, inte fritext-med-nyckelordsmatchning-varianten.

**Struktur** — ingen `payload`, inga `options` (sätt `"options": []`).
Frågetexten ligger i `scenario`:

```json
{
  "type": "radio_procedure",
  "callType": "mayday",
  "scenario": "Du är ombord på M/S Maria. Maskinhaveri, positionen är känd. Sänd rätt nödanrop.",
  "vesselName": "Maria",
  "options": [],
  "requiredBlocks": [
    { "id": "b1", "text": "MAYDAY", "order": 1 },
    { "id": "b2", "text": "MAYDAY", "order": 2 },
    { "id": "b3", "text": "MAYDAY", "order": 3 },
    { "id": "b4", "text": "Detta är Maria", "order": 4 },
    { "id": "b5", "text": "Maria", "order": 5 },
    { "id": "b6", "text": "Maria", "order": 6 },
    { "id": "b7", "text": "Position 58°20,4' N 011°15,7' E", "order": 7 },
    { "id": "b8", "text": "Maskinhaveri, driver mot grund", "order": 8 },
    { "id": "b9", "text": "Behöver bogsering", "order": 9 },
    { "id": "b10", "text": "4 personer ombord", "order": 10 }
  ],
  "distractorBlocks": [
    { "id": "d1", "text": "PAN-PAN" },
    { "id": "d2", "text": "SÉCURITÉ" },
    { "id": "d3", "text": "Over and out" }
  ],
  "explanationSv": "..."
}
```

- `callType` — en av `mayday`, `pan-pan`, `securite`, `routine`, `mob`.
  Styr inget i appen just nu (ingen filtrering på det), men håller
  innehållet sökbart och gör avsikten tydlig vid granskning.
- `requiredBlocks` — det korrekta meddelandet, i ordning. `order` måste
  matcha blockets position i arrayen (1-indexerat) — `check:content`
  validerar det som skydd mot att raderna hamnar fel vid redigering.
  Minst 3 block.
- `distractorBlocks` — troliga men felaktiga tillägg, inte bara brus.
  Bygg på verkliga misstag: fel anropsprefix (Mayday/Pan-Pan/Sécurité
  förväxlade), irrelevant information som inte hör hemma i just det här
  anropet, eller en motsägelse mot scenariot. Sikta på 3+; lintern varnar
  under 2.
- **Poolen eleven ser är `requiredBlocks` + `distractorBlocks`, blandad per
  försök** — precis som `options` för mcq. Blockens `id` behöver bara vara
  unikt inom itemet (så `b1`/`d1`-mönstret ovan kan återanvändas i varje
  item), `check:content` kontrollerar det.
- **Rättning är exakt** — rätt endast om elevens sekvens matchar
  `requiredBlocks` exakt, utan något distraktorblock inblandat. Binärt
  rätt/fel, men appen visar *vad* som var fel (fel ordning, saknade delar,
  eller ett block som inte hör hemma) — se `src/lib/radio-procedure.ts`.
- **Namnge anropstypen i scenariot** (t.ex. "Sänd rätt nödanrop" för
  Mayday, "Sänd ett il-anrop" för Pan-Pan, "Sänd ett säkerhetsmeddelande"
  för Sécurité). Det här appens etablerade konvention — se `vhf-may-001`
  som redan skriver ut "(Mayday)" i frågetexten. Övningen testar
  *strukturen* eleven bygger, inte om eleven kan gissa vilken kategori
  scenariot tillhör.
- **Uteslutet från provläget** — precis som `term_card`, filtrerat i
  `src/exam/assemble.ts`. Motivering: det riktiga skriftliga provet är
  flerval/beräkning, inte en interaktiv byggövning. Bara drillbart.
- Går in i samma SM-2-schema som alla andra frågetyper — bara
  rättningslogiken (exakt sekvensmatchning i stället för `isCorrect` på
  ett `option`) skiljer den åt.

## Spårmärkning

Märk varje fråga med de spår där den faktiskt ingår i kunskapskraven:
`forarintyg`, `kustskeppare`, `klass8`, `vhf`. Osäker på en radar- eller
specialfråga? Märk bara `klass8` och flagga för granskning i stället för att
gissa brett.
