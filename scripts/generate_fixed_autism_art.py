import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

DEST_DIR = "/Users/ananyasridhar/work/vaakbot/web/public/quests/autism"
SCRATCH_DIR = "/Users/ananyasridhar/work/vaakbot/scripts/scratch_autism"
os.makedirs(SCRATCH_DIR, exist_ok=True)

S = 2048

# -------------------------------------------------------------
# PART 2: THREE ARTISAN VESSELS (SHARED SILHOUETTE & METRICS)
# -------------------------------------------------------------
def generate_vessels():
    # Y-shift: shift up by 68px at 2048 to center vertical centroid at 256.0 at 512
    Y_OFF = -68
    
    # Common Silhouette Mask
    mask_im = Image.new("L", (S, S), 0)
    d_mask = ImageDraw.Draw(mask_im)
    
    # 1. Contact shadow attached to base
    d_mask.ellipse([640, 1530 + Y_OFF, 1408, 1650 + Y_OFF], fill=255)
    
    # 2. Foot / base pedestal
    d_mask.polygon([(860, 1570 + Y_OFF), (1188, 1570 + Y_OFF), (1148, 1460 + Y_OFF), (900, 1460 + Y_OFF)], fill=255)
    d_mask.ellipse([860, 1540 + Y_OFF, 1188, 1600 + Y_OFF], fill=255)
    
    # 3. Belly
    d_mask.ellipse([544, 780 + Y_OFF, 1504, 1520 + Y_OFF], fill=255)
    
    # 4. Neck & Shoulder transition
    d_mask.polygon([(870, 610 + Y_OFF), (1178, 610 + Y_OFF), (1240, 880 + Y_OFF), (808, 880 + Y_OFF)], fill=255)
    
    # 5. Rim / Lip
    d_mask.ellipse([784, 550 + Y_OFF, 1264, 640 + Y_OFF], fill=255)
    
    # 6. Handles (Outer loops)
    d_mask.ellipse([340, 720 + Y_OFF, 920, 1260 + Y_OFF], fill=255)
    d_mask.ellipse([1128, 720 + Y_OFF, 1708, 1260 + Y_OFF], fill=255)
    
    # Cut out inner handle holes
    d_mask.ellipse([500, 820 + Y_OFF, 840, 1160 + Y_OFF], fill=0)
    d_mask.ellipse([1208, 820 + Y_OFF, 1548, 1160 + Y_OFF], fill=0)
    
    # Re-fill belly & neck center
    d_mask.ellipse([544, 780 + Y_OFF, 1504, 1520 + Y_OFF], fill=255)
    d_mask.polygon([(870, 610 + Y_OFF), (1178, 610 + Y_OFF), (1240, 880 + Y_OFF), (808, 880 + Y_OFF)], fill=255)
    d_mask.ellipse([784, 550 + Y_OFF, 1264, 640 + Y_OFF], fill=255)
    
    styles = {
        "veranda": {
            "name": "Veranda Terracotta Urn",
            "body_base": (195, 96, 48),
            "body_light": (224, 128, 76),
            "body_dark": (150, 68, 30),
            "rim_color": (168, 78, 36),
            "handle_color": (178, 84, 38),
            "outline": (90, 38, 16),
            "pattern_color": (250, 225, 190),
            "pattern_type": "stripes"
        },
        "lotus": {
            "name": "Lotus Bloom Urn",
            "body_base": (198, 115, 130),
            "body_light": (222, 142, 156),
            "body_dark": (158, 82, 96),
            "rim_color": (168, 90, 105),
            "handle_color": (178, 100, 115),
            "outline": (92, 40, 50),
            "pattern_color": (252, 230, 235),
            "pattern_type": "leaf"
        },
        "emerald": {
            "name": "Emerald Glaze Urn",
            "body_base": (48, 142, 112),
            "body_light": (72, 172, 140),
            "body_dark": (32, 105, 80),
            "rim_color": (36, 116, 90),
            "handle_color": (40, 125, 98),
            "outline": (16, 58, 44),
            "pattern_color": (200, 248, 228),
            "pattern_type": "dots"
        }
    }
    
    results = {}
    for key, sty in styles.items():
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        
        # Soft attached contact shadow
        shadow_mask = Image.new("L", (S, S), 0)
        sd = ImageDraw.Draw(shadow_mask)
        sd.ellipse([640, 1530 + Y_OFF, 1408, 1650 + Y_OFF], fill=140)
        shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(16))
        shadow_layer = Image.new("RGBA", (S, S), (20, 25, 30, 0))
        shadow_layer.putalpha(shadow_mask)
        im = Image.alpha_composite(im, shadow_layer)
        d = ImageDraw.Draw(im)
        
        # Handles
        d.ellipse([340, 720 + Y_OFF, 920, 1260 + Y_OFF], fill=sty["handle_color"], outline=sty["outline"], width=24)
        d.ellipse([1128, 720 + Y_OFF, 1708, 1260 + Y_OFF], fill=sty["handle_color"], outline=sty["outline"], width=24)
        d.ellipse([500, 820 + Y_OFF, 840, 1160 + Y_OFF], fill=(0, 0, 0, 0))
        d.ellipse([1208, 820 + Y_OFF, 1548, 1160 + Y_OFF], fill=(0, 0, 0, 0))
        d.ellipse([500, 820 + Y_OFF, 840, 1160 + Y_OFF], outline=sty["outline"], width=24)
        d.ellipse([1208, 820 + Y_OFF, 1548, 1160 + Y_OFF], outline=sty["outline"], width=24)
        
        # Pedestal Foot
        d.polygon([(860, 1570 + Y_OFF), (1188, 1570 + Y_OFF), (1148, 1460 + Y_OFF), (900, 1460 + Y_OFF)], fill=sty["body_dark"], outline=sty["outline"], width=24)
        d.ellipse([860, 1540 + Y_OFF, 1188, 1600 + Y_OFF], fill=sty["body_dark"], outline=sty["outline"], width=24)
        
        # Belly Body
        d.ellipse([544, 780 + Y_OFF, 1504, 1520 + Y_OFF], fill=sty["body_base"], outline=sty["outline"], width=24)
        
        # Soft gouache volume shading on belly
        hl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        dhl = ImageDraw.Draw(hl)
        dhl.ellipse([620, 840 + Y_OFF, 1180, 1440 + Y_OFF], fill=sty["body_light"] + (140,))
        hl = hl.filter(ImageFilter.GaussianBlur(32))
        im = Image.alpha_composite(im, hl)
        d = ImageDraw.Draw(im)
        
        # Neck & Shoulder
        d.polygon([(870, 610 + Y_OFF), (1178, 610 + Y_OFF), (1240, 880 + Y_OFF), (808, 880 + Y_OFF)], fill=sty["body_base"], outline=sty["outline"], width=24)
        
        # Rim
        d.ellipse([784, 550 + Y_OFF, 1264, 640 + Y_OFF], fill=sty["rim_color"], outline=sty["outline"], width=24)
        d.ellipse([830, 565 + Y_OFF, 1218, 625 + Y_OFF], fill=sty["body_dark"], outline=sty["outline"], width=16)
        
        # Abstract Pattern Band
        pt = sty["pattern_type"]
        pc = sty["pattern_color"]
        band_y = 1120 + Y_OFF
        if pt == "stripes":
            d.line([(640, band_y - 50), (1408, band_y - 50)], fill=pc, width=16)
            d.line([(610, band_y), (1438, band_y)], fill=pc, width=22)
            d.line([(640, band_y + 50), (1408, band_y + 50)], fill=pc, width=16)
        elif pt == "leaf":
            d.line([(610, band_y), (1438, band_y)], fill=pc, width=18)
            for x in range(670, 1380, 60):
                d.polygon([(x, band_y), (x - 16, band_y - 45), (x, band_y - 65), (x + 16, band_y - 45)], fill=pc)
                d.polygon([(x + 30, band_y), (x + 14, band_y + 45), (x + 30, band_y + 65), (x + 46, band_y + 45)], fill=pc)
        elif pt == "dots":
            d.line([(610, band_y), (1438, band_y)], fill=pc, width=18)
            for x in range(660, 1390, 55):
                d.ellipse([x - 18, band_y - 18, x + 18, band_y + 18], fill=sty["outline"])
                d.ellipse([x - 12, band_y - 12, x + 12, band_y + 12], fill=pc)
        
        # Apply crisp master mask
        im_rgba = np.array(im)
        mask_arr = np.array(mask_im)
        im_rgba[..., 3] = np.minimum(im_rgba[..., 3], mask_arr)
        im = Image.fromarray(im_rgba, "RGBA")
        
        # Resize to 512x512
        im_512 = im.resize((512, 512), Image.Resampling.LANCZOS)
        results[key] = im_512

    # Luminance calibration across vessels (target 110.0)
    calibrated = {}
    TARGET_LUM = 110.0
    for key, im in results.items():
        arr = np.array(im).astype(np.float64)
        rgb = arr[..., :3]
        alpha = arr[..., 3]
        mask = alpha > 10
        current_lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
        mean_lum = float(np.mean(current_lum[mask]))
        factor = TARGET_LUM / mean_lum
        new_rgb = np.clip(rgb * factor, 0, 255)
        arr[..., :3] = new_rgb
        calibrated[key] = Image.fromarray(arr.astype(np.uint8), "RGBA")

    return calibrated

