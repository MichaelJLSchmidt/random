# About topography

The About page draws contour lines of Interlaken between Lake Thun and Lake
Brienz, with the Jungfrau region, in the background field (WebGL, from
`public/topo/elevation.png`), and falls back to a static SVG
(`public/topo/contours.svg`) for reduced motion and without WebGL.

The committed assets are built from **swissALTI3D** (Federal Office of
Topography swisstopo, open data). The page carries the attribution
"Contours derived from swissALTI3D – Source: Federal Office of Topography
swisstopo".

## Area

LV95 (EPSG:2056) box: E 2624000 to 2646000, N 1152000 to 1174000 (22 x 22 km,
484 tiles of 1 km). Lakes are drawn as flat shapes: Lake Thun at or below
558 m (west of E 2632600), Lake Brienz at or below 564.5 m (east of it).

## Rebuild (Node only, about one minute)

```sh
npm run topo
```

1. `fetch.mjs` lists the 2 m Cloud Optimized GeoTIFF of every tile from the
   STAC API (`data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo.swissalti3d`,
   most recent year per tile), reads only each file's internal 4 m overview
   with HTTP range requests (about 120 MB in all) and averages it into a
   512 x 512 grid: `scripts/topo/work/dem512.bin` (raw float32, row 0 = north;
   git-ignored).
2. `build.mjs --raw scripts/topo/work/dem512.bin` flattens the lakes, smooths
   the grid lightly, writes the elevation PNG, traces contours every 100 m
   (index every 500 m) with marching squares, simplifies them
   (Douglas-Peucker, 22 m), checks the SVG stays at or below 120 KB gzipped
   and writes `meta.json`.

Commit `public/topo/` only. Never commit raw tiles.

## Alternative: GDAL from full tiles

With GDAL 3.4+ and the 2 m tiles downloaded by hand (swisstopo's
swissALTI3D page, "Selection by rectangle" with the box above, Cloud
Optimized GeoTIFF, 2 m, LV95, "Export all links", then
`wget -i swissalti3d_links.csv -P scripts/topo/raw/`), `scripts/topo/build.sh`
runs `gdalbuildvrt`, `gdalwarp -tr 50 50 -r average`, a 512 x 512 warp,
`gdal_translate -of ENVI` and `gdal_contour -i 100`, then `build.mjs` with the
GDAL contours.

## Placeholder

`node scripts/topo/build.mjs --placeholder` writes noise-generated terrain,
marked `"placeholder": true` in `meta.json`, in the SVG and with a visible note
on the page. Use it only when the data cannot be fetched.

## Encoding

`elevation.png` (RGBA, row 0 = north): elevation in metres =
`min + (R * 256 + G) * step` with `min` and `step` (0.5 m) from `meta.json`;
B = 255 inside a lake.
