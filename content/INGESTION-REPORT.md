# Innehållsinventering — full ingestion 2026-08-04

Alla 91 källfiler i questions/ är inlästa och konverterade. Totalt **850
frågor** i banken (upp från 83 före ingestionen), varav 811 från boken +
radar­guiden i denna kampanj. Varje konverterad fråga bär en sourceRef
(bokfråga + fotofil) för spårbarhet.

## Täckningstabell

| Källfiler | Innehåll | Status |
|---|---|---|
| radar basics / display mode / horizon antenna / navigation / target echoes (5 textfiler) | Radarguide Q1–39, färdigkonverterad JSON utan frågetext | ✔ Integrerade: 39 items, 5 nya radarämnen; frågetext rekonstruerad; 4 items mcq i st f chart_question (bild saknades) |
| photo_86–63 | Frågekapitel 1–9 (sjökort, naturlig navigation, instrument, kompass/fart/distans/bäringar, deviation, fyrar, dimma, väjningsregler, väder) | ✔ Konverterade (batch 1–6, 8): 288 items |
| photo_66, 65 | 8:11 väjningspaneler (32 paneler) | ✔ Konverterade (batch 7): 32 scenario-items |
| photo_62, 61 | Kapitel 10 lanternor 10:1–10:16 | ✔ Konverterade (batch 9): 34 items |
| photo_60, 57, 58, 59 | 10:17 ljusbildspaneler (36 paneler) | ✔ Konverterade (batch 10): 36 native lantern-scener |
| photo_56–51 | Kapitel 11–16 (säkerhet, första hjälpen, miljö, förtöjning, utomlands, passagerare) | ✔ Konverterade (batch 11–12): 107 items |
| photo_49–46 | Kapitel 17: Förarintygsprov 17:1–17:65 | ✔ Konverterade (batch 13): 75 items, fördelade per ämne |
| photo_46–42 | Kapitel 18: Kustskepparprov 18:1–18:84 | ✔ Konverterade (batch 14): 103 items, fördelade per ämne |
| photo_41–23, 22–2 | Facit (svarsnyckel) till samtliga kapitel | ✔ Använda som svarskälla vid konverteringen (konverteras inte separat — samma frågor) |
| photo_15–18 | Lanternfacitplanscher | ✔ Använda som svarskälla för 10:17-panelerna |
| photo_1 | Deviationstabell (referenssida) | ✔ Ingen fråga; referens för kap 5-items — kandidat som bildasset |
| photo_50 | Riktlinjer för prov (antal, tider, gränser, ämnesvikter) | ✔ Ingen fråga; verifierade content/exams.json |

## Antal per modul

| Modul | Frågor |
|---|---|
| Navigationsberäkningar | 268 |
| Lanternor | 108 |
| Sjövägsregler (COLREG) | 102 |
| Utmärkning & bojar | 98 |
| Säkerhet | 95 |
| Radar | 50 |
| Sjömanskap *(ny modul)* | 39 |
| Väder | 39 |
| Regler & miljö *(ny modul)* | 37 |
| Stabilitet & balans | 8 |
| VHF / SRC | 6 |

Per spår: klass8 849 · kustskeppare 793 · förarintyg 582 · vhf 22.

## Nya moduler och ämnen (bekräftade av användaren 2026-08-03)

Moduler: **Sjömanskap** (förtöjning/ankring, tågvirke/knopar) och
**Regler & miljö** (miljö/allemansrätt, utomlands/passagerare, sjölag/bemanning).
Nya ämnen i befintliga moduler: första hjälpen (Säkerhet), fyrar och
ljuskaraktärer (Utmärkning), instrument/deviation + bäringar/position
(Navigation), ljusbildsövningar (Lanternor), fem radarguideämnen (Radar).

## Kända kvalitetsanmärkningar

- Radarguidens 39 items har systematiskt längst-rätt-svar (26 lintvarningar) —
  behålls som källtrogen text, jämna ut vid granskning.
- Lintvarningar totalt: ~314 (längdavvikare + nära-dubbletter), summerade i
  `npm run check:content` (kör med --verbose för detaljer).
- Samtliga 850 items har authorReviewed: false tills du granskat dem.

## Items flaggade needsReview (104 st)

Kör `npm run check:content -- --needs-review` för samma lista i terminalen.

