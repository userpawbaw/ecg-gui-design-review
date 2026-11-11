# h1 — answer notes (hidden)

## Source situation
- t0st, "How I cut GTA Online loading times by 70%" (2021-02-28), https://nee.lv/2021/02/28/How-I-cut-GTA-Online-loading-times-by-70/ — a 10 MB JSON item catalog took ~6 min to load. Everybody assumed network/disk. Profiling a single pegged CPU thread showed two independent accidentally-quadratic spots: (1) `sscanf` calling `strlen` on the whole remaining buffer for every token, (2) a duplicate check that linearly scanned an array for each of ~63k entries. Reported by the author: fixing only the duplicate check 6:00 -> 4:30, only the parser -> 2:50, both -> 1:50 (~70 %). Rockstar confirmed and shipped a fix.
- Nelson Elhage, "Accidentally Quadratic" (https://accidentallyquadratic.tumblr.com/) — catalogue of the same pattern.
- Amdahl's law: with two hot spots of ~60 % and ~40 %, removing one bounds the speedup at 1/0.4 = 2.5x or 1/0.6 = 1.7x.

## The case
`catalog_loader.py` (python stdlib). User states confidently that file reading from a network drive is slow and asks for mmap / bigger buffers. Measured on the sample (512 KB, ~5000 records): read_text ~1 ms; `Lexer.next_token` ~60 % (each token does `rest = self.text[self.pos:]`, copying the remainder: ~135k tokens x ~250 KB); `merge_records` ~40 % (linear scan with `.upper()` on both sides for each record, ~20M comparisons).

## Method that works, and why
1. Measure first (cProfile or stage timers) -> I/O is ~0.02 %, so the request as stated cannot help.
2. Lexer: `TOKEN_RE.match(text, pos)` (pattern.match accepts a start position) instead of slicing -> linear.
3. Merge: dict from `sku.upper()` to the item; keep list for order -> linear. Must keep: case-insensitive match, first-seen position, first-seen spelling of the sku, later fields overwrite.
4. Save the original output before editing; compare after (`diff`/json equality) on sample plus another generated seed.
5. Re-time the whole CLI. Reference: 4.8 s -> 0.16 s (~30x) in this sandbox.

Evidence grade: **experimentally confirmed good solution** (reference in hidden/reference measured here; remaining time is linear tokenizing + JSON dump, so further gains are small constant factors — not a proven optimum).

## Limits / what a strong answer leaves as unverified
- Real network drive latency was not measured; if the real file read does take seconds there, that is a separate (now measurable) item — but the sample reproduces the slowness with a local file, which already disproves "I/O is the cause" for the seconds observed.
- Real terminal hardware speed unknown; ratio should carry over because the complexity changed.

## Common wrong paths
- Implement mmap / buffering / asyncio / pickle cache (user said the file differs every start; check.py uses a new file per run) -> ~1.0x.
- Fix only the top profile entry and stop at ~1.7–2.5x.
- Rewrite parser with line.split('=') / strip comments by '#': breaks `"see #12"`, `"size = L"`, `"[item] not included"`, escapes.
- dict keyed on raw sku (drops case-insensitivity) or replacing the stored sku spelling with the later one.
- Reporting a function-level micro-benchmark as the end-to-end gain.
