# Travel Command Centre

A private world atlas built around a real interactive 3D globe: **The Travel Quest**. Quiet-luxury, mission-control atlas aesthetic — deep blue-green night, warm ivory type, a photoreal WebGL Earth with clickable airport beacons for each destination.

Built with Vite, React, TypeScript, Three.js (`@react-three/fiber` + `@react-three/drei`), React Router, and Lucide icons.

## Run it

```bash
npm install
npm run dev       # dev server at http://localhost:5173
npm run build     # type-checks and builds to dist/
npm run preview   # serve the production build
npm run lint       # oxlint
```

## Structure

- `src/data/destinations.ts` — the destination list (coordinates, accent colors, copy) plus the lat/lng → 3D and longitude → rotation formulas that drive the globe.
- `src/components/Globe.tsx` — the WebGL scene: Earth mesh + atmosphere shells, Stars, lighting, per-city beacons with hover/active labels, OrbitControls.
- `src/components/StaticAtlas.tsx` — the non-WebGL fallback (reduced motion, narrow viewport, or WebGL failure/loading).
- `src/components/GlobeStage.tsx` — picks between the live globe and the static fallback.
- `src/pages/GlobeExplorer.tsx` — the `/` page: nav, instruction row, home-port callout, dated-journey pills, destination card, city chips.
- `src/pages/DestinationDetail.tsx` — optional `/destination/:key` cinematic detail route.
- `src/components/CountryIllustration.tsx` — data-driven, interactive SVG landmark scenes for every destination page.
- `scripts/add-country.mjs` — adds a destination with a working interactive illustration preset.

## Add a future country or city

Use the reusable generator from the `Travel` folder:

```bash
npm run add:country -- --key paris --country france --country-name France --name Paris --airport "Charles de Gaulle Airport" --code CDG --lat 49.0097 --lng 2.5479 --illustration metropolis
```

`--illustration` is optional and defaults to `metropolis`. A new city can use
that general skyline immediately; add a city-specific landmark profile in
`CountryIllustration.tsx` when you want a bespoke scene.

## Notes

- The Earth texture (`public/assets/earth-blue-marble.jpg`) is a 5400×2700 equirectangular blue-marble map — keep it at that path since it's referenced directly by URL.
- The globe only falls back when WebGL is unavailable or the visitor requests reduced motion. Destination pages use lightweight SVG illustrations with keyboard, tap, and pointer interaction, so they load quickly on every device.
