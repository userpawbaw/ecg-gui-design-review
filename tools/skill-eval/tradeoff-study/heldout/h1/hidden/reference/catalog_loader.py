#!/usr/bin/env python3
"""상품 카탈로그(.cat) 로더.

사용법: python3 catalog_loader.py <입력.cat> <출력.json>
"""
import json
import re
import sys

TOKEN_RE = re.compile(
    r"""
    (?P<ws>[ \t\r]+)
  | (?P<comment>\#[^\n]*)
  | (?P<newline>\n)
  | (?P<header>\[item\])
  | (?P<string>"(?:[^"\\\n]|\\.)*")
  | (?P<number>-?\d+(?:\.\d+)?)(?![\w-])
  | (?P<punct>[=\[\],])
  | (?P<word>[A-Za-z_][\w-]*)
    """,
    re.VERBOSE,
)

ESCAPES = {"n": "\n", "t": "\t", '"': '"', "\\": "\\"}


class CatalogError(Exception):
    pass


class Lexer:
    def __init__(self, text):
        self.text = text
        self.pos = 0
        self.line = 1

    def next_token(self):
        """다음 (종류, 값) 토큰을 돌려준다. 끝이면 ("eof", None)."""
        text = self.text
        while True:
            if self.pos >= len(text):
                return ("eof", None)
            m = TOKEN_RE.match(text, self.pos)
            if m is None:
                raise CatalogError("line %d: unexpected character %r" % (self.line, text[self.pos]))
            self.pos = m.end()
            kind = m.lastgroup
            if kind in ("ws", "comment"):
                continue
            if kind == "newline":
                self.line += 1
                return ("newline", None)
            value = m.group(kind)
            if kind == "string":
                value = unescape(value[1:-1])
            elif kind == "number":
                value = float(value) if "." in value else int(value)
            return (kind, value)


def unescape(raw):
    if "\\" not in raw:
        return raw
    out = []
    i = 0
    while i < len(raw):
        ch = raw[i]
        if ch == "\\":
            i += 1
            out.append(ESCAPES.get(raw[i], raw[i]))
        else:
            out.append(ch)
        i += 1
    return "".join(out)


def read_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def parse_value(lexer, line):
    kind, value = lexer.next_token()
    if kind in ("string", "number", "word"):
        return value
    if kind == "punct" and value == "[":
        items = []
        while True:
            kind, value = lexer.next_token()
            if kind == "punct" and value == "]":
                return items
            if kind == "punct" and value == ",":
                continue
            if kind in ("string", "number", "word"):
                items.append(value)
                continue
            raise CatalogError("line %d: bad list" % lexer.line)
    raise CatalogError("line %d: value expected" % line)


def parse_records(text):
    """텍스트를 레코드(dict) 목록으로 바꾼다. 파일에 적힌 순서 그대로."""
    lexer = Lexer(text)
    records = []
    current = None
    while True:
        kind, value = lexer.next_token()
        if kind == "eof":
            break
        if kind == "newline":
            continue
        if kind == "header":
            current = {}
            records.append(current)
            continue
        if kind == "word":
            if current is None:
                raise CatalogError("line %d: field outside [item]" % lexer.line)
            key = value
            line = lexer.line
            kind, value = lexer.next_token()
            if not (kind == "punct" and value == "="):
                raise CatalogError("line %d: '=' expected" % line)
            current[key] = parse_value(lexer, line)
            continue
        raise CatalogError("line %d: unexpected %s" % (lexer.line, kind))
    return records


def merge_records(records):
    """같은 SKU가 다시 나오면 앞에 나온 항목을 갱신한다(자리는 처음 나온 위치 유지).

    SKU는 대소문자를 구분하지 않는다. 표기는 처음 나온 것을 유지한다.
    """
    items = []
    by_sku = {}
    for rec in records:
        if "sku" not in rec:
            raise CatalogError("item without sku")
        key = rec["sku"].upper()
        found = by_sku.get(key)
        if found is None:
            item = dict(rec)
            by_sku[key] = item
            items.append(item)
        else:
            for name, value in rec.items():
                if name != "sku":
                    found[name] = value
    return items


def load(path):
    text = read_text(path)
    records = parse_records(text)
    return merge_records(records)


def main(argv):
    if len(argv) != 3:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    items = load(argv[1])
    with open(argv[2], "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    print("items: %d" % len(items))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
