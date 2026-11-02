#!/usr/bin/env python3
"""
Generates the 24 Support Card Spot Illustrations (E1-E24), 3 Landing Steps (F1-F3),
and 5 Dyslexia Sub-lab headers (F5-F9) in authentic hand-painted children's picture book
watercolor style on warm cream paper tone (#fdfaf4) with organic ink linework.
Eliminates flat vector icons and clarifies ambiguous concepts (Declutter = neat tidy desk,
Sanctuary = cozy sensory nook with pillows and blanket).
"""

import os
import math
import subprocess
from PIL import Image, ImageDraw, ImageFilter

OUT_DIR = "/Users/ananyasridhar/work/vaakbot/web/public/decor/itw"
os.makedirs(OUT_DIR, exist_ok=True)

INK = (44, 36, 29)            # Warm dark sepia ink line
INK_LIGHT = (90, 78, 68)      # Soft secondary ink
PAPER_CREAM = (253, 250, 244) # Warm cream handmade paper tone
WOOD = (196, 142, 94)         # Warm teak wood
WOOD_DARK = (148, 98, 54)     # Dark teak wood
GREEN_TICK = (46, 125, 50)    # Natural leaf green check
AMBER_WARM = (217, 119, 6)    # Warm honey amber

# Color palettes per module accent
PALETTES = {
    "autism": [(59, 130, 246), (96, 165, 250), (37, 99, 235)],       # Gentle sky & periwinkle blue
    "adhd": [(245, 158, 11), (251, 191, 36), (217, 119, 6)],         # Honey amber & saffron
    "dyslexia": [(16, 185, 129), (52, 211, 153), (5, 150, 105)],     # Leaf green & sage
    "speech": [(234, 88, 12), (251, 146, 60), (194, 65, 12)],        # Terracotta & coral
    "dyscalc": [(13, 148, 136), (45, 212, 191), (15, 118, 110)],     # Deep teal & seafoam
    "dysgraph": [(194, 65, 12), (234, 88, 12), (154, 52, 18)],       # Warm rust & clay
    "auditory": [(30, 58, 138), (59, 130, 246), (29, 78, 216)],      # Deep navy & indigo
    "exec": [(5, 150, 105), (16, 185, 129), (4, 120, 87)],           # Forest green
    "landing": [(245, 158, 11), (13, 148, 136), (234, 88, 12)],      # Tri-color warm
}

def create_watercolor_canvas(width=512, height=512, wash_colors=None, wash_center=(256, 256), wash_radius=180):
    img = Image.new("RGBA", (width, height), (*PAPER_CREAM, 255))
    
    # Layered organic watercolor wash
    if wash_colors:
        wash = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        wd = ImageDraw.Draw(wash)
        cx, cy = wash_center
        c1, c2, c3 = wash_colors[0], wash_colors[1], wash_colors[2]
        
        # Base soft bloom
        wd.ellipse([cx - wash_radius, cy - wash_radius, cx + wash_radius, cy + wash_radius], fill=(*c2, 55))
        # Mid organic lobe
        wd.ellipse([cx - int(wash_radius * 0.75) + 15, cy - int(wash_radius * 0.7) - 10,
                    cx + int(wash_radius * 0.8) + 15, cy + int(wash_radius * 0.8) - 10], fill=(*c1, 80))
        # Inner warm heart
        wd.ellipse([cx - int(wash_radius * 0.5) - 10, cy - int(wash_radius * 0.5) + 15,
                    cx + int(wash_radius * 0.5) - 10, cy + int(wash_radius * 0.5) + 15], fill=(*c3, 60))
        
        wash = wash.filter(ImageFilter.GaussianBlur(32))
        img = Image.alpha_composite(img, wash)
    
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    # Soft border frame
    od = ImageDraw.Draw(overlay)
    margin = int(width * 0.04)
    od.rounded_rectangle(
        [margin, margin, width - margin, height - margin],
        radius=int(width * 0.08),
        outline=(224, 216, 204, 140),
        width=int(width * 0.008)
    )
    return img, overlay

