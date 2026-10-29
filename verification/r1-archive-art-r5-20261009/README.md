# Archive r5 (D-061) and edge-width metrics (F-039), 2026-10-09 — stills only

User: make light bounce off the floor or a side face so light/shadow boundaries spread like REF-002's right side; more bounces,
or more light below? And add/repair metrics that measure "crisp where crisp, soft where soft" (the old `edge` did not).
Build: `python scripts/blender/build_archive.py --intro2 --art r5 --dress --palette pastel|archive --look h5 --preview DIR --samples 64`
Measure: `python scripts/assets/frame-tone-stats.py FRAME [--map edges.png]`, self-test `--selftest` (synthetic step / 40 / 120 px ramps).

New metrics (720 px high, see the script docstring): spread (L*90−10), sharp‰ / sharpC / crisp20‰ (crisp edges, their contrast),
soft_area% / softC (soft edges by width), plain_range (L*90−10 on plain, untextured surfaces).
What separated REF from us: plain_range (REF 57–69, r3 20, D-060 30–42) and crisp-edge contrast (sharpC REF 20–22, ours 11–14), plus
lifted darks (L*5 REF 2–4, ours 12). Soft area alone was similar on the shelf region — not the main gap.
Also found: Cycles caps diffuse bounces at 4 by default, so `max_bounces 6` had been 4 diffuse bounces.

Experiments (960×540, 48 samples, pastel + dressing): table in D-061. Bounces 12: no change. Floor-patch hole: plain_range 30 → 49
(the floor bounces light up onto the lower cells and the cabinet, and the same sun grazes the right side face). Low sky + stronger sun:
deeper shadow side. AgX Punchy tone curve: darks to REF level (L*5 1–3). r5 = floor patch + sky 0.8 + sun 26 + exposure 0.9 + Punchy.

Finals (1280×720, 64 samples), `r5_compare.jpg`, `edge_width_maps.jpg` (red crisp, blue soft):
| | D-060 pastel a1 / a2 | r5 pastel a1 / a2 | r5 archive a1 / a2 | REF-002 (3 frames) |
|---|---|---|---|---|
| L* 5/25/50/75/95 (a1) | 12 23 34 42 83 | 2 12 25 39 80 | −8 −1 10 23 75 | 2–4 15–18 25–33 52–62 81–97 |
| plain_range | 30 / 42 | 52 / 50 | 36 / 32 | 57–69 |
| spread | 57 / 60 | 66 / 68 | 69 / 75 | 67–77 |
| soft_area% | 8.0 / 6.3 | 8.5 / 7.2 | 11.1 / 9.0 | 10–12 |
| sharpC / crisp20‰ | 13 / 14 | 14 / 16 | 15–16 / 17 | 20–22 / 22–27 |
| lit% | 11.5 / 16.1 | 10.8 / 14.2 | 6.9 / 9.6 | 13–18 |
| pastel% | 10.8 / 11.5 | 14.1 / 14.4 | 10.5 | 22–25 |

Read: pastel r5's tone distribution now overlaps REF's; light changes across plain surfaces nearly as far as in REF. Archive r5 is
crushed (L*5 −8 = clipped black): the archive palette needs the r4 tone (or a lift) if chosen. Crisp-edge contrast is still short;
part of our crisp edges are the figure's rings (red stripes on the map), which REF does not have — compare with the figure masked
before chasing that number. Not checked: web bake / runtime (the web has its own tone mapping), Edge.
