# Shared-density cloud candidate D-075

Project procedural contribution CC0-1.0. Synthetic scene, not measured weather.
prepare-cloud-sculpt.py defines density; Blender/Cycles reads the same R8 via packed atlas.
render-cloud-sculpt.py rebuilds the editable bound/atlas node scene. The cube is a volume bound, not a cloud surface mesh; no VDB/mesh-to-volume export is claimed.
Browser uses raw density, fixed-sun optical depth and projected ground-depth cache. Local sun is matched to the locked orbit sun; changed sun direction requires rebake.
Blender Principled Volume/AgX and realtime approximate scattering/ACES have different transport and tone mapping.
Metadata/source/asset hashes in manifest and registry. Existing NASA/REMA/atmosphere notices remain applicable.
