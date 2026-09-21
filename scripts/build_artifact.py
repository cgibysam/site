#!/usr/bin/env python3
"""Turn index.html into a body-only fragment for publishing as a claude.ai Artifact.
The Artifact host wraps the fragment in its own doctype/head/body, so those tags
and the charset/viewport metas are stripped; title, links, styles and content stay."""
import pathlib, re, sys
root = pathlib.Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text()
html = re.sub(r"<!doctype html>\s*", "", html, flags=re.I)
html = re.sub(r"</?html[^>]*>\s*", "", html, flags=re.I)
html = re.sub(r"</?head>\s*", "", html, flags=re.I)
html = re.sub(r"</?body>\s*", "", html, flags=re.I)
html = re.sub(r'<meta (charset|name="viewport")[^>]*>\s*', "", html, flags=re.I)
out = root / "dist" / "artifact.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html)
print(out, len(html), "bytes")
