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

## Spårmärkning

Märk varje fråga med de spår där den faktiskt ingår i kunskapskraven:
`forarintyg`, `kustskeppare`, `klass8`, `vhf`. Osäker på en radar- eller
specialfråga? Märk bara `klass8` och flagga för granskning i stället för att
gissa brett.
