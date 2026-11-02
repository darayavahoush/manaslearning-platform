#!/usr/bin/env python3
"""
Generates the 24 Support Card Spot Illustrations (E1-E24), 3 Landing Steps (F1-F3),
and 5 Dyslexia Sub-lab headers (F5-F9) in the authentic ITW children's book watercolor
aesthetic on warm cream paper tone (#fdfbf7).
"""

import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFilter

OUT_DIR = "/Users/ananyasridhar/work/vaakbot/web/public/decor/itw"
os.makedirs(OUT_DIR, exist_ok=True)

def create_base(width=512, height=512, bg_color=(253, 251, 247)):
    img = Image.new("RGBA", (width, height), (*bg_color, 255))
    # Soft paper texture vignette
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    margin = int(width * 0.04)
    d.rounded_rectangle(
        [margin, margin, width - margin, height - margin],
        radius=int(width * 0.08),
        outline=(230, 224, 215, 180),
        width=int(width * 0.008)
    )
    return img, overlay

def draw_watercolor_wash(img, center, radius, color, opacity=110):
    wash = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(wash)
    cx, cy = center
    # Layered organic circular blooms
    for r, op in [(radius, opacity // 3), (int(radius * 0.8), opacity // 2), (int(radius * 0.6), opacity)]:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*color, op))
    wash = wash.filter(ImageFilter.GaussianBlur(radius * 0.25))
    return Image.alpha_composite(img, wash)

def export_webp(img, overlay, filename, max_kb=40):
    final = Image.alpha_composite(img, overlay).convert("RGB")
    tmp_png = f"/tmp/{filename}.png"
    out_webp = os.path.join(OUT_DIR, filename)
    final.save(tmp_png, "PNG")
    subprocess.run(["cwebp", "-q", "82", "-m", "6", tmp_png, "-o", out_webp], check=True, stdout=subprocess.DEVNULL)
    if os.path.exists(tmp_png):
        os.remove(tmp_png)
    size_kb = os.path.getsize(out_webp) / 1024
    print(f"Exported {filename}: {size_kb:.1f} KB")

# Palette accents
PALETTE = {
    "autism": (59, 130, 246),      # Cornflower Blue
    "adhd": (245, 158, 11),        # Amber
    "dyslexia": (16, 185, 129),    # Sage / Mint
    "speech": (234, 88, 12),       # Terracotta
    "dyscalc": (13, 148, 136),     # Teal
    "dysgraph": (180, 83, 9),      # Rust
    "auditory": (37, 99, 235),     # Navy
    "exec": (22, 163, 74),         # Emerald
}

INK = (31, 45, 61) # Soft charcoal ink

# ----------------- E1-E24 Support Spot Art -----------------

def gen_spot(filename, pal_key, draw_fn):
    img, overlay = create_base(512, 512)
    color = PALETTE[pal_key]
    img = draw_watercolor_wash(img, (256, 256), 180, color, opacity=90)
    d = ImageDraw.Draw(overlay)
    draw_fn(d, color)
    export_webp(img, overlay, filename)

# E1: Autism Headphones
def draw_e1(d, c):
    # Headphone band
    d.arc([166, 150, 346, 330], start=180, end=0, fill=INK, width=8)
    # Ear cups
    d.rounded_rectangle([140, 230, 186, 310], radius=16, fill=(*c, 230), outline=INK, width=5)
    d.rounded_rectangle([326, 230, 372, 310], radius=16, fill=(*c, 230), outline=INK, width=5)
    # Sound wave arcs dampening
    d.arc([90, 240, 130, 300], start=110, end=250, fill=c, width=4)
    d.arc([382, 240, 422, 300], start=-70, end=70, fill=c, width=4)

# E2: Autism Visual Calm / Desk Lamp
def draw_e2(d, c):
    # Lamp base & neck
    d.line([256, 360, 256, 220], fill=INK, width=6)
    d.line([200, 360, 312, 360], fill=INK, width=6)
    # Lamp shade
    d.polygon([(216, 220), (296, 220), (326, 170), (186, 170)], fill=(*c, 220), outline=INK)
    # Soft light cone
    d.polygon([(186, 220), (326, 220), (390, 360), (122, 360)], fill=(254, 240, 138, 110))

# E3: Autism Quiet Corner Sanctuary
def draw_e3(d, c):
    # Floor cushion
    d.rounded_rectangle([160, 310, 352, 360], radius=24, fill=(*c, 200), outline=INK, width=5)
    # Fern plant
    d.arc([220, 210, 256, 310], start=180, end=270, fill=INK, width=4)
    d.arc([256, 190, 292, 310], start=270, end=360, fill=INK, width=4)
    # Calm star
    d.ellipse([250, 150, 262, 162], fill=(245, 158, 11))

# E4: ADHD Checklist
def draw_e4(d, c):
    # Clipboard
    d.rounded_rectangle([170, 140, 342, 372], radius=18, fill=(255, 255, 255, 240), outline=INK, width=6)
    d.rounded_rectangle([216, 120, 296, 156], radius=8, fill=(*c, 240), outline=INK, width=4)
    # Check rows
    for y in [186, 242, 298]:
        d.line([226, y, 312, y], fill=(148, 163, 184), width=5)
        # Green checkmark
        d.line([190, y - 2, 198, y + 6], fill=(16, 185, 129), width=5)
        d.line([198, y + 6, 212, y - 8], fill=(16, 185, 129), width=5)

# E5: ADHD Focus Shield
def draw_e5(d, c):
    # Shield shape
    d.polygon([(256, 130), (346, 170), (346, 280), (256, 372), (166, 280), (166, 170)], fill=(*c, 200), outline=INK)
    # Inner glowing lotus dot
    d.ellipse([236, 236, 276, 276], fill=(255, 255, 255, 240), outline=INK, width=4)

# E6: ADHD Chunking / Stepping Stone
def draw_e6(d, c):
    # Isolated focused card
    d.rounded_rectangle([176, 180, 336, 320], radius=16, fill=(255, 255, 255, 240), outline=INK, width=6)
    d.line([206, 230, 306, 230], fill=(*c, 240), width=6)
    d.line([206, 270, 276, 270], fill=(148, 163, 184), width=5)
    # Background stacked cards
    d.rounded_rectangle([196, 156, 356, 180], radius=10, fill=(241, 245, 249, 180), outline=INK, width=4)

# E7: Dyslexia Spacing
def draw_e7(d, c):
    # Text lines with expanded vertical arrows
    for y in [170, 256, 342]:
        d.line([160, y, 352, y], fill=INK, width=6)
    # Spacing expansion arrows
    d.line([370, 180, 370, 246], fill=(*c, 240), width=4)
    d.line([364, 190, 370, 180], fill=(*c, 240), width=4)
    d.line([376, 190, 370, 180], fill=(*c, 240), width=4)
    d.line([364, 236, 370, 246], fill=(*c, 240), width=4)
    d.line([376, 236, 370, 246], fill=(*c, 240), width=4)

# E8: Dyslexia Reading Ruler
def draw_e8(d, c):
    # Book lines
    for y in [160, 210, 260, 310, 360]:
        d.line([150, y, 362, y], fill=(148, 163, 184), width=4)
    # Tinted reading ruler guide
    d.rounded_rectangle([136, 238, 376, 282], radius=6, fill=(*c, 120), outline=c, width=4)
    d.line([150, 260, 362, 260], fill=INK, width=6)

# E9: Dyslexia Audio Read Aloud
def draw_e9(d, c):
    # Open storybook
    d.polygon([(256, 220), (160, 240), (160, 340), (256, 320)], fill=(255, 255, 255, 240), outline=INK)
    d.polygon([(256, 220), (352, 240), (352, 340), (256, 320)], fill=(255, 255, 255, 240), outline=INK)
    # Floating audio notes
    d.arc([220, 140, 292, 212], start=180, end=0, fill=(*c, 240), width=6)
    d.ellipse([216, 190, 232, 216], fill=(*c, 240))
    d.ellipse([280, 190, 296, 216], fill=(*c, 240))

# E10: Speech Patient Wait Time
def draw_e10(d, c):
    # Hourglass resting peacefully
    d.polygon([(206, 160), (306, 160), (256, 256)], fill=(*c, 180), outline=INK)
    d.polygon([(256, 256), (306, 352), (206, 352)], fill=(*c, 180), outline=INK)
    d.line([190, 160, 322, 160], fill=INK, width=6)
    d.line([190, 352, 322, 352], fill=INK, width=6)

# E11: Speech Agency / No Interruption
def draw_e11(d, c):
    # Speech bubble with breathing room
    d.rounded_rectangle([160, 180, 352, 300], radius=24, fill=(255, 255, 255, 240), outline=INK, width=6)
    d.polygon([(210, 300), (230, 330), (250, 300)], fill=(255, 255, 255, 240), outline=INK)
    d.line([196, 240, 316, 240], fill=(*c, 240), width=6)

# E12: Speech Multi-Modal AAC
def draw_e12(d, c):
    # Tablet device
    d.rounded_rectangle([150, 150, 362, 362], radius=20, fill=(255, 255, 255, 240), outline=INK, width=6)
    # 4 grid cards
    d.rounded_rectangle([176, 176, 242, 242], radius=8, fill=(*c, 200), outline=INK, width=3)
    d.rounded_rectangle([270, 176, 336, 242], radius=8, fill=(59, 130, 246, 200), outline=INK, width=3)
    d.rounded_rectangle([176, 270, 242, 336], radius=8, fill=(16, 185, 129, 200), outline=INK, width=3)
    d.rounded_rectangle([270, 270, 336, 336], radius=8, fill=(245, 158, 11, 200), outline=INK, width=3)

# E13: Dyscalculia Number Line
def draw_e13(d, c):
    # Horizontal line with tick marks
    d.line([120, 280, 392, 280], fill=INK, width=6)
    for x in [150, 210, 270, 330, 390]:
        d.line([x, 270, x, 290], fill=INK, width=5)
    # Hop arcs
    d.arc([150, 220, 270, 320], start=180, end=0, fill=(*c, 240), width=5)
    d.arc([270, 220, 390, 320], start=180, end=0, fill=(*c, 240), width=5)

# E14: Dyscalculia Tactile Blocks
def draw_e14(d, c):
    # Stacked wooden base-10 counting cubes
    for i, (x, y) in enumerate([(190, 290), (250, 290), (310, 290), (220, 230), (280, 230), (250, 170)]):
        d.rounded_rectangle([x - 22, y - 22, x + 22, y + 22], radius=6, fill=(*c, 220), outline=INK, width=4)

# E15: Dyscalculia Scaffold Ratio
def draw_e15(d, c):
    # Balance beam
    d.polygon([(256, 320), (236, 350), (276, 350)], fill=INK)
    d.line([160, 280, 352, 280], fill=INK, width=6)
    # Weighing pans with proportional blocks
    d.rectangle([170, 240, 210, 280], fill=(*c, 240), outline=INK, width=4)
    d.rectangle([300, 255, 340, 280], fill=(*c, 240), outline=INK, width=4)

# E16: Dysgraphia Dictation
def draw_e16(d, c):
    # Microphone
    d.rounded_rectangle([236, 170, 276, 250], radius=20, fill=(*c, 220), outline=INK, width=5)
    d.arc([216, 210, 296, 270], start=0, end=180, fill=INK, width=5)
    d.line([256, 270, 256, 330], fill=INK, width=5)
    d.line([226, 330, 286, 330], fill=INK, width=5)
    # Sound wave to text ribbon
    d.arc([296, 180, 356, 240], start=-60, end=60, fill=(*c, 240), width=4)

# E17: Dysgraphia Word Bank
def draw_e17(d, c):
    # Academic phrase assembly tiles
    d.rounded_rectangle([150, 190, 280, 240], radius=10, fill=(255, 255, 255, 240), outline=INK, width=4)
    d.line([170, 215, 260, 215], fill=(*c, 240), width=5)
    d.rounded_rectangle([230, 260, 360, 310], radius=10, fill=(255, 255, 255, 240), outline=INK, width=4)
    d.line([250, 285, 340, 285], fill=(*c, 240), width=5)

# E18: Dysgraphia Predictive Autocomplete
def draw_e18(d, c):
    # Key with suggestion bubbles
    d.rounded_rectangle([190, 250, 322, 330], radius=14, fill=(255, 255, 255, 240), outline=INK, width=5)
    d.ellipse([210, 180, 246, 216], fill=(*c, 200), outline=INK, width=3)
    d.ellipse([256, 170, 300, 214], fill=(*c, 240), outline=INK, width=4)
    d.ellipse([310, 180, 346, 216], fill=(*c, 200), outline=INK, width=3)

# E19: Auditory Captions Display
def draw_e19(d, c):
    # Monitor screen with text rows
    d.rounded_rectangle([150, 170, 362, 310], radius=14, fill=(255, 255, 255, 240), outline=INK, width=6)
    d.line([256, 310, 256, 350], fill=INK, width=6)
    d.line([216, 350, 296, 350], fill=INK, width=6)
    d.line([180, 215, 332, 215], fill=(*c, 240), width=5)
    d.line([180, 245, 300, 245], fill=(*c, 240), width=5)
    d.line([180, 275, 260, 275], fill=(148, 163, 184), width=4)

# E20: Auditory Remote Microphone
def draw_e20(d, c):
    # Transmitter mic badge
    d.rounded_rectangle([226, 170, 286, 270], radius=12, fill=(*c, 230), outline=INK, width=5)
    d.ellipse([246, 190, 266, 210], fill=INK)
    # Transmission signal arcs
    d.arc([176, 160, 336, 320], start=210, end=330, fill=c, width=4)
    d.arc([146, 130, 366, 350], start=210, end=330, fill=c, width=4)

# E21: Auditory Segmented Chunks
def draw_e21(d, c):
    # Three chunk play bars
    for i, y in enumerate([180, 246, 312]):
        d.rounded_rectangle([160, y, 352, y + 44], radius=10, fill=(255, 255, 255, 240), outline=INK, width=4)
        # Play triangle
        d.polygon([(182, y + 14), (182, y + 30), (198, y + 22)], fill=(*c, 240))
        d.line([214, y + 22, 326, y + 22], fill=(148, 163, 184), width=5)

# E22: Executive Now Next Later
def draw_e22(d, c):
    # 3-column kanban board
    d.rounded_rectangle([140, 160, 372, 352], radius=16, fill=(255, 255, 255, 240), outline=INK, width=6)
    d.line([217, 160, 217, 352], fill=INK, width=4)
    d.line([294, 160, 294, 352], fill=INK, width=4)
    # Task cards in column 1
    d.rounded_rectangle([152, 190, 205, 240], radius=6, fill=(*c, 220), outline=INK, width=3)
    d.rounded_rectangle([152, 256, 205, 306], radius=6, fill=(*c, 160), outline=INK, width=3)

# E23: Executive Roadmap
def draw_e23(d, c):
    # Stepping stones connected by path
    coords = [(180, 320), (230, 250), (280, 310), (330, 210)]
    for i in range(len(coords) - 1):
        d.line([coords[i][0], coords[i][1], coords[i+1][0], coords[i+1][1]], fill=(148, 163, 184), width=4)
    for x, y in coords:
        d.ellipse([x - 18, y - 18, x + 18, y + 18], fill=(*c, 230), outline=INK, width=4)
    # Flag at goal
    d.line([330, 210, 330, 150], fill=INK, width=4)
    d.polygon([(330, 150), (360, 165), (330, 180)], fill=(245, 158, 11))

# E24: Executive One-Step
def draw_e24(d, c):
    # Magnifying glass over single task card
    d.rounded_rectangle([180, 200, 332, 280], radius=12, fill=(255, 255, 255, 240), outline=INK, width=5)
    d.line([204, 240, 308, 240], fill=(*c, 240), width=6)
    # Lens
    d.ellipse([216, 176, 296, 256], fill=(*c, 80), outline=INK, width=6)
    d.line([280, 240, 330, 290], fill=INK, width=8)

# ----------------- F1-F3 Landing Steps -----------------
def draw_f1(d, c):
    # Choose: Compass / Wayfinding
    d.ellipse([180, 180, 332, 332], fill=(255, 255, 255, 240), outline=INK, width=6)
    d.polygon([(256, 200), (280, 256), (256, 250)], fill=(234, 88, 12))
    d.polygon([(256, 312), (232, 256), (256, 262)], fill=INK)

def draw_f2(d, c):
    # Try: Interactive slider & lever
    d.rounded_rectangle([170, 200, 342, 312], radius=16, fill=(255, 255, 255, 240), outline=INK, width=6)
    d.line([200, 256, 312, 256], fill=(148, 163, 184), width=6)
    d.ellipse([240, 240, 272, 272], fill=(59, 130, 246), outline=INK, width=4)

def draw_f3(d, c):
    # Understand: Glowing lightbulb with leaf
    d.ellipse([216, 170, 296, 250], fill=(254, 240, 138, 220), outline=INK, width=5)
    d.polygon([(226, 246), (286, 246), (276, 290), (236, 290)], fill=(*c, 220), outline=INK)
    d.line([256, 150, 256, 130], fill=c, width=4)
    d.line([190, 180, 170, 170], fill=c, width=4)
    d.line([322, 180, 342, 170], fill=c, width=4)

# ----------------- F5-F9 Dyslexia Sub-labs (800x450) -----------------
def gen_dys_sublab(filename, draw_fn):
    img, overlay = create_base(800, 450)
    color = PALETTE["dyslexia"]
    img = draw_watercolor_wash(img, (400, 225), 240, color, opacity=80)
    d = ImageDraw.Draw(overlay)
    draw_fn(d, color)
    export_webp(img, overlay, filename)

def draw_f5(d, c):
    # Scramble: Animated scattered letters
    for x, y, char in [(280, 210, "a"), (360, 240, "e"), (440, 200, "r"), (520, 230, "t")]:
        d.ellipse([x - 28, y - 28, x + 28, y + 28], fill=(255, 255, 255, 220), outline=INK, width=4)
        d.line([x - 12, y, x + 12, y], fill=(*c, 240), width=5)

def draw_f6(d, c):
    # Mirror confusion: b and d reflections
    d.rounded_rectangle([280, 160, 370, 280], radius=14, fill=(255, 255, 255, 240), outline=INK, width=5)
    d.rounded_rectangle([430, 160, 520, 280], radius=14, fill=(255, 255, 255, 240), outline=INK, width=5)
    d.line([400, 150, 400, 290], fill=(148, 163, 184), width=3) # Mirror plane

def draw_f7(d, c):
    # Visual Crowding
    for x in range(260, 560, 30):
        d.line([x, 180, x, 270], fill=INK, width=5)
    # Focus spotlight
    d.ellipse([370, 190, 450, 270], fill=(*c, 80), outline=c, width=4)

def draw_f8(d, c):
    # Transient Blur
    for y in [180, 225, 270]:
        d.line([250, y, 550, y], fill=(148, 163, 184), width=6)
    # Soft foveal clarity zone
    d.ellipse([360, 185, 440, 265], fill=(255, 255, 255, 180), outline=(*c, 200), width=4)

def draw_f9(d, c):
    # Floating river wave
    points = []
    for x in range(220, 581, 10):
        y = int(225 + 28 * math.sin((x - 220) / 45.0))
        points.append((x, y))
    for i in range(len(points) - 1):
        d.line([points[i][0], points[i][1], points[i+1][0], points[i+1][1]], fill=(*c, 240), width=7)

# --- Execute Generation ---
SPOTS = [
    ("itw-autism-support-headphones.webp", "autism", draw_e1),
    ("itw-autism-support-declutter.webp", "autism", draw_e2),
    ("itw-autism-support-sanctuary.webp", "autism", draw_e3),
    ("itw-adhd-support-checklist.webp", "adhd", draw_e4),
    ("itw-adhd-support-focus-shield.webp", "adhd", draw_e5),
    ("itw-adhd-support-chunking.webp", "adhd", draw_e6),
    ("itw-dyslexia-support-spacing.webp", "dyslexia", draw_e7),
    ("itw-dyslexia-support-ruler.webp", "dyslexia", draw_e8),
    ("itw-dyslexia-support-audio.webp", "dyslexia", draw_e9),
    ("itw-speech-support-patience.webp", "speech", draw_e10),
    ("itw-speech-support-agency.webp", "speech", draw_e11),
    ("itw-speech-support-aac.webp", "speech", draw_e12),
    ("itw-dyscalc-support-numberline.webp", "dyscalc", draw_e13),
    ("itw-dyscalc-support-blocks.webp", "dyscalc", draw_e14),
    ("itw-dyscalc-support-scaffold.webp", "dyscalc", draw_e15),
    ("itw-dysgraph-support-dictation.webp", "dysgraph", draw_e16),
    ("itw-dysgraph-support-wordbank.webp", "dysgraph", draw_e17),
    ("itw-dysgraph-support-predictive.webp", "dysgraph", draw_e18),
    ("itw-auditory-support-captions.webp", "auditory", draw_e19),
    ("itw-auditory-support-mic.webp", "auditory", draw_e20),
    ("itw-auditory-support-chunking.webp", "auditory", draw_e21),
    ("itw-exec-support-nnl.webp", "exec", draw_e22),
    ("itw-exec-support-roadmap.webp", "exec", draw_e23),
    ("itw-exec-support-onestep.webp", "exec", draw_e24),
    ("itw-landing-how-choose.webp", "speech", draw_f1),
    ("itw-landing-how-try.webp", "auditory", draw_f2),
    ("itw-landing-how-understand.webp", "dyslexia", draw_f3),
]

for filename, pal_key, draw_fn in SPOTS:
    gen_spot(filename, pal_key, draw_fn)

DYSLABS = [
    ("itw-dyslexia-lab-scramble.webp", draw_f5),
    ("itw-dyslexia-lab-mirror.webp", draw_f6),
    ("itw-dyslexia-lab-crowding.webp", draw_f7),
    ("itw-dyslexia-lab-blur.webp", draw_f8),
    ("itw-dyslexia-lab-floating.webp", draw_f9),
]

for filename, draw_fn in DYSLABS:
    gen_dys_sublab(filename, draw_fn)

print("All 32 spot illustrations and lab headers generated successfully!")
