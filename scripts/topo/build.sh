#!/usr/bin/env bash
# Real About topography from swissALTI3D 2 m tiles (see README.md).
# Input:  scripts/topo/raw/*.tif  (downloaded by hand, never committed)
# Output: public/topo/elevation.png, contours.svg, meta.json
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p work

BOX="2624000 1152000 2646000 1174000"   # xmin ymin xmax ymax, LV95 (EPSG:2056)

# 1. One virtual mosaic of all 2 m tiles.
gdalbuildvrt -overwrite work/tiles.vrt raw/*.tif

# 2. 50 m grid by averaging, clipped to the box (440 x 440).
gdalwarp -overwrite -t_srs EPSG:2056 -te $BOX -tr 50 50 -r average work/tiles.vrt work/dem50.tif

# 3. 512 x 512 grid for the shader texture, as raw little-endian float32.
gdalwarp -overwrite -te $BOX -ts 512 512 -r bilinear work/dem50.tif work/dem512.tif
gdal_translate -of ENVI -ot Float32 work/dem512.tif work/dem512.bin

# 4. Contours every 100 m from the 50 m grid (index contours every 500 m are styled by the build).
rm -f work/contours.geojson
gdal_contour -a elev -i 100 -f GeoJSON work/dem50.tif work/contours.geojson

# 5. PNG, simplified SVG (lakes as flat shapes) and meta.json.
node build.mjs --raw work/dem512.bin --contours work/contours.geojson
