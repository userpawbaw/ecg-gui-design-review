#!/usr/bin/env python3
"""테스트용 카탈로그 파일을 만든다.

사용법: python3 make_sample.py <출력.cat> [항목 수=5000] [시드=7]
"""
import random
import sys

ADJ = ["Blue", "Classic", "Mini", "Travel", "Soft", "Heavy", "Slim", "Wide", "Eco", "Pro"]
NOUN = ["Mug", "Lamp", "Chair", "Notebook", "Bottle", "Backpack", "Cable", "Stand", "Tray", "Clock"]
TAGS = ["kitchen", "gift", "office", "outdoor", "sale", "new", "kids", "pet", "desk", "travel-kit"]
NOTES = ['size = L', 'see #12', '5" x 7"', "[item] not included", 'a\\b', "two\tcols", "x, y", ""]


def sku(rng):
    return "%s%s-%04d" % (rng.choice("ABCDEFGH"), rng.choice("KLMNPQRS"), rng.randrange(10000))


def emit(rng, out, code, full):
    out.append("[item]")
    out.append('sku = "%s"' % code)
    if full or rng.random() < 0.5:
        name = "%s %s" % (rng.choice(ADJ), rng.choice(NOUN))
        if rng.random() < 0.1:
            name = '%s \\"%s\\"' % (name, rng.choice(ADJ))
        out.append('name = "%s"' % name)
    if full or rng.random() < 0.7:
        out.append("price = %d.%02d" % (rng.randrange(1, 300), rng.randrange(100)))
    if full or rng.random() < 0.7:
        out.append("stock = %d   # ea" % rng.randrange(0, 500))
    if full or rng.random() < 0.3:
        tags = rng.sample(TAGS, rng.randrange(0, 4))
        out.append("tags = [%s]" % ", ".join(tags))
    if rng.random() < 0.25:
        out.append("status = %s" % rng.choice(["active", "hold", "discontinued"]))
    if rng.random() < 0.2:
        note = rng.choice(NOTES).replace("\\", "\\\\").replace("\t", "\\t").replace('"', '\\"')
        out.append('note = "%s"' % note)
    out.append("")


def build(n, seed):
    rng = random.Random(seed)
    out = ["# catalog export", "# generated feed; later entries update earlier ones", ""]
    seen = []
    for i in range(n):
        if seen and rng.random() < 0.12:
            code = rng.choice(seen)
            if rng.random() < 0.3:
                code = code.lower()
            emit(rng, out, code, full=False)
        else:
            code = sku(rng)
            seen.append(code)
            emit(rng, out, code, full=True)
        if rng.random() < 0.02:
            out.append("# ---- batch %d ----" % i)
    return "\n".join(out) + "\n"


if __name__ == "__main__":
    path = sys.argv[1]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 5000
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 7
    with open(path, "w", encoding="utf-8") as f:
        f.write(build(n, seed))
