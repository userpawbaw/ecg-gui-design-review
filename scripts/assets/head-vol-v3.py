"""Mannequin head from A's own head (user 2026-10-04, option B "subtle planes"; the egg head felt alien).

A's head (with its eyeballs, so the sockets are full) is turned into a signed-distance volume on a 2 mm grid, then
  closing  (ball 4 mm)  seals the lid seams, nostrils and the lip slit; enclosed cavities (mouth, ear canals) are filled
  opening  (ball r_open) removes thin plates — the ears — while the skull, brow, nose, cheeks, jaw and chin stay
  blur     (sigma, stronger on the face front) rounds what is left into soft planes, like a shop mannequin
and the zero surface is rebuilt with marching cubes. The body keeps A's own mesh below the cut; the build unions the two
with its voxel remesh. Blender coordinates: front = −y, up = z, metres (1.8 m source body).
Used by build-figure-v3.py; scripts/assets/head-study-v3.py renders the variants."""
import numpy as np
from mathutils import Vector
from scipy import ndimage

BOX = (np.array([-.118, -.195, 1.47]), np.array([.118, .092, 1.825]))   # head + upper neck, source units
STEP = .002
CUT_Z = 1.535                                                            # body faces above this are replaced


def ball(r):
    g = np.mgrid[-r:r + 1, -r:r + 1, -r:r + 1]; return (g ** 2).sum(0) <= r * r + .5


def sdf_grid(bvhs):
    """Signed distance (− inside) to the union of the given BVH surfaces, by nearest point + face normal."""
    lo, hi = BOX; n = np.ceil((hi - lo) / STEP).astype(int) + 1
    xs, ys, zs = (lo[i] + np.arange(n[i]) * STEP for i in range(3))
    D = np.empty(n, np.float32)
    for i, x in enumerate(xs):
        for j, y in enumerate(ys):
            for k, z in enumerate(zs):
                p = Vector((x, y, z)); best = 1.0
                for b in bvhs:
                    loc, nrm, _, d = b.find_nearest(p, .06)
                    if loc is None: continue
                    s = d if (p - loc).dot(nrm) > 0 else -d
                    if abs(s) < abs(best) or s < 0 < best: best = s if (s < 0 or best > 0) else best
                D[i, j, k] = best
    return D, (xs, ys, zs)


def mannequin(D, axes, r_open=3, sigma=1.0, sigma_face=2.5, keep_ears=0.0):
    """Morphology + blur on the inside mask; returns (verts, faces) in source units."""
    from skimage.measure import marching_cubes
    xs, ys, zs = axes
    occ = D < 0
    occ = ndimage.binary_closing(np.pad(occ, 3), ball(2))[3:-3, 3:-3, 3:-3]
    occ = ndimage.binary_fill_holes(occ)
    op = ndimage.binary_opening(np.pad(occ, 4), ball(r_open))[4:-4, 4:-4, 4:-4]
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing='ij')
    ear = np.clip((np.abs(X) - .062) / .01, 0, 1) * (Z > 1.58) * (Z < 1.74)
    occ = np.where(ear > 0, (op | (occ & (np.abs(X) < .062 + keep_ears * .03))), op)
    occ[:, :, 0] = False                                                 # closed cap inside the neck
    sd = (ndimage.distance_transform_edt(~occ) - ndimage.distance_transform_edt(occ)).astype(np.float32)
    s = lambda a, b, x: np.clip((x - a) / (b - a), 0, 1)
    face = s(-.055, -.10, Y) * s(1.54, 1.58, Z) * s(1.76, 1.72, Z)        # face front: eyes … chin
    sd = ndimage.gaussian_filter(sd, sigma) * (1 - face) + ndimage.gaussian_filter(sd, sigma_face) * face
    sd[:, :, 0] = np.maximum(sd[:, :, 0], .5)
    v, f, _, _ = marching_cubes(sd, 0.0)
    v = BOX[0] + v * STEP
    return v, f[:, ::-1]
