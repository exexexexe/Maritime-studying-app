"""
Hand-synthesized prose for the Buoyage chapter — the second flagship
chapter (see README.md and prose/lanterns.py's module docstring for the
format and the copyright discipline behind it).
"""

CHAPTER_INTRO = (
    "Sjömärken gör i dagsljus vad lanternor gör i mörker: de talar om var det är säkert "
    "att vara och var det inte är det, utan att någon behöver säga ett ord. Sverige "
    "använder IALA:s system A, där rött hör hemma om babord och grönt om styrbord när "
    "man följer en farleds huvudriktning. Utöver de sidmärken de flesta känner till "
    "finns väderstrecksmärken, punktmärken och specialmärken — var och en med sin egen "
    "logik, men alla byggda på samma idé: form, färg och toppmärke ska gå att läsa av "
    "på långt håll, utan sjökort i handen."
)

TOPICS = {
    "top-buoy-lateral": [
        (
            "p",
            "Sidomärkenas betydelse utgår från en definierad ingående riktning — från "
            "sjön in mot hamn, eller uppåt i en farled. Den riktningen är inte alltid "
            "självklar och markeras då med en särskild symbol i sjökortet. Så länge man "
            "känner till åt vilket håll den ingående riktningen går är resten av "
            "systemet enkelt: håll röda babordsmärken om babord och gröna "
            "styrbordsmärken om styrbord.",
        ),
        (
            "p",
            "Färg och form bekräftar varandra. Babordsmärken är röda och har cylindrisk "
            "(plan) form om de är bojar; styrbordsmärken är gröna och har konisk "
            "(spetsig) form. Formen fungerar som en andra, oberoende bekräftelse av "
            "sidan — värdefull i dager på långt håll, innan färgen säkert går att "
            "urskilja. På prickar (fasta märken snarare än flytande bojar) ger "
            "topptecknet samma besked: cylinderformat topptecken markerar babord, "
            "konformat med spetsen uppåt markerar styrbord.",
        ),
        ("figure", "buoy-lat-001", "Babordsmärke, bojtyp — röd, cylindrisk form."),
        ("figure", "buoy-lat-002", "Styrbordsmärke, bojtyp — grön, konisk form."),
        (
            "p",
            "Ett tredje märke hör inte till någon sida alls: mittledsmärket "
            "(angöringsmärket) har röda och vita lodräta fält, ett rött klot som "
            "toppmärke och ett vitt ljus. Det markerar att det är fritt vatten runt om "
            "märket och kan därför passeras på vilken sida som helst — typiskt satt ut "
            "vid en farleds början, mitt i inloppet, innan farleden smalnat av till en "
            "sida att hålla.",
        ),
        ("figure", "buoy-lat-004", "Mittledsmärke — röda och vita lodräta fält, rött klot, passeras på valfri sida."),
        (
            "p",
            "Två likadana märken satta tätt intill varandra är sjöfartens sätt att "
            "flagga för ett hinder som ännu inte hunnit in i sjökortet. Märkena läses "
            "precis som vanligt utifrån vilken sida av den ingående riktningen man "
            "befinner sig på — går man med den ingående riktningen gäller den vanliga "
            "regeln, går man mot den (till exempel utåt i en farled) gäller den "
            "omvänt: ett babordsmärke ska då hållas om styrbord. Poängen är densamma "
            "oavsett riktning: passera på den sida märkena anger, med extra god "
            "marginal eftersom hindret är nytt och okänt.",
        ),
        (
            "p",
            "Ett sista att komma ihåg: det är förbjudet att förtöja i ett flytande "
            "sjömärke, även tillfälligt. Belastningen kan dra märket ur sitt läge så "
            "att det visar fel — och ett felplacerat sjömärke är farligare än inget "
            "märke alls, eftersom andra sjöfarande litar på att det står rätt.",
        ),
    ],
    "top-buoy-kardinal": [
        (
            "p",
            "Där ett sidomärke talar om vilken sida av en farled du ska hålla, talar "
            "ett väderstrecksmärke (kardinalmärke) om på vilken sida av själva faran "
            "det är säkert att vara. Ett ostmärke betyder inte att märket sitter i "
            "öster i någon absolut mening — det betyder att det fria, säkra vattnet "
            "finns öster om just det märket, och att faran alltså ligger väster om "
            "det. Samma logik gäller åt alla fyra håll: passera på den sida märket är "
            "uppkallat efter.",
        ),
        (
            "p",
            "Alla fyra kardinalmärken bär samma sorts topptecken — två svarta koner — "
            "men i olika kombinationer, och kombinationen går att minnas genom att "
            "konernas spetsar alltid pekar mot den svarta färgen på märkets kropp. "
            "Nordmärket har konerna med spetsarna uppåt och är svart upptill, gult "
            "nedtill — spetsarna pekar mot det svarta. Sydmärket är den omvända bilden: "
            "koner med spetsarna nedåt, gult upptill och svart nedtill. Ostmärket har "
            "konernas baser mot varandra (en äggform) och är svart med ett gult bälte "
            "i mitten. Västmärket har i stället spetsarna mot varandra (en midjeform, "
            "ibland minnesbetecknad som ett vinglas) och är gult med ett svart bälte i "
            "mitten.",
        ),
        ("figure", "buoy-kard-001", "Nordmärke — koner med spetsarna uppåt, svart över gult."),
        ("figure", "buoy-kard-002", "Sydmärke — koner med spetsarna nedåt, gult över svart."),
        ("figure", "buoy-kard-003", "Ostmärke — koner bas mot bas, svart–gult–svart."),
        ("figure", "buoy-kard-004", "Västmärke — koner spets mot spets."),
        (
            "p",
            "På natten bekräftas samma budskap av ljuskaraktären, och även den går att "
            "minnas med en enkel bild: tänk dig en klocka. Ostmärket blinkar tre "
            "snabba blixtar (klockan tre), sydmärket sex snabba blixtar följda av en "
            "lång blixt (klockan sex, med den långa blixten tillagd så att sexan aldrig "
            "misstas för något annat), västmärket nio snabba blixtar (klockan nio), och "
            "nordmärket blinkar oavbrutet utan paus — inget bestämt klockslag, bara "
            "kontinuerligt. Samtliga fyra använder vitt ljus.",
        ),
        (
            "p",
            "Två ytterligare märketyper hör inte till kardinalsystemet men förväxlas "
            "ibland med det. Punktmärket (märke för en isolerad, mindre fara) står "
            "direkt på själva faran, inte på någon sida av den, och kan därför passeras "
            "runt om med gott avstånd. Det är svart med ett eller flera röda bälten och "
            "har två svarta klot som toppmärke. Specialmärket är helt gult, med ett "
            "gult liggande kryss som topptecken, och markerar sådant som inte alls är "
            "en farled — militära övningsområden, kablar, mätinstrument eller "
            "badområden.",
        ),
    ],
    "top-buoy-fyrar": [
        (
            "p",
            "Ögat behöver 15–20 minuter för att återfå mörkerseendet efter att ha "
            "utsatts för starkt ljus — en enda tänd kabinlampa kan alltså slå ut synen "
            "för resten av en nattlig vakt. Röd belysning, eller mycket svag vit, "
            "påverkar mörkerseendet minst och är därför standard för sjökorts- och "
            "kompassbelysning ombord. Måste ett bländande ljus ändå tändas hjälper det "
            "att blunda med ena ögat — det slutna ögat behåller då sin mörkeranpassning "
            "medan det andra tillfälligt bländas. Att titta ut genom en öppningsbar "
            "ruta eller taklucka i stället för genom glas är också bättre: reflektioner "
            "och smuts på en glasruta stjäl kontrast just när den behövs som mest.",
        ),
        (
            "p",
            "Många farledsfyrar är sektorfyrar: ljuset delas upp i färgade sektorer, "
            "normalt med samma logik som sidomärkena — rött åt babordssidan och grönt "
            "åt styrbordssidan om en vit, säker mittsektor, sett från sjön mot fyren. "
            "Så länge du ser den vita sektorn är du i farledens säkra vatten. Hamnar du "
            "i rött sken på väg mot fyren har du drivit åt babordssidan och girar "
            "styrbord för att komma tillbaka; hamnar du i grönt gäller det omvända. På "
            "väg FRÅN en sektorfyr är logiken spegelvänd, eftersom du nu ser sektorerna "
            "från andra hållet — kommer du in i grön sektor girar du då styrbord, inte "
            "babord, för att hitta tillbaka till den vita.",
        ),
        (
            "p",
            "Fyrars ljuskaraktär beskrivs med en handfull förkortningar som tillsammans "
            "täcker det mesta man möter i sjökort. Fl (flash, blixt) är en kort blixt, "
            "högst en sekund, med betydligt mer mörker än ljus i varje period. LFl "
            "(long flash) är samma idé men med en blixt på minst två sekunder. Iso "
            "(isophase) har exakt lika lång ljus- som mörkertid — en period på 4 "
            "sekunder blir 2 sekunder ljus och 2 sekunder mörker. Oc (occulting) är "
            "motsatsen till en blixtfyr: mestadels ljus, avbrutet av korta, "
            "regelbundna förmörkelser. Q (quick, snabblixt) blinkar oavbrutet med "
            "ungefär 60 blixtar per minut, och VQ (very quick) ännu snabbare, omkring "
            "120 blixtar per minut. En siffra inom parentes, som i Fl(3), anger antalet "
            "blixtar i varje grupp innan den längre mörkerperioden; talet efter anger "
            "hela periodens längd i sekunder.",
        ),
        (
            "p",
            "Hur långt bort en fyr syns beror på två saker tillsammans: fyrens egen "
            "lysvidd (ljusstyrkan, given i sjökortet) och betraktarens ögonhöjd — ju "
            "högre upp man står, desto längre bort ligger den egna horisonten. De två "
            "avstånden läggs samman: fyrens angivna horisontavstånd plus observatörens "
            "eget horisontavstånd (utläst ur en tabell eller nomogram för given "
            "ögonhöjd) ger avståndet på vilket fyren först dyker upp över horisonten en "
            "klar natt. Det är också metoden bakom att rita ortlinjer i sjökortet som "
            "cirkelbågar med det avståndet som radie: så fort fyren siktas vet man att "
            "man befinner sig någonstans på den cirkeln.",
        ),
        (
            "p",
            "Ensfyrar används där en exakt inseglingslinje behöver visas snarare än en "
            "bred säker sektor: två fasta ljus, ofta röda, placerade så att de står "
            "rakt i linje (i ens) med varandra bara när man befinner sig mitt i den "
            "säkra inseglingslinjen. Så fort de två ljusen glider isär har man kommit "
            "ur linjen och behöver korrigera kursen. Notera också beteckningen "
            "\"(occas)\" i vissa fyrbeskrivningar — occasional, en fyr som bara är tänd "
            "vid behov och alltså inte går att räkna med. Den ska inte förväxlas med "
            "Oc (occulting), som är en fast ljuskaraktär.",
        ),
        (
            "p",
            "Sjömärken och ljuskaraktärer övas bäst genom att se många exempel i "
            "praktiken — appens drillläge innehåller ett stort antal ytterligare "
            "bilder för identifieringsövning utöver de som visas i det här kapitlet.",
        ),
    ],
}
