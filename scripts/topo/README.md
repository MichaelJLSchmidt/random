# About topography

The About page draws contour lines of the Lake Thun / Lake Brienz area in the
background field (WebGL, from `public/topo/elevation.png`) and falls back to a
static SVG (`public/topo/contours.svg`) for reduced motion and without WebGL.

**What is committed now is a placeholder**: terrain generated from noise by
`node scripts/topo/build.mjs --placeholder`. `public/topo/meta.json` says
`"placeholder": true`, the SVG carries a comment saying so, and the About page
shows a visible note until the real assets are built. Do not commit raw tiles
and do not use swisstopo's sample tiles.

## Area

LV95 (EPSG:2056) box: E 2624000 to 2646000, N 1152000 to 1174000 (22 x 22 km,
484 tiles of 1 km). Lakes are drawn as flat shapes: Lake Thun at or below
558 m (west of E 2632600), Lake Brienz at or below 564.5 m (east of it).

## Steps

1. Install GDAL 3.4 or newer (`brew install gdal`, `apt install gdal-bin`) and
   Node 22.
2. Download the tiles from swisstopo:
   - open <https://www.swisstopo.admin.ch/en/height-model-swissalti3d>
   - choose "Selection by rectangle" and enter E 2624000 / N 1152000 to
     E 2646000 / N 1174000
   - format **Cloud Optimized GeoTIFF**, resolution **2 m**, coordinate
     system **LV95 (EPSG:2056)**, current dataset
   - export the list of links ("Export all links") as a CSV file
3. Download every tile into `scripts/topo/raw/` (ignored by git, about 1 GB):

   ```sh
   mkdir -p scripts/topo/raw
   wget -i swissalti3d_links.csv -P scripts/topo/raw/
   ```

4. Build:

   ```sh
   scripts/topo/build.sh
   ```

   It runs `gdalbuildvrt`, `gdalwarp -tr 50 50 -r average` (50 m grid),
   `gdalwarp -ts 512 512` and `gdal_translate -of ENVI -ot Float32` (raw
   texture grid), `gdal_contour -i 100` (contours), then `build.mjs`, which
   writes the 512 x 512 elevation PNG, simplifies the contours
   (Douglas-Peucker, 22 m), styles every 500 m line as an index contour,
   adds the lakes and checks that the SVG stays at or below 120 KB gzipped.

5. Check `public/topo/meta.json` (`"placeholder": false`), open About, and
   commit `public/topo/` only. The attribution "Contours derived from
   swissALTI3D – Source: Federal Office of Topography swisstopo" is already
   on the page.

## Encoding

`elevation.png` (RGBA, row 0 = north): elevation in metres =
`min + (R * 256 + G) * step` with `min` and `step` (0.5 m) from `meta.json`;
B = 255 inside a lake.
