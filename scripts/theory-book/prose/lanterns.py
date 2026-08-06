"""
Hand-synthesized prose for the Lanterns chapter — one of the two flagship
chapters (see README.md) written as genuine textbook prose rather than
the mechanical paragraph-grouping the other modules currently get.

Each topic maps to a list of blocks:
  ('p', text)                        — a prose paragraph
  ('figure', item_id, caption_or_None) — an embedded diagram; caption
                                          defaults to the item's own
                                          payload.scene.captionSv if None

Synthesized from this app's own explanationSv content (see
content/vhf/… and content/lanterns/…), not copied from any course book —
paraphrased into fresh sentences and reorganized by concept rather than
by individual question, matching content/AUTHORING.md's existing
copyright discipline for this project.
"""

CHAPTER_INTRO = (
    "Lanternor är sjöfartens sätt att tala om i mörkret. Ur en enda ljusbild — vilka "
    "färger som syns och i vilken inbördes ordning — går det att läsa ut vilken typ av "
    "fartyg det är, vilken sida av det som är vänd mot dig och därmed vilken väjningsregel "
    "som gäller. Hela systemet bygger på att varje lanterna bara lyser inom en bestämd båge "
    "av horisonten. Det är den enda logiken att hålla reda på — resten följer av den."
)

TOPICS = {
    "top-lan-grund": [
        (
            "p",
            "Ett fartygs lanternor är inte slumpmässigt placerade — var och en lyser "
            "bara inom en exakt definierad sektor av horisonten, och sektorerna är "
            "konstruerade för att tillsammans täcka precis 360°, ett helt varv. "
            "Topplanternan är vit och lyser föröver, över en båge på 225°: rätt förut "
            "och 22,5° akter om tvärs på vardera sidan. De två sidoljusen — grönt om "
            "styrbord, rött om babord — lyser vardera 112,5°, också från rätt förut och "
            "bakåt till 22,5° akter om tvärs. Tillsammans täcker sidoljusen exakt samma "
            "båge som topplanternan, 225°. Det som återstår, 135° rakt akterut, täcks av "
            "den vita akterlanternan. 225 + 135 blir 360 — hela horisonten, utan luckor "
            "och utan överlapp mellan färgerna.",
        ),
        (
            "p",
            "Den här sektorindelningen är själva anledningen till att lanternor går att "
            "läsa av. Möter du ett fartyg rakt förifrån ser du både topplanternan och "
            "båda sidoljusen — grönt och rött sida vid sida är den klassiska bilden av "
            "en mötande situation. Ser du bara en grön sidolanterna, utan vitt ljus "
            "ovanför, kommer fartyget mot dig från en vinkel där du befinner dig inom "
            "dess styrbordssektor men utanför topplanternans båge — vilket bara är "
            "möjligt om fartyget saknar topplanterna helt, det vill säga är ett "
            "segelfartyg. Ser du i stället en ensam akterlanterna är fartyget på väg "
            "ifrån dig. Det är samma fyra sektorer, om och om igen, som avgör vilken "
            "bild du ser.",
        ),
        ("figure", "lan-maskin-001", "Maskindrivet fartyg sett rätt förifrån — toppljus och båda sidoljusen syns samtidigt."),
        (
            "p",
            "Lanternor ska föras från solnedgång till soluppgång, och dessutom under "
            "hela den tid sikten är nedsatt — i dimma eller kraftigt regn, även mitt på "
            "dagen. Internationellt gäller det utan undantag. I svenskt inre vatten "
            "medger Sjötrafikkungörelsen en lättnad i skymning och gryning: lanternor "
            "behöver inte vara tända om fartyget ändå syns på betryggande avstånd. "
            "Lättnaden gäller bara skymning och gryning på inre vatten — så fort sikten "
            "av andra skäl är nedsatt, eller fartyget befinner sig på internationellt "
            "vatten, gäller huvudregeln fullt ut.",
        ),
        (
            "p",
            "De minsta farkosterna har egna, enklare krav. En roddbåt behöver bara ha "
            "en lampa eller lanterna med vitt sken redo att visas i god tid när ett "
            "annat fartyg närmar sig — den behöver inte vara ständigt tänd. En "
            "maskindriven båt under 7 meter som inte går fortare än 7 knop får som "
            "minimum nöja sig med ett vitt runtomlysande ljus, tänt hela tiden, och bör "
            "om möjligt komplettera med sidoljus. Går båten fortare än 7 knop gäller "
            "inte längre undantaget — då krävs fullständiga lanternor: topp-, sido- och "
            "akterlanterna, precis som för alla andra maskindrivna fartyg.",
        ),
    ],
    "top-lan-maskin": [
        (
            "p",
            "För maskindrivna fartyg avgör längden hur många toppljus som krävs. Under "
            "50 meter räcker ett enda toppljus. Från och med 50 meter tillkommer ett "
            "andra toppljus, placerat akter om och högre än det första — de två "
            "lanternorna i lodrät linje, med den aktra högst, är själva "
            "igenkänningstecknet för ett stort fartyg sett på håll. Samma "
            "grundprincip — extra toppljus i lodrät linje — återkommer för bogserande "
            "fartyg, men då handlar det om att markera bogsering snarare än storlek "
            "(se avsnittet om särskilda fartyg).",
        ),
        ("figure", "lan-maskin-002", "Stort maskindrivet fartyg (50 m eller mer) sett från styrbordssidan — två toppljus, det aktra högre."),
        (
            "p",
            "Lysvidden — hur långt bort lanternan ska synas — skalar med fartygets "
            "storlek. Ett maskindrivet fartyg under 12 meter behöver topp- och "
            "akterlanterna synliga på minst 2 nautiska mil och sidoljusen på minst 1 "
            "nautisk mil. Mellan 12 och 20 meter höjs kravet till 3 nautiska mil för "
            "samtliga tre. Placeringen är lika noga reglerad som lysvidden: på fartyg "
            "under 12 meter ska topplanternan sitta minst 1 meter över sidoljusen (i "
            "svenskt inre vatten räcker 0,5 meter för en mastlös båt), och på fartyg "
            "mellan 12 och 20 meter gäller minst 2,5 meter över relingen och minst 1 "
            "meter över en sammansatt sidolanterna.",
        ),
        (
            "p",
            "Två förenklingar finns för mindre fartyg. Under 20 meter får de röda och "
            "gröna sidoljusen kombineras till en enda sammansatt lanterna, monterad i "
            "fartygets mittlinje — men topplanternan ska ändå sitta minst 1 meter över "
            "den. Under 12 meter går det ett steg längre: topp- och akterlanternan kan "
            "ersättas helt av en enda vit runtlysande lanterna, som då täcker både "
            "topplanternans 225° och akterlanternans 135° i ett enda ljus. Sidoljusen "
            "måste dock alltid föras separat — det finns ingen genväg runt dem. "
            "Akterlanternan i sig, oavsett fartygsstorlek, ska sitta så nära aktern som "
            "möjligt, så att dess 135°-sektor ger en korrekt bild för fartyg som hinner "
            "upp bakifrån.",
        ),
        ("figure", "lan-maskin-014", "Maskindrivet fartyg under 50 meter, i gång — fullständig lanternuppsättning: toppljus, båda sidoljusen, akterljus."),
    ],
    "top-lan-segel": [
        (
            "p",
            "Ett segelfartyg som går enbart för segel för aldrig vit topplanterna — det "
            "är den enskilt viktigaste regeln i det här avsnittet, och den som gör att "
            "en ensam grön eller röd sidolanterna, utan vitt ljus ovanför, alltid pekar "
            "ut ett segelfartyg. Sido- och akterljus krävs på samma sätt som för "
            "maskindrivna fartyg, och kan på ett segelfartyg dessutom kombineras till "
            "en trefärgad lanterna i masttoppen — rött, grönt och vitt i en enda "
            "armatur. Den trefärgade lanternan får bara användas när fartyget faktiskt "
            "går för segel.",
        ),
        ("figure", "lan-segel-009", "Segelfartyg som går för segel — sido- och akterljus, inget toppljus."),
        (
            "p",
            "Så fort motorn startas, oavsett om seglen fortfarande är hissade, räknas "
            "fartyget som maskindrivet och ska föra topplanterna precis som vilket "
            "motorfartyg som helst — dagtid visas i stället en svart kon med spetsen "
            "nedåt, hissad väl synlig. Det är själva navigationsstatusen, inte om seglen "
            "är uppe, som avgör vilka lanternor som gäller. Ett vanligt misstag är att "
            "kombinera den trefärgade masttoppslanternan med ett separat, lägre sittande "
            "toppljus när motorn startas: då hamnar sidoljusen (som sitter i "
            "masttoppen) ovanför topplanternan i stället för under den, vilket ger en "
            "felaktig och förbjuden ljusbild. Rätt tillvägagångssätt är att släcka den "
            "trefärgade lanternan helt och tända den fullständiga uppsättningen "
            "sido-/akter-/topplanterna som gäller för motorgång.",
        ),
        (
            "p",
            "De minsta segelfartygen har samma lättnad som de minsta motorbåtarna: "
            "under 7 meter räcker en lampa eller lanterna med vitt sken, redo att visas "
            "i tid för att undvika kollision — samma regel som för roddbåtar. Över 7 "
            "meter krävs full uppsättning sido- och akterlanterna.",
        ),
    ],
    "top-lan-sarskilda": [
        (
            "p",
            "Ett fartyg till ankars visar inga sido- eller akterljus alls — bara ett "
            "vitt runtlysande ankarljus, eftersom ett stillaliggande fartyg kan närmas "
            "från vilket håll som helst och behöver synas åt alla håll samtidigt. Under "
            "50 meter räcker ett enda ankarljus, placerat där det syns bäst. Från 50 "
            "meter krävs två: ett i fören, ett lägre i aktern. Ett undantag finns för "
            "den som ankrar långt inne i en skyddad skärgårdsvik, utanför farleder och "
            "stråk där andra fartyg normalt inte rör sig — där gäller ingen skyldighet "
            "att tända ankarljus, eftersom hela poängen med ljuset (att varna trafik "
            "som faktiskt kan komma förbi) inte är relevant.",
        ),
        ("figure", "lan-sar-027", "Fartyg till ankars, under 50 meter — enda lanternan är det vita runtlysande ankarljuset."),
        (
            "p",
            "Bogsering markeras med extra ljus som läggs till den vanliga "
            "uppsättningen. Vid en planerad bogsering visas en extra topplanterna "
            "lodrätt över den ordinarie (två stycken om släpet är längre än 200 meter) "
            "samt en gul akterlanterna monterad ovanför den vita — den gula lanternan "
            "delar akterlanternans 135°-sektor men skiljer sig i färg för att göra "
            "bogseringen synlig. Saknas rätt bogserlanternor, till exempel vid en "
            "oplanerad nödbogsering av ett fartyg med motorhaveri, ska tillgängliga "
            "medel användas för att göra bogseringen synlig för omgivningen — "
            "strålkastarbelysning av bogsertrossen är ett vanligt exempel.",
        ),
        ("figure", "lan-sar-028", "Fartyg som bogserar (släp 200 m eller mindre) — det gula bogserljuset delar akterljusets sektor."),
        (
            "p",
            "Ett fiskefartyg som trålar visar två runtlysande ljus i lodrät linje, "
            "grönt över vitt, och lägger till sido- och akterljus så snart fartyget gör "
            "fart genom vattnet — utan den farten visas bara de två runtlysande "
            "ljusen. Ett ej manöverfärdigt fartyg — som på grund av till exempel "
            "maskin- eller roderhaveri inte kan manövrera enligt de vanliga reglerna — "
            "visar på samma sätt två runtlysande röda ljus, och lägger till sido- och "
            "akterljus om det ändå gör fart genom vattnet.",
        ),
        ("figure", "lan-sar-029", "Fiskefartyg som trålar, gör fart genom vattnet — grönt över vitt, plus sido- och akterljus."),
        ("figure", "lan-sar-030", "Fartyg ej under kommando, gör fart — två runtlysande röda ljus, plus sido- och akterljus."),
        (
            "p",
            "Dagtid ersätts ljusbilderna av svarta dagersignalfigurer, hissade väl "
            "synligt. Ett runt klot betyder ankarliggare, två klot i lodrät linje "
            "betyder ej manöverfärdigt fartyg, och tre klot i lodrät linje betyder "
            "fartyg på grund — samma svarta klot, bara i olika antal. Klot–romb–klot i "
            "lodrät linje betyder begränsad manöverförmåga, till exempel vid "
            "muddrings-, kabel- eller dykeriarbete — förväxla inte det med de två "
            "klotens ej manöverfärdigt. En svart cylinder betyder fartyg hämmat av sitt "
            "djupgående, en svart romb visar att ett bogserat släp är längre än 200 "
            "meter, och två koner med spetsarna mot varandra i lodrät linje betyder "
            "fiskande fartyg. En svart kon med spetsen nedåt är samma signal som "
            "nämndes i föregående avsnitt: ett segelfartyg som samtidigt går för motor.",
        ),
        (
            "p",
            "En sista signal värd att känna igen är inte en dagersignal utan en flagga: "
            "en utspänd, tvåtungad flagga i vitt och blått är den internationella "
            "signalflaggan A och betyder att dykning pågår från fartyget. Andra "
            "fartyg ska hålla väl undan och passera med låg fart, eftersom det kan "
            "finnas dykare i vattnet nära båten.",
        ),
    ],
    "top-lan-bilder": [
        (
            "p",
            "De föregående avsnitten ger grundreglerna; det som avgör hur snabbt du "
            "faktiskt kan läsa av en ljusbild i mörker är övning. Nedan följer ett par "
            "exempel som binder ihop teorin med vad du faktiskt ser — appens "
            "drillläge innehåller ett stort antal ytterligare ljusbilder för fortsatt "
            "övning utöver de som visas här.",
        ),
        (
            "p",
            "Ett ensamt vitt ljus, utan några andra ljus synliga, är tvetydigt med "
            "avsikt — det kan vara en akterlanterna på ett fartyg som är på väg ifrån "
            "dig, en ankarliggare under 50 meter, eller en av de minsta farkosternas "
            "minimiutrustning (roddbåt, segelbåt under 7 meter, eller motorbåt under 7 "
            "meter med högst 7 knops fart). Utan fler ledtrådar går det inte att "
            "avgöra vilket — vilket är precis vad som gör det till ett bra exempel på "
            "att inte gissa längre än underlaget tillåter.",
        ),
        ("figure", "lan-maskin-003", "Ett ensamt vitt ljus — flera möjliga fartyg, inte tillräckligt för att avgöra vilket."),
        (
            "p",
            "En ensam röd lanterna, däremot, är entydig så fort man känner reglerna: "
            "utan vitt toppljus kan den bara vara ett segelfartygs babordssida. Att "
            "genast kunna utesluta \"maskindrivet fartyg\" så fort ett ensamt "
            "färgat ljus saknar vitt toppljus är precis den typen av snabb, säker "
            "slutledning som sektorreglerna är byggda för att ge.",
        ),
        ("figure", "lan-segel-002", "Ensam röd lanterna utan toppljus — babordssidan av ett segelfartyg."),
    ],
}
