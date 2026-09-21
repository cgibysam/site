#!/usr/bin/env python3
"""Fetch generated media listed in assets/manifest.json and write web-optimized
derivatives into assets/img and assets/video.

Runs in GitHub Actions (.github/workflows/assets.yml). Safe to re-run: sources
are cached in .tmp-assets/ and outputs are overwritten.
"""
import json
import pathlib
import shutil
import subprocess
import urllib.request

from PIL import Image


def ffmpeg_bin() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg") or "ffmpeg"


FFMPEG = ffmpeg_bin()


def clean_alpha(im: Image.Image, threshold: int = 24) -> Image.Image:
    """Generated transparent PNGs carry faint alpha noise across the whole
    canvas, which makes bounding boxes span the full image. Zero it out."""
    im = im.convert("RGBA")
    alpha = im.getchannel("A").point(lambda v: 0 if v < threshold else v)
    im.putalpha(alpha)
    return im

import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
# Optional argument: the site folder holding assets/manifest.json (default: repo root).
SITE = (ROOT / sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT
IMG = SITE / "assets" / "img"
VID = SITE / "assets" / "video"
TMP = ROOT / ".tmp-assets" / SITE.name
for d in (IMG, VID, TMP):
    d.mkdir(parents=True, exist_ok=True)

manifest = json.loads((SITE / "assets" / "manifest.json").read_text())


def fetch(url: str, name: str) -> pathlib.Path:
    dst = TMP / name
    if not dst.exists():
        print("fetch", name)
        urllib.request.urlretrieve(url, dst)
    return dst


def save_webp(im: Image.Image, out: pathlib.Path, width=None, quality=82):
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(out, "WEBP", quality=quality, method=6)
    print(f"{out.relative_to(ROOT)} {im.size} {out.stat().st_size // 1024}KB")


def slice_layers(im: Image.Image, name: str):
    """Split an exploded-view RGBA image into horizontal bands separated by
    fully transparent rows. Writes one webp per band plus layers.json."""
    im = clean_alpha(im)
    w, h = im.size
    data = im.getchannel("A").tobytes()
    solid = [max(data[y * w:(y + 1) * w]) > 0 for y in range(h)]
    runs, start = [], None
    for y, on in enumerate(solid + [False]):
        if on and start is None:
            start = y
        elif not on and start is not None:
            if y - start >= 14:
                runs.append([start, y])
            start = None
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < 8:
            merged[-1][1] = r[1]
        else:
            merged.append(r)
    print("layers found:", len(merged), merged)
    meta = {"width": w, "height": h, "layers": []}
    scale = 1200 / w
    for i, (a, b) in enumerate(merged, 1):
        band = im.crop((0, a, w, b))
        bx = band.getbbox()
        band = band.crop(bx)
        band = band.resize((max(1, round(band.width * scale)), max(1, round(band.height * scale))), Image.LANCZOS)
        out = IMG / f"layer-{i}.webp"
        save_webp(band, out, None, 84)
        meta["layers"].append({
            "file": out.name,
            "x": bx[0], "y": a + bx[1],
            "w": bx[2] - bx[0], "h": bx[3] - bx[1],
        })
    (IMG / "layers.json").write_text(json.dumps(meta, indent=1))
    save_webp(im, IMG / f"{name}.webp", 1000, 82)


for item in manifest.get("images", []):
    kind = item.get("kind", "photo")
    done = IMG / ("layers.json" if kind == "layers" else f"{item['name']}.webp")
    if done.exists():
        print("skip", done.relative_to(ROOT))
        continue
    src = fetch(item["url"], item["name"] + ".png")
    im = Image.open(src)
    if kind == "photo":
        save_webp(im.convert("RGB"), IMG / f"{item['name']}.webp",
                  item.get("width", 1920), item.get("quality", 82))
    elif kind == "cutout":
        im = clean_alpha(im)
        im = im.crop(im.getbbox())
        save_webp(im, IMG / f"{item['name']}.webp", item.get("width", 1400), 86)
    elif kind == "layers":
        slice_layers(im, item["name"])

for v in manifest.get("videos", []):
    out = VID / f"{v['name']}.mp4"
    if out.exists():
        print("skip", out.relative_to(ROOT))
        continue
    src = fetch(v["url"], v["name"] + ".mp4")
    width = v.get("width", 1280)
    scale = f"scale={width}:-2"
    common = ["-an", "-c:v", "libx264", "-preset", "slow", "-crf", str(v.get("crf", 27)),
              "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
    if v.get("pingpong"):
        cmd = [FFMPEG, "-y", "-i", str(src), "-filter_complex",
               f"[0:v]{scale},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0[v]",
               "-map", "[v]"] + common
    else:
        cmd = [FFMPEG, "-y", "-i", str(src), "-vf", scale] + common
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"{out.relative_to(ROOT)} {out.stat().st_size // 1024}KB")
    poster_png = TMP / f"{v['name']}-poster.png"
    subprocess.run([FFMPEG, "-y", "-i", str(src), "-frames:v", "1", str(poster_png)],
                   check=True, capture_output=True)
    save_webp(Image.open(poster_png).convert("RGB"), IMG / f"{v['name']}-poster.webp", width, 78)
