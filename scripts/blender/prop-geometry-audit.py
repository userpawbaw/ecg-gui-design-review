"""Read-only Blender Q2 geometry preflight for named hard-surface props (D-143).

Usage: bpy Python scripts/blender/prop-geometry-audit.py SCENE.blend PC_Case CRT_Body ...
Exit 1 when a named object is missing or is a plain unmodified cube. A PASS here is
only a mechanical preflight; silhouette, edge highlight and material still need Q1/Q2/Q3/Q4 images.
"""
import json
import sys
from pathlib import Path

import bpy


def inspect(scene_path, names):
    bpy.ops.wm.open_mainfile(filepath=str(scene_path))
    rows = []
    for name in names:
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != 'MESH':
            rows.append({'name': name, 'status': 'FAIL', 'reason': 'missing mesh'})
            continue
        mesh = obj.data
        mods = [mod.type for mod in obj.modifiers]
        primitive_box = len(mesh.vertices) == 8 and len(mesh.polygons) == 6
        bevel = 'BEVEL' in mods
        issues = []
        if primitive_box and not bevel:
            issues.append('unmodified six-face box: no edge geometry or Bevel modifier')
        if any(abs(v) < 1e-6 for v in obj.scale):
            issues.append('zero scale axis')
        rows.append({
            'name': name,
            'dimensions_m': [round(float(v), 4) for v in obj.dimensions],
            'vertices': len(mesh.vertices), 'polygons': len(mesh.polygons),
            'modifiers': mods, 'smooth_faces': sum(p.use_smooth for p in mesh.polygons),
            'primitive_box': primitive_box,
            'status': 'FAIL' if issues else 'MECHANICAL_PASS', 'issues': issues,
        })
    return rows


def main():
    if len(sys.argv) < 3:
        raise SystemExit('usage: prop-geometry-audit.py SCENE.blend OBJECT [OBJECT ...]')
    scene_path = Path(sys.argv[1])
    args = sys.argv[2:]
    output = None
    if '--output' in args:
        i = args.index('--output')
        output = Path(args[i + 1])
        del args[i:i + 2]
    if not args:
        raise SystemExit('at least one OBJECT required')
    rows = inspect(scene_path, args)
    report = json.dumps({'scene': str(scene_path), 'objects': rows}, ensure_ascii=False, indent=2)
    if output:
        output.write_text(report + '\n', encoding='utf-8')
        print(f'wrote {output}')
    else:
        print(report)
    return 1 if any(row['status'] == 'FAIL' for row in rows) else 0


if __name__ == '__main__':
    raise SystemExit(main())