# -------------------------------------------------------------
# PART 1: SIX FOX CUB EMOTION FACES (SHARED BASE & HIGH-READABILITY)
# -------------------------------------------------------------
def generate_fox_faces():
    emotions = ["happy", "calm", "sad", "angry", "scared", "surprised"]
    results = {}
    
    # Common palette
    FUR_MAIN = (222, 92, 30)       # Storybook warm fox orange
    FUR_OUTLINE = (136, 44, 10)    # Deep warm outline
    FUR_INNER_EAR = (255, 222, 202) # Peach inner ear
    MUZZLE_FILL = (255, 252, 245)  # Clean ivory-white muzzle
    MUZZLE_OUTLINE = (150, 56, 16) # Muzzle edge
    NOSE_FILL = (32, 18, 10)       # Dark charcoal nose
    EYE_DARK = (28, 16, 8)         # Dark chocolate eye/pupil
    BROW_DARK = (28, 16, 8)        # Dark brown brow
    CARD_FILL = (255, 248, 235)    # Warm soft cream card circle
    CARD_BORDER = (226, 198, 160)  # Gentle border
    
    for emo in emotions:
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        
        # 1. Background Card Disk (Identical across all 6)
        d.ellipse([184, 184, 1864, 1864], fill=CARD_FILL, outline=CARD_BORDER, width=24)
        
        # 2. Ears (Base coordinates identical at head junction, posture tailored to emotion)
        # Left ear base: (620, 680) to (760, 560)
        # Right ear base: (1288, 560) to (1428, 680)
        if emo in ["happy", "calm"]:
            # Neutral perky ears
            l_ear = [(620, 680), (560, 320), (760, 560)]
            l_inner = [(640, 650), (590, 380), (740, 570)]
            r_ear = [(1428, 680), (1488, 320), (1288, 560)]
            r_inner = [(1408, 650), (1458, 380), (1308, 570)]
        elif emo == "sad":
            # Drooping ears (angled outward & down)
            l_ear = [(620, 680), (410, 540), (760, 560)]
            l_inner = [(630, 650), (460, 550), (730, 570)]
            r_ear = [(1428, 680), (1638, 540), (1288, 560)]
            r_inner = [(1418, 650), (1588, 550), (1318, 570)]
        elif emo == "angry":
            # Pushed back ears (angled sideways)
            l_ear = [(620, 680), (400, 640), (760, 560)]
            l_inner = [(630, 660), (450, 640), (730, 580)]
            r_ear = [(1428, 680), (1648, 640), (1288, 560)]
            r_inner = [(1418, 660), (1598, 640), (1318, 580)]
        elif emo == "scared":
            # Flat back ears (low against head)
            l_ear = [(620, 680), (460, 740), (760, 560)]
            l_inner = [(640, 680), (510, 720), (730, 590)]
            r_ear = [(1428, 680), (1588, 740), (1288, 560)]
            r_inner = [(1408, 680), (1538, 720), (1318, 590)]
        elif emo == "surprised":
            # Straight up tall alert ears
            l_ear = [(620, 680), (680, 210), (760, 560)]
            l_inner = [(640, 650), (690, 280), (740, 570)]
            r_ear = [(1428, 680), (1368, 210), (1288, 560)]
            r_inner = [(1408, 650), (1358, 280), (1308, 570)]
        
        # Draw outer ears
        d.polygon(l_ear, fill=FUR_MAIN, outline=FUR_OUTLINE)
        d.line([l_ear[0], l_ear[1], l_ear[2]], fill=FUR_OUTLINE, width=28)
        d.polygon(l_inner, fill=FUR_INNER_EAR)
        
        d.polygon(r_ear, fill=FUR_MAIN, outline=FUR_OUTLINE)
        d.line([r_ear[0], r_ear[1], r_ear[2]], fill=FUR_OUTLINE, width=28)
        d.polygon(r_inner, fill=FUR_INNER_EAR)
        
        # 3. Head & Cheek Tufts (Identical on all 6)
        # Main head oval
        d.ellipse([480, 560, 1568, 1460], fill=FUR_MAIN, outline=FUR_OUTLINE, width=28)
        # Fluffy cheek tufts
        l_tuft = [(520, 1000), (370, 1130), (520, 1220)]
        r_tuft = [(1528, 1000), (1678, 1130), (1528, 1220)]
        d.polygon(l_tuft, fill=FUR_MAIN, outline=FUR_OUTLINE)
        d.line([l_tuft[0], l_tuft[1], l_tuft[2]], fill=FUR_OUTLINE, width=28)
        d.polygon(r_tuft, fill=FUR_MAIN, outline=FUR_OUTLINE)
        d.line([r_tuft[0], r_tuft[1], r_tuft[2]], fill=FUR_OUTLINE, width=28)
        # Re-fill head interior to seal tuft join
        d.ellipse([500, 580, 1548, 1440], fill=FUR_MAIN)
        
        # 4. White Chest Ruff (Strictly low at base, y >= 1520, clear of mouth!)
        d.polygon([(820, 1520), (1024, 1680), (1228, 1520)], fill=(255, 255, 255), outline=FUR_OUTLINE, width=16)
        
        # 5. Prominent Ivory Muzzle (Cheeks meeting under nose, covers y=1040 to 1420)
        # Sits clearly above chest ruff!
        muzzle_pts = [
            (1024, 1060), # Top center at nose
            (760, 1100), (580, 1200), (640, 1340), (840, 1430),
            (1024, 1450), # Bottom center
            (1208, 1430), (1408, 1340), (1468, 1200), (1288, 1100)
        ]
        d.polygon(muzzle_pts, fill=MUZZLE_FILL, outline=MUZZLE_OUTLINE)
        d.line(muzzle_pts + [muzzle_pts[0]], fill=FUR_OUTLINE, width=22)
        
        # 6. Button Nose (Identical across all 6)
        d.polygon([(954, 1070), (1094, 1070), (1024, 1130)], fill=NOSE_FILL)
        d.ellipse([954, 1055, 1094, 1085], fill=NOSE_FILL)
        d.ellipse([980, 1060, 1005, 1072], fill=(255, 255, 255, 200)) # subtle nose highlight
        
        # 7. Expressive Features (Eyes, Brows, Mouth, Accents)
        LX, RX = 780, 1268
        EYE_Y = 880
        
        if emo == "happy":
            # Eyes: big open round eyes
            d.ellipse([LX - 95, EYE_Y - 110, LX + 95, EYE_Y + 110], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([RX - 95, EYE_Y - 110, RX + 95, EYE_Y + 110], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            # Big pupil
            d.ellipse([LX - 75, EYE_Y - 85, LX + 75, EYE_Y + 85], fill=EYE_DARK)
            d.ellipse([RX - 75, EYE_Y - 85, RX + 75, EYE_Y + 85], fill=EYE_DARK)
            # Highlights
            d.ellipse([LX + 15, EYE_Y - 60, LX + 55, EYE_Y - 20], fill=(255, 255, 255))
            d.ellipse([LX - 35, EYE_Y + 25, LX - 15, EYE_Y + 45], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y - 60, RX + 55, EYE_Y - 20], fill=(255, 255, 255))
            d.ellipse([RX - 35, EYE_Y + 25, RX - 15, EYE_Y + 45], fill=(255, 255, 255))
            
            # Brows: relaxed, slightly raised
            d.arc([LX - 110, 680, LX + 110, 780], start=200, end=340, fill=BROW_DARK, width=40)
            d.arc([RX - 110, 680, RX + 110, 780], start=200, end=340, fill=BROW_DARK, width=40)
            
            # Cheeks: bright raised rosy circles
            d.ellipse([640, 1120, 760, 1220], fill=(251, 146, 146, 220))
            d.ellipse([1288, 1120, 1408, 1220], fill=(251, 146, 146, 220))
            
            # Mouth: wide open smile (D-shaped)
            d.chord([830, 1180, 1218, 1400], start=0, end=180, fill=(74, 21, 13), outline=FUR_OUTLINE, width=36)
            # Tongue
            d.chord([920, 1280, 1128, 1400], start=0, end=180, fill=(251, 113, 133))
            d.line([(830, 1190), (1218, 1190)], fill=BROW_DARK, width=38)
            
        elif emo == "calm":
            # Eyes: half-closed with soft lids
            # White base
            d.ellipse([LX - 90, EYE_Y - 80, LX + 90, EYE_Y + 80], fill=(255, 255, 255), outline=EYE_DARK, width=20)
            d.ellipse([RX - 90, EYE_Y - 80, RX + 90, EYE_Y + 80], fill=(255, 255, 255), outline=EYE_DARK, width=20)
            # Lower half pupil
            d.ellipse([LX - 65, EYE_Y - 50, LX + 65, EYE_Y + 75], fill=EYE_DARK)
            d.ellipse([RX - 65, EYE_Y - 50, RX + 65, EYE_Y + 75], fill=EYE_DARK)
            d.ellipse([LX + 15, EYE_Y - 10, LX + 40, EYE_Y + 15], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y - 10, RX + 40, EYE_Y + 15], fill=(255, 255, 255))
            # Eyelid draping over top
            d.chord([LX - 95, EYE_Y - 90, LX + 95, EYE_Y + 20], start=0, end=180, fill=FUR_MAIN, outline=EYE_DARK, width=26)
            d.chord([RX - 95, EYE_Y - 90, RX + 95, EYE_Y + 20], start=0, end=180, fill=FUR_MAIN, outline=EYE_DARK, width=26)
            
            # Brows: level and relaxed
            d.line([(LX - 95, 710), (LX + 95, 710)], fill=BROW_DARK, width=38)
            d.line([(RX - 95, 710), (RX + 95, 710)], fill=BROW_DARK, width=38)
            
            # Cheeks: soft serene peach
            d.ellipse([660, 1140, 760, 1220], fill=(254, 215, 170, 200))
            d.ellipse([1288, 1140, 1388, 1220], fill=(254, 215, 170, 200))
            
            # Mouth: small gentle closed smile
            d.arc([900, 1230, 1148, 1320], start=20, end=160, fill=BROW_DARK, width=36)
            
        elif emo == "sad":
            # Eyes: looking slightly down, droopy upper lids
            d.ellipse([LX - 90, EYE_Y - 95, LX + 90, EYE_Y + 95], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([RX - 90, EYE_Y - 95, RX + 90, EYE_Y + 95], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            # Pupils shifted downwards
            d.ellipse([LX - 65, EYE_Y - 20, LX + 65, EYE_Y + 90], fill=EYE_DARK)
            d.ellipse([RX - 65, EYE_Y - 20, RX + 65, EYE_Y + 90], fill=EYE_DARK)
            d.ellipse([LX + 15, EYE_Y + 5, LX + 40, EYE_Y + 30], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y + 5, RX + 40, EYE_Y + 30], fill=(255, 255, 255))
            
            # Brows: INNER ENDS RAISED (brows slope UP toward the middle: / \)
            # Left: outer (670, 750) -> inner (890, 630) [Slope UP toward center]
            d.line([(670, 750), (890, 630)], fill=BROW_DARK, width=42)
            # Right: inner (1158, 630) -> outer (1378, 750) [Slope DOWN from center]
            d.line([(1158, 630), (1378, 750)], fill=BROW_DARK, width=42)
            
            # Mouth: clearly turned down (prominent downturned frown arc)
            d.arc([840, 1280, 1208, 1420], start=200, end=340, fill=BROW_DARK, width=38)
            
            # One small tear (glossy blue teardrop on right cheek)
            d.polygon([(1320, 1010), (1300, 1050), (1340, 1050)], fill=(96, 165, 250))
            d.ellipse([1300, 1035, 1340, 1075], fill=(96, 165, 250), outline=(37, 99, 235), width=8)
            d.ellipse([1310, 1042, 1322, 1054], fill=(255, 255, 255))
            
        elif emo == "angry":
            # Eyes: narrowed / sharp angry slant
            d.ellipse([LX - 85, EYE_Y - 80, LX + 85, EYE_Y + 80], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            d.ellipse([RX - 85, EYE_Y - 80, RX + 85, EYE_Y + 80], fill=(255, 255, 255), outline=EYE_DARK, width=22)
            # Sharp intense pupils
            d.ellipse([LX - 55, EYE_Y - 55, LX + 55, EYE_Y + 55], fill=EYE_DARK)
            d.ellipse([RX - 55, EYE_Y - 55, RX + 55, EYE_Y + 55], fill=EYE_DARK)
            d.ellipse([LX + 10, EYE_Y - 30, LX + 30, EYE_Y - 10], fill=(255, 255, 255))
            d.ellipse([RX + 10, EYE_Y - 30, RX + 30, EYE_Y - 10], fill=(255, 255, 255))
            # Eyelids angled down sharply toward center
            d.polygon([(LX - 95, EYE_Y - 90), (LX + 95, EYE_Y - 30), (LX - 95, EYE_Y - 30)], fill=FUR_MAIN)
            d.line([(LX - 95, EYE_Y - 80), (LX + 95, EYE_Y - 20)], fill=EYE_DARK, width=26)
            d.polygon([(RX + 95, EYE_Y - 90), (RX - 95, EYE_Y - 30), (RX + 95, EYE_Y - 30)], fill=FUR_MAIN)
            d.line([(RX + 95, EYE_Y - 80), (RX - 95, EYE_Y - 20)], fill=EYE_DARK, width=26)
            
            # Brows: BROWS SLOPE DOWN TOWARD THE MIDDLE (V shape: \ /)
            # Left: outer (670, 640) -> inner (900, 760) [Slope DOWN toward center]
            d.line([(670, 640), (900, 760)], fill=BROW_DARK, width=44)
            # Right: inner (1148, 760) -> outer (1378, 640) [Slope UP from center]
            d.line([(1148, 760), (1378, 640)], fill=BROW_DARK, width=44)
            
            # Mouth: tight flat or down-turned grimace line
            d.line([(860, 1270), (1188, 1270)], fill=BROW_DARK, width=40)
            d.line([(860, 1270), (860, 1300)], fill=BROW_DARK, width=36)
            d.line([(1188, 1270), (1188, 1300)], fill=BROW_DARK, width=36)
            
        elif emo == "scared":
            # Eyes: WIDE EYES WITH SMALL PUPILS (Fear response!)
            d.ellipse([LX - 105, EYE_Y - 120, LX + 105, EYE_Y + 120], fill=(255, 255, 255), outline=EYE_DARK, width=26)
            d.ellipse([RX - 105, EYE_Y - 120, RX + 105, EYE_Y + 120], fill=(255, 255, 255), outline=EYE_DARK, width=26)
            # Small constricted dot pupils
            d.ellipse([LX - 32, EYE_Y - 32, LX + 32, EYE_Y + 32], fill=EYE_DARK)
            d.ellipse([RX - 32, EYE_Y - 32, RX + 32, EYE_Y + 32], fill=EYE_DARK)
            d.ellipse([LX + 8, EYE_Y - 18, LX + 20, EYE_Y - 6], fill=(255, 255, 255))
            d.ellipse([RX + 8, EYE_Y - 18, RX + 20, EYE_Y - 6], fill=(255, 255, 255))
            
            # Brows: raised and pulled together (inner ends up and bunched)
            d.line([(680, 630), (890, 560)], fill=BROW_DARK, width=42)
            d.line([(1158, 560), (1368, 630)], fill=BROW_DARK, width=42)
            # Center worry lines
            d.line([(960, 600), (990, 560)], fill=BROW_DARK, width=22)
            d.line([(1088, 600), (1058, 560)], fill=BROW_DARK, width=22)
            
            # Mouth: stretched wide and horizontal (tense open horizontal mouth)
            d.rounded_rectangle([800, 1230, 1248, 1320], radius=30, fill=(60, 20, 12), outline=BROW_DARK, width=36)
            
            # One small sweat drop (glossy blue droplet on temple)
            d.polygon([(640, 670), (620, 715), (660, 715)], fill=(96, 165, 250))
            d.ellipse([620, 700, 660, 740], fill=(96, 165, 250), outline=(37, 99, 235), width=8)
            d.ellipse([630, 708, 642, 720], fill=(255, 255, 255))
            
        elif emo == "surprised":
            # Eyes: WIDE EYES WITH LARGE/NORMAL PUPILS (not constricted)
            d.ellipse([LX - 105, EYE_Y - 120, LX + 105, EYE_Y + 120], fill=(255, 255, 255), outline=EYE_DARK, width=26)
            d.ellipse([RX - 105, EYE_Y - 120, RX + 105, EYE_Y + 120], fill=(255, 255, 255), outline=EYE_DARK, width=26)
            # Large round pupils
            d.ellipse([LX - 65, EYE_Y - 65, LX + 65, EYE_Y + 65], fill=EYE_DARK)
            d.ellipse([RX - 65, EYE_Y - 65, RX + 65, EYE_Y + 65], fill=EYE_DARK)
            d.ellipse([LX + 15, EYE_Y - 45, LX + 48, EYE_Y - 12], fill=(255, 255, 255))
            d.ellipse([RX + 15, EYE_Y - 45, RX + 48, EYE_Y - 12], fill=(255, 255, 255))
            
            # Brows: high and curved and FAR APART
            d.arc([LX - 110, 480, LX + 110, 640], start=200, end=340, fill=BROW_DARK, width=42)
            d.arc([RX - 110, 480, RX + 110, 640], start=200, end=340, fill=BROW_DARK, width=42)
            
            # Mouth: small round "O"
            d.ellipse([954, 1220, 1094, 1370], fill=(60, 20, 12), outline=BROW_DARK, width=38)
            
        # Resize to 512x512
        im_512 = im.resize((512, 512), Image.Resampling.LANCZOS)
        results[emo] = im_512
        
    return results

if __name__ == "__main__":
    vessels = generate_vessels()
    for k, v in vessels.items():
        v.save(f"{SCRATCH_DIR}/vessel_{k}.webp", "WEBP", quality=95)
    print("Vessels ready.")
    
    foxes = generate_fox_faces()
    for k, v in foxes.items():
        v.save(f"{SCRATCH_DIR}/fox_{k}.webp", "WEBP", quality=95)
    print("Fox faces ready.")