def export_webp(img, overlay, filename):
    final = Image.alpha_composite(img, overlay).convert("RGB")
    tmp_png = f"/tmp/{filename}.png"
    out_webp = os.path.join(OUT_DIR, filename)
    final.save(tmp_png, "PNG")
    subprocess.run(["cwebp", "-q", "84", "-m", "6", tmp_png, "-o", out_webp], check=True, stdout=subprocess.DEVNULL)
    if os.path.exists(tmp_png):
        os.remove(tmp_png)
    size_kb = os.path.getsize(out_webp) / 1024
    print(f"Exported {filename}: {size_kb:.1f} KB")

# ----------------- 24 Support Choice Spots (E1 - E24) -----------------

# E1: Autism Headphones (over-ear noise reduction)
def draw_e1(d, c):
    # Headband
    d.arc([160, 130, 352, 320], start=180, end=0, fill=INK, width=9)
    d.arc([162, 132, 350, 320], start=180, end=0, fill=c[0], width=5)
    # Earcups
    d.rounded_rectangle([134, 220, 186, 330], radius=22, fill=(*c[1], 230), outline=INK, width=6)
    d.rounded_rectangle([144, 236, 176, 314], radius=14, fill=(*c[2], 180), outline=INK, width=3)
    d.rounded_rectangle([326, 220, 378, 330], radius=22, fill=(*c[1], 230), outline=INK, width=6)
    d.rounded_rectangle([336, 236, 368, 314], radius=14, fill=(*c[2], 180), outline=INK, width=3)
    # Calming sound reduction waves
    d.arc([80, 240, 120, 310], start=110, end=250, fill=(*c[0], 160), width=5)
    d.arc([392, 240, 432, 310], start=-70, end=70, fill=(*c[0], 160), width=5)

# E2: Autism Visual Calm / Declutter (TIDY DESK, NOT A LAMPSHADE!)
def draw_e2(d, c):
    # Wooden desk top surface
    d.rounded_rectangle([110, 320, 402, 370], radius=10, fill=WOOD, outline=INK, width=6)
    d.line([120, 345, 392, 345], fill=WOOD_DARK, width=2)
    # Closed neat notebook
    d.rounded_rectangle([150, 230, 290, 320], radius=8, fill=(*c[1], 240), outline=INK, width=6)
    d.rounded_rectangle([160, 240, 280, 310], radius=4, fill=(255, 255, 255, 200), outline=INK, width=3)
    # Bookmark ribbon hanging down
    d.polygon([(215, 310), (225, 310), (225, 335), (220, 330), (215, 335)], fill=(234, 88, 12), outline=INK)
    # Sharpened wooden pencil neatly aligned
    d.polygon([(310, 255), (322, 255), (322, 318), (310, 318)], fill=AMBER_WARM, outline=INK)
    d.polygon([(310, 255), (322, 255), (316, 235)], fill=(240, 210, 170), outline=INK)
    d.polygon([(314, 240), (318, 240), (316, 235)], fill=INK)
    # Small potted green plant (succulent)
    d.polygon([(340, 285), (380, 285), (372, 320), (348, 320)], fill=(194, 65, 12), outline=INK) # terracotta pot
    d.ellipse([342, 250, 362, 285], fill=(34, 197, 94), outline=INK, width=3) # leaf 1
    d.ellipse([358, 245, 378, 285], fill=(22, 163, 74), outline=INK, width=3) # leaf 2
    d.ellipse([350, 235, 370, 275], fill=(74, 222, 128), outline=INK, width=3) # leaf 3

# E3: Autism Sanctuary / Quiet Corner (Cozy cushions & warm blanket nook)
def draw_e3(d, c):
    # Floor base
    d.line([120, 370, 392, 370], fill=INK_LIGHT, width=4)
    # Bottom large floor cushion
    d.rounded_rectangle([140, 305, 372, 368], radius=24, fill=(*c[0], 220), outline=INK, width=6)
    # Top stacked soft pillow
    d.rounded_rectangle([170, 245, 342, 305], radius=20, fill=(*c[1], 240), outline=INK, width=6)
    # Pillow tufting / creases
    d.ellipse([251, 270, 261, 280], fill=INK)
    d.line([235, 275, 251, 275], fill=INK, width=3)
    d.line([261, 275, 277, 275], fill=INK, width=3)
    # Draped soft throw blanket
    d.arc([200, 290, 312, 360], start=30, end=150, fill=AMBER_WARM, width=8)
    # Warm glowing stars / fairy lights in the sanctuary
    for sx, sy in [(160, 170), (256, 140), (350, 180)]:
        d.ellipse([sx - 12, sy - 12, sx + 12, sy + 12], fill=(254, 240, 138, 140))
        d.line([sx - 8, sy, sx + 8, sy], fill=AMBER_WARM, width=4)
        d.line([sx, sy - 8, sx, sy + 8], fill=AMBER_WARM, width=4)

