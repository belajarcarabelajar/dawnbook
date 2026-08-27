#!/usr/bin/env python3
import os
import subprocess
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT_DIR / "public"
ICONS_DIR = PUBLIC_DIR / "icons"
TEMPLATE_THEME_DIR = ROOT_DIR / "books" / "_template" / "theme"

PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
ICONS_DIR.mkdir(parents=True, exist_ok=True)
TEMPLATE_THEME_DIR.mkdir(parents=True, exist_ok=True)

# 1. Read Twemoji 1f305 SVG source
svg_path = Path("/tmp/twemoji-1f305.svg")
if not svg_path.exists():
    raise FileNotFoundError("/tmp/twemoji-1f305.svg not found")

svg_content = svg_path.read_text(encoding="utf-8")

# Write master SVG
for dest in [
    PUBLIC_DIR / "favicon.svg",
    ICONS_DIR / "icon-192.svg",
    ICONS_DIR / "icon-512.svg",
    TEMPLATE_THEME_DIR / "favicon.svg",
]:
    dest.write_text(svg_content, encoding="utf-8")
    print(f"✅ Wrote SVG to {dest.relative_to(ROOT_DIR)}")

# 2. Render PNGs using rsvg-convert for high-quality antialiased Cairo rendering
sizes = [
    (16, "/tmp/favicon-16.png"),
    (32, "/tmp/favicon-32.png"),
    (48, str(PUBLIC_DIR / "favicon-48x48.png")),
    (96, str(PUBLIC_DIR / "favicon-96x96.png")),
    (180, str(PUBLIC_DIR / "apple-touch-icon.png")),
    (192, str(PUBLIC_DIR / "favicon-192x192.png")),
    (192, str(PUBLIC_DIR / "icon-192.png")),
    (192, str(TEMPLATE_THEME_DIR / "favicon.png")),
    (512, str(PUBLIC_DIR / "favicon-512x512.png")),
    (512, str(PUBLIC_DIR / "icon-512.png")),
]

for size, target_path in sizes:
    cmd = [
        "rsvg-convert",
        "-w", str(size),
        "-h", str(size),
        str(PUBLIC_DIR / "favicon.svg"),
        "-o", target_path,
    ]
    subprocess.run(cmd, check=True)
    print(f"✅ Rendered {size}x{size} PNG to {target_path}")

# 3. Generate multi-resolution favicon.ico (16x16, 32x32, 48x48)
img_16 = Image.open("/tmp/favicon-16.png")
img_32 = Image.open("/tmp/favicon-32.png")
img_48 = Image.open(PUBLIC_DIR / "favicon-48x48.png")

ico_path = PUBLIC_DIR / "favicon.ico"
img_48.save(
    ico_path,
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[img_32, img_16],
)
print(f"✅ Generated multi-resolution ICO at {ico_path.relative_to(ROOT_DIR)}")
