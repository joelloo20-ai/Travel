# External data attribution

## Singapore HDB 3D city model

Singapore's interactive city proof of concept includes the `hdb.obj` dataset
from the NUS Urban Analytics Lab's `hdb3d-data` project.

Sources: NUS Urban Analytics Lab, HDB Singapore, OpenStreetMap contributors,
and OneMap. Dataset source: https://github.com/ualsg/hdb3d-data

The source project requests citation of: Biljecki F (2020), *Exploration of
open data in Southeast Asia to generate 3D building models*, ISPRS Annals of
Photogrammetry, Remote Sensing and Spatial Information Sciences, VI-4/W1-2020,
37-44. https://doi.org/10.5194/isprs-annals-VI-4-W1-2020-37-2020

## Source evaluation

- Google Photorealistic 3D Tiles are the highest-fidelity option, but require a
  Google Maps Platform API key and billing account, and are streamed under
  Google's Map Tiles policies rather than shipped as a local asset.
- Cesium OSM Buildings provides global 3D Tiles with rich OpenStreetMap
  metadata and a free ion account. It is a strong country-wide streaming base,
  but is generally simpler than photogrammetry.
- Sketchfab's [Marina Bay Sands model](https://sketchfab.com/3d-models/marina-bay-sands-4a394733cd65462ea4d1a44196e12cb8)
  is CC Attribution but has 8.8M triangles; it should be heavily optimized
  before adding it to a production page. The [Helix Bridge model](https://sketchfab.com/3d-models/helix-bridge-1221edc4c2454b29b3b6adcd6fdefb0e)
  is also CC Attribution and is a lighter landmark candidate.