| Item | Anteckning |
|---|---|
| buoy-fyr-005 | Kräver övningssjökort 616 för full uppgift; frågan är förenklad till fyra av fyrarna ur facit. |
| buoy-fyr-014 | Kräver övningssjökort/kort 6163; facits fullständiga plan är förkortad till ett svarsalternativ. |
| buoy-fyr-048 | Karaktärsbeteckningen Oc(2) 20s är härledd ur facits beskrivning – kontrollera mot övningssjökortet. |
| buoy-lat-012 | Symbolens exakta utseende bör verifieras mot beskuren figur från photo_85 (fråga 1:18, övre raden). |
| buoy-lat-013 | Symbolens exakta utseende bör verifieras mot beskuren figur från photo_85 (fråga 1:18, övre raden). |
| buoy-lat-014 | Symbolens exakta utseende bör verifieras mot beskuren figur från photo_85 (fråga 1:18, mittensymbolen). |
| buoy-lat-019 | Facit är en figur (photo_40). Figuren med märkena behöver beskäras från photo_84 och girriktningen verifieras mot facitbilden. |
| buoy-lat-020 | Facit är en figur (photo_40). Figuren med märkena (romb-topptecken) behöver beskäras från photo_84 och girriktningen verifieras mot facitbilden. |
| col-ljud-013 | Verifiera mot boken (photo_25) att sista raden i signalsammanställningen 'Uppmärksamhet' avser en lång signal. |
| col-vaj-050 | panelfigur — verifiera scenariobeskrivningen mot photo_66/65 (egen båts halsar i sittbrunnsvyn, rad 4 kolumn 1 på sid 27) |
| col-vaj-053 | panelfigur — verifiera scenariobeskrivningen mot photo_66/65 (egen båts halsar i sittbrunnsvyn, rad 4 kolumn 4 på sid 27) |
| col-vaj-054 | Väjningspanel – kontrollera scenariot i panel 1 mot figuren i photo_48/photo_7. |
| col-vaj-055 | Väjningspanel – kontrollera scenariot i panel 2 mot figuren i photo_48/photo_7. |
| col-vaj-056 | Väjningspanel – kontrollera scenariot i panel 3 mot figuren i photo_48/photo_7. |
| col-vaj-057 | Segelpanel – kontrollera halsar/segelställning i panel 1 mot figuren i photo_48/photo_7. |
| col-vaj-058 | Segelpanel – kontrollera scenariot i panel 2 (Långsam motorbåt) mot figuren i photo_48/photo_7. |
| col-vaj-059 | Segelpanel – kontrollera halsar i panel 3 mot figuren i photo_48/photo_7. |
| col-vaj-060 | Segelpanel – kontrollera halsar/scenario i panel 4 mot figuren i photo_48/photo_7. |
| col-vaj-064 | Figur behöver beskäras från photo_45; facit 18:22 visar svaret som figur (photo_4) – kontrollera att beskrivningen stämmer med bilden. |
| lan-bild-029 | verifiera ljusbilden mot photo_57 panel 2 – blått blixtljus; färgen "blue" ligger utanför standardpaletten (white/red/green/yellow) och blinkningen kan inte återges i scenen |
| lan-maskin-008 | Facit anger kort 'Minst 3 M' för alla tre lanternorna, men enligt sjövägsreglerna gäller 3 M för topplanternan och 2 M för sido- och akterlanterna på fartyg 12–20 m – kontrollera bokens text. |
| nav-bar-008 | Kräver övningssjökort för den exakta positionen; frågan omformulerad till ortlinjens motriktning. Se facitfigur i photo_33. |
| nav-bar-009 | Kräver övningssjökort för den exakta positionen; frågan omformulerad till ortlinjens motriktning. Se facitfigur i photo_33. |
| nav-bar-010 | Kräver övningssjökort för den exakta positionen; frågan omformulerad till ortlinjens motriktning. Se facitfigur i photo_33. |
| nav-bar-011 | Kräver övningssjökort för den exakta positionen; frågan omformulerad till ortlinjens motriktning. Se facitfigur i photo_33. |
| nav-bar-013 | Kräver övningssjökort 616 för den exakta positionen; se facitfigur 4:49a i photo_32. |
| nav-bar-014 | Kräver övningssjökort 616 för den exakta positionen; se facitfigur 4:49b i photo_32. |
| nav-bar-015 | Kräver övningssjökort 616 för den exakta positionen; se facitfigur 4:49c i photo_32. |
| nav-bar-016 | Kräver övningssjökort 616 för den exakta positionen; se facitfigur 4:49d i photo_32. |
| nav-bar-018 | Kräver övningssjökort 61 för den exakta positionen; se facitfigur 4:51 i photo_32. |
| nav-bar-019 | Kräver övningssjökort 61 för den exakta positionen; se facitfigur 4:51 i photo_32. |
| nav-bar-020 | Kräver övningssjökort 61 för den exakta positionen; se facitfigur 4:51 i photo_32. |
| nav-bar-023 | Kräver övningssjökort 616 för den exakta positionen (facit: cirka 2,5 M öster om kurslinjen). |
| nav-bar-024 | Kräver övningssjökort 616 för krysspejlingen – facits position använd. |
| nav-bar-025 | Kräver övningssjökort för konstruktionen; distraktorerna är konstruerade. Kontrollera positionen mot sjökort 616. |
| nav-fart-006 | Kräver övningssjökort 616 för att stega distansen. |
| nav-fart-007 | Kräver övningssjökort 616 för att stega distansen. |
| nav-fart-008 | Kräver övningssjökort 616 för att stega distansen. |
| nav-fart-059 | Distansen 35,7 M kommer från mätning i övningssjökortet; värdet är inlagt i frågan från facit. |
| nav-fart-060 | Distansen 63,3 M kommer från mätning i övningssjökortet; värdet är inlagt i frågan från facit. |
| nav-kurs-005 | Kräver övningssjökort (616 resp. båtsportkort blad 21) för att se kursens riktning i förhållande till vinden. Facit: a styrbord, b babord, c styrbord. |
| nav-kurs-006 | Kräver övningssjökort (616 resp. båtsportkort blad 21) för att se kursens riktning i förhållande till vinden. Facit: a styrbord, b babord, c styrbord. |
| nav-kurs-007 | Kräver övningssjökort (616 resp. båtsportkort blad 21) för att se kursens riktning i förhållande till vinden. Facit: a styrbord, b babord, c styrbord. |
| nav-kurs-034 | Kräver övningssjökort — den rättvisande kursen 097° är uttagen ur kortet och inlagd i frågan från facit. |
| nav-kurs-035 | Kräver övningssjökort — den rättvisande kursen 226° är uttagen ur kortet och inlagd i frågan från facit. |
| nav-kurs-036 | Kräver övningssjökort — den rättvisande kursen 322° är uttagen ur kortet och inlagd i frågan från facit. |
| nav-kurs-037 | Kräver övningssjökort — den rättvisande kursen 352° är uttagen ur kortet och inlagd i frågan från facit. |
| nav-kurs-045 | Kräver övningssjökort 616 för grundkursen 243° – facits beräkning 243° + 5° = 248° använd. |
| nav-sjo-002 | Figurberoende fråga – kartskissen behöver beskäras från photo_83. |
| nav-sjo-003 | Figurberoende fråga – kartskiss och silhuettbilder behöver beskäras från photo_83. |
| nav-sjo-005 | Figurberoende fråga – bilden med fyrarnas inbördes läge behöver beskäras från photo_83 för att girriktningen ska kunna motiveras. |
| nav-sjo-006 | Figurberoende fråga – kartskissen med Långskärgården behöver beskäras från photo_83. |
| nav-sjo-007 | Figurberoende fråga – skissen över Hamnsundet behöver beskäras från photo_83. |
| nav-sjo-008 | Bygger på kartskiss (retuscherat kort 616) – figuren behöver beskäras från photo_82. |
| nav-sjo-009 | Bygger på kartskiss (retuscherat kort 616) – figuren behöver beskäras från photo_82. |
| nav-sjo-010 | Bygger på kartskiss (retuscherat kort 616) – figuren behöver beskäras från photo_82. |
| nav-sjo-011 | Bygger på kartskiss (retuscherat kort 616) – figuren behöver beskäras från photo_82. Ursprungsfrågan är öppen (beskriv navigeringen för båda vägarna). |
| nav-sjo-012 | Originaluppgiften avser en figur med många pilar (kurser 090°, 135°, 045°, 100°, 350°, 180°, 190°, 010°, 315°, 225°, 020°, 000°/360°, 270°, 135°); omgjord till en representativ pil. Figur behöver beskäras från photo_81. |
| nav-sjo-013 | Kräver övningssjökort 6163 och figuren i photo_81; bokens facit är uppmätta kurser (275°, 237°, 029°, 025°, 085°, 282°, 120°, 202°, 052°). Omgjord till metodfråga. |
| nav-sjo-014 | Kräver övningssjökort 616 för att mäta kursen. |
| nav-sjo-015 | Kräver övningssjökort 616 för att mäta kursen. |
| nav-sjo-016 | Kräver övningssjökort 616 för att mäta kursen. |
| nav-sjo-017 | Kräver övningssjökort 616 för att mäta kursen. |
| nav-sjo-026 | Kräver övningssjökort 616 för att följa kurslinjen. |
| nav-sjo-027 | Kräver övningssjökort 616 för att följa kurslinjen. |
| nav-sjo-028 | Kräver övningssjökort 616 för att följa kurslinjen. |
| nav-sjo-029 | Kräver övningssjökort 616 för att följa kurslinjen. |
| nav-sjo-030 | Kräver övningssjökort 616 för att följa kurslinjen. |
| nav-sjo-031 | Kräver övningssjökort 616 för att följa kurslinjen. |
| nav-sjo-032 | Rituppgift; bokens facit är en figur med den inritade färden (photo_36). Kräver övningssjökort 6163. |
| nav-sjo-033 | Kräver övningssjökort 616 för att mäta distansen. |
| nav-sjo-034 | Kräver övningssjökort 616 för att mäta distansen. |
| nav-sjo-035 | Kräver övningssjökort 616 för att mäta distansen. |
| nav-sjo-036 | Kräver övningssjökort 6163 för att mäta distansen. |
| nav-sjo-037 | Kräver övningssjökort 6163 för att mäta distansen. |
| nav-sjo-038 | Kräver övningssjökort 6163 för att mäta distansen. |
| nav-sjo-039 | Kräver övningssjökort 616 (specialen i NV-delen) för att mäta avståndet. |
| nav-sjo-040 | Kräver övningssjökort 616 för att mäta avståndet. |
| nav-sjo-057 | Kräver övningssjökort 616 – svaret bygger på avläsning i kortet; facitvärdet använt som rätt alternativ. |
| nav-sjo-058 | Kräver övningssjökort 616 – svaret bygger på avläsning i kortet; facitvärdet använt som rätt alternativ. |
| nav-sjo-059 | Kräver övningssjökort 616 – svaret bygger på avläsning i kortet; facitvärdet använt som rätt alternativ. |
| nav-sjo-060 | Kräver övningssjökort 616 – svaret bygger på avläsning i kortet; facitvärdet använt som rätt alternativ. |
| nav-sjo-061 | Kräver övningssjökort 616 – svaret bygger på avläsning i kortet; facitvärdet använt som rätt alternativ. |
| nav-sjo-062 | Kräver övningssjökort 6163/616 – svaret bygger på uttag av position i kortet; facit använt som rätt alternativ. |
| nav-sjo-063 | Kräver övningssjökort 6163/616 – svaret bygger på uttag av position i kortet; facit använt som rätt alternativ. |
| nav-sjo-064 | Kräver övningssjökort 6163/616 – svaret bygger på uttag av position i kortet; facit använt som rätt alternativ. |
| nav-sjo-065 | Kräver övningssjökort 616 – svaret bygger på uttag av position i kortet; facit använt som rätt alternativ. |
| nav-sjo-066 | Kräver övningssjökort 616 – svaret bygger på uttag av position i kortet; facit använt som rätt alternativ. |
| nav-sjo-068 | Kräver övningssjökort — det numeriska svaret bygger på mätning i kortet. |
| nav-sjo-069 | Kräver övningssjökort — det numeriska svaret bygger på mätning i kortet. |
| nav-sjo-084 | Kräver övningssjökort 616 – facits position använd som facit, distraktorer konstruerade. |
| nav-sjo-085 | Kräver övningssjökort 616 för att slå upp djupet – facits svar 2,8 m använt. |
| nav-sjo-086 | Figurberoende – kontrollera tavlornas inbördes läge mot figuren i photo_49 (facit: styrbord). |
| nav-sjo-087 | Kräver övningssjökort 616 för mätningen – facits svar 6,05 M använt. |
| radar-display-002 | Var chart_question med platshållarbild som saknas — konverterad till mcq; lägg till riktig radar-/sjökortsbild och byt tillbaka typen. |
| radar-display-003 | Var chart_question med platshållarbild som saknas — konverterad till mcq; lägg till riktig radar-/sjökortsbild och byt tillbaka typen. |
| radar-targets-003 | Var chart_question med platshållarbild som saknas — konverterad till mcq; lägg till riktig radar-/sjökortsbild och byt tillbaka typen. |
| radar-targets-006 | Var chart_question med platshållarbild som saknas — konverterad till mcq; lägg till riktig radar-/sjökortsbild och byt tillbaka typen. |
| reg-miljo-010 | Bokens facit (4 månaders karantän) är föråldrat – numera gäller EU:s sällskapsdjurspass. Kontrollera hur frågan ska hanteras. |
| saf-omb-026 | Kartfigur behöver beskäras från photo_54 – frågan bygger på kartskissen med fjärdarna och vindpilarna. |
| sjo-fort-003 | Facit är endast en bild (photo_10) – verifiera att tolkningen av förtöjningsarrangemanget stämmer med bokens figur. |
| sjo-fort-006 | Facit är endast en bild (photo_9) – verifiera linornas dragning mot bokens figur. |
| wx-sys-009 | Facit visar endast vindpilar i figurer – vindriktningarna är härledda ur pilarna och lågtryckscirkulationen; verifiera mot photo_22/21. Figur kan ev. beskäras från photo_64. |
| wx-sys-010 | Facit visar endast vindpilar i figurer – vindriktningarna är härledda ur pilarna och lågtryckscirkulationen; verifiera mot photo_22/21. Figur kan ev. beskäras från photo_64. |
