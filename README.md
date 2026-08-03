# Plugga Sjöexamen

Native study app (React Native + Expo) for Swedish maritime certification exams.
Primary track: **Fartygsbefäl klass 8**; also Förarintyg, Kustskepparintyg and
VHF/SRC via track filtering.

> Fristående studiehjälpmedel som hjälper dig att förbereda dig inför prov.
> Inte anslutet till eller godkänt av Transportstyrelsen, NFB eller något annat
> certifierande organ.

## Stack

- Expo (managed) + React Native + TypeScript, Expo Router
- NativeWind (Tailwind) on a strict design-token system — see [DESIGN.md](DESIGN.md)
- expo-sqlite for all local state; the app is fully offline
- Content bundled as JSON under `content/`, native SVG diagrams via react-native-svg

## Develop

```sh
npm install
npm start             # Expo dev server
npm run typecheck     # tsc --noEmit
npm run check:tokens  # design-token drift guard
```

## Structure

```
src/app/        Expo Router screens
src/components/
src/theme/      design tokens (colors.js is the single source of truth)
src/db/         SQLite data-access layer (the only module that touches the DB)
content/        bundled study content (JSON, one file per topic)
scripts/        dev/validation scripts
```
