# Idélista — ej påbörjat

Backlog för premium-/visuella funktioner. Inget här är beslutat eller under
arbete — flytta upp en punkt först när den aktivt prioriteras.

## Visuellt lärande (från 2026-08-03)

1. **Animerade fyrkaraktärer och ljussignaler** — Fl(2) 10s, intermittent,
   isofas, Mo(A) m.fl. animerade i realtid; blinkrytmer för kardinal- och
   sidomärken nattetid. Bedömd som bäst värde-per-insats: Reanimated ovanpå
   befintliga SVG-diagram.
2. **Pseudo-3D-lanterntränare** — dra för att kretsa runt ett fartyg i mörker
   och se lanternorna tändas/släckas när man passerar sektorgränserna.
   Sektormatematik + befintlig SVG-nattvy; känns 3D utan 3D-kostnad.
3. **Minispel** — "Vem väjer?"-scenariorundor, ljusbildssprint på tid,
   bojsortering. Retentionslager när 1–2 finns.
4. **Riktiga 3D-modeller av fartyg** (react-three-fiber + expo-gl) — tekniskt
   möjligt; flaskhalsen är bra GLB-modeller (köpas/byggas). Dåliga modeller
   ser mindre premium ut än skarp 2D. Uppgradera lanterntränaren (punkt 2)
   när den bevisat konceptet.

## Interaktiva frågetyper (från 2026-08-04)

5. **VHF-anropsövning — bygg meddelandet själv.** I stället för flervalsfråga
   får eleven ett scenario ("Du är ombord på Maria, maskinhaveri på position
   X, Y — sänd rätt meddelande") och konstruerar anropet. Två möjliga
   nivåer:
   - *Ordna byggblock* (rekommenderad start): fraser dras i rätt ordning —
     Mayday ×3, fartygsnamn ×3, MMSI, position, nödens art, hjälpbehov,
     antal ombord. Ingen fritextbedömning behövs, och ordningen är exakt
     det som prövas.
   - *Fritext med checklista*: eleven skriver anropet och appen bockar av
     obligatoriska element med nyckelordsmatchning. Mer öppet men kräver
     tolerant matchning för att inte kännas orättvist.
   Kräver ny item-typ (t.ex. `radio_procedure`) och en egen drillvy. Passar
   även Pan-Pan, Sécurité, rutinanrop och MOB-larm — dvs. hela VHF-modulen,
   som i dag bara har 6 frågor.

## Att lägga till

- (fler idéer från användaren väntas — "there is more to come")