# E4: ADHD Checklist
def draw_e4(d, c):
    # Wooden clipboard
    d.rounded_rectangle([160, 130, 352, 375], radius=18, fill=WOOD, outline=INK, width=6)
    # White paper sheet
    d.rounded_rectangle([176, 160, 336, 360], radius=10, fill=(255, 255, 255, 240), outline=INK, width=4)
    # Top clip
    d.rounded_rectangle([216, 115, 296, 150], radius=8, fill=(100, 116, 139), outline=INK, width=4)
    # 3 Check rows with green ticks
    for y in [200, 255, 310]:
        # Circle / box
        d.rounded_rectangle([195, y - 12, 222, y + 15], radius=6, fill=(240, 253, 244), outline=INK, width=3)
        # Bold green tick
        d.line([200, y + 1, 207, y + 9], fill=GREEN_TICK, width=5)
        d.line([207, y + 9, 218, y - 6], fill=GREEN_TICK, width=5)
        # Task text line
        d.line([236, y + 2, 318, y + 2], fill=INK_LIGHT, width=5)

# E5: ADHD Focus Shield
def draw_e5(d, c):
    # Shield body
    d.polygon([(256, 130), (360, 170), (340, 290), (256, 370), (172, 290), (152, 170)], fill=(*c[1], 230), outline=INK)
    d.polygon([(256, 148), (344, 182), (326, 282), (256, 350), (186, 282), (168, 182)], fill=(*c[0], 210), outline=INK)
    # Central focus star / heart
    d.ellipse([236, 220, 276, 260], fill=(255, 255, 255), outline=INK, width=4)
    d.ellipse([248, 232, 264, 248], fill=AMBER_WARM)

# E6: ADHD Chunking / Timer
def draw_e6(d, c):
    # Hourglass frame
    d.rounded_rectangle([180, 130, 332, 155], radius=6, fill=WOOD, outline=INK, width=6)
    d.rounded_rectangle([180, 355, 332, 380], radius=6, fill=WOOD, outline=INK, width=6)
    # Glass bulbs
    d.polygon([(196, 155), (316, 155), (266, 255), (246, 255)], fill=(255, 255, 255, 180), outline=INK)
    d.polygon([(246, 255), (266, 255), (316, 355), (196, 355)], fill=(255, 255, 255, 180), outline=INK)
    # Sand chunks
    d.polygon([(220, 190), (292, 190), (256, 250)], fill=AMBER_WARM)
    d.polygon([(216, 355), (296, 355), (256, 310)], fill=AMBER_WARM)
    d.line([256, 250, 256, 310], fill=AMBER_WARM, width=4)

# E7: Dyslexia Audio / Read Aloud
def draw_e7(d, c):
    # Open storybook
    d.polygon([(140, 280), (256, 305), (256, 220), (140, 195)], fill=(255, 255, 255, 240), outline=INK)
    d.polygon([(372, 280), (256, 305), (256, 220), (372, 195)], fill=(245, 245, 245, 240), outline=INK)
    # Headphone arch over book
    d.arc([160, 110, 352, 280], start=180, end=0, fill=INK, width=8)
    d.rounded_rectangle([140, 180, 175, 245], radius=14, fill=(*c[1], 230), outline=INK, width=5)
    d.rounded_rectangle([337, 180, 372, 245], radius=14, fill=(*c[1], 230), outline=INK, width=5)
    # Floating audio speech note
    d.ellipse([270, 150, 288, 168], fill=(*c[0], 230), outline=INK, width=3)
    d.line([288, 159, 288, 130], fill=INK, width=4)

