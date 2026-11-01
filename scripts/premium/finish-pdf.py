#!/usr/bin/env python3
"""Final assembly of a premium book PDF printed by scripts/premium/print-pdf.ts.

Usage (print-pdf.ts runs it this way):
  uv run --no-project --quiet --with pikepdf==<PIKEPDF_VERSION> python3 -I \
    scripts/premium/finish-pdf.py <book.pdf> <out.pdf> [--cover <cover.pdf>] [--restrict]

The pikepdf version is pinned once, as PIKEPDF_VERSION in print-pdf.ts. pikepdf bundles qpdf, so
no system package is needed.

--cover puts the one-page cover PDF in front as page 1. Chromium's chapter bookmarks point at page
objects, not page numbers, so they still open the right pages after the insert (probe 2026-11-01).
--restrict saves with AES-256 (R=6), an empty open password and a random owner password that is
never stored. Text extraction and changes are not allowed; printing and accessibility are. Reader
apps honour this as a request: it is a signal, not protection.

Prints one JSON line, read back from the saved file:
  {"pages": <page count>, "outline": <top-level bookmarks>, "encrypted": <true|false>}
Exit codes: 0 success, 1 failure, 2 usage error.
"""

import argparse
import contextlib
import json
import secrets
import sys

import pikepdf


def outline_count(pdf):
    outlines = pdf.Root.get("/Outlines")
    if outlines is None:
        return 0
    count = 0
    seen = set()
    item = outlines.get("/First")
    # A malformed outline can link back to an earlier entry; stop instead of looping forever.
    while item is not None and item.objgen not in seen:
        seen.add(item.objgen)
        count += 1
        item = item.get("/Next")
    return count


def restriction():
    return pikepdf.Encryption(
        owner=secrets.token_hex(16),
        user="",
        R=6,
        allow=pikepdf.Permissions(
            extract=False,
            modify_other=False,
            modify_assembly=False,
            modify_annotation=False,
            modify_form=False,
            print_lowres=True,
            print_highres=True,
            accessibility=True,
        ),
    )


def main(argv=None):
    parser = argparse.ArgumentParser(prog="finish-pdf.py", description="Cover and copy restriction for a printed book PDF.")
    parser.add_argument("book", help="the book PDF printed by Chromium")
    parser.add_argument("out", help="where to write the finished PDF")
    parser.add_argument("--cover", help="a one-page PDF to insert as page 1")
    parser.add_argument("--restrict", action="store_true", help="AES-256, no text extraction or changes, printing allowed")
    args = parser.parse_args(argv)

    try:
        cover_file = pikepdf.open(args.cover) if args.cover else contextlib.nullcontext()
        # qpdf copies a foreign page lazily, so the cover file stays open until the save is done.
        with pikepdf.open(args.book) as pdf, cover_file as cover:
            if cover is not None:
                pdf.pages.insert(0, cover.pages[0])
            if args.restrict:
                pdf.save(args.out, encryption=restriction())
            else:
                pdf.save(args.out)
        with pikepdf.open(args.out) as done:
            result = {"pages": len(done.pages), "outline": outline_count(done), "encrypted": done.is_encrypted}
    except Exception as err:  # noqa: BLE001 - one readable line for print-pdf instead of a traceback
        print(f"finish-pdf: {type(err).__name__}: {err}", file=sys.stderr)
        return 1
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
