# PlateNumberReader

PWA that reads a Philippine (LTO) plate number from a photo or manual entry, then shows the assigned renewal window, expiry, and calendar reminders. Built with Expo (React Native + web) so the same codebase can ship as a native iOS/Android app later.

## What it does

- Scans a plate with the camera (Tesseract.js OCR, works offline after first use) or accepts manual entry
- Computes the LTO renewal schedule from the plate digits:
  - last digit = renewal month (`1` = January … `9` = September, `0` = October)
  - second-to-last digit = renewal week (working days `1-7`, `8-14`, `15-21`, `22-end`)
  - renewal is allowed up to 60 days early
- Tracks last registration date and validity (1 year, or 5 years for brand-new vehicles registered from Feb 15, 2026; 3 years for older new registrations) to compute expiry
- Exports `.ics` calendar events for the early-renewal date and the renewal window
- Stores everything locally (AsyncStorage), with JSON backup/restore
- Installable PWA with offline app shell and icons

There is no public LTO lookup for plate-to-owner/registration data (LTMS is owner-login only), so all dates are computed from the plate schedule plus the last registration date you enter. Verify with [LTMS](https://portal.lto.gov.ph) or an LTO office.

## Quickstart

```bash
npm install
npm run assets:tesseract   # bundles OCR worker/core/eng data into public/tesseract (gitignored)
npm run web                # dev server
```

## Commands

```bash
npm test              # domain unit tests (plate parsing, schedule, validity)
npm run typecheck     # tsc --noEmit
npm run lint          # expo lint
npm run build:web     # OCR assets + expo export -p web + PWA HTML injection + service worker
npm run assets:icons  # regenerate PWA/native icons (requires ImageMagick)
```

## Deploy (Netlify)

The repo is Netlify-ready (`netlify.toml`): build command `npm run build:web`, publish directory `dist`, SPA redirect, no-cache for `sw.js`, immutable caching for OCR assets. HTTPS is required for camera access and service workers.

## Project layout

```
src/app/          expo-router screens (garage, add/scan, vehicle detail, settings)
src/domain/       plate parsing, renewal schedule, validity + tests
src/ocr/          Tesseract web engine, platform stub for native
src/storage/      AsyncStorage vehicle repository, import/export
src/calendar/     .ics generation
src/ui/           theme + shared components
public/           manifest, icons, generated tesseract assets
scripts/          icon generation, OCR asset bundling, service worker build
```

## Disclaimer

Not affiliated with the Land Transportation Office. Dates follow the published plate-based schedule and are for planning only.
