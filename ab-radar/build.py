#!/usr/bin/env python3
"""Собирает самодостаточный index.html из src/ (без внешних зависимостей)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
ORDER = ["data.js", "core.js", "v0-overview.js", "v1-pult.js", "v2-board.js",
         "v3-timeline.js", "v4-registry.js", "v5-assistant.js"]

shell = (SRC / "shell.html").read_text(encoding="utf-8")
css = (SRC / "styles.css").read_text(encoding="utf-8")
js = "\n\n".join((SRC / f).read_text(encoding="utf-8") for f in ORDER)
out = shell.replace("/*STYLES*/", css).replace("/*SCRIPTS*/", js)
(ROOT / "index.html").write_text(out, encoding="utf-8")
print(f"index.html: {len(out) // 1024} KB")