# E8: Dyslexia Reading Ruler
def draw_e8(d, c):
    # Paragraph lines of text
    for y in [180, 215, 250, 285, 320]:
        d.line([160, y, 352, y], fill=(210, 210, 210), width=6)
    # Highlight reading tracking ruler
    d.rounded_rectangle([140, 235, 372, 265], radius=6, fill=(254, 240, 138, 210), outline=AMBER_WARM, width=4)
    # Sharp focused line inside ruler
    d.line([160, 250, 352, 250], fill=INK, width=7)

# E9: Dyslexia Letter Spacing
def draw_e9(d, c):
    # 3 wooden letter blocks with generous spacing
    for i, (bx, letter) in enumerate([(150, "A"), (256, "B"), (362, "C")]):
        d.rounded_rectangle([bx - 32, 210, bx + 32, 274], radius=10, fill=(*c[1], 220), outline=INK, width=5)
        # Letter shape
        d.ellipse([bx - 10, 232, bx + 10, 252], fill=(255, 255, 255), outline=INK, width=3)
    # Spacing bidirectional arrows between them
    d.line([190, 242, 218, 242], fill=INK, width=4)
    d.line([294, 242, 322, 242], fill=INK, width=4)
    # Extension tick
    d.line([204, 236, 204, 248], fill=INK, width=4)
    d.line([308, 236, 308, 248], fill=INK, width=4)

# E10: Speech AAC Tablet
def draw_e10(d, c):
    # Tablet body
    d.rounded_rectangle([150, 150, 362, 362], radius=18, fill=(245, 245, 245), outline=INK, width=6)
    d.rounded_rectangle([165, 165, 347, 347], radius=10, fill=(255, 255, 255), outline=INK, width=3)
    # 4 Grid communication symbol tiles
    tiles = [
        ((180, 180, 240, 240), (*c[1], 220)),
        ((272, 180, 332, 240), (254, 240, 138)),
        ((180, 272, 240, 332), (187, 247, 208)),
        ((272, 272, 332, 332), (*c[0], 220))
    ]
    for (box, col) in tiles:
        d.rounded_rectangle(box, radius=8, fill=col, outline=INK, width=3)
    # Smiley face in tile 1
    d.arc([195, 195, 225, 225], start=0, end=180, fill=INK, width=3)
    # Heart in tile 4
    d.ellipse([290, 290, 314, 314], fill=(234, 88, 12))

# E11: Speech Agency / Voice Choice
def draw_e11(d, c):
    # Left speech bubble
    d.rounded_rectangle([140, 170, 260, 240], radius=16, fill=(*c[1], 220), outline=INK, width=5)
    d.polygon([(160, 240), (180, 240), (150, 265)], fill=(*c[1], 220), outline=INK)
    # Right speech bubble (response / confirmation)
    d.rounded_rectangle([252, 240, 372, 310], radius=16, fill=(*c[0], 220), outline=INK, width=5)
    d.polygon([(340, 310), (360, 310), (365, 335)], fill=(*c[0], 220), outline=INK)
    # Checkmark inside right bubble
    d.line([290, 275, 305, 290], fill=(255, 255, 255), width=5)
    d.line([305, 290, 335, 260], fill=(255, 255, 255), width=5)

# E12: Speech Patience / Wait Time
def draw_e12(d, c):
    # Warm clock / timer
    d.ellipse([166, 140, 346, 320], fill=(255, 255, 255), outline=INK, width=7)
    d.ellipse([180, 154, 332, 306], fill=(*c[1], 80))
    # Clock hands showing extra generous time
    d.line([256, 230, 256, 175], fill=INK, width=6)
    d.line([256, 230, 310, 230], fill=INK, width=6)
    d.ellipse([250, 224, 262, 236], fill=AMBER_WARM)
    # Warm tea cup underneath
    d.rounded_rectangle([220, 325, 292, 365], radius=10, fill=WOOD, outline=INK, width=5)
    d.line([210, 365, 302, 365], fill=INK, width=5)

