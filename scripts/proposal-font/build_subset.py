#!/usr/bin/env python3
"""
Build the proposal PDF font: two static Noto Sans instances (Regular, SemiBold)
subset to Latin-1 plus the symbols a quote prints (rupee, euro, dashes, quotes,
bullet, ellipsis). Output lands in public/fonts and is fetched lazily at export.

Source: the OFL Noto Sans variable font from the google/fonts repository
(ofl/notosans/NotoSans[wdth,wght].ttf). Keep the OFL notice beside the output.

Run (needs fonttools and brotli; a throwaway venv is fine):
  python3 -m venv .font-venv && .font-venv/bin/pip install fonttools brotli
  .font-venv/bin/python scripts/proposal-font/build_subset.py path/to/NotoSans[wdth,wght].ttf
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

OUT_DIR = Path(__file__).resolve().parents[2] / "public" / "fonts"
FAMILY = "NotoSansProposal"
INSTANCES = {"Regular": 400, "SemiBold": 600}
UNICODES = (
    "U+0020-007E,U+00A0-00FF,"  # ASCII and Latin-1 (incl. £, ·, ×)
    "U+20B9,U+20AC,"             # rupee, euro
    "U+2013,U+2014,"             # en dash, em dash
    "U+2018,U+2019,U+201C,U+201D,"  # quotes
    "U+2022,U+2026"              # bullet, ellipsis
)


def rename(font: TTFont, style: str) -> None:
    """Give each instance its own family so jsPDF and PDF.js never confuse the two."""
    full = f"{FAMILY} {style}"
    ps = f"{FAMILY}-{style}"
    for record in font["name"].names:
        if record.nameID in (1, 16):
            record.string = FAMILY
        elif record.nameID in (2, 17):
            record.string = style
        elif record.nameID == 4:
            record.string = full
        elif record.nameID == 6:
            record.string = ps


def build(source: Path) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for style, weight in INSTANCES.items():
        font = TTFont(source)
        static = instancer.instantiateVariableFont(font, {"wght": weight, "wdth": 100})
        rename(static, style)
        options = subset.Options()
        options.layout_features = ["kern", "liga", "calt"]
        options.name_IDs = ["*"]
        options.notdef_outline = True
        options.recalc_bounds = True
        options.hinting = False
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=subset.parse_unicodes(UNICODES))
        subsetter.subset(static)
        target = OUT_DIR / f"{FAMILY}-{style}.ttf"
        static.save(target)
        cmap = static.getBestCmap()
        print(f"{target.name}: {target.stat().st_size} bytes, {len(cmap)} glyphs, rupee={0x20B9 in cmap}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    build(Path(sys.argv[1]))
