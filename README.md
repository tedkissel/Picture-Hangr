# Wall Hangr

Wall Hangr is a local-first visual wall-layout tool for arranging picture frames and calculating every nail or screw from one common reference point. Measurements are stored as reduced rational numbers, so tape-measure fractions stay exact instead of drifting through rendered pixel coordinates.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`. Projects save automatically in the browser. Use the download and upload buttons in the header to back up or transfer a project as JSON.

## Verify

```bash
npm test
npm run build
```

The test suite covers measurement parsing and formatting, hanger coordinates, multiple hanger points, rotation, alternate origins, bounds, spacing, and all calculated nail positions in the bundled sample project.

## Install workflow

1. Define the wall and optional target layout in Settings.
2. Add reusable frame types, including their physical dimensions and hanger offsets.
3. Add and arrange frame instances in Design view.
4. Inspect the hardware behind each frame in Hangers view.
5. Open Install view for the common-origin coordinate table or the phone-friendly Next Nail walkthrough.
6. Choose Print / PDF for a clean installation sheet.