# E13: Dyscalculia Wooden Unit Blocks (Manipulatives)
def draw_e13(d, c):
    # Draw isometric 3D stacked wooden unit blocks
    def draw_cube(x, y, s=50, col=WOOD):
        # Front
        d.polygon([(x, y), (x + s, y), (x + s, y + s), (x, y + s)], fill=col, outline=INK)
        # Top
        d.polygon([(x, y), (x + int(s * 0.4), y - int(s * 0.3)), (x + int(s * 1.4), y - int(s * 0.3)), (x + s, y)], fill=(col[0] + 25, col[1] + 25, col[2] + 25), outline=INK)
        # Side
        d.polygon([(x + s, y), (x + int(s * 1.4), y - int(s * 0.3)), (x + int(s * 1.4), y + int(s * 0.7)), (x + s, y + s)], fill=WOOD_DARK, outline=INK)

    # Base row (3 blocks)
    draw_cube(170, 300, 52, WOOD)
    draw_cube(230, 300, 52, WOOD)
    draw_cube(290, 300, 52, WOOD)
    # Second row (2 blocks)
    draw_cube(200, 240, 52, (*c[0],))
    draw_cube(260, 240, 52, (*c[0],))
    # Top block (1 block)
    draw_cube(230, 180, 52, (*c[1],))

# E14: Dyscalculia Number Line & Beads
def draw_e14(d, c):
    # Wooden horizontal guide wire
    d.line([130, 256, 382, 256], fill=INK, width=8)
    # 5 Colorful counting beads
    beads = [(160, (*c[0], 230)), (210, (245, 158, 11)), (260, (16, 185, 129)), (310, (234, 88, 12)), (360, (*c[2], 230))]
    for bx, bcol in beads:
        d.ellipse([bx - 18, 238, bx + 18, 274], fill=bcol, outline=INK, width=4)
        d.ellipse([bx - 6, 246, bx + 2, 254], fill=(255, 255, 255, 200)) # bead shine

# E15: Dyscalculia Stepped Scaffold Ladder
def draw_e15(d, c):
    # Stepped platforms (1, 2, 3 steps)
    d.polygon([(150, 350), (220, 350), (220, 310), (150, 310)], fill=(*c[1], 220), outline=INK)
    d.polygon([(220, 350), (290, 350), (290, 260), (220, 260)], fill=(*c[0], 220), outline=INK)
    d.polygon([(290, 350), (360, 350), (360, 200), (290, 200)], fill=(*c[2], 220), outline=INK)
    # Support guide rail / banner
    d.line([150, 290, 360, 180], fill=AMBER_WARM, width=6)
    # Star on top of step 3
    d.ellipse([345, 150, 375, 180], fill=(254, 240, 138), outline=INK, width=3)

# E16: Dysgraphia Word Bank Tray
def draw_e16(d, c):
    # Wooden tray
    d.rounded_rectangle([140, 170, 372, 342], radius=14, fill=WOOD, outline=INK, width=6)
    # 4 Rectangular word tiles
    tiles = [(160, 195, 245, 240), (265, 195, 350, 240), (160, 265, 245, 310), (265, 265, 350, 310)]
    for (x1, y1, x2, y2) in tiles:
        d.rounded_rectangle([x1, y1, x2, y2], radius=8, fill=(255, 255, 255, 240), outline=INK, width=4)
        d.line([x1 + 12, (y1 + y2) // 2, x2 - 12, (y1 + y2) // 2], fill=(*c[0], 220), width=5)

# E17: Dysgraphia Speech Dictation
def draw_e17(d, c):
    # Studio microphone
    d.rounded_rectangle([236, 150, 276, 230], radius=18, fill=(100, 116, 139), outline=INK, width=5)
    d.arc([216, 180, 296, 250], start=0, end=180, fill=INK, width=6)
    d.line([256, 250, 256, 290], fill=INK, width=6)
    d.line([226, 290, 286, 290], fill=INK, width=6)
    # Sound waves flowing into flowing paper
    d.arc([296, 170, 336, 210], start=-60, end=60, fill=(*c[0], 220), width=4)
    d.polygon([(300, 270), (370, 250), (360, 330), (290, 350)], fill=(255, 255, 255, 240), outline=INK)
    d.line([310, 290, 350, 280], fill=GREEN_TICK, width=4)

# E18: Dysgraphia Predictive Suggestion
def draw_e18(d, c):
    # Writing pencil
    d.polygon([(160, 320), (250, 230), (270, 250), (180, 340)], fill=AMBER_WARM, outline=INK)
    d.polygon([(150, 350), (160, 320), (180, 340)], fill=(240, 210, 170), outline=INK)
    # Predictive suggestion bubble hovering above
    d.rounded_rectangle([230, 140, 365, 205], radius=14, fill=(*c[0], 230), outline=INK, width=5)
    d.polygon([(260, 205), (280, 205), (265, 225)], fill=(*c[0], 230), outline=INK)
    # Glowing word prompt inside bubble
    d.line([250, 172, 345, 172], fill=(255, 255, 255), width=6)

# E19: Auditory Captions
def draw_e19(d, c):
    # Video screen
    d.rounded_rectangle([140, 160, 372, 330], radius=14, fill=(255, 255, 255, 240), outline=INK, width=6)
    # Subtitle banner bar at bottom of screen
    d.rounded_rectangle([160, 275, 352, 312], radius=8, fill=(30, 41, 59), outline=INK, width=3)
    # Clean high-contrast white text lines
    d.line([180, 293, 270, 293], fill=(255, 255, 255), width=5)
    d.line([280, 293, 332, 293], fill=(254, 240, 138), width=5)

# E20: Auditory Lapel Mic
def draw_e20(d, c):
    # Teacher shirt collar fold
    d.polygon([(170, 160), (256, 260), (342, 160)], fill=(245, 245, 245), outline=INK)
    # Clip-on lapel microphone
    d.rounded_rectangle([244, 220, 268, 270], radius=10, fill=(30, 41, 59), outline=INK, width=4)
    # Clip
    d.line([256, 240, 275, 240], fill=(148, 163, 184), width=4)
    # Sound transmission rings
    d.arc([216, 270, 296, 350], start=20, end=160, fill=(*c[0], 220), width=5)
    d.arc([196, 270, 316, 380], start=20, end=160, fill=(*c[1], 180), width=5)

# E21: Auditory Chunked Speech
def draw_e21(d, c):
    # 3 sequential speech bubbles
    bubbles = [
        ((160, 160, 352, 208), "1", (*c[0], 220)),
        ((180, 224, 372, 272), "2", (*c[1], 220)),
        ((160, 288, 352, 336), "3", (*c[2], 220))
    ]
    for (box, num, col) in bubbles:
        d.rounded_rectangle(box, radius=12, fill=col, outline=INK, width=4)
        d.ellipse([box[0] + 12, box[1] + 8, box[0] + 36, box[3] - 8], fill=(255, 255, 255), outline=INK, width=2)
        d.line([box[0] + 50, (box[1] + box[3]) // 2, box[2] - 20, (box[1] + box[3]) // 2], fill=(255, 255, 255), width=5)

# E22: Executive Now / Next / Later Board (NNL)
def draw_e22(d, c):
    # Three column board
    cols = [
        (140, 180, 210, 340, (220, 252, 231), GREEN_TICK),   # Now (green)
        (220, 180, 290, 340, (254, 243, 199), AMBER_WARM),   # Next (amber)
        (300, 180, 370, 340, (224, 242, 254), (59, 130, 246))# Later (blue)
    ]
    for x1, y1, x2, y2, bg, border in cols:
        d.rounded_rectangle([x1, y1, x2, y2], radius=10, fill=bg, outline=border, width=4)
        # Header tab
        d.rounded_rectangle([x1 + 6, y1 + 8, x2 - 6, y1 + 24], radius=4, fill=border)
        # 2 Task cards in each
        d.rounded_rectangle([x1 + 8, y1 + 35, x2 - 8, y1 + 70], radius=6, fill=(255, 255, 255), outline=INK, width=2)
        d.rounded_rectangle([x1 + 8, y1 + 80, x2 - 8, y1 + 115], radius=6, fill=(255, 255, 255), outline=INK, width=2)

# E23: Executive Roadmap
def draw_e23(d, c):
    # Winding path
    d.arc([140, 160, 320, 300], start=160, end=350, fill=WOOD, width=24)
    d.arc([220, 220, 380, 360], start=0, end=190, fill=WOOD, width=24)
    # Milestone flagposts
    d.line([190, 190, 190, 150], fill=INK, width=4)
    d.polygon([(190, 150), (220, 160), (190, 170)], fill=(234, 88, 12), outline=INK)
    d.line([330, 260, 330, 220], fill=INK, width=4)
    d.polygon([(330, 220), (360, 230), (330, 240)], fill=GREEN_TICK, outline=INK)

# E24: Executive One Step at a Time
def draw_e24(d, c):
    # Stack of faded cards behind
    d.rounded_rectangle([190, 180, 362, 330], radius=16, fill=(220, 220, 220), outline=INK_LIGHT, width=4)
    d.rounded_rectangle([175, 165, 347, 315], radius=16, fill=(240, 240, 240), outline=INK_LIGHT, width=4)
    # Front highlighted single focus card
    d.rounded_rectangle([150, 150, 322, 300], radius=16, fill=(*c[1], 230), outline=INK, width=6)
    # Bright focus indicator inside card
    d.rounded_rectangle([170, 175, 302, 220], radius=8, fill=(255, 255, 255), outline=INK, width=3)
    d.ellipse([190, 197, 206, 213], fill=GREEN_TICK)
    d.line([220, 205, 280, 205], fill=INK, width=5)

# ----------------- 3 Landing Steps (F1 - F3) -----------------

# F1: Choose Experience (Compass & Map)
def draw_f1(d, c):
    # Map parchment
    d.polygon([(140, 180), (350, 150), (370, 330), (160, 360)], fill=(255, 255, 255, 240), outline=INK)
    # Compass ring
    d.ellipse([216, 216, 296, 296], fill=(254, 243, 199), outline=INK, width=6)
    # Compass needle
    d.polygon([(256, 226), (266, 256), (256, 286), (246, 256)], fill=(234, 88, 12), outline=INK)

# F2: Try Accommodations (Artisan Toolbox)
def draw_f2(d, c):
    # Wooden toolbox body
    d.rounded_rectangle([150, 220, 362, 340], radius=12, fill=WOOD, outline=INK, width=6)
    d.rounded_rectangle([190, 160, 322, 220], radius=8, fill=(0, 0, 0, 0), outline=INK, width=6) # handle
    # Tool handles sticking out
    d.line([180, 190, 200, 230], fill=AMBER_WARM, width=10) # ruler
    d.polygon([(300, 180), (320, 180), (310, 230)], fill=(16, 185, 129), outline=INK) # chisel

# F3: Understand & Act (Lightbulb in Caring Hands)
def draw_f3(d, c):
    # Glowing lightbulb
    d.ellipse([220, 150, 292, 222], fill=(254, 240, 138), outline=INK, width=5)
    d.rounded_rectangle([236, 215, 276, 240], radius=4, fill=(148, 163, 184), outline=INK, width=4)
    # Caring hands cupping base
    d.arc([160, 230, 256, 330], start=20, end=150, fill=INK, width=7)
    d.arc([256, 230, 352, 330], start=30, end=160, fill=INK, width=7)

# ----------------- 5 Dyslexia Sub-labs (F5 - F9) -----------------

# F5: Dyslexia Scramble
def draw_f5(d, c):
    # Shifting letter blocks
    d.rounded_rectangle([160, 180, 230, 250], radius=10, fill=(*c[1], 230), outline=INK, width=5)
    d.rounded_rectangle([270, 220, 340, 290], radius=10, fill=(*c[0], 230), outline=INK, width=5)
    # Motion arcs
    d.arc([220, 160, 280, 220], start=180, end=340, fill=INK, width=4)

# F6: Dyslexia Mirror (b and d)
def draw_f6(d, c):
    # Vertical soft dotted mirror line
    for y in range(160, 340, 20):
        d.line([256, y, 256, y + 10], fill=INK_LIGHT, width=4)
    # Letter 'b' on left
    d.line([190, 180, 190, 300], fill=INK, width=7)
    d.ellipse([190, 235, 235, 300], fill=(*c[1], 180), outline=INK, width=6)
    # Reflected 'd' on right
    d.line([322, 180, 322, 300], fill=INK, width=7)
    d.ellipse([277, 235, 322, 300], fill=(*c[0], 180), outline=INK, width=6)

# F7: Dyslexia Blur
def draw_f7(d, c):
    # Text lines
    for y in [180, 220, 260, 300]:
        d.line([160, y, 352, y], fill=INK, width=6)
    # Watercolor mist blur over center
    d.ellipse([200, 190, 312, 290], fill=(255, 255, 255, 210))

# F8: Dyslexia Crowding
def draw_f8(d, c):
    # Tight overlapping letters
    for x in [220, 240, 260, 280]:
        d.line([x, 200, x, 280], fill=INK, width=7)
    # Outward expansion arrows
    d.line([170, 240, 200, 240], fill=(234, 88, 12), width=5)
    d.line([310, 240, 340, 240], fill=(234, 88, 12), width=5)

# F9: Dyslexia Floating
def draw_f9(d, c):
    # Floating letter leaves drifting
    d.ellipse([170, 260, 210, 300], fill=(*c[1], 220), outline=INK, width=4)
    d.ellipse([240, 190, 280, 230], fill=(*c[0], 220), outline=INK, width=4)
    d.ellipse([310, 230, 350, 270], fill=(*c[2], 220), outline=INK, width=4)
    # Breeze wave line
    d.arc([150, 180, 350, 320], start=140, end=320, fill=AMBER_WARM, width=4)


# Map of all spot assets to generate
ALL_SPOTS = [
    # Support Spots (24)
    ("itw-autism-support-headphones.webp", "autism", draw_e1),
    ("itw-autism-support-declutter.webp", "autism", draw_e2),
    ("itw-autism-support-sanctuary.webp", "autism", draw_e3),
    ("itw-adhd-support-checklist.webp", "adhd", draw_e4),
    ("itw-adhd-support-focus-shield.webp", "adhd", draw_e5),
    ("itw-adhd-support-chunking.webp", "adhd", draw_e6),
    ("itw-dyslexia-support-audio.webp", "dyslexia", draw_e7),
    ("itw-dyslexia-support-ruler.webp", "dyslexia", draw_e8),
    ("itw-dyslexia-support-spacing.webp", "dyslexia", draw_e9),
    ("itw-speech-support-aac.webp", "speech", draw_e10),
    ("itw-speech-support-agency.webp", "speech", draw_e11),
    ("itw-speech-support-patience.webp", "speech", draw_e12),
    ("itw-dyscalc-support-blocks.webp", "dyscalc", draw_e13),
    ("itw-dyscalc-support-numberline.webp", "dyscalc", draw_e14),
    ("itw-dyscalc-support-scaffold.webp", "dyscalc", draw_e15),
    ("itw-dysgraph-support-wordbank.webp", "dysgraph", draw_e16),
    ("itw-dysgraph-support-dictation.webp", "dysgraph", draw_e17),
    ("itw-dysgraph-support-predictive.webp", "dysgraph", draw_e18),
    ("itw-auditory-support-captions.webp", "auditory", draw_e19),
    ("itw-auditory-support-mic.webp", "auditory", draw_e20),
    ("itw-auditory-support-chunking.webp", "auditory", draw_e21),
    ("itw-exec-support-nnl.webp", "exec", draw_e22),
    ("itw-exec-support-roadmap.webp", "exec", draw_e23),
    ("itw-exec-support-onestep.webp", "exec", draw_e24),

    # Landing steps (3)
    ("itw-landing-how-choose.webp", "landing", draw_f1),
    ("itw-landing-how-try.webp", "landing", draw_f2),
    ("itw-landing-how-understand.webp", "landing", draw_f3),

    # Dyslexia labs (5)
    ("itw-dyslexia-lab-scramble.webp", "dyslexia", draw_f5),
    ("itw-dyslexia-lab-mirror.webp", "dyslexia", draw_f6),
    ("itw-dyslexia-lab-blur.webp", "dyslexia", draw_f7),
    ("itw-dyslexia-lab-crowding.webp", "dyslexia", draw_f8),
    ("itw-dyslexia-lab-floating.webp", "dyslexia", draw_f9),
]

def main():
    print(f"Generating {len(ALL_SPOTS)} authentic watercolor spot illustrations...")
    for filename, pal_key, draw_fn in ALL_SPOTS:
        pal = PALETTES[pal_key]
        canvas, overlay = create_watercolor_canvas(wash_colors=pal)
        d = ImageDraw.Draw(canvas)
        draw_fn(d, pal)
        export_webp(canvas, overlay, filename)
    print("All 32 spot illustrations successfully generated!")

if __name__ == "__main__":
    main()
